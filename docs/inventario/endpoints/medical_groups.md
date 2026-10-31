<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `medical_groups`

- **Bloque:** —
- **Operaciones:** 9 (9 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 6 · BAJO 3
- **Tablas distintas que tocan:** 27
- **Respuestas de error y detalle contractual:** `openapi/endpoints/medical-groups.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/medical-groups` | Listar grupos médicos (histórico/enviadas/recibidas) | BAJO | 5 | PRACTITIONER, CLINICIAN |
| 2 | POST | `/medical-groups` | Crear grupo médico | MEDIO | 27 | PRACTITIONER, CLINICIAN |
| 3 | GET | `/medical-groups/{id}` | Consultar un grupo médico (formulario de sólo lectura) | MEDIO | 6 | PRACTITIONER, CLINICIAN |
| 4 | PATCH | `/medical-groups/{id}/exercise-notes` | Subir/corregir las notas del procedimiento (NOTAS DEL EJERCICIO) | MEDIO | 6 | PRACTITIONER, CLINICIAN |
| 5 | POST | `/medical-groups/{id}/members/{memberId}/respond` | Aceptar o rechazar la invitación a un cargo del grupo | MEDIO | 7 | PRACTITIONER, CLINICIAN |
| 6 | POST | `/medical-groups/{id}/reschedule-requests` | Solicitar cambio de horario | MEDIO | 6 | PRACTITIONER, CLINICIAN |
| 7 | POST | `/medical-groups/{id}/reschedule-requests/respond` | Resolver la solicitud de cambio de horario | MEDIO | 6 | PRACTITIONER, CLINICIAN |
| 8 | GET | `/medical-groups/eligible-members` | Colegas que se pueden invitar a un grupo de este servicio | BAJO | 5 | PRACTITIONER, CLINICIAN |
| 9 | GET | `/medical-groups/patients/{patientProfileId}/conditions` | Diagnósticos del paciente para el selector del formulario | BAJO | 20 | PRACTITIONER, CLINICIAN |

---

## 1. GET /medical-groups

- **Origen:** CONTRATO
- **Nombre:** Listar grupos médicos (histórico/enviadas/recibidas)
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MedicalGroupsController.list` — `src/modules/medical_groups/controllers/medical-groups.controller.ts:56`

### Qué es y para qué sirve (negocio)

Listar grupos médicos (histórico/enviadas/recibidas).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /medical-groups` la atiende `MedicalGroupsController.list` (src/modules/medical_groups/controllers/medical-groups.controller.ts:56). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `MedicalGroupsService.list`. Lee billing.service_catalog, medical_groups.group_members, medical_groups.groups, profiles.person_profiles, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/medical_groups/controllers/medical-groups.controller.ts:56` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | MedicalGroupsController.list → MedicalGroupsService.list → MedicalGroupsService.namesFor | `src/modules/medical_groups/services/medical-groups.service.ts:799` |
| `medical_groups.group_members` | LEE | LEE | DIRECTA | MedicalGroupsController.list → MedicalGroupsService.list → MedicalGroupMembersRepository.findManyByGroups | `src/modules/medical_groups/repositories/medical-group-members.repository.ts:48` |
| `medical_groups.groups` | LEE | LEE | DIRECTA | MedicalGroupsController.list → MedicalGroupsService.list → MedicalGroupsRepository.findByIdsPage | `src/modules/medical_groups/repositories/medical-groups.repository.ts:70` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | MedicalGroupsController.list → MedicalGroupsService.list → MedicalGroupsService.namesFor | `src/modules/medical_groups/services/medical-groups.service.ts:814` |
| `profiles.persons` | LEE | LEE | DIRECTA | MedicalGroupsController.list → MedicalGroupsService.list → MedicalGroupsService.namesFor | `src/modules/medical_groups/services/medical-groups.service.ts:808` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tab` | query | No | `string` | — |
| `cursor` | query | No | `string` | — |
| `limit` | query | No | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MedicalGroupPageDto>` · DTO `MedicalGroupPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<MedicalGroupListItemDto>` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:299` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:263` |
| `items[].serviceCatalogId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:266` |
| `items[].serviceName` | `string` | Sí | admite null | — | Nombre del servicio del catálogo; null si ya no existe | `src/modules/medical_groups/dto/medical-groups.dto.ts:273` |
| `items[].scheduledAt` | `string` | Sí | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:276` |
| `items[].locationText` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:279` |
| `items[].status` | `string` | Sí | valores: PENDING_TEAM, SCHEDULED, RESCHEDULE_PENDING, CLOSED | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:284` |
| `items[].isCreator` | `boolean` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:287` |
| `items[].patientProfileId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:290` |
| `items[].pendingMembersCount` | `number` | Sí | — | — | Cuántos cargos siguen sin responder (útil en enviadas/recibidas). | `src/modules/medical_groups/dto/medical-groups.dto.ts:294` |
| `nextCursor` | `string` | No | admite null | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:302` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: La cuenta no tiene un perfil profesional asociado |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/medical_groups.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/hardening/mch-012.int-spec.ts:58` |

### Flujos

- Módulo Medical Groups — Grupos médicos (FT-21) — etapa `ctrl:MedicalGroupsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /medical-groups

- **Origen:** CONTRATO
- **Nombre:** Crear grupo médico
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MedicalGroupsController.create` — `src/modules/medical_groups/controllers/medical-groups.controller.ts:119`

### Qué es y para qué sirve (negocio)

Crear grupo médico.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /medical-groups` la atiende `MedicalGroupsController.create` (src/modules/medical_groups/controllers/medical-groups.controller.ts:119). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `CreateMedicalGroupDto` (13 campos, 7 obligatorios). Delega en `MedicalGroupsService.create`. Crea filas en medical_groups.group_members, medical_groups.groups. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 17 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/medical_groups/controllers/medical-groups.controller.ts:119` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → MedicalGroupsService.assertCanReadPatientHistory → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → MedicalGroupsService.assertCanReadPatientHistory → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → MedicalGroupsService.assertCanReadPatientHistory → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → MedicalGroupsService.assertCanReadPatientHistory → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → MedicalGroupsService.assertCanReadPatientHistory → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → MedicalGroupsService.assertCanReadPatientHistory → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → MedicalGroupsService.assertCanReadPatientHistory → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → MedicalGroupsService.assertCanReadPatientHistory → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → MedicalGroupsService.assertCanReadPatientHistory → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → MedicalGroupsService.assertCanReadPatientHistory → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → MedicalGroupsService.assertCanReadPatientHistory → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `billing.service_catalog` | LEE | LEE | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → ServiceCatalogRepository.findById | `src/modules/billing/repositories/service-catalog.repository.ts:89` |
| `clinical.conditions` | LEE | LEE | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → ConditionsRepository.findById | `src/modules/clinical/repositories/conditions.repository.ts:107` |
| `medical_groups.group_members` | ESCRIBE | CREA | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → MedicalGroupMembersRepository.create | `src/modules/medical_groups/repositories/medical-group-members.repository.ts:103` |
| `medical_groups.group_members` | LEE | LEE | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → MedicalGroupMembersRepository.findByGroup | `src/modules/medical_groups/repositories/medical-group-members.repository.ts:34` |
| `medical_groups.groups` | ESCRIBE | CREA | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → MedicalGroupsRepository.create | `src/modules/medical_groups/repositories/medical-groups.repository.ts:30` |
| `practice.practices` | LEE | LEE | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → MedicalGroupsService.assertCanReadPatientHistory → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → MedicalGroupsService.assertCanReadPatientHistory → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → MedicalGroupsService.toDto → MedicalGroupsService.namesFor | `src/modules/medical_groups/services/medical-groups.service.ts:814` |
| `profiles.persons` | LEE | LEE | DIRECTA | MedicalGroupsController.create → MedicalGroupsService.create → MedicalGroupsService.toDto → MedicalGroupsService.namesFor | `src/modules/medical_groups/services/medical-groups.service.ts:808` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | MedicalGroupsController.create → MedicalGroupsService.create → MedicalGroupsService.assertCanReadPatientHistory → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:992` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | MedicalGroupsController.create → MedicalGroupsService.create → MedicalGroupsService.assertCanReadPatientHistory → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1018` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | MedicalGroupsController.create → MedicalGroupsService.create → MedicalGroupsService.assertCanReadPatientHistory → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:992` |

### Cuerpo — DTO `CreateMedicalGroupDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `serviceCatalogId` | `string` | Sí | formato uuid | `@IsUUID()` | billing.service_catalog | `src/modules/medical_groups/dto/medical-groups.dto.ts:62` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | profiles.patient_profiles | `src/modules/medical_groups/dto/medical-groups.dto.ts:70` |
| `conditionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | clinical.conditions | `src/modules/medical_groups/dto/medical-groups.dto.ts:75` |
| `scheduledAt` | `string` | Sí | formato date-time | `@IsDateString()` | Fecha y hora de realización, ISO 8601 | `src/modules/medical_groups/dto/medical-groups.dto.ts:79` |
| `locationText` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | Lugar de realización | `src/modules/medical_groups/dto/medical-groups.dto.ts:84` |
| `notesText` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:90` |
| `additionalTermsText` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | Adicionales de términos y condiciones del solicitante, sobre el default del servicio | `src/modules/medical_groups/dto/medical-groups.dto.ts:99` |
| `members` | `array<MedicalGroupMemberInputDto>` | Sí | mínimo 0 elemento(s) | `@IsArray()` `@ArrayMinSize(0)` `@ValidateNested({ each: true })` `@Type(() => MedicalGroupMemberInputDto)` | El resto del equipo (cargo/función + pago). El creador se agrega solo como miembro aceptado. | `src/modules/medical_groups/dto/medical-groups.dto.ts:110` |
| `members[].practitionerProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Profesional invitado a este cargo | `src/modules/medical_groups/dto/medical-groups.dto.ts:29` |
| `members[].roleTitle` | `string` | Sí | longitud máxima 120 | `@IsString()` `@MaxLength(120)` | Cargo/función dentro del grupo (p. ej. "Anestesiólogo") | `src/modules/medical_groups/dto/medical-groups.dto.ts:36` |
| `members[].agreedPaymentAmount` | `string` | Sí | patrón runtime PRICE_PATTERN | `@IsNumberString()` `@Matches(PRICE_PATTERN, { message: PRICE_PATTERN_MESSAGE })` | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:41` |
| `members[].agreedPaymentCurrencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:46` |
| `members[].additionalTermsText` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | Adicionales de términos y condiciones opcionales para este cargo | `src/modules/medical_groups/dto/medical-groups.dto.ts:55` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "scheduledAt": "2026-07-31T12:00:00.000Z",
  "locationText": "valor-ejemplo",
  "members": [
    {
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "roleTitle": "valor-ejemplo",
      "agreedPaymentAmount": "500.00"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "conditionId": "00000000-0000-4000-8000-000000000001",
  "scheduledAt": "2026-07-31T12:00:00.000Z",
  "locationText": "valor-ejemplo",
  "notesText": "Texto descriptivo de ejemplo",
  "additionalTermsText": "valor-ejemplo",
  "members": [
    {
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "roleTitle": "valor-ejemplo",
      "agreedPaymentAmount": "500.00",
      "agreedPaymentCurrencyConceptId": "00000000-0000-4000-8000-000000000001",
      "additionalTermsText": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<MedicalGroupDto>` · DTO `MedicalGroupDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:183` |
| `serviceCatalogId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:186` |
| `serviceName` | `string` | Sí | admite null | — | Nombre del servicio del catálogo; null si ya no existe | `src/modules/medical_groups/dto/medical-groups.dto.ts:193` |
| `requestingPractitionerId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:196` |
| `patientProfileId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:199` |
| `patientName` | `string` | Sí | admite null | — | Nombre del paciente asociado; null si no hay paciente o no tiene nombre | `src/modules/medical_groups/dto/medical-groups.dto.ts:207` |
| `conditionId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:210` |
| `scheduledAt` | `string` | Sí | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:213` |
| `locationText` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:216` |
| `notesText` | `string` | No | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:219` |
| `termsText` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:222` |
| `status` | `string` | Sí | valores: PENDING_TEAM, SCHEDULED, RESCHEDULE_PENDING, CLOSED | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:227` |
| `exerciseNotesText` | `string` | No | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:230` |
| `exerciseNotesUpdatedAt` | `string` | No | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:233` |
| `proposedRescheduleAt` | `string` | No | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:236` |
| `proposedByPractitionerId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:239` |
| `isRealized` | `boolean` | Sí | — | — | Derivado en el servidor: ya pasó la fecha de realización. | `src/modules/medical_groups/dto/medical-groups.dto.ts:243` |
| `canEditExerciseNotes` | `boolean` | Sí | — | — | Derivado: todavía se pueden subir notas del procedimiento. | `src/modules/medical_groups/dto/medical-groups.dto.ts:247` |
| `isClosed` | `boolean` | Sí | — | — | Derivado: pasó la ventana de una semana — expediente inmutable (AC-21-19). | `src/modules/medical_groups/dto/medical-groups.dto.ts:251` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:254` |
| `members` | `array<MedicalGroupMemberDto>` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:257` |
| `members[].id` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:145` |
| `members[].practitionerProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:148` |
| `members[].practitionerName` | `string` | Sí | admite null | — | Nombre del profesional; null si su persona no tiene nombre cargado | `src/modules/medical_groups/dto/medical-groups.dto.ts:156` |
| `members[].roleTitle` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:159` |
| `members[].agreedPaymentAmount` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:162` |
| `members[].agreedPaymentCurrencyConceptId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:165` |
| `members[].additionalTermsText` | `string` | No | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:168` |
| `members[].isCreator` | `boolean` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:171` |
| `members[].invitationStatus` | `string` | Sí | valores: PENDING, ACCEPTED, REJECTED | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:174` |
| `members[].respondedAt` | `string` | No | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:177` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: La cuenta no tiene un perfil profesional asociado |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Servicio médico no encontrado; ResourceNotFoundException: Diagnóstico no encontrado |
| 409 | `CONFLICT` | ConflictException: Un mismo profesional no puede repetirse (ni ser también el creador) |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Seleccione primero el paciente para poder elegir un diagnóstico |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/medical_groups.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/hardening/mch-012.int-spec.ts:102` |

### Flujos

- Módulo Medical Groups — Grupos médicos (FT-21) — etapa `ctrl:MedicalGroupsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. GET /medical-groups/{id}

- **Origen:** CONTRATO
- **Nombre:** Consultar un grupo médico (formulario de sólo lectura)
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MedicalGroupsController.findOne` — `src/modules/medical_groups/controllers/medical-groups.controller.ts:107`

### Qué es y para qué sirve (negocio)

Consultar un grupo médico (formulario de sólo lectura).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /medical-groups/{id}` la atiende `MedicalGroupsController.findOne` (src/modules/medical_groups/controllers/medical-groups.controller.ts:107). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `MedicalGroupsService.findOne`. Actualiza medical_groups.groups. Lee billing.service_catalog, medical_groups.group_members, medical_groups.groups, profiles.person_profiles, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/medical_groups/controllers/medical-groups.controller.ts:107` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/medical_groups/controllers/medical-groups.controller.ts:107` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | MedicalGroupsController.findOne → MedicalGroupsService.findOne → MedicalGroupsService.toDto → MedicalGroupsService.namesFor | `src/modules/medical_groups/services/medical-groups.service.ts:799` |
| `medical_groups.group_members` | LEE | LEE | DIRECTA | MedicalGroupsController.findOne → MedicalGroupsService.findOne → MedicalGroupMembersRepository.findByGroup | `src/modules/medical_groups/repositories/medical-group-members.repository.ts:34` |
| `medical_groups.groups` | ESCRIBE | ACTUALIZA | POR_TIPO | MedicalGroupsController.findOne → MedicalGroupsService.findOne → MedicalGroupsService.closeIfExpired | `src/modules/medical_groups/services/medical-groups.service.ts:767` |
| `medical_groups.groups` | LEE | LEE | DIRECTA | MedicalGroupsController.findOne → MedicalGroupsService.findOne → MedicalGroupsRepository.findById | `src/modules/medical_groups/repositories/medical-groups.repository.ts:26` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | MedicalGroupsController.findOne → MedicalGroupsService.findOne → MedicalGroupsService.toDto → MedicalGroupsService.namesFor | `src/modules/medical_groups/services/medical-groups.service.ts:814` |
| `profiles.persons` | LEE | LEE | DIRECTA | MedicalGroupsController.findOne → MedicalGroupsService.findOne → MedicalGroupsService.toDto → MedicalGroupsService.namesFor | `src/modules/medical_groups/services/medical-groups.service.ts:808` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MedicalGroupDto>` · DTO `MedicalGroupDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:183` |
| `serviceCatalogId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:186` |
| `serviceName` | `string` | Sí | admite null | — | Nombre del servicio del catálogo; null si ya no existe | `src/modules/medical_groups/dto/medical-groups.dto.ts:193` |
| `requestingPractitionerId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:196` |
| `patientProfileId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:199` |
| `patientName` | `string` | Sí | admite null | — | Nombre del paciente asociado; null si no hay paciente o no tiene nombre | `src/modules/medical_groups/dto/medical-groups.dto.ts:207` |
| `conditionId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:210` |
| `scheduledAt` | `string` | Sí | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:213` |
| `locationText` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:216` |
| `notesText` | `string` | No | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:219` |
| `termsText` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:222` |
| `status` | `string` | Sí | valores: PENDING_TEAM, SCHEDULED, RESCHEDULE_PENDING, CLOSED | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:227` |
| `exerciseNotesText` | `string` | No | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:230` |
| `exerciseNotesUpdatedAt` | `string` | No | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:233` |
| `proposedRescheduleAt` | `string` | No | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:236` |
| `proposedByPractitionerId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:239` |
| `isRealized` | `boolean` | Sí | — | — | Derivado en el servidor: ya pasó la fecha de realización. | `src/modules/medical_groups/dto/medical-groups.dto.ts:243` |
| `canEditExerciseNotes` | `boolean` | Sí | — | — | Derivado: todavía se pueden subir notas del procedimiento. | `src/modules/medical_groups/dto/medical-groups.dto.ts:247` |
| `isClosed` | `boolean` | Sí | — | — | Derivado: pasó la ventana de una semana — expediente inmutable (AC-21-19). | `src/modules/medical_groups/dto/medical-groups.dto.ts:251` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:254` |
| `members` | `array<MedicalGroupMemberDto>` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:257` |
| `members[].id` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:145` |
| `members[].practitionerProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:148` |
| `members[].practitionerName` | `string` | Sí | admite null | — | Nombre del profesional; null si su persona no tiene nombre cargado | `src/modules/medical_groups/dto/medical-groups.dto.ts:156` |
| `members[].roleTitle` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:159` |
| `members[].agreedPaymentAmount` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:162` |
| `members[].agreedPaymentCurrencyConceptId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:165` |
| `members[].additionalTermsText` | `string` | No | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:168` |
| `members[].isCreator` | `boolean` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:171` |
| `members[].invitationStatus` | `string` | Sí | valores: PENDING, ACCEPTED, REJECTED | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:174` |
| `members[].respondedAt` | `string` | No | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:177` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo médico no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/medical_groups.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Medical Groups — Grupos médicos (FT-21) — etapa `ctrl:MedicalGroupsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. PATCH /medical-groups/{id}/exercise-notes

- **Origen:** CONTRATO
- **Nombre:** Subir/corregir las notas del procedimiento (NOTAS DEL EJERCICIO)
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MedicalGroupsController.updateExerciseNotes` — `src/modules/medical_groups/controllers/medical-groups.controller.ts:186`

### Qué es y para qué sirve (negocio)

Subir/corregir las notas del procedimiento (NOTAS DEL EJERCICIO).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`PATCH /medical-groups/{id}/exercise-notes` la atiende `MedicalGroupsController.updateExerciseNotes` (src/modules/medical_groups/controllers/medical-groups.controller.ts:186). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `UpdateMedicalGroupExerciseNotesDto` (1 campo, 1 obligatorio). Delega en `MedicalGroupsService.updateExerciseNotes`. Actualiza medical_groups.groups. Lee billing.service_catalog, medical_groups.group_members, medical_groups.groups, profiles.person_profiles, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/medical_groups/controllers/medical-groups.controller.ts:186` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/medical_groups/controllers/medical-groups.controller.ts:186` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | MedicalGroupsController.updateExerciseNotes → MedicalGroupsService.updateExerciseNotes → MedicalGroupsService.toDto → MedicalGroupsService.namesFor | `src/modules/medical_groups/services/medical-groups.service.ts:799` |
| `medical_groups.group_members` | LEE | LEE | DIRECTA | MedicalGroupsController.updateExerciseNotes → MedicalGroupsService.updateExerciseNotes → MedicalGroupMembersRepository.findByGroup | `src/modules/medical_groups/repositories/medical-group-members.repository.ts:34` |
| `medical_groups.groups` | ESCRIBE | ACTUALIZA | POR_TIPO | MedicalGroupsController.updateExerciseNotes → MedicalGroupsService.updateExerciseNotes | `src/modules/medical_groups/services/medical-groups.service.ts:660` |
| `medical_groups.groups` | LEE | LEE | DIRECTA | MedicalGroupsController.updateExerciseNotes → MedicalGroupsService.updateExerciseNotes → MedicalGroupsRepository.findById | `src/modules/medical_groups/repositories/medical-groups.repository.ts:26` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | MedicalGroupsController.updateExerciseNotes → MedicalGroupsService.updateExerciseNotes → MedicalGroupsService.toDto → MedicalGroupsService.namesFor | `src/modules/medical_groups/services/medical-groups.service.ts:814` |
| `profiles.persons` | LEE | LEE | DIRECTA | MedicalGroupsController.updateExerciseNotes → MedicalGroupsService.updateExerciseNotes → MedicalGroupsService.toDto → MedicalGroupsService.namesFor | `src/modules/medical_groups/services/medical-groups.service.ts:808` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateMedicalGroupExerciseNotesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `notesText` | `string` | Sí | longitud máxima 8000 | `@IsString()` `@MaxLength(8000)` | Notas del procedimiento ya realizado | `src/modules/medical_groups/dto/medical-groups.dto.ts:139` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "notesText": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "notesText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<MedicalGroupDto>` · DTO `MedicalGroupDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:183` |
| `serviceCatalogId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:186` |
| `serviceName` | `string` | Sí | admite null | — | Nombre del servicio del catálogo; null si ya no existe | `src/modules/medical_groups/dto/medical-groups.dto.ts:193` |
| `requestingPractitionerId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:196` |
| `patientProfileId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:199` |
| `patientName` | `string` | Sí | admite null | — | Nombre del paciente asociado; null si no hay paciente o no tiene nombre | `src/modules/medical_groups/dto/medical-groups.dto.ts:207` |
| `conditionId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:210` |
| `scheduledAt` | `string` | Sí | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:213` |
| `locationText` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:216` |
| `notesText` | `string` | No | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:219` |
| `termsText` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:222` |
| `status` | `string` | Sí | valores: PENDING_TEAM, SCHEDULED, RESCHEDULE_PENDING, CLOSED | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:227` |
| `exerciseNotesText` | `string` | No | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:230` |
| `exerciseNotesUpdatedAt` | `string` | No | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:233` |
| `proposedRescheduleAt` | `string` | No | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:236` |
| `proposedByPractitionerId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:239` |
| `isRealized` | `boolean` | Sí | — | — | Derivado en el servidor: ya pasó la fecha de realización. | `src/modules/medical_groups/dto/medical-groups.dto.ts:243` |
| `canEditExerciseNotes` | `boolean` | Sí | — | — | Derivado: todavía se pueden subir notas del procedimiento. | `src/modules/medical_groups/dto/medical-groups.dto.ts:247` |
| `isClosed` | `boolean` | Sí | — | — | Derivado: pasó la ventana de una semana — expediente inmutable (AC-21-19). | `src/modules/medical_groups/dto/medical-groups.dto.ts:251` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:254` |
| `members` | `array<MedicalGroupMemberDto>` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:257` |
| `members[].id` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:145` |
| `members[].practitionerProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:148` |
| `members[].practitionerName` | `string` | Sí | admite null | — | Nombre del profesional; null si su persona no tiene nombre cargado | `src/modules/medical_groups/dto/medical-groups.dto.ts:156` |
| `members[].roleTitle` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:159` |
| `members[].agreedPaymentAmount` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:162` |
| `members[].agreedPaymentCurrencyConceptId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:165` |
| `members[].additionalTermsText` | `string` | No | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:168` |
| `members[].isCreator` | `boolean` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:171` |
| `members[].invitationStatus` | `string` | Sí | valores: PENDING, ACCEPTED, REJECTED | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:174` |
| `members[].respondedAt` | `string` | No | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:177` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: La cuenta no tiene un perfil profesional asociado |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo médico no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El expediente ya está cerrado y es inmutable; PreconditionFailedException: Todavía no se realizó la cita: las notas del procedimiento se cargan después |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/medical_groups.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Medical Groups — Grupos médicos (FT-21) — etapa `ctrl:MedicalGroupsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /medical-groups/{id}/members/{memberId}/respond

- **Origen:** CONTRATO
- **Nombre:** Aceptar o rechazar la invitación a un cargo del grupo
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MedicalGroupsController.respondToInvitation` — `src/modules/medical_groups/controllers/medical-groups.controller.ts:135`

### Qué es y para qué sirve (negocio)

Aceptar o rechazar la invitación a un cargo del grupo.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /medical-groups/{id}/members/{memberId}/respond` la atiende `MedicalGroupsController.respondToInvitation` (src/modules/medical_groups/controllers/medical-groups.controller.ts:135). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `RespondMedicalGroupInvitationDto` (1 campo, 1 obligatorio). Delega en `MedicalGroupsService.respondToInvitation`. Actualiza medical_groups.group_members, medical_groups.groups. Lee billing.service_catalog, medical_groups.group_members, medical_groups.groups, profiles.person_profiles, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/medical_groups/controllers/medical-groups.controller.ts:135` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, memberId | `src/modules/medical_groups/controllers/medical-groups.controller.ts:135` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | MedicalGroupsController.respondToInvitation → MedicalGroupsService.respondToInvitation → MedicalGroupsService.toDto → MedicalGroupsService.namesFor | `src/modules/medical_groups/services/medical-groups.service.ts:799` |
| `medical_groups.group_members` | ESCRIBE | ACTUALIZA | POR_TIPO | MedicalGroupsController.respondToInvitation → MedicalGroupsService.respondToInvitation | `src/modules/medical_groups/services/medical-groups.service.ts:510` |
| `medical_groups.group_members` | LEE | LEE | DIRECTA | MedicalGroupsController.respondToInvitation → MedicalGroupsService.respondToInvitation → MedicalGroupMembersRepository.findById | `src/modules/medical_groups/repositories/medical-group-members.repository.ts:27` |
| `medical_groups.groups` | ESCRIBE | ACTUALIZA | POR_TIPO | MedicalGroupsController.respondToInvitation → MedicalGroupsService.respondToInvitation | `src/modules/medical_groups/services/medical-groups.service.ts:527` |
| `medical_groups.groups` | LEE | LEE | DIRECTA | MedicalGroupsController.respondToInvitation → MedicalGroupsService.respondToInvitation → MedicalGroupsRepository.findById | `src/modules/medical_groups/repositories/medical-groups.repository.ts:26` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | MedicalGroupsController.respondToInvitation → MedicalGroupsService.respondToInvitation → MedicalGroupsService.toDto → MedicalGroupsService.namesFor | `src/modules/medical_groups/services/medical-groups.service.ts:814` |
| `profiles.persons` | LEE | LEE | DIRECTA | MedicalGroupsController.respondToInvitation → MedicalGroupsService.respondToInvitation → MedicalGroupsService.toDto → MedicalGroupsService.namesFor | `src/modules/medical_groups/services/medical-groups.service.ts:808` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `memberId` | path | Sí | `string` | — |

### Cuerpo — DTO `RespondMedicalGroupInvitationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: ACCEPTED, REJECTED | `@IsIn(['ACCEPTED', 'REJECTED'])` | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:131` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decision": "ACCEPTED"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "ACCEPTED"
}
```

</details>

### Respuesta — `Promise<MedicalGroupDto>` · DTO `MedicalGroupDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:183` |
| `serviceCatalogId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:186` |
| `serviceName` | `string` | Sí | admite null | — | Nombre del servicio del catálogo; null si ya no existe | `src/modules/medical_groups/dto/medical-groups.dto.ts:193` |
| `requestingPractitionerId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:196` |
| `patientProfileId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:199` |
| `patientName` | `string` | Sí | admite null | — | Nombre del paciente asociado; null si no hay paciente o no tiene nombre | `src/modules/medical_groups/dto/medical-groups.dto.ts:207` |
| `conditionId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:210` |
| `scheduledAt` | `string` | Sí | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:213` |
| `locationText` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:216` |
| `notesText` | `string` | No | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:219` |
| `termsText` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:222` |
| `status` | `string` | Sí | valores: PENDING_TEAM, SCHEDULED, RESCHEDULE_PENDING, CLOSED | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:227` |
| `exerciseNotesText` | `string` | No | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:230` |
| `exerciseNotesUpdatedAt` | `string` | No | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:233` |
| `proposedRescheduleAt` | `string` | No | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:236` |
| `proposedByPractitionerId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:239` |
| `isRealized` | `boolean` | Sí | — | — | Derivado en el servidor: ya pasó la fecha de realización. | `src/modules/medical_groups/dto/medical-groups.dto.ts:243` |
| `canEditExerciseNotes` | `boolean` | Sí | — | — | Derivado: todavía se pueden subir notas del procedimiento. | `src/modules/medical_groups/dto/medical-groups.dto.ts:247` |
| `isClosed` | `boolean` | Sí | — | — | Derivado: pasó la ventana de una semana — expediente inmutable (AC-21-19). | `src/modules/medical_groups/dto/medical-groups.dto.ts:251` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:254` |
| `members` | `array<MedicalGroupMemberDto>` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:257` |
| `members[].id` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:145` |
| `members[].practitionerProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:148` |
| `members[].practitionerName` | `string` | Sí | admite null | — | Nombre del profesional; null si su persona no tiene nombre cargado | `src/modules/medical_groups/dto/medical-groups.dto.ts:156` |
| `members[].roleTitle` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:159` |
| `members[].agreedPaymentAmount` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:162` |
| `members[].agreedPaymentCurrencyConceptId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:165` |
| `members[].additionalTermsText` | `string` | No | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:168` |
| `members[].isCreator` | `boolean` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:171` |
| `members[].invitationStatus` | `string` | Sí | valores: PENDING, ACCEPTED, REJECTED | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:174` |
| `members[].respondedAt` | `string` | No | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:177` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: La cuenta no tiene un perfil profesional asociado |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo médico no encontrado; ResourceNotFoundException: Solicitud no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Esta solicitud ya fue respondida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/medical_groups.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Medical Groups — Grupos médicos (FT-21) — etapa `ctrl:MedicalGroupsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /medical-groups/{id}/reschedule-requests

- **Origen:** CONTRATO
- **Nombre:** Solicitar cambio de horario
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MedicalGroupsController.requestReschedule` — `src/modules/medical_groups/controllers/medical-groups.controller.ts:154`

### Qué es y para qué sirve (negocio)

Solicitar cambio de horario.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /medical-groups/{id}/reschedule-requests` la atiende `MedicalGroupsController.requestReschedule` (src/modules/medical_groups/controllers/medical-groups.controller.ts:154). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `RequestMedicalGroupRescheduleDto` (1 campo, 1 obligatorio). Delega en `MedicalGroupsService.requestReschedule`. Actualiza medical_groups.groups. Lee billing.service_catalog, medical_groups.group_members, medical_groups.groups, profiles.person_profiles, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/medical_groups/controllers/medical-groups.controller.ts:154` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/medical_groups/controllers/medical-groups.controller.ts:154` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | MedicalGroupsController.requestReschedule → MedicalGroupsService.requestReschedule → MedicalGroupsService.toDto → MedicalGroupsService.namesFor | `src/modules/medical_groups/services/medical-groups.service.ts:799` |
| `medical_groups.group_members` | LEE | LEE | DIRECTA | MedicalGroupsController.requestReschedule → MedicalGroupsService.requestReschedule → MedicalGroupMembersRepository.findByGroup | `src/modules/medical_groups/repositories/medical-group-members.repository.ts:34` |
| `medical_groups.groups` | ESCRIBE | ACTUALIZA | POR_TIPO | MedicalGroupsController.requestReschedule → MedicalGroupsService.requestReschedule | `src/modules/medical_groups/services/medical-groups.service.ts:578` |
| `medical_groups.groups` | LEE | LEE | DIRECTA | MedicalGroupsController.requestReschedule → MedicalGroupsService.requestReschedule → MedicalGroupsRepository.findById | `src/modules/medical_groups/repositories/medical-groups.repository.ts:26` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | MedicalGroupsController.requestReschedule → MedicalGroupsService.requestReschedule → MedicalGroupsService.toDto → MedicalGroupsService.namesFor | `src/modules/medical_groups/services/medical-groups.service.ts:814` |
| `profiles.persons` | LEE | LEE | DIRECTA | MedicalGroupsController.requestReschedule → MedicalGroupsService.requestReschedule → MedicalGroupsService.toDto → MedicalGroupsService.namesFor | `src/modules/medical_groups/services/medical-groups.service.ts:808` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RequestMedicalGroupRescheduleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `proposedAt` | `string` | Sí | formato date-time | `@IsDateString()` | Nueva fecha propuesta, ISO 8601 | `src/modules/medical_groups/dto/medical-groups.dto.ts:117` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "proposedAt": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "proposedAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<MedicalGroupDto>` · DTO `MedicalGroupDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:183` |
| `serviceCatalogId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:186` |
| `serviceName` | `string` | Sí | admite null | — | Nombre del servicio del catálogo; null si ya no existe | `src/modules/medical_groups/dto/medical-groups.dto.ts:193` |
| `requestingPractitionerId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:196` |
| `patientProfileId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:199` |
| `patientName` | `string` | Sí | admite null | — | Nombre del paciente asociado; null si no hay paciente o no tiene nombre | `src/modules/medical_groups/dto/medical-groups.dto.ts:207` |
| `conditionId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:210` |
| `scheduledAt` | `string` | Sí | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:213` |
| `locationText` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:216` |
| `notesText` | `string` | No | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:219` |
| `termsText` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:222` |
| `status` | `string` | Sí | valores: PENDING_TEAM, SCHEDULED, RESCHEDULE_PENDING, CLOSED | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:227` |
| `exerciseNotesText` | `string` | No | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:230` |
| `exerciseNotesUpdatedAt` | `string` | No | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:233` |
| `proposedRescheduleAt` | `string` | No | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:236` |
| `proposedByPractitionerId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:239` |
| `isRealized` | `boolean` | Sí | — | — | Derivado en el servidor: ya pasó la fecha de realización. | `src/modules/medical_groups/dto/medical-groups.dto.ts:243` |
| `canEditExerciseNotes` | `boolean` | Sí | — | — | Derivado: todavía se pueden subir notas del procedimiento. | `src/modules/medical_groups/dto/medical-groups.dto.ts:247` |
| `isClosed` | `boolean` | Sí | — | — | Derivado: pasó la ventana de una semana — expediente inmutable (AC-21-19). | `src/modules/medical_groups/dto/medical-groups.dto.ts:251` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:254` |
| `members` | `array<MedicalGroupMemberDto>` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:257` |
| `members[].id` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:145` |
| `members[].practitionerProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:148` |
| `members[].practitionerName` | `string` | Sí | admite null | — | Nombre del profesional; null si su persona no tiene nombre cargado | `src/modules/medical_groups/dto/medical-groups.dto.ts:156` |
| `members[].roleTitle` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:159` |
| `members[].agreedPaymentAmount` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:162` |
| `members[].agreedPaymentCurrencyConceptId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:165` |
| `members[].additionalTermsText` | `string` | No | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:168` |
| `members[].isCreator` | `boolean` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:171` |
| `members[].invitationStatus` | `string` | Sí | valores: PENDING, ACCEPTED, REJECTED | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:174` |
| `members[].respondedAt` | `string` | No | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:177` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: La cuenta no tiene un perfil profesional asociado |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo médico no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El expediente ya está cerrado y es inmutable; PreconditionFailedException: Sólo se puede solicitar cambio de horario sobre una cita programada y aún no realizada; PreconditionFailedException: Fecha propuesta inválida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/medical_groups.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Medical Groups — Grupos médicos (FT-21) — etapa `ctrl:MedicalGroupsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /medical-groups/{id}/reschedule-requests/respond

- **Origen:** CONTRATO
- **Nombre:** Resolver la solicitud de cambio de horario
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MedicalGroupsController.respondToReschedule` — `src/modules/medical_groups/controllers/medical-groups.controller.ts:170`

### Qué es y para qué sirve (negocio)

Resolver la solicitud de cambio de horario.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /medical-groups/{id}/reschedule-requests/respond` la atiende `MedicalGroupsController.respondToReschedule` (src/modules/medical_groups/controllers/medical-groups.controller.ts:170). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `RespondMedicalGroupRescheduleDto` (1 campo, 1 obligatorio). Delega en `MedicalGroupsService.respondToReschedule`. Actualiza medical_groups.groups. Lee billing.service_catalog, medical_groups.group_members, medical_groups.groups, profiles.person_profiles, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/medical_groups/controllers/medical-groups.controller.ts:170` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/medical_groups/controllers/medical-groups.controller.ts:170` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | MedicalGroupsController.respondToReschedule → MedicalGroupsService.respondToReschedule → MedicalGroupsService.toDto → MedicalGroupsService.namesFor | `src/modules/medical_groups/services/medical-groups.service.ts:799` |
| `medical_groups.group_members` | LEE | LEE | DIRECTA | MedicalGroupsController.respondToReschedule → MedicalGroupsService.respondToReschedule → MedicalGroupMembersRepository.findByGroup | `src/modules/medical_groups/repositories/medical-group-members.repository.ts:34` |
| `medical_groups.groups` | ESCRIBE | ACTUALIZA | POR_TIPO | MedicalGroupsController.respondToReschedule → MedicalGroupsService.respondToReschedule | `src/modules/medical_groups/services/medical-groups.service.ts:616` |
| `medical_groups.groups` | LEE | LEE | DIRECTA | MedicalGroupsController.respondToReschedule → MedicalGroupsService.respondToReschedule → MedicalGroupsRepository.findById | `src/modules/medical_groups/repositories/medical-groups.repository.ts:26` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | MedicalGroupsController.respondToReschedule → MedicalGroupsService.respondToReschedule → MedicalGroupsService.toDto → MedicalGroupsService.namesFor | `src/modules/medical_groups/services/medical-groups.service.ts:814` |
| `profiles.persons` | LEE | LEE | DIRECTA | MedicalGroupsController.respondToReschedule → MedicalGroupsService.respondToReschedule → MedicalGroupsService.toDto → MedicalGroupsService.namesFor | `src/modules/medical_groups/services/medical-groups.service.ts:808` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RespondMedicalGroupRescheduleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: ACCEPTED, REJECTED | `@IsIn(['ACCEPTED', 'REJECTED'])` | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:124` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decision": "ACCEPTED"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "ACCEPTED"
}
```

</details>

### Respuesta — `Promise<MedicalGroupDto>` · DTO `MedicalGroupDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:183` |
| `serviceCatalogId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:186` |
| `serviceName` | `string` | Sí | admite null | — | Nombre del servicio del catálogo; null si ya no existe | `src/modules/medical_groups/dto/medical-groups.dto.ts:193` |
| `requestingPractitionerId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:196` |
| `patientProfileId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:199` |
| `patientName` | `string` | Sí | admite null | — | Nombre del paciente asociado; null si no hay paciente o no tiene nombre | `src/modules/medical_groups/dto/medical-groups.dto.ts:207` |
| `conditionId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:210` |
| `scheduledAt` | `string` | Sí | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:213` |
| `locationText` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:216` |
| `notesText` | `string` | No | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:219` |
| `termsText` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:222` |
| `status` | `string` | Sí | valores: PENDING_TEAM, SCHEDULED, RESCHEDULE_PENDING, CLOSED | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:227` |
| `exerciseNotesText` | `string` | No | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:230` |
| `exerciseNotesUpdatedAt` | `string` | No | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:233` |
| `proposedRescheduleAt` | `string` | No | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:236` |
| `proposedByPractitionerId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:239` |
| `isRealized` | `boolean` | Sí | — | — | Derivado en el servidor: ya pasó la fecha de realización. | `src/modules/medical_groups/dto/medical-groups.dto.ts:243` |
| `canEditExerciseNotes` | `boolean` | Sí | — | — | Derivado: todavía se pueden subir notas del procedimiento. | `src/modules/medical_groups/dto/medical-groups.dto.ts:247` |
| `isClosed` | `boolean` | Sí | — | — | Derivado: pasó la ventana de una semana — expediente inmutable (AC-21-19). | `src/modules/medical_groups/dto/medical-groups.dto.ts:251` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:254` |
| `members` | `array<MedicalGroupMemberDto>` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:257` |
| `members[].id` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:145` |
| `members[].practitionerProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:148` |
| `members[].practitionerName` | `string` | Sí | admite null | — | Nombre del profesional; null si su persona no tiene nombre cargado | `src/modules/medical_groups/dto/medical-groups.dto.ts:156` |
| `members[].roleTitle` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:159` |
| `members[].agreedPaymentAmount` | `string` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:162` |
| `members[].agreedPaymentCurrencyConceptId` | `string` | No | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:165` |
| `members[].additionalTermsText` | `string` | No | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:168` |
| `members[].isCreator` | `boolean` | Sí | — | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:171` |
| `members[].invitationStatus` | `string` | Sí | valores: PENDING, ACCEPTED, REJECTED | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:174` |
| `members[].respondedAt` | `string` | No | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:177` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: La cuenta no tiene un perfil profesional asociado; UnauthorizedException: Sólo quien creó la solicitud puede resolver el cambio de horario propuesto |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo médico no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No hay ningún cambio de horario pendiente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/medical_groups.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Medical Groups — Grupos médicos (FT-21) — etapa `ctrl:MedicalGroupsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /medical-groups/eligible-members

- **Origen:** CONTRATO
- **Nombre:** Colegas que se pueden invitar a un grupo de este servicio
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MedicalGroupsController.listEligibleMembers` — `src/modules/medical_groups/controllers/medical-groups.controller.ts:84`

### Qué es y para qué sirve (negocio)

Colegas que se pueden invitar a un grupo de este servicio.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /medical-groups/eligible-members` la atiende `MedicalGroupsController.listEligibleMembers` (src/modules/medical_groups/controllers/medical-groups.controller.ts:84). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `MedicalGroupsService.listEligibleMembers`. Lee billing.service_catalog, practice.practices, practice.practitioner_role_assignments, profiles.person_profiles, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/medical_groups/controllers/medical-groups.controller.ts:84` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | serviceCatalogId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | MedicalGroupsController.listEligibleMembers → MedicalGroupsService.listEligibleMembers → ServiceCatalogRepository.findById | `src/modules/billing/repositories/service-catalog.repository.ts:89` |
| `practice.practices` | LEE | LEE | DIRECTA | MedicalGroupsController.listEligibleMembers → MedicalGroupsService.listEligibleMembers → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | MedicalGroupsController.listEligibleMembers → MedicalGroupsService.listEligibleMembers | `src/modules/medical_groups/services/medical-groups.service.ts:418` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | MedicalGroupsController.listEligibleMembers → MedicalGroupsService.listEligibleMembers → MedicalGroupsService.namesFor | `src/modules/medical_groups/services/medical-groups.service.ts:814` |
| `profiles.persons` | LEE | LEE | DIRECTA | MedicalGroupsController.listEligibleMembers → MedicalGroupsService.listEligibleMembers → MedicalGroupsService.namesFor | `src/modules/medical_groups/services/medical-groups.service.ts:808` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `serviceCatalogId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MedicalGroupEligibleMemberDto[]>` · DTO `MedicalGroupEligibleMemberDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practitionerProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:327` |
| `name` | `string` | Sí | admite null | — | Nombre del profesional; null si su persona no tiene nombre cargado | `src/modules/medical_groups/dto/medical-groups.dto.ts:335` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: La cuenta no tiene un perfil profesional asociado |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Servicio médico no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/medical_groups.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Medical Groups — Grupos médicos (FT-21) — etapa `ctrl:MedicalGroupsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. GET /medical-groups/patients/{patientProfileId}/conditions

- **Origen:** CONTRATO
- **Nombre:** Diagnósticos del paciente para el selector del formulario
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MedicalGroupsController.listPatientConditions` — `src/modules/medical_groups/controllers/medical-groups.controller.ts:96`

### Qué es y para qué sirve (negocio)

Diagnósticos del paciente para el selector del formulario.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /medical-groups/patients/{patientProfileId}/conditions` la atiende `MedicalGroupsController.listPatientConditions` (src/modules/medical_groups/controllers/medical-groups.controller.ts:96). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Delega en `MedicalGroupsService.listPatientConditions`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 12 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/medical_groups/controllers/medical-groups.controller.ts:96` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: patientProfileId | `src/modules/medical_groups/controllers/medical-groups.controller.ts:96` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | MedicalGroupsController.listPatientConditions → MedicalGroupsService.listPatientConditions → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | MedicalGroupsController.listPatientConditions → MedicalGroupsService.listPatientConditions → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | MedicalGroupsController.listPatientConditions → MedicalGroupsService.listPatientConditions → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | MedicalGroupsController.listPatientConditions → MedicalGroupsService.listPatientConditions → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | MedicalGroupsController.listPatientConditions → MedicalGroupsService.listPatientConditions → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | MedicalGroupsController.listPatientConditions → MedicalGroupsService.listPatientConditions → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | MedicalGroupsController.listPatientConditions → MedicalGroupsService.listPatientConditions → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | MedicalGroupsController.listPatientConditions → MedicalGroupsService.listPatientConditions → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | MedicalGroupsController.listPatientConditions → MedicalGroupsService.listPatientConditions → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | MedicalGroupsController.listPatientConditions → MedicalGroupsService.listPatientConditions → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | MedicalGroupsController.listPatientConditions → MedicalGroupsService.listPatientConditions → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.conditions` | LEE | LEE | DIRECTA | MedicalGroupsController.listPatientConditions → MedicalGroupsService.listPatientConditions → ConditionsRepository.findByPatient | `src/modules/clinical/repositories/conditions.repository.ts:92` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | MedicalGroupsController.listPatientConditions → MedicalGroupsService.listPatientConditions → ClinicalReadService.assertCanReadHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | MedicalGroupsController.listPatientConditions → MedicalGroupsService.listPatientConditions → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | MedicalGroupsController.listPatientConditions → MedicalGroupsService.listPatientConditions → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | MedicalGroupsController.listPatientConditions → MedicalGroupsService.listPatientConditions → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | MedicalGroupsController.listPatientConditions → MedicalGroupsService.listPatientConditions → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:992` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | MedicalGroupsController.listPatientConditions → MedicalGroupsService.listPatientConditions → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1018` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | MedicalGroupsController.listPatientConditions → MedicalGroupsService.listPatientConditions → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:992` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | MedicalGroupsController.listPatientConditions → MedicalGroupsService.listPatientConditions | `src/modules/medical_groups/services/medical-groups.service.ts:457` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MedicalGroupConditionOptionDto[]>` · DTO `MedicalGroupConditionOptionDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:308` |
| `code` | `string` | Sí | — | — | Código del catálogo (p. ej. CIE-10) | `src/modules/medical_groups/dto/medical-groups.dto.ts:311` |
| `display` | `string` | Sí | — | — | Texto legible del diagnóstico | `src/modules/medical_groups/dto/medical-groups.dto.ts:314` |
| `onsetAt` | `string` | No | formato date-time | — | — | `src/modules/medical_groups/dto/medical-groups.dto.ts:317` |
| `isMostRecent` | `boolean` | Sí | — | — | `true` en la más reciente: es la que el formulario preselecciona (AC-21-07). | `src/modules/medical_groups/dto/medical-groups.dto.ts:321` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/medical_groups.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Medical Groups — Grupos médicos (FT-21) — etapa `ctrl:MedicalGroupsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

