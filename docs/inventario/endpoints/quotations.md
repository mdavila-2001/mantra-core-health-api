<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `quotations`

- **Bloque:** —
- **Operaciones:** 3 (3 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 1 · BAJO 2
- **Tablas distintas que tocan:** 24
- **Respuestas de error y detalle contractual:** `openapi/endpoints/quotations.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/quotations` | Listar las cotizaciones de un paciente | BAJO | 22 | sesión (sin roles) |
| 2 | POST | `/quotations` | Crear una cotización | MEDIO | 24 | PRACTITIONER, CLINICIAN |
| 3 | GET | `/quotations/{id}` | Buscar una cotización por id | BAJO | 4 | sesión (sin roles) |

---

## 1. GET /quotations

- **Origen:** CONTRATO
- **Nombre:** Listar las cotizaciones de un paciente
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QuotationsController.listByPatient` — `src/modules/quotations/controllers/quotations.controller.ts:80`

### Qué es y para qué sirve (negocio)

Listar las cotizaciones de un paciente.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /quotations` la atiende `QuotationsController.listByPatient` (src/modules/quotations/controllers/quotations.controller.ts:80). Exige sesión; el controlador no declara roles. Delega en `QuotationsService.listQuotationsByPatient`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 14 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/quotations/controllers/quotations.controller.ts:80` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | patientProfileId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | QuotationsController.listByPatient → QuotationsService.listQuotationsByPatient → QuotationsService.reachablePracticesForPatient → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | QuotationsController.listByPatient → QuotationsService.listQuotationsByPatient → QuotationsService.reachablePracticesForPatient → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | QuotationsController.listByPatient → QuotationsService.listQuotationsByPatient → QuotationsService.reachablePracticesForPatient → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | QuotationsController.listByPatient → QuotationsService.listQuotationsByPatient → QuotationsService.reachablePracticesForPatient → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | QuotationsController.listByPatient → QuotationsService.listQuotationsByPatient → QuotationsService.reachablePracticesForPatient → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | QuotationsController.listByPatient → QuotationsService.listQuotationsByPatient → QuotationsService.reachablePracticesForPatient → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | QuotationsController.listByPatient → QuotationsService.listQuotationsByPatient → QuotationsService.reachablePracticesForPatient → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | QuotationsController.listByPatient → QuotationsService.listQuotationsByPatient → QuotationsService.reachablePracticesForPatient → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | QuotationsController.listByPatient → QuotationsService.listQuotationsByPatient → QuotationsService.reachablePracticesForPatient → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | QuotationsController.listByPatient → QuotationsService.listQuotationsByPatient → QuotationsService.reachablePracticesForPatient → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | QuotationsController.listByPatient → QuotationsService.listQuotationsByPatient → QuotationsService.reachablePracticesForPatient → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `billing.quotation_installments` | LEE | LEE | DIRECTA | QuotationsController.listByPatient → QuotationsService.listQuotationsByPatient → QuotationInstallmentsRepository.findByQuotationIds | `src/modules/quotations/repositories/quotation-installments.repository.ts:56` |
| `billing.quotations` | LEE | LEE | DIRECTA | QuotationsController.listByPatient → QuotationsService.listQuotationsByPatient → QuotationsRepository.findByPatient | `src/modules/quotations/repositories/quotations.repository.ts:118` |
| `practice.practices` | LEE | LEE | DIRECTA | QuotationsController.listByPatient → QuotationsService.listQuotationsByPatient → QuotationsService.reachablePracticesForPatient → PracticeTenantLookupService.findActivePracticeIdsForTenant → PracticesRepository.findByTenant | `src/modules/practice/repositories/practices.repository.ts:69` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | QuotationsController.listByPatient → QuotationsService.listQuotationsByPatient → QuotationsService.reachablePracticesForPatient → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | QuotationsController.listByPatient → QuotationsService.listQuotationsByPatient → QuotationsService.reachablePracticesForPatient → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | QuotationsController.listByPatient → QuotationsService.listQuotationsByPatient → QuotationsService.reachablePracticesForPatient → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | QuotationsController.listByPatient → QuotationsService.listQuotationsByPatient → QuotationsService.reachablePracticesForPatient → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | QuotationsController.listByPatient → QuotationsService.listQuotationsByPatient → QuotationsService.reachablePracticesForPatient → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | QuotationsController.listByPatient → QuotationsService.listQuotationsByPatient → QuotationsService.reachablePracticesForPatient → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | QuotationsController.listByPatient → QuotationsService.listQuotationsByPatient → QuotationsService.reachablePracticesForPatient → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1007` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | QuotationsController.listByPatient → QuotationsService.listQuotationsByPatient → QuotationsService.reachablePracticesForPatient → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | query | Sí | `string` | Paciente (profiles.patient_profiles, uuid) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<QuotationResponseDto[]>` · DTO `QuotationResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/quotations/dto/quotation-response.dto.ts:30` |
| `practiceId` | `string` | Sí | formato uuid | — | Identificador asociado a practice. | `src/modules/quotations/dto/quotation-response.dto.ts:36` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/quotations/dto/quotation-response.dto.ts:42` |
| `createdByPractitionerProfileId` | `string` | Sí | formato uuid | — | Profesional que armó la cotización. | `src/modules/quotations/dto/quotation-response.dto.ts:48` |
| `attentionDate` | `string` | Sí | — | — | Fecha de atención sobre la que se cotizó (ISO). | `src/modules/quotations/dto/quotation-response.dto.ts:54` |
| `appointmentId` | `string` | No | formato uuid | — | Cita asociada, opcional. | `src/modules/quotations/dto/quotation-response.dto.ts:60` |
| `serviceCatalogId` | `string` | Sí | formato uuid | — | Servicio del catálogo cotizado. | `src/modules/quotations/dto/quotation-response.dto.ts:66` |
| `serviceNameSnapshot` | `string` | Sí | — | — | Nombre del servicio, congelado al momento de crear la cotización. | `src/modules/quotations/dto/quotation-response.dto.ts:72` |
| `offeredPrice` | `string` | Sí | — | — | Precio ofrecido al paciente. | `src/modules/quotations/dto/quotation-response.dto.ts:78` |
| `currencyConceptId` | `string` | No | formato uuid | — | Identificador asociado a currency concept. | `src/modules/quotations/dto/quotation-response.dto.ts:84` |
| `paymentPlanInstallmentCount` | `number` | Sí | — | — | Cantidad de cuotas del plan de pagos. | `src/modules/quotations/dto/quotation-response.dto.ts:90` |
| `downPaymentAmount` | `string` | Sí | — | — | Anticipo: lo que se paga el día de la atención. | `src/modules/quotations/dto/quotation-response.dto.ts:96` |
| `paymentFrequency` | `string` | Sí | — | — | Frecuencia de partida del cronograma (`WEEKLY`, `BIWEEKLY` o `MONTHLY`). | `src/modules/quotations/dto/quotation-response.dto.ts:102` |
| `validUntil` | `string` | Sí | — | — | Fecha hasta la que la oferta es válida (ISO). | `src/modules/quotations/dto/quotation-response.dto.ts:108` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado de la cotización. | `src/modules/quotations/dto/quotation-response.dto.ts:114` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó la cotización. | `src/modules/quotations/dto/quotation-response.dto.ts:120` |
| `installments` | `array<QuotationInstallmentDto>` | Sí | — | — | Cuotas congeladas del plan de pagos. | `src/modules/quotations/dto/quotation-response.dto.ts:126` |
| `installments[].installmentNumber` | `number` | Sí | — | — | Número de orden de la cuota dentro del plan (1-based). | `src/modules/quotations/dto/quotation-response.dto.ts:9` |
| `installments[].dueDate` | `string` | Sí | — | — | Fecha de vencimiento de la cuota (ISO). | `src/modules/quotations/dto/quotation-response.dto.ts:15` |
| `installments[].amount` | `string` | Sí | — | — | Monto de la cuota. | `src/modules/quotations/dto/quotation-response.dto.ts:21` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {PATIENT_NOT_AVAILABLE.message} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/quotations.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Quotations — Cotizaciones con plan de pagos (FT-24) — etapa `ctrl:QuotationsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /quotations

- **Origen:** CONTRATO
- **Nombre:** Crear una cotización
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QuotationsController.create` — `src/modules/quotations/controllers/quotations.controller.ts:55`

### Qué es y para qué sirve (negocio)

Crear una cotización.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /quotations` la atiende `QuotationsController.create` (src/modules/quotations/controllers/quotations.controller.ts:55). Exige sesión con alguno de los roles PRACTITIONER, CLINICIAN. Valida el cuerpo como `CreateQuotationDto` (15 campos, 13 obligatorios). Delega en `QuotationsService.createQuotation`. Crea filas en billing.quotation_installments, billing.quotations. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 14 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRACTITIONER, CLINICIAN | `src/modules/quotations/controllers/quotations.controller.ts:55` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | QuotationsController.create → QuotationsService.createQuotation → QuotationsService.assertPatientAndAppointmentAvailable → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | QuotationsController.create → QuotationsService.createQuotation → QuotationsService.assertPatientAndAppointmentAvailable → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | QuotationsController.create → QuotationsService.createQuotation → QuotationsService.assertPatientAndAppointmentAvailable → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | QuotationsController.create → QuotationsService.createQuotation → QuotationsService.assertPatientAndAppointmentAvailable → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | QuotationsController.create → QuotationsService.createQuotation → QuotationsService.assertPatientAndAppointmentAvailable → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | QuotationsController.create → QuotationsService.createQuotation → QuotationsService.assertPatientAndAppointmentAvailable → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | QuotationsController.create → QuotationsService.createQuotation → QuotationsService.assertPatientAndAppointmentAvailable → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | QuotationsController.create → QuotationsService.createQuotation → QuotationsService.assertPatientAndAppointmentAvailable → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | QuotationsController.create → QuotationsService.createQuotation → QuotationsService.assertPatientAndAppointmentAvailable → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | QuotationsController.create → QuotationsService.createQuotation → QuotationsService.assertPatientAndAppointmentAvailable → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | QuotationsController.create → QuotationsService.createQuotation → QuotationsService.assertPatientAndAppointmentAvailable → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `billing.quotation_installments` | ESCRIBE | CREA | DIRECTA | QuotationsController.create → QuotationsService.createQuotation → QuotationInstallmentsRepository.createMany | `src/modules/quotations/repositories/quotation-installments.repository.ts:75` |
| `billing.quotations` | ESCRIBE | CREA | DIRECTA | QuotationsController.create → QuotationsService.createQuotation → QuotationsRepository.create | `src/modules/quotations/repositories/quotations.repository.ts:133` |
| `billing.service_catalog` | LEE | LEE | DIRECTA | QuotationsController.create → QuotationsService.createQuotation → ServiceCatalogRepository.findById | `src/modules/billing/repositories/service-catalog.repository.ts:89` |
| `clinical.appointments` | LEE | LEE | DIRECTA | QuotationsController.create → QuotationsService.createQuotation → QuotationsService.assertPatientAndAppointmentAvailable → QuotationsRepository.findAppointmentById | `src/modules/quotations/repositories/quotations.repository.ts:97` |
| `practice.practices` | LEE | LEE | DIRECTA | QuotationsController.create → QuotationsService.createQuotation → QuotationsService.reachesPractice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | QuotationsController.create → QuotationsService.createQuotation → QuotationsService.reachesPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | QuotationsController.create → QuotationsService.createQuotation → QuotationsService.assertPatientAndAppointmentAvailable → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | QuotationsController.create → QuotationsService.createQuotation → QuotationsService.assertPatientAndAppointmentAvailable → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | QuotationsController.create → QuotationsService.createQuotation → QuotationsService.assertPatientAndAppointmentAvailable → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | QuotationsController.create → QuotationsService.createQuotation → QuotationsService.assertPatientAndAppointmentAvailable → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | QuotationsController.create → QuotationsService.createQuotation → QuotationsService.assertPatientAndAppointmentAvailable → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | QuotationsController.create → QuotationsService.createQuotation → QuotationsService.assertPatientAndAppointmentAvailable → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1007` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | QuotationsController.create → QuotationsService.createQuotation → QuotationsService.assertPatientAndAppointmentAvailable → QuotationsService.hasClinicalBasis → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |

### Cuerpo — DTO `CreateQuotationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | Práctica (practice.practices) | `src/modules/quotations/dto/create-quotation.dto.ts:97` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente cotizado (profiles.patient_profiles) | `src/modules/quotations/dto/create-quotation.dto.ts:107` |
| `attentionDate` | `string` | Sí | formato date-time | `@IsDateString()` | Fecha de atención (ISO) | `src/modules/quotations/dto/create-quotation.dto.ts:114` |
| `appointmentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cita asociada, opcional (scheduling) | `src/modules/quotations/dto/create-quotation.dto.ts:125` |
| `serviceCatalogId` | `string` | Sí | formato uuid | `@IsUUID()` | Servicio del catálogo (billing.service_catalog) | `src/modules/quotations/dto/create-quotation.dto.ts:135` |
| `offeredPrice` | `string` | Sí | patrón runtime PRICE_PATTERN | `@Transform(amountAsText)` `@IsNumberString()` `@Matches(PRICE_PATTERN, { message: PRICE_PATTERN_MESSAGE })` | Precio ofrecido al paciente (editable respecto del catálogo) | `src/modules/quotations/dto/create-quotation.dto.ts:147` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Moneda (concepto) | `src/modules/quotations/dto/create-quotation.dto.ts:155` |
| `paymentPlanInstallmentCount` | `number` | Sí | mínimo 0; máximo MAX_INSTALLMENTS | `@IsInt()` `@Min(0)` `@Max(MAX_INSTALLMENTS)` | Cantidad de cuotas del plan de pagos | `src/modules/quotations/dto/create-quotation.dto.ts:165` |
| `downPaymentAmount` | `string` | Sí | patrón runtime PRICE_PATTERN | `@Transform(amountAsText)` `@IsNumberString()` `@Matches(PRICE_PATTERN, { message: PRICE_PATTERN_MESSAGE })` | Anticipo, entre 0 y el precio ofrecido. Sin interés. | `src/modules/quotations/dto/create-quotation.dto.ts:177` |
| `paymentFrequency` | `string` | Sí | valores: WEEKLY, BIWEEKLY, MONTHLY | `@IsIn(PAYMENT_FREQUENCIES)` | Frecuencia de partida del cronograma | `src/modules/quotations/dto/create-quotation.dto.ts:187` |
| `installments` | `array<QuotationInstallmentInputDto>` | Sí | máximo MAX_INSTALLMENTS elemento(s) | `@IsArray()` `@ArrayMaxSize(MAX_INSTALLMENTS)` `@ValidateNested({ each: true })` `@Type(() => QuotationInstallmentInputDto)` | — | `src/modules/quotations/dto/create-quotation.dto.ts:198` |
| `installments[].installmentNumber` | `number` | Sí | mínimo 1 | `@IsInt()` `@Min(1)` | — | `src/modules/quotations/dto/create-quotation.dto.ts:71` |
| `installments[].dueDate` | `string` | Sí | formato date-time | `@IsDateString()` | — | `src/modules/quotations/dto/create-quotation.dto.ts:78` |
| `installments[].amount` | `string` | Sí | patrón runtime PRICE_PATTERN | `@Transform(amountAsText)` `@IsNumberString()` `@Matches(PRICE_PATTERN, { message: PRICE_PATTERN_MESSAGE })` | — | `src/modules/quotations/dto/create-quotation.dto.ts:87` |
| `validUntil` | `string` | Sí | formato date-time | `@IsDateString()` | Fecha de validez de la oferta (ISO) | `src/modules/quotations/dto/create-quotation.dto.ts:205` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "attentionDate": "2026-07-31T12:00:00.000Z",
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "offeredPrice": "1500.00",
  "paymentPlanInstallmentCount": 1,
  "downPaymentAmount": "190.00",
  "paymentFrequency": "WEEKLY",
  "installments": [
    {
      "installmentNumber": 1,
      "dueDate": "2026-10-10",
      "amount": "233.34"
    }
  ],
  "validUntil": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "attentionDate": "2026-07-31T12:00:00.000Z",
  "appointmentId": "00000000-0000-4000-8000-000000000001",
  "serviceCatalogId": "00000000-0000-4000-8000-000000000001",
  "offeredPrice": "1500.00",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "paymentPlanInstallmentCount": 1,
  "downPaymentAmount": "190.00",
  "paymentFrequency": "WEEKLY",
  "installments": [
    {
      "installmentNumber": 1,
      "dueDate": "2026-10-10",
      "amount": "233.34"
    }
  ],
  "validUntil": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<QuotationResponseDto>` · DTO `QuotationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/quotations/dto/quotation-response.dto.ts:30` |
| `practiceId` | `string` | Sí | formato uuid | — | Identificador asociado a practice. | `src/modules/quotations/dto/quotation-response.dto.ts:36` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/quotations/dto/quotation-response.dto.ts:42` |
| `createdByPractitionerProfileId` | `string` | Sí | formato uuid | — | Profesional que armó la cotización. | `src/modules/quotations/dto/quotation-response.dto.ts:48` |
| `attentionDate` | `string` | Sí | — | — | Fecha de atención sobre la que se cotizó (ISO). | `src/modules/quotations/dto/quotation-response.dto.ts:54` |
| `appointmentId` | `string` | No | formato uuid | — | Cita asociada, opcional. | `src/modules/quotations/dto/quotation-response.dto.ts:60` |
| `serviceCatalogId` | `string` | Sí | formato uuid | — | Servicio del catálogo cotizado. | `src/modules/quotations/dto/quotation-response.dto.ts:66` |
| `serviceNameSnapshot` | `string` | Sí | — | — | Nombre del servicio, congelado al momento de crear la cotización. | `src/modules/quotations/dto/quotation-response.dto.ts:72` |
| `offeredPrice` | `string` | Sí | — | — | Precio ofrecido al paciente. | `src/modules/quotations/dto/quotation-response.dto.ts:78` |
| `currencyConceptId` | `string` | No | formato uuid | — | Identificador asociado a currency concept. | `src/modules/quotations/dto/quotation-response.dto.ts:84` |
| `paymentPlanInstallmentCount` | `number` | Sí | — | — | Cantidad de cuotas del plan de pagos. | `src/modules/quotations/dto/quotation-response.dto.ts:90` |
| `downPaymentAmount` | `string` | Sí | — | — | Anticipo: lo que se paga el día de la atención. | `src/modules/quotations/dto/quotation-response.dto.ts:96` |
| `paymentFrequency` | `string` | Sí | — | — | Frecuencia de partida del cronograma (`WEEKLY`, `BIWEEKLY` o `MONTHLY`). | `src/modules/quotations/dto/quotation-response.dto.ts:102` |
| `validUntil` | `string` | Sí | — | — | Fecha hasta la que la oferta es válida (ISO). | `src/modules/quotations/dto/quotation-response.dto.ts:108` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado de la cotización. | `src/modules/quotations/dto/quotation-response.dto.ts:114` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó la cotización. | `src/modules/quotations/dto/quotation-response.dto.ts:120` |
| `installments` | `array<QuotationInstallmentDto>` | Sí | — | — | Cuotas congeladas del plan de pagos. | `src/modules/quotations/dto/quotation-response.dto.ts:126` |
| `installments[].installmentNumber` | `number` | Sí | — | — | Número de orden de la cuota dentro del plan (1-based). | `src/modules/quotations/dto/quotation-response.dto.ts:9` |
| `installments[].dueDate` | `string` | Sí | — | — | Fecha de vencimiento de la cuota (ISO). | `src/modules/quotations/dto/quotation-response.dto.ts:15` |
| `installments[].amount` | `string` | Sí | — | — | Monto de la cuota. | `src/modules/quotations/dto/quotation-response.dto.ts:21` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Servicio no encontrado en el catálogo |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Se requiere un perfil profesional para crear una cotización; PreconditionFailedException: El profesional no tiene una vinculación activa con esa práctica; PreconditionFailedException: validUntil debe ser posterior a attentionDate |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/quotations.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Quotations — Cotizaciones con plan de pagos (FT-24) — etapa `ctrl:QuotationsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. GET /quotations/{id}

- **Origen:** CONTRATO
- **Nombre:** Buscar una cotización por id
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QuotationsController.findById` — `src/modules/quotations/controllers/quotations.controller.ts:106`

### Qué es y para qué sirve (negocio)

Buscar una cotización por id.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /quotations/{id}` la atiende `QuotationsController.findById` (src/modules/quotations/controllers/quotations.controller.ts:106). Exige sesión; el controlador no declara roles. Delega en `QuotationsService.getQuotation`. Lee billing.quotation_installments, billing.quotations, practice.practices, practice.practitioner_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/quotations/controllers/quotations.controller.ts:106` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/quotations/controllers/quotations.controller.ts:106` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.quotation_installments` | LEE | LEE | DIRECTA | QuotationsController.findById → QuotationsService.getQuotation → QuotationInstallmentsRepository.findByQuotationId | `src/modules/quotations/repositories/quotation-installments.repository.ts:33` |
| `billing.quotations` | LEE | LEE | DIRECTA | QuotationsController.findById → QuotationsService.getQuotation → QuotationsRepository.findById | `src/modules/quotations/repositories/quotations.repository.ts:82` |
| `practice.practices` | LEE | LEE | DIRECTA | QuotationsController.findById → QuotationsService.getQuotation → QuotationsService.reachesPractice → PracticeTenantLookupService.findTenantOfPractice → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | QuotationsController.findById → QuotationsService.getQuotation → QuotationsService.reachesPractice → PracticeTenantLookupService.findActivePracticeIdsForPractitioner → PractitionerRoleAssignmentsRepository.findActiveByPractitioner | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:177` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<QuotationResponseDto>` · DTO `QuotationResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/quotations/dto/quotation-response.dto.ts:30` |
| `practiceId` | `string` | Sí | formato uuid | — | Identificador asociado a practice. | `src/modules/quotations/dto/quotation-response.dto.ts:36` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/quotations/dto/quotation-response.dto.ts:42` |
| `createdByPractitionerProfileId` | `string` | Sí | formato uuid | — | Profesional que armó la cotización. | `src/modules/quotations/dto/quotation-response.dto.ts:48` |
| `attentionDate` | `string` | Sí | — | — | Fecha de atención sobre la que se cotizó (ISO). | `src/modules/quotations/dto/quotation-response.dto.ts:54` |
| `appointmentId` | `string` | No | formato uuid | — | Cita asociada, opcional. | `src/modules/quotations/dto/quotation-response.dto.ts:60` |
| `serviceCatalogId` | `string` | Sí | formato uuid | — | Servicio del catálogo cotizado. | `src/modules/quotations/dto/quotation-response.dto.ts:66` |
| `serviceNameSnapshot` | `string` | Sí | — | — | Nombre del servicio, congelado al momento de crear la cotización. | `src/modules/quotations/dto/quotation-response.dto.ts:72` |
| `offeredPrice` | `string` | Sí | — | — | Precio ofrecido al paciente. | `src/modules/quotations/dto/quotation-response.dto.ts:78` |
| `currencyConceptId` | `string` | No | formato uuid | — | Identificador asociado a currency concept. | `src/modules/quotations/dto/quotation-response.dto.ts:84` |
| `paymentPlanInstallmentCount` | `number` | Sí | — | — | Cantidad de cuotas del plan de pagos. | `src/modules/quotations/dto/quotation-response.dto.ts:90` |
| `downPaymentAmount` | `string` | Sí | — | — | Anticipo: lo que se paga el día de la atención. | `src/modules/quotations/dto/quotation-response.dto.ts:96` |
| `paymentFrequency` | `string` | Sí | — | — | Frecuencia de partida del cronograma (`WEEKLY`, `BIWEEKLY` o `MONTHLY`). | `src/modules/quotations/dto/quotation-response.dto.ts:102` |
| `validUntil` | `string` | Sí | — | — | Fecha hasta la que la oferta es válida (ISO). | `src/modules/quotations/dto/quotation-response.dto.ts:108` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado de la cotización. | `src/modules/quotations/dto/quotation-response.dto.ts:114` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó la cotización. | `src/modules/quotations/dto/quotation-response.dto.ts:120` |
| `installments` | `array<QuotationInstallmentDto>` | Sí | — | — | Cuotas congeladas del plan de pagos. | `src/modules/quotations/dto/quotation-response.dto.ts:126` |
| `installments[].installmentNumber` | `number` | Sí | — | — | Número de orden de la cuota dentro del plan (1-based). | `src/modules/quotations/dto/quotation-response.dto.ts:9` |
| `installments[].dueDate` | `string` | Sí | — | — | Fecha de vencimiento de la cuota (ISO). | `src/modules/quotations/dto/quotation-response.dto.ts:15` |
| `installments[].amount` | `string` | Sí | — | — | Monto de la cuota. | `src/modules/quotations/dto/quotation-response.dto.ts:21` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Cotización no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/quotations.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Quotations — Cotizaciones con plan de pagos (FT-24) — etapa `ctrl:QuotationsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

