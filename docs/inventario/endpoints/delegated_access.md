<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `delegated_access`

- **Bloque:** Identidad y Seguridad (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)
- **Operaciones:** 46 (46 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 14 · MEDIO 16 · BAJO 16
- **Tablas distintas que tocan:** 41
- **Respuestas de error y detalle contractual:** `openapi/endpoints/delegated-access.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/access-requests/{id}/decision` | Aprobar/Denegar solicitud y emitir grant scoped | MEDIO | 9 | PRACTITIONER, CLINICIAN |
| 2 | POST | `/affiliation-invitations/redeem` | Canjear un código o QR de afiliación | ALTO | 19 | sesión (sin roles) |
| 3 | POST | `/authz/effective-actor/evaluate` | Evaluar actor efectivo por propósito (step-up) | MEDIO | 7 | SECURITY_ADMIN |
| 4 | POST | `/delegated-access/expiry-sweep` | Expirar delegaciones y grants vencidos (barrido) | MEDIO | 7 | SYSTEM, SECURITY_ADMIN |
| 5 | POST | `/delegated-access/support/expire-requests` | Vencer solicitudes de apoyo sin decidir (15 días) | MEDIO | 2 | SYSTEM |
| 6 | POST | `/delegated-access/support/recertification-sweep` | Suspender vínculos sin recertificar (15 días) | ALTO | 16 | SYSTEM |
| 7 | POST | `/delegated-access/support/refresh-effective-access` | Recalcular el acceso efectivo del personal de apoyo | ALTO | 12 | SYSTEM |
| 8 | GET | `/delegated-permission-sets` | Listar los sets de permisos delegados del tenant | BAJO | 1 | SECURITY_ADMIN |
| 9 | POST | `/delegated-permission-sets` | Publicar set de permisos delegados (scoped) | MEDIO | 3 | SECURITY_ADMIN |
| 10 | POST | `/delegated-permission-sets/{id}/versions` | Versionar set de permisos delegados | ALTO | 4 | SECURITY_ADMIN |
| 11 | GET | `/me/practitioner/support-access-requests` | Solicitudes de acceso clínico temporal de mi equipo | BAJO | 6 | PRACTITIONER, CLINICIAN |
| 12 | GET | `/me/practitioner/support-activity` | Actividad de mi equipo de apoyo | BAJO | 11 | PRACTITIONER, CLINICIAN |
| 13 | GET | `/me/practitioner/support-team` | Mi equipo de apoyo | BAJO | 15 | PRACTITIONER, CLINICIAN |
| 14 | POST | `/me/support-access-requests` | Pedir acceso clínico temporal a un paciente (lo decide el doctor) | ALTO | 10 | sesión (sin roles) |
| 15 | GET | `/me/support-activity` | Mi actividad como personal de apoyo | BAJO | 11 | sesión (sin roles) |
| 16 | GET | `/me/support-catalog` | Catálogo de una organización para pedir permisos | BAJO | 11 | sesión (sin roles) |
| 17 | GET | `/me/support-engagements` | Mis vínculos de apoyo y mis solicitudes | BAJO | 16 | sesión (sin roles) |
| 18 | POST | `/me/support-engagements/{id}/confirm` | Confirmar mi propio vínculo de apoyo | BAJO | 8 | sesión (sin roles) |
| 19 | POST | `/me/support-patient-search` | Buscar un paciente (búsqueda exacta, auditada) | ALTO | 10 | sesión (sin roles) |
| 20 | POST | `/me/support-patients` | Registrar un paciente nuevo (con aviso de posibles duplicados) | ALTO | 16 | sesión (sin roles) |
| 21 | POST | `/org/{tenantMembershipId}/user-assignments` | Asignar usuario de organización con alcance y vigencia | MEDIO | 2 | SECURITY_ADMIN |
| 22 | GET | `/org/access-lookup` | Quién tiene acceso a un doctor, servicio o ubicación | BAJO | 4 | SECURITY_ADMIN |
| 23 | GET | `/org/affiliation-invitations` | Listar las invitaciones de afiliación | BAJO | 2 | SECURITY_ADMIN |
| 24 | POST | `/org/affiliation-invitations` | Crear un código o QR de afiliación | MEDIO | 4 | SECURITY_ADMIN |
| 25 | POST | `/org/affiliation-invitations/{id}/revoke` | Revocar un código o QR de afiliación | MEDIO | 2 | SECURITY_ADMIN |
| 26 | GET | `/org/role-templates` | Plantillas de rol de apoyo | BAJO | 1 | SECURITY_ADMIN |
| 27 | POST | `/org/role-templates` | Crear una plantilla de rol propia | MEDIO | 2 | SECURITY_ADMIN |
| 28 | PATCH | `/org/role-templates/{id}` | Versionar una plantilla de rol propia | MEDIO | 3 | SECURITY_ADMIN |
| 29 | GET | `/org/support-activity` | Actividad del personal de apoyo | BAJO | 10 | SECURITY_ADMIN |
| 30 | GET | `/org/support-catalog` | Catálogo de doctores, servicios y ubicaciones para los permisos | BAJO | 8 | SECURITY_ADMIN |
| 31 | GET | `/org/support-engagement-requests` | Solicitudes de vínculo de apoyo de la organización | BAJO | 11 | SECURITY_ADMIN |
| 32 | POST | `/org/support-engagement-requests/{id}/decision` | Decidir una solicitud de apoyo ítem por ítem | ALTO | 24 | SECURITY_ADMIN |
| 33 | GET | `/org/support-engagements` | Vínculos de apoyo de la organización | BAJO | 8 | SECURITY_ADMIN |
| 34 | POST | `/org/support-engagements/{id}/end` | Terminar un vínculo de apoyo (revocación inmediata) | ALTO | 19 | SECURITY_ADMIN |
| 35 | GET | `/org/support-engagements/{id}/grants` | Permisos de un vínculo de apoyo | BAJO | 4 | SECURITY_ADMIN |
| 36 | PATCH | `/org/support-engagements/{id}/grants` | Editar o dar de baja un permiso de apoyo | ALTO | 17 | SECURITY_ADMIN |
| 37 | POST | `/org/support-engagements/{id}/grants` | Otorgar un permiso de apoyo | ALTO | 16 | SECURITY_ADMIN |
| 38 | POST | `/org/support-engagements/{id}/recertify` | Recertificar un vínculo de apoyo | ALTO | 15 | SECURITY_ADMIN |
| 39 | PATCH | `/org/user-assignments/{id}` | Reasignar supervisor / suspender asignación de organización | MEDIO | 3 | SECURITY_ADMIN |
| 40 | POST | `/practitioner-delegates` | Crear asignación de delegado de practitioner | MEDIO | 7 | SECURITY_ADMIN |
| 41 | POST | `/practitioner-delegates/{id}/accept` | Aceptar a una persona de apoyo | ALTO | 13 | PRACTITIONER, CLINICIAN |
| 42 | POST | `/practitioner-delegates/{id}/access-requests` | Solicitar acceso delegado (aprobación previa) | MEDIO | 7 | SECURITY_ADMIN |
| 43 | POST | `/practitioner-delegates/{id}/grants` | Otorgar grant delegado por-propósito y temporal | MEDIO | 6 | SECURITY_ADMIN |
| 44 | PATCH | `/practitioner-delegates/{id}/reply-settings` | Permitir o no responder en mi nombre | MEDIO | 6 | PRACTITIONER, CLINICIAN |
| 45 | POST | `/practitioner-delegates/{id}/revoke` | Revocar delegación de forma inmediata (cascada authz) | MEDIO | 6 | SECURITY_ADMIN, PRACTITIONER, CLINICIAN |
| 46 | POST | `/support-engagement-requests` | Pedir un vínculo de apoyo o su ampliación | ALTO | 12 | sesión (sin roles) |

---

## 1. POST /access-requests/{id}/decision

- **Origen:** CONTRATO
- **Nombre:** Aprobar/Denegar solicitud y emitir grant scoped
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AccessRequestsController.decide` — `src/modules/delegated_access/controllers/access-requests.controller.ts:33`

### Qué es y para qué sirve (negocio)

Aprobar/Denegar solicitud y emitir grant scoped. Caso de uso UC-29-05: Aprobar/Denegar y emitir grant scoped (decide el doctor). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:232`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /access-requests/{id}/decision` la atiende `AccessRequestsController.decide` (src/modules/delegated_access/controllers/access-requests.controller.ts:33). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `DecideAccessRequestDto` (5 campos, 1 obligatorio). Delega en `AccessRequestsService.decide`. Crea filas en delegated_access.delegated_access_grants, delegated_access.delegation_events. Actualiza delegated_access.delegated_access_approval_requests. Lee clinical.encounters, delegated_access.delegated_access_approval_requests, delegated_access.delegated_permission_sets, delegated_access.practitioner_delegate_assignments, practice.practitioner_role_assignments, profiles.patient_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/delegated_access/controllers/access-requests.controller.ts:33` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/access-requests.controller.ts:33` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | AccessRequestsController.decide → AccessRequestsService.decide → DelegationScopeService.assertGrantTarget → DelegationScopeRepository.encounterScope | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:101` |
| `delegated_access.delegated_access_approval_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | AccessRequestsController.decide → AccessRequestsService.decide | `src/modules/delegated_access/services/access-requests.service.ts:268` |
| `delegated_access.delegated_access_approval_requests` | LEE | LEE | DIRECTA | AccessRequestsController.decide → AccessRequestsService.decide → DelegatedAccessApprovalRequestsRepository.findById | `src/modules/delegated_access/repositories/delegated-access-approval-requests.repository.ts:51` |
| `delegated_access.delegated_access_grants` | ESCRIBE | CREA | DIRECTA | AccessRequestsController.decide → AccessRequestsService.decide → DelegatedAccessGrantsRepository.create | `src/modules/delegated_access/repositories/delegated-access-grants.repository.ts:79` |
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | AccessRequestsController.decide → AccessRequestsService.decide → DelegationScopeService.loadDelegationInTenant → DelegatedPermissionSetsRepository.findById | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:52` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | AccessRequestsController.decide → AccessRequestsService.decide → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | AccessRequestsController.decide → AccessRequestsService.decide → DelegationScopeService.loadDelegationInTenant → PractitionerDelegateAssignmentsRepository.findById | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:78` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AccessRequestsController.decide → AccessRequestsService.decide → DelegationScopeService.assertOwningDoctor → DelegationScopeRepository.roleAssignmentPractitioner | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:84` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | AccessRequestsController.decide → AccessRequestsService.decide → DelegationScopeService.assertGrantTarget → DelegationScopeRepository.patientExists | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:121` |

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
| `requestId` | `string` | Sí | formato uuid | — | Solicitud decidida | `src/modules/delegated_access/dto/responses.dto.ts:119` |
| `decision` | `string` | Sí | — | — | Decisión aplicada (APPROVED\|DENIED) | `src/modules/delegated_access/dto/responses.dto.ts:125` |
| `grantId` | `string` | No | formato uuid | — | Grant emitido si fue aprobada | `src/modules/delegated_access/dto/responses.dto.ts:134` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud no encontrada |
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
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AffiliationInvitationsController.redeem` — `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:87`

### Qué es y para qué sirve (negocio)

Canjear un código o QR de afiliación. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /affiliation-invitations/redeem` la atiende `AffiliationInvitationsController.redeem` (src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:87). Exige sesión; el controlador no declara roles. Valida el cuerpo como `RedeemAffiliationInvitationDto` (1 campo, 1 obligatorio). Delega en `AffiliationInvitationsService.redeem`. Crea filas en delegated_access.engagement_request_items, delegated_access.engagement_requests, delegated_access.organization_user_assignments, directory.affiliation_invitation_uses, directory.tenant_memberships, practice.practitioner_role_assignments. Actualiza directory.affiliation_invitations, directory.tenant_memberships. Lee delegated_access.organization_user_assignments, delegated_access.role_templates, directory.affiliation_invitation_uses, directory.affiliation_invitations, directory.tenant_memberships, directory.tenants, practice.practice_sites, practice.practices y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:87` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:87` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.engagement_request_items` | ESCRIBE | CREA | DIRECTA | AffiliationInvitationsController.redeem → AffiliationInvitationsService.redeem → AffiliationInvitationsService.redeemInTransaction → AffiliationInvitationsService.affiliate → AffiliationInvitationsService.leavePendingRequest → EngagementRequestsRepository.createItem | `src/modules/delegated_access/repositories/engagement-requests.repository.ts:202` |
| `delegated_access.engagement_requests` | ESCRIBE | CREA | DIRECTA | AffiliationInvitationsController.redeem → AffiliationInvitationsService.redeem → AffiliationInvitationsService.redeemInTransaction → AffiliationInvitationsService.affiliate → EngagementRequestsRepository.create | `src/modules/delegated_access/repositories/engagement-requests.repository.ts:173` |
| `delegated_access.organization_user_assignments` | ESCRIBE | CREA | DIRECTA | AffiliationInvitationsController.redeem → AffiliationInvitationsService.redeem → AffiliationInvitationsService.redeemInTransaction → AffiliationInvitationsService.affiliate → SupportEngagementsRepository.create | `src/modules/delegated_access/repositories/support-engagements.repository.ts:61` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → AffiliationInvitationsService.redeem → AffiliationInvitationsService.redeemInTransaction → AffiliationInvitationsService.affiliate → SupportEngagementsRepository.findActiveByMembershipTemplate | `src/modules/delegated_access/repositories/support-engagements.repository.ts:270` |
| `delegated_access.role_templates` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → AffiliationInvitationsService.redeem → AffiliationInvitationsService.redeemInTransaction → AffiliationInvitationsService.affiliate → RoleTemplatesRepository.findById | `src/modules/delegated_access/repositories/role-templates.repository.ts:35` |
| `directory.affiliation_invitation_uses` | ESCRIBE | CREA | DIRECTA | AffiliationInvitationsController.redeem → AffiliationInvitationsService.redeem → AffiliationInvitationsService.redeemInTransaction → AffiliationInvitationsRepository.recordUse | `src/modules/delegated_access/repositories/affiliation-invitations.repository.ts:151` |
| `directory.affiliation_invitation_uses` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → AffiliationInvitationsService.redeem → AffiliationInvitationsService.redeemInTransaction → AffiliationInvitationsService.refusalOutcome → AffiliationInvitationsRepository.findUseBy | `src/modules/delegated_access/repositories/affiliation-invitations.repository.ts:97` |
| `directory.affiliation_invitations` | ESCRIBE | ACTUALIZA | POR_SQL | AffiliationInvitationsController.redeem → AffiliationInvitationsService.redeem → AffiliationInvitationsService.redeemInTransaction | `src/modules/delegated_access/services/affiliation-invitations.service.ts:268` |
| `directory.affiliation_invitations` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → AffiliationInvitationsService.redeem → AffiliationInvitationsService.redeemInTransaction → AffiliationInvitationsRepository.findByTokenHash | `src/modules/delegated_access/repositories/affiliation-invitations.repository.ts:45` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | AffiliationInvitationsController.redeem → AffiliationInvitationsService.redeem → AffiliationInvitationsService.redeemInTransaction → AffiliationInvitationsService.affiliate → SupportDirectoryRepository.ensureActiveStaffMembership | `src/modules/delegated_access/repositories/support-directory.repository.ts:158` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | AffiliationInvitationsController.redeem → AffiliationInvitationsService.redeem → AffiliationInvitationsService.redeemInTransaction → AffiliationInvitationsService.affiliate → SupportDirectoryRepository.ensureActiveStaffMembership → SupportDirectoryRepository.createStaffMembership | `src/modules/delegated_access/repositories/support-directory.repository.ts:85` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → AffiliationInvitationsService.redeem → AffiliationInvitationsService.redeemInTransaction → AffiliationInvitationsService.affiliate → AffiliationInvitationsService.leavePendingAffiliation → SupportDirectoryRepository.ensurePendingStaffMembership | `src/modules/delegated_access/repositories/support-directory.repository.ts:187` |
| `directory.tenants` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → AffiliationInvitationsService.redeem → AffiliationInvitationsService.redeemInTransaction → AffiliationInvitationsService.affiliate → SupportDirectoryRepository.findTenant | `src/modules/delegated_access/repositories/support-directory.repository.ts:38` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → AffiliationInvitationsService.redeem → AffiliationInvitationsService.redeemInTransaction → AffiliationInvitationsService.affiliate → AffiliationInvitationsService.leavePendingAffiliation → PractitionerAffiliationRepository.findTarget | `src/modules/delegated_access/repositories/practitioner-affiliation.repository.ts:51` |
| `practice.practices` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → AffiliationInvitationsService.redeem → AffiliationInvitationsService.redeemInTransaction → AffiliationInvitationsService.affiliate → AffiliationInvitationsService.leavePendingAffiliation → PractitionerAffiliationRepository.findTarget | `src/modules/delegated_access/repositories/practitioner-affiliation.repository.ts:43` |
| `practice.practitioner_role_assignments` | ESCRIBE | CREA | DIRECTA | AffiliationInvitationsController.redeem → AffiliationInvitationsService.redeem → AffiliationInvitationsService.redeemInTransaction → AffiliationInvitationsService.affiliate → AffiliationInvitationsService.leavePendingAffiliation → PractitionerAffiliationRepository.ensurePending | `src/modules/delegated_access/repositories/practitioner-affiliation.repository.ts:86` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → AffiliationInvitationsService.redeem → AffiliationInvitationsService.redeemInTransaction → AffiliationInvitationsService.affiliate → AffiliationInvitationsService.leavePendingAffiliation → PractitionerAffiliationRepository.ensurePending | `src/modules/delegated_access/repositories/practitioner-affiliation.repository.ts:79` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → AffiliationInvitationsService.redeem → AffiliationInvitationsService.redeemInTransaction → AffiliationInvitationsService.affiliate → AffiliationInvitationsService.leavePendingAffiliation → SupportDirectoryRepository.findPractitionerProfileIdOfUser | `src/modules/delegated_access/repositories/support-directory.repository.ts:238` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | AffiliationInvitationsController.redeem → AffiliationInvitationsService.redeem → AffiliationInvitationsService.redeemInTransaction → AffiliationInvitationsService.refusalOutcome → SupportDirectoryRepository.findPersonIdOfUser | `src/modules/delegated_access/repositories/support-directory.repository.ts:217` |

### Cuerpo — DTO `RedeemAffiliationInvitationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud mínima 8; longitud máxima 200 | `@IsString()` `@MinLength(8)` `@MaxLength(200)` | — | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:76` |

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

### Respuesta — `Promise<AffiliationRedeemResultDto>` · DTO `AffiliationRedeemResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `kind` | `object` | Sí | — | — | Tipo de invitación canjeada. | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:82` |
| `tenantId` | `string` | Sí | formato uuid | — | Organización a la que quedó afiliada la persona (o a la que pidió afiliarse). | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:84` |
| `membershipId` | `string` | No | formato uuid | — | Membresía creada o reutilizada; ausente si el canje quedó pendiente de aprobación. | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:86` |
| `engagementId` | `string` | No | formato uuid | — | Vínculo de apoyo abierto, para `SUPPORT_STAFF` con código dirigido a la persona. | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:88` |
| `requestId` | `string` | No | formato uuid | — | Solicitud que quedó pendiente de aprobación (personal de apoyo): un código multiuso (sin persona destino) no afilia solo, la organización decide. | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:93` |
| `roleAssignmentId` | `string` | No | formato uuid | — | Solicitud de afiliación que quedó pendiente (doctor que canjea un código multiuso): es la fila de `practice.practitioner_role_assignments` en `PENDING` que la organización aprueba o rechaza con `POST /role-assignments/:roleAssignmentId/approve\|reject` y ve en `GET /practices/:practiceId/role-assignments`. | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:101` |
| `pendingApproval` | `boolean` | No | — | — | `true` si el canje espera la decisión de la organización (apoyo o doctor). | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:103` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla de rol no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Para afiliarse como médico, su cuenta necesita un perfil profesional; PreconditionFailedException: La organización no tiene una práctica activa que reciba la solicitud; PreconditionFailedException: La invitación no es válida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:AffiliationInvitationsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /authz/effective-actor/evaluate

- **Origen:** CONTRATO
- **Nombre:** Evaluar actor efectivo por propósito (step-up)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DelegatedAccessAuthzController.evaluate` — `src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:48`

### Qué es y para qué sirve (negocio)

Evaluar actor efectivo por propósito (step-up). Caso de uso UC-29-09: Evaluar actor efectivo por propósito (step-up). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:236`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/effective-actor/evaluate` la atiende `DelegatedAccessAuthzController.evaluate` (src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:48). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `EvaluateActorDto` (7 campos, 2 obligatorios). Delega en `DelegatedAccessEvaluationService.evaluate`. Crea filas en delegated_access.delegation_events. Lee delegated_access.delegated_access_grants, delegated_access.delegated_permission_set_items, delegated_access.delegated_permission_sets, delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments, directory.tenant_memberships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:48` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_access_grants` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → DelegatedAccessGrantsRepository.findActiveMatch | `src/modules/delegated_access/repositories/delegated-access-grants.repository.ts:118` |
| `delegated_access.delegated_permission_set_items` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → DelegatedPermissionSetItemsRepository.findBySetAndPermission | `src/modules/delegated_access/repositories/delegated-permission-set-items.repository.ts:75` |
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → DelegationScopeService.loadDelegationInTenant → DelegatedPermissionSetsRepository.findById | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:52` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → OrganizationUserAssignmentsRepository.findById | `src/modules/delegated_access/repositories/organization-user-assignments.repository.ts:84` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.evaluate → DelegatedAccessEvaluationService.evaluate → DelegationScopeService.loadDelegationInTenant → PractitionerDelegateAssignmentsRepository.findById | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:78` |
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
| `allowed` | `boolean` | Sí | — | — | Si el acceso está permitido | `src/modules/delegated_access/dto/responses.dto.ts:164` |
| `requiresStepUp` | `boolean` | Sí | — | — | Si exige step-up antes de permitir | `src/modules/delegated_access/dto/responses.dto.ts:170` |
| `reason` | `string` | No | — | — | Motivo cuando no se permite | `src/modules/delegated_access/dto/responses.dto.ts:176` |

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

## 4. POST /delegated-access/expiry-sweep

- **Origen:** CONTRATO
- **Nombre:** Expirar delegaciones y grants vencidos (barrido)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DelegatedAccessAuthzController.expirySweep` — `src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:32`

### Qué es y para qué sirve (negocio)

Expirar delegaciones y grants vencidos (barrido). Caso de uso UC-29-08: Expirar delegaciones y grants vencidos. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:235`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /delegated-access/expiry-sweep` la atiende `DelegatedAccessAuthzController.expirySweep` (src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:32). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `DelegatedAccessEvaluationService.expirySweep`. Crea filas en delegated_access.delegation_events. Actualiza delegated_access.delegated_access_grants, delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments. Lee delegated_access.delegated_access_grants, delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/delegated_access/controllers/delegated-access-authz.controller.ts:32` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_access_grants` | ESCRIBE | ACTUALIZA | POR_TIPO | DelegatedAccessAuthzController.expirySweep → DelegatedAccessEvaluationService.expirySweep | `src/modules/delegated_access/services/delegated-access-evaluation.service.ts:73` |
| `delegated_access.delegated_access_grants` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.expirySweep → DelegatedAccessEvaluationService.expirySweep → DelegatedAccessGrantsRepository.findOverdueActive | `src/modules/delegated_access/repositories/delegated-access-grants.repository.ts:151` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | DelegatedAccessAuthzController.expirySweep → DelegatedAccessEvaluationService.expirySweep → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.organization_user_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | DelegatedAccessAuthzController.expirySweep → DelegatedAccessEvaluationService.expirySweep | `src/modules/delegated_access/services/delegated-access-evaluation.service.ts:106` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.expirySweep → DelegatedAccessEvaluationService.expirySweep → OrganizationUserAssignmentsRepository.findOverdueActive | `src/modules/delegated_access/repositories/organization-user-assignments.repository.ts:142` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | DelegatedAccessAuthzController.expirySweep → DelegatedAccessEvaluationService.expirySweep | `src/modules/delegated_access/services/delegated-access-evaluation.service.ts:90` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | DelegatedAccessAuthzController.expirySweep → DelegatedAccessEvaluationService.expirySweep → PractitionerDelegateAssignmentsRepository.findOverdueActive | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:141` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ExpirySweepResultDto>` · DTO `ExpirySweepResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expiredGrants` | `number` | Sí | — | — | Grants expirados | `src/modules/delegated_access/dto/responses.dto.ts:143` |
| `expiredDelegations` | `number` | Sí | — | — | Delegaciones de practitioner expiradas | `src/modules/delegated_access/dto/responses.dto.ts:149` |
| `expiredOrgAssignments` | `number` | Sí | — | — | Asignaciones de organización expiradas | `src/modules/delegated_access/dto/responses.dto.ts:155` |

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

## 5. POST /delegated-access/support/expire-requests

- **Origen:** CONTRATO
- **Nombre:** Vencer solicitudes de apoyo sin decidir (15 días)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportMaintenanceController.expireRequests` — `src/modules/delegated_access/controllers/practitioner-support.controller.ts:181`

### Qué es y para qué sirve (negocio)

Vencer solicitudes de apoyo sin decidir (15 días). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /delegated-access/support/expire-requests` la atiende `SupportMaintenanceController.expireRequests` (src/modules/delegated_access/controllers/practitioner-support.controller.ts:181). Exige sesión con alguno de los roles SYSTEM. Delega en `SupportMaintenanceService.expireRequests`. Actualiza delegated_access.engagement_requests. Lee delegated_access.engagement_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:181` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.engagement_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportMaintenanceController.expireRequests → SupportMaintenanceService.expireRequests → EngagementRequestsService.expireOverdue | `src/modules/delegated_access/services/engagement-requests.service.ts:439` |
| `delegated_access.engagement_requests` | LEE | LEE | DIRECTA | SupportMaintenanceController.expireRequests → SupportMaintenanceService.expireRequests → EngagementRequestsService.expireOverdue → EngagementRequestsRepository.findOverduePending | `src/modules/delegated_access/repositories/engagement-requests.repository.ts:154` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RequestExpiryResult>` · HTTP `HttpStatus.OK`

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

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportMaintenanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /delegated-access/support/recertification-sweep

- **Origen:** CONTRATO
- **Nombre:** Suspender vínculos sin recertificar (15 días)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportMaintenanceController.recertificationSweep` — `src/modules/delegated_access/controllers/practitioner-support.controller.ts:196`

### Qué es y para qué sirve (negocio)

Suspender vínculos sin recertificar (15 días). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /delegated-access/support/recertification-sweep` la atiende `SupportMaintenanceController.recertificationSweep` (src/modules/delegated_access/controllers/practitioner-support.controller.ts:196). Exige sesión con alguno de los roles SYSTEM. Delega en `SupportMaintenanceService.sweepRecertification`. Crea filas en delegated_access.effective_support_access, delegated_access.practitioner_delegate_assignments. Actualiza delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments, directory.tenant_memberships. Borra de delegated_access.effective_support_access. Lee delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments, delegated_access.support_grant_actions, delegated_access.support_scope_grants, directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.practices y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:196` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.effective_support_access` | BORRA | BORRA | DIRECTA | SupportMaintenanceController.recertificationSweep → SupportMaintenanceService.sweepRecertification → SupportEngagementsService.suspendLapsedRecertifications → EffectiveSupportAccessService.refreshTenant → EffectiveSupportAccessRepository.replace | `src/modules/delegated_access/repositories/effective-support-access.repository.ts:56` |
| `delegated_access.effective_support_access` | ESCRIBE | CREA | DIRECTA | SupportMaintenanceController.recertificationSweep → SupportMaintenanceService.sweepRecertification → SupportEngagementsService.suspendLapsedRecertifications → EffectiveSupportAccessService.refreshTenant → EffectiveSupportAccessRepository.replace | `src/modules/delegated_access/repositories/effective-support-access.repository.ts:61` |
| `delegated_access.organization_user_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportMaintenanceController.recertificationSweep → SupportMaintenanceService.sweepRecertification → SupportEngagementsService.suspendLapsedRecertifications | `src/modules/delegated_access/services/support-engagements.service.ts:573` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportMaintenanceController.recertificationSweep → SupportMaintenanceService.sweepRecertification → SupportEngagementsService.suspendLapsedRecertifications → SupportEngagementsRepository.findActiveDueBefore | `src/modules/delegated_access/repositories/support-engagements.repository.ts:115` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportMaintenanceController.recertificationSweep → SupportMaintenanceService.sweepRecertification → SupportEngagementsService.suspendLapsedRecertifications | `src/modules/delegated_access/services/support-engagements.service.ts:578` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | CREA | DIRECTA | SupportMaintenanceController.recertificationSweep → SupportMaintenanceService.sweepRecertification → SupportEngagementsService.suspendLapsedRecertifications → EffectiveSupportAccessService.refreshTenant → PractitionerDelegateAssignmentsRepository.create | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:92` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | SupportMaintenanceController.recertificationSweep → SupportMaintenanceService.sweepRecertification → SupportEngagementsService.suspendLapsedRecertifications → SupportEngagementsRepository.findDelegations | `src/modules/delegated_access/repositories/support-engagements.repository.ts:137` |
| `delegated_access.support_grant_actions` | LEE | LEE | DIRECTA | SupportMaintenanceController.recertificationSweep → SupportMaintenanceService.sweepRecertification → SupportEngagementsService.suspendLapsedRecertifications → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:165` |
| `delegated_access.support_scope_grants` | LEE | LEE | DIRECTA | SupportMaintenanceController.recertificationSweep → SupportMaintenanceService.sweepRecertification → SupportEngagementsService.suspendLapsedRecertifications → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:161` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | SupportMaintenanceController.recertificationSweep → SupportMaintenanceService.sweepRecertification → SupportEngagementsService.suspendLapsedRecertifications → SupportEngagementsRepository.syncSupportMembership → SupportEngagementsRepository.hasOtherMembershipReason | `src/modules/delegated_access/repositories/support-engagements.repository.ts:249` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportMaintenanceController.recertificationSweep → SupportMaintenanceService.sweepRecertification → SupportEngagementsService.suspendLapsedRecertifications → SupportEngagementsRepository.syncSupportMembership | `src/modules/delegated_access/repositories/support-engagements.repository.ts:217` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportMaintenanceController.recertificationSweep → SupportMaintenanceService.sweepRecertification → SupportEngagementsService.suspendLapsedRecertifications → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:117` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SupportMaintenanceController.recertificationSweep → SupportMaintenanceService.sweepRecertification → SupportEngagementsService.suspendLapsedRecertifications → EffectiveSupportAccessService.refreshTenant → EffectiveSupportAccessService.toExpandable → SupportAccessRepository.findCareSpaceIdsWithin | `src/modules/delegated_access/repositories/support-access.repository.ts:413` |
| `practice.practices` | LEE | LEE | DIRECTA | SupportMaintenanceController.recertificationSweep → SupportMaintenanceService.sweepRecertification → SupportEngagementsService.suspendLapsedRecertifications → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findRoleAssignmentsOfTenant | `src/modules/delegated_access/repositories/support-access.repository.ts:260` |
| `practice.practitioner_location_assignments` | LEE | LEE | DIRECTA | SupportMaintenanceController.recertificationSweep → SupportMaintenanceService.sweepRecertification → SupportEngagementsService.suspendLapsedRecertifications → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findLocationPairs | `src/modules/delegated_access/repositories/support-access.repository.ts:467` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | SupportMaintenanceController.recertificationSweep → SupportMaintenanceService.sweepRecertification → SupportEngagementsService.suspendLapsedRecertifications → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findRoleAssignmentsOfTenant | `src/modules/delegated_access/repositories/support-access.repository.ts:266` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RecertificationSweepResult>` · HTTP `HttpStatus.OK`

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

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportMaintenanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /delegated-access/support/refresh-effective-access

- **Origen:** CONTRATO
- **Nombre:** Recalcular el acceso efectivo del personal de apoyo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportMaintenanceController.refresh` — `src/modules/delegated_access/controllers/practitioner-support.controller.ts:209`

### Qué es y para qué sirve (negocio)

Recalcular el acceso efectivo del personal de apoyo. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /delegated-access/support/refresh-effective-access` la atiende `SupportMaintenanceController.refresh` (src/modules/delegated_access/controllers/practitioner-support.controller.ts:209). Exige sesión con alguno de los roles SYSTEM. Delega en `SupportMaintenanceService.refreshEffectiveAccess`. Crea filas en delegated_access.effective_support_access, delegated_access.practitioner_delegate_assignments. Borra de delegated_access.effective_support_access. Lee delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments, delegated_access.support_grant_actions, delegated_access.support_scope_grants, directory.tenant_memberships, practice.care_spaces, practice.practices, practice.practitioner_location_assignments y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:209` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.effective_support_access` | BORRA | BORRA | DIRECTA | SupportMaintenanceController.refresh → SupportMaintenanceService.refreshEffectiveAccess → EffectiveSupportAccessService.refreshTenant → EffectiveSupportAccessRepository.replace | `src/modules/delegated_access/repositories/effective-support-access.repository.ts:56` |
| `delegated_access.effective_support_access` | ESCRIBE | CREA | DIRECTA | SupportMaintenanceController.refresh → SupportMaintenanceService.refreshEffectiveAccess → EffectiveSupportAccessService.refreshTenant → EffectiveSupportAccessRepository.replace | `src/modules/delegated_access/repositories/effective-support-access.repository.ts:61` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportMaintenanceController.refresh → SupportMaintenanceService.refreshEffectiveAccess → EffectiveSupportAccessService.tenantsWithEngagements → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:113` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | CREA | DIRECTA | SupportMaintenanceController.refresh → SupportMaintenanceService.refreshEffectiveAccess → EffectiveSupportAccessService.refreshTenant → PractitionerDelegateAssignmentsRepository.create | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:92` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | SupportMaintenanceController.refresh → SupportMaintenanceService.refreshEffectiveAccess → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findDelegationsOfEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:199` |
| `delegated_access.support_grant_actions` | LEE | LEE | DIRECTA | SupportMaintenanceController.refresh → SupportMaintenanceService.refreshEffectiveAccess → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:165` |
| `delegated_access.support_scope_grants` | LEE | LEE | DIRECTA | SupportMaintenanceController.refresh → SupportMaintenanceService.refreshEffectiveAccess → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:161` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportMaintenanceController.refresh → SupportMaintenanceService.refreshEffectiveAccess → EffectiveSupportAccessService.tenantsWithEngagements → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:117` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SupportMaintenanceController.refresh → SupportMaintenanceService.refreshEffectiveAccess → EffectiveSupportAccessService.refreshTenant → EffectiveSupportAccessService.toExpandable → SupportAccessRepository.findCareSpaceIdsWithin | `src/modules/delegated_access/repositories/support-access.repository.ts:413` |
| `practice.practices` | LEE | LEE | DIRECTA | SupportMaintenanceController.refresh → SupportMaintenanceService.refreshEffectiveAccess → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findRoleAssignmentsOfTenant | `src/modules/delegated_access/repositories/support-access.repository.ts:260` |
| `practice.practitioner_location_assignments` | LEE | LEE | DIRECTA | SupportMaintenanceController.refresh → SupportMaintenanceService.refreshEffectiveAccess → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findLocationPairs | `src/modules/delegated_access/repositories/support-access.repository.ts:467` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | SupportMaintenanceController.refresh → SupportMaintenanceService.refreshEffectiveAccess → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findRoleAssignmentsOfTenant | `src/modules/delegated_access/repositories/support-access.repository.ts:266` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<EffectiveRefreshAllResult>` · HTTP `HttpStatus.OK`

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

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportMaintenanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /delegated-permission-sets

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
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| `items` | `array<PermissionSetSummaryDto>` | Sí | — | — | Sets de esta página, ordenados por `id`. | `src/modules/delegated_access/dto/responses.dto.ts:70` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/delegated_access/dto/responses.dto.ts:35` |
| `items[].code` | `string` | Sí | — | — | Código del set, único dentro del tenant. | `src/modules/delegated_access/dto/responses.dto.ts:39` |
| `items[].name` | `string` | Sí | — | — | Nombre visible del set. | `src/modules/delegated_access/dto/responses.dto.ts:43` |
| `items[].delegateTypeConceptId` | `string` | Sí | formato uuid | — | Concepto del tipo de delegado al que aplica. | `src/modules/delegated_access/dto/responses.dto.ts:47` |
| `items[].description` | `string` | No | — | — | Descripción libre, si se publicó una. | `src/modules/delegated_access/dto/responses.dto.ts:51` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Concepto de estado del set. | `src/modules/delegated_access/dto/responses.dto.ts:55` |
| `items[].versionNumber` | `number` | Sí | — | — | Versión publicada más reciente. | `src/modules/delegated_access/dto/responses.dto.ts:59` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Fecha de creación del set. | `src/modules/delegated_access/dto/responses.dto.ts:63` |
| `count` | `number` | Sí | — | — | Cantidad devuelta en esta página. | `src/modules/delegated_access/dto/responses.dto.ts:73` |
| `limit` | `number` | Sí | — | — | Tope aplicado a la consulta. | `src/modules/delegated_access/dto/responses.dto.ts:76` |
| `nextCursor` | `string` | Sí | admite null | — | Cursor opaco de continuación, o `null` si ésta es la última página. | `src/modules/delegated_access/dto/responses.dto.ts:80` |

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

## 9. POST /delegated-permission-sets

- **Origen:** CONTRATO
- **Nombre:** Publicar set de permisos delegados (scoped)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DelegatedPermissionSetsController.createSet` — `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:64`

### Qué es y para qué sirve (negocio)

Publicar set de permisos delegados (scoped). Caso de uso UC-29-02: Publicar set de permisos delegados (v1). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:228`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /delegated-permission-sets` la atiende `DelegatedPermissionSetsController.createSet` (src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:64). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePermissionSetDto` (9 campos, 5 obligatorios). Delega en `PermissionSetsService.createSet`. Crea filas en delegated_access.delegated_permission_set_items, delegated_access.delegated_permission_sets. Lee delegated_access.delegated_permission_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:64` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/delegated_access/dto/responses.dto.ts:89` |
| `versionNumber` | `number` | Sí | — | — | Número de versión publicada | `src/modules/delegated_access/dto/responses.dto.ts:95` |
| `itemCount` | `number` | Sí | — | — | Nº de ítems de permiso de la versión | `src/modules/delegated_access/dto/responses.dto.ts:101` |

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

## 10. POST /delegated-permission-sets/{id}/versions

- **Origen:** CONTRATO
- **Nombre:** Versionar set de permisos delegados
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DelegatedPermissionSetsController.publishVersion` — `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:81`

### Qué es y para qué sirve (negocio)

Versionar set de permisos delegados. Caso de uso UC-29-02: Versionar set (reemplazo all-or-nothing). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:229`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /delegated-permission-sets/{id}/versions` la atiende `DelegatedPermissionSetsController.publishVersion` (src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:81). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PublishSetVersionDto` (4 campos, 2 obligatorios). Delega en `PermissionSetsService.publishVersion`. Crea filas en delegated_access.delegated_permission_set_items. Actualiza delegated_access.delegated_permission_sets. Borra de delegated_access.delegated_permission_set_items. Lee delegated_access.delegated_permission_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:81` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/delegated-permission-sets.controller.ts:81` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/delegated_access/dto/responses.dto.ts:89` |
| `versionNumber` | `number` | Sí | — | — | Número de versión publicada | `src/modules/delegated_access/dto/responses.dto.ts:95` |
| `itemCount` | `number` | Sí | — | — | Nº de ítems de permiso de la versión | `src/modules/delegated_access/dto/responses.dto.ts:101` |

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

## 11. GET /me/practitioner/support-access-requests

- **Origen:** CONTRATO
- **Nombre:** Solicitudes de acceso clínico temporal de mi equipo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSupportController.accessRequests` — `src/modules/delegated_access/controllers/practitioner-support.controller.ts:76`

### Qué es y para qué sirve (negocio)

Solicitudes de acceso clínico temporal de mi equipo. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /me/practitioner/support-access-requests` la atiende `PractitionerSupportController.accessRequests` (src/modules/delegated_access/controllers/practitioner-support.controller.ts:76). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `PractitionerSupportService.accessRequests`. Lee delegated_access.delegated_access_approval_requests, delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments, directory.tenant_memberships, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:76` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_access_approval_requests` | LEE | LEE | DIRECTA | PractitionerSupportController.accessRequests → PractitionerSupportService.accessRequests → DelegatedAccessApprovalRequestsRepository.findOpenByDelegates | `src/modules/delegated_access/repositories/delegated-access-approval-requests.repository.ts:68` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.accessRequests → PractitionerSupportService.accessRequests → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:113` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.accessRequests → PractitionerSupportService.accessRequests → SupportEngagementsRepository.findDelegationsOfDoctor | `src/modules/delegated_access/repositories/support-engagements.repository.ts:154` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PractitionerSupportController.accessRequests → PractitionerSupportService.accessRequests → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:117` |
| `practice.practices` | LEE | LEE | DIRECTA | PractitionerSupportController.accessRequests → PractitionerSupportService.accessRequests → SupportAccessRepository.findRoleAssignmentsOfPractitioner → SupportAccessRepository.findRoleAssignmentsOfTenant | `src/modules/delegated_access/repositories/support-access.repository.ts:260` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.accessRequests → PractitionerSupportService.accessRequests → SupportAccessRepository.findRoleAssignmentsOfPractitioner → SupportAccessRepository.findRoleAssignmentsOfTenant | `src/modules/delegated_access/repositories/support-access.repository.ts:266` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportAccessRequestsResponseDto>` · DTO `SupportAccessRequestsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SupportAccessRequestViewDto>` | Sí | — | — | Solicitudes abiertas. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:145` |
| `items[].id` | `string` | Sí | formato uuid | — | Id de la solicitud (el que se decide en `POST /access-requests/:id/decision`). | `src/modules/delegated_access/dto/practitioner-support.dto.ts:126` |
| `items[].delegateId` | `string` | Sí | formato uuid | — | Delegación del doctor con la persona que pide. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:128` |
| `items[].userId` | `string` | Sí | formato uuid | — | Persona de apoyo que pide. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:130` |
| `items[].patientProfileId` | `string` | No | formato uuid | — | Paciente cuya historia pide ver. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:132` |
| `items[].encounterId` | `string` | No | formato uuid | — | Encuentro, si pide una consulta concreta. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:134` |
| `items[].reasonText` | `string` | No | — | — | Para qué lo necesita. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:136` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se pidió. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:138` |
| `count` | `number` | Sí | — | — | Cantidad. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:147` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La cuenta no tiene perfil profesional: no tiene equipo de apoyo. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PractitionerSupportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. GET /me/practitioner/support-activity

- **Origen:** CONTRATO
- **Nombre:** Actividad de mi equipo de apoyo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSupportController.teamActivity` — `src/modules/delegated_access/controllers/practitioner-support.controller.ts:88`

### Qué es y para qué sirve (negocio)

Actividad de mi equipo de apoyo. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /me/practitioner/support-activity` la atiende `PractitionerSupportController.teamActivity` (src/modules/delegated_access/controllers/practitioner-support.controller.ts:88). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `SupportActivityService.forPractitioner`. Lee audit.audit_log, delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments, delegated_access.support_scope_grants, directory.tenant_memberships, iam.users, practice.practices, practice.practitioner_role_assignments y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:88` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | LEE | LEE | DIRECTA | PractitionerSupportController.teamActivity → SupportActivityService.forPractitioner → SupportActivityService.page → SupportActivityRepository.scan | `src/modules/delegated_access/repositories/support-activity.repository.ts:95` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.teamActivity → SupportActivityService.forPractitioner → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:113` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.teamActivity → SupportActivityService.forPractitioner → SupportEngagementsRepository.findDelegationsOfDoctor | `src/modules/delegated_access/repositories/support-engagements.repository.ts:154` |
| `delegated_access.support_scope_grants` | LEE | LEE | POR_SQL | PractitionerSupportController.teamActivity → SupportActivityService.forPractitioner → SupportActivityService.page → SupportActivityRepository.attributions | `src/modules/delegated_access/repositories/support-activity.repository.ts:302` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PractitionerSupportController.teamActivity → SupportActivityService.forPractitioner → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:117` |
| `iam.users` | LEE | LEE | POR_SQL | PractitionerSupportController.teamActivity → SupportActivityService.forPractitioner → SupportActivityService.page → SupportActivityRepository.userNames | `src/modules/delegated_access/repositories/support-activity.repository.ts:111` |
| `practice.practices` | LEE | LEE | DIRECTA | PractitionerSupportController.teamActivity → SupportActivityService.forPractitioner → SupportAccessRepository.findRoleAssignmentsOfPractitioner → SupportAccessRepository.findRoleAssignmentsOfTenant | `src/modules/delegated_access/repositories/support-access.repository.ts:260` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.teamActivity → SupportActivityService.forPractitioner → SupportAccessRepository.findRoleAssignmentsOfPractitioner → SupportAccessRepository.findRoleAssignmentsOfTenant | `src/modules/delegated_access/repositories/support-access.repository.ts:266` |
| `profiles.persons` | LEE | LEE | POR_SQL | PractitionerSupportController.teamActivity → SupportActivityService.forPractitioner → SupportActivityService.page → SupportActivityRepository.attributions | `src/modules/delegated_access/repositories/support-activity.repository.ts:244` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | PractitionerSupportController.teamActivity → SupportActivityService.forPractitioner → SupportActivityService.page → SupportActivityRepository.attributions | `src/modules/delegated_access/repositories/support-activity.repository.ts:244` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | PractitionerSupportController.teamActivity → SupportActivityService.forPractitioner → SupportActivityService.page → SupportActivityRepository.attributions | `src/modules/delegated_access/repositories/support-activity.repository.ts:244` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `userId` | query | No | `string` | — |
| `tenantId` | query | No | `string` | — |
| `person` | query | No | `string` | — |
| `doctor` | query | No | `string` | — |
| `action` | query | No | `string` | — |
| `from` | query | No | `string` | — |
| `to` | query | No | `string` | — |
| `limit` | query | No | `number` | — |
| `cursor` | query | No | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportActivityResponseDto>` · DTO `SupportActivityResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SupportActivityEntryDto>` | Sí | — | — | Asientos. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:320` |
| `items[].id` | `string` | Sí | formato uuid | — | Id del asiento. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:268` |
| `items[].tenantId` | `string` | No | formato uuid | — | Organización a la que pertenece el asiento. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:270` |
| `items[].userId` | `string` | Sí | formato uuid | — | Persona que actuó. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:272` |
| `items[].personName` | `string` | Sí | — | — | Nombre de la persona que actuó. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:274` |
| `items[].actorName` | `string` | Sí | — | — | Igual que `personName`. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:276` |
| `items[].action` | `string` | Sí | — | — | Código de la entrada: el permiso con el que se actuó (`schedule.check_in`) o el evento (`engagement.ended`); un asiento que no se reconoce conserva el suyo (`auditAction`). | `src/modules/delegated_access/dto/practitioner-support.dto.ts:282` |
| `items[].auditAction` | `string` | Sí | — | — | Asiento de la cadena de auditoría tal como se selló (`BOOKING_CHECKED_IN`). | `src/modules/delegated_access/dto/practitioner-support.dto.ts:284` |
| `items[].permission` | `string` | No | — | — | Permiso de apoyo con el que se hizo, si es una acción de agenda. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:286` |
| `items[].entity` | `string` | Sí | — | — | Recurso afectado. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:288` |
| `items[].entityId` | `string` | No | formato uuid | — | Id del recurso. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:290` |
| `items[].bookingId` | `string` | No | formato uuid | — | Reserva a la que se refiere el asiento. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:292` |
| `items[].appointmentId` | `string` | No | formato uuid | — | Cita a la que se refiere el asiento. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:294` |
| `items[].practitionerProfileId` | `string` | No | formato uuid | — | Doctor sobre cuya agenda o equipo se actuó (perfil profesional). | `src/modules/delegated_access/dto/practitioner-support.dto.ts:296` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid | — | Asignación de rol del doctor, si el asiento la nombra. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:299` |
| `items[].practitionerName` | `string` | No | — | — | Nombre del doctor; solo si quien consulta puede verlo. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:301` |
| `items[].summary` | `string` | Sí | — | — | La acción en una frase. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:303` |
| `items[].success` | `boolean` | Sí | — | — | ¿Se hizo? | `src/modules/delegated_access/dto/practitioner-support.dto.ts:305` |
| `items[].result` | `string` | Sí | valores: SUCCESS, FAILURE | — | Resultado: `SUCCESS` o `FAILURE`. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:307` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:309` |
| `items[].occurredAt` | `string` | Sí | formato date-time | — | Igual que `createdAt`. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:311` |
| `items[].recordedAt` | `string` | Sí | formato date-time | — | Igual que `createdAt` (nombre de la primera versión). | `src/modules/delegated_access/dto/practitioner-support.dto.ts:313` |
| `count` | `number` | Sí | — | — | Cantidad. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:322` |
| `nextCursor` | `string` | Sí | admite null | — | Cursor de continuación. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:324` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La cuenta no tiene perfil profesional: no tiene equipo de apoyo. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PractitionerSupportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. GET /me/practitioner/support-team

- **Origen:** CONTRATO
- **Nombre:** Mi equipo de apoyo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSupportController.team` — `src/modules/delegated_access/controllers/practitioner-support.controller.ts:66`

### Qué es y para qué sirve (negocio)

Mi equipo de apoyo. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /me/practitioner/support-team` la atiende `PractitionerSupportController.team` (src/modules/delegated_access/controllers/practitioner-support.controller.ts:66). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `PractitionerSupportService.supportTeam`. Lee audit.audit_log, delegated_access.delegated_access_approval_requests, delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments, delegated_access.role_templates, delegated_access.support_grant_actions, delegated_access.support_scope_grants, directory.tenant_memberships y 7 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:66` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | LEE | LEE | POR_SQL | PractitionerSupportController.team → PractitionerSupportService.supportTeam → SupportActivityRepository.lastActivity | `src/modules/delegated_access/repositories/support-activity.repository.ts:342` |
| `delegated_access.delegated_access_approval_requests` | LEE | LEE | DIRECTA | PractitionerSupportController.team → PractitionerSupportService.supportTeam → DelegatedAccessApprovalRequestsRepository.findOpenByDelegates | `src/modules/delegated_access/repositories/delegated-access-approval-requests.repository.ts:68` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.team → PractitionerSupportService.supportTeam → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:113` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.team → PractitionerSupportService.supportTeam → SupportEngagementsRepository.findDelegationsOfDoctor | `src/modules/delegated_access/repositories/support-engagements.repository.ts:154` |
| `delegated_access.role_templates` | LEE | LEE | DIRECTA | PractitionerSupportController.team → PractitionerSupportService.supportTeam → RoleTemplatesRepository.findById | `src/modules/delegated_access/repositories/role-templates.repository.ts:35` |
| `delegated_access.support_grant_actions` | LEE | LEE | DIRECTA | PractitionerSupportController.team → PractitionerSupportService.supportTeam → EffectiveSupportAccessService.previewForDoctor → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:165` |
| `delegated_access.support_scope_grants` | LEE | LEE | DIRECTA | PractitionerSupportController.team → PractitionerSupportService.supportTeam → EffectiveSupportAccessService.previewForDoctor → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:161` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PractitionerSupportController.team → PractitionerSupportService.supportTeam → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:117` |
| `directory.tenants` | LEE | LEE | POR_SQL | PractitionerSupportController.team → PractitionerSupportService.supportTeam → SupportActivityRepository.tenantNames | `src/modules/delegated_access/repositories/support-activity.repository.ts:170` |
| `iam.users` | LEE | LEE | POR_SQL | PractitionerSupportController.team → PractitionerSupportService.supportTeam → SupportActivityRepository.userNames | `src/modules/delegated_access/repositories/support-activity.repository.ts:111` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | PractitionerSupportController.team → PractitionerSupportService.supportTeam → EffectiveSupportAccessService.previewForDoctor → EffectiveSupportAccessService.toExpandable → SupportAccessRepository.findCareSpaceIdsWithin | `src/modules/delegated_access/repositories/support-access.repository.ts:413` |
| `practice.practices` | LEE | LEE | DIRECTA | PractitionerSupportController.team → PractitionerSupportService.supportTeam → SupportAccessRepository.findRoleAssignmentsOfPractitioner → SupportAccessRepository.findRoleAssignmentsOfTenant | `src/modules/delegated_access/repositories/support-access.repository.ts:260` |
| `practice.practitioner_location_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.team → PractitionerSupportService.supportTeam → EffectiveSupportAccessService.previewForDoctor → SupportAccessRepository.findLocationPairs | `src/modules/delegated_access/repositories/support-access.repository.ts:467` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.team → PractitionerSupportService.supportTeam → SupportAccessRepository.findRoleAssignmentsOfPractitioner → SupportAccessRepository.findRoleAssignmentsOfTenant | `src/modules/delegated_access/repositories/support-access.repository.ts:266` |
| `profiles.persons` | LEE | LEE | POR_SQL | PractitionerSupportController.team → PractitionerSupportService.supportTeam → SupportActivityRepository.profileNames | `src/modules/delegated_access/repositories/support-activity.repository.ts:126` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportTeamResponseDto>` · DTO `SupportTeamResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SupportTeamMemberDto>` | Sí | — | — | Integrantes. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:118` |
| `items[].delegateId` | `string` | Sí | formato uuid | — | Delegación (id para aceptar, revocar o ajustar respuestas). | `src/modules/delegated_access/dto/practitioner-support.dto.ts:72` |
| `items[].userId` | `string` | Sí | formato uuid | — | Persona de apoyo. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:74` |
| `items[].personName` | `string` | Sí | — | — | Nombre de la persona de apoyo. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:76` |
| `items[].engagementId` | `string` | Sí | formato uuid | — | Vínculo de apoyo. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:78` |
| `items[].tenantId` | `string` | No | formato uuid | — | Organización del vínculo. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:80` |
| `items[].organizationName` | `string` | No | — | — | Nombre de la organización. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:82` |
| `items[].roleTemplateCode` | `string` | No | — | — | Plantilla de rol (código). | `src/modules/delegated_access/dto/practitioner-support.dto.ts:84` |
| `items[].roleTemplate` | `string` | No | — | — | Igual que `roleTemplateCode` (nombre que usan las pantallas). | `src/modules/delegated_access/dto/practitioner-support.dto.ts:86` |
| `items[].status` | `string` | Sí | valores: PENDING_ACCEPTANCE, ACTIVE, REVOKED | — | Estado para el doctor: `PENDING_ACCEPTANCE` (la delegación está activa y él todavía no la aceptó), `ACTIVE` o `REVOKED` (retirada, suspendida o vencida). | `src/modules/delegated_access/dto/practitioner-support.dto.ts:92` |
| `items[].delegateStatus` | `string` | Sí | — | — | Estado de la delegación tal cual: `ACTIVE`, `SUSPENDED`, `REVOKED` o `EXPIRED`. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:94` |
| `items[].accepted` | `boolean` | Sí | — | — | ¿El doctor ya la aceptó? | `src/modules/delegated_access/dto/practitioner-support.dto.ts:96` |
| `items[].acceptedAt` | `string` | No | formato date-time | — | Fecha de aceptación. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:98` |
| `items[].mayReplyOnBehalf` | `boolean` | Sí | — | — | ¿Puede responder en su nombre? | `src/modules/delegated_access/dto/practitioner-support.dto.ts:100` |
| `items[].replyDisclosure` | `string` | Sí | — | — | SHOW o HIDE. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:102` |
| `items[].actions` | `array<string>` | Sí | — | — | Acciones que tiene sobre este doctor (unión de sus permisos que lo cubren). | `src/modules/delegated_access/dto/practitioner-support.dto.ts:104` |
| `items[].coverageSummary` | `string` | Sí | — | — | Qué cubre de este doctor, resumido en una línea para mostrar. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:106` |
| `items[].lastActivityAt` | `string` | No | formato date-time | — | Última actividad de la persona en la organización (últimos 90 días). | `src/modules/delegated_access/dto/practitioner-support.dto.ts:109` |
| `items[].pendingClinicalRequests` | `array<PendingClinicalAccessRequestDto>` | Sí | — | — | Accesos clínicos temporales que la persona pidió y el doctor aún no decide. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:112` |
| `items[].pendingClinicalRequests[].requestId` | `string` | Sí | formato uuid | — | Id de la solicitud (`POST /access-requests/:id/decision`). | `src/modules/delegated_access/dto/practitioner-support.dto.ts:58` |
| `items[].pendingClinicalRequests[].patientLabel` | `string` | Sí | — | — | Etiqueta corta del paciente («Juan P.»): nunca el nombre completo. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:60` |
| `items[].pendingClinicalRequests[].reasonText` | `string` | Sí | — | — | Para qué lo pide la persona. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:62` |
| `items[].pendingClinicalRequests[].requestedAt` | `string` | Sí | formato date-time | — | Cuándo la pidió. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:64` |
| `items[].pendingClinicalRequests[].requestedHours` | `number` | Sí | — | — | Horas de acceso que rigen si el doctor no fija otra vigencia al aprobar. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:66` |
| `count` | `number` | Sí | — | — | Cantidad. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:120` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La cuenta no tiene perfil profesional: no tiene equipo de apoyo. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PractitionerSupportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. POST /me/support-access-requests

- **Origen:** CONTRATO
- **Nombre:** Pedir acceso clínico temporal a un paciente (lo decide el doctor)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportEngagementRequestsController.requestClinicalAccess` — `src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:143`

### Qué es y para qué sirve (negocio)

Pedir acceso clínico temporal a un paciente (lo decide el doctor). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /me/support-access-requests` la atiende `SupportEngagementRequestsController.requestClinicalAccess` (src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:143). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateSupportAccessRequestDto` (5 campos, 4 obligatorios). Delega en `AccessRequestsService.requestAsSupport`. Crea filas en delegated_access.delegated_access_approval_requests, delegated_access.delegation_events. Lee clinical.encounters, delegated_access.delegated_access_approval_requests, delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments, directory.tenant_memberships, practice.practices, practice.practitioner_role_assignments, profiles.patient_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:143` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:143` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.requestClinicalAccess → AccessRequestsService.requestAsSupport → DelegationScopeService.assertGrantTarget → DelegationScopeRepository.encounterScope | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:101` |
| `delegated_access.delegated_access_approval_requests` | ESCRIBE | CREA | DIRECTA | SupportEngagementRequestsController.requestClinicalAccess → AccessRequestsService.requestAsSupport → AccessRequestsService.openRequest → DelegatedAccessApprovalRequestsRepository.create | `src/modules/delegated_access/repositories/delegated-access-approval-requests.repository.ts:107` |
| `delegated_access.delegated_access_approval_requests` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.requestClinicalAccess → AccessRequestsService.requestAsSupport → AccessRequestsService.openRequest → DelegatedAccessApprovalRequestsRepository.findOpenDuplicate | `src/modules/delegated_access/repositories/delegated-access-approval-requests.repository.ts:87` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | SupportEngagementRequestsController.requestClinicalAccess → AccessRequestsService.requestAsSupport → AccessRequestsService.openRequest → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.requestClinicalAccess → AccessRequestsService.requestAsSupport → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:113` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.requestClinicalAccess → AccessRequestsService.requestAsSupport → SupportAccessRepository.findDelegationsOfEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:199` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.requestClinicalAccess → AccessRequestsService.requestAsSupport → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:117` |
| `practice.practices` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.requestClinicalAccess → AccessRequestsService.requestAsSupport → SupportAccessRepository.findDelegationsOfEngagements → SupportAccessRepository.findRoleAssignments | `src/modules/delegated_access/repositories/support-access.repository.ts:230` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.requestClinicalAccess → AccessRequestsService.requestAsSupport → SupportAccessRepository.findDelegationsOfEngagements → SupportAccessRepository.findRoleAssignments | `src/modules/delegated_access/repositories/support-access.repository.ts:227` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.requestClinicalAccess → AccessRequestsService.requestAsSupport → DelegationScopeService.assertGrantTarget → DelegationScopeRepository.patientExists | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:121` |

### Cuerpo — DTO `CreateSupportAccessRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/delegated_access/dto/support-access-request.dto.ts:18` |
| `practitionerProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/delegated_access/dto/support-access-request.dto.ts:23` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/delegated_access/dto/support-access-request.dto.ts:28` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/support-access-request.dto.ts:34` |
| `reasonText` | `string` | Sí | longitud mínima 5; longitud máxima 1000 | `@IsString()` `@MinLength(5)` `@MaxLength(1000)` | — | `src/modules/delegated_access/dto/support-access-request.dto.ts:41` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
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
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No tiene un vínculo de apoyo en esa organización |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Delegación no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya existe una solicitud pendiente equivalente |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La delegación no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportEngagementRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. GET /me/support-activity

- **Origen:** CONTRATO
- **Nombre:** Mi actividad como personal de apoyo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSupportController.myActivity` — `src/modules/delegated_access/controllers/practitioner-support.controller.ts:102`

### Qué es y para qué sirve (negocio)

Mi actividad como personal de apoyo. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /me/support-activity` la atiende `PractitionerSupportController.myActivity` (src/modules/delegated_access/controllers/practitioner-support.controller.ts:102). Exige sesión; el controlador no declara roles. Delega en `SupportActivityService.forPerson`. Lee audit.audit_log, delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments, delegated_access.support_scope_grants, directory.tenant_memberships, iam.users, practice.practices, practice.practitioner_role_assignments y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:102` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:102` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | LEE | LEE | DIRECTA | PractitionerSupportController.myActivity → SupportActivityService.forPerson → SupportActivityService.page → SupportActivityRepository.scan | `src/modules/delegated_access/repositories/support-activity.repository.ts:95` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.myActivity → SupportActivityService.forPerson → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:113` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.myActivity → SupportActivityService.forPerson → SupportAccessRepository.findDelegationsOfEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:199` |
| `delegated_access.support_scope_grants` | LEE | LEE | POR_SQL | PractitionerSupportController.myActivity → SupportActivityService.forPerson → SupportActivityService.page → SupportActivityRepository.attributions | `src/modules/delegated_access/repositories/support-activity.repository.ts:302` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PractitionerSupportController.myActivity → SupportActivityService.forPerson → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:117` |
| `iam.users` | LEE | LEE | POR_SQL | PractitionerSupportController.myActivity → SupportActivityService.forPerson → SupportActivityService.page → SupportActivityRepository.userNames | `src/modules/delegated_access/repositories/support-activity.repository.ts:111` |
| `practice.practices` | LEE | LEE | DIRECTA | PractitionerSupportController.myActivity → SupportActivityService.forPerson → SupportAccessRepository.findDelegationsOfEngagements → SupportAccessRepository.findRoleAssignments | `src/modules/delegated_access/repositories/support-access.repository.ts:230` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.myActivity → SupportActivityService.forPerson → SupportAccessRepository.findDelegationsOfEngagements → SupportAccessRepository.findRoleAssignments | `src/modules/delegated_access/repositories/support-access.repository.ts:227` |
| `profiles.persons` | LEE | LEE | POR_SQL | PractitionerSupportController.myActivity → SupportActivityService.forPerson → SupportActivityService.page → SupportActivityRepository.attributions | `src/modules/delegated_access/repositories/support-activity.repository.ts:244` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | PractitionerSupportController.myActivity → SupportActivityService.forPerson → SupportActivityService.page → SupportActivityRepository.attributions | `src/modules/delegated_access/repositories/support-activity.repository.ts:244` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | PractitionerSupportController.myActivity → SupportActivityService.forPerson → SupportActivityService.page → SupportActivityRepository.attributions | `src/modules/delegated_access/repositories/support-activity.repository.ts:244` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `userId` | query | No | `string` | — |
| `tenantId` | query | No | `string` | — |
| `person` | query | No | `string` | — |
| `doctor` | query | No | `string` | — |
| `action` | query | No | `string` | — |
| `from` | query | No | `string` | — |
| `to` | query | No | `string` | — |
| `limit` | query | No | `number` | — |
| `cursor` | query | No | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportActivityResponseDto>` · DTO `SupportActivityResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SupportActivityEntryDto>` | Sí | — | — | Asientos. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:320` |
| `items[].id` | `string` | Sí | formato uuid | — | Id del asiento. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:268` |
| `items[].tenantId` | `string` | No | formato uuid | — | Organización a la que pertenece el asiento. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:270` |
| `items[].userId` | `string` | Sí | formato uuid | — | Persona que actuó. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:272` |
| `items[].personName` | `string` | Sí | — | — | Nombre de la persona que actuó. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:274` |
| `items[].actorName` | `string` | Sí | — | — | Igual que `personName`. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:276` |
| `items[].action` | `string` | Sí | — | — | Código de la entrada: el permiso con el que se actuó (`schedule.check_in`) o el evento (`engagement.ended`); un asiento que no se reconoce conserva el suyo (`auditAction`). | `src/modules/delegated_access/dto/practitioner-support.dto.ts:282` |
| `items[].auditAction` | `string` | Sí | — | — | Asiento de la cadena de auditoría tal como se selló (`BOOKING_CHECKED_IN`). | `src/modules/delegated_access/dto/practitioner-support.dto.ts:284` |
| `items[].permission` | `string` | No | — | — | Permiso de apoyo con el que se hizo, si es una acción de agenda. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:286` |
| `items[].entity` | `string` | Sí | — | — | Recurso afectado. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:288` |
| `items[].entityId` | `string` | No | formato uuid | — | Id del recurso. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:290` |
| `items[].bookingId` | `string` | No | formato uuid | — | Reserva a la que se refiere el asiento. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:292` |
| `items[].appointmentId` | `string` | No | formato uuid | — | Cita a la que se refiere el asiento. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:294` |
| `items[].practitionerProfileId` | `string` | No | formato uuid | — | Doctor sobre cuya agenda o equipo se actuó (perfil profesional). | `src/modules/delegated_access/dto/practitioner-support.dto.ts:296` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid | — | Asignación de rol del doctor, si el asiento la nombra. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:299` |
| `items[].practitionerName` | `string` | No | — | — | Nombre del doctor; solo si quien consulta puede verlo. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:301` |
| `items[].summary` | `string` | Sí | — | — | La acción en una frase. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:303` |
| `items[].success` | `boolean` | Sí | — | — | ¿Se hizo? | `src/modules/delegated_access/dto/practitioner-support.dto.ts:305` |
| `items[].result` | `string` | Sí | valores: SUCCESS, FAILURE | — | Resultado: `SUCCESS` o `FAILURE`. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:307` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:309` |
| `items[].occurredAt` | `string` | Sí | formato date-time | — | Igual que `createdAt`. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:311` |
| `items[].recordedAt` | `string` | Sí | formato date-time | — | Igual que `createdAt` (nombre de la primera versión). | `src/modules/delegated_access/dto/practitioner-support.dto.ts:313` |
| `count` | `number` | Sí | — | — | Cantidad. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:322` |
| `nextCursor` | `string` | Sí | admite null | — | Cursor de continuación. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:324` |

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

## 16. GET /me/support-catalog

- **Origen:** CONTRATO
- **Nombre:** Catálogo de una organización para pedir permisos
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportEngagementRequestsController.catalog` — `src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:107`

### Qué es y para qué sirve (negocio)

Catálogo de una organización para pedir permisos. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /me/support-catalog` la atiende `SupportEngagementRequestsController.catalog` (src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:107). Exige sesión; el controlador no declara roles. Delega en `SupportCatalogService.forPerson`. Lee delegated_access.engagement_requests, delegated_access.organization_user_assignments, directory.tenant_memberships, practice.care_spaces, practice.healthcare_services, practice.practice_sites, practice.practices, practice.practitioner_location_assignments y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:107` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:107` |
| PARAMETRO_QUERY | org (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.engagement_requests` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.catalog → SupportCatalogService.forPerson → EngagementRequestsRepository.findByRequester | `src/modules/delegated_access/repositories/engagement-requests.repository.ts:132` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.catalog → SupportCatalogService.forPerson → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:113` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.catalog → SupportCatalogService.forPerson → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:117` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.catalog → SupportCatalogService.forPerson → SupportCatalogService.build → SupportCatalogRepository.locations | `src/modules/delegated_access/repositories/support-catalog.repository.ts:147` |
| `practice.healthcare_services` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.catalog → SupportCatalogService.forPerson → SupportCatalogService.build → SupportCatalogRepository.services | `src/modules/delegated_access/repositories/support-catalog.repository.ts:98` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.catalog → SupportCatalogService.forPerson → SupportCatalogService.build → SupportCatalogRepository.locations | `src/modules/delegated_access/repositories/support-catalog.repository.ts:130` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.catalog → SupportCatalogService.forPerson → SupportCatalogService.build → SupportCatalogRepository.doctors | `src/modules/delegated_access/repositories/support-catalog.repository.ts:65` |
| `practice.practitioner_location_assignments` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.catalog → SupportCatalogService.forPerson → SupportCatalogService.build → SupportCatalogRepository.locationAssignments | `src/modules/delegated_access/repositories/support-catalog.repository.ts:190` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.catalog → SupportCatalogService.forPerson → SupportCatalogService.build → SupportCatalogRepository.doctors | `src/modules/delegated_access/repositories/support-catalog.repository.ts:65` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.catalog → SupportCatalogService.forPerson → SupportCatalogService.build → SupportCatalogRepository.doctors | `src/modules/delegated_access/repositories/support-catalog.repository.ts:65` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.catalog → SupportCatalogService.forPerson → SupportCatalogService.build → SupportCatalogRepository.services | `src/modules/delegated_access/repositories/support-catalog.repository.ts:98` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `org` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportCatalogResponseDto>` · DTO `SupportCatalogResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | — | Organización del catálogo. | `src/modules/delegated_access/dto/support-catalog.dto.ts:64` |
| `doctors` | `array<CatalogDoctorDto>` | Sí | — | — | Doctores, cada uno con sus combinaciones espacio ↔ servicio. | `src/modules/delegated_access/dto/support-catalog.dto.ts:66` |
| `doctors[].practitionerRoleAssignmentId` | `string` | Sí | formato uuid | — | Asignación de rol del doctor (lo que se nombra en un permiso). | `src/modules/delegated_access/dto/support-catalog.dto.ts:23` |
| `doctors[].practitionerProfileId` | `string` | No | formato uuid | — | Perfil profesional del doctor (solo lo ve la administración). | `src/modules/delegated_access/dto/support-catalog.dto.ts:25` |
| `doctors[].displayName` | `string` | Sí | — | — | Nombre para mostrar. | `src/modules/delegated_access/dto/support-catalog.dto.ts:27` |
| `doctors[].practiceSiteId` | `string` | No | formato uuid | — | Sede de la asignación, si declara una. | `src/modules/delegated_access/dto/support-catalog.dto.ts:29` |
| `doctors[].placements` | `array<CatalogPlacementDto>` | Sí | — | — | Combinaciones espacio ↔ servicio en las que atiende, para no cruzarlas. | `src/modules/delegated_access/dto/support-catalog.dto.ts:32` |
| `doctors[].placements[].careSpaceId` | `string` | No | formato uuid | — | Espacio de atención. | `src/modules/delegated_access/dto/support-catalog.dto.ts:15` |
| `doctors[].placements[].healthcareServiceId` | `string` | No | formato uuid | — | Servicio que presta en ese espacio. | `src/modules/delegated_access/dto/support-catalog.dto.ts:17` |
| `services` | `array<CatalogServiceDto>` | Sí | — | — | Servicios. | `src/modules/delegated_access/dto/support-catalog.dto.ts:68` |
| `services[].id` | `string` | Sí | formato uuid | — | Servicio de la organización. | `src/modules/delegated_access/dto/support-catalog.dto.ts:38` |
| `services[].name` | `string` | Sí | — | — | Nombre del servicio. | `src/modules/delegated_access/dto/support-catalog.dto.ts:40` |
| `services[].practiceSiteId` | `string` | No | formato uuid | — | Sede donde se presta, si es de una. | `src/modules/delegated_access/dto/support-catalog.dto.ts:42` |
| `locations` | `array<CatalogLocationDto>` | Sí | — | — | Sedes y espacios. | `src/modules/delegated_access/dto/support-catalog.dto.ts:71` |
| `locations[].id` | `string` | Sí | formato uuid | — | Sede o espacio. | `src/modules/delegated_access/dto/support-catalog.dto.ts:48` |
| `locations[].kind` | `string` | Sí | valores: SITE, SPACE | — | Si es una sede o un espacio de atención. | `src/modules/delegated_access/dto/support-catalog.dto.ts:50` |
| `locations[].name` | `string` | Sí | — | — | Nombre. | `src/modules/delegated_access/dto/support-catalog.dto.ts:52` |
| `locations[].code` | `string` | Sí | — | — | Código. | `src/modules/delegated_access/dto/support-catalog.dto.ts:54` |
| `locations[].parentId` | `string` | No | formato uuid | — | Padre: la sede o el espacio que lo contiene. | `src/modules/delegated_access/dto/support-catalog.dto.ts:56` |
| `locations[].practiceSiteId` | `string` | Sí | formato uuid | — | Sede a la que pertenece. | `src/modules/delegated_access/dto/support-catalog.dto.ts:58` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No tiene relación vigente con esa organización |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportEngagementRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. GET /me/support-engagements

- **Origen:** CONTRATO
- **Nombre:** Mis vínculos de apoyo y mis solicitudes
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportEngagementRequestsController.mine` — `src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:68`

### Qué es y para qué sirve (negocio)

Mis vínculos de apoyo y mis solicitudes. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /me/support-engagements` la atiende `SupportEngagementRequestsController.mine` (src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:68). Exige sesión; el controlador no declara roles. Delega en `SupportEngagementsService.listMine`, `EngagementRequestsService.listMine`. Lee audit.audit_log, delegated_access.engagement_request_items, delegated_access.engagement_requests, delegated_access.organization_user_assignments, delegated_access.role_templates, delegated_access.support_grant_actions, delegated_access.support_scope_grants, directory.tenant_memberships y 8 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:68` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:68` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.mine → SupportEngagementsService.listMine → SupportEngagementsService.toViews → SupportActivityRepository.lastActivity | `src/modules/delegated_access/repositories/support-activity.repository.ts:342` |
| `delegated_access.engagement_request_items` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.mine → EngagementRequestsService.listMine → EngagementRequestsService.toViews → EngagementRequestsRepository.findItems | `src/modules/delegated_access/repositories/engagement-requests.repository.ts:84` |
| `delegated_access.engagement_requests` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.mine → EngagementRequestsService.listMine → EngagementRequestsRepository.findByRequester | `src/modules/delegated_access/repositories/engagement-requests.repository.ts:132` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.mine → SupportEngagementsService.listMine → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:113` |
| `delegated_access.role_templates` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.mine → SupportEngagementsService.listMine → SupportEngagementsService.toViews → RoleTemplatesRepository.findById | `src/modules/delegated_access/repositories/role-templates.repository.ts:35` |
| `delegated_access.support_grant_actions` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.mine → SupportEngagementsService.listMine → SupportEngagementsService.toViews → SupportEngagementsService.grantViews → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:165` |
| `delegated_access.support_scope_grants` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.mine → SupportEngagementsService.listMine → SupportEngagementsService.toViews → SupportEngagementsService.grantViews → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:161` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.mine → SupportEngagementsService.listMine → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:117` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.mine → SupportEngagementsService.listMine → SupportEngagementsService.toViews → SupportActivityRepository.tenantNames | `src/modules/delegated_access/repositories/support-activity.repository.ts:170` |
| `iam.users` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.mine → SupportEngagementsService.listMine → SupportEngagementsService.toViews → SupportActivityRepository.userNames | `src/modules/delegated_access/repositories/support-activity.repository.ts:111` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.mine → EngagementRequestsService.listMine → EngagementRequestsService.toViews → SupportActivityRepository.locationNames | `src/modules/delegated_access/repositories/support-activity.repository.ts:155` |
| `practice.healthcare_services` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.mine → EngagementRequestsService.listMine → EngagementRequestsService.toViews → SupportActivityRepository.serviceNames | `src/modules/delegated_access/repositories/support-activity.repository.ts:139` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.mine → EngagementRequestsService.listMine → EngagementRequestsService.toViews → SupportActivityRepository.locationNames | `src/modules/delegated_access/repositories/support-activity.repository.ts:155` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.mine → EngagementRequestsService.listMine → EngagementRequestsService.toViews → SupportActivityRepository.doctorNamesByRoleAssignment | `src/modules/delegated_access/repositories/support-activity.repository.ts:189` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.mine → EngagementRequestsService.listMine → EngagementRequestsService.toViews → SupportActivityRepository.doctorNamesByRoleAssignment | `src/modules/delegated_access/repositories/support-activity.repository.ts:189` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.mine → EngagementRequestsService.listMine → EngagementRequestsService.toViews → SupportActivityRepository.serviceNames | `src/modules/delegated_access/repositories/support-activity.repository.ts:139` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MySupportEngagementsResponseDto>` · DTO `MySupportEngagementsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SupportEngagementViewDto>` | Sí | — | — | Vínculos de apoyo de la persona, en todas sus organizaciones. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:270` |
| `items[].id` | `string` | Sí | formato uuid | — | Id del vínculo. | `src/modules/delegated_access/dto/support-grants.dto.ts:132` |
| `items[].tenantId` | `string` | Sí | formato uuid | — | Organización. | `src/modules/delegated_access/dto/support-grants.dto.ts:134` |
| `items[].userId` | `string` | Sí | formato uuid | — | Persona de apoyo. | `src/modules/delegated_access/dto/support-grants.dto.ts:136` |
| `items[].roleTemplateCode` | `string` | No | — | — | Plantilla de rol (código). | `src/modules/delegated_access/dto/support-grants.dto.ts:138` |
| `items[].personName` | `string` | No | — | — | Nombre de la persona de apoyo. | `src/modules/delegated_access/dto/support-grants.dto.ts:140` |
| `items[].organizationName` | `string` | No | — | — | Nombre de la organización. | `src/modules/delegated_access/dto/support-grants.dto.ts:142` |
| `items[].ownerKind` | `string` | No | — | — | Dueño del vínculo: `ORGANIZATION` o `PRIVATE_PRACTICE`. | `src/modules/delegated_access/dto/support-grants.dto.ts:144` |
| `items[].recertifyEveryMonths` | `number` | No | — | — | Cada cuántos meses se recertifica (6 o 12). | `src/modules/delegated_access/dto/support-grants.dto.ts:146` |
| `items[].status` | `string` | Sí | — | — | Estado del vínculo. | `src/modules/delegated_access/dto/support-grants.dto.ts:148` |
| `items[].origin` | `string` | No | — | — | Origen (REQUEST, INVITATION, QR). | `src/modules/delegated_access/dto/support-grants.dto.ts:150` |
| `items[].validFrom` | `string` | No | formato date-time | — | Inicio de vigencia. | `src/modules/delegated_access/dto/support-grants.dto.ts:152` |
| `items[].validTo` | `string` | No | formato date-time | — | Fin de vigencia. | `src/modules/delegated_access/dto/support-grants.dto.ts:154` |
| `items[].nextRecertificationAt` | `string` | No | formato date-time | — | Próxima recertificación. | `src/modules/delegated_access/dto/support-grants.dto.ts:157` |
| `items[].recertificationDue` | `boolean` | Sí | — | — | ¿Ya venció la fecha de recertificación y está esperando confirmación? | `src/modules/delegated_access/dto/support-grants.dto.ts:159` |
| `items[].endedReason` | `string` | No | — | — | Motivo del fin de vínculo. | `src/modules/delegated_access/dto/support-grants.dto.ts:161` |
| `items[].lastActivityAt` | `string` | No | formato date-time | — | Última actividad de la persona en la organización dentro de los últimos 90 días; ausente si no hubo. | `src/modules/delegated_access/dto/support-grants.dto.ts:167` |
| `items[].suspendedAt` | `string` | No | formato date-time | — | Fecha en que el vínculo se suspende (o debió suspenderse) por no recertificarse: la de recertificación más 15 días. Solo si está suspendido por eso. | `src/modules/delegated_access/dto/support-grants.dto.ts:174` |
| `items[].lastConfirmedAt` | `string` | No | formato date-time | — | Última vez que la ORGANIZACIÓN confirmó (recertificó) el vínculo, o su aprobación inicial: la recertificación vigente menos su período. | `src/modules/delegated_access/dto/support-grants.dto.ts:180` |
| `items[].lastConfirmedBy` | `string` | No | valores: PERSON, ORGANIZATION | — | Quién hizo esa confirmación: siempre `ORGANIZATION` (la persona solo declara). | `src/modules/delegated_access/dto/support-grants.dto.ts:183` |
| `items[].personConfirmedAt` | `string` | No | formato date-time | — | Última vez que la propia persona declaró «sigo trabajando aquí» (asiento `SUPPORT_ENGAGEMENT_CONFIRMED_BY_PERSON` más reciente). No renueva el período ni reactiva: es información para quien administra. | `src/modules/delegated_access/dto/support-grants.dto.ts:190` |
| `items[].grants` | `array<SupportGrantViewDto>` | Sí | — | — | Permisos del vínculo. | `src/modules/delegated_access/dto/support-grants.dto.ts:192` |
| `items[].grants[].id` | `string` | Sí | formato uuid | — | Id del permiso. | `src/modules/delegated_access/dto/support-grants.dto.ts:116` |
| `items[].grants[].actions` | `array<string>` | Sí | — | — | Acciones incluidas. | `src/modules/delegated_access/dto/support-grants.dto.ts:118` |
| `items[].grants[].expansionMode` | `string` | Sí | — | — | DYNAMIC o FIXED. | `src/modules/delegated_access/dto/support-grants.dto.ts:120` |
| `items[].grants[].status` | `string` | Sí | — | — | Estado (ACTIVE, REVOKED, EXPIRED...). | `src/modules/delegated_access/dto/support-grants.dto.ts:122` |
| `items[].grants[].validFrom` | `string` | No | formato date-time | — | Inicio de vigencia. | `src/modules/delegated_access/dto/support-grants.dto.ts:124` |
| `items[].grants[].validTo` | `string` | No | formato date-time | — | Fin de vigencia. | `src/modules/delegated_access/dto/support-grants.dto.ts:126` |
| `count` | `number` | Sí | — | — | Cantidad de vínculos. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:272` |
| `requests` | `array<EngagementRequestViewDto>` | Sí | — | — | Solicitudes de la persona, recientes primero. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:275` |
| `requests[].id` | `string` | Sí | formato uuid | — | Id de la solicitud. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:206` |
| `requests[].tenantId` | `string` | Sí | formato uuid | — | Organización. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:208` |
| `requests[].organizationName` | `string` | No | — | — | Nombre de la organización. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:210` |
| `requests[].requesterUserId` | `string` | Sí | formato uuid | — | Persona de apoyo. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:212` |
| `requests[].requesterName` | `string` | No | — | — | Nombre de la persona de apoyo. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:214` |
| `requests[].direction` | `string` | Sí | — | — | REQUEST o INVITATION. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:216` |
| `requests[].roleTemplateId` | `string` | Sí | formato uuid | — | Plantilla pedida (id). | `src/modules/delegated_access/dto/engagement-requests.dto.ts:218` |
| `requests[].roleTemplateCode` | `string` | No | — | — | Plantilla pedida (código: `SECRETARY`, `FRONT_DESK`…). | `src/modules/delegated_access/dto/engagement-requests.dto.ts:220` |
| `requests[].parentAssignmentId` | `string` | No | formato uuid | — | Vínculo ampliado, si es una ampliación. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:222` |
| `requests[].message` | `string` | No | — | — | Mensaje de la persona. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:224` |
| `requests[].status` | `string` | Sí | — | — | Estado: `PENDING`, `APPROVED`, `PARTIAL` (se aprobó parte y se rechazó parte), `REJECTED`, `EXPIRED` o `CANCELLED`. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:229` |
| `requests[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se creó. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:231` |
| `requests[].expiresAt` | `string` | Sí | formato date-time | — | Vencimiento (15 días). | `src/modules/delegated_access/dto/engagement-requests.dto.ts:233` |
| `requests[].decidedAt` | `string` | No | formato date-time | — | Fecha de la decisión. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:235` |
| `requests[].decisionReason` | `string` | No | — | — | Motivo general de la decisión. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:237` |
| `requests[].items` | `array<EngagementRequestItemViewDto>` | Sí | — | — | Ítems. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:240` |
| `requests[].items[].id` | `string` | Sí | formato uuid | — | Id del ítem. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:186` |
| `requests[].items[].practitionerName` | `string` | No | — | — | Nombre del doctor del ítem. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:188` |
| `requests[].items[].serviceName` | `string` | No | — | — | Nombre del servicio del ítem. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:190` |
| `requests[].items[].locationName` | `string` | No | — | — | Nombre de la ubicación (espacio o sede) del ítem. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:192` |
| `requests[].items[].proposedActions` | `array<string>` | Sí | — | — | Acciones propuestas. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:194` |
| `requests[].items[].decision` | `string` | Sí | — | — | Decisión (PENDING, APPROVED, ADJUSTED, REJECTED). | `src/modules/delegated_access/dto/engagement-requests.dto.ts:196` |
| `requests[].items[].decisionComment` | `string` | No | — | — | Motivo de la decisión. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:198` |
| `requests[].items[].resultingGrantId` | `string` | No | formato uuid | — | Permiso emitido. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:200` |

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

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportEngagementRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. POST /me/support-engagements/{id}/confirm

- **Origen:** CONTRATO
- **Nombre:** Confirmar mi propio vínculo de apoyo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportEngagementRequestsController.confirmMine` — `src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:85`

### Qué es y para qué sirve (negocio)

Confirmar mi propio vínculo de apoyo. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /me/support-engagements/{id}/confirm` la atiende `SupportEngagementRequestsController.confirmMine` (src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:85). Exige sesión; el controlador no declara roles. Delega en `SupportEngagementsService.confirmMine`. Lee audit.audit_log, delegated_access.organization_user_assignments, delegated_access.role_templates, delegated_access.support_grant_actions, delegated_access.support_scope_grants, directory.tenant_memberships, directory.tenants, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:85` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:85` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:85` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:85` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.confirmMine → SupportEngagementsService.confirmMine → SupportEngagementsService.toViews → SupportActivityRepository.lastActivity | `src/modules/delegated_access/repositories/support-activity.repository.ts:342` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.confirmMine → SupportEngagementsService.confirmMine → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:113` |
| `delegated_access.role_templates` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.confirmMine → SupportEngagementsService.confirmMine → SupportEngagementsService.toViews → RoleTemplatesRepository.findById | `src/modules/delegated_access/repositories/role-templates.repository.ts:35` |
| `delegated_access.support_grant_actions` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.confirmMine → SupportEngagementsService.confirmMine → SupportEngagementsService.toViews → SupportEngagementsService.grantViews → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:165` |
| `delegated_access.support_scope_grants` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.confirmMine → SupportEngagementsService.confirmMine → SupportEngagementsService.toViews → SupportEngagementsService.grantViews → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:161` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.confirmMine → SupportEngagementsService.confirmMine → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:117` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.confirmMine → SupportEngagementsService.confirmMine → SupportEngagementsService.toViews → SupportActivityRepository.tenantNames | `src/modules/delegated_access/repositories/support-activity.repository.ts:170` |
| `iam.users` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.confirmMine → SupportEngagementsService.confirmMine → SupportEngagementsService.toViews → SupportActivityRepository.userNames | `src/modules/delegated_access/repositories/support-activity.repository.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ConfirmedSupportEngagementViewDto>` · DTO `ConfirmedSupportEngagementViewDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `declaredAt` | `string` | Sí | formato date-time | — | Instante de la declaración «sigo trabajando aquí». El vínculo no cambió. | `src/modules/delegated_access/dto/support-grants.dto.ts:198` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Vínculo de apoyo no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo declara su vínculo quien lo tiene activo o suspendido por no recertificarse a tiempo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportEngagementRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. POST /me/support-patient-search

- **Origen:** CONTRATO
- **Nombre:** Buscar un paciente (búsqueda exacta, auditada)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSupportController.patientSearch` — `src/modules/delegated_access/controllers/practitioner-support.controller.ts:153`

### Qué es y para qué sirve (negocio)

Buscar un paciente (búsqueda exacta, auditada). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /me/support-patient-search` la atiende `PractitionerSupportController.patientSearch` (src/modules/delegated_access/controllers/practitioner-support.controller.ts:153). Exige sesión; el controlador no declara roles. Valida el cuerpo como `SupportPatientSearchDto` (7 campos, 0 obligatorios). Delega en `SupportPatientSearchService.search`. Crea filas en audit.audit_log. Lee audit.audit_log, authz.patient_legal_representations, common.contact_points, common.identifiers, iam.sessions, iam.users, profiles.patient_profiles, profiles.persons y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:153` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:153` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.patientSearch → SupportPatientSearchService.search → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:205` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PractitionerSupportController.patientSearch → SupportPatientSearchService.search → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:160` |
| `authz.patient_legal_representations` | LEE | LEE | POR_SQL | PractitionerSupportController.patientSearch → SupportPatientSearchService.search → SupportPatientsRepository.findRepresentatives | `src/modules/delegated_access/repositories/support-patients.repository.ts:364` |
| `common.contact_points` | LEE | LEE | POR_SQL | PractitionerSupportController.patientSearch → SupportPatientSearchService.search → SupportPatientsRepository.findExact | `src/modules/delegated_access/repositories/support-patients.repository.ts:192` |
| `common.identifiers` | LEE | LEE | POR_SQL | PractitionerSupportController.patientSearch → SupportPatientSearchService.search → SupportPatientsRepository.findExact | `src/modules/delegated_access/repositories/support-patients.repository.ts:192` |
| `iam.sessions` | LEE | LEE | POR_SQL | PractitionerSupportController.patientSearch → SupportPatientSearchService.search → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:254` |
| `iam.users` | LEE | LEE | POR_SQL | PractitionerSupportController.patientSearch → SupportPatientSearchService.search → SupportPatientsRepository.findRepresentatives | `src/modules/delegated_access/repositories/support-patients.repository.ts:364` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | PractitionerSupportController.patientSearch → SupportPatientSearchService.search → SupportPatientsRepository.findExact | `src/modules/delegated_access/repositories/support-patients.repository.ts:192` |
| `profiles.persons` | LEE | LEE | POR_SQL | PractitionerSupportController.patientSearch → SupportPatientSearchService.search → SupportPatientsRepository.findExact | `src/modules/delegated_access/repositories/support-patients.repository.ts:192` |
| `profiles.related_persons` | LEE | LEE | POR_SQL | PractitionerSupportController.patientSearch → SupportPatientSearchService.search → SupportPatientsRepository.findRepresentatives | `src/modules/delegated_access/repositories/support-patients.repository.ts:347` |

### Cuerpo — DTO `SupportPatientSearchDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@ValidateIf( (dto: SupportPatientSearchDto) => dto.org === undefined \|\| dto.tenantId !== undefined, )` `@IsUUID()` | Organización. Alternativa: `org`. | `src/modules/delegated_access/dto/support-patients.dto.ts:34` |
| `org` | `string` | No | formato uuid | `@ValidateIf( (dto: SupportPatientSearchDto) => dto.tenantId === undefined \|\| dto.org !== undefined, )` `@IsUUID()` | Alias de `tenantId`. | `src/modules/delegated_access/dto/support-patients.dto.ts:43` |
| `nationalId` | `string` | No | longitud máxima 40 | `@IsOptional()` `@IsString()` `@MaxLength(40)` | — | `src/modules/delegated_access/dto/support-patients.dto.ts:50` |
| `document` | `string` | No | longitud máxima 40 | `@IsOptional()` `@IsString()` `@MaxLength(40)` | Alias de `nationalId`. | `src/modules/delegated_access/dto/support-patients.dto.ts:57` |
| `phone` | `string` | No | longitud máxima 25 | `@IsOptional()` `@IsString()` `@MaxLength(25)` | — | `src/modules/delegated_access/dto/support-patients.dto.ts:64` |
| `fullName` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/delegated_access/dto/support-patients.dto.ts:71` |
| `birthDate` | `string` | No | longitud máxima 10; patrón runtime /^\d{4}-\d{2}-\d{2}$/ | `@IsOptional()` `@IsString()` `@MaxLength(10)` `@Matches(/^\d{4}-\d{2}-\d{2}$/)` | — | `src/modules/delegated_access/dto/support-patients.dto.ts:79` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "org": "00000000-0000-4000-8000-000000000001",
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "document": "valor-ejemplo",
  "phone": "+59170000000",
  "fullName": "Nombre de ejemplo",
  "birthDate": "1984-05-17"
}
```

</details>

### Respuesta — `Promise<SupportPatientSearchResponseDto>` · DTO `SupportPatientSearchResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SupportPatientMatchDto>` | Sí | — | — | Coincidencias exactas (a lo sumo cinco). | `src/modules/delegated_access/dto/support-patients.dto.ts:121` |
| `items[].patientProfileId` | `string` | Sí | formato uuid | — | Perfil del paciente (nombre del contrato compartido). | `src/modules/delegated_access/dto/support-patients.dto.ts:99` |
| `items[].profileId` | `string` | Sí | formato uuid | — | Perfil del paciente (nombre que usa el front). | `src/modules/delegated_access/dto/support-patients.dto.ts:101` |
| `items[].displayName` | `string` | Sí | — | — | Nombre para mostrar. | `src/modules/delegated_access/dto/support-patients.dto.ts:103` |
| `items[].documentMasked` | `string` | No | — | — | Documento con lo central tapado: `***556`. | `src/modules/delegated_access/dto/support-patients.dto.ts:105` |
| `items[].phoneMasked` | `string` | No | — | — | Teléfono con lo central tapado: `7******7`. Ausente si no tiene. | `src/modules/delegated_access/dto/support-patients.dto.ts:107` |
| `items[].ageYears` | `number` | No | — | — | Edad cumplida; ausente si el paciente no tiene fecha de nacimiento. | `src/modules/delegated_access/dto/support-patients.dto.ts:109` |
| `items[].isMinor` | `boolean` | Sí | — | — | Menor de 18 años. | `src/modules/delegated_access/dto/support-patients.dto.ts:111` |
| `items[].representatives` | `array<SupportPatientRepresentativeDto>` | No | — | — | Solo en menores: quiénes pueden actuar por él. Vacío = sin representante. | `src/modules/delegated_access/dto/support-patients.dto.ts:114` |
| `items[].representatives[].id` | `string` | No | formato uuid | — | Id de la fila de la que sale. | `src/modules/delegated_access/dto/support-patients.dto.ts:85` |
| `items[].representatives[].name` | `string` | No | — | — | Nombre. | `src/modules/delegated_access/dto/support-patients.dto.ts:87` |
| `items[].representatives[].relationship` | `string` | No | — | — | «Madre», «Padre», «Tutor legal», «Abuela»… | `src/modules/delegated_access/dto/support-patients.dto.ts:89` |
| `count` | `number` | Sí | — | — | Cantidad. | `src/modules/delegated_access/dto/support-patients.dto.ts:123` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {EXACT_SEARCH_HELP} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: MULTI sin respuesta completa; DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PractitionerSupportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. POST /me/support-patients

- **Origen:** CONTRATO
- **Nombre:** Registrar un paciente nuevo (con aviso de posibles duplicados)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportPatientsController.register` — `src/modules/delegated_access/controllers/support-patients.controller.ts:41`

### Qué es y para qué sirve (negocio)

Registrar un paciente nuevo (con aviso de posibles duplicados). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /me/support-patients` la atiende `SupportPatientsController.register` (src/modules/delegated_access/controllers/support-patients.controller.ts:41). Exige sesión; el controlador no declara roles. Valida el cuerpo como `RegisterSupportPatientDto` (16 campos, 4 obligatorios). Delega en `SupportPatientRegistrationService.register`. Crea filas en audit.audit_log, messaging.domain_events, messaging.outbox_messages. Lee audit.audit_log, authz.patient_legal_representations, common.contact_points, common.identifiers, delegated_access.organization_user_assignments, directory.tenant_memberships, iam.sessions, iam.users y 5 más. Publica profiles.patient_portal_invitation.requested.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/support-patients.controller.ts:41` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/support-patients.controller.ts:41` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | SupportPatientsController.register → SupportPatientRegistrationService.register → SupportPatientRegistrationService.registerInTransaction → SupportPatientRegistrationService.seal → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:205` |
| `audit.audit_log` | LEE | LEE | DIRECTA | SupportPatientsController.register → SupportPatientRegistrationService.register → SupportPatientRegistrationService.registerInTransaction → SupportPatientRegistrationService.seal → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:160` |
| `authz.patient_legal_representations` | LEE | LEE | POR_SQL | SupportPatientsController.register → SupportPatientRegistrationService.register → SupportPatientRegistrationService.registerInTransaction → SupportPatientsRepository.findDuplicateCandidates | `src/modules/delegated_access/repositories/support-patients.repository.ts:256` |
| `common.contact_points` | LEE | LEE | POR_SQL | SupportPatientsController.register → SupportPatientRegistrationService.register → SupportPatientRegistrationService.registerInTransaction → SupportPatientsRepository.findDuplicateCandidates | `src/modules/delegated_access/repositories/support-patients.repository.ts:255` |
| `common.identifiers` | LEE | LEE | POR_SQL | SupportPatientsController.register → SupportPatientRegistrationService.register → SupportPatientRegistrationService.registerInTransaction → SupportPatientsRepository.findDuplicateCandidates | `src/modules/delegated_access/repositories/support-patients.repository.ts:256` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | SupportPatientsController.register → SupportPatientRegistrationService.register → SupportPatientRegistrationService.registerInTransaction → SupportPatientsRepository.findDuplicateCandidates | `src/modules/delegated_access/repositories/support-patients.repository.ts:256` |
| `directory.tenant_memberships` | LEE | LEE | POR_SQL | SupportPatientsController.register → SupportPatientRegistrationService.register → SupportPatientRegistrationService.registerInTransaction → SupportPatientsRepository.findDuplicateCandidates | `src/modules/delegated_access/repositories/support-patients.repository.ts:256` |
| `iam.sessions` | LEE | LEE | POR_SQL | SupportPatientsController.register → SupportPatientRegistrationService.register → SupportPatientRegistrationService.registerInTransaction → SupportPatientRegistrationService.seal → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:254` |
| `iam.users` | LEE | LEE | POR_SQL | SupportPatientsController.register → SupportPatientRegistrationService.register → SupportPatientRegistrationService.registerInTransaction → SupportPatientRegistrationService.duplicatesOutcome → SupportPatientsRepository.findRepresentatives | `src/modules/delegated_access/repositories/support-patients.repository.ts:364` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | SupportPatientsController.register → SupportPatientRegistrationService.register → SupportPatientRegistrationService.registerInTransaction → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | SupportPatientsController.register → SupportPatientRegistrationService.register → SupportPatientRegistrationService.registerInTransaction → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | SupportPatientsController.register → SupportPatientRegistrationService.register → SupportPatientRegistrationService.registerInTransaction → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | SupportPatientsController.register → SupportPatientRegistrationService.register → SupportPatientRegistrationService.registerInTransaction → SupportPatientsRepository.findDuplicateCandidates | `src/modules/delegated_access/repositories/support-patients.repository.ts:256` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportPatientsController.register → SupportPatientRegistrationService.register → SupportPatientRegistrationService.registerInTransaction → SupportPatientsRepository.findDuplicateCandidates | `src/modules/delegated_access/repositories/support-patients.repository.ts:256` |
| `profiles.related_persons` | LEE | LEE | POR_SQL | SupportPatientsController.register → SupportPatientRegistrationService.register → SupportPatientRegistrationService.registerInTransaction → SupportPatientRegistrationService.duplicatesOutcome → SupportPatientsRepository.findRepresentatives | `src/modules/delegated_access/repositories/support-patients.repository.ts:347` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | SupportPatientsController.register → SupportPatientRegistrationService.register → SupportPatientRegistrationService.registerInTransaction → SupportPatientsRepository.findDuplicateCandidates | `src/modules/delegated_access/repositories/support-patients.repository.ts:256` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `profiles.patient_portal_invitation.requested` | `src/modules/delegated_access/services/support-patient-registration.service.ts:431` |

### Cuerpo — DTO `RegisterSupportPatientDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@ValidateIf( (dto: RegisterSupportPatientDto) => dto.org === undefined \|\| dto.tenantId !== undefined, )` `@IsUUID()` | Organización. Alternativa: `org`. | `src/modules/delegated_access/dto/support-patients.dto.ts:175` |
| `org` | `string` | No | formato uuid | `@ValidateIf( (dto: RegisterSupportPatientDto) => dto.tenantId === undefined \|\| dto.org !== undefined, )` `@IsUUID()` | Alias de `tenantId`. | `src/modules/delegated_access/dto/support-patients.dto.ts:184` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/delegated_access/dto/support-patients.dto.ts:191` |
| `lastName` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/delegated_access/dto/support-patients.dto.ts:198` |
| `motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/delegated_access/dto/support-patients.dto.ts:205` |
| `document` | `string` | No | longitud mínima 5; longitud máxima 40 | `@ValidateIf( (dto: RegisterSupportPatientDto) => dto.nationalId === undefined \|\| dto.document !== undefined, )` `@IsString()` `@MinLength(5)` `@MaxLength(40)` | — | `src/modules/delegated_access/dto/support-patients.dto.ts:220` |
| `nationalId` | `string` | No | longitud mínima 5; longitud máxima 40 | `@ValidateIf( (dto: RegisterSupportPatientDto) => dto.document === undefined \|\| dto.nationalId !== undefined, )` `@IsString()` `@MinLength(5)` `@MaxLength(40)` | Alias de `document`. | `src/modules/delegated_access/dto/support-patients.dto.ts:231` |
| `birthDate` | `string` | Sí | longitud máxima 10; patrón runtime /^\d{4}-\d{2}-\d{2}$/ | `@IsString()` `@MaxLength(10)` `@Matches(/^\d{4}-\d{2}-\d{2}$/)` | — | `src/modules/delegated_access/dto/support-patients.dto.ts:238` |
| `phone` | `string` | Sí | longitud máxima 25; patrón runtime /^\+?[\d\s()-]{7,25}$/ | `@IsString()` `@Matches(/^\+?[\d\s()-]{7,25}$/)` | — | `src/modules/delegated_access/dto/support-patients.dto.ts:244` |
| `guardian` | `SupportPatientGuardianDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => SupportPatientGuardianDto)` | — | `src/modules/delegated_access/dto/support-patients.dto.ts:251` |
| `guardian.name` | `string` | No | longitud mínima 2; longitud máxima 200 | `@IsString()` `@MinLength(2)` `@MaxLength(200)` | — | `src/modules/delegated_access/dto/support-patients.dto.ts:133` |
| `guardian.document` | `string` | No | longitud mínima 5; longitud máxima 40 | `@IsString()` `@MinLength(5)` `@MaxLength(40)` | — | `src/modules/delegated_access/dto/support-patients.dto.ts:143` |
| `guardian.phone` | `string` | No | longitud máxima 25; patrón runtime /^\+?[\d\s()-]{7,25}$/ | `@IsString()` `@Matches(/^\+?[\d\s()-]{7,25}$/)` | — | `src/modules/delegated_access/dto/support-patients.dto.ts:149` |
| `guardian.relationship` | `string` | No | longitud mínima 2; longitud máxima 60 | `@IsString()` `@MinLength(2)` `@MaxLength(60)` | — | `src/modules/delegated_access/dto/support-patients.dto.ts:156` |
| `inviteToPortal` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/delegated_access/dto/support-patients.dto.ts:257` |
| `acknowledgeDuplicates` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/delegated_access/dto/support-patients.dto.ts:263` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "name": "Nombre de ejemplo",
  "lastName": "Nombre de ejemplo",
  "birthDate": "1984-05-17",
  "phone": "+59170000000"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "org": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "lastName": "Nombre de ejemplo",
  "motherLastName": "Nombre de ejemplo",
  "document": "valor-ejemplo",
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "birthDate": "1984-05-17",
  "phone": "+59170000000",
  "guardian": {
    "name": "Nombre de ejemplo",
    "document": "valor-ejemplo",
    "phone": "+59170000000",
    "relationship": "valor-ejemplo"
  },
  "inviteToPortal": true,
  "acknowledgeDuplicates": true
}
```

</details>

### Respuesta — `Promise<SupportPatientRegistrationResponseDto>` · DTO `SupportPatientRegistrationResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `outcome` | `string` | Sí | valores: CREATED, POSSIBLE_DUPLICATES | — | `CREATED` (201) o `POSSIBLE_DUPLICATES` (200, no se creó nada). | `src/modules/delegated_access/dto/support-patients.dto.ts:314` |
| `patient` | `SupportPatientMatchDto` | No | — | — | El paciente creado (solo `CREATED`). | `src/modules/delegated_access/dto/support-patients.dto.ts:317` |
| `patient.patientProfileId` | `string` | No | formato uuid | — | Perfil del paciente (nombre del contrato compartido). | `src/modules/delegated_access/dto/support-patients.dto.ts:99` |
| `patient.profileId` | `string` | No | formato uuid | — | Perfil del paciente (nombre que usa el front). | `src/modules/delegated_access/dto/support-patients.dto.ts:101` |
| `patient.displayName` | `string` | No | — | — | Nombre para mostrar. | `src/modules/delegated_access/dto/support-patients.dto.ts:103` |
| `patient.documentMasked` | `string` | No | — | — | Documento con lo central tapado: `***556`. | `src/modules/delegated_access/dto/support-patients.dto.ts:105` |
| `patient.phoneMasked` | `string` | No | — | — | Teléfono con lo central tapado: `7******7`. Ausente si no tiene. | `src/modules/delegated_access/dto/support-patients.dto.ts:107` |
| `patient.ageYears` | `number` | No | — | — | Edad cumplida; ausente si el paciente no tiene fecha de nacimiento. | `src/modules/delegated_access/dto/support-patients.dto.ts:109` |
| `patient.isMinor` | `boolean` | No | — | — | Menor de 18 años. | `src/modules/delegated_access/dto/support-patients.dto.ts:111` |
| `patient.representatives` | `array<SupportPatientRepresentativeDto>` | No | — | — | Solo en menores: quiénes pueden actuar por él. Vacío = sin representante. | `src/modules/delegated_access/dto/support-patients.dto.ts:114` |
| `patient.representatives[].id` | `string` | No | formato uuid | — | Id de la fila de la que sale. | `src/modules/delegated_access/dto/support-patients.dto.ts:85` |
| `patient.representatives[].name` | `string` | No | — | — | Nombre. | `src/modules/delegated_access/dto/support-patients.dto.ts:87` |
| `patient.representatives[].relationship` | `string` | No | — | — | «Madre», «Padre», «Tutor legal», «Abuela»… | `src/modules/delegated_access/dto/support-patients.dto.ts:89` |
| `invitationSent` | `boolean` | No | — | — | ¿Quedó pedida la invitación al portal? (solo `CREATED`). | `src/modules/delegated_access/dto/support-patients.dto.ts:319` |
| `identityVerified` | `object` | No | — | — | El paciente creado nace con la identidad SIN verificar: lo escribió el mostrador y nadie comprobó el documento (solo `CREATED`). Siempre `false`. | `src/modules/delegated_access/dto/support-patients.dto.ts:324` |
| `guardian` | `SupportPatientGuardianResultDto` | No | — | — | Representante de un menor (solo `CREATED` con menor). El mostrador nunca crea una representación legal: queda como persona relacionada, pendiente de verificación. La respuesta es la misma exista o no una cuenta con el documento del representante (no revela si la hay). | `src/modules/delegated_access/dto/support-patients.dto.ts:332` |
| `guardian.recorded` | `object` | No | — | — | El representante quedó anotado como persona relacionada. | `src/modules/delegated_access/dto/support-patients.dto.ts:300` |
| `guardian.status` | `string` | No | valores: PENDING_VERIFICATION | — | `PENDING_VERIFICATION`: no es representante legal. La representación legal la crea un SECURITY_ADMIN con `documentRef` o la acepta el propio representante desde su cuenta. | `src/modules/delegated_access/dto/support-patients.dto.ts:307` |
| `duplicates` | `array<SupportPatientDuplicateDto>` | No | — | — | Los parecidos (solo `POSSIBLE_DUPLICATES`). | `src/modules/delegated_access/dto/support-patients.dto.ts:335` |
| `duplicates[].profileId` | `string` | No | formato uuid | — | Perfil (nombre del front). Solo si el paciente es de la organización. | `src/modules/delegated_access/dto/support-patients.dto.ts:275` |
| `duplicates[].patientProfileId` | `string` | No | formato uuid | — | Perfil (nombre del contrato compartido). Solo si es de la organización. | `src/modules/delegated_access/dto/support-patients.dto.ts:277` |
| `duplicates[].displayName` | `string` | No | — | — | Nombre; de otra organización, un rótulo genérico. | `src/modules/delegated_access/dto/support-patients.dto.ts:279` |
| `duplicates[].documentMasked` | `string` | No | — | — | Documento tapado. | `src/modules/delegated_access/dto/support-patients.dto.ts:281` |
| `duplicates[].phoneMasked` | `string` | No | — | — | Teléfono tapado. Solo si el paciente es de la organización. | `src/modules/delegated_access/dto/support-patients.dto.ts:283` |
| `duplicates[].ageYears` | `number` | No | — | — | Edad; de otra organización, la que sale de lo que quien registra escribió. | `src/modules/delegated_access/dto/support-patients.dto.ts:285` |
| `duplicates[].isMinor` | `boolean` | No | — | — | Menor de 18 años. | `src/modules/delegated_access/dto/support-patients.dto.ts:287` |
| `duplicates[].representatives` | `array<SupportPatientRepresentativeDto>` | No | — | — | Representantes (solo si es menor y de la organización). | `src/modules/delegated_access/dto/support-patients.dto.ts:290` |
| `duplicates[].representatives[].id` | `string` | No | formato uuid | — | Id de la fila de la que sale. | `src/modules/delegated_access/dto/support-patients.dto.ts:85` |
| `duplicates[].representatives[].name` | `string` | No | — | — | Nombre. | `src/modules/delegated_access/dto/support-patients.dto.ts:87` |
| `duplicates[].representatives[].relationship` | `string` | No | — | — | «Madre», «Padre», «Tutor legal», «Abuela»… | `src/modules/delegated_access/dto/support-patients.dto.ts:89` |
| `duplicates[].linkedToOrganization` | `boolean` | No | — | — | ¿Es paciente de la organización que registra? | `src/modules/delegated_access/dto/support-patients.dto.ts:292` |
| `duplicates[].matchedBy` | `array<string>` | No | — | — | Con qué coincide: `DOCUMENT`, `NAME_AND_BIRTH_DATE`, `PHONE_AND_SURNAME`. | `src/modules/delegated_access/dto/support-patients.dto.ts:294` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un menor de edad se registra con su representante legal o un familiar autorizado: indique su nombre, documento, teléfono y parentesco. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: MULTI sin respuesta completa; DomainException: {HttpStatus.BAD_REQUEST}; DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. POST /org/{tenantMembershipId}/user-assignments

- **Origen:** CONTRATO
- **Nombre:** Asignar usuario de organización con alcance y vigencia
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrgUserAssignmentsController.create` — `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:39`

### Qué es y para qué sirve (negocio)

Asignar usuario de organización con alcance y vigencia. Caso de uso UC-29-01: Asignar usuario de organización (scoped, vigente). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:227`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /org/{tenantMembershipId}/user-assignments` la atiende `OrgUserAssignmentsController.create` (src/modules/delegated_access/controllers/org-user-assignments.controller.ts:39). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateOrgUserAssignmentDto` (11 campos, 0 obligatorios). Delega en `OrgUserAssignmentsService.createAssignment`. Crea filas en delegated_access.organization_user_assignments. Lee delegated_access.organization_user_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:39` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantMembershipId | `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:39` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | ESCRIBE | CREA | DIRECTA | OrgUserAssignmentsController.create → OrgUserAssignmentsService.createAssignment → OrganizationUserAssignmentsRepository.create | `src/modules/delegated_access/repositories/organization-user-assignments.repository.ts:114` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | OrgUserAssignmentsController.create → OrgUserAssignmentsService.createAssignment → OrganizationUserAssignmentsRepository.findActiveOverlap | `src/modules/delegated_access/repositories/organization-user-assignments.repository.ts:95` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantMembershipId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateOrgUserAssignmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `role` | `string` | No | valores: STAFF, SECRETARY, ASSISTANT, NURSE, BILLING | `@IsOptional()` `@IsIn(ROLES)` | Rol de la asignación | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:15` |
| `accessScope` | `string` | No | valores: TENANT, PRACTICE, SITE, UNIT | `@IsOptional()` `@IsIn(SCOPES)` | Alcance de acceso | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:23` |
| `practiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nodo de scope: práctica | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:34` |
| `practiceSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nodo de scope: sede de práctica | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:45` |
| `clinicalUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nodo de scope: unidad clínica | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:56` |
| `careSpaceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nodo de scope: care space | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:67` |
| `diagnosticUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nodo de scope: unidad de diagnóstico | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:78` |
| `pharmacyId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nodo de scope: farmacia | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:89` |
| `supervisorUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Supervisor responsable | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:100` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de vigencia (ISO) | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:111` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fin de vigencia (ISO) | `src/modules/delegated_access/dto/create-org-user-assignment.dto.ts:122` |

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
| 409 | `CONFLICT` | ConflictException: Ya existe una asignación activa con ese rol y alcance |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/delegated_access/controllers/org-user-assignments.controller.spec.ts:28` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-01`

---

## 22. GET /org/access-lookup

- **Origen:** CONTRATO
- **Nombre:** Quién tiene acceso a un doctor, servicio o ubicación
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportEngagementsController.lookup` — `src/modules/delegated_access/controllers/support-engagements.controller.ts:178`

### Qué es y para qué sirve (negocio)

Quién tiene acceso a un doctor, servicio o ubicación. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /org/access-lookup` la atiende `SupportEngagementsController.lookup` (src/modules/delegated_access/controllers/support-engagements.controller.ts:178). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `EffectiveSupportAccessService.lookup`, `DelegationScopeService.resolveTenant`. Lee delegated_access.effective_support_access, practice.care_spaces, practice.practice_sites, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/support-engagements.controller.ts:178` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.effective_support_access` | LEE | LEE | DIRECTA | SupportEngagementsController.lookup → EffectiveSupportAccessService.lookup → EffectiveSupportAccessRepository.find | `src/modules/delegated_access/repositories/effective-support-access.repository.ts:82` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SupportEngagementsController.lookup → EffectiveSupportAccessService.lookup → EffectiveSupportAccessService.locationSpaces → SupportAccessRepository.findCareSpaceIdsWithin | `src/modules/delegated_access/repositories/support-access.repository.ts:413` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SupportEngagementsController.lookup → EffectiveSupportAccessService.lookup → EffectiveSupportAccessService.locationSpaces → SupportAccessRepository.tenantsOfSites | `src/modules/delegated_access/repositories/support-access.repository.ts:335` |
| `practice.practices` | LEE | LEE | DIRECTA | SupportEngagementsController.lookup → EffectiveSupportAccessService.lookup → EffectiveSupportAccessService.locationSpaces → SupportAccessRepository.tenantsOfSites | `src/modules/delegated_access/repositories/support-access.repository.ts:338` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `doctor` | query | No | `string` | — |
| `service` | query | No | `string` | — |
| `location` | query | No | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AccessLookupResponseDto>` · DTO `AccessLookupResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<AccessLookupEntryDto>` | Sí | — | — | Personas con acceso. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:187` |
| `items[].userId` | `string` | Sí | formato uuid | — | Persona de apoyo. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:174` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid | — | Doctor sobre el que tiene acceso; ausente = cualquier profesional. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:177` |
| `items[].actions` | `array<string>` | Sí | — | — | Acciones que tiene. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:179` |
| `items[].grantIds` | `array<string>` | Sí | — | — | Permisos que lo originan. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:181` |
| `count` | `number` | Sí | — | — | Cantidad. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:189` |

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

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportEngagementsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. GET /org/affiliation-invitations

- **Origen:** CONTRATO
- **Nombre:** Listar las invitaciones de afiliación
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AffiliationInvitationsController.list` — `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:76`

### Qué es y para qué sirve (negocio)

Listar las invitaciones de afiliación. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /org/affiliation-invitations` la atiende `AffiliationInvitationsController.list` (src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:76). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AffiliationInvitationsService.list`. Lee delegated_access.role_templates, directory.affiliation_invitations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:76` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.role_templates` | LEE | LEE | DIRECTA | AffiliationInvitationsController.list → AffiliationInvitationsService.list → RoleTemplatesRepository.findById | `src/modules/delegated_access/repositories/role-templates.repository.ts:35` |
| `directory.affiliation_invitations` | LEE | LEE | DIRECTA | AffiliationInvitationsController.list → AffiliationInvitationsService.list → AffiliationInvitationsRepository.listByTenant | `src/modules/delegated_access/repositories/affiliation-invitations.repository.ts:77` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListAffiliationInvitationsResponseDto>` · DTO `ListAffiliationInvitationsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<AffiliationInvitationViewDto>` | Sí | — | — | Invitaciones de la organización. | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:133` |
| `items[].id` | `string` | Sí | formato uuid | — | Id de la invitación. | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:109` |
| `items[].kind` | `object` | Sí | — | — | A quién invita. | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:111` |
| `items[].targetPersonId` | `string` | No | formato uuid | — | Persona específica a la que va dirigida, si la hay. | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:113` |
| `items[].roleTemplateCode` | `string` | No | — | — | Plantilla de rol, para personal de apoyo. | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:115` |
| `items[].maxUses` | `number` | Sí | — | — | Usos máximos. | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:117` |
| `items[].usesCount` | `number` | Sí | — | — | Veces que se canjeó. | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:119` |
| `items[].expiresAt` | `string` | Sí | formato date-time | — | Vencimiento. | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:121` |
| `items[].status` | `string` | Sí | valores: ACTIVE, EXHAUSTED, EXPIRED, REVOKED | — | Estado efectivo: activa, agotada, vencida o revocada. | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:124` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se creó. | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:126` |

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

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:AffiliationInvitationsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. POST /org/affiliation-invitations

- **Origen:** CONTRATO
- **Nombre:** Crear un código o QR de afiliación
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AffiliationInvitationsController.create` — `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:42`

### Qué es y para qué sirve (negocio)

Crear un código o QR de afiliación. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /org/affiliation-invitations` la atiende `AffiliationInvitationsController.create` (src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:42). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateAffiliationInvitationDto` (5 campos, 1 obligatorio). Delega en `AffiliationInvitationsService.create`. Crea filas en directory.affiliation_invitations. Lee delegated_access.role_templates, practice.practice_sites, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:42` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.role_templates` | LEE | LEE | DIRECTA | AffiliationInvitationsController.create → AffiliationInvitationsService.create → RoleTemplatesRepository.findEffectiveByCode | `src/modules/delegated_access/repositories/role-templates.repository.ts:55` |
| `directory.affiliation_invitations` | ESCRIBE | CREA | DIRECTA | AffiliationInvitationsController.create → AffiliationInvitationsService.create → AffiliationInvitationsRepository.create | `src/modules/delegated_access/repositories/affiliation-invitations.repository.ts:115` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | AffiliationInvitationsController.create → AffiliationInvitationsService.create → PractitionerAffiliationRepository.findTarget | `src/modules/delegated_access/repositories/practitioner-affiliation.repository.ts:51` |
| `practice.practices` | LEE | LEE | DIRECTA | AffiliationInvitationsController.create → AffiliationInvitationsService.create → PractitionerAffiliationRepository.findTarget | `src/modules/delegated_access/repositories/practitioner-affiliation.repository.ts:43` |

### Cuerpo — DTO `CreateAffiliationInvitationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `kind` | `string` | Sí | valores: PRACTITIONER, SUPPORT_STAFF | `@IsIn(KINDS)` | — | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:22` |
| `targetPersonId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:32` |
| `maxUses` | `number` | No | mínimo 1; máximo 500 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(500)` | — | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:40` |
| `expiresInDays` | `number` | No | mínimo 1; máximo 90 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(90)` | — | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:48` |
| `roleTemplateCode` | `string` | No | valores: SECRETARY, MEDICAL_ASSISTANT, NURSING, FRONT_DESK, BILLING_CASHIER, CALL_CENTER, ORG_MANAGEMENT | `@IsOptional()` `@IsIn(SUPPORT_TEMPLATE_CODES)` | — | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:54` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "kind": "PRACTITIONER"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "kind": "PRACTITIONER",
  "targetPersonId": "00000000-0000-4000-8000-000000000001",
  "maxUses": 1,
  "expiresInDays": 1,
  "roleTemplateCode": "SECRETARY"
}
```

</details>

### Respuesta — `Promise<AffiliationInvitationCreatedDto>` · DTO `AffiliationInvitationCreatedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id de la invitación. | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:60` |
| `code` | `string` | Sí | — | — | Código para el QR o para escribir; no se vuelve a mostrar. | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:62` |
| `expiresAt` | `string` | Sí | formato date-time | — | Vencimiento. | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:64` |
| `maxUses` | `number` | Sí | — | — | Usos máximos. | `src/modules/delegated_access/dto/affiliation-invitations.dto.ts:66` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla de rol no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La organización necesita una práctica activa para recibir solicitudes de médicos |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:AffiliationInvitationsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. POST /org/affiliation-invitations/{id}/revoke

- **Origen:** CONTRATO
- **Nombre:** Revocar un código o QR de afiliación
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AffiliationInvitationsController.revoke` — `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:59`

### Qué es y para qué sirve (negocio)

Revocar un código o QR de afiliación. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /org/affiliation-invitations/{id}/revoke` la atiende `AffiliationInvitationsController.revoke` (src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:59). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AffiliationInvitationsService.revoke`. Actualiza directory.affiliation_invitations. Lee directory.affiliation_invitations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:59` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/affiliation-invitations.controller.ts:59` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.affiliation_invitations` | ESCRIBE | ACTUALIZA | DIRECTA | AffiliationInvitationsController.revoke → AffiliationInvitationsService.revoke | `src/modules/delegated_access/services/affiliation-invitations.service.ts:579` |
| `directory.affiliation_invitations` | LEE | LEE | DIRECTA | AffiliationInvitationsController.revoke → AffiliationInvitationsService.revoke → AffiliationInvitationsRepository.findById | `src/modules/delegated_access/repositories/affiliation-invitations.repository.ts:63` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<OperationResultDto>` · DTO `OperationResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | Indica éxito | `src/modules/delegated_access/dto/responses.dto.ts:110` |
| `status` | `string` | No | — | — | Nuevo estado del recurso (concept id) | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Invitación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:AffiliationInvitationsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. GET /org/role-templates

- **Origen:** CONTRATO
- **Nombre:** Plantillas de rol de apoyo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportEngagementsController.listTemplates` — `src/modules/delegated_access/controllers/support-engagements.controller.ts:200`

### Qué es y para qué sirve (negocio)

Plantillas de rol de apoyo. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /org/role-templates` la atiende `SupportEngagementsController.listTemplates` (src/modules/delegated_access/controllers/support-engagements.controller.ts:200). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `RoleTemplatesService.list`. Lee delegated_access.role_templates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/support-engagements.controller.ts:200` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.role_templates` | LEE | LEE | DIRECTA | SupportEngagementsController.listTemplates → RoleTemplatesService.list → RoleTemplatesRepository.findVisible | `src/modules/delegated_access/repositories/role-templates.repository.ts:76` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListRoleTemplatesResponseDto>` · DTO `ListRoleTemplatesResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<RoleTemplateViewDto>` | Sí | — | — | Plantillas. | `src/modules/delegated_access/dto/role-templates.dto.ts:78` |
| `items[].id` | `string` | Sí | formato uuid | — | Id de la plantilla. | `src/modules/delegated_access/dto/role-templates.dto.ts:62` |
| `items[].code` | `string` | Sí | — | — | Código. | `src/modules/delegated_access/dto/role-templates.dto.ts:64` |
| `items[].name` | `string` | Sí | — | — | Nombre. | `src/modules/delegated_access/dto/role-templates.dto.ts:66` |
| `items[].defaultActions` | `array<string>` | Sí | — | — | Acciones por defecto. | `src/modules/delegated_access/dto/role-templates.dto.ts:68` |
| `items[].platform` | `boolean` | Sí | — | — | ¿Es de plataforma (no editable por la organización)? | `src/modules/delegated_access/dto/role-templates.dto.ts:70` |
| `items[].versionNumber` | `number` | Sí | — | — | Versión. | `src/modules/delegated_access/dto/role-templates.dto.ts:72` |
| `count` | `number` | Sí | — | — | Cantidad. | `src/modules/delegated_access/dto/role-templates.dto.ts:80` |

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

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportEngagementsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 27. POST /org/role-templates

- **Origen:** CONTRATO
- **Nombre:** Crear una plantilla de rol propia
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportEngagementsController.createTemplate` — `src/modules/delegated_access/controllers/support-engagements.controller.ts:208`

### Qué es y para qué sirve (negocio)

Crear una plantilla de rol propia. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /org/role-templates` la atiende `SupportEngagementsController.createTemplate` (src/modules/delegated_access/controllers/support-engagements.controller.ts:208). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateRoleTemplateDto` (3 campos, 3 obligatorios). Delega en `RoleTemplatesService.create`. Crea filas en delegated_access.role_templates. Lee delegated_access.role_templates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/support-engagements.controller.ts:208` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.role_templates` | ESCRIBE | CREA | DIRECTA | SupportEngagementsController.createTemplate → RoleTemplatesService.create → RoleTemplatesRepository.create | `src/modules/delegated_access/repositories/role-templates.repository.ts:92` |
| `delegated_access.role_templates` | LEE | LEE | DIRECTA | SupportEngagementsController.createTemplate → RoleTemplatesService.create → RoleTemplatesRepository.findEffectiveByCode | `src/modules/delegated_access/repositories/role-templates.repository.ts:55` |

### Cuerpo — DTO `CreateRoleTemplateDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 60; patrón runtime /^[A-Z][A-Z0-9_]{1,59}$/ | `@IsString()` `@Matches(/^[A-Z][A-Z0-9_]{1,59}$/)` | — | `src/modules/delegated_access/dto/role-templates.dto.ts:21` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 120 | `@IsString()` `@MinLength(1)` `@MaxLength(120)` | — | `src/modules/delegated_access/dto/role-templates.dto.ts:28` |
| `defaultActions` | `array<string>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayUnique()` `@IsIn(SUPPORT_ACTIONS, { each: true })` | — | `src/modules/delegated_access/dto/role-templates.dto.ts:36` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "defaultActions": [
    "schedule.view"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "defaultActions": [
    "schedule.view"
  ]
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
| 409 | `CONFLICT` | ConflictException: Ya existe una plantilla con ese código |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportEngagementsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 28. PATCH /org/role-templates/{id}

- **Origen:** CONTRATO
- **Nombre:** Versionar una plantilla de rol propia
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportEngagementsController.updateTemplate` — `src/modules/delegated_access/controllers/support-engagements.controller.ts:225`

### Qué es y para qué sirve (negocio)

Versionar una plantilla de rol propia. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`PATCH /org/role-templates/{id}` la atiende `SupportEngagementsController.updateTemplate` (src/modules/delegated_access/controllers/support-engagements.controller.ts:225). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `UpdateRoleTemplateDto` (2 campos, 0 obligatorios). Delega en `RoleTemplatesService.update`. Crea filas en delegated_access.role_templates. Actualiza delegated_access.role_templates. Lee delegated_access.role_templates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/support-engagements.controller.ts:225` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/support-engagements.controller.ts:225` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.role_templates` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportEngagementsController.updateTemplate → RoleTemplatesService.update | `src/modules/delegated_access/services/role-templates.service.ts:158` |
| `delegated_access.role_templates` | ESCRIBE | CREA | DIRECTA | SupportEngagementsController.updateTemplate → RoleTemplatesService.update → RoleTemplatesRepository.create | `src/modules/delegated_access/repositories/role-templates.repository.ts:92` |
| `delegated_access.role_templates` | LEE | LEE | DIRECTA | SupportEngagementsController.updateTemplate → RoleTemplatesService.update → RoleTemplatesRepository.findById | `src/modules/delegated_access/repositories/role-templates.repository.ts:35` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateRoleTemplateDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | No | longitud mínima 1; longitud máxima 120 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(120)` | — | `src/modules/delegated_access/dto/role-templates.dto.ts:47` |
| `defaultActions` | `array<string>` | No | mínimo 1 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMinSize(1)` `@ArrayUnique()` `@IsIn(SUPPORT_ACTIONS, { each: true })` | — | `src/modules/delegated_access/dto/role-templates.dto.ts:56` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "name": "Nombre de ejemplo",
  "defaultActions": [
    "schedule.view"
  ]
}
```

</details>

### Respuesta — `Promise<OperationResultDto>` · DTO `OperationResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | Indica éxito | `src/modules/delegated_access/dto/responses.dto.ts:110` |
| `status` | `string` | No | — | — | Nuevo estado del recurso (concept id) | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No hay cambios que aplicar; PreconditionFailedException: La plantilla de plataforma no se edita; PreconditionFailedException: Esa versión de la plantilla ya fue reemplazada: edite la vigente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportEngagementsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. GET /org/support-activity

- **Origen:** CONTRATO
- **Nombre:** Actividad del personal de apoyo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportEngagementsController.activityOfTenant` — `src/modules/delegated_access/controllers/support-engagements.controller.ts:190`

### Qué es y para qué sirve (negocio)

Actividad del personal de apoyo. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /org/support-activity` la atiende `SupportEngagementsController.activityOfTenant` (src/modules/delegated_access/controllers/support-engagements.controller.ts:190). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `SupportActivityService.forTenant`. Lee audit.audit_log, delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments, delegated_access.support_scope_grants, directory.tenant_memberships, iam.users, practice.practitioner_role_assignments, profiles.persons y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/support-engagements.controller.ts:190` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | LEE | LEE | DIRECTA | SupportEngagementsController.activityOfTenant → SupportActivityService.forTenant → SupportActivityService.page → SupportActivityRepository.scan | `src/modules/delegated_access/repositories/support-activity.repository.ts:95` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportEngagementsController.activityOfTenant → SupportActivityService.forTenant → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:113` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | POR_SQL | SupportEngagementsController.activityOfTenant → SupportActivityService.forTenant → SupportActivityService.page → SupportActivityRepository.attributions | `src/modules/delegated_access/repositories/support-activity.repository.ts:276` |
| `delegated_access.support_scope_grants` | LEE | LEE | POR_SQL | SupportEngagementsController.activityOfTenant → SupportActivityService.forTenant → SupportActivityService.page → SupportActivityRepository.attributions | `src/modules/delegated_access/repositories/support-activity.repository.ts:302` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportEngagementsController.activityOfTenant → SupportActivityService.forTenant → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:117` |
| `iam.users` | LEE | LEE | POR_SQL | SupportEngagementsController.activityOfTenant → SupportActivityService.forTenant → SupportActivityService.page → SupportActivityRepository.userNames | `src/modules/delegated_access/repositories/support-activity.repository.ts:111` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportEngagementsController.activityOfTenant → SupportActivityService.forTenant → SupportActivityService.page → SupportActivityRepository.attributions | `src/modules/delegated_access/repositories/support-activity.repository.ts:276` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportEngagementsController.activityOfTenant → SupportActivityService.forTenant → SupportActivityService.page → SupportActivityRepository.attributions | `src/modules/delegated_access/repositories/support-activity.repository.ts:244` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | SupportEngagementsController.activityOfTenant → SupportActivityService.forTenant → SupportActivityService.page → SupportActivityRepository.attributions | `src/modules/delegated_access/repositories/support-activity.repository.ts:244` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | SupportEngagementsController.activityOfTenant → SupportActivityService.forTenant → SupportActivityService.page → SupportActivityRepository.attributions | `src/modules/delegated_access/repositories/support-activity.repository.ts:244` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `userId` | query | No | `string` | — |
| `tenantId` | query | No | `string` | — |
| `person` | query | No | `string` | — |
| `doctor` | query | No | `string` | — |
| `action` | query | No | `string` | — |
| `from` | query | No | `string` | — |
| `to` | query | No | `string` | — |
| `limit` | query | No | `number` | — |
| `cursor` | query | No | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportActivityResponseDto>` · DTO `SupportActivityResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SupportActivityEntryDto>` | Sí | — | — | Asientos. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:320` |
| `items[].id` | `string` | Sí | formato uuid | — | Id del asiento. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:268` |
| `items[].tenantId` | `string` | No | formato uuid | — | Organización a la que pertenece el asiento. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:270` |
| `items[].userId` | `string` | Sí | formato uuid | — | Persona que actuó. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:272` |
| `items[].personName` | `string` | Sí | — | — | Nombre de la persona que actuó. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:274` |
| `items[].actorName` | `string` | Sí | — | — | Igual que `personName`. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:276` |
| `items[].action` | `string` | Sí | — | — | Código de la entrada: el permiso con el que se actuó (`schedule.check_in`) o el evento (`engagement.ended`); un asiento que no se reconoce conserva el suyo (`auditAction`). | `src/modules/delegated_access/dto/practitioner-support.dto.ts:282` |
| `items[].auditAction` | `string` | Sí | — | — | Asiento de la cadena de auditoría tal como se selló (`BOOKING_CHECKED_IN`). | `src/modules/delegated_access/dto/practitioner-support.dto.ts:284` |
| `items[].permission` | `string` | No | — | — | Permiso de apoyo con el que se hizo, si es una acción de agenda. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:286` |
| `items[].entity` | `string` | Sí | — | — | Recurso afectado. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:288` |
| `items[].entityId` | `string` | No | formato uuid | — | Id del recurso. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:290` |
| `items[].bookingId` | `string` | No | formato uuid | — | Reserva a la que se refiere el asiento. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:292` |
| `items[].appointmentId` | `string` | No | formato uuid | — | Cita a la que se refiere el asiento. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:294` |
| `items[].practitionerProfileId` | `string` | No | formato uuid | — | Doctor sobre cuya agenda o equipo se actuó (perfil profesional). | `src/modules/delegated_access/dto/practitioner-support.dto.ts:296` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid | — | Asignación de rol del doctor, si el asiento la nombra. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:299` |
| `items[].practitionerName` | `string` | No | — | — | Nombre del doctor; solo si quien consulta puede verlo. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:301` |
| `items[].summary` | `string` | Sí | — | — | La acción en una frase. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:303` |
| `items[].success` | `boolean` | Sí | — | — | ¿Se hizo? | `src/modules/delegated_access/dto/practitioner-support.dto.ts:305` |
| `items[].result` | `string` | Sí | valores: SUCCESS, FAILURE | — | Resultado: `SUCCESS` o `FAILURE`. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:307` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:309` |
| `items[].occurredAt` | `string` | Sí | formato date-time | — | Igual que `createdAt`. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:311` |
| `items[].recordedAt` | `string` | Sí | formato date-time | — | Igual que `createdAt` (nombre de la primera versión). | `src/modules/delegated_access/dto/practitioner-support.dto.ts:313` |
| `count` | `number` | Sí | — | — | Cantidad. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:322` |
| `nextCursor` | `string` | Sí | admite null | — | Cursor de continuación. | `src/modules/delegated_access/dto/practitioner-support.dto.ts:324` |

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

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportEngagementsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 30. GET /org/support-catalog

- **Origen:** CONTRATO
- **Nombre:** Catálogo de doctores, servicios y ubicaciones para los permisos
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportEngagementsController.catalog` — `src/modules/delegated_access/controllers/support-engagements.controller.ts:168`

### Qué es y para qué sirve (negocio)

Catálogo de doctores, servicios y ubicaciones para los permisos. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /org/support-catalog` la atiende `SupportEngagementsController.catalog` (src/modules/delegated_access/controllers/support-engagements.controller.ts:168). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `SupportCatalogService.forActiveTenant`. Lee practice.care_spaces, practice.healthcare_services, practice.practice_sites, practice.practices, practice.practitioner_location_assignments, practice.practitioner_role_assignments, profiles.persons, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/support-engagements.controller.ts:168` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportEngagementsController.catalog → SupportCatalogService.forActiveTenant → SupportCatalogService.build → SupportCatalogRepository.locations | `src/modules/delegated_access/repositories/support-catalog.repository.ts:147` |
| `practice.healthcare_services` | LEE | LEE | POR_SQL | SupportEngagementsController.catalog → SupportCatalogService.forActiveTenant → SupportCatalogService.build → SupportCatalogRepository.services | `src/modules/delegated_access/repositories/support-catalog.repository.ts:98` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportEngagementsController.catalog → SupportCatalogService.forActiveTenant → SupportCatalogService.build → SupportCatalogRepository.locations | `src/modules/delegated_access/repositories/support-catalog.repository.ts:130` |
| `practice.practices` | LEE | LEE | POR_SQL | SupportEngagementsController.catalog → SupportCatalogService.forActiveTenant → SupportCatalogService.build → SupportCatalogRepository.doctors | `src/modules/delegated_access/repositories/support-catalog.repository.ts:65` |
| `practice.practitioner_location_assignments` | LEE | LEE | POR_SQL | SupportEngagementsController.catalog → SupportCatalogService.forActiveTenant → SupportCatalogService.build → SupportCatalogRepository.locationAssignments | `src/modules/delegated_access/repositories/support-catalog.repository.ts:190` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportEngagementsController.catalog → SupportCatalogService.forActiveTenant → SupportCatalogService.build → SupportCatalogRepository.doctors | `src/modules/delegated_access/repositories/support-catalog.repository.ts:65` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportEngagementsController.catalog → SupportCatalogService.forActiveTenant → SupportCatalogService.build → SupportCatalogRepository.doctors | `src/modules/delegated_access/repositories/support-catalog.repository.ts:65` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | SupportEngagementsController.catalog → SupportCatalogService.forActiveTenant → SupportCatalogService.build → SupportCatalogRepository.services | `src/modules/delegated_access/repositories/support-catalog.repository.ts:98` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportCatalogResponseDto>` · DTO `SupportCatalogResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | — | Organización del catálogo. | `src/modules/delegated_access/dto/support-catalog.dto.ts:64` |
| `doctors` | `array<CatalogDoctorDto>` | Sí | — | — | Doctores, cada uno con sus combinaciones espacio ↔ servicio. | `src/modules/delegated_access/dto/support-catalog.dto.ts:66` |
| `doctors[].practitionerRoleAssignmentId` | `string` | Sí | formato uuid | — | Asignación de rol del doctor (lo que se nombra en un permiso). | `src/modules/delegated_access/dto/support-catalog.dto.ts:23` |
| `doctors[].practitionerProfileId` | `string` | No | formato uuid | — | Perfil profesional del doctor (solo lo ve la administración). | `src/modules/delegated_access/dto/support-catalog.dto.ts:25` |
| `doctors[].displayName` | `string` | Sí | — | — | Nombre para mostrar. | `src/modules/delegated_access/dto/support-catalog.dto.ts:27` |
| `doctors[].practiceSiteId` | `string` | No | formato uuid | — | Sede de la asignación, si declara una. | `src/modules/delegated_access/dto/support-catalog.dto.ts:29` |
| `doctors[].placements` | `array<CatalogPlacementDto>` | Sí | — | — | Combinaciones espacio ↔ servicio en las que atiende, para no cruzarlas. | `src/modules/delegated_access/dto/support-catalog.dto.ts:32` |
| `doctors[].placements[].careSpaceId` | `string` | No | formato uuid | — | Espacio de atención. | `src/modules/delegated_access/dto/support-catalog.dto.ts:15` |
| `doctors[].placements[].healthcareServiceId` | `string` | No | formato uuid | — | Servicio que presta en ese espacio. | `src/modules/delegated_access/dto/support-catalog.dto.ts:17` |
| `services` | `array<CatalogServiceDto>` | Sí | — | — | Servicios. | `src/modules/delegated_access/dto/support-catalog.dto.ts:68` |
| `services[].id` | `string` | Sí | formato uuid | — | Servicio de la organización. | `src/modules/delegated_access/dto/support-catalog.dto.ts:38` |
| `services[].name` | `string` | Sí | — | — | Nombre del servicio. | `src/modules/delegated_access/dto/support-catalog.dto.ts:40` |
| `services[].practiceSiteId` | `string` | No | formato uuid | — | Sede donde se presta, si es de una. | `src/modules/delegated_access/dto/support-catalog.dto.ts:42` |
| `locations` | `array<CatalogLocationDto>` | Sí | — | — | Sedes y espacios. | `src/modules/delegated_access/dto/support-catalog.dto.ts:71` |
| `locations[].id` | `string` | Sí | formato uuid | — | Sede o espacio. | `src/modules/delegated_access/dto/support-catalog.dto.ts:48` |
| `locations[].kind` | `string` | Sí | valores: SITE, SPACE | — | Si es una sede o un espacio de atención. | `src/modules/delegated_access/dto/support-catalog.dto.ts:50` |
| `locations[].name` | `string` | Sí | — | — | Nombre. | `src/modules/delegated_access/dto/support-catalog.dto.ts:52` |
| `locations[].code` | `string` | Sí | — | — | Código. | `src/modules/delegated_access/dto/support-catalog.dto.ts:54` |
| `locations[].parentId` | `string` | No | formato uuid | — | Padre: la sede o el espacio que lo contiene. | `src/modules/delegated_access/dto/support-catalog.dto.ts:56` |
| `locations[].practiceSiteId` | `string` | Sí | formato uuid | — | Sede a la que pertenece. | `src/modules/delegated_access/dto/support-catalog.dto.ts:58` |

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

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportEngagementsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 31. GET /org/support-engagement-requests

- **Origen:** CONTRATO
- **Nombre:** Solicitudes de vínculo de apoyo de la organización
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportEngagementRequestsController.list` — `src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:164`

### Qué es y para qué sirve (negocio)

Solicitudes de vínculo de apoyo de la organización. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /org/support-engagement-requests` la atiende `SupportEngagementRequestsController.list` (src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:164). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `EngagementRequestsService.listForTenant`. Lee delegated_access.engagement_request_items, delegated_access.engagement_requests, delegated_access.role_templates, directory.tenants, iam.users, practice.care_spaces, practice.healthcare_services, practice.practice_sites y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:164` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.engagement_request_items` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.list → EngagementRequestsService.listForTenant → EngagementRequestsService.toViews → EngagementRequestsRepository.findItems | `src/modules/delegated_access/repositories/engagement-requests.repository.ts:84` |
| `delegated_access.engagement_requests` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.list → EngagementRequestsService.listForTenant → EngagementRequestsRepository.findByTenant | `src/modules/delegated_access/repositories/engagement-requests.repository.ts:108` |
| `delegated_access.role_templates` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.list → EngagementRequestsService.listForTenant → EngagementRequestsService.toViews → RoleTemplatesRepository.findById | `src/modules/delegated_access/repositories/role-templates.repository.ts:35` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.list → EngagementRequestsService.listForTenant → EngagementRequestsService.toViews → SupportActivityRepository.tenantNames | `src/modules/delegated_access/repositories/support-activity.repository.ts:170` |
| `iam.users` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.list → EngagementRequestsService.listForTenant → EngagementRequestsService.toViews → SupportActivityRepository.userNames | `src/modules/delegated_access/repositories/support-activity.repository.ts:111` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.list → EngagementRequestsService.listForTenant → EngagementRequestsService.toViews → SupportActivityRepository.locationNames | `src/modules/delegated_access/repositories/support-activity.repository.ts:155` |
| `practice.healthcare_services` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.list → EngagementRequestsService.listForTenant → EngagementRequestsService.toViews → SupportActivityRepository.serviceNames | `src/modules/delegated_access/repositories/support-activity.repository.ts:139` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.list → EngagementRequestsService.listForTenant → EngagementRequestsService.toViews → SupportActivityRepository.locationNames | `src/modules/delegated_access/repositories/support-activity.repository.ts:155` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.list → EngagementRequestsService.listForTenant → EngagementRequestsService.toViews → SupportActivityRepository.doctorNamesByRoleAssignment | `src/modules/delegated_access/repositories/support-activity.repository.ts:189` |
| `profiles.persons` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.list → EngagementRequestsService.listForTenant → EngagementRequestsService.toViews → SupportActivityRepository.doctorNamesByRoleAssignment | `src/modules/delegated_access/repositories/support-activity.repository.ts:189` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | SupportEngagementRequestsController.list → EngagementRequestsService.listForTenant → EngagementRequestsService.toViews → SupportActivityRepository.serviceNames | `src/modules/delegated_access/repositories/support-activity.repository.ts:139` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `status` | query | No | `string` | — |
| `limit` | query | No | `number` | — |
| `cursor` | query | No | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListEngagementRequestsResponseDto>` · DTO `ListEngagementRequestsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<EngagementRequestViewDto>` | Sí | — | — | Solicitudes de la página. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:247` |
| `items[].id` | `string` | Sí | formato uuid | — | Id de la solicitud. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:206` |
| `items[].tenantId` | `string` | Sí | formato uuid | — | Organización. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:208` |
| `items[].organizationName` | `string` | No | — | — | Nombre de la organización. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:210` |
| `items[].requesterUserId` | `string` | Sí | formato uuid | — | Persona de apoyo. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:212` |
| `items[].requesterName` | `string` | No | — | — | Nombre de la persona de apoyo. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:214` |
| `items[].direction` | `string` | Sí | — | — | REQUEST o INVITATION. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:216` |
| `items[].roleTemplateId` | `string` | Sí | formato uuid | — | Plantilla pedida (id). | `src/modules/delegated_access/dto/engagement-requests.dto.ts:218` |
| `items[].roleTemplateCode` | `string` | No | — | — | Plantilla pedida (código: `SECRETARY`, `FRONT_DESK`…). | `src/modules/delegated_access/dto/engagement-requests.dto.ts:220` |
| `items[].parentAssignmentId` | `string` | No | formato uuid | — | Vínculo ampliado, si es una ampliación. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:222` |
| `items[].message` | `string` | No | — | — | Mensaje de la persona. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:224` |
| `items[].status` | `string` | Sí | — | — | Estado: `PENDING`, `APPROVED`, `PARTIAL` (se aprobó parte y se rechazó parte), `REJECTED`, `EXPIRED` o `CANCELLED`. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:229` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se creó. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:231` |
| `items[].expiresAt` | `string` | Sí | formato date-time | — | Vencimiento (15 días). | `src/modules/delegated_access/dto/engagement-requests.dto.ts:233` |
| `items[].decidedAt` | `string` | No | formato date-time | — | Fecha de la decisión. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:235` |
| `items[].decisionReason` | `string` | No | — | — | Motivo general de la decisión. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:237` |
| `items[].items` | `array<EngagementRequestItemViewDto>` | Sí | — | — | Ítems. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:240` |
| `items[].items[].id` | `string` | Sí | formato uuid | — | Id del ítem. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:186` |
| `items[].items[].practitionerName` | `string` | No | — | — | Nombre del doctor del ítem. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:188` |
| `items[].items[].serviceName` | `string` | No | — | — | Nombre del servicio del ítem. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:190` |
| `items[].items[].locationName` | `string` | No | — | — | Nombre de la ubicación (espacio o sede) del ítem. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:192` |
| `items[].items[].proposedActions` | `array<string>` | Sí | — | — | Acciones propuestas. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:194` |
| `items[].items[].decision` | `string` | Sí | — | — | Decisión (PENDING, APPROVED, ADJUSTED, REJECTED). | `src/modules/delegated_access/dto/engagement-requests.dto.ts:196` |
| `items[].items[].decisionComment` | `string` | No | — | — | Motivo de la decisión. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:198` |
| `items[].items[].resultingGrantId` | `string` | No | formato uuid | — | Permiso emitido. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:200` |
| `count` | `number` | Sí | — | — | Cantidad devuelta. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:249` |
| `nextCursor` | `string` | Sí | admite null | — | Cursor de continuación, o `null` en la última página. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:251` |

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

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportEngagementRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 32. POST /org/support-engagement-requests/{id}/decision

- **Origen:** CONTRATO
- **Nombre:** Decidir una solicitud de apoyo ítem por ítem
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportEngagementRequestsController.decide` — `src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:176`

### Qué es y para qué sirve (negocio)

Decidir una solicitud de apoyo ítem por ítem. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /org/support-engagement-requests/{id}/decision` la atiende `SupportEngagementRequestsController.decide` (src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:176). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `DecideEngagementRequestDto` (16 campos, 3 obligatorios). Delega en `EngagementRequestsService.decide`. Crea filas en delegated_access.effective_support_access, delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments, delegated_access.support_grant_actions, delegated_access.support_scope_grants, directory.tenant_memberships. Actualiza delegated_access.engagement_requests, directory.tenant_memberships. Borra de delegated_access.effective_support_access. Lee delegated_access.engagement_request_items, delegated_access.engagement_requests, delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments, delegated_access.role_templates, delegated_access.support_grant_actions, delegated_access.support_scope_grants, directory.tenant_memberships y 7 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:176` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:176` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.effective_support_access` | BORRA | BORRA | DIRECTA | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EffectiveSupportAccessService.refreshTenant → EffectiveSupportAccessRepository.replace | `src/modules/delegated_access/repositories/effective-support-access.repository.ts:56` |
| `delegated_access.effective_support_access` | ESCRIBE | CREA | DIRECTA | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EffectiveSupportAccessService.refreshTenant → EffectiveSupportAccessRepository.replace | `src/modules/delegated_access/repositories/effective-support-access.repository.ts:61` |
| `delegated_access.engagement_request_items` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EngagementRequestsRepository.findItems | `src/modules/delegated_access/repositories/engagement-requests.repository.ts:84` |
| `delegated_access.engagement_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportEngagementRequestsController.decide → EngagementRequestsService.decide | `src/modules/delegated_access/services/engagement-requests.service.ts:398` |
| `delegated_access.engagement_requests` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EngagementRequestsRepository.findById | `src/modules/delegated_access/repositories/engagement-requests.repository.ts:70` |
| `delegated_access.organization_user_assignments` | ESCRIBE | CREA | DIRECTA | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EngagementRequestsService.openOrLoadEngagement → SupportEngagementsRepository.create | `src/modules/delegated_access/repositories/support-engagements.repository.ts:61` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EngagementRequestsService.openOrLoadEngagement → SupportEngagementsRepository.findActiveByMembershipTemplate | `src/modules/delegated_access/repositories/support-engagements.repository.ts:270` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | CREA | DIRECTA | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EffectiveSupportAccessService.refreshTenant → PractitionerDelegateAssignmentsRepository.create | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:92` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findDelegationsOfEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:199` |
| `delegated_access.role_templates` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EngagementRequestsService.openOrLoadEngagement → RoleTemplatesRepository.findById | `src/modules/delegated_access/repositories/role-templates.repository.ts:35` |
| `delegated_access.support_grant_actions` | ESCRIBE | CREA | DIRECTA | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EngagementRequestsService.emitGrant → SupportGrantsRepository.addActions | `src/modules/delegated_access/repositories/support-grants.repository.ts:148` |
| `delegated_access.support_grant_actions` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:165` |
| `delegated_access.support_scope_grants` | ESCRIBE | CREA | DIRECTA | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EngagementRequestsService.emitGrant → SupportGrantsRepository.create | `src/modules/delegated_access/repositories/support-grants.repository.ts:98` |
| `delegated_access.support_scope_grants` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:161` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EngagementRequestsService.openOrLoadEngagement → SupportDirectoryRepository.ensureActiveStaffMembership | `src/modules/delegated_access/repositories/support-directory.repository.ts:158` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EngagementRequestsService.openOrLoadEngagement → SupportDirectoryRepository.ensureActiveStaffMembership → SupportDirectoryRepository.createStaffMembership | `src/modules/delegated_access/repositories/support-directory.repository.ts:85` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:117` |
| `directory.tenants` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EngagementRequestsService.openOrLoadEngagement → SupportDirectoryRepository.findTenant | `src/modules/delegated_access/repositories/support-directory.repository.ts:38` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EngagementRequestsService.emitGrant → SupportTargetsService.assertTarget → SupportAccessRepository.findCareSpaces | `src/modules/delegated_access/repositories/support-access.repository.ts:302` |
| `practice.healthcare_services` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EngagementRequestsService.emitGrant → SupportTargetsService.assertTarget → SupportAccessRepository.findServices | `src/modules/delegated_access/repositories/support-access.repository.ts:362` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EngagementRequestsService.emitGrant → SupportTargetsService.assertTarget → SupportAccessRepository.tenantsOfSites | `src/modules/delegated_access/repositories/support-access.repository.ts:335` |
| `practice.practices` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findRoleAssignmentsOfTenant | `src/modules/delegated_access/repositories/support-access.repository.ts:260` |
| `practice.practitioner_location_assignments` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findLocationPairs | `src/modules/delegated_access/repositories/support-access.repository.ts:467` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.decide → EngagementRequestsService.decide → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findRoleAssignmentsOfTenant | `src/modules/delegated_access/repositories/support-access.repository.ts:266` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DecideEngagementRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ItemDecisionDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ItemDecisionDto)` | — | `src/modules/delegated_access/dto/engagement-requests.dto.ts:140` |
| `items[].itemId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/delegated_access/dto/engagement-requests.dto.ts:85` |
| `items[].decision` | `string` | Sí | valores: APPROVED, ADJUSTED, REJECTED | `@IsIn(ITEM_DECISIONS)` | — | `src/modules/delegated_access/dto/engagement-requests.dto.ts:90` |
| `items[].comment` | `string` | No | longitud mínima 1; longitud máxima 500 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(500)` | — | `src/modules/delegated_access/dto/engagement-requests.dto.ts:98` |
| `items[].actions` | `array<string>` | No | mínimo 1 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMinSize(1)` `@ArrayUnique()` `@IsIn(SUPPORT_ACTIONS, { each: true })` | — | `src/modules/delegated_access/dto/engagement-requests.dto.ts:110` |
| `items[].adjustment` | `ItemAdjustmentDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => ItemAdjustmentDto)` | — | `src/modules/delegated_access/dto/engagement-requests.dto.ts:117` |
| `items[].adjustment.targetKind` | `string` | No | valores: PRACTITIONER, SERVICE, LOCATION, PRACTITIONER_SERVICE, PRACTITIONER_LOCATION, SERVICE_LOCATION, ALL_PRACTITIONERS, ALL_SERVICES, ALL_LOCATIONS, ALL | `@IsIn(SUPPORT_TARGET_KINDS)` | — | `src/modules/delegated_access/dto/support-target.dto.ts:26` |
| `items[].adjustment.practitionerRoleAssignmentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/support-target.dto.ts:32` |
| `items[].adjustment.healthcareServiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/support-target.dto.ts:38` |
| `items[].adjustment.careSpaceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/support-target.dto.ts:44` |
| `items[].adjustment.practiceSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/support-target.dto.ts:50` |
| `items[].adjustment.actions` | `array<string>` | No | mínimo 1 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMinSize(1)` `@ArrayUnique()` `@IsIn(SUPPORT_ACTIONS, { each: true })` | — | `src/modules/delegated_access/dto/support-target.dto.ts:62` |
| `items[].expansionMode` | `string` | No | valores: DYNAMIC, FIXED | `@IsOptional()` `@IsIn(EXPANSION_MODES)` | — | `src/modules/delegated_access/dto/engagement-requests.dto.ts:123` |
| `items[].validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | — | `src/modules/delegated_access/dto/engagement-requests.dto.ts:129` |
| `recertifyEveryMonths` | `number` | No | valores: 6, 12; mínimo 6; máximo 12 | `@IsOptional()` `@IsInt()` `@Min(6)` `@Max(12)` `@IsIn([6, 12])` | — | `src/modules/delegated_access/dto/engagement-requests.dto.ts:149` |
| `reasonText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/delegated_access/dto/engagement-requests.dto.ts:156` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "items": [
    {
      "itemId": "00000000-0000-4000-8000-000000000001",
      "decision": "APPROVED"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "items": [
    {
      "itemId": "00000000-0000-4000-8000-000000000001",
      "decision": "APPROVED",
      "comment": "valor-ejemplo",
      "actions": [
        "schedule.view"
      ],
      "adjustment": {
        "targetKind": "PRACTITIONER",
        "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
        "healthcareServiceId": "00000000-0000-4000-8000-000000000001",
        "careSpaceId": "00000000-0000-4000-8000-000000000001",
        "practiceSiteId": "00000000-0000-4000-8000-000000000001",
        "actions": [
          "schedule.view"
        ]
      },
      "expansionMode": "DYNAMIC",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ],
  "recertifyEveryMonths": 6,
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<EngagementDecisionResultDto>` · DTO `EngagementDecisionResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `requestId` | `string` | Sí | formato uuid | — | Solicitud decidida. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:257` |
| `status` | `string` | Sí | — | — | Estado final de la solicitud. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:259` |
| `engagementId` | `string` | No | formato uuid | — | Vínculo abierto o ampliado, si algo se aprobó. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:261` |
| `grantIds` | `array<string>` | Sí | — | — | Permisos emitidos. | `src/modules/delegated_access/dto/engagement-requests.dto.ts:263` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Ítem de solicitud no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La solicitud ya no está pendiente; PreconditionFailedException: La solicitud venció; PreconditionFailedException: La decisión debe cubrir todos los ítems pendientes; PreconditionFailedException: El vínculo que se amplía ya no está activo; PreconditionFailedException: {error.message} / Foto demasiado grande |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN}; DomainException: {HttpStatus.BAD_REQUEST}; Error: No hay doctores, servicios ni espacios que congelar: use un permiso dinámico |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportEngagementRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 33. GET /org/support-engagements

- **Origen:** CONTRATO
- **Nombre:** Vínculos de apoyo de la organización
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportEngagementsController.list` — `src/modules/delegated_access/controllers/support-engagements.controller.ts:76`

### Qué es y para qué sirve (negocio)

Vínculos de apoyo de la organización. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /org/support-engagements` la atiende `SupportEngagementsController.list` (src/modules/delegated_access/controllers/support-engagements.controller.ts:76). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `SupportEngagementsService.listForTenant`. Lee audit.audit_log, delegated_access.organization_user_assignments, delegated_access.role_templates, delegated_access.support_grant_actions, delegated_access.support_scope_grants, directory.tenant_memberships, directory.tenants, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/support-engagements.controller.ts:76` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | LEE | LEE | POR_SQL | SupportEngagementsController.list → SupportEngagementsService.listForTenant → SupportEngagementsService.toViews → SupportActivityRepository.lastActivity | `src/modules/delegated_access/repositories/support-activity.repository.ts:342` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportEngagementsController.list → SupportEngagementsService.listForTenant → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:113` |
| `delegated_access.role_templates` | LEE | LEE | DIRECTA | SupportEngagementsController.list → SupportEngagementsService.listForTenant → SupportEngagementsService.toViews → RoleTemplatesRepository.findById | `src/modules/delegated_access/repositories/role-templates.repository.ts:35` |
| `delegated_access.support_grant_actions` | LEE | LEE | DIRECTA | SupportEngagementsController.list → SupportEngagementsService.listForTenant → SupportEngagementsService.toViews → SupportEngagementsService.grantViews → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:165` |
| `delegated_access.support_scope_grants` | LEE | LEE | DIRECTA | SupportEngagementsController.list → SupportEngagementsService.listForTenant → SupportEngagementsService.toViews → SupportEngagementsService.grantViews → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:161` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportEngagementsController.list → SupportEngagementsService.listForTenant → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:117` |
| `directory.tenants` | LEE | LEE | POR_SQL | SupportEngagementsController.list → SupportEngagementsService.listForTenant → SupportEngagementsService.toViews → SupportActivityRepository.tenantNames | `src/modules/delegated_access/repositories/support-activity.repository.ts:170` |
| `iam.users` | LEE | LEE | POR_SQL | SupportEngagementsController.list → SupportEngagementsService.listForTenant → SupportEngagementsService.toViews → SupportActivityRepository.userNames | `src/modules/delegated_access/repositories/support-activity.repository.ts:111` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListSupportEngagementsResponseDto>` · DTO `ListSupportEngagementsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SupportEngagementViewDto>` | Sí | — | — | Vínculos. | `src/modules/delegated_access/dto/support-grants.dto.ts:205` |
| `items[].id` | `string` | Sí | formato uuid | — | Id del vínculo. | `src/modules/delegated_access/dto/support-grants.dto.ts:132` |
| `items[].tenantId` | `string` | Sí | formato uuid | — | Organización. | `src/modules/delegated_access/dto/support-grants.dto.ts:134` |
| `items[].userId` | `string` | Sí | formato uuid | — | Persona de apoyo. | `src/modules/delegated_access/dto/support-grants.dto.ts:136` |
| `items[].roleTemplateCode` | `string` | No | — | — | Plantilla de rol (código). | `src/modules/delegated_access/dto/support-grants.dto.ts:138` |
| `items[].personName` | `string` | No | — | — | Nombre de la persona de apoyo. | `src/modules/delegated_access/dto/support-grants.dto.ts:140` |
| `items[].organizationName` | `string` | No | — | — | Nombre de la organización. | `src/modules/delegated_access/dto/support-grants.dto.ts:142` |
| `items[].ownerKind` | `string` | No | — | — | Dueño del vínculo: `ORGANIZATION` o `PRIVATE_PRACTICE`. | `src/modules/delegated_access/dto/support-grants.dto.ts:144` |
| `items[].recertifyEveryMonths` | `number` | No | — | — | Cada cuántos meses se recertifica (6 o 12). | `src/modules/delegated_access/dto/support-grants.dto.ts:146` |
| `items[].status` | `string` | Sí | — | — | Estado del vínculo. | `src/modules/delegated_access/dto/support-grants.dto.ts:148` |
| `items[].origin` | `string` | No | — | — | Origen (REQUEST, INVITATION, QR). | `src/modules/delegated_access/dto/support-grants.dto.ts:150` |
| `items[].validFrom` | `string` | No | formato date-time | — | Inicio de vigencia. | `src/modules/delegated_access/dto/support-grants.dto.ts:152` |
| `items[].validTo` | `string` | No | formato date-time | — | Fin de vigencia. | `src/modules/delegated_access/dto/support-grants.dto.ts:154` |
| `items[].nextRecertificationAt` | `string` | No | formato date-time | — | Próxima recertificación. | `src/modules/delegated_access/dto/support-grants.dto.ts:157` |
| `items[].recertificationDue` | `boolean` | Sí | — | — | ¿Ya venció la fecha de recertificación y está esperando confirmación? | `src/modules/delegated_access/dto/support-grants.dto.ts:159` |
| `items[].endedReason` | `string` | No | — | — | Motivo del fin de vínculo. | `src/modules/delegated_access/dto/support-grants.dto.ts:161` |
| `items[].lastActivityAt` | `string` | No | formato date-time | — | Última actividad de la persona en la organización dentro de los últimos 90 días; ausente si no hubo. | `src/modules/delegated_access/dto/support-grants.dto.ts:167` |
| `items[].suspendedAt` | `string` | No | formato date-time | — | Fecha en que el vínculo se suspende (o debió suspenderse) por no recertificarse: la de recertificación más 15 días. Solo si está suspendido por eso. | `src/modules/delegated_access/dto/support-grants.dto.ts:174` |
| `items[].lastConfirmedAt` | `string` | No | formato date-time | — | Última vez que la ORGANIZACIÓN confirmó (recertificó) el vínculo, o su aprobación inicial: la recertificación vigente menos su período. | `src/modules/delegated_access/dto/support-grants.dto.ts:180` |
| `items[].lastConfirmedBy` | `string` | No | valores: PERSON, ORGANIZATION | — | Quién hizo esa confirmación: siempre `ORGANIZATION` (la persona solo declara). | `src/modules/delegated_access/dto/support-grants.dto.ts:183` |
| `items[].personConfirmedAt` | `string` | No | formato date-time | — | Última vez que la propia persona declaró «sigo trabajando aquí» (asiento `SUPPORT_ENGAGEMENT_CONFIRMED_BY_PERSON` más reciente). No renueva el período ni reactiva: es información para quien administra. | `src/modules/delegated_access/dto/support-grants.dto.ts:190` |
| `items[].grants` | `array<SupportGrantViewDto>` | Sí | — | — | Permisos del vínculo. | `src/modules/delegated_access/dto/support-grants.dto.ts:192` |
| `items[].grants[].id` | `string` | Sí | formato uuid | — | Id del permiso. | `src/modules/delegated_access/dto/support-grants.dto.ts:116` |
| `items[].grants[].actions` | `array<string>` | Sí | — | — | Acciones incluidas. | `src/modules/delegated_access/dto/support-grants.dto.ts:118` |
| `items[].grants[].expansionMode` | `string` | Sí | — | — | DYNAMIC o FIXED. | `src/modules/delegated_access/dto/support-grants.dto.ts:120` |
| `items[].grants[].status` | `string` | Sí | — | — | Estado (ACTIVE, REVOKED, EXPIRED...). | `src/modules/delegated_access/dto/support-grants.dto.ts:122` |
| `items[].grants[].validFrom` | `string` | No | formato date-time | — | Inicio de vigencia. | `src/modules/delegated_access/dto/support-grants.dto.ts:124` |
| `items[].grants[].validTo` | `string` | No | formato date-time | — | Fin de vigencia. | `src/modules/delegated_access/dto/support-grants.dto.ts:126` |
| `count` | `number` | Sí | — | — | Cantidad devuelta. | `src/modules/delegated_access/dto/support-grants.dto.ts:207` |

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

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportEngagementsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 34. POST /org/support-engagements/{id}/end

- **Origen:** CONTRATO
- **Nombre:** Terminar un vínculo de apoyo (revocación inmediata)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportEngagementsController.end` — `src/modules/delegated_access/controllers/support-engagements.controller.ts:148`

### Qué es y para qué sirve (negocio)

Terminar un vínculo de apoyo (revocación inmediata). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /org/support-engagements/{id}/end` la atiende `SupportEngagementsController.end` (src/modules/delegated_access/controllers/support-engagements.controller.ts:148). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `EndEngagementDto` (1 campo, 1 obligatorio). Delega en `SupportEngagementsService.end`. Crea filas en delegated_access.delegation_events, delegated_access.effective_support_access, delegated_access.practitioner_delegate_assignments. Actualiza delegated_access.engagement_requests, delegated_access.practitioner_delegate_assignments, delegated_access.support_scope_grants, directory.tenant_memberships. Borra de delegated_access.effective_support_access. Lee delegated_access.engagement_requests, delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments, delegated_access.support_grant_actions, delegated_access.support_scope_grants, directory.branch_memberships, directory.tenant_memberships, practice.care_spaces y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/support-engagements.controller.ts:148` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/support-engagements.controller.ts:148` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | SupportEngagementsController.end → SupportEngagementsService.end → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.effective_support_access` | BORRA | BORRA | DIRECTA | SupportEngagementsController.end → SupportEngagementsService.end → EffectiveSupportAccessService.refreshTenant → EffectiveSupportAccessRepository.replace | `src/modules/delegated_access/repositories/effective-support-access.repository.ts:56` |
| `delegated_access.effective_support_access` | ESCRIBE | CREA | DIRECTA | SupportEngagementsController.end → SupportEngagementsService.end → EffectiveSupportAccessService.refreshTenant → EffectiveSupportAccessRepository.replace | `src/modules/delegated_access/repositories/effective-support-access.repository.ts:61` |
| `delegated_access.engagement_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportEngagementsController.end → SupportEngagementsService.end | `src/modules/delegated_access/services/support-engagements.service.ts:537` |
| `delegated_access.engagement_requests` | LEE | LEE | DIRECTA | SupportEngagementsController.end → SupportEngagementsService.end → EngagementRequestsRepository.findByRequester | `src/modules/delegated_access/repositories/engagement-requests.repository.ts:132` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportEngagementsController.end → SupportEngagementsService.end → SupportEngagementsRepository.syncSupportMembership | `src/modules/delegated_access/repositories/support-engagements.repository.ts:197` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportEngagementsController.end → SupportEngagementsService.end | `src/modules/delegated_access/services/support-engagements.service.ts:513` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | CREA | DIRECTA | SupportEngagementsController.end → SupportEngagementsService.end → EffectiveSupportAccessService.refreshTenant → PractitionerDelegateAssignmentsRepository.create | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:92` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | SupportEngagementsController.end → SupportEngagementsService.end → SupportEngagementsRepository.findDelegations | `src/modules/delegated_access/repositories/support-engagements.repository.ts:137` |
| `delegated_access.support_grant_actions` | LEE | LEE | DIRECTA | SupportEngagementsController.end → SupportEngagementsService.end → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:165` |
| `delegated_access.support_scope_grants` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportEngagementsController.end → SupportEngagementsService.end | `src/modules/delegated_access/services/support-engagements.service.ts:506` |
| `delegated_access.support_scope_grants` | LEE | LEE | DIRECTA | SupportEngagementsController.end → SupportEngagementsService.end → SupportGrantsRepository.findByEngagement | `src/modules/delegated_access/repositories/support-grants.repository.ts:63` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | SupportEngagementsController.end → SupportEngagementsService.end → SupportEngagementsRepository.syncSupportMembership → SupportEngagementsRepository.hasOtherMembershipReason | `src/modules/delegated_access/repositories/support-engagements.repository.ts:249` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportEngagementsController.end → SupportEngagementsService.end → SupportEngagementsRepository.syncSupportMembership | `src/modules/delegated_access/repositories/support-engagements.repository.ts:217` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportEngagementsController.end → SupportEngagementsService.end → SupportEngagementsRepository.syncSupportMembership | `src/modules/delegated_access/repositories/support-engagements.repository.ts:191` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SupportEngagementsController.end → SupportEngagementsService.end → EffectiveSupportAccessService.refreshTenant → EffectiveSupportAccessService.toExpandable → SupportAccessRepository.findCareSpaceIdsWithin | `src/modules/delegated_access/repositories/support-access.repository.ts:413` |
| `practice.practices` | LEE | LEE | DIRECTA | SupportEngagementsController.end → SupportEngagementsService.end → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findRoleAssignmentsOfTenant | `src/modules/delegated_access/repositories/support-access.repository.ts:260` |
| `practice.practitioner_location_assignments` | LEE | LEE | DIRECTA | SupportEngagementsController.end → SupportEngagementsService.end → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findLocationPairs | `src/modules/delegated_access/repositories/support-access.repository.ts:467` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | SupportEngagementsController.end → SupportEngagementsService.end → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findRoleAssignmentsOfTenant | `src/modules/delegated_access/repositories/support-access.repository.ts:266` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `EndEngagementDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | — | `src/modules/delegated_access/dto/support-grants.dto.ts:110` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
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
| `ok` | `boolean` | Sí | — | — | Indica éxito | `src/modules/delegated_access/dto/responses.dto.ts:110` |
| `status` | `string` | No | — | — | Nuevo estado del recurso (concept id) | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Vínculo de apoyo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportEngagementsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 35. GET /org/support-engagements/{id}/grants

- **Origen:** CONTRATO
- **Nombre:** Permisos de un vínculo de apoyo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportEngagementsController.listGrants` — `src/modules/delegated_access/controllers/support-engagements.controller.ts:84`

### Qué es y para qué sirve (negocio)

Permisos de un vínculo de apoyo. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /org/support-engagements/{id}/grants` la atiende `SupportEngagementsController.listGrants` (src/modules/delegated_access/controllers/support-engagements.controller.ts:84). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `SupportEngagementsService.listGrants`. Lee delegated_access.organization_user_assignments, delegated_access.support_grant_actions, delegated_access.support_scope_grants, directory.tenant_memberships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/support-engagements.controller.ts:84` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/support-engagements.controller.ts:84` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportEngagementsController.listGrants → SupportEngagementsService.listGrants → SupportEngagementsService.loadInTenant → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:113` |
| `delegated_access.support_grant_actions` | LEE | LEE | DIRECTA | SupportEngagementsController.listGrants → SupportEngagementsService.listGrants → SupportEngagementsService.grantViews → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:165` |
| `delegated_access.support_scope_grants` | LEE | LEE | DIRECTA | SupportEngagementsController.listGrants → SupportEngagementsService.listGrants → SupportEngagementsService.grantViews → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:161` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportEngagementsController.listGrants → SupportEngagementsService.listGrants → SupportEngagementsService.loadInTenant → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:117` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SupportGrantViewDto[]>` · DTO `SupportGrantViewDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del permiso. | `src/modules/delegated_access/dto/support-grants.dto.ts:116` |
| `actions` | `array<string>` | Sí | — | — | Acciones incluidas. | `src/modules/delegated_access/dto/support-grants.dto.ts:118` |
| `expansionMode` | `string` | Sí | — | — | DYNAMIC o FIXED. | `src/modules/delegated_access/dto/support-grants.dto.ts:120` |
| `status` | `string` | Sí | — | — | Estado (ACTIVE, REVOKED, EXPIRED...). | `src/modules/delegated_access/dto/support-grants.dto.ts:122` |
| `validFrom` | `string` | No | formato date-time | — | Inicio de vigencia. | `src/modules/delegated_access/dto/support-grants.dto.ts:124` |
| `validTo` | `string` | No | formato date-time | — | Fin de vigencia. | `src/modules/delegated_access/dto/support-grants.dto.ts:126` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Vínculo de apoyo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportEngagementsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 36. PATCH /org/support-engagements/{id}/grants

- **Origen:** CONTRATO
- **Nombre:** Editar o dar de baja un permiso de apoyo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportEngagementsController.updateGrant` — `src/modules/delegated_access/controllers/support-engagements.controller.ts:112`

### Qué es y para qué sirve (negocio)

Editar o dar de baja un permiso de apoyo. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`PATCH /org/support-engagements/{id}/grants` la atiende `SupportEngagementsController.updateGrant` (src/modules/delegated_access/controllers/support-engagements.controller.ts:112). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `UpdateSupportGrantDto` (5 campos, 1 obligatorio). Delega en `SupportEngagementsService.updateGrant`. Crea filas en delegated_access.effective_support_access, delegated_access.practitioner_delegate_assignments, delegated_access.support_grant_actions. Actualiza delegated_access.support_scope_grants. Borra de delegated_access.effective_support_access, delegated_access.support_grant_actions. Lee delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments, delegated_access.support_grant_actions, delegated_access.support_scope_grants, directory.tenant_memberships, practice.care_spaces, practice.healthcare_services, practice.practice_sites y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/support-engagements.controller.ts:112` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/support-engagements.controller.ts:112` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.effective_support_access` | BORRA | BORRA | DIRECTA | SupportEngagementsController.updateGrant → SupportEngagementsService.updateGrant → EffectiveSupportAccessService.refreshTenant → EffectiveSupportAccessRepository.replace | `src/modules/delegated_access/repositories/effective-support-access.repository.ts:56` |
| `delegated_access.effective_support_access` | ESCRIBE | CREA | DIRECTA | SupportEngagementsController.updateGrant → SupportEngagementsService.updateGrant → EffectiveSupportAccessService.refreshTenant → EffectiveSupportAccessRepository.replace | `src/modules/delegated_access/repositories/effective-support-access.repository.ts:61` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportEngagementsController.updateGrant → SupportEngagementsService.updateGrant → SupportEngagementsService.loadInTenant → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:113` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | CREA | DIRECTA | SupportEngagementsController.updateGrant → SupportEngagementsService.updateGrant → EffectiveSupportAccessService.refreshTenant → PractitionerDelegateAssignmentsRepository.create | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:92` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | SupportEngagementsController.updateGrant → SupportEngagementsService.updateGrant → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findDelegationsOfEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:199` |
| `delegated_access.support_grant_actions` | BORRA | BORRA | POR_TIPO | SupportEngagementsController.updateGrant → SupportEngagementsService.updateGrant → SupportEngagementsService.replaceActions → SupportGrantsRepository.removeActions | `src/modules/delegated_access/repositories/support-grants.repository.ts:168` |
| `delegated_access.support_grant_actions` | ESCRIBE | CREA | DIRECTA | SupportEngagementsController.updateGrant → SupportEngagementsService.updateGrant → SupportEngagementsService.replaceActions → SupportGrantsRepository.addActions | `src/modules/delegated_access/repositories/support-grants.repository.ts:148` |
| `delegated_access.support_grant_actions` | LEE | LEE | DIRECTA | SupportEngagementsController.updateGrant → SupportEngagementsService.updateGrant → SupportEngagementsService.replaceActions → SupportGrantsRepository.findActions | `src/modules/delegated_access/repositories/support-grants.repository.ts:131` |
| `delegated_access.support_scope_grants` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportEngagementsController.updateGrant → SupportEngagementsService.updateGrant | `src/modules/delegated_access/services/support-engagements.service.ts:292` |
| `delegated_access.support_scope_grants` | LEE | LEE | DIRECTA | SupportEngagementsController.updateGrant → SupportEngagementsService.updateGrant → SupportGrantsRepository.findById | `src/modules/delegated_access/repositories/support-grants.repository.ts:49` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportEngagementsController.updateGrant → SupportEngagementsService.updateGrant → SupportEngagementsService.loadInTenant → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:117` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SupportEngagementsController.updateGrant → SupportEngagementsService.updateGrant → SupportTargetsService.buildSnapshot → SupportAccessRepository.findCareSpaceIdsWithin | `src/modules/delegated_access/repositories/support-access.repository.ts:413` |
| `practice.healthcare_services` | LEE | LEE | DIRECTA | SupportEngagementsController.updateGrant → SupportEngagementsService.updateGrant → SupportTargetsService.buildSnapshot → SupportAccessRepository.findServiceIdsOfTenant | `src/modules/delegated_access/repositories/support-access.repository.ts:394` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SupportEngagementsController.updateGrant → SupportEngagementsService.updateGrant → SupportTargetsService.buildSnapshot → SupportAccessRepository.findCareSpaceIdsOfTenant | `src/modules/delegated_access/repositories/support-access.repository.ts:441` |
| `practice.practices` | LEE | LEE | DIRECTA | SupportEngagementsController.updateGrant → SupportEngagementsService.updateGrant → SupportTargetsService.buildSnapshot → SupportAccessRepository.findRoleAssignments | `src/modules/delegated_access/repositories/support-access.repository.ts:230` |
| `practice.practitioner_location_assignments` | LEE | LEE | DIRECTA | SupportEngagementsController.updateGrant → SupportEngagementsService.updateGrant → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findLocationPairs | `src/modules/delegated_access/repositories/support-access.repository.ts:467` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | SupportEngagementsController.updateGrant → SupportEngagementsService.updateGrant → SupportTargetsService.buildSnapshot → SupportAccessRepository.findRoleAssignments | `src/modules/delegated_access/repositories/support-access.repository.ts:227` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateSupportGrantDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `grantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/delegated_access/dto/support-grants.dto.ts:57` |
| `actions` | `array<string>` | No | mínimo 1 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMinSize(1)` `@ArrayUnique()` `@IsIn(SUPPORT_ACTIONS, { each: true })` | — | `src/modules/delegated_access/dto/support-grants.dto.ts:66` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | — | `src/modules/delegated_access/dto/support-grants.dto.ts:72` |
| `expansionMode` | `string` | No | valores: DYNAMIC, FIXED | `@IsOptional()` `@IsIn(EXPANSION_MODES)` | — | `src/modules/delegated_access/dto/support-grants.dto.ts:82` |
| `revoke` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/delegated_access/dto/support-grants.dto.ts:88` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "grantId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "grantId": "00000000-0000-4000-8000-000000000001",
  "actions": [
    "schedule.view"
  ],
  "validTo": "2026-07-31T12:00:00.000Z",
  "expansionMode": "DYNAMIC",
  "revoke": true
}
```

</details>

### Respuesta — `Promise<OperationResultDto>` · DTO `OperationResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | Indica éxito | `src/modules/delegated_access/dto/responses.dto.ts:110` |
| `status` | `string` | No | — | — | Nuevo estado del recurso (concept id) | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Vínculo de apoyo no encontrado; ResourceNotFoundException: Permiso no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No hay cambios que aplicar; PreconditionFailedException: El vínculo de apoyo no está activo; PreconditionFailedException: {error.message} / Foto demasiado grande |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN}; Error: No hay doctores, servicios ni espacios que congelar: use un permiso dinámico |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportEngagementsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 37. POST /org/support-engagements/{id}/grants

- **Origen:** CONTRATO
- **Nombre:** Otorgar un permiso de apoyo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportEngagementsController.addGrant` — `src/modules/delegated_access/controllers/support-engagements.controller.ts:94`

### Qué es y para qué sirve (negocio)

Otorgar un permiso de apoyo. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /org/support-engagements/{id}/grants` la atiende `SupportEngagementsController.addGrant` (src/modules/delegated_access/controllers/support-engagements.controller.ts:94). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateSupportGrantDto` (9 campos, 2 obligatorios). Delega en `SupportEngagementsService.addGrant`. Crea filas en delegated_access.effective_support_access, delegated_access.practitioner_delegate_assignments, delegated_access.support_grant_actions, delegated_access.support_scope_grants. Borra de delegated_access.effective_support_access. Lee delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments, delegated_access.support_grant_actions, delegated_access.support_scope_grants, directory.tenant_memberships, practice.care_spaces, practice.healthcare_services, practice.practice_sites y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/support-engagements.controller.ts:94` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/support-engagements.controller.ts:94` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.effective_support_access` | BORRA | BORRA | DIRECTA | SupportEngagementsController.addGrant → SupportEngagementsService.addGrant → EffectiveSupportAccessService.refreshTenant → EffectiveSupportAccessRepository.replace | `src/modules/delegated_access/repositories/effective-support-access.repository.ts:56` |
| `delegated_access.effective_support_access` | ESCRIBE | CREA | DIRECTA | SupportEngagementsController.addGrant → SupportEngagementsService.addGrant → EffectiveSupportAccessService.refreshTenant → EffectiveSupportAccessRepository.replace | `src/modules/delegated_access/repositories/effective-support-access.repository.ts:61` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportEngagementsController.addGrant → SupportEngagementsService.addGrant → SupportEngagementsService.loadInTenant → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:113` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | CREA | DIRECTA | SupportEngagementsController.addGrant → SupportEngagementsService.addGrant → EffectiveSupportAccessService.refreshTenant → PractitionerDelegateAssignmentsRepository.create | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:92` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | SupportEngagementsController.addGrant → SupportEngagementsService.addGrant → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findDelegationsOfEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:199` |
| `delegated_access.support_grant_actions` | ESCRIBE | CREA | DIRECTA | SupportEngagementsController.addGrant → SupportEngagementsService.addGrant → SupportGrantsRepository.addActions | `src/modules/delegated_access/repositories/support-grants.repository.ts:148` |
| `delegated_access.support_grant_actions` | LEE | LEE | DIRECTA | SupportEngagementsController.addGrant → SupportEngagementsService.addGrant → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:165` |
| `delegated_access.support_scope_grants` | ESCRIBE | CREA | DIRECTA | SupportEngagementsController.addGrant → SupportEngagementsService.addGrant → SupportGrantsRepository.create | `src/modules/delegated_access/repositories/support-grants.repository.ts:98` |
| `delegated_access.support_scope_grants` | LEE | LEE | DIRECTA | SupportEngagementsController.addGrant → SupportEngagementsService.addGrant → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:161` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportEngagementsController.addGrant → SupportEngagementsService.addGrant → SupportEngagementsService.loadInTenant → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:117` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SupportEngagementsController.addGrant → SupportEngagementsService.addGrant → SupportTargetsService.assertTarget → SupportAccessRepository.findCareSpaces | `src/modules/delegated_access/repositories/support-access.repository.ts:302` |
| `practice.healthcare_services` | LEE | LEE | DIRECTA | SupportEngagementsController.addGrant → SupportEngagementsService.addGrant → SupportTargetsService.assertTarget → SupportAccessRepository.findServices | `src/modules/delegated_access/repositories/support-access.repository.ts:362` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SupportEngagementsController.addGrant → SupportEngagementsService.addGrant → SupportTargetsService.assertTarget → SupportAccessRepository.tenantsOfSites | `src/modules/delegated_access/repositories/support-access.repository.ts:335` |
| `practice.practices` | LEE | LEE | DIRECTA | SupportEngagementsController.addGrant → SupportEngagementsService.addGrant → SupportTargetsService.assertTarget → SupportAccessRepository.findRoleAssignments | `src/modules/delegated_access/repositories/support-access.repository.ts:230` |
| `practice.practitioner_location_assignments` | LEE | LEE | DIRECTA | SupportEngagementsController.addGrant → SupportEngagementsService.addGrant → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findLocationPairs | `src/modules/delegated_access/repositories/support-access.repository.ts:467` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | SupportEngagementsController.addGrant → SupportEngagementsService.addGrant → SupportTargetsService.assertTarget → SupportAccessRepository.findRoleAssignments | `src/modules/delegated_access/repositories/support-access.repository.ts:227` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateSupportGrantDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `targetKind` | `string` | Sí | valores: PRACTITIONER, SERVICE, LOCATION, PRACTITIONER_SERVICE, PRACTITIONER_LOCATION, SERVICE_LOCATION, ALL_PRACTITIONERS, ALL_SERVICES, ALL_LOCATIONS, ALL | `@IsIn(SUPPORT_TARGET_KINDS)` | — | `src/modules/delegated_access/dto/support-target.dto.ts:26` |
| `practitionerRoleAssignmentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/support-target.dto.ts:32` |
| `healthcareServiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/support-target.dto.ts:38` |
| `careSpaceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/support-target.dto.ts:44` |
| `practiceSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/support-target.dto.ts:50` |
| `actions` | `array<string>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayUnique()` `@IsIn(SUPPORT_ACTIONS, { each: true })` | — | `src/modules/delegated_access/dto/support-grants.dto.ts:31` |
| `expansionMode` | `string` | No | valores: DYNAMIC, FIXED | `@IsOptional()` `@IsIn(EXPANSION_MODES)` | — | `src/modules/delegated_access/dto/support-grants.dto.ts:37` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | — | `src/modules/delegated_access/dto/support-grants.dto.ts:43` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | — | `src/modules/delegated_access/dto/support-grants.dto.ts:49` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "targetKind": "PRACTITIONER",
  "actions": [
    "schedule.view"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "targetKind": "PRACTITIONER",
  "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
  "healthcareServiceId": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "actions": [
    "schedule.view"
  ],
  "expansionMode": "DYNAMIC",
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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Vínculo de apoyo no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El vínculo de apoyo no está activo; PreconditionFailedException: {error.message} / Foto demasiado grande |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN}; DomainException: {HttpStatus.BAD_REQUEST}; Error: No hay doctores, servicios ni espacios que congelar: use un permiso dinámico |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportEngagementsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 38. POST /org/support-engagements/{id}/recertify

- **Origen:** CONTRATO
- **Nombre:** Recertificar un vínculo de apoyo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportEngagementsController.recertify` — `src/modules/delegated_access/controllers/support-engagements.controller.ts:130`

### Qué es y para qué sirve (negocio)

Recertificar un vínculo de apoyo. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /org/support-engagements/{id}/recertify` la atiende `SupportEngagementsController.recertify` (src/modules/delegated_access/controllers/support-engagements.controller.ts:130). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RecertifyEngagementDto` (1 campo, 0 obligatorios). Delega en `SupportEngagementsService.recertify`. Crea filas en delegated_access.effective_support_access, delegated_access.practitioner_delegate_assignments. Actualiza delegated_access.practitioner_delegate_assignments, directory.tenant_memberships. Borra de delegated_access.effective_support_access. Lee delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments, delegated_access.support_grant_actions, delegated_access.support_scope_grants, directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.practices y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/support-engagements.controller.ts:130` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/support-engagements.controller.ts:130` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.effective_support_access` | BORRA | BORRA | DIRECTA | SupportEngagementsController.recertify → SupportEngagementsService.recertify → EffectiveSupportAccessService.refreshTenant → EffectiveSupportAccessRepository.replace | `src/modules/delegated_access/repositories/effective-support-access.repository.ts:56` |
| `delegated_access.effective_support_access` | ESCRIBE | CREA | DIRECTA | SupportEngagementsController.recertify → SupportEngagementsService.recertify → EffectiveSupportAccessService.refreshTenant → EffectiveSupportAccessRepository.replace | `src/modules/delegated_access/repositories/effective-support-access.repository.ts:61` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportEngagementsController.recertify → SupportEngagementsService.recertify → SupportEngagementsService.loadInTenant → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:113` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportEngagementsController.recertify → SupportEngagementsService.recertify → SupportEngagementsService.renew | `src/modules/delegated_access/services/support-engagements.service.ts:454` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | CREA | DIRECTA | SupportEngagementsController.recertify → SupportEngagementsService.recertify → EffectiveSupportAccessService.refreshTenant → PractitionerDelegateAssignmentsRepository.create | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:92` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | SupportEngagementsController.recertify → SupportEngagementsService.recertify → SupportEngagementsService.renew → SupportEngagementsRepository.findDelegations | `src/modules/delegated_access/repositories/support-engagements.repository.ts:137` |
| `delegated_access.support_grant_actions` | LEE | LEE | DIRECTA | SupportEngagementsController.recertify → SupportEngagementsService.recertify → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:165` |
| `delegated_access.support_scope_grants` | LEE | LEE | DIRECTA | SupportEngagementsController.recertify → SupportEngagementsService.recertify → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:161` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | SupportEngagementsController.recertify → SupportEngagementsService.recertify → SupportEngagementsService.renew → SupportEngagementsRepository.syncSupportMembership → SupportEngagementsRepository.hasOtherMembershipReason | `src/modules/delegated_access/repositories/support-engagements.repository.ts:249` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | SupportEngagementsController.recertify → SupportEngagementsService.recertify → SupportEngagementsService.renew → SupportEngagementsRepository.syncSupportMembership | `src/modules/delegated_access/repositories/support-engagements.repository.ts:217` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportEngagementsController.recertify → SupportEngagementsService.recertify → SupportEngagementsService.loadInTenant → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:117` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SupportEngagementsController.recertify → SupportEngagementsService.recertify → EffectiveSupportAccessService.refreshTenant → EffectiveSupportAccessService.toExpandable → SupportAccessRepository.findCareSpaceIdsWithin | `src/modules/delegated_access/repositories/support-access.repository.ts:413` |
| `practice.practices` | LEE | LEE | DIRECTA | SupportEngagementsController.recertify → SupportEngagementsService.recertify → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findRoleAssignmentsOfTenant | `src/modules/delegated_access/repositories/support-access.repository.ts:260` |
| `practice.practitioner_location_assignments` | LEE | LEE | DIRECTA | SupportEngagementsController.recertify → SupportEngagementsService.recertify → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findLocationPairs | `src/modules/delegated_access/repositories/support-access.repository.ts:467` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | SupportEngagementsController.recertify → SupportEngagementsService.recertify → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findRoleAssignmentsOfTenant | `src/modules/delegated_access/repositories/support-access.repository.ts:266` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecertifyEngagementDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `recertifyEveryMonths` | `number` | No | valores: 6, 12; mínimo 6; máximo 12 | `@IsOptional()` `@Type(() => Number)` `@IsInt()` `@Min(6)` `@Max(12)` `@IsIn([6, 12])` | — | `src/modules/delegated_access/dto/support-grants.dto.ts:101` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "recertifyEveryMonths": 6
}
```

</details>

### Respuesta — `Promise<OperationResultDto>` · DTO `OperationResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | Indica éxito | `src/modules/delegated_access/dto/responses.dto.ts:110` |
| `status` | `string` | No | — | — | Nuevo estado del recurso (concept id) | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Vínculo de apoyo no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo se recertifica un vínculo activo o suspendido por recertificación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportEngagementsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 39. PATCH /org/user-assignments/{id}

- **Origen:** CONTRATO
- **Nombre:** Reasignar supervisor / suspender asignación de organización
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrgUserAssignmentsController.update` — `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:59`

### Qué es y para qué sirve (negocio)

Reasignar supervisor / suspender asignación de organización. Caso de uso UC-29-10: Reasignar supervisor / suspender (cascada). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:237`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`PATCH /org/user-assignments/{id}` la atiende `OrgUserAssignmentsController.update` (src/modules/delegated_access/controllers/org-user-assignments.controller.ts:59). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `UpdateOrgUserAssignmentDto` (4 campos, 0 obligatorios). Delega en `OrgUserAssignmentsService.updateAssignment`. Actualiza delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments. Lee delegated_access.organization_user_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:59` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/org-user-assignments.controller.ts:59` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | OrgUserAssignmentsController.update → OrgUserAssignmentsService.updateAssignment | `src/modules/delegated_access/services/org-user-assignments.service.ts:174` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | OrgUserAssignmentsController.update → OrgUserAssignmentsService.updateAssignment → OrganizationUserAssignmentsRepository.findById | `src/modules/delegated_access/repositories/organization-user-assignments.repository.ts:84` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | ACTUALIZA | DIRECTA | OrgUserAssignmentsController.update → OrgUserAssignmentsService.updateAssignment → PractitionerDelegateAssignmentsRepository.suspendByDelegateAssignment | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:124` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateOrgUserAssignmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `supervisorUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nuevo supervisor | `src/modules/delegated_access/dto/update-org-user-assignment.dto.ts:17` |
| `accessScope` | `string` | No | valores: TENANT, PRACTICE, SITE, UNIT | `@IsOptional()` `@IsIn(SCOPES)` | Nuevo alcance de acceso | `src/modules/delegated_access/dto/update-org-user-assignment.dto.ts:25` |
| `suspend` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Suspender la asignación (cascada a delegaciones) | `src/modules/delegated_access/dto/update-org-user-assignment.dto.ts:35` |
| `expectedRowVersion` | `number` | No | — | `@IsOptional()` `@IsInt()` | row_version esperado (concurrencia optimista) | `src/modules/delegated_access/dto/update-org-user-assignment.dto.ts:45` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
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
| `ok` | `boolean` | Sí | — | — | Indica éxito | `src/modules/delegated_access/dto/responses.dto.ts:110` |
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
| CONTROLADOR | `src/modules/delegated_access/controllers/org-user-assignments.controller.spec.ts:35` |

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `UC-29-10`

---

## 40. POST /practitioner-delegates

- **Origen:** CONTRATO
- **Nombre:** Crear asignación de delegado de practitioner
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerDelegatesController.create` — `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:51`

### Qué es y para qué sirve (negocio)

Crear asignación de delegado de practitioner. Caso de uso UC-29-03: Crear delegación de practitioner. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:230`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /practitioner-delegates` la atiende `PractitionerDelegatesController.create` (src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:51). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePractitionerDelegateDto` (10 campos, 3 obligatorios). Delega en `PractitionerDelegatesService.createDelegate`. Crea filas en delegated_access.delegation_events, delegated_access.practitioner_delegate_assignments. Lee delegated_access.delegated_permission_sets, delegated_access.organization_user_assignments, directory.tenant_memberships, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:51` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | PractitionerDelegatesController.create → PractitionerDelegatesService.createDelegate → DelegationScopeService.loadSetInTenant → DelegatedPermissionSetsRepository.findById | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:52` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.create → PractitionerDelegatesService.createDelegate → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | PractitionerDelegatesController.create → PractitionerDelegatesService.createDelegate → DelegationScopeService.loadOrgAssignmentInTenant → OrganizationUserAssignmentsRepository.findById | `src/modules/delegated_access/repositories/organization-user-assignments.repository.ts:84` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.create → PractitionerDelegatesService.createDelegate → PractitionerDelegateAssignmentsRepository.create | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:92` |
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

## 41. POST /practitioner-delegates/{id}/accept

- **Origen:** CONTRATO
- **Nombre:** Aceptar a una persona de apoyo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSupportController.accept` — `src/modules/delegated_access/controllers/practitioner-support.controller.ts:113`

### Qué es y para qué sirve (negocio)

Aceptar a una persona de apoyo. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /practitioner-delegates/{id}/accept` la atiende `PractitionerSupportController.accept` (src/modules/delegated_access/controllers/practitioner-support.controller.ts:113). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `AcceptSupportDelegateDto` (3 campos, 1 obligatorio). Delega en `PractitionerSupportService.accept`. Crea filas en delegated_access.effective_support_access, delegated_access.practitioner_delegate_assignments. Actualiza delegated_access.practitioner_delegate_assignments. Borra de delegated_access.effective_support_access. Lee delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments, delegated_access.support_grant_actions, delegated_access.support_scope_grants, directory.tenant_memberships, practice.care_spaces, practice.practices, practice.practitioner_location_assignments y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:113` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:113` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.effective_support_access` | BORRA | BORRA | DIRECTA | PractitionerSupportController.accept → PractitionerSupportService.accept → EffectiveSupportAccessService.refreshTenant → EffectiveSupportAccessRepository.replace | `src/modules/delegated_access/repositories/effective-support-access.repository.ts:56` |
| `delegated_access.effective_support_access` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.accept → PractitionerSupportService.accept → EffectiveSupportAccessService.refreshTenant → EffectiveSupportAccessRepository.replace | `src/modules/delegated_access/repositories/effective-support-access.repository.ts:61` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.accept → PractitionerSupportService.accept → PractitionerSupportService.loadOwn → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:113` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerSupportController.accept → PractitionerSupportService.accept → PractitionerSupportService.applyReplySettings | `src/modules/delegated_access/services/practitioner-support.service.ts:315` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | CREA | DIRECTA | PractitionerSupportController.accept → PractitionerSupportService.accept → EffectiveSupportAccessService.refreshTenant → PractitionerDelegateAssignmentsRepository.create | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:92` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.accept → PractitionerSupportService.accept → PractitionerSupportService.loadOwn → PractitionerDelegateAssignmentsRepository.findById | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:78` |
| `delegated_access.support_grant_actions` | LEE | LEE | DIRECTA | PractitionerSupportController.accept → PractitionerSupportService.accept → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:165` |
| `delegated_access.support_scope_grants` | LEE | LEE | DIRECTA | PractitionerSupportController.accept → PractitionerSupportService.accept → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findGrantsWithActions | `src/modules/delegated_access/repositories/support-access.repository.ts:161` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PractitionerSupportController.accept → PractitionerSupportService.accept → PractitionerSupportService.loadOwn → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:117` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | PractitionerSupportController.accept → PractitionerSupportService.accept → EffectiveSupportAccessService.refreshTenant → EffectiveSupportAccessService.toExpandable → SupportAccessRepository.findCareSpaceIdsWithin | `src/modules/delegated_access/repositories/support-access.repository.ts:413` |
| `practice.practices` | LEE | LEE | DIRECTA | PractitionerSupportController.accept → PractitionerSupportService.accept → PractitionerSupportService.loadOwn → SupportAccessRepository.findRoleAssignments | `src/modules/delegated_access/repositories/support-access.repository.ts:230` |
| `practice.practitioner_location_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.accept → PractitionerSupportService.accept → EffectiveSupportAccessService.refreshTenant → SupportAccessRepository.findLocationPairs | `src/modules/delegated_access/repositories/support-access.repository.ts:467` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.accept → PractitionerSupportService.accept → PractitionerSupportService.loadOwn → SupportAccessRepository.findRoleAssignments | `src/modules/delegated_access/repositories/support-access.repository.ts:227` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AcceptSupportDelegateDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `acceptsSupportClause` | `boolean` | Sí | — | `@IsBoolean()` `@Equals(true)` | — | `src/modules/delegated_access/dto/practitioner-support.dto.ts:25` |
| `mayReplyOnBehalf` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/delegated_access/dto/practitioner-support.dto.ts:31` |
| `replyDisclosure` | `string` | No | valores: SHOW, HIDE | `@IsOptional()` `@IsIn(DISCLOSURES)` | — | `src/modules/delegated_access/dto/practitioner-support.dto.ts:37` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "acceptsSupportClause": true
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "acceptsSupportClause": true,
  "mayReplyOnBehalf": true,
  "replyDisclosure": "SHOW"
}
```

</details>

### Respuesta — `Promise<OperationResultDto>` · DTO `OperationResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | Indica éxito | `src/modules/delegated_access/dto/responses.dto.ts:110` |
| `status` | `string` | No | — | — | Nuevo estado del recurso (concept id) | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La cuenta no tiene perfil profesional: no tiene equipo de apoyo. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Delegación no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La delegación no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PractitionerSupportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 42. POST /practitioner-delegates/{id}/access-requests

- **Origen:** CONTRATO
- **Nombre:** Solicitar acceso delegado (aprobación previa)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerDelegatesController.requestAccess` — `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:68`

### Qué es y para qué sirve (negocio)

Solicitar acceso delegado (aprobación previa). Caso de uso UC-29-04: Solicitar acceso delegado (aprobación previa). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:231`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /practitioner-delegates/{id}/access-requests` la atiende `PractitionerDelegatesController.requestAccess` (src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:68). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateAccessRequestDto` (4 campos, 1 obligatorio). Delega en `AccessRequestsService.requestAccess`. Crea filas en delegated_access.delegated_access_approval_requests, delegated_access.delegation_events. Lee clinical.encounters, delegated_access.delegated_access_approval_requests, delegated_access.delegated_permission_sets, delegated_access.practitioner_delegate_assignments, profiles.patient_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:68` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:68` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | PractitionerDelegatesController.requestAccess → AccessRequestsService.requestAccess → DelegationScopeService.assertGrantTarget → DelegationScopeRepository.encounterScope | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:101` |
| `delegated_access.delegated_access_approval_requests` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.requestAccess → AccessRequestsService.requestAccess → AccessRequestsService.openRequest → DelegatedAccessApprovalRequestsRepository.create | `src/modules/delegated_access/repositories/delegated-access-approval-requests.repository.ts:107` |
| `delegated_access.delegated_access_approval_requests` | LEE | LEE | DIRECTA | PractitionerDelegatesController.requestAccess → AccessRequestsService.requestAccess → AccessRequestsService.openRequest → DelegatedAccessApprovalRequestsRepository.findOpenDuplicate | `src/modules/delegated_access/repositories/delegated-access-approval-requests.repository.ts:87` |
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | PractitionerDelegatesController.requestAccess → AccessRequestsService.requestAccess → DelegationScopeService.loadDelegationInTenant → DelegatedPermissionSetsRepository.findById | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:52` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.requestAccess → AccessRequestsService.requestAccess → AccessRequestsService.openRequest → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | PractitionerDelegatesController.requestAccess → AccessRequestsService.requestAccess → DelegationScopeService.loadDelegationInTenant → PractitionerDelegateAssignmentsRepository.findById | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:78` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | PractitionerDelegatesController.requestAccess → AccessRequestsService.requestAccess → DelegationScopeService.assertGrantTarget → DelegationScopeRepository.patientExists | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:121` |

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

## 43. POST /practitioner-delegates/{id}/grants

- **Origen:** CONTRATO
- **Nombre:** Otorgar grant delegado por-propósito y temporal
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerDelegatesController.issueGrant` — `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:86`

### Qué es y para qué sirve (negocio)

Otorgar grant delegado por-propósito y temporal. Caso de uso UC-29-06: Grant pre-autorizado por-propósito y temporal. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:233`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /practitioner-delegates/{id}/grants` la atiende `PractitionerDelegatesController.issueGrant` (src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:86). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateGrantDto` (6 campos, 2 obligatorios). Delega en `PractitionerDelegatesService.issueGrant`. Crea filas en delegated_access.delegated_access_grants, delegated_access.delegation_events. Lee clinical.encounters, delegated_access.delegated_permission_sets, delegated_access.practitioner_delegate_assignments, profiles.patient_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:86` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:86` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | PractitionerDelegatesController.issueGrant → PractitionerDelegatesService.issueGrant → DelegationScopeService.assertGrantTarget → DelegationScopeRepository.encounterScope | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:101` |
| `delegated_access.delegated_access_grants` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.issueGrant → PractitionerDelegatesService.issueGrant → DelegatedAccessGrantsRepository.create | `src/modules/delegated_access/repositories/delegated-access-grants.repository.ts:79` |
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | PractitionerDelegatesController.issueGrant → PractitionerDelegatesService.issueGrant → DelegationScopeService.loadDelegationInTenant → DelegatedPermissionSetsRepository.findById | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:52` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.issueGrant → PractitionerDelegatesService.issueGrant → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | PractitionerDelegatesController.issueGrant → PractitionerDelegatesService.issueGrant → DelegationScopeService.loadDelegationInTenant → PractitionerDelegateAssignmentsRepository.findById | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:78` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | PractitionerDelegatesController.issueGrant → PractitionerDelegatesService.issueGrant → DelegationScopeService.assertGrantTarget → DelegationScopeRepository.patientExists | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:121` |

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

## 44. PATCH /practitioner-delegates/{id}/reply-settings

- **Origen:** CONTRATO
- **Nombre:** Permitir o no responder en mi nombre
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSupportController.replySettings` — `src/modules/delegated_access/controllers/practitioner-support.controller.ts:131`

### Qué es y para qué sirve (negocio)

Permitir o no responder en mi nombre. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`PATCH /practitioner-delegates/{id}/reply-settings` la atiende `PractitionerSupportController.replySettings` (src/modules/delegated_access/controllers/practitioner-support.controller.ts:131). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `ReplySettingsDto` (2 campos, 0 obligatorios). Delega en `PractitionerSupportService.replySettings`. Actualiza delegated_access.practitioner_delegate_assignments. Lee delegated_access.organization_user_assignments, delegated_access.practitioner_delegate_assignments, directory.tenant_memberships, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:131` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/practitioner-support.controller.ts:131` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.replySettings → PractitionerSupportService.replySettings → PractitionerSupportService.loadOwn → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:113` |
| `delegated_access.practitioner_delegate_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerSupportController.replySettings → PractitionerSupportService.replySettings → PractitionerSupportService.applyReplySettings | `src/modules/delegated_access/services/practitioner-support.service.ts:315` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.replySettings → PractitionerSupportService.replySettings → PractitionerSupportService.loadOwn → PractitionerDelegateAssignmentsRepository.findById | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:78` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PractitionerSupportController.replySettings → PractitionerSupportService.replySettings → PractitionerSupportService.loadOwn → SupportAccessRepository.findEngagements | `src/modules/delegated_access/repositories/support-access.repository.ts:117` |
| `practice.practices` | LEE | LEE | DIRECTA | PractitionerSupportController.replySettings → PractitionerSupportService.replySettings → PractitionerSupportService.loadOwn → SupportAccessRepository.findRoleAssignments | `src/modules/delegated_access/repositories/support-access.repository.ts:230` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PractitionerSupportController.replySettings → PractitionerSupportService.replySettings → PractitionerSupportService.loadOwn → SupportAccessRepository.findRoleAssignments | `src/modules/delegated_access/repositories/support-access.repository.ts:227` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ReplySettingsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `mayReplyOnBehalf` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/delegated_access/dto/practitioner-support.dto.ts:46` |
| `replyDisclosure` | `string` | No | valores: SHOW, HIDE | `@IsOptional()` `@IsIn(DISCLOSURES)` | — | `src/modules/delegated_access/dto/practitioner-support.dto.ts:52` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "mayReplyOnBehalf": true,
  "replyDisclosure": "SHOW"
}
```

</details>

### Respuesta — `Promise<OperationResultDto>` · DTO `OperationResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | Indica éxito | `src/modules/delegated_access/dto/responses.dto.ts:110` |
| `status` | `string` | No | — | — | Nuevo estado del recurso (concept id) | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La cuenta no tiene perfil profesional: no tiene equipo de apoyo. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Delegación no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No hay cambios que aplicar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:PractitionerSupportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 45. POST /practitioner-delegates/{id}/revoke

- **Origen:** CONTRATO
- **Nombre:** Revocar delegación de forma inmediata (cascada authz)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerDelegatesController.revoke` — `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:104`

### Qué es y para qué sirve (negocio)

Revocar delegación de forma inmediata (cascada authz). Caso de uso UC-29-07: Revocar delegación inmediata (cascada). Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/delegated_access/README.md:234`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /practitioner-delegates/{id}/revoke` la atiende `PractitionerDelegatesController.revoke` (src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:104). Exige sesión con alguno de los roles SECURITY_ADMIN, PRACTITIONER, CLINICIAN. Valida el cuerpo como `RevokeDelegationDto` (1 campo, 0 obligatorios). Delega en `PractitionerDelegatesService.revoke`. Crea filas en delegated_access.delegation_events. Actualiza delegated_access.delegated_access_approval_requests, delegated_access.delegated_access_grants. Lee delegated_access.delegated_permission_sets, delegated_access.practitioner_delegate_assignments, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PRACTITIONER, CLINICIAN | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:104` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/delegated_access/controllers/practitioner-delegates.controller.ts:104` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.delegated_access_approval_requests` | ESCRIBE | ACTUALIZA | DIRECTA | PractitionerDelegatesController.revoke → PractitionerDelegatesService.revoke → DelegatedAccessApprovalRequestsRepository.cancelOpenByAssignment | `src/modules/delegated_access/repositories/delegated-access-approval-requests.repository.ts:131` |
| `delegated_access.delegated_access_grants` | ESCRIBE | ACTUALIZA | DIRECTA | PractitionerDelegatesController.revoke → PractitionerDelegatesService.revoke → DelegatedAccessGrantsRepository.revokeActiveByAssignment | `src/modules/delegated_access/repositories/delegated-access-grants.repository.ts:130` |
| `delegated_access.delegated_permission_sets` | LEE | LEE | DIRECTA | PractitionerDelegatesController.revoke → PractitionerDelegatesService.revoke → DelegationScopeService.loadDelegationInTenant → DelegatedPermissionSetsRepository.findById | `src/modules/delegated_access/repositories/delegated-permission-sets.repository.ts:52` |
| `delegated_access.delegation_events` | ESCRIBE | CREA | DIRECTA | PractitionerDelegatesController.revoke → PractitionerDelegatesService.revoke → DelegationEventsRepository.record | `src/modules/delegated_access/repositories/delegation-events.repository.ts:52` |
| `delegated_access.practitioner_delegate_assignments` | LEE | LEE | DIRECTA | PractitionerDelegatesController.revoke → PractitionerDelegatesService.revoke → DelegationScopeService.loadDelegationInTenant → PractitionerDelegateAssignmentsRepository.findById | `src/modules/delegated_access/repositories/practitioner-delegate-assignments.repository.ts:78` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PractitionerDelegatesController.revoke → PractitionerDelegatesService.revoke → DelegationScopeService.assertAdminOrOwningDoctor → DelegationScopeService.assertOwningDoctor → DelegationScopeRepository.roleAssignmentPractitioner | `src/modules/delegated_access/repositories/delegation-scope.repository.ts:84` |

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
| `ok` | `boolean` | Sí | — | — | Indica éxito | `src/modules/delegated_access/dto/responses.dto.ts:110` |
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

## 46. POST /support-engagement-requests

- **Origen:** CONTRATO
- **Nombre:** Pedir un vínculo de apoyo o su ampliación
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SupportEngagementRequestsController.create` — `src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:121`

### Qué es y para qué sirve (negocio)

Pedir un vínculo de apoyo o su ampliación. Dentro del módulo (descripción del modelo, en inglés): «Lets hospitals, offices, nursing facilities, diagnostic units and pharmacies associate additional users and lets doctors delegate limited work to secretaries, assistants, nurses or billing staff without sharing credentials.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_29_delegated_access.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /support-engagement-requests` la atiende `SupportEngagementRequestsController.create` (src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:121). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateEngagementRequestDto` (11 campos, 4 obligatorios). Delega en `EngagementRequestsService.create`. Crea filas en delegated_access.engagement_request_items, delegated_access.engagement_requests. Lee delegated_access.engagement_requests, delegated_access.organization_user_assignments, delegated_access.role_templates, directory.tenant_memberships, directory.tenants, practice.care_spaces, practice.healthcare_services, practice.practice_sites y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:121` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/delegated_access/controllers/support-engagement-requests.controller.ts:121` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.engagement_request_items` | ESCRIBE | CREA | DIRECTA | SupportEngagementRequestsController.create → EngagementRequestsService.create → EngagementRequestsRepository.createItem | `src/modules/delegated_access/repositories/engagement-requests.repository.ts:202` |
| `delegated_access.engagement_requests` | ESCRIBE | CREA | DIRECTA | SupportEngagementRequestsController.create → EngagementRequestsService.create → EngagementRequestsRepository.create | `src/modules/delegated_access/repositories/engagement-requests.repository.ts:173` |
| `delegated_access.engagement_requests` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.create → EngagementRequestsService.create → EngagementRequestsRepository.findByRequester | `src/modules/delegated_access/repositories/engagement-requests.repository.ts:132` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.create → EngagementRequestsService.create → EngagementRequestsService.loadOwnEngagements → SupportEngagementsRepository.findByIds | `src/modules/delegated_access/repositories/support-engagements.repository.ts:93` |
| `delegated_access.role_templates` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.create → EngagementRequestsService.create → RoleTemplatesRepository.findEffectiveByCode | `src/modules/delegated_access/repositories/role-templates.repository.ts:55` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.create → EngagementRequestsService.create → EngagementRequestsService.loadOwnEngagements → SupportDirectoryRepository.findMembership | `src/modules/delegated_access/repositories/support-directory.repository.ts:57` |
| `directory.tenants` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.create → EngagementRequestsService.create → SupportDirectoryRepository.findTenant | `src/modules/delegated_access/repositories/support-directory.repository.ts:38` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.create → EngagementRequestsService.create → SupportTargetsService.assertTarget → SupportAccessRepository.findCareSpaces | `src/modules/delegated_access/repositories/support-access.repository.ts:302` |
| `practice.healthcare_services` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.create → EngagementRequestsService.create → SupportTargetsService.assertTarget → SupportAccessRepository.findServices | `src/modules/delegated_access/repositories/support-access.repository.ts:362` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.create → EngagementRequestsService.create → SupportTargetsService.assertTarget → SupportAccessRepository.tenantsOfSites | `src/modules/delegated_access/repositories/support-access.repository.ts:335` |
| `practice.practices` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.create → EngagementRequestsService.create → SupportTargetsService.assertTarget → SupportAccessRepository.findRoleAssignments | `src/modules/delegated_access/repositories/support-access.repository.ts:230` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | SupportEngagementRequestsController.create → EngagementRequestsService.create → SupportTargetsService.assertTarget → SupportAccessRepository.findRoleAssignments | `src/modules/delegated_access/repositories/support-access.repository.ts:227` |

### Cuerpo — DTO `CreateEngagementRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/delegated_access/dto/engagement-requests.dto.ts:47` |
| `roleTemplateCode` | `string` | Sí | valores: SECRETARY, MEDICAL_ASSISTANT, NURSING, FRONT_DESK, BILLING_CASHIER, CALL_CENTER, ORG_MANAGEMENT | `@IsIn(SUPPORT_TEMPLATE_CODES)` | — | `src/modules/delegated_access/dto/engagement-requests.dto.ts:52` |
| `parentAssignmentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/engagement-requests.dto.ts:58` |
| `message` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | — | `src/modules/delegated_access/dto/engagement-requests.dto.ts:65` |
| `items` | `array<SupportTargetWithActionsDto>` | Sí | mínimo 1 elemento(s); máximo 50 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(50)` `@ValidateNested({ each: true })` `@Type(() => SupportTargetWithActionsDto)` | — | `src/modules/delegated_access/dto/engagement-requests.dto.ts:74` |
| `items[].targetKind` | `string` | Sí | valores: PRACTITIONER, SERVICE, LOCATION, PRACTITIONER_SERVICE, PRACTITIONER_LOCATION, SERVICE_LOCATION, ALL_PRACTITIONERS, ALL_SERVICES, ALL_LOCATIONS, ALL | `@IsIn(SUPPORT_TARGET_KINDS)` | — | `src/modules/delegated_access/dto/support-target.dto.ts:26` |
| `items[].practitionerRoleAssignmentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/support-target.dto.ts:32` |
| `items[].healthcareServiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/support-target.dto.ts:38` |
| `items[].careSpaceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/support-target.dto.ts:44` |
| `items[].practiceSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/delegated_access/dto/support-target.dto.ts:50` |
| `items[].actions` | `array<string>` | No | mínimo 1 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMinSize(1)` `@ArrayUnique()` `@IsIn(SUPPORT_ACTIONS, { each: true })` | — | `src/modules/delegated_access/dto/support-target.dto.ts:62` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "roleTemplateCode": "SECRETARY",
  "items": [
    {
      "targetKind": "PRACTITIONER"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "roleTemplateCode": "SECRETARY",
  "parentAssignmentId": "00000000-0000-4000-8000-000000000001",
  "message": "valor-ejemplo",
  "items": [
    {
      "targetKind": "PRACTITIONER",
      "practitionerRoleAssignmentId": "00000000-0000-4000-8000-000000000001",
      "healthcareServiceId": "00000000-0000-4000-8000-000000000001",
      "careSpaceId": "00000000-0000-4000-8000-000000000001",
      "practiceSiteId": "00000000-0000-4000-8000-000000000001",
      "actions": [
        "schedule.view"
      ]
    }
  ]
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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla de rol no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ya tiene solicitudes abiertas en esa organización: espere su decisión; PreconditionFailedException: Solo se amplía un vínculo propio y activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.BAD_REQUEST} |

El árbol de decisión completo está en [flujos](../flujos/delegated_access.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 29 — Delegated Access and Scoped Infrastructure Users — etapa `ctrl:SupportEngagementRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

