<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `delegated_access`

- **Bloque:** Identidad y Seguridad (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)
- **Operaciones:** 45 (45 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 8 · MEDIO 22 · BAJO 15
- **Tablas distintas que tocan:** 56
- **Respuestas de error y detalle contractual:** `openapi/endpoints/delegated-access.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/access-requests/{id}/decision` | Aprobar/Denegar solicitud y emitir grant scoped | MEDIO | 8 | SECURITY_ADMIN |
| 2 | POST | `/affiliation-invitations/redeem` | Canjear un código o QR de afiliación | MEDIO | 39 | PRACTITIONER, SUPPORT_STAFF |
| 3 | GET | `/approvals/pending` | Aprobaciones que espera mi decisión | BAJO | 14 | PRACTITIONER, CLINICIAN |
| 4 | POST | `/authz/effective-actor/evaluate` | Evaluar actor efectivo por propósito (step-up) | MEDIO | 7 | SECURITY_ADMIN |
| 5 | GET | `/clinical/prescription-shares` | Enlaces de receta de un paciente | BAJO | 3 | PATIENT, PRACTITIONER |
| 6 | POST | `/clinical/prescription-shares` | Compartir una receta con un enlace | MEDIO | 2 | PATIENT, PRACTITIONER |
| 7 | POST | `/clinical/prescription-shares/{shareId}/revoke` | Revocar un enlace de receta | MEDIO | 2 | PATIENT, PRACTITIONER |
| 8 | GET | `/clinical/prescription-shares/by-token/{token}` | Saber si un enlace es de la sesión | BAJO | 1 | PATIENT, PRACTITIONER |
| 9 | POST | `/delegated-access/expiry-sweep` | Expirar delegaciones y grants vencidos (barrido) | MEDIO | 7 | SYSTEM, SECURITY_ADMIN |
| 10 | GET | `/delegated-permission-sets` | Listar los sets de permisos delegados del tenant | BAJO | 1 | SECURITY_ADMIN |
| 11 | POST | `/delegated-permission-sets` | Publicar set de permisos delegados (scoped) | MEDIO | 3 | SECURITY_ADMIN |
| 12 | POST | `/delegated-permission-sets/{id}/versions` | Versionar set de permisos delegados | ALTO | 4 | SECURITY_ADMIN |
| 13 | GET | `/me/practitioner/governance-panel` | Panel «Para su atención» del doctor | BAJO | 15 | PRACTITIONER, CLINICIAN |
| 14 | GET | `/me/practitioner/support-activity` | Actividad de mi equipo de apoyo | BAJO | 0 | PRACTITIONER, CLINICIAN, SUPPORT_STAFF |
| 15 | POST | `/me/practitioner/support-invitations` | Invitar a una secretaria a asistirme | MEDIO | 17 | PRACTITIONER, CLINICIAN |
| 16 | POST | `/me/practitioner/support-staff` | Crear cuenta de secretaria y vincularla de inmediato | MEDIO | 34 | PRACTITIONER, CLINICIAN |
| 17 | GET | `/me/practitioner/support-team` | Mi equipo de apoyo (secretarias) | BAJO | 12 | PRACTITIONER, CLINICIAN, SUPPORT_STAFF |
| 18 | POST | `/me/practitioner/support-team/{id}/end` | Terminar el vínculo con una secretaria | MEDIO | 13 | PRACTITIONER, CLINICIAN |
| 19 | GET | `/me/support-access` | Mi alcance: hospitales, doctores y pisos de mis vínculos activos | BAJO | 12 | SUPPORT_STAFF |
| 20 | GET | `/me/support-agenda` | Agenda de un doctor asignado (403 si no hay vínculo activo) | BAJO | 16 | SUPPORT_STAFF |
| 21 | GET | `/me/support-catalog` | Sedes, servicios, pisos y doctores de un hospital para pedir | BAJO | 9 | SUPPORT_STAFF |
| 22 | GET | `/me/support-engagements` | Mis vínculos de apoyo y mis solicitudes | BAJO | 12 | SUPPORT_STAFF |
| 23 | POST | `/me/support-engagements/{id}/confirm` | Aceptar una invitación de apoyo | MEDIO | 14 | SUPPORT_STAFF |
| 24 | POST | `/me/support-engagements/{id}/decline` | Rechazar una invitación de apoyo | MEDIO | 14 | SUPPORT_STAFF |
| 25 | POST | `/me/support-engagements/{id}/leave` | Dejar un vínculo o retirar mi pedido | MEDIO | 13 | SUPPORT_STAFF |
| 26 | POST | `/org/{tenantMembershipId}/user-assignments` | Asignar usuario de organización con alcance y vigencia | MEDIO | 3 | SECURITY_ADMIN |
| 27 | GET | `/org/affiliation-invitations` | Listar los códigos de afiliación de la organización | BAJO | 2 | sesión (sin roles) |
| 28 | POST | `/org/affiliation-invitations` | Crear un código o QR de afiliación | ALTO | 4 | sesión (sin roles) |
| 29 | POST | `/org/affiliation-invitations/{id}/revoke` | Revocar un código o QR de afiliación | ALTO | 2 | sesión (sin roles) |
| 30 | GET | `/org/support-catalog` | Sedes, servicios, pisos y doctores para invitar | BAJO | 8 | sesión (sin roles) |
| 31 | GET | `/org/support-engagement-requests` | Solicitudes e invitaciones de apoyo del hospital | BAJO | 12 | sesión (sin roles) |
| 32 | POST | `/org/support-engagement-requests/{id}/decision` | Aceptar o rechazar una solicitud de apoyo | ALTO | 14 | sesión (sin roles) |
| 33 | GET | `/org/support-engagements` | Personal de apoyo del hospital | BAJO | 12 | sesión (sin roles) |
| 34 | POST | `/org/support-engagements/{id}/end` | Terminar un vínculo de apoyo | ALTO | 13 | sesión (sin roles) |
| 35 | POST | `/org/support-staff` | Crear cuenta de secretaria y vincularla a la organización de inmediato | ALTO | 23 | sesión (sin roles) |
| 36 | POST | `/org/team/invitations` | Invitar a una secretaria a lugares o doctores | ALTO | 17 | sesión (sin roles) |
| 37 | PATCH | `/org/user-assignments/{id}` | Reasignar supervisor / suspender asignación de organización | MEDIO | 7 | SECURITY_ADMIN |
| 38 | POST | `/practitioner-delegates` | Crear asignación de delegado de practitioner | MEDIO | 7 | SECURITY_ADMIN |
| 39 | POST | `/practitioner-delegates/{id}/accept` | Aceptar a una secretaria | MEDIO | 14 | PRACTITIONER, CLINICIAN |
| 40 | POST | `/practitioner-delegates/{id}/access-requests` | Solicitar acceso delegado (aprobación previa) | MEDIO | 7 | SECURITY_ADMIN |
| 41 | POST | `/practitioner-delegates/{id}/grants` | Otorgar grant delegado por-propósito y temporal | MEDIO | 6 | SECURITY_ADMIN |
| 42 | POST | `/practitioner-delegates/{id}/reject` | Rechazar a una secretaria | MEDIO | 14 | PRACTITIONER, CLINICIAN |
| 43 | POST | `/practitioner-delegates/{id}/revoke` | Revocar delegación de forma inmediata (cascada authz) | MEDIO | 5 | SECURITY_ADMIN |
| 44 | GET | `/public/prescription-shares/{token}` | Comprobar un enlace de receta compartida | ALTO | 6 | pública |
| 45 | POST | `/support-engagement-requests` | Pedir un vínculo de apoyo (hospital, sede, servicio, piso o doctor) | MEDIO | 16 | SUPPORT_STAFF |

---

## 1. POST /access-requests/{id}/decision

- **Origen:** CONTRATO
- **Nombre:** Aprobar/Denegar solicitud y emitir grant scoped
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccessRequestsController.decide` — `src/modules/delegated_access/controllers/access-requests.controller.ts:33`

### Qué es y para qué sirve (negocio)

Aprobar/Denegar solicitud y emitir grant scoped. Caso de uso UC-29-05: Aprobar/Denegar y emitir grant scoped. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:112`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /access-requests/{id}/decision` la atiende `AccessRequestsController.decide` (src/modules/delegated_access/controllers/access-requests.controller.ts:33). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `DecideAccessRequestDto` (5 campos, 1 obligatorio). Delega en `AccessRequestsService.decide`. Crea filas en delegated_access.delegated_access_grants, delegated_access.delegation_events. Actualiza delegated_access.delegated_access_approval_requests. Lee clinical.encounters, delegated_access.delegated_access_approval_requests, delegated_access.delegated_permission_sets, delegated_access.practitioner_delegate_assignments, profiles.patient_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/access-requests.controller.ts:33` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/access-requests.controller.ts:33` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | AccessRequestsController.decide → AccessRequestsService.decide → DelegationScopeService.assertGrantTarget → DelegationScopeRepository.encounterScope | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:84` |
| `delegated_access.delegated_access_approval_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | AccessRequestsController.decide → AccessRequestsService.decide | `src/modules/delegated_access/services/access-requests.service.ts:205` |
| `delegated_access.delegated_access_approval_requests` | LEE | LEE | DIRECTA | AccessRequestsController.decide → AccessRequestsService.decide → DelegatedAccessApprovalRequestsRepository.findById | `src/modules/delegated_access/repositories/delegated-access-approval-requests.repository.ts:51` |
| `delegated_access.delegated_access_grants` | ESCRIBE | CREA | DIRECTA | AccessRequestsController.decide → AccessRequestsService.decide → DelegatedAccessGrantsRepository.create | `src/modules/delegated_access/repositories/delegated-access-grants.repository.ts:79` |
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | AccessRequestsController.decide → AccessRequestsService.decide → DelegationScopeService.loadDelegationInTenant → DelegatedPermissionSetsRepository.findById | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:52` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | AccessRequestsController.decide → AccessRequestsService.decide → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | AccessRequestsController.decide → AccessRequestsService.decide → DelegationScopeService.loadDelegationInTenant → PractitionerDelegateAssignmentsRepository.findById | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:76` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | AccessRequestsController.decide → AccessRequestsService.decide → DelegationScopeService.assertGrantTarget → DelegationScopeRepository.patientExists | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:104` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DecideAccessRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: APPROVED, DENIED | `@IsIn(DECISIONS)` | Decisión del aprobador | `src/modules/delegated_access/dto/decide-access-request.dto.ts:22` |
| `purpose` | `string` | No | valores: TREATMENT, BILLING, OPERATIONS | `@IsOptional()` `@IsIn(PURPOSES)` | Propósito de uso del grant emitido | `src/modules/delegated_access/dto/decide-access-request.dto.ts:33` |
| `resourceType` | `string` | No | valores: CLINICAL_NOTE, APPOINTMENT, PRESCRIPTION | `@IsOptional()` `@IsIn(RESOURCE_TYPES)` | Tipo de recurso del grant | `src/modules/delegated_access/dto/decide-access-request.dto.ts:44` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fin de vigencia del grant (ISO) | `src/modules/delegated_access/dto/decide-access-request.dto.ts:55` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro del grant | `src/modules/delegated_access/dto/decide-access-request.dto.ts:63` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decision": "APPROVED"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "APPROVED",
  "purpose": "TREATMENT",
  "resourceType": "CLINICAL_NOTE",
  "validTo": "2026-07-31T12:00:00.000Z",
  "encounterId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<DecisionResultDto>` · DTO `DecisionResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `requestId` | `string` | Sí | formato uuid | — | Solicitud decidida | `src/modules/delegated_access/dto/responses.dto.ts:112` |
| `decision` | `string` | Sí | — | — | Decisión aplicada (APPROVED\|DENIED) | `src/modules/delegated_access/dto/responses.dto.ts:118` |
| `grantId` | `string` | No | formato uuid | — | Grant emitido si fue aprobada | `src/modules/delegated_access/dto/responses.dto.ts:127` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La solicitud no está abierta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/access-requests.controller.spec.ts:28` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-05`

---

## 2. POST /affiliation-invitations/redeem

- **Origen:** CONTRATO
- **Nombre:** Canjear un código o QR de afiliación
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AffiliationInvitationsController.redeem` — `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:93`

### Qué es y para qué sirve (negocio)

Canjear un código o QR de afiliación. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /affiliation-invitations/redeem` la atiende `AffiliationInvitationsController.redeem` (src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:93). Exige sesión con alguno de los roles PRACTITIONER, SUPPORT_STAFF. Valida el cuerpo como `RedeemAffiliationInvitationDto` (1 campo, 1 obligatorio). Delega en `RedeemAffiliationInvitationService.redeem`. Crea filas en delegated_access.organization_user_assignments, directory.affiliation_invitation_uses, directory.tenant_memberships, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, practice.practitioner_support_assignments, profiles.practitioner_affiliations. Actualiza directory.affiliation_invitations, messaging.in_app_notifications, messaging.notification_requests. Lee delegated_access.organization_user_assignments, directory.affiliation_invitations, directory.tenant_memberships, directory.tenants, iam.users, messaging.message_channels, messaging.message_templates, messaging.messaging_providers y 20 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, SUPPORT_STAFF | `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:93` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:93` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:93` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | ESCRIBE | CREA | POR_SQL | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.createLocationLink | `src/modules/delegated_access/repositories/support-links.repository.ts:777` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `directory.affiliation_invitation_uses` | ESCRIBE | CREA | POR_SQL | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.claim → AffiliationInvitationsRepository.recordUse | `src/modules/delegated_access/repositories/affiliation-invitations.repository.ts:142` |
| `directory.affiliation_invitations` | ESCRIBE | ACTUALIZA | POR_SQL | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → AffiliationInvitationsRepository.releaseUse | `src/modules/delegated_access/repositories/affiliation-invitations.repository.ts:128` |
| `directory.affiliation_invitations` | LEE | LEE | POR_SQL | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.claim → AffiliationInvitationsRepository.findByTokenHash | `src/modules/delegated_access/repositories/affiliation-invitations.repository.ts:104` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:644` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:628` |
| `directory.tenants` | LEE | LEE | POR_SQL | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.claim → SupportLinksRepository.findOrganizationName | `src/modules/delegated_access/repositories/support-links.repository.ts:346` |
| `iam.users` | LEE | LEE | POR_SQL | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `messaging.in_app_notifications` | ESCRIBE | ACTUALIZA | POR_TIPO | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:554` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:712` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:141` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:155` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:439` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:516` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:564` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:272` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:577` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:390` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:407` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:214` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesAffiliationsService.initialState → AffiliationOrganizationsAdapter.findSite | `src/modules/profiles/infrastructure/adapters/affiliation-organizations.adapter.ts:74` |
| `practice.practices` | LEE | LEE | POR_SQL | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.claim → AffiliationInvitationsRepository.findFirstActiveSite | `src/modules/delegated_access/repositories/affiliation-invitations.repository.ts:185` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_support_assignments` | ESCRIBE | CREA | POR_SQL | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.createPractitionerLink | `src/modules/delegated_access/repositories/support-links.repository.ts:798` |
| `practice.practitioner_support_assignments` | LEE | LEE | POR_SQL | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → ProfilesAffiliationsService.identity | `src/modules/profiles/application/services/profiles-affiliations.service.ts:342` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → ProfilesAffiliationsService.identity | `src/modules/profiles/application/services/profiles-affiliations.service.ts:341` |
| `profiles.practitioner_affiliations` | ESCRIBE | CREA | DIRECTA | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → PractitionerAffiliationsRepository.create | `src/modules/profiles/infrastructure/repositories/practitioner-affiliations.repository.ts:294` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → PractitionerAffiliationsRepository.findSame | `src/modules/profiles/infrastructure/repositories/practitioner-affiliations.repository.ts:254` |
| `profiles.secretary_profiles` | LEE | LEE | POR_SQL | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → SupportStaffService.request → SupportStaffService.requireSecretaryPerson → SupportLinksRepository.findSecretaryPersonId | `src/modules/delegated_access/repositories/support-links.repository.ts:269` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify | `src/modules/profiles/application/services/profiles-affiliations.service.ts:624` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → HealthFacilityCatalogService.assertIsHealthFacility → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:438` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → HealthFacilityCatalogService.assertIsHealthFacility → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:612` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → RedeemAffiliationInvitationService.redeem → RedeemAffiliationInvitationService.affiliate → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → HealthFacilityCatalogService.assertIsHealthFacility → ProfilesTerminologyAdapter.findByInternalCode → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:121` |

### Cuerpo — DTO `RedeemAffiliationInvitationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud mínima 8; longitud máxima 200 | `@IsString()` `@Length(8, 200)` | — | `src/modules/delegated_access/dto/affiliation-invitation.dto.ts:59` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO"
}
```

</details>

### Respuesta — `Promise<AffiliationRedeemResultDto>` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Organización no encontrada; ResourceNotFoundException: Profesional no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya hay un vínculo vivo con ese mismo objetivo; ConflictException: Ese vínculo ya está en el historial laboral; ConflictException: Ese vínculo con el establecimiento ya está en el historial laboral; ConflictException: Ya pidió vincularse a esa sede |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El fin del vínculo no puede ser anterior a su inicio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:AffiliationInvitationsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. GET /approvals/pending

- **Origen:** CONTRATO
- **Nombre:** Aprobaciones que espera mi decisión
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerGovernanceController.pending` — `src/modules/delegated_access/controllers/practitioner-governance.controller.ts:53`

### Qué es y para qué sirve (negocio)

Aprobaciones que espera mi decisión. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /approvals/pending` la atiende `PractitionerGovernanceController.pending` (src/modules/delegated_access/controllers/practitioner-governance.controller.ts:53). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `PractitionerGovernanceService.pendingApprovals`. Lee delegated_access.four_eyes_requests, delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/delegated_access/controllers/practitioner-governance.controller.ts:53` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/practitioner-governance.controller.ts:53` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.four_eyes_requests` | LEE | LEE | POR_SQL | PractitionerGovernanceController.pending → PractitionerGovernanceService.pendingApprovals → PractitionerGovernanceRepository.findPendingForDoctor | `src/modules/delegated_access/repositories/practitioner-governance.repository.ts:178` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | PractitionerGovernanceController.pending → PractitionerGovernanceService.pendingApprovals → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | PractitionerGovernanceController.pending → PractitionerGovernanceService.pendingApprovals → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `directory.tenants` | LEE | LEE | POR_SQL | PractitionerGovernanceController.pending → PractitionerGovernanceService.pendingApprovals → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `iam.users` | LEE | LEE | POR_SQL | PractitionerGovernanceController.pending → PractitionerGovernanceService.pendingApprovals → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | PractitionerGovernanceController.pending → PractitionerGovernanceService.pendingApprovals → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | PractitionerGovernanceController.pending → PractitionerGovernanceService.pendingApprovals → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | PractitionerGovernanceController.pending → PractitionerGovernanceService.pendingApprovals → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practices` | LEE | LEE | POR_SQL | PractitionerGovernanceController.pending → PractitionerGovernanceService.pendingApprovals → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | PractitionerGovernanceController.pending → PractitionerGovernanceService.pendingApprovals → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_support_assignments` | LEE | LEE | POR_SQL | PractitionerGovernanceController.pending → PractitionerGovernanceService.pendingApprovals → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | PractitionerGovernanceController.pending → PractitionerGovernanceService.pendingApprovals → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.persons` | LEE | LEE | POR_SQL | PractitionerGovernanceController.pending → PractitionerGovernanceService.pendingApprovals → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | PractitionerGovernanceController.pending → PractitionerGovernanceService.pendingApprovals → PractitionerGovernanceRepository.findPendingForDoctor | `src/modules/delegated_access/repositories/practitioner-governance.repository.ts:178` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | No | `number` | — |
| `cursor` | query | No | `string` | `nextCursor` de la página anterior. |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PendingApprovalsPageDto>` · DTO `PendingApprovalsPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PendingApprovalDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:87` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:68` |
| `items[].tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:69` |
| `items[].kind` | `string` | Sí | — | — | ACTION, GRANT_CHANGE, SOD_EXCEPTION… | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:71` |
| `items[].status` | `string` | Sí | — | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:72` |
| `items[].approverKind` | `string` | Sí | — | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:73` |
| `items[].atom` | `string` | No | — | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:74` |
| `items[].requesterUserId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:75` |
| `items[].subjectUserId` | `string` | No | formato uuid | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:77` |
| `items[].reasonText` | `string` | No | — | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:78` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:79` |
| `items[].expiresAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:80` |
| `items[].summary` | `string` | Sí | — | — | Qué se pide, en lenguaje simple. | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:82` |
| `count` | `number` | Sí | — | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:88` |
| `nextCursor` | `string` | Sí | admite null | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:89` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PractitionerGovernanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /authz/effective-actor/evaluate

- **Origen:** CONTRATO
- **Nombre:** Evaluar actor efectivo por propósito (step-up)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DelegatedAccessAuthzController.evaluate` — `src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:48`

### Qué es y para qué sirve (negocio)

Evaluar actor efectivo por propósito (step-up). Caso de uso UC-29-09: Evaluar actor efectivo por propósito (step-up). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:116`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/effective-actor/evaluate` la atiende `DelegatedAccessAuthzController.evaluate` (src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:48). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `EvaluateActorDto` (7 campos, 2 obligatorios). Delega en `DelegatedAccessEvaluationService.evaluate`. Crea filas en delegated_access.delegation_events. Lee delegated_access.delegated_access_grants, delegated_access.delegated_permission_set_items, delegated_access.delegated_permission_sets, delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments, directory.tenant_memberships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:48` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_access_grants` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → DelegatedAccessGrantsRepository.findActiveMatch | `src/modules/delegated_access/repositories/delegated-access-grants.repository.ts:118` |
| `delegated_access.delegated_permission_set_items` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → DelegatedPermissionSetItemsRepository.findBySetAndPermission | `src/modules/delegated_access/repositories/delegated-permission-set-items.repository.ts:75` |
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → DelegationScopeService.loadDelegationInTenant → DelegatedPermissionSetsRepository.findById | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:52` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → OrganizationUserAssignmentsRepository.findById | `src/modules/delegated_access/repositories/organization-user-assignments.repository.ts:90` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → DelegationScopeService.loadDelegationInTenant → PractitionerDelegateAssignmentsRepository.findById | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:76` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → DelegationScopeService.membershipOfAssignment → DelegationScopeRepository.membershipOf | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:46` |

### Cuerpo — DTO `EvaluateActorDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practitionerDelegateAssignmentId` | `string` | Sí | formato uuid | `@IsUUID()` | Delegación a evaluar | `src/modules/delegated_access/dto/evaluate-actor.dto.ts:18` |
| `effectiveUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Usuario que ejercería el acceso. Si se omite se evalúa al usuario autenticado. Tiene que ser el titular de la asignación del delegado; si no, el acceso no se permite | `src/modules/delegated_access/dto/evaluate-actor.dto.ts:30` |
| `purpose` | `string` | Sí | valores: TREATMENT, BILLING, OPERATIONS | `@IsIn(PURPOSES)` | Propósito de uso del acceso | `src/modules/delegated_access/dto/evaluate-actor.dto.ts:37` |
| `permissionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Permiso concreto que se ejerce | `src/modules/delegated_access/dto/evaluate-actor.dto.ts:48` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paciente sobre el que se accede | `src/modules/delegated_access/dto/evaluate-actor.dto.ts:59` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro sobre el que se accede | `src/modules/delegated_access/dto/evaluate-actor.dto.ts:70` |
| `resourceType` | `string` | No | valores: CLINICAL_NOTE, APPOINTMENT, PRESCRIPTION | `@IsOptional()` `@IsIn(RESOURCE_TYPES)` | Tipo de recurso | `src/modules/delegated_access/dto/evaluate-actor.dto.ts:78` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practitionerDelegateAssignmentId": "00000000-0000-4000-8000-000000000001",
  "purpose": "TREATMENT"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practitionerDelegateAssignmentId": "00000000-0000-4000-8000-000000000001",
  "effectiveUserId": "00000000-0000-4000-8000-000000000001",
  "purpose": "TREATMENT",
  "permissionId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "resourceType": "CLINICAL_NOTE"
}
```

</details>

### Respuesta — `Promise<EvaluationResultDto>` · DTO `EvaluationResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `allowed` | `boolean` | Sí | — | — | Si el acceso está permitido | `src/modules/delegated_access/dto/responses.dto.ts:157` |
| `requiresStepUp` | `boolean` | Sí | — | — | Si exige step-up antes de permitir | `src/modules/delegated_access/dto/responses.dto.ts:163` |
| `reason` | `string` | No | — | — | Motivo cuando no se permite | `src/modules/delegated_access/dto/responses.dto.ts:169` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/delegated-access-authz.controller.spec.ts:37` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-09`

---

## 5. GET /clinical/prescription-shares

- **Origen:** CONTRATO
- **Nombre:** Enlaces de receta de un paciente
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PrescriptionSharesController.list` — `src/modules/delegated_access/controllers/prescription-shares.controller.ts:89`

### Qué es y para qué sirve (negocio)

Enlaces de receta de un paciente. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /clinical/prescription-shares` la atiende `PrescriptionSharesController.list` (src/modules/delegated_access/controllers/prescription-shares.controller.ts:89). Exige sesión con alguno de los roles PATIENT, PRACTITIONER. Delega en `PrescriptionSharesService.listForPatient`. Lee clinical.medication_requests, delegated_access.shared_access_link_uses, delegated_access.shared_access_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT, PRACTITIONER | `src/modules/delegated_access/controllers/prescription-shares.controller.ts:89` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_QUERY | patientProfileId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PrescriptionSharesController.list → PrescriptionSharesService.listForPatient → SharedAccessLinksRepository.findItemsForResources | `src/modules/delegated_access/repositories/shared-access-links.repository.ts:256` |
| `delegated_access.shared_access_link_uses` | LEE | LEE | POR_SQL | PrescriptionSharesController.list → PrescriptionSharesService.listForPatient → SharedAccessLinksRepository.countOpenedByLinkIds | `src/modules/delegated_access/repositories/shared-access-links.repository.ts:162` |
| `delegated_access.shared_access_links` | LEE | LEE | DIRECTA | PrescriptionSharesController.list → PrescriptionSharesService.listForPatient → SharedAccessLinksRepository.findByPatient | `src/modules/delegated_access/repositories/shared-access-links.repository.ts:125` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PrescriptionShareSummaryDto[]>` · DTO `PrescriptionShareSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `shareId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:82` |
| `resourceType` | `string` | Sí | valores: PRESCRIPTION_ENCOUNTER, MEDICATION_REQUEST | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:85` |
| `resourceId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:89` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:92` |
| `expiresAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:95` |
| `status` | `string` | Sí | valores: VALID, EXPIRED, REVOKED | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:98` |
| `endedReason` | `string` | Sí | valores: LINK_EXPIRED, PRESCRIPTION_NOT_ACTIVE; admite null | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:110` |
| `uses` | `number` | Sí | — | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:114` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Paciente no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/prescription-shares.controller.spec.ts:108` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PrescriptionSharesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /clinical/prescription-shares

- **Origen:** CONTRATO
- **Nombre:** Compartir una receta con un enlace
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PrescriptionSharesController.create` — `src/modules/delegated_access/controllers/prescription-shares.controller.ts:57`

### Qué es y para qué sirve (negocio)

Compartir una receta con un enlace. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /clinical/prescription-shares` la atiende `PrescriptionSharesController.create` (src/modules/delegated_access/controllers/prescription-shares.controller.ts:57). Exige sesión con alguno de los roles PATIENT, PRACTITIONER. Valida el cuerpo como `CreatePrescriptionShareDto` (2 campos, 0 obligatorios). Delega en `PrescriptionSharesService.create`. Crea filas en delegated_access.shared_access_links. Lee clinical.medication_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT, PRACTITIONER | `src/modules/delegated_access/controllers/prescription-shares.controller.ts:57` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PrescriptionSharesController.create → PrescriptionSharesService.create → SharedAccessLinksRepository.findItemsByEncounter | `src/modules/delegated_access/repositories/shared-access-links.repository.ts:215` |
| `delegated_access.shared_access_links` | ESCRIBE | CREA | DIRECTA | PrescriptionSharesController.create → PrescriptionSharesService.create → SharedAccessLinksRepository.create | `src/modules/delegated_access/repositories/shared-access-links.repository.ts:67` |

### Cuerpo — DTO `CreatePrescriptionShareDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro de la receta. Excluye a `medicationRequestId`. | `src/modules/delegated_access/dto/prescription-shares.dto.ts:38` |
| `medicationRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Fármaco suelto. Excluye a `encounterId`. | `src/modules/delegated_access/dto/prescription-shares.dto.ts:47` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "medicationRequestId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<PrescriptionShareCreatedDto>` · DTO `PrescriptionShareCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `shareId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:61` |
| `url` | `string` | Sí | — | — | Enlace para compartir: `<web>/rx/<token>` | `src/modules/delegated_access/dto/prescription-shares.dto.ts:65` |
| `token` | `string` | Sí | — | — | Token en claro; se devuelve una sola vez | `src/modules/delegated_access/dto/prescription-shares.dto.ts:69` |
| `expiresAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:72` |
| `itemCount` | `number` | Sí | — | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:76` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra); BadRequestException: {{ code: ErrorCode.VALIDATION_FAILED, message: 'Indicá la co…} |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {{ code: ErrorCode.FORBIDDEN, message: 'Solo el paciente o q…} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La receta no tiene medicamentos emitidos y vigentes para compartir. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/prescription-shares.controller.spec.ts:105` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PrescriptionSharesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /clinical/prescription-shares/{shareId}/revoke

- **Origen:** CONTRATO
- **Nombre:** Revocar un enlace de receta
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PrescriptionSharesController.revoke` — `src/modules/delegated_access/controllers/prescription-shares.controller.ts:123`

### Qué es y para qué sirve (negocio)

Revocar un enlace de receta. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /clinical/prescription-shares/{shareId}/revoke` la atiende `PrescriptionSharesController.revoke` (src/modules/delegated_access/controllers/prescription-shares.controller.ts:123). Exige sesión con alguno de los roles PATIENT, PRACTITIONER. Delega en `PrescriptionSharesService.revoke`. Actualiza delegated_access.shared_access_links. Lee delegated_access.shared_access_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT, PRACTITIONER | `src/modules/delegated_access/controllers/prescription-shares.controller.ts:123` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: shareId | `src/modules/delegated_access/controllers/prescription-shares.controller.ts:123` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.shared_access_links` | ESCRIBE | ACTUALIZA | POR_TIPO | PrescriptionSharesController.revoke → PrescriptionSharesService.revoke | `src/modules/delegated_access/services/prescription-shares.service.ts:237` |
| `delegated_access.shared_access_links` | LEE | LEE | DIRECTA | PrescriptionSharesController.revoke → PrescriptionSharesService.revoke → SharedAccessLinksRepository.findById | `src/modules/delegated_access/repositories/shared-access-links.repository.ts:109` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `shareId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>` · HTTP `HttpStatus.NO_CONTENT`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 204 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/prescription-shares.controller.spec.ts:114` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PrescriptionSharesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /clinical/prescription-shares/by-token/{token}

- **Origen:** CONTRATO
- **Nombre:** Saber si un enlace es de la sesión
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PrescriptionSharesController.resolveOwnership` — `src/modules/delegated_access/controllers/prescription-shares.controller.ts:106`

### Qué es y para qué sirve (negocio)

Saber si un enlace es de la sesión. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /clinical/prescription-shares/by-token/{token}` la atiende `PrescriptionSharesController.resolveOwnership` (src/modules/delegated_access/controllers/prescription-shares.controller.ts:106). Exige sesión con alguno de los roles PATIENT, PRACTITIONER. Delega en `PrescriptionSharesService.resolveOwnership`. Lee delegated_access.shared_access_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT, PRACTITIONER | `src/modules/delegated_access/controllers/prescription-shares.controller.ts:106` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.shared_access_links` | LEE | LEE | DIRECTA | PrescriptionSharesController.resolveOwnership → PrescriptionSharesService.resolveOwnership → PrescriptionSharesService.findByToken → SharedAccessLinksRepository.findByTokenHash | `src/modules/delegated_access/repositories/shared-access-links.repository.ts:98` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `token` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PrescriptionShareOwnershipDto>` · DTO `PrescriptionShareOwnershipDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `shareId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:120` |
| `resourceType` | `string` | Sí | valores: PRESCRIPTION_ENCOUNTER, MEDICATION_REQUEST | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:123` |
| `resourceId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:126` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/prescription-shares.controller.spec.ts:111` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PrescriptionSharesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /delegated-access/expiry-sweep

- **Origen:** CONTRATO
- **Nombre:** Expirar delegaciones y grants vencidos (barrido)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DelegatedAccessAuthzController.expirySweep` — `src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:32`

### Qué es y para qué sirve (negocio)

Expirar delegaciones y grants vencidos (barrido). Caso de uso UC-29-08: Expirar delegaciones y grants vencidos. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:115`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /delegated-access/expiry-sweep` la atiende `DelegatedAccessAuthzController.expirySweep` (src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:32). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `DelegatedAccessEvaluationService.expirySweep`. Crea filas en delegated_access.delegation_events. Actualiza delegated_access.delegated_access_grants, delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments. Lee delegated_access.delegated_access_grants, delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:32` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_access_grants` | ESCRIBE | ACTUALIZA | POR_TIPO | DelegatedAccessAuthzController.expirySweep → DelegatedAccessEvaluationService.expirySweep | `src/modules/delegated_access/services/delegated-access-evaluation.service.ts:73` |
| `delegated_access.delegated_access_grants` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.expirySweep → DelegatedAccessEvaluationService.expirySweep → DelegatedAccessGrantsRepository.findOverdueActive | `src/modules/delegated_access/repositories/delegated-access-grants.repository.ts:151` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | DelegatedAccessAuthzController.expirySweep → DelegatedAccessEvaluationService.expirySweep → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.organization_user_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | DelegatedAccessAuthzController.expirySweep → DelegatedAccessEvaluationService.expirySweep | `src/modules/delegated_access/services/delegated-access-evaluation.service.ts:106` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.expirySweep → DelegatedAccessEvaluationService.expirySweep → OrganizationUserAssignmentsRepository.findOverdueActive | `src/modules/delegated_access/repositories/organization-user-assignments.repository.ts:169` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | DelegatedAccessAuthzController.expirySweep → DelegatedAccessEvaluationService.expirySweep | `src/modules/delegated_access/services/delegated-access-evaluation.service.ts:90` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.expirySweep → DelegatedAccessEvaluationService.expirySweep → PractitionerDelegateAssignmentsRepository.findOverdueActive | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:137` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ExpirySweepResultDto>` · DTO `ExpirySweepResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expiredGrants` | `number` | Sí | — | — | Grants expirados | `src/modules/delegated_access/dto/responses.dto.ts:136` |
| `expiredDelegations` | `number` | Sí | — | — | Delegaciones de practitioner expiradas | `src/modules/delegated_access/dto/responses.dto.ts:142` |
| `expiredOrgAssignments` | `number` | Sí | — | — | Asignaciones de organización expiradas | `src/modules/delegated_access/dto/responses.dto.ts:148` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/delegated-access-authz.controller.spec.ts:27` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-08`

---

## 10. GET /delegated-permission-sets

- **Origen:** CONTRATO
- **Nombre:** Listar los sets de permisos delegados del tenant
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DelegatedPermissionSetsController.list` — `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:47`

### Qué es y para qué sirve (negocio)

Listar los sets de permisos delegados del tenant. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /delegated-permission-sets` la atiende `DelegatedPermissionSetsController.list` (src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:47). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `PermissionSetsService.listByTenant`. Lee delegated_access.delegated_permission_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:47` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | DelegatedPermissionSetsController.list → PermissionSetsService.listByTenant → DelegatedPermissionSetsRepository.findByTenantPage | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `cursor` | query | No | `string` | Cursor opaco devuelto por la página anterior |
| `limit` | query | No | `number` | Sets por página |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListPermissionSetsResponseDto>` · DTO `ListPermissionSetsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PermissionSetSummaryDto>` | Sí | — | — | Sets de esta página, ordenados por `id`. | `src/modules/delegated_access/dto/responses.dto.ts:63` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/delegated_access/dto/responses.dto.ts:28` |
| `items[].code` | `string` | Sí | — | — | Código del set, único dentro del tenant. | `src/modules/delegated_access/dto/responses.dto.ts:32` |
| `items[].name` | `string` | Sí | — | — | Nombre visible del set. | `src/modules/delegated_access/dto/responses.dto.ts:36` |
| `items[].delegateTypeConceptId` | `string` | Sí | formato uuid | — | Concepto del tipo de delegado al que aplica. | `src/modules/delegated_access/dto/responses.dto.ts:40` |
| `items[].description` | `string` | No | — | — | Descripción libre, si se publicó una. | `src/modules/delegated_access/dto/responses.dto.ts:44` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Concepto de estado del set. | `src/modules/delegated_access/dto/responses.dto.ts:48` |
| `items[].versionNumber` | `number` | Sí | — | — | Versión publicada más reciente. | `src/modules/delegated_access/dto/responses.dto.ts:52` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Fecha de creación del set. | `src/modules/delegated_access/dto/responses.dto.ts:56` |
| `count` | `number` | Sí | — | — | Cantidad devuelta en esta página. | `src/modules/delegated_access/dto/responses.dto.ts:66` |
| `limit` | `number` | Sí | — | — | Tope aplicado a la consulta. | `src/modules/delegated_access/dto/responses.dto.ts:69` |
| `nextCursor` | `string` | Sí | admite null | — | Cursor opaco de continuación, o `null` si ésta es la última página. | `src/modules/delegated_access/dto/responses.dto.ts:73` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/admin-listados.int-spec.ts:155` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:DelegatedPermissionSetsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. POST /delegated-permission-sets

- **Origen:** CONTRATO
- **Nombre:** Publicar set de permisos delegados (scoped)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DelegatedPermissionSetsController.createSet` — `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:64`

### Qué es y para qué sirve (negocio)

Publicar set de permisos delegados (scoped). Caso de uso UC-29-02: Publicar set de permisos delegados (v1). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:108`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /delegated-permission-sets` la atiende `DelegatedPermissionSetsController.createSet` (src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:64). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePermissionSetDto` (9 campos, 5 obligatorios). Delega en `PermissionSetsService.createSet`. Crea filas en delegated_access.delegated_permission_set_items, delegated_access.delegated_permission_sets. Lee delegated_access.delegated_permission_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:64` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_permission_set_items` | ESCRIBE | CREA | DIRECTA | DelegatedPermissionSetsController.createSet → PermissionSetsService.createSet → DelegatedPermissionSetItemsRepository.create | `src/modules/delegated_access/repositories/delegated-permission-set-items.repository.ts:39` |
| `delegated_access.delegated_permission_sets` | ESCRIBE | CREA | DIRECTA | DelegatedPermissionSetsController.createSet → PermissionSetsService.createSet → DelegatedPermissionSetsRepository.create | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:99` |
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | DelegatedPermissionSetsController.createSet → PermissionSetsService.createSet → DelegatedPermissionSetsRepository.findByCode | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:61` |

### Cuerpo — DTO `CreatePermissionSetDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant propietario del set | `src/modules/delegated_access/dto/create-permission-set.dto.ts:25` |
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único del set por tenant | `src/modules/delegated_access/dto/create-permission-set.dto.ts:37` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre legible del set | `src/modules/delegated_access/dto/create-permission-set.dto.ts:46` |
| `delegateType` | `string` | No | valores: SECRETARY, ASSISTANT, NURSE, BILLING | `@IsOptional()` `@IsIn(DELEGATE_TYPES)` | Tipo de delegado | `src/modules/delegated_access/dto/create-permission-set.dto.ts:57` |
| `description` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Descripción del set | `src/modules/delegated_access/dto/create-permission-set.dto.ts:66` |
| `items` | `array<PermissionSetItemDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => PermissionSetItemDto)` | Ítems de permiso de la versión 1 | `src/modules/delegated_access/dto/create-permission-set.dto.ts:79` |
| `items[].permissionId` | `string` | Sí | formato uuid | `@IsUUID()` | Permiso referenciado en authz | `src/modules/delegated_access/dto/permission-set-item.dto.ts:11` |
| `items[].constraintJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Restricción declarativa (constraint) del permiso | `src/modules/delegated_access/dto/permission-set-item.dto.ts:21` |
| `items[].requiresStepUpAuthentication` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Requiere step-up (autenticación reforzada) | `src/modules/delegated_access/dto/permission-set-item.dto.ts:31` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "items": [
    {
      "permissionId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "delegateType": "SECRETARY",
  "description": "Texto descriptivo de ejemplo",
  "items": [
    {
      "permissionId": "00000000-0000-4000-8000-000000000001",
      "constraintJson": {},
      "requiresStepUpAuthentication": true
    }
  ]
}
```

</details>

### Respuesta — `Promise<PermissionSetVersionDto>` · DTO `PermissionSetVersionDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/delegated_access/dto/responses.dto.ts:82` |
| `versionNumber` | `number` | Sí | — | — | Número de versión publicada | `src/modules/delegated_access/dto/responses.dto.ts:88` |
| `itemCount` | `number` | Sí | — | — | Nº de ítems de permiso de la versión | `src/modules/delegated_access/dto/responses.dto.ts:94` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un set con ese código en el tenant |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/delegated-permission-sets.controller.spec.ts:33` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-02`

---

## 12. POST /delegated-permission-sets/{id}/versions

- **Origen:** CONTRATO
- **Nombre:** Versionar set de permisos delegados
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DelegatedPermissionSetsController.publishVersion` — `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:81`

### Qué es y para qué sirve (negocio)

Versionar set de permisos delegados. Caso de uso UC-29-02: Versionar set (reemplazo all-or-nothing). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:109`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /delegated-permission-sets/{id}/versions` la atiende `DelegatedPermissionSetsController.publishVersion` (src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:81). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PublishSetVersionDto` (4 campos, 2 obligatorios). Delega en `PermissionSetsService.publishVersion`. Crea filas en delegated_access.delegated_permission_set_items. Actualiza delegated_access.delegated_permission_sets. Borra de delegated_access.delegated_permission_set_items. Lee delegated_access.delegated_permission_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:81` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:81` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_permission_set_items` | BORRA | BORRA | DIRECTA | DelegatedPermissionSetsController.publishVersion → PermissionSetsService.publishVersion → DelegatedPermissionSetItemsRepository.deleteBySet | `src/modules/delegated_access/repositories/delegated-permission-set-items.repository.ts:83` |
| `delegated_access.delegated_permission_set_items` | ESCRIBE | CREA | DIRECTA | DelegatedPermissionSetsController.publishVersion → PermissionSetsService.publishVersion → DelegatedPermissionSetItemsRepository.create | `src/modules/delegated_access/repositories/delegated-permission-set-items.repository.ts:39` |
| `delegated_access.delegated_permission_sets` | ESCRIBE | ACTUALIZA | POR_TIPO | DelegatedPermissionSetsController.publishVersion → PermissionSetsService.publishVersion | `src/modules/delegated_access/services/permission-sets.service.ts:183` |
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | DelegatedPermissionSetsController.publishVersion → PermissionSetsService.publishVersion → DelegationScopeService.loadSetInTenant → DelegatedPermissionSetsRepository.findById | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:52` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PublishSetVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PermissionSetItemDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => PermissionSetItemDto)` | Ítems de permiso de la nueva versión | `src/modules/delegated_access/dto/publish-set-version.dto.ts:19` |
| `items[].permissionId` | `string` | Sí | formato uuid | `@IsUUID()` | Permiso referenciado en authz | `src/modules/delegated_access/dto/permission-set-item.dto.ts:11` |
| `items[].constraintJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Restricción declarativa (constraint) del permiso | `src/modules/delegated_access/dto/permission-set-item.dto.ts:21` |
| `items[].requiresStepUpAuthentication` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Requiere step-up (autenticación reforzada) | `src/modules/delegated_access/dto/permission-set-item.dto.ts:31` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "items": [
    {
      "permissionId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "items": [
    {
      "permissionId": "00000000-0000-4000-8000-000000000001",
      "constraintJson": {},
      "requiresStepUpAuthentication": true
    }
  ]
}
```

</details>

### Respuesta — `Promise<PermissionSetVersionDto>` · DTO `PermissionSetVersionDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/delegated_access/dto/responses.dto.ts:82` |
| `versionNumber` | `number` | Sí | — | — | Número de versión publicada | `src/modules/delegated_access/dto/responses.dto.ts:88` |
| `itemCount` | `number` | Sí | — | — | Nº de ítems de permiso de la versión | `src/modules/delegated_access/dto/responses.dto.ts:94` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/delegated-permission-sets.controller.spec.ts:40` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-02`

---

## 13. GET /me/practitioner/governance-panel

- **Origen:** CONTRATO
- **Nombre:** Panel «Para su atención» del doctor
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerGovernanceController.panel` — `src/modules/delegated_access/controllers/practitioner-governance.controller.ts:41`

### Qué es y para qué sirve (negocio)

Panel «Para su atención» del doctor. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /me/practitioner/governance-panel` la atiende `PractitionerGovernanceController.panel` (src/modules/delegated_access/controllers/practitioner-governance.controller.ts:41). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `PractitionerGovernanceService.panel`. Lee delegated_access.access_anomalies, delegated_access.access_review_items, delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units y 7 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/delegated_access/controllers/practitioner-governance.controller.ts:41` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/practitioner-governance.controller.ts:41` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.access_anomalies` | LEE | LEE | POR_SQL | PractitionerGovernanceController.panel → PractitionerGovernanceService.panel → PractitionerGovernanceRepository.findOpenAnomalies | `src/modules/delegated_access/repositories/practitioner-governance.repository.ts:124` |
| `delegated_access.access_review_items` | LEE | LEE | POR_SQL | PractitionerGovernanceController.panel → PractitionerGovernanceService.panel → PractitionerGovernanceRepository.countPendingReviews | `src/modules/delegated_access/repositories/practitioner-governance.repository.ts:98` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | PractitionerGovernanceController.panel → PractitionerGovernanceService.panel → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | PractitionerGovernanceController.panel → PractitionerGovernanceService.panel → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `directory.tenants` | LEE | LEE | POR_SQL | PractitionerGovernanceController.panel → PractitionerGovernanceService.panel → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `iam.users` | LEE | LEE | POR_SQL | PractitionerGovernanceController.panel → PractitionerGovernanceService.panel → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | PractitionerGovernanceController.panel → PractitionerGovernanceService.panel → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | PractitionerGovernanceController.panel → PractitionerGovernanceService.panel → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | PractitionerGovernanceController.panel → PractitionerGovernanceService.panel → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practices` | LEE | LEE | POR_SQL | PractitionerGovernanceController.panel → PractitionerGovernanceService.panel → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | PractitionerGovernanceController.panel → PractitionerGovernanceService.panel → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_support_assignments` | LEE | LEE | POR_SQL | PractitionerGovernanceController.panel → PractitionerGovernanceService.panel → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | PractitionerGovernanceController.panel → PractitionerGovernanceService.panel → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.persons` | LEE | LEE | POR_SQL | PractitionerGovernanceController.panel → PractitionerGovernanceService.panel → PractitionerGovernanceService.teamOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | PractitionerGovernanceController.panel → PractitionerGovernanceService.panel → PractitionerGovernanceRepository.findOpenAnomalies | `src/modules/delegated_access/repositories/practitioner-governance.repository.ts:124` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PractitionerGovernancePanelDto>` · DTO `PractitionerGovernancePanelDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `generatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:36` |
| `team` | `array<GovernancePanelTeamMemberDto>` | Sí | — | — | Reservado: la lista del equipo la da `GET /me/practitioner/support-team`; acá va vacía. | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:42` |
| `team[].userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:14` |
| `team[].engagementId` | `string` | Sí | formato uuid | — | El vínculo con el doctor. | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:16` |
| `team[].templateCode` | `string` | Sí | admite null | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:17` |
| `team[].liveGrants` | `number` | Sí | — | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:18` |
| `pendingReviews` | `number` | Sí | — | — | Revisiones de acceso que esperan al doctor. | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:44` |
| `openAnomalies` | `array<GovernancePanelAnomalyDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:46` |
| `openAnomalies[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:23` |
| `openAnomalies[].userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:24` |
| `openAnomalies[].kindConceptId` | `string` | Sí | — | — | Tipo de la alerta, p. ej. `ANOMALY_CANCEL_SPIKE`. | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:28` |
| `openAnomalies[].windowStart` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:29` |
| `openAnomalies[].observed` | `number` | Sí | — | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:30` |
| `openAnomalies[].threshold` | `number` | Sí | — | — | — | `src/modules/delegated_access/dto/practitioner-governance.dto.ts:31` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PractitionerGovernanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. GET /me/practitioner/support-activity

- **Origen:** CONTRATO
- **Nombre:** Actividad de mi equipo de apoyo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSupportController.activity` — `src/modules/delegated_access/controllers/practitioner-support.controller.ts:69`

### Qué es y para qué sirve (negocio)

Actividad de mi equipo de apoyo. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /me/practitioner/support-activity` la atiende `PractitionerSupportController.activity` (src/modules/delegated_access/controllers/practitioner-support.controller.ts:69). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN, SUPPORT_STAFF. No toca tablas relacionales: el handler no invoca ningún servicio.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN, SUPPORT_STAFF | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:69` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:69` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

No toca tablas relacionales: el handler no invoca ningún servicio. _(automática; fuente: `src/modules/delegated_access/controllers/practitioner-support.controller.ts:69`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<{ items: readonly unknown[]; count: number; nextCursor: string | null }>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PractitionerSupportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. POST /me/practitioner/support-invitations

- **Origen:** CONTRATO
- **Nombre:** Invitar a una secretaria a asistirme
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSupportController.invite` — `src/modules/delegated_access/controllers/practitioner-support.controller.ts:136`

### Qué es y para qué sirve (negocio)

Invitar a una secretaria a asistirme. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /me/practitioner/support-invitations` la atiende `PractitionerSupportController.invite` (src/modules/delegated_access/controllers/practitioner-support.controller.ts:136). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `PractitionerInviteSupportDto` (2 campos, 2 obligatorios). Delega en `SupportStaffService.inviteForPractitioner`. Crea filas en delegated_access.organization_user_assignments, directory.tenant_memberships, practice.practitioner_support_assignments. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.authentication_credentials, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:136` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:136` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 20, ttl: 60_000 } }) | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:136` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | ESCRIBE | CREA | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.createLocationLink | `src/modules/delegated_access/repositories/support-links.repository.ts:777` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:644` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:628` |
| `directory.tenants` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.findOrganizationName | `src/modules/delegated_access/repositories/support-links.repository.ts:346` |
| `iam.authentication_credentials` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.requireSecretaryByNationalId → SupportLinksRepository.findSecretaryByNationalId | `src/modules/delegated_access/repositories/support-links.repository.ts:293` |
| `iam.users` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practices` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportLinksRepository.findActiveRoleAssignmentsOfPractitioner | `src/modules/delegated_access/repositories/support-links.repository.ts:454` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportLinksRepository.findActiveRoleAssignmentsOfPractitioner | `src/modules/delegated_access/repositories/support-links.repository.ts:454` |
| `practice.practitioner_support_assignments` | ESCRIBE | CREA | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.createPractitionerLink | `src/modules/delegated_access/repositories/support-links.repository.ts:798` |
| `practice.practitioner_support_assignments` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.requireSecretaryByNationalId → SupportLinksRepository.findSecretaryByNationalId | `src/modules/delegated_access/repositories/support-links.repository.ts:293` |
| `profiles.persons` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.secretary_profiles` | LEE | LEE | POR_SQL | PractitionerSupportController.invite → SupportStaffService.inviteForPractitioner → SupportStaffService.requireSecretaryByNationalId → SupportLinksRepository.findSecretaryByNationalId | `src/modules/delegated_access/repositories/support-links.repository.ts:293` |

### Cuerpo — DTO `PractitionerInviteSupportDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `nationalId` | `string` | Sí | longitud mínima 4; longitud máxima 40; patrón runtime NATIONAL_ID_PATTERN | `@IsString()` `@MinLength(4)` `@MaxLength(40)` `@Matches(NATIONAL_ID_PATTERN, { message: 'El documento sólo admite letras, dígitos, punto y guion', })` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:137` |
| `practitionerRoleAssignmentId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:142` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<SupportLinksCreatedDto>` · DTO `SupportLinksCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del primer vínculo creado. | `src/modules/delegated_access/dto/support-staff.dto.ts:278` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:279` |
| `items` | `array<SupportLinkViewDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:280` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `items[].kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `items[].targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `items[].tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `items[].organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `items[].userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `items[].personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `items[].status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `items[].initiatedBy` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `src/modules/delegated_access/dto/support-staff.dto.ts:231` |
| `items[].awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:237` |
| `items[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:239` |
| `items[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:241` |
| `items[].careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:243` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:245` |
| `items[].practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:247` |
| `items[].targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:253` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:254` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Vinculación no encontrada; ResourceNotFoundException: No hay una secretaria registrada con ese documento; ResourceNotFoundException: Organización no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya hay un vínculo vivo con ese mismo objetivo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PractitionerSupportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. POST /me/practitioner/support-staff

- **Origen:** CONTRATO
- **Nombre:** Crear cuenta de secretaria y vincularla de inmediato
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSupportController.createSecretary` — `src/modules/delegated_access/controllers/practitioner-support.controller.ts:155`

### Qué es y para qué sirve (negocio)

Crear cuenta de secretaria y vincularla de inmediato. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /me/practitioner/support-staff` la atiende `PractitionerSupportController.createSecretary` (src/modules/delegated_access/controllers/practitioner-support.controller.ts:155). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `CreatePractitionerSupportStaffDto` (14 campos, 7 obligatorios). Delega en `SupportStaffProvisioningService.provisionForPractitioner`. Crea filas en common.contact_points, common.identifiers, directory.tenant_memberships, iam.authentication_credentials, iam.email_verifications, iam.security_events, iam.user_global_roles, iam.users y 6 más. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.authentication_credentials, iam.users, messaging.message_channels, messaging.message_templates, messaging.notification_requests y 12 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:155` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:155` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:155` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.contact_points` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → CommonRecordsAdapter.createContactPoint → ContactPointsRepository.create | `src/modules/common/repositories/contact-points.repository.ts:198` |
| `common.identifiers` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → CommonRecordsAdapter.createIdentifier → IdentifiersRepository.create | `src/modules/common/repositories/identifiers.repository.ts:131` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:644` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:628` |
| `directory.tenants` | LEE | LEE | POR_SQL | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningRepository.findActiveRoleAssignmentOfPractitioner | `src/modules/delegated_access/repositories/support-staff-provisioning.repository.ts:29` |
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → CredentialsRepository.createPassword | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:323` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → CredentialsRepository.findLivePasswordBySubject | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:205` |
| `iam.email_verifications` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → EmailVerificationsRepository.create | `src/modules/iam/infrastructure/repositories/email-verifications.repository.ts:41` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:47` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → UserGlobalRolesRepository.create | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:27` |
| `iam.users` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → UsersRepository.create | `src/modules/iam/infrastructure/repositories/users.repository.ts:104` |
| `iam.users` | LEE | LEE | POR_SQL | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → IamSupportStaffSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:141` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → IamSupportStaffSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:155` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → IamSupportStaffSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:272` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → IamSupportStaffSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:390` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → IamSupportStaffSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:214` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practices` | LEE | LEE | POR_SQL | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningRepository.findActiveRoleAssignmentOfPractitioner | `src/modules/delegated_access/repositories/support-staff-provisioning.repository.ts:29` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningRepository.findActiveRoleAssignmentOfPractitioner | `src/modules/delegated_access/repositories/support-staff-provisioning.repository.ts:29` |
| `practice.practitioner_support_assignments` | ESCRIBE | CREA | POR_SQL | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningRepository.createActivePractitionerLink | `src/modules/delegated_access/repositories/support-staff-provisioning.repository.ts:60` |
| `practice.practitioner_support_assignments` | LEE | LEE | POR_SQL | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.person_account_links` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → ProfilesRegistrationAdapter.createAccountLink → PersonAccountLinksRepository.create | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:50` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.person_profiles` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → ProfilesRegistrationAdapter.createPersonProfile → PersonProfilesRepository.create | `src/modules/profiles/infrastructure/repositories/person-profiles.repository.ts:57` |
| `profiles.persons` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → ProfilesRegistrationAdapter.createPerson → PersonsRepository.create | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:119` |
| `profiles.persons` | LEE | LEE | POR_SQL | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.secretary_profiles` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → ProfilesRegistrationAdapter.createSecretaryProfile | `src/modules/iam/infrastructure/adapters/profiles-registration.adapter.ts:97` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → ProfilesRegistrationAdapter.assertIsAdministrativeArea → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:438` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → ProfilesRegistrationAdapter.assertIsAdministrativeArea → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:612` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | PractitionerSupportController.createSecretary → SupportStaffProvisioningService.provisionForPractitioner → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → ProfilesRegistrationAdapter.assertIsAdministrativeArea → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findByInternalCode → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:121` |

### Cuerpo — DTO `CreatePractitionerSupportStaffDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `nationalId` | `string` | Sí | longitud mínima 4; longitud máxima 40; patrón runtime /^[A-Za-z0-9.-]+$/ | `@IsString()` `@MinLength(4)` `@MaxLength(40)` `@Matches(/^[A-Za-z0-9.-]+$/, { message: 'El documento sólo admite letras, dígitos, punto y guion', })` | Documento de identidad con el que se iniciará sesión | `src/modules/iam/presentation/dto/register-patient.dto.ts:184` |
| `issuerAdministrativeAreaConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Departamento emisor del documento (catálogo VS_BO_DEPARTMENT) | `src/modules/iam/presentation/dto/register-patient.dto.ts:202` |
| `password` | `string` | Sí | longitud mínima 8; longitud máxima 200 | `@IsString()` `@MinLength(8)` `@MaxLength(200)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:234` |
| `name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: RegisterPatientDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:250` |
| `middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:262` |
| `lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: RegisterPatientDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:275` |
| `motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:287` |
| `displayName` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Forma anterior de declarar el nombre. Preferí name/lastName. | `src/modules/iam/presentation/dto/register-patient.dto.ts:306` |
| `email` | `string` | Sí | formato email; longitud máxima 320 | `@IsStrictEmail()` `@MaxLength(320)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:330` |
| `birthDate` | `string` | Sí | formato date | `@IsISO8601()` `@IsBirthDateInRange({ message: 'La fecha de nacimiento tiene que estar entre 1910 y hoy', })` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:344` |
| `phone` | `string` | Sí | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsString()` `@MaxLength(PHONE_MAX_LENGTH)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Teléfono de contacto en formato E.164 o nacional: dígitos, espacios, paréntesis, + y guion, mínimo 6 caracteres | `src/modules/iam/presentation/dto/register-patient.dto.ts:365` |
| `gender` | `string` | No | valores: MALE, FEMALE, OTHER, UNKNOWN | `@IsOptional()` `@IsIn(ADMIN_GENDER_CODES)` | Género administrativo (HL7 AdministrativeGender) | `src/modules/iam/presentation/dto/register-patient.dto.ts:464` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:509` |
| `practitionerRoleAssignmentId` | `string` | Sí | formato uuid | `@IsUUID()` | ID de la vinculación del doctor (practitioner_role_assignment_id) | `src/modules/delegated_access/dto/create-practitioner-support-staff.dto.ts:18` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "password": "ClaveSegura2026!",
  "email": "usuario@example.com",
  "birthDate": "2026-07-31",
  "phone": "+59170000000",
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "password": "ClaveSegura2026!",
  "name": "Lucía",
  "middleName": "Andrea",
  "lastName": "Mamani",
  "motherLastName": "Quispe",
  "displayName": "Nombre de ejemplo",
  "email": "usuario@example.com",
  "birthDate": "2026-07-31",
  "phone": "+59170000000",
  "gender": "MALE",
  "timeZone": "America/La_Paz",
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<CreatedSupportStaffViewDto>` · DTO `CreatedSupportStaffViewDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `userId` | `string` | Sí | formato uuid | — | Cuenta de usuario creada o vinculada. | `src/modules/delegated_access/dto/created-support-staff-view.dto.ts:7` |
| `personId` | `string` | Sí | formato uuid | — | Persona de la secretaria. | `src/modules/delegated_access/dto/created-support-staff-view.dto.ts:11` |
| `supportProfileId` | `string` | Sí | formato uuid | — | Perfil de secretaria (`profiles.secretary_profiles.profile_id`). | `src/modules/delegated_access/dto/created-support-staff-view.dto.ts:15` |
| `linkId` | `string` | Sí | formato uuid | — | ID del vínculo de apoyo (`practitioner_support_assignment` u `organization_user_assignment`). | `src/modules/delegated_access/dto/created-support-staff-view.dto.ts:19` |
| `status` | `string` | Sí | valores: ACTIVE | — | Estado del vínculo creado (siempre ACTIVE). | `src/modules/delegated_access/dto/created-support-staff-view.dto.ts:23` |
| `organizationName` | `string` | No | — | — | Nombre del hospital u organización vinculada. | `src/modules/delegated_access/dto/created-support-staff-view.dto.ts:27` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Vinculación no encontrada o no pertenece al médico |
| 409 | `CONFLICT` | ConflictException: Ya existe una cuenta con ese documento de identidad; ConflictException: La secretaria ya tiene un vínculo activo con esta vinculación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PractitionerSupportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. GET /me/practitioner/support-team

- **Origen:** CONTRATO
- **Nombre:** Mi equipo de apoyo (secretarias)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSupportController.team` — `src/modules/delegated_access/controllers/practitioner-support.controller.ts:60`

### Qué es y para qué sirve (negocio)

Mi equipo de apoyo (secretarias). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /me/practitioner/support-team` la atiende `PractitionerSupportController.team` (src/modules/delegated_access/controllers/practitioner-support.controller.ts:60). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN, SUPPORT_STAFF. Delega en `SupportStaffService.practitionerTeam`. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN, SUPPORT_STAFF | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:60` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:60` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `directory.tenants` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `iam.users` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practices` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_support_assignments` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.persons` | LEE | LEE | POR_SQL | PractitionerSupportController.team → SupportStaffService.practitionerTeam → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportLinkListDto>` · DTO `SupportLinkListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SupportLinkViewDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:270` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `items[].kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `items[].targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `items[].tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `items[].organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `items[].userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `items[].personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `items[].status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `items[].initiatedBy` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `src/modules/delegated_access/dto/support-staff.dto.ts:231` |
| `items[].awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:237` |
| `items[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:239` |
| `items[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:241` |
| `items[].careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:243` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:245` |
| `items[].practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:247` |
| `items[].targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:253` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:254` |
| `count` | `number` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:271` |
| `nextCursor` | `string` | Sí | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:272` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PractitionerSupportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. POST /me/practitioner/support-team/{id}/end

- **Origen:** CONTRATO
- **Nombre:** Terminar el vínculo con una secretaria
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSupportController.end` — `src/modules/delegated_access/controllers/practitioner-support.controller.ts:117`

### Qué es y para qué sirve (negocio)

Terminar el vínculo con una secretaria. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /me/practitioner/support-team/{id}/end` la atiende `PractitionerSupportController.end` (src/modules/delegated_access/controllers/practitioner-support.controller.ts:117). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `SupportLinkReasonDto` (1 campo, 0 obligatorios). Delega en `SupportStaffService.endForPractitioner`. Actualiza directory.tenant_memberships. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:117` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:117` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:117` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:838` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportLinksRepository.closeMembershipIfUnused | `src/modules/delegated_access/repositories/support-links.repository.ts:710` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportLinksRepository.closeMembershipIfUnused | `src/modules/delegated_access/repositories/support-links.repository.ts:703` |
| `directory.tenants` | LEE | LEE | POR_SQL | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `iam.users` | LEE | LEE | POR_SQL | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practices` | LEE | LEE | POR_SQL | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_support_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:839` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.persons` | LEE | LEE | POR_SQL | PractitionerSupportController.end → SupportStaffService.endForPractitioner → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SupportLinkReasonDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:167` |

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

### Respuesta — `Promise<SupportLinkViewDto>` · DTO `SupportLinkViewDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `initiatedBy` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `src/modules/delegated_access/dto/support-staff.dto.ts:231` |
| `awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:237` |
| `practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:239` |
| `clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:241` |
| `careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:243` |
| `practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:245` |
| `practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:247` |
| `targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:253` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:254` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se termina un vínculo activo o pendiente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PractitionerSupportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. GET /me/support-access

- **Origen:** CONTRATO
- **Nombre:** Mi alcance: hospitales, doctores y pisos de mis vínculos activos
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.access` — `src/modules/delegated_access/controllers/support-staff.controller.ts:82`

### Qué es y para qué sirve (negocio)

Mi alcance: hospitales, doctores y pisos de mis vínculos activos. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /me/support-access` la atiende `SupportStaffController.access` (src/modules/delegated_access/controllers/support-staff.controller.ts:82). Exige sesión con alguno de los roles SUPPORT_STAFF. Delega en `SupportStaffService.myAccess`. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPPORT_STAFF | `src/modules/delegated_access/controllers/support-staff.controller.ts:82` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/support-staff.controller.ts:82` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportLinksRepository.findActiveMembershipTenantIds | `src/modules/delegated_access/repositories/support-links.repository.ts:333` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_support_assignments` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.access → SupportStaffService.myAccess → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportAccessResponseDto>` · DTO `SupportAccessResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenants` | `array<SupportTenantScopeDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:344` |
| `tenants[].tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:324` |
| `tenants[].organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:326` |
| `tenants[].wholeOrganization` | `boolean` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:327` |
| `tenants[].organizationAccess` | `boolean` | Sí | — | — | El hospital aprobó a la secretaria y entra a su token. false = sólo un doctor la aceptó: ve su agenda y nada más del hospital. | `src/modules/delegated_access/dto/support-staff.dto.ts:332` |
| `tenants[].practiceSiteIds` | `array<string>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:333` |
| `tenants[].clinicalUnitIds` | `array<string>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:334` |
| `tenants[].careSpaceIds` | `array<string>` | Sí | — | — | Pisos y espacios. | `src/modules/delegated_access/dto/support-staff.dto.ts:336` |
| `tenants[].practitioners` | `array<SupportScopePractitionerDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:338` |
| `tenants[].practitioners[].linkId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:315` |
| `tenants[].practitioners[].practitionerRoleAssignmentId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:316` |
| `tenants[].practitioners[].practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:318` |
| `tenants[].practitioners[].name` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:319` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. GET /me/support-agenda

- **Origen:** CONTRATO
- **Nombre:** Agenda de un doctor asignado (403 si no hay vínculo activo)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.agenda` — `src/modules/delegated_access/controllers/support-staff.controller.ts:192`

### Qué es y para qué sirve (negocio)

Agenda de un doctor asignado (403 si no hay vínculo activo). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /me/support-agenda` la atiende `SupportStaffController.agenda` (src/modules/delegated_access/controllers/support-staff.controller.ts:192). Exige sesión con alguno de los roles SUPPORT_STAFF. Delega en `SupportStaffService.agenda`. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 8 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPPORT_STAFF | `src/modules/delegated_access/controllers/support-staff.controller.ts:192` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/support-staff.controller.ts:192` |
| PARAMETRO_QUERY | tenantId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | practitionerRoleAssignmentId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | from (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | to (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportLinksRepository.findActiveRoleAssignmentInTenant | `src/modules/delegated_access/repositories/support-links.repository.ts:432` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportLinksRepository.findActiveRoleAssignmentInTenant | `src/modules/delegated_access/repositories/support-links.repository.ts:432` |
| `practice.practitioner_support_assignments` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportStaffService.scopeOf → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportLinksRepository.findPractitionerAgenda | `src/modules/delegated_access/repositories/support-links.repository.ts:597` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportLinksRepository.findPractitionerAgenda | `src/modules/delegated_access/repositories/support-links.repository.ts:597` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportLinksRepository.findPractitionerAgenda | `src/modules/delegated_access/repositories/support-links.repository.ts:597` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportLinksRepository.findPractitionerAgenda | `src/modules/delegated_access/repositories/support-links.repository.ts:597` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | SupportStaffController.agenda → SupportStaffService.agenda → SupportLinksRepository.findPractitionerAgenda | `src/modules/delegated_access/repositories/support-links.repository.ts:597` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | query | Sí | `string` | — |
| `practitionerRoleAssignmentId` | query | Sí | `string` | — |
| `from` | query | Sí | `string` | — |
| `to` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportAgendaResponseDto>` · DTO `SupportAgendaResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SupportAgendaItemDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:361` |
| `items[].bookingId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:349` |
| `items[].startAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:350` |
| `items[].endAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:351` |
| `items[].statusCode` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:353` |
| `items[].patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:354` |
| `items[].patientName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:356` |
| `count` | `number` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:362` |
| `truncated` | `boolean` | Sí | — | — | true = el rango tiene más turnos que `limit` y se devolvieron los primeros por hora; acote el rango y vuelva a pedir. | `src/modules/delegated_access/dto/support-staff.dto.ts:367` |
| `limit` | `number` | Sí | — | — | Tope de turnos por respuesta. | `src/modules/delegated_access/dto/support-staff.dto.ts:369` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El rango tiene que ser positivo y de {MAX_AGENDA_DAYS} días como mucho |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. GET /me/support-catalog

- **Origen:** CONTRATO
- **Nombre:** Sedes, servicios, pisos y doctores de un hospital para pedir
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.catalog` — `src/modules/delegated_access/controllers/support-staff.controller.ts:95`

### Qué es y para qué sirve (negocio)

Sedes, servicios, pisos y doctores de un hospital para pedir. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /me/support-catalog` la atiende `SupportStaffController.catalog` (src/modules/delegated_access/controllers/support-staff.controller.ts:95). Exige sesión con alguno de los roles SUPPORT_STAFF. Delega en `SupportStaffService.catalogForSupport`. Lee directory.tenants, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices, practice.practitioner_role_assignments, profiles.person_account_links, profiles.persons y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPPORT_STAFF | `src/modules/delegated_access/controllers/support-staff.controller.ts:95` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/support-staff.controller.ts:95` |
| PARAMETRO_QUERY | org (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.catalog → SupportStaffService.catalogForSupport → SupportStaffService.catalog → SupportLinksRepository.findOrganizationName | `src/modules/delegated_access/repositories/support-links.repository.ts:346` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.catalog → SupportStaffService.catalogForSupport → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:509` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.catalog → SupportStaffService.catalogForSupport → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:497` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.catalog → SupportStaffService.catalogForSupport → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:482` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.catalog → SupportStaffService.catalogForSupport → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:482` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.catalog → SupportStaffService.catalogForSupport → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:523` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.catalog → SupportStaffService.catalogForSupport → SupportStaffService.requireSecretaryPerson → SupportLinksRepository.findSecretaryPersonId | `src/modules/delegated_access/repositories/support-links.repository.ts:269` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.catalog → SupportStaffService.catalogForSupport → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:523` |
| `profiles.secretary_profiles` | LEE | LEE | POR_SQL | SupportStaffController.catalog → SupportStaffService.catalogForSupport → SupportStaffService.requireSecretaryPerson → SupportLinksRepository.findSecretaryPersonId | `src/modules/delegated_access/repositories/support-links.repository.ts:269` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `org` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportCatalogResponseDto>` · DTO `SupportCatalogResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:297` |
| `organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:299` |
| `sites` | `array<SupportCatalogEntryDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:301` |
| `sites[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:285` |
| `sites[].name` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:286` |
| `sites[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:288` |
| `sites[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:290` |
| `sites[].practitionerProfileId` | `string` | No | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:292` |
| `services` | `array<SupportCatalogEntryDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:303` |
| `services[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:285` |
| `services[].name` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:286` |
| `services[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:288` |
| `services[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:290` |
| `services[].practitionerProfileId` | `string` | No | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:292` |
| `floors` | `array<SupportCatalogEntryDto>` | Sí | — | — | Pisos. | `src/modules/delegated_access/dto/support-staff.dto.ts:305` |
| `floors[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:285` |
| `floors[].name` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:286` |
| `floors[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:288` |
| `floors[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:290` |
| `floors[].practitionerProfileId` | `string` | No | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:292` |
| `practitioners` | `array<SupportCatalogEntryDto>` | Sí | — | — | Doctores: `id` es su vinculación con el hospital. | `src/modules/delegated_access/dto/support-staff.dto.ts:310` |
| `practitioners[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:285` |
| `practitioners[].name` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:286` |
| `practitioners[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:288` |
| `practitioners[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:290` |
| `practitioners[].practitionerProfileId` | `string` | No | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:292` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Organización no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. GET /me/support-engagements

- **Origen:** CONTRATO
- **Nombre:** Mis vínculos de apoyo y mis solicitudes
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.mine` — `src/modules/delegated_access/controllers/support-staff.controller.ts:71`

### Qué es y para qué sirve (negocio)

Mis vínculos de apoyo y mis solicitudes. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /me/support-engagements` la atiende `SupportStaffController.mine` (src/modules/delegated_access/controllers/support-staff.controller.ts:71). Exige sesión con alguno de los roles SUPPORT_STAFF. Delega en `SupportStaffService.listMine`. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPPORT_STAFF | `src/modules/delegated_access/controllers/support-staff.controller.ts:71` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/support-staff.controller.ts:71` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_support_assignments` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.mine → SupportStaffService.listMine → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MySupportEngagementsResponseDto>` · DTO `MySupportEngagementsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SupportLinkViewDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:259` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `items[].kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `items[].targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `items[].tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `items[].organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `items[].userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `items[].personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `items[].status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `items[].initiatedBy` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `src/modules/delegated_access/dto/support-staff.dto.ts:231` |
| `items[].awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:237` |
| `items[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:239` |
| `items[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:241` |
| `items[].careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:243` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:245` |
| `items[].practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:247` |
| `items[].targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:253` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:254` |
| `count` | `number` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:260` |
| `requests` | `array<SupportLinkViewDto>` | Sí | — | — | Los vínculos todavía PENDING (pedidos o invitaciones). | `src/modules/delegated_access/dto/support-staff.dto.ts:265` |
| `requests[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `requests[].kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `requests[].targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `requests[].tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `requests[].organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `requests[].userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `requests[].personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `requests[].status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `requests[].initiatedBy` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `src/modules/delegated_access/dto/support-staff.dto.ts:231` |
| `requests[].awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:237` |
| `requests[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:239` |
| `requests[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:241` |
| `requests[].careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:243` |
| `requests[].practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:245` |
| `requests[].practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:247` |
| `requests[].targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:253` |
| `requests[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:254` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. POST /me/support-engagements/{id}/confirm

- **Origen:** CONTRATO
- **Nombre:** Aceptar una invitación de apoyo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.confirm` — `src/modules/delegated_access/controllers/support-staff.controller.ts:131`

### Qué es y para qué sirve (negocio)

Aceptar una invitación de apoyo. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /me/support-engagements/{id}/confirm` la atiende `SupportStaffController.confirm` (src/modules/delegated_access/controllers/support-staff.controller.ts:131). Exige sesión con alguno de los roles SUPPORT_STAFF. Delega en `SupportStaffService.confirmMine`. Crea filas en directory.tenant_memberships. Actualiza directory.tenant_memberships. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPPORT_STAFF | `src/modules/delegated_access/controllers/support-staff.controller.ts:131` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/support-staff.controller.ts:131` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/support-staff.controller.ts:131` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:838` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportLinksRepository.activateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:680` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportLinksRepository.activateMembership → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:644` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportLinksRepository.closeMembershipIfUnused | `src/modules/delegated_access/repositories/support-links.repository.ts:703` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_support_assignments` | LEE | LEE | DIRECTA | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:839` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.confirm → SupportStaffService.confirmMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportLinkViewDto>` · DTO `SupportLinkViewDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `initiatedBy` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `src/modules/delegated_access/dto/support-staff.dto.ts:231` |
| `awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:237` |
| `practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:239` |
| `clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:241` |
| `careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:243` |
| `practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:245` |
| `practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:247` |
| `targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:253` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:254` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese vínculo no está esperando su decisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. POST /me/support-engagements/{id}/decline

- **Origen:** CONTRATO
- **Nombre:** Rechazar una invitación de apoyo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.decline` — `src/modules/delegated_access/controllers/support-staff.controller.ts:149`

### Qué es y para qué sirve (negocio)

Rechazar una invitación de apoyo. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /me/support-engagements/{id}/decline` la atiende `SupportStaffController.decline` (src/modules/delegated_access/controllers/support-staff.controller.ts:149). Exige sesión con alguno de los roles SUPPORT_STAFF. Valida el cuerpo como `SupportLinkReasonDto` (1 campo, 0 obligatorios). Delega en `SupportStaffService.declineMine`. Crea filas en directory.tenant_memberships. Actualiza directory.tenant_memberships. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPPORT_STAFF | `src/modules/delegated_access/controllers/support-staff.controller.ts:149` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/support-staff.controller.ts:149` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/support-staff.controller.ts:149` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:838` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportLinksRepository.activateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:680` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportLinksRepository.activateMembership → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:644` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportLinksRepository.closeMembershipIfUnused | `src/modules/delegated_access/repositories/support-links.repository.ts:703` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_support_assignments` | LEE | LEE | DIRECTA | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:839` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.decline → SupportStaffService.declineMine → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SupportLinkReasonDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:167` |

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

### Respuesta — `Promise<SupportLinkViewDto>` · DTO `SupportLinkViewDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `initiatedBy` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `src/modules/delegated_access/dto/support-staff.dto.ts:231` |
| `awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:237` |
| `practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:239` |
| `clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:241` |
| `careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:243` |
| `practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:245` |
| `practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:247` |
| `targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:253` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:254` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese vínculo no está esperando su decisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. POST /me/support-engagements/{id}/leave

- **Origen:** CONTRATO
- **Nombre:** Dejar un vínculo o retirar mi pedido
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.leave` — `src/modules/delegated_access/controllers/support-staff.controller.ts:168`

### Qué es y para qué sirve (negocio)

Dejar un vínculo o retirar mi pedido. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /me/support-engagements/{id}/leave` la atiende `SupportStaffController.leave` (src/modules/delegated_access/controllers/support-staff.controller.ts:168). Exige sesión con alguno de los roles SUPPORT_STAFF. Delega en `SupportStaffService.leaveMine`. Actualiza directory.tenant_memberships. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPPORT_STAFF | `src/modules/delegated_access/controllers/support-staff.controller.ts:168` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/support-staff.controller.ts:168` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/support-staff.controller.ts:168` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:838` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportLinksRepository.closeMembershipIfUnused | `src/modules/delegated_access/repositories/support-links.repository.ts:710` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportLinksRepository.closeMembershipIfUnused | `src/modules/delegated_access/repositories/support-links.repository.ts:703` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_support_assignments` | LEE | LEE | DIRECTA | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:839` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.leave → SupportStaffService.leaveMine → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportLinkViewDto>` · DTO `SupportLinkViewDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `initiatedBy` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `src/modules/delegated_access/dto/support-staff.dto.ts:231` |
| `awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:237` |
| `practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:239` |
| `clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:241` |
| `careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:243` |
| `practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:245` |
| `practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:247` |
| `targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:253` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:254` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se termina un vínculo activo o pendiente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. POST /org/{tenantMembershipId}/user-assignments

- **Origen:** CONTRATO
- **Nombre:** Asignar usuario de organización con alcance y vigencia
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrgUserAssignmentsController.create` — `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:39`

### Qué es y para qué sirve (negocio)

Asignar usuario de organización con alcance y vigencia. Caso de uso UC-29-01: Asignar usuario de organización (scoped, vigente). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:107`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /org/{tenantMembershipId}/user-assignments` la atiende `OrgUserAssignmentsController.create` (src/modules/delegated_access/controllers/org-user-assignments.controller.ts:39). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateOrgUserAssignmentDto` (11 campos, 0 obligatorios). Delega en `OrgUserAssignmentsService.createAssignment`. Crea filas en delegated_access.organization_user_assignments. Lee delegated_access.organization_user_assignments, directory.tenant_memberships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:39` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantMembershipId | `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:39` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | ESCRIBE | CREA | DIRECTA | OrgUserAssignmentsController.create → OrgUserAssignmentsService.createAssignment → OrganizationUserAssignmentsRepository.create | `src/modules/delegated_access/repositories/organization-user-assignments.repository.ts:140` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | OrgUserAssignmentsController.create → OrgUserAssignmentsService.createAssignment → OrganizationUserAssignmentsRepository.findActiveOverlap | `src/modules/delegated_access/repositories/organization-user-assignments.repository.ts:121` |
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | OrgUserAssignmentsController.create → OrgUserAssignmentsService.createAssignment → OrganizationUserAssignmentsRepository.findMembershipTenantId | `src/modules/delegated_access/repositories/organization-user-assignments.repository.ts:106` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantMembershipId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateOrgUserAssignmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `role` | `string` | No | valores: STAFF, SECRETARY, ASSISTANT, BILLING, OR_MANAGER, INFECTION_CONTROL, UNIT_HEAD | `@IsOptional()` `@IsIn(ROLES)` | Rol de la asignación | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:26` |
| `accessScope` | `string` | No | valores: TENANT, PRACTICE, SITE, UNIT, SPACE | `@IsOptional()` `@IsIn(SCOPES)` | Alcance de acceso | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:34` |
| `practiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nodo de scope: práctica | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:45` |
| `practiceSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nodo de scope: sede de práctica | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:56` |
| `clinicalUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nodo de scope: unidad clínica | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:67` |
| `careSpaceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nodo de scope: care space | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:78` |
| `diagnosticUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nodo de scope: unidad de diagnóstico | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:89` |
| `pharmacyId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nodo de scope: farmacia | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:100` |
| `supervisorUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Supervisor responsable | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:111` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de vigencia (ISO) | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:122` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fin de vigencia (ISO) | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:133` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "role": "STAFF",
  "accessScope": "TENANT",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "diagnosticUnitId": "00000000-0000-4000-8000-000000000001",
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "supervisorUserId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/delegated_access/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/delegated_access/dto/responses.dto.ts:15` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Membresía no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya existe una asignación activa con ese rol y alcance |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-f5.int-spec.ts:675` |
| CONTROLADOR | `src/modules/delegated_access/controllers/org-user-assignments.controller.spec.ts:28` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-01`

---

## 27. GET /org/affiliation-invitations

- **Origen:** CONTRATO
- **Nombre:** Listar los códigos de afiliación de la organización
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AffiliationInvitationsController.list` — `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:82`

### Qué es y para qué sirve (negocio)

Listar los códigos de afiliación de la organización. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /org/affiliation-invitations` la atiende `AffiliationInvitationsController.list` (src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:82). Exige sesión; el controlador no declara roles. Delega en `AffiliationInvitationsService.list`. Lee directory.affiliation_invitations, directory.tenant_memberships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:82` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.affiliation_invitations` | LEE | LEE | POR_SQL | AffiliationInvitationsController.list → AffiliationInvitationsService.list → AffiliationInvitationsRepository.listByTenant | `src/modules/delegated_access/repositories/affiliation-invitations.repository.ts:70` |
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | AffiliationInvitationsController.list → AffiliationInvitationsService.list → AffiliationInvitationsService.assertOrganizationAdmin → SupportLinksRepository.isOrganizationAdmin | `src/modules/delegated_access/repositories/support-links.repository.ts:319` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListAffiliationInvitationsResponseDto>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/affiliation-invitations-revoke.int-spec.ts:97` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:AffiliationInvitationsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 28. POST /org/affiliation-invitations

- **Origen:** CONTRATO
- **Nombre:** Crear un código o QR de afiliación
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AffiliationInvitationsController.create` — `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:45`

### Qué es y para qué sirve (negocio)

Crear un código o QR de afiliación. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /org/affiliation-invitations` la atiende `AffiliationInvitationsController.create` (src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:45). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateAffiliationInvitationDto` (5 campos, 3 obligatorios). Delega en `AffiliationInvitationsService.create`. Crea filas en directory.affiliation_invitations. Lee directory.tenant_memberships, practice.practice_sites, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:45` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 20, ttl: 60_000 } }) | `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:45` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.affiliation_invitations` | ESCRIBE | CREA | POR_SQL | AffiliationInvitationsController.create → AffiliationInvitationsService.create → AffiliationInvitationsRepository.insert | `src/modules/delegated_access/repositories/affiliation-invitations.repository.ts:44` |
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | AffiliationInvitationsController.create → AffiliationInvitationsService.create → AffiliationInvitationsService.assertOrganizationAdmin → SupportLinksRepository.isOrganizationAdmin | `src/modules/delegated_access/repositories/support-links.repository.ts:319` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | AffiliationInvitationsController.create → AffiliationInvitationsService.create → AffiliationInvitationsRepository.findFirstActiveSite | `src/modules/delegated_access/repositories/affiliation-invitations.repository.ts:185` |
| `practice.practices` | LEE | LEE | POR_SQL | AffiliationInvitationsController.create → AffiliationInvitationsService.create → AffiliationInvitationsRepository.findFirstActiveSite | `src/modules/delegated_access/repositories/affiliation-invitations.repository.ts:185` |

### Cuerpo — DTO `CreateAffiliationInvitationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `kind` | `string` | Sí | valores: PRACTITIONER, SUPPORT_STAFF | `@IsIn(AFFILIATION_INVITATION_KINDS)` | — | `src/modules/delegated_access/dto/affiliation-invitation.dto.ts:25` |
| `targetPersonId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/affiliation-invitation.dto.ts:31` |
| `maxUses` | `number` | Sí | mínimo 1; máximo 500 | `@Type(() => Number)` `@IsInt()` `@Min(1)` `@Max(500)` | — | `src/modules/delegated_access/dto/affiliation-invitation.dto.ts:38` |
| `expiresInDays` | `number` | Sí | mínimo 1; máximo 90 | `@Type(() => Number)` `@IsInt()` `@Min(1)` `@Max(90)` | — | `src/modules/delegated_access/dto/affiliation-invitation.dto.ts:45` |
| `roleTemplateCode` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/delegated_access/dto/affiliation-invitation.dto.ts:51` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "kind": "PRACTITIONER",
  "maxUses": 1,
  "expiresInDays": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "kind": "PRACTITIONER",
  "targetPersonId": "00000000-0000-4000-8000-000000000001",
  "maxUses": 1,
  "expiresInDays": 1,
  "roleTemplateCode": "CODIGO_EJEMPLO"
}
```

</details>

### Respuesta — `Promise<AffiliationInvitationViewDto>` · HTTP `HttpStatus.CREATED`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La organización necesita una sede activa para recibir solicitudes de médicos |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/affiliation-invitations-revoke.int-spec.ts:43` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:AffiliationInvitationsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. POST /org/affiliation-invitations/{id}/revoke

- **Origen:** CONTRATO
- **Nombre:** Revocar un código o QR de afiliación
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AffiliationInvitationsController.revoke` — `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:65`

### Qué es y para qué sirve (negocio)

Revocar un código o QR de afiliación. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /org/affiliation-invitations/{id}/revoke` la atiende `AffiliationInvitationsController.revoke` (src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:65). Exige sesión; el controlador no declara roles. Delega en `AffiliationInvitationsService.revoke`. Actualiza directory.affiliation_invitations. Lee directory.tenant_memberships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:65` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:65` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 20, ttl: 60_000 } }) | `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:65` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.affiliation_invitations` | ESCRIBE | ACTUALIZA | POR_SQL | AffiliationInvitationsController.revoke → AffiliationInvitationsService.revoke → AffiliationInvitationsRepository.revoke | `src/modules/delegated_access/repositories/affiliation-invitations.repository.ts:88` |
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | AffiliationInvitationsController.revoke → AffiliationInvitationsService.revoke → AffiliationInvitationsService.assertOrganizationAdmin → SupportLinksRepository.isOrganizationAdmin | `src/modules/delegated_access/repositories/support-links.repository.ts:319` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AffiliationInvitationViewDto>` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Código de afiliación no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/affiliation-invitations-revoke.int-spec.ts:83` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:AffiliationInvitationsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 30. GET /org/support-catalog

- **Origen:** CONTRATO
- **Nombre:** Sedes, servicios, pisos y doctores para invitar
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.orgCatalog` — `src/modules/delegated_access/controllers/support-staff.controller.ts:212`

### Qué es y para qué sirve (negocio)

Sedes, servicios, pisos y doctores para invitar. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /org/support-catalog` la atiende `SupportStaffController.orgCatalog` (src/modules/delegated_access/controllers/support-staff.controller.ts:212). Exige sesión; el controlador no declara roles. Delega en `SupportStaffService.catalogForOrganization`. Lee directory.tenant_memberships, directory.tenants, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices, practice.practitioner_role_assignments, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/support-staff.controller.ts:212` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | SupportStaffController.orgCatalog → SupportStaffService.catalogForOrganization → SupportStaffService.assertOrganizationAdmin → SupportLinksRepository.isOrganizationAdmin | `src/modules/delegated_access/repositories/support-links.repository.ts:319` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.orgCatalog → SupportStaffService.catalogForOrganization → SupportStaffService.catalog → SupportLinksRepository.findOrganizationName | `src/modules/delegated_access/repositories/support-links.repository.ts:346` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.orgCatalog → SupportStaffService.catalogForOrganization → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:509` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.orgCatalog → SupportStaffService.catalogForOrganization → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:497` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.orgCatalog → SupportStaffService.catalogForOrganization → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:482` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.orgCatalog → SupportStaffService.catalogForOrganization → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:482` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.orgCatalog → SupportStaffService.catalogForOrganization → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:523` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.orgCatalog → SupportStaffService.catalogForOrganization → SupportStaffService.catalog → SupportLinksRepository.findCatalog | `src/modules/delegated_access/repositories/support-links.repository.ts:523` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportCatalogResponseDto>` · DTO `SupportCatalogResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:297` |
| `organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:299` |
| `sites` | `array<SupportCatalogEntryDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:301` |
| `sites[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:285` |
| `sites[].name` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:286` |
| `sites[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:288` |
| `sites[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:290` |
| `sites[].practitionerProfileId` | `string` | No | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:292` |
| `services` | `array<SupportCatalogEntryDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:303` |
| `services[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:285` |
| `services[].name` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:286` |
| `services[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:288` |
| `services[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:290` |
| `services[].practitionerProfileId` | `string` | No | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:292` |
| `floors` | `array<SupportCatalogEntryDto>` | Sí | — | — | Pisos. | `src/modules/delegated_access/dto/support-staff.dto.ts:305` |
| `floors[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:285` |
| `floors[].name` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:286` |
| `floors[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:288` |
| `floors[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:290` |
| `floors[].practitionerProfileId` | `string` | No | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:292` |
| `practitioners` | `array<SupportCatalogEntryDto>` | Sí | — | — | Doctores: `id` es su vinculación con el hospital. | `src/modules/delegated_access/dto/support-staff.dto.ts:310` |
| `practitioners[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:285` |
| `practitioners[].name` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:286` |
| `practitioners[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:288` |
| `practitioners[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:290` |
| `practitioners[].practitionerProfileId` | `string` | No | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:292` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Organización no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 31. GET /org/support-engagement-requests

- **Origen:** CONTRATO
- **Nombre:** Solicitudes e invitaciones de apoyo del hospital
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.orgRequests` — `src/modules/delegated_access/controllers/support-staff.controller.ts:221`

### Qué es y para qué sirve (negocio)

Solicitudes e invitaciones de apoyo del hospital. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /org/support-engagement-requests` la atiende `SupportStaffController.orgRequests` (src/modules/delegated_access/controllers/support-staff.controller.ts:221). Exige sesión; el controlador no declara roles. Delega en `SupportStaffService.listForOrganization`. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/support-staff.controller.ts:221` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_support_assignments` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.orgRequests → SupportStaffService.listForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `status` | query | No | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportLinkListDto>` · DTO `SupportLinkListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SupportLinkViewDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:270` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `items[].kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `items[].targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `items[].tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `items[].organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `items[].userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `items[].personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `items[].status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `items[].initiatedBy` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `src/modules/delegated_access/dto/support-staff.dto.ts:231` |
| `items[].awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:237` |
| `items[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:239` |
| `items[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:241` |
| `items[].careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:243` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:245` |
| `items[].practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:247` |
| `items[].targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:253` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:254` |
| `count` | `number` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:271` |
| `nextCursor` | `string` | Sí | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:272` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 32. POST /org/support-engagement-requests/{id}/decision

- **Origen:** CONTRATO
- **Nombre:** Aceptar o rechazar una solicitud de apoyo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.decide` — `src/modules/delegated_access/controllers/support-staff.controller.ts:240`

### Qué es y para qué sirve (negocio)

Aceptar o rechazar una solicitud de apoyo. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /org/support-engagement-requests/{id}/decision` la atiende `SupportStaffController.decide` (src/modules/delegated_access/controllers/support-staff.controller.ts:240). Exige sesión; el controlador no declara roles. Valida el cuerpo como `DecideSupportLinkDto` (2 campos, 1 obligatorio). Delega en `SupportStaffService.decideForOrganization`. Crea filas en directory.tenant_memberships. Actualiza directory.tenant_memberships. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/support-staff.controller.ts:240` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/support-staff.controller.ts:240` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:838` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportLinksRepository.activateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:680` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportLinksRepository.activateMembership → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:644` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportLinksRepository.closeMembershipIfUnused | `src/modules/delegated_access/repositories/support-links.repository.ts:703` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_support_assignments` | LEE | LEE | DIRECTA | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:839` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.decide → SupportStaffService.decideForOrganization → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DecideSupportLinkDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: APPROVED, REJECTED | `@IsIn(['APPROVED', 'REJECTED'])` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:150` |
| `reasonText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:157` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decision": "APPROVED"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "APPROVED",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<SupportLinkViewDto>` · DTO `SupportLinkViewDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `initiatedBy` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `src/modules/delegated_access/dto/support-staff.dto.ts:231` |
| `awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:237` |
| `practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:239` |
| `clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:241` |
| `careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:243` |
| `practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:245` |
| `practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:247` |
| `targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:253` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:254` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese vínculo no está esperando su decisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 33. GET /org/support-engagements

- **Origen:** CONTRATO
- **Nombre:** Personal de apoyo del hospital
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.orgEngagements` — `src/modules/delegated_access/controllers/support-staff.controller.ts:262`

### Qué es y para qué sirve (negocio)

Personal de apoyo del hospital. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /org/support-engagements` la atiende `SupportStaffController.orgEngagements` (src/modules/delegated_access/controllers/support-staff.controller.ts:262). Exige sesión; el controlador no declara roles. Delega en `SupportStaffService.listEngagementsForOrganization`. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/support-staff.controller.ts:262` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_support_assignments` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.orgEngagements → SupportStaffService.listEngagementsForOrganization → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportLinkListDto>` · DTO `SupportLinkListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SupportLinkViewDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:270` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `items[].kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `items[].targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `items[].tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `items[].organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `items[].userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `items[].personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `items[].status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `items[].initiatedBy` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `src/modules/delegated_access/dto/support-staff.dto.ts:231` |
| `items[].awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:237` |
| `items[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:239` |
| `items[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:241` |
| `items[].careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:243` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:245` |
| `items[].practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:247` |
| `items[].targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:253` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:254` |
| `count` | `number` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:271` |
| `nextCursor` | `string` | Sí | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:272` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 34. POST /org/support-engagements/{id}/end

- **Origen:** CONTRATO
- **Nombre:** Terminar un vínculo de apoyo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.end` — `src/modules/delegated_access/controllers/support-staff.controller.ts:274`

### Qué es y para qué sirve (negocio)

Terminar un vínculo de apoyo. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /org/support-engagements/{id}/end` la atiende `SupportStaffController.end` (src/modules/delegated_access/controllers/support-staff.controller.ts:274). Exige sesión; el controlador no declara roles. Valida el cuerpo como `SupportLinkReasonDto` (1 campo, 0 obligatorios). Delega en `SupportStaffService.endForOrganization`. Actualiza directory.tenant_memberships. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/support-staff.controller.ts:274` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/support-staff.controller.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:838` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportLinksRepository.closeMembershipIfUnused | `src/modules/delegated_access/repositories/support-links.repository.ts:710` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportLinksRepository.closeMembershipIfUnused | `src/modules/delegated_access/repositories/support-links.repository.ts:703` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_support_assignments` | LEE | LEE | DIRECTA | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:839` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.end → SupportStaffService.endForOrganization → SupportStaffService.end → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SupportLinkReasonDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:167` |

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

### Respuesta — `Promise<SupportLinkViewDto>` · DTO `SupportLinkViewDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `initiatedBy` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `src/modules/delegated_access/dto/support-staff.dto.ts:231` |
| `awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:237` |
| `practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:239` |
| `clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:241` |
| `careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:243` |
| `practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:245` |
| `practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:247` |
| `targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:253` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:254` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 35. POST /org/support-staff

- **Origen:** CONTRATO
- **Nombre:** Crear cuenta de secretaria y vincularla a la organización de inmediato
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrgSupportStaffProvisioningController.create` — `src/modules/delegated_access/controllers/org-support-staff-provisioning.controller.ts:31`

### Qué es y para qué sirve (negocio)

Crear cuenta de secretaria y vincularla a la organización de inmediato. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /org/support-staff` la atiende `OrgSupportStaffProvisioningController.create` (src/modules/delegated_access/controllers/org-support-staff-provisioning.controller.ts:31). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateOrgSupportStaffDto` (18 campos, 6 obligatorios). Delega en `SupportStaffProvisioningService.provisionForOrganization`. Crea filas en common.contact_points, common.identifiers, delegated_access.organization_user_assignments, directory.tenant_memberships, iam.authentication_credentials, iam.email_verifications, iam.security_events, iam.user_global_roles y 6 más. Lee directory.tenant_memberships, iam.authentication_credentials, messaging.message_channels, messaging.message_templates, messaging.notification_requests, messaging.recipient_preferences, terminology.value_set_members, terminology.value_set_versions y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/org-support-staff-provisioning.controller.ts:31` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/delegated_access/controllers/org-support-staff-provisioning.controller.ts:31` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.contact_points` | ESCRIBE | CREA | DIRECTA | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → CommonRecordsAdapter.createContactPoint → ContactPointsRepository.create | `src/modules/common/repositories/contact-points.repository.ts:198` |
| `common.identifiers` | ESCRIBE | CREA | DIRECTA | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → CommonRecordsAdapter.createIdentifier → IdentifiersRepository.create | `src/modules/common/repositories/identifiers.repository.ts:131` |
| `delegated_access.organization_user_assignments` | ESCRIBE | CREA | POR_SQL | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningRepository.createActiveLocationLink | `src/modules/delegated_access/repositories/support-staff-provisioning.repository.ts:127` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningRepository.ensureActiveTenantMembership | `src/modules/delegated_access/repositories/support-staff-provisioning.repository.ts:168` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningRepository.ensureActiveTenantMembership | `src/modules/delegated_access/repositories/support-staff-provisioning.repository.ts:150` |
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → CredentialsRepository.createPassword | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:323` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → CredentialsRepository.findLivePasswordBySubject | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:205` |
| `iam.email_verifications` | ESCRIBE | CREA | DIRECTA | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → EmailVerificationsRepository.create | `src/modules/iam/infrastructure/repositories/email-verifications.repository.ts:41` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:47` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → UserGlobalRolesRepository.create | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:27` |
| `iam.users` | ESCRIBE | CREA | DIRECTA | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → UsersRepository.create | `src/modules/iam/infrastructure/repositories/users.repository.ts:104` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → IamSupportStaffSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:141` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → IamSupportStaffSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:155` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → IamSupportStaffSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:272` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → IamSupportStaffSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:390` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → IamSupportStaffSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:214` |
| `profiles.person_account_links` | ESCRIBE | CREA | DIRECTA | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → ProfilesRegistrationAdapter.createAccountLink → PersonAccountLinksRepository.create | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:50` |
| `profiles.person_profiles` | ESCRIBE | CREA | DIRECTA | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → ProfilesRegistrationAdapter.createPersonProfile → PersonProfilesRepository.create | `src/modules/profiles/infrastructure/repositories/person-profiles.repository.ts:57` |
| `profiles.persons` | ESCRIBE | CREA | DIRECTA | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → ProfilesRegistrationAdapter.createPerson → PersonsRepository.create | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:119` |
| `profiles.secretary_profiles` | ESCRIBE | CREA | DIRECTA | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → ProfilesRegistrationAdapter.createSecretaryProfile | `src/modules/iam/infrastructure/adapters/profiles-registration.adapter.ts:97` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → ProfilesRegistrationAdapter.assertIsAdministrativeArea → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:438` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → ProfilesRegistrationAdapter.assertIsAdministrativeArea → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:612` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | OrgSupportStaffProvisioningController.create → SupportStaffProvisioningService.provisionForOrganization → SupportStaffProvisioningService.obtainSecretary → IamSupportStaffSelfRegistrationService.register → ProfilesRegistrationAdapter.assertIsAdministrativeArea → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findByInternalCode → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:121` |

### Cuerpo — DTO `CreateOrgSupportStaffDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `nationalId` | `string` | Sí | longitud mínima 4; longitud máxima 40; patrón runtime /^[A-Za-z0-9.-]+$/ | `@IsString()` `@MinLength(4)` `@MaxLength(40)` `@Matches(/^[A-Za-z0-9.-]+$/, { message: 'El documento sólo admite letras, dígitos, punto y guion', })` | Documento de identidad con el que se iniciará sesión | `src/modules/iam/presentation/dto/register-patient.dto.ts:184` |
| `issuerAdministrativeAreaConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Departamento emisor del documento (catálogo VS_BO_DEPARTMENT) | `src/modules/iam/presentation/dto/register-patient.dto.ts:202` |
| `password` | `string` | Sí | longitud mínima 8; longitud máxima 200 | `@IsString()` `@MinLength(8)` `@MaxLength(200)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:234` |
| `name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: RegisterPatientDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:250` |
| `middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:262` |
| `lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: RegisterPatientDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:275` |
| `motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:287` |
| `displayName` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Forma anterior de declarar el nombre. Preferí name/lastName. | `src/modules/iam/presentation/dto/register-patient.dto.ts:306` |
| `email` | `string` | Sí | formato email; longitud máxima 320 | `@IsStrictEmail()` `@MaxLength(320)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:330` |
| `birthDate` | `string` | Sí | formato date | `@IsISO8601()` `@IsBirthDateInRange({ message: 'La fecha de nacimiento tiene que estar entre 1910 y hoy', })` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:344` |
| `phone` | `string` | Sí | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsString()` `@MaxLength(PHONE_MAX_LENGTH)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Teléfono de contacto en formato E.164 o nacional: dígitos, espacios, paréntesis, + y guion, mínimo 6 caracteres | `src/modules/iam/presentation/dto/register-patient.dto.ts:365` |
| `gender` | `string` | No | valores: MALE, FEMALE, OTHER, UNKNOWN | `@IsOptional()` `@IsIn(ADMIN_GENDER_CODES)` | Género administrativo (HL7 AdministrativeGender) | `src/modules/iam/presentation/dto/register-patient.dto.ts:464` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:509` |
| `targetKind` | `string` | No | valores: ORGANIZATION, SITE, SERVICE, SPACE, PRACTITIONER | `@IsOptional()` `@IsIn(SUPPORT_TARGET_KINDS)` | — | `src/modules/delegated_access/dto/create-org-support-staff.dto.ts:19` |
| `practiceSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/create-org-support-staff.dto.ts:25` |
| `clinicalUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/create-org-support-staff.dto.ts:31` |
| `careSpaceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/create-org-support-staff.dto.ts:37` |
| `practitionerRoleAssignmentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/create-org-support-staff.dto.ts:43` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "password": "ClaveSegura2026!",
  "email": "usuario@example.com",
  "birthDate": "2026-07-31",
  "phone": "+59170000000"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "password": "ClaveSegura2026!",
  "name": "Lucía",
  "middleName": "Andrea",
  "lastName": "Mamani",
  "motherLastName": "Quispe",
  "displayName": "Nombre de ejemplo",
  "email": "usuario@example.com",
  "birthDate": "2026-07-31",
  "phone": "+59170000000",
  "gender": "MALE",
  "timeZone": "America/La_Paz",
  "targetKind": "ORGANIZATION",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<CreatedSupportStaffViewDto>` · DTO `CreatedSupportStaffViewDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `userId` | `string` | Sí | formato uuid | — | Cuenta de usuario creada o vinculada. | `src/modules/delegated_access/dto/created-support-staff-view.dto.ts:7` |
| `personId` | `string` | Sí | formato uuid | — | Persona de la secretaria. | `src/modules/delegated_access/dto/created-support-staff-view.dto.ts:11` |
| `supportProfileId` | `string` | Sí | formato uuid | — | Perfil de secretaria (`profiles.secretary_profiles.profile_id`). | `src/modules/delegated_access/dto/created-support-staff-view.dto.ts:15` |
| `linkId` | `string` | Sí | formato uuid | — | ID del vínculo de apoyo (`practitioner_support_assignment` u `organization_user_assignment`). | `src/modules/delegated_access/dto/created-support-staff-view.dto.ts:19` |
| `status` | `string` | Sí | valores: ACTIVE | — | Estado del vínculo creado (siempre ACTIVE). | `src/modules/delegated_access/dto/created-support-staff-view.dto.ts:23` |
| `organizationName` | `string` | No | — | — | Nombre del hospital u organización vinculada. | `src/modules/delegated_access/dto/created-support-staff-view.dto.ts:27` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una cuenta con ese documento de identidad; ConflictException: La cuenta ya tiene una membresía en la organización que no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:OrgSupportStaffProvisioningController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 36. POST /org/team/invitations

- **Origen:** CONTRATO
- **Nombre:** Invitar a una secretaria a lugares o doctores
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.invite` — `src/modules/delegated_access/controllers/support-staff.controller.ts:291`

### Qué es y para qué sirve (negocio)

Invitar a una secretaria a lugares o doctores. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /org/team/invitations` la atiende `SupportStaffController.invite` (src/modules/delegated_access/controllers/support-staff.controller.ts:291). Exige sesión; el controlador no declara roles. Valida el cuerpo como `InviteSupportStaffDto` (7 campos, 3 obligatorios). Delega en `SupportStaffService.inviteForOrganization`. Crea filas en delegated_access.organization_user_assignments, directory.tenant_memberships, practice.practitioner_support_assignments. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.authentication_credentials, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/support-staff.controller.ts:291` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 20, ttl: 60_000 } }) | `src/modules/delegated_access/controllers/support-staff.controller.ts:291` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | ESCRIBE | CREA | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.createLocationLink | `src/modules/delegated_access/repositories/support-links.repository.ts:777` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:644` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:628` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findOrganizationName | `src/modules/delegated_access/repositories/support-links.repository.ts:346` |
| `iam.authentication_credentials` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.requireSecretaryByNationalId → SupportLinksRepository.findSecretaryByNationalId | `src/modules/delegated_access/repositories/support-links.repository.ts:293` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_support_assignments` | ESCRIBE | CREA | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.createPractitionerLink | `src/modules/delegated_access/repositories/support-links.repository.ts:798` |
| `practice.practitioner_support_assignments` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.requireSecretaryByNationalId → SupportLinksRepository.findSecretaryByNationalId | `src/modules/delegated_access/repositories/support-links.repository.ts:293` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.secretary_profiles` | LEE | LEE | POR_SQL | SupportStaffController.invite → SupportStaffService.inviteForOrganization → SupportStaffService.requireSecretaryByNationalId → SupportLinksRepository.findSecretaryByNationalId | `src/modules/delegated_access/repositories/support-links.repository.ts:293` |

### Cuerpo — DTO `InviteSupportStaffDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `nationalId` | `string` | Sí | longitud mínima 4; longitud máxima 40; patrón runtime NATIONAL_ID_PATTERN | `@IsString()` `@MinLength(4)` `@MaxLength(40)` `@Matches(NATIONAL_ID_PATTERN, { message: 'El documento sólo admite letras, dígitos, punto y guion', })` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:115` |
| `items` | `array<SupportTargetDto>` | Sí | mínimo 1 elemento(s); máximo 50 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(50)` `@ValidateNested({ each: true })` `@Type(() => SupportTargetDto)` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:124` |
| `items[].targetKind` | `string` | Sí | valores: ORGANIZATION, SITE, SERVICE, SPACE, PRACTITIONER | `@IsIn(SUPPORT_TARGET_KINDS)` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:42` |
| `items[].practiceSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:48` |
| `items[].clinicalUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:54` |
| `items[].careSpaceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:60` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:66` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "targetKind": "ORGANIZATION"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "targetKind": "ORGANIZATION",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

</details>

### Respuesta — `Promise<SupportLinksCreatedDto>` · DTO `SupportLinksCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del primer vínculo creado. | `src/modules/delegated_access/dto/support-staff.dto.ts:278` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:279` |
| `items` | `array<SupportLinkViewDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:280` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `items[].kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `items[].targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `items[].tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `items[].organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `items[].userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `items[].personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `items[].status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `items[].initiatedBy` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `src/modules/delegated_access/dto/support-staff.dto.ts:231` |
| `items[].awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:237` |
| `items[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:239` |
| `items[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:241` |
| `items[].careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:243` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:245` |
| `items[].practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:247` |
| `items[].targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:253` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:254` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No hay una secretaria registrada con ese documento; ResourceNotFoundException: Organización no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya hay un vínculo vivo con ese mismo objetivo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 37. PATCH /org/user-assignments/{id}

- **Origen:** CONTRATO
- **Nombre:** Reasignar supervisor / suspender asignación de organización
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrgUserAssignmentsController.update` — `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:59`

### Qué es y para qué sirve (negocio)

Reasignar supervisor / suspender asignación de organización. Caso de uso UC-29-10: Reasignar supervisor / suspender (cascada). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:117`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`PATCH /org/user-assignments/{id}` la atiende `OrgUserAssignmentsController.update` (src/modules/delegated_access/controllers/org-user-assignments.controller.ts:59). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `UpdateOrgUserAssignmentDto` (7 campos, 0 obligatorios). Delega en `OrgUserAssignmentsService.updateAssignment`. Crea filas en messaging.domain_events, messaging.outbox_messages. Actualiza delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, messaging.outbox_messages. Publica delegated_access.assignment.scope_changed.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:59` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:59` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | OrgUserAssignmentsController.update → OrgUserAssignmentsService.updateAssignment | `src/modules/delegated_access/services/org-user-assignments.service.ts:225` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | OrgUserAssignmentsController.update → OrgUserAssignmentsService.updateAssignment → OrganizationUserAssignmentsRepository.findById | `src/modules/delegated_access/repositories/organization-user-assignments.repository.ts:90` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | ACTUALIZA | DIRECTA | OrgUserAssignmentsController.update → OrgUserAssignmentsService.updateAssignment → PractitionerDelegateAssignmentsRepository.suspendByDelegateAssignment | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:120` |
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | OrgUserAssignmentsController.update → OrgUserAssignmentsService.updateAssignment | `src/modules/delegated_access/services/org-user-assignments.service.ts:292` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | OrgUserAssignmentsController.update → OrgUserAssignmentsService.updateAssignment → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | OrgUserAssignmentsController.update → OrgUserAssignmentsService.updateAssignment → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | OrgUserAssignmentsController.update → OrgUserAssignmentsService.updateAssignment → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `delegated_access.assignment.scope_changed` | `src/modules/delegated_access/services/org-user-assignments.service.ts:296` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateOrgUserAssignmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sede (alcance SITE) | `src/modules/delegated_access/dto/update-org-user-assignment.dto.ts:15` |
| `clinicalUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad (alcance UNIT) | `src/modules/delegated_access/dto/update-org-user-assignment.dto.ts:21` |
| `careSpaceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Espacio (alcance SPACE) | `src/modules/delegated_access/dto/update-org-user-assignment.dto.ts:30` |
| `supervisorUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nuevo supervisor | `src/modules/delegated_access/dto/update-org-user-assignment.dto.ts:38` |
| `accessScope` | `string` | No | valores: TENANT, PRACTICE, SITE, UNIT, SPACE | `@IsOptional()` `@IsIn(SCOPES)` | Nuevo alcance de acceso | `src/modules/delegated_access/dto/update-org-user-assignment.dto.ts:46` |
| `suspend` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Suspender la asignación (cascada a delegaciones) | `src/modules/delegated_access/dto/update-org-user-assignment.dto.ts:56` |
| `expectedRowVersion` | `number` | No | — | `@IsOptional()` `@IsInt()` | row_version esperado (concurrencia optimista) | `src/modules/delegated_access/dto/update-org-user-assignment.dto.ts:66` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "supervisorUserId": "00000000-0000-4000-8000-000000000001",
  "accessScope": "TENANT",
  "suspend": true,
  "expectedRowVersion": 1
}
```

</details>

### Respuesta — `Promise<OperationResultDto>` · DTO `OperationResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | Indica éxito | `src/modules/delegated_access/dto/responses.dto.ts:103` |
| `status` | `string` | No | — | — | Nuevo estado del recurso (concept id) | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Asignación no encontrada |
| 409 | `CONCURRENCY_CONFLICT` | ConcurrencyConflictException: row_version no coincide |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No hay cambios que aplicar; PreconditionFailedException: La asignación no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-f5.int-spec.ts:740` |
| CONTROLADOR | `src/modules/delegated_access/controllers/org-user-assignments.controller.spec.ts:35` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-10`

---

## 38. POST /practitioner-delegates

- **Origen:** CONTRATO
- **Nombre:** Crear asignación de delegado de practitioner
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerDelegatesController.create` — `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:51`

### Qué es y para qué sirve (negocio)

Crear asignación de delegado de practitioner. Caso de uso UC-29-03: Crear delegación de practitioner. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:110`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /practitioner-delegates` la atiende `PractitionerDelegatesController.create` (src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:51). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePractitionerDelegateDto` (10 campos, 3 obligatorios). Delega en `PractitionerDelegatesService.createDelegate`. Crea filas en delegated_access.delegation_events, delegated_access.practitioner_delegate_assignments. Lee delegated_access.delegated_permission_sets, delegated_access.organization_user_assignments, directory.tenant_memberships, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:51` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | PractitionerDelegatesController.create → PractitionerDelegatesService.createDelegate → DelegationScopeService.loadSetInTenant → DelegatedPermissionSetsRepository.findById | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:52` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.create → PractitionerDelegatesService.createDelegate → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | PractitionerDelegatesController.create → PractitionerDelegatesService.createDelegate → DelegationScopeService.loadOrgAssignmentInTenant → OrganizationUserAssignmentsRepository.findById | `src/modules/delegated_access/repositories/organization-user-assignments.repository.ts:90` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.create → PractitionerDelegatesService.createDelegate → PractitionerDelegateAssignmentsRepository.create | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:90` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PractitionerDelegatesController.create → PractitionerDelegatesService.createDelegate → DelegationScopeService.loadOrgAssignmentInTenant → DelegationScopeService.membershipOfAssignment → DelegationScopeRepository.membershipOf | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:46` |
| `practice.practices` | LEE | LEE | DIRECTA | PractitionerDelegatesController.create → PractitionerDelegatesService.createDelegate → DelegationScopeService.assertRoleAssignmentInTenant → DelegationScopeRepository.roleAssignmentTenant | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:69` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PractitionerDelegatesController.create → PractitionerDelegatesService.createDelegate → DelegationScopeService.assertRoleAssignmentInTenant → DelegationScopeRepository.roleAssignmentTenant | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:65` |

### Cuerpo — DTO `CreatePractitionerDelegateDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practitionerRoleAssignmentId` | `string` | Sí | formato uuid | `@IsUUID()` | Asignación de rol del practitioner delegante | `src/modules/delegated_access/dto/create-practitioner-delegate.dto.ts:24` |
| `delegateUserAssignmentId` | `string` | Sí | formato uuid | `@IsUUID()` | Asignación de usuario de organización (delegado) | `src/modules/delegated_access/dto/create-practitioner-delegate.dto.ts:34` |
| `delegatedPermissionSetId` | `string` | Sí | formato uuid | `@IsUUID()` | Set de permisos delegados a aplicar | `src/modules/delegated_access/dto/create-practitioner-delegate.dto.ts:44` |
| `delegateRole` | `string` | No | valores: ASSISTANT, SECRETARY, NURSE | `@IsOptional()` `@IsIn(DELEGATE_ROLES)` | Rol del delegado | `src/modules/delegated_access/dto/create-practitioner-delegate.dto.ts:55` |
| `patientScope` | `string` | No | valores: ASSIGNED, ALL | `@IsOptional()` `@IsIn(PATIENT_SCOPES)` | Alcance de pacientes | `src/modules/delegated_access/dto/create-practitioner-delegate.dto.ts:66` |
| `appointmentScope` | `string` | No | valores: TODAY, ALL | `@IsOptional()` `@IsIn(APPOINTMENT_SCOPES)` | Alcance de citas | `src/modules/delegated_access/dto/create-practitioner-delegate.dto.ts:77` |
| `mayViewClinicalContent` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Puede ver contenido clínico | `src/modules/delegated_access/dto/create-practitioner-delegate.dto.ts:85` |
| `mayEditDrafts` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Puede editar borradores | `src/modules/delegated_access/dto/create-practitioner-delegate.dto.ts:93` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de vigencia (ISO) | `src/modules/delegated_access/dto/create-practitioner-delegate.dto.ts:104` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fin de vigencia (ISO) | `src/modules/delegated_access/dto/create-practitioner-delegate.dto.ts:115` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
  "delegateUserAssignmentId": "00000000-0000-4000-8000-000000000001",
  "delegatedPermissionSetId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
  "delegateUserAssignmentId": "00000000-0000-4000-8000-000000000001",
  "delegatedPermissionSetId": "00000000-0000-4000-8000-000000000001",
  "delegateRole": "ASSISTANT",
  "patientScope": "ASSIGNED",
  "appointmentScope": "TODAY",
  "mayViewClinicalContent": true,
  "mayEditDrafts": true,
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/delegated_access/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/delegated_access/dto/responses.dto.ts:15` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El usuario de organización no está activo; PreconditionFailedException: El set de permisos no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/practitioner-delegates.controller.spec.ts:40` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-03`

---

## 39. POST /practitioner-delegates/{id}/accept

- **Origen:** CONTRATO
- **Nombre:** Aceptar a una secretaria
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSupportController.accept` — `src/modules/delegated_access/controllers/practitioner-support.controller.ts:80`

### Qué es y para qué sirve (negocio)

Aceptar a una secretaria. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /practitioner-delegates/{id}/accept` la atiende `PractitionerSupportController.accept` (src/modules/delegated_access/controllers/practitioner-support.controller.ts:80). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `SupportStaffService.acceptForPractitioner`. Crea filas en directory.tenant_memberships. Actualiza directory.tenant_memberships. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:80` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:80` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:80` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:838` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportLinksRepository.activateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:680` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportLinksRepository.activateMembership → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:644` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportLinksRepository.closeMembershipIfUnused | `src/modules/delegated_access/repositories/support-links.repository.ts:703` |
| `directory.tenants` | LEE | LEE | POR_SQL | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `iam.users` | LEE | LEE | POR_SQL | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practices` | LEE | LEE | POR_SQL | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_support_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:839` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.persons` | LEE | LEE | POR_SQL | PractitionerSupportController.accept → SupportStaffService.acceptForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportLinkViewDto>` · DTO `SupportLinkViewDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `initiatedBy` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `src/modules/delegated_access/dto/support-staff.dto.ts:231` |
| `awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:237` |
| `practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:239` |
| `clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:241` |
| `careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:243` |
| `practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:245` |
| `practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:247` |
| `targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:253` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:254` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese vínculo no está esperando su decisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PractitionerSupportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 40. POST /practitioner-delegates/{id}/access-requests

- **Origen:** CONTRATO
- **Nombre:** Solicitar acceso delegado (aprobación previa)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerDelegatesController.requestAccess` — `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:68`

### Qué es y para qué sirve (negocio)

Solicitar acceso delegado (aprobación previa). Caso de uso UC-29-04: Solicitar acceso delegado (aprobación previa). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:111`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /practitioner-delegates/{id}/access-requests` la atiende `PractitionerDelegatesController.requestAccess` (src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:68). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateAccessRequestDto` (4 campos, 1 obligatorio). Delega en `AccessRequestsService.requestAccess`. Crea filas en delegated_access.delegated_access_approval_requests, delegated_access.delegation_events. Lee clinical.encounters, delegated_access.delegated_access_approval_requests, delegated_access.delegated_permission_sets, delegated_access.practitioner_delegate_assignments, profiles.patient_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:68` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:68` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | PractitionerDelegatesController.requestAccess → AccessRequestsService.requestAccess → DelegationScopeService.assertGrantTarget → DelegationScopeRepository.encounterScope | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:84` |
| `delegated_access.delegated_access_approval_requests` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.requestAccess → AccessRequestsService.requestAccess → DelegatedAccessApprovalRequestsRepository.create | `src/modules/delegated_access/repositories/delegated-access-approval-requests.repository.ts:83` |
| `delegated_access.delegated_access_approval_requests` | LEE | LEE | DIRECTA | PractitionerDelegatesController.requestAccess → AccessRequestsService.requestAccess → DelegatedAccessApprovalRequestsRepository.findOpenDuplicate | `src/modules/delegated_access/repositories/delegated-access-approval-requests.repository.ts:63` |
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | PractitionerDelegatesController.requestAccess → AccessRequestsService.requestAccess → DelegationScopeService.loadDelegationInTenant → DelegatedPermissionSetsRepository.findById | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:52` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.requestAccess → AccessRequestsService.requestAccess → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | PractitionerDelegatesController.requestAccess → AccessRequestsService.requestAccess → DelegationScopeService.loadDelegationInTenant → PractitionerDelegateAssignmentsRepository.findById | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:76` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | PractitionerDelegatesController.requestAccess → AccessRequestsService.requestAccess → DelegationScopeService.assertGrantTarget → DelegationScopeRepository.patientExists | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:104` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateAccessRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `requestedPermissionId` | `string` | Sí | formato uuid | `@IsUUID()` | Permiso solicitado (authz) | `src/modules/delegated_access/dto/create-access-request.dto.ts:11` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paciente objetivo | `src/modules/delegated_access/dto/create-access-request.dto.ts:19` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro objetivo | `src/modules/delegated_access/dto/create-access-request.dto.ts:27` |
| `reasonText` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Justificación de la solicitud | `src/modules/delegated_access/dto/create-access-request.dto.ts:36` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "requestedPermissionId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "requestedPermissionId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/delegated_access/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/delegated_access/dto/responses.dto.ts:15` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una solicitud pendiente equivalente |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La delegación no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/practitioner-delegates.controller.spec.ts:47` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-04`

---

## 41. POST /practitioner-delegates/{id}/grants

- **Origen:** CONTRATO
- **Nombre:** Otorgar grant delegado por-propósito y temporal
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerDelegatesController.issueGrant` — `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:86`

### Qué es y para qué sirve (negocio)

Otorgar grant delegado por-propósito y temporal. Caso de uso UC-29-06: Grant pre-autorizado por-propósito y temporal. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:113`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /practitioner-delegates/{id}/grants` la atiende `PractitionerDelegatesController.issueGrant` (src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:86). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateGrantDto` (6 campos, 2 obligatorios). Delega en `PractitionerDelegatesService.issueGrant`. Crea filas en delegated_access.delegated_access_grants, delegated_access.delegation_events. Lee clinical.encounters, delegated_access.delegated_permission_sets, delegated_access.practitioner_delegate_assignments, profiles.patient_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:86` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:86` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | PractitionerDelegatesController.issueGrant → PractitionerDelegatesService.issueGrant → DelegationScopeService.assertGrantTarget → DelegationScopeRepository.encounterScope | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:84` |
| `delegated_access.delegated_access_grants` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.issueGrant → PractitionerDelegatesService.issueGrant → DelegatedAccessGrantsRepository.create | `src/modules/delegated_access/repositories/delegated-access-grants.repository.ts:79` |
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | PractitionerDelegatesController.issueGrant → PractitionerDelegatesService.issueGrant → DelegationScopeService.loadDelegationInTenant → DelegatedPermissionSetsRepository.findById | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:52` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.issueGrant → PractitionerDelegatesService.issueGrant → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | PractitionerDelegatesController.issueGrant → PractitionerDelegatesService.issueGrant → DelegationScopeService.loadDelegationInTenant → PractitionerDelegateAssignmentsRepository.findById | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:76` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | PractitionerDelegatesController.issueGrant → PractitionerDelegatesService.issueGrant → DelegationScopeService.assertGrantTarget → DelegationScopeRepository.patientExists | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:104` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateGrantDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `purpose` | `string` | Sí | valores: TREATMENT, BILLING, OPERATIONS | `@IsIn(PURPOSES)` | Propósito de uso | `src/modules/delegated_access/dto/create-grant.dto.ts:21` |
| `validTo` | `string` | Sí | formato date-time | `@IsDateString()` | Fin de vigencia del grant (ISO, obligatorio) | `src/modules/delegated_access/dto/create-grant.dto.ts:31` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de vigencia (ISO) | `src/modules/delegated_access/dto/create-grant.dto.ts:42` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paciente objetivo | `src/modules/delegated_access/dto/create-grant.dto.ts:50` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro objetivo | `src/modules/delegated_access/dto/create-grant.dto.ts:58` |
| `resourceType` | `string` | No | valores: CLINICAL_NOTE, APPOINTMENT, PRESCRIPTION | `@IsOptional()` `@IsIn(RESOURCE_TYPES)` | Tipo de recurso | `src/modules/delegated_access/dto/create-grant.dto.ts:66` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "purpose": "TREATMENT",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "purpose": "TREATMENT",
  "validTo": "2026-07-31T12:00:00.000Z",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "resourceType": "CLINICAL_NOTE"
}
```

</details>

### Respuesta — `Promise<ResourceCreatedDto>` · DTO `ResourceCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del recurso creado | `src/modules/delegated_access/dto/responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/delegated_access/dto/responses.dto.ts:15` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La delegación no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/practitioner-delegates.controller.spec.ts:58` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-06`

---

## 42. POST /practitioner-delegates/{id}/reject

- **Origen:** CONTRATO
- **Nombre:** Rechazar a una secretaria
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSupportController.reject` — `src/modules/delegated_access/controllers/practitioner-support.controller.ts:98`

### Qué es y para qué sirve (negocio)

Rechazar a una secretaria. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /practitioner-delegates/{id}/reject` la atiende `PractitionerSupportController.reject` (src/modules/delegated_access/controllers/practitioner-support.controller.ts:98). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `SupportLinkReasonDto` (1 campo, 0 obligatorios). Delega en `SupportStaffService.rejectForPractitioner`. Crea filas en directory.tenant_memberships. Actualiza directory.tenant_memberships. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:98` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:98` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:98` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:838` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportLinksRepository.activateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:680` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportLinksRepository.activateMembership → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:644` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportLinksRepository.closeMembershipIfUnused | `src/modules/delegated_access/repositories/support-links.repository.ts:703` |
| `directory.tenants` | LEE | LEE | POR_SQL | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `iam.users` | LEE | LEE | POR_SQL | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practices` | LEE | LEE | POR_SQL | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_support_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportLinksRepository.setStatus | `src/modules/delegated_access/repositories/support-links.repository.ts:839` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.persons` | LEE | LEE | POR_SQL | PractitionerSupportController.reject → SupportStaffService.rejectForPractitioner → SupportStaffService.decide → SupportStaffService.loadLink → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `SupportLinkReasonDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:167` |

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

### Respuesta — `Promise<SupportLinkViewDto>` · DTO `SupportLinkViewDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `initiatedBy` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `src/modules/delegated_access/dto/support-staff.dto.ts:231` |
| `awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:237` |
| `practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:239` |
| `clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:241` |
| `careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:243` |
| `practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:245` |
| `practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:247` |
| `targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:253` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:254` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese vínculo no está esperando su decisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PractitionerSupportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 43. POST /practitioner-delegates/{id}/revoke

- **Origen:** CONTRATO
- **Nombre:** Revocar delegación de forma inmediata (cascada authz)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerDelegatesController.revoke` — `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:104`

### Qué es y para qué sirve (negocio)

Revocar delegación de forma inmediata (cascada authz). Caso de uso UC-29-07: Revocar delegación inmediata (cascada). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:114`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /practitioner-delegates/{id}/revoke` la atiende `PractitionerDelegatesController.revoke` (src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:104). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RevokeDelegationDto` (1 campo, 0 obligatorios). Delega en `PractitionerDelegatesService.revoke`. Crea filas en delegated_access.delegation_events. Actualiza delegated_access.delegated_access_approval_requests, delegated_access.delegated_access_grants. Lee delegated_access.delegated_permission_sets, delegated_access.practitioner_delegate_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:104` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:299` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:104` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:158` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_access_approval_requests` | ESCRIBE | ACTUALIZA | DIRECTA | PractitionerDelegatesController.revoke → PractitionerDelegatesService.revoke → DelegatedAccessApprovalRequestsRepository.cancelOpenByAssignment | `src/modules/delegated_access/repositories/delegated-access-approval-requests.repository.ts:107` |
| `delegated_access.delegated_access_grants` | ESCRIBE | ACTUALIZA | DIRECTA | PractitionerDelegatesController.revoke → PractitionerDelegatesService.revoke → DelegatedAccessGrantsRepository.revokeActiveByAssignment | `src/modules/delegated_access/repositories/delegated-access-grants.repository.ts:130` |
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | PractitionerDelegatesController.revoke → PractitionerDelegatesService.revoke → DelegationScopeService.loadDelegationInTenant → DelegatedPermissionSetsRepository.findById | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:52` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.revoke → PractitionerDelegatesService.revoke → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | PractitionerDelegatesController.revoke → PractitionerDelegatesService.revoke → DelegationScopeService.loadDelegationInTenant → PractitionerDelegateAssignmentsRepository.findById | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:76` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RevokeDelegationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo de la revocación (auditoría) | `src/modules/delegated_access/dto/revoke-delegation.dto.ts:13` |

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

### Respuesta — `Promise<OperationResultDto>` · DTO `OperationResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | Indica éxito | `src/modules/delegated_access/dto/responses.dto.ts:103` |
| `status` | `string` | No | — | — | Nuevo estado del recurso (concept id) | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/practitioner-delegates.controller.spec.ts:68` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-07`

---

## 44. GET /public/prescription-shares/{token}

- **Origen:** CONTRATO
- **Nombre:** Comprobar un enlace de receta compartida
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PrescriptionSharesPublicController.read` — `src/modules/delegated_access/controllers/prescription-shares-public.controller.ts:39`

### Qué es y para qué sirve (negocio)

Comprobar un enlace de receta compartida. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /public/prescription-shares/{token}` la atiende `PrescriptionSharesPublicController.read` (src/modules/delegated_access/controllers/prescription-shares-public.controller.ts:39). Es una ruta pública: no exige token. Delega en `PrescriptionSharesService.readPublic`. Crea filas en delegated_access.shared_access_link_uses. Lee clinical.medication_requests, delegated_access.shared_access_links, profiles.health_practitioner_profiles, profiles.jurisdiction_authorizations, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/delegated_access/controllers/prescription-shares-public.controller.ts:39` |
| CABECERA | user-agent (obligatoria) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle(PRESCRIPTION_SHARE_PUBLIC_RATE_LIMIT) | `src/modules/delegated_access/controllers/prescription-shares-public.controller.ts:39` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | PrescriptionSharesPublicController.read → PrescriptionSharesService.readPublic → PrescriptionSharesService.resolve → SharedAccessLinksRepository.findItemsByEncounter | `src/modules/delegated_access/repositories/shared-access-links.repository.ts:215` |
| `delegated_access.shared_access_link_uses` | ESCRIBE | CREA | DIRECTA | PrescriptionSharesPublicController.read → PrescriptionSharesService.readPublic → PrescriptionSharesService.recordUse → SharedAccessLinksRepository.appendUse | `src/modules/delegated_access/repositories/shared-access-links.repository.ts:189` |
| `delegated_access.shared_access_links` | LEE | LEE | DIRECTA | PrescriptionSharesPublicController.read → PrescriptionSharesService.readPublic → PrescriptionSharesService.resolve → PrescriptionSharesService.findByToken → SharedAccessLinksRepository.findByTokenHash | `src/modules/delegated_access/repositories/shared-access-links.repository.ts:98` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | PrescriptionSharesPublicController.read → PrescriptionSharesService.readPublic → PrescriptionSharesService.prescriberOf → PrescriberIdentityReader.read → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | PrescriptionSharesPublicController.read → PrescriptionSharesService.readPublic → PrescriptionSharesService.prescriberOf → PrescriberIdentityReader.read → JurisdictionAuthorizationsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:107` |
| `profiles.persons` | LEE | LEE | DIRECTA | PrescriptionSharesPublicController.read → PrescriptionSharesService.readPublic → PrescriptionSharesService.prescriberOf → PrescriberIdentityReader.read → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `token` | path | Sí | `string` | — |
| `user-agent` | header | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicPrescriptionShareDto>` · DTO `PublicPrescriptionShareDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `status` | `string` | Sí | valores: VALID, EXPIRED, REVOKED | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:135` |
| `endedReason` | `string` | Sí | valores: LINK_EXPIRED, PRESCRIPTION_NOT_ACTIVE; admite null | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:147` |
| `issuedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:151` |
| `prescriberName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:154` |
| `prescriberLicense` | `PrescriberLicenseDto` | No | admite null | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:157` |
| `prescriberLicense.number` | `string` | No | — | — | — | sin fuente |
| `prescriberLicense.authority` | `object` | No | admite null | — | — | sin fuente |
| `prescriberLicense.state` | `string` | No | valores: ACTIVE, PENDING | — | — | sin fuente |
| `itemCount` | `number` | Sí | — | — | — | `src/modules/delegated_access/dto/prescription-shares.dto.ts:161` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/prescription-shares-public.controller.spec.ts:67` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PrescriptionSharesPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 45. POST /support-engagement-requests

- **Origen:** CONTRATO
- **Nombre:** Pedir un vínculo de apoyo (hospital, sede, servicio, piso o doctor)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportStaffController.request` — `src/modules/delegated_access/controllers/support-staff.controller.ts:109`

### Qué es y para qué sirve (negocio)

Pedir un vínculo de apoyo (hospital, sede, servicio, piso o doctor). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /support-engagement-requests` la atiende `SupportStaffController.request` (src/modules/delegated_access/controllers/support-staff.controller.ts:109). Exige sesión con alguno de los roles SUPPORT_STAFF. Valida el cuerpo como `CreateEngagementRequestDto` (9 campos, 3 obligatorios). Delega en `SupportStaffService.request`. Crea filas en delegated_access.organization_user_assignments, directory.tenant_memberships, practice.practitioner_support_assignments. Lee delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.users, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practices y 5 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPPORT_STAFF | `src/modules/delegated_access/controllers/support-staff.controller.ts:109` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/support-staff.controller.ts:109` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:209` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 20, ttl: 60_000 } }) | `src/modules/delegated_access/controllers/support-staff.controller.ts:109` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | ESCRIBE | CREA | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.createLocationLink | `src/modules/delegated_access/repositories/support-links.repository.ts:777` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:644` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findOrCreateMembership | `src/modules/delegated_access/repositories/support-links.repository.ts:628` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findOrganizationName | `src/modules/delegated_access/repositories/support-links.repository.ts:346` |
| `iam.users` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `practice.practitioner_support_assignments` | ESCRIBE | CREA | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.createPractitionerLink | `src/modules/delegated_access/repositories/support-links.repository.ts:798` |
| `practice.practitioner_support_assignments` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.requireSecretaryPerson → SupportLinksRepository.findSecretaryPersonId | `src/modules/delegated_access/repositories/support-links.repository.ts:269` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.createLinks → SupportLinksRepository.findLinks | `src/modules/delegated_access/repositories/support-links.repository.ts:165` |
| `profiles.secretary_profiles` | LEE | LEE | POR_SQL | SupportStaffController.request → SupportStaffService.request → SupportStaffService.requireSecretaryPerson → SupportLinksRepository.findSecretaryPersonId | `src/modules/delegated_access/repositories/support-links.repository.ts:269` |

### Cuerpo — DTO `CreateEngagementRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:74` |
| `roleTemplateCode` | `string` | No | valores: SECRETARY | `@IsOptional()` `@IsIn(['SECRETARY'])` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:83` |
| `message` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:90` |
| `items` | `array<SupportTargetDto>` | Sí | mínimo 1 elemento(s); máximo 50 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(50)` `@ValidateNested({ each: true })` `@Type(() => SupportTargetDto)` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:99` |
| `items[].targetKind` | `string` | Sí | valores: ORGANIZATION, SITE, SERVICE, SPACE, PRACTITIONER | `@IsIn(SUPPORT_TARGET_KINDS)` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:42` |
| `items[].practiceSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:48` |
| `items[].clinicalUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:54` |
| `items[].careSpaceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:60` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/support-staff.dto.ts:66` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "targetKind": "ORGANIZATION"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "roleTemplateCode": "SECRETARY",
  "message": "valor-ejemplo",
  "items": [
    {
      "targetKind": "ORGANIZATION",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

</details>

### Respuesta — `Promise<SupportLinksCreatedDto>` · DTO `SupportLinksCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del primer vínculo creado. | `src/modules/delegated_access/dto/support-staff.dto.ts:278` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:279` |
| `items` | `array<SupportLinkViewDto>` | Sí | — | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:280` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:214` |
| `items[].kind` | `string` | Sí | valores: LOCATION, PRACTITIONER | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:215` |
| `items[].targetKind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof SUPPORT_TARGET_KINDS)[number] | `src/modules/delegated_access/dto/support-staff.dto.ts:216` |
| `items[].tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:217` |
| `items[].organizationName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:219` |
| `items[].userId` | `string` | Sí | formato uuid | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:220` |
| `items[].personName` | `string` | No | admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:222` |
| `items[].status` | `string` | Sí | valores: PENDING, ACTIVE, REJECTED, ENDED | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:224` |
| `items[].initiatedBy` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién inició el vínculo, guardado al crearlo. null = sin iniciador: nadie lo decide. | `src/modules/delegated_access/dto/support-staff.dto.ts:231` |
| `items[].awaiting` | `string` | No | valores: SUPPORT_STAFF, ORGANIZATION, PRACTITIONER | — | Quién tiene que aceptar o rechazar; null si ya se decidió. | `src/modules/delegated_access/dto/support-staff.dto.ts:237` |
| `items[].practiceSiteId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:239` |
| `items[].clinicalUnitId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:241` |
| `items[].careSpaceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:243` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:245` |
| `items[].practitionerProfileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:247` |
| `items[].targetName` | `string` | No | admite null | — | Nombre del doctor, la sede, el servicio o el piso. | `src/modules/delegated_access/dto/support-staff.dto.ts:253` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/delegated_access/dto/support-staff.dto.ts:254` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Organización no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya hay un vínculo vivo con ese mismo objetivo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportStaffController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

