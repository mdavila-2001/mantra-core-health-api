<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `procedures_perioperative`

- **Bloque:** Clínico y Diagnóstico (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)
- **Operaciones:** 42 (42 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 3 · MEDIO 29 · BAJO 10
- **Tablas distintas que tocan:** 100
- **Respuestas de error y detalle contractual:** `openapi/endpoints/procedures-perioperative.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/dental-procedures` | Histórico odontológico del paciente | BAJO | 20 | CLINICIAN, PRACTITIONER |
| 2 | POST | `/dental-procedures` | Registrar un procedimiento odontológico | MEDIO | 24 | CLINICIAN, PRACTITIONER |
| 3 | GET | `/dental-procedures/catalog` | Catálogo odontológico: códigos, piezas (FDI) y cuadrantes | BAJO | 0 | CLINICIAN, PRACTITIONER |
| 4 | POST | `/internal/periop/or-blocks-release-tick` | Liberar bloques vencidos (worker) | MEDIO | 3 | SYSTEM, SYSTEM_WORKER |
| 5 | POST | `/or-blocks/{id}/cancel` | Cancelar un bloque | ALTO | 10 | sesión (sin roles) |
| 6 | POST | `/or-blocks/{id}/release` | Liberar un bloque | ALTO | 10 | sesión (sin roles) |
| 7 | POST | `/pacu-stays/{stayId}/assessments` | Registrar una valoración de recuperación | MEDIO | 2 | PERIOP_NURSE, ANESTHESIOLOGIST, PERIOP_ADMIN |
| 8 | POST | `/pacu-stays/{stayId}/discharge` | Dar el alta de recuperación | MEDIO | 6 | ANESTHESIOLOGIST, PERIOP_ADMIN |
| 9 | GET | `/procedure-cases` | Listar casos quirúrgicos (agenda) | BAJO | 5 | SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN |
| 10 | POST | `/procedure-cases` | Programar un caso quirúrgico y reservar el quirófano | MEDIO | 14 | SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN |
| 11 | GET | `/procedure-cases/{id}` | Detalle completo del caso quirúrgico | BAJO | 42 | SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN |
| 12 | PATCH | `/procedure-cases/{id}` | Modificar el caso quirúrgico | MEDIO | 16 | SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN |
| 13 | POST | `/procedure-cases/{id}/anesthesia-events` | Anotar un evento intraoperatorio de anestesia | MEDIO | 6 | ANESTHESIOLOGIST, PERIOP_NURSE, PERIOP_ADMIN |
| 14 | POST | `/procedure-cases/{id}/anesthesia-plans` | Registrar el plan de anestesia y la valoración de vía aérea | MEDIO | 3 | ANESTHESIOLOGIST, PERIOP_ADMIN |
| 15 | POST | `/procedure-cases/{id}/anesthesia-plans/{planId}/approve` | Aprobar el plan de anestesia | MEDIO | 2 | ANESTHESIOLOGIST, PERIOP_ADMIN |
| 16 | POST | `/procedure-cases/{id}/cancel` | Cancelar el caso quirúrgico | MEDIO | 3 | SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN |
| 17 | POST | `/procedure-cases/{id}/charge-items/post` | Generar los cargos y consolidar el uso del quirófano | MEDIO | 3 | PERIOP_ADMIN, BILLING |
| 18 | POST | `/procedure-cases/{id}/confirm` | Confirmar la intervención verificando las credenciales del equipo | MEDIO | 9 | SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN |
| 19 | POST | `/procedure-cases/{id}/diagnoses` | Registrar los diagnósticos del caso | MEDIO | 11 | SURGEON, PERIOP_ADMIN |
| 20 | POST | `/procedure-cases/{id}/findings` | Registrar un hallazgo operatorio | MEDIO | 4 | SURGEON, PERIOP_ADMIN |
| 21 | POST | `/procedure-cases/{id}/implants` | Registrar un implante con su trazabilidad UDI, lote o serie | MEDIO | 3 | SURGEON, PERIOP_NURSE, PERIOP_ADMIN |
| 22 | POST | `/procedure-cases/{id}/medication-uses` | Registrar el uso de un medicamento en la intervención | MEDIO | 2 | ANESTHESIOLOGIST, PERIOP_NURSE, PERIOP_ADMIN |
| 23 | POST | `/procedure-cases/{id}/operative-reports` | Redactar el reporte operatorio | MEDIO | 10 | SURGEON, PERIOP_ADMIN |
| 24 | POST | `/procedure-cases/{id}/operative-reports/{reportId}/sign` | Firmar el reporte operatorio | MEDIO | 7 | SURGEON, PERIOP_ADMIN |
| 25 | POST | `/procedure-cases/{id}/operative-steps` | Registrar un paso operatorio | MEDIO | 2 | SURGEON, PERIOP_NURSE, PERIOP_ADMIN |
| 26 | POST | `/procedure-cases/{id}/pacu-stays` | Admitir al paciente en recuperación | MEDIO | 3 | PERIOP_NURSE, ANESTHESIOLOGIST, PERIOP_ADMIN |
| 27 | POST | `/procedure-cases/{id}/preoperative-assessments` | Registrar la valoración preoperatoria y sus puntuaciones de riesgo | MEDIO | 11 | ANESTHESIOLOGIST, SURGEON, PERIOP_ADMIN |
| 28 | POST | `/procedure-cases/{id}/preoperative-orders` | Indicar una orden preoperatoria para el caso | MEDIO | 37 | ANESTHESIOLOGIST, SURGEON, PERIOP_ADMIN |
| 29 | POST | `/procedure-cases/{id}/preoperative-orders/verify` | Verificar las órdenes preoperatorias | MEDIO | 2 | ANESTHESIOLOGIST, PERIOP_NURSE, PERIOP_ADMIN |
| 30 | POST | `/procedure-cases/{id}/room-events` | Registrar un evento de sala | MEDIO | 12 | PERIOP_ADMIN, PERIOP_NURSE, SURGEON, ANESTHESIOLOGIST |
| 31 | POST | `/procedure-cases/{id}/safety-checklists` | Crear el check-list OMS del caso (201; 200 si ya existe) | MEDIO | 5 | PERIOP_ADMIN, PERIOP_NURSE, SURGEON, ANESTHESIOLOGIST, SURGERY_SCHEDULER |
| 32 | GET | `/procedure-cases/{id}/safety-checklists/{checklistId}` | Check-list OMS por fases | BAJO | 3 | PERIOP_ADMIN, PERIOP_NURSE, SURGEON, ANESTHESIOLOGIST, SURGERY_SCHEDULER |
| 33 | POST | `/procedure-cases/{id}/safety-checklists/{checklistId}/responses` | Responder una fase del checklist quirúrgico | MEDIO | 6 | PERIOP_NURSE, SURGEON, ANESTHESIOLOGIST, PERIOP_ADMIN |
| 34 | POST | `/procedure-cases/{id}/specimens` | Registrar una muestra tomada en la intervención | MEDIO | 2 | SURGEON, PERIOP_NURSE, PERIOP_ADMIN |
| 35 | GET | `/procedure-cases/{id}/team-members` | Listar el equipo del caso quirúrgico | BAJO | 2 | SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN |
| 36 | POST | `/procedure-cases/{id}/team-members` | Asignar un miembro al equipo quirúrgico | MEDIO | 8 | SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN |
| 37 | POST | `/procedure-cases/{id}/team-members/{memberId}/accept` | Aceptar la participación en el equipo quirúrgico | BAJO | 2 | SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN |
| 38 | POST | `/procedure-cases/{id}/team-members/{memberId}/respond` | Rechazar, pedir cambios o informar indisponibilidad | MEDIO | 7 | SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN |
| 39 | GET | `/sites/{siteId}/operating-rooms` | Quirófanos de una sede | BAJO | 12 | sesión (sin roles) |
| 40 | GET | `/sites/{siteId}/or-blocks` | Bloques de quirófano | BAJO | 10 | sesión (sin roles) |
| 41 | POST | `/sites/{siteId}/or-blocks` | Crear un bloque de quirófano | ALTO | 12 | sesión (sin roles) |
| 42 | GET | `/sites/{siteId}/or-utilization` | Utilización de quirófanos | BAJO | 10 | sesión (sin roles) |

---

## 1. GET /dental-procedures

- **Origen:** CONTRATO
- **Nombre:** Histórico odontológico del paciente
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DentalController.listByPatient` — `src/modules/procedures_perioperative/controllers/dental.controller.ts:75`

### Qué es y para qué sirve (negocio)

Histórico odontológico del paciente. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /dental-procedures` la atiende `DentalController.listByPatient` (src/modules/procedures_perioperative/controllers/dental.controller.ts:75). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `PeriopDentalService.listByPatient`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 12 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/procedures_perioperative/controllers/dental.controller.ts:75` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_QUERY | patientProfileId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | DentalController.listByPatient → PeriopDentalService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | DentalController.listByPatient → PeriopDentalService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | DentalController.listByPatient → PeriopDentalService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | DentalController.listByPatient → PeriopDentalService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | DentalController.listByPatient → PeriopDentalService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | DentalController.listByPatient → PeriopDentalService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | DentalController.listByPatient → PeriopDentalService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | DentalController.listByPatient → PeriopDentalService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | DentalController.listByPatient → PeriopDentalService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | DentalController.listByPatient → PeriopDentalService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | DentalController.listByPatient → PeriopDentalService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.procedures` | LEE | LEE | DIRECTA | DentalController.listByPatient → PeriopDentalService.listByPatient → PeriopDentalRepository.findByPatient | `src/modules/procedures_perioperative/repositories/periop-dental.repository.ts:168` |
| `procedures_perioperative.procedure_body_sites` | LEE | LEE | DIRECTA | DentalController.listByPatient → PeriopDentalService.listByPatient → PeriopDentalRepository.findSitesByProcedures | `src/modules/procedures_perioperative/repositories/periop-dental.repository.ts:217` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | DentalController.listByPatient → PeriopDentalService.listByPatient → ClinicalReadService.assertCanReadHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | DentalController.listByPatient → PeriopDentalService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | DentalController.listByPatient → PeriopDentalService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DentalController.listByPatient → PeriopDentalService.listByPatient → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | DentalController.listByPatient → PeriopDentalService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | DentalController.listByPatient → PeriopDentalService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | DentalController.listByPatient → PeriopDentalService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | query | Sí | `string` | Paciente consultado |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DentalProcedureListDto>` · DTO `DentalProcedureListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<DentalProcedureDto>` | Sí | — | — | Valor de items mantenido por la instancia. | `src/modules/procedures_perioperative/dto/dental.dto.ts:234` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/dental.dto.ts:144` |
| `items[].patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/procedures_perioperative/dto/dental.dto.ts:150` |
| `items[].procedureCodeConceptId` | `string` | Sí | formato uuid | — | Qué se hizo. | `src/modules/procedures_perioperative/dto/dental.dto.ts:156` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Estado del registro. | `src/modules/procedures_perioperative/dto/dental.dto.ts:162` |
| `items[].performerProfileId` | `string` | No | formato uuid | — | Odontólogo que lo realizó, si consta. | `src/modules/procedures_perioperative/dto/dental.dto.ts:168` |
| `items[].encounterId` | `string` | No | formato uuid | — | Encuentro en el que se realizó, si lo hubo. | `src/modules/procedures_perioperative/dto/dental.dto.ts:174` |
| `items[].noteText` | `string` | No | — | — | Nota clínica. | `src/modules/procedures_perioperative/dto/dental.dto.ts:180` |
| `items[].performedAt` | `string` | No | formato date-time | — | Cuándo se realizó. | `src/modules/procedures_perioperative/dto/dental.dto.ts:186` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo quedó registrado. | `src/modules/procedures_perioperative/dto/dental.dto.ts:192` |
| `items[].sites` | `array<DentalSiteDto>` | Sí | — | — | Piezas o cuadrantes tratados. | `src/modules/procedures_perioperative/dto/dental.dto.ts:198` |
| `items[].sites[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/dental.dto.ts:123` |
| `items[].sites[].bodySiteConceptId` | `string` | Sí | formato uuid | — | Pieza o cuadrante. | `src/modules/procedures_perioperative/dto/dental.dto.ts:129` |
| `items[].sites[].description` | `string` | No | — | — | Cara o superficie, si se precisó. | `src/modules/procedures_perioperative/dto/dental.dto.ts:135` |
| `total` | `number` | Sí | — | — | Procedimientos de la persona, sin paginar | `src/modules/procedures_perioperative/dto/dental.dto.ts:240` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/dental-procedures.int-spec.ts:114` |
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/dental.controller.spec.ts:75` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:DentalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /dental-procedures

- **Origen:** CONTRATO
- **Nombre:** Registrar un procedimiento odontológico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DentalController.record` — `src/modules/procedures_perioperative/controllers/dental.controller.ts:90`

### Qué es y para qué sirve (negocio)

Registrar un procedimiento odontológico. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /dental-procedures` la atiende `DentalController.record` (src/modules/procedures_perioperative/controllers/dental.controller.ts:90). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateDentalProcedureDto` (8 campos, 2 obligatorios). Delega en `PeriopDentalService.record`. Crea filas en audit.audit_log, clinical.procedures, clinical.received_services, procedures_perioperative.procedure_body_sites. Lee audit.audit_log, authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants y 12 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/procedures_perioperative/controllers/dental.controller.ts:90` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | DentalController.record → PeriopDentalService.record → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | DentalController.record → PeriopDentalService.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `authz.access_policies` | LEE | LEE | DIRECTA | DentalController.record → PeriopDentalService.record → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | DentalController.record → PeriopDentalService.record → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | DentalController.record → PeriopDentalService.record → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | DentalController.record → PeriopDentalService.record → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | DentalController.record → PeriopDentalService.record → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | DentalController.record → PeriopDentalService.record → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | DentalController.record → PeriopDentalService.record → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | DentalController.record → PeriopDentalService.record → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | DentalController.record → PeriopDentalService.record → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | DentalController.record → PeriopDentalService.record → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | DentalController.record → PeriopDentalService.record → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.procedures` | ESCRIBE | CREA | DIRECTA | DentalController.record → PeriopDentalService.record → PeriopDentalRepository.createProcedure | `src/modules/procedures_perioperative/repositories/periop-dental.repository.ts:101` |
| `clinical.received_services` | ESCRIBE | CREA | DIRECTA | DentalController.record → PeriopDentalService.record → ReceivedServicesProjector.projectProcedure → ReceivedServicesRepository.upsert | `src/modules/clinical/repositories/received-services.repository.ts:146` |
| `clinical.received_services` | LEE | LEE | DIRECTA | DentalController.record → PeriopDentalService.record → ReceivedServicesProjector.projectProcedure → ReceivedServicesRepository.upsert → ReceivedServicesRepository.findBySourceProcedure | `src/modules/clinical/repositories/received-services.repository.ts:54` |
| `iam.sessions` | LEE | LEE | POR_SQL | DentalController.record → PeriopDentalService.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `procedures_perioperative.procedure_body_sites` | ESCRIBE | CREA | DIRECTA | DentalController.record → PeriopDentalService.record → PeriopDentalRepository.createSite | `src/modules/procedures_perioperative/repositories/periop-dental.repository.ts:133` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | DentalController.record → PeriopDentalService.record → ReceivedServicesProjector.projectProcedure → ReceivedServicesRepository.findCaseByPrimaryProcedure | `src/modules/clinical/repositories/received-services.repository.ts:71` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | DentalController.record → PeriopDentalService.record → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | DentalController.record → PeriopDentalService.record → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | DentalController.record → PeriopDentalService.record → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | DentalController.record → PeriopDentalService.record → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | DentalController.record → PeriopDentalService.record → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Cuerpo — DTO `CreateDentalProcedureDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente tratado | `src/modules/procedures_perioperative/dto/dental.dto.ts:36` |
| `procedureCodeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Qué se hizo. Los códigos sembrados salen de `GET /dental-procedures/catalog`; se admite cualquier concepto válido. | `src/modules/procedures_perioperative/dto/dental.dto.ts:47` |
| `performerProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Odontólogo que lo realizó. Si se omite se toma el profesional de la sesión. | `src/modules/procedures_perioperative/dto/dental.dto.ts:59` |
| `toothSiteConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Pieza dentaria en notación FDI o cuadrante. Tiene que ser uno de los sitios del catálogo. | `src/modules/procedures_perioperative/dto/dental.dto.ts:71` |
| `siteDetail` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(SITE_DETAIL_MAX_LENGTH)` | Cara o superficie tratada, si corresponde | `src/modules/procedures_perioperative/dto/dental.dto.ts:83` |
| `noteText` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(NOTE_MAX_LENGTH)` | — | `src/modules/procedures_perioperative/dto/dental.dto.ts:92` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro en el que se realizó, si lo hubo | `src/modules/procedures_perioperative/dto/dental.dto.ts:103` |
| `performedAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Cuándo se realizó. Si se omite, ahora. | `src/modules/procedures_perioperative/dto/dental.dto.ts:114` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "procedureCodeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "procedureCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "performerProfileId": "00000000-0000-4000-8000-000000000001",
  "toothSiteConceptId": "00000000-0000-4000-8000-000000000001",
  "siteDetail": "valor-ejemplo",
  "noteText": "valor-ejemplo",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "performedAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<DentalProcedureResponseDto>` · DTO `DentalProcedureResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/dental.dto.ts:207` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/procedures_perioperative/dto/dental.dto.ts:213` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado del registro. | `src/modules/procedures_perioperative/dto/dental.dto.ts:219` |
| `createdAt` | `string` | Sí | formato date-time | — | Cuándo quedó registrado. | `src/modules/procedures_perioperative/dto/dental.dto.ts:225` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El sitio tiene que ser una pieza dentaria o un cuadrante del catálogo odontológico; PreconditionFailedException: No se puede precisar la cara tratada sin decir sobre qué pieza |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/dental-procedures.int-spec.ts:99` |
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/dental.controller.spec.ts:45` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:DentalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. GET /dental-procedures/catalog

- **Origen:** CONTRATO
- **Nombre:** Catálogo odontológico: códigos, piezas (FDI) y cuadrantes
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DentalController.catalog` — `src/modules/procedures_perioperative/controllers/dental.controller.ts:64`

### Qué es y para qué sirve (negocio)

Catálogo odontológico: códigos, piezas (FDI) y cuadrantes. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /dental-procedures/catalog` la atiende `DentalController.catalog` (src/modules/procedures_perioperative/controllers/dental.controller.ts:64). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `PeriopDentalService.catalog`. No toca tablas relacionales: Devuelve catálogos que viven en constantes del código (códigos, piezas, cuadrantes)..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/procedures_perioperative/controllers/dental.controller.ts:64` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: Devuelve catálogos que viven en constantes del código (códigos, piezas, cuadrantes).. _(manual, 2026-10-21; fuente: `src/modules/procedures_perioperative/services/periop-dental.service.ts:252`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `DentalCatalogDto` · DTO `DentalCatalogDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `procedureCodes` | `array<DentalCatalogEntryDto>` | Sí | — | — | Códigos de procedimiento sembrados. | `src/modules/procedures_perioperative/dto/dental.dto.ts:297` |
| `procedureCodes[].conceptId` | `string` | Sí | formato uuid | — | Identificador del concepto. | `src/modules/procedures_perioperative/dto/dental.dto.ts:270` |
| `procedureCodes[].code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/procedures_perioperative/dto/dental.dto.ts:276` |
| `procedureCodes[].display` | `string` | Sí | — | — | Etiqueta legible. | `src/modules/procedures_perioperative/dto/dental.dto.ts:282` |
| `teeth` | `array<DentalCatalogEntryDto>` | Sí | — | — | Las 32 piezas permanentes, en orden FDI. | `src/modules/procedures_perioperative/dto/dental.dto.ts:303` |
| `teeth[].conceptId` | `string` | Sí | formato uuid | — | Identificador del concepto. | `src/modules/procedures_perioperative/dto/dental.dto.ts:270` |
| `teeth[].code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/procedures_perioperative/dto/dental.dto.ts:276` |
| `teeth[].display` | `string` | Sí | — | — | Etiqueta legible. | `src/modules/procedures_perioperative/dto/dental.dto.ts:282` |
| `quadrants` | `array<DentalCatalogEntryDto>` | Sí | — | — | Los cuatro cuadrantes. | `src/modules/procedures_perioperative/dto/dental.dto.ts:309` |
| `quadrants[].conceptId` | `string` | Sí | formato uuid | — | Identificador del concepto. | `src/modules/procedures_perioperative/dto/dental.dto.ts:270` |
| `quadrants[].code` | `string` | Sí | — | — | Código estable del concepto. | `src/modules/procedures_perioperative/dto/dental.dto.ts:276` |
| `quadrants[].display` | `string` | Sí | — | — | Etiqueta legible. | `src/modules/procedures_perioperative/dto/dental.dto.ts:282` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/dental-procedures.int-spec.ts:62` |
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/dental.controller.spec.ts:83` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:DentalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /internal/periop/or-blocks-release-tick

- **Origen:** CONTRATO
- **Nombre:** Liberar bloques vencidos (worker)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopOrController.tick` — `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:352`

### Qué es y para qué sirve (negocio)

Liberar bloques vencidos (worker). Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /internal/periop/or-blocks-release-tick` la atiende `PeriopOrController.tick` (src/modules/procedures_perioperative/controllers/periop-or.controller.ts:352). Exige sesión con alguno de los roles SYSTEM, SYSTEM_WORKER. Delega en `OrBlocksUseCases.tick`. Actualiza procedures_perioperative.operating_room_blocks. Lee procedures_perioperative.operating_room_blocks, procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SYSTEM_WORKER | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:352` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.operating_room_blocks` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopOrController.tick → OrBlocksUseCases.tick → OrBlocksUseCases.closeInTx | `src/modules/procedures_perioperative/services/or/or.use-cases.ts:911` |
| `procedures_perioperative.operating_room_blocks` | LEE | LEE | DIRECTA | PeriopOrController.tick → OrBlocksUseCases.tick | `src/modules/procedures_perioperative/services/or/or.use-cases.ts:787` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopOrController.tick → OrBlocksUseCases.tick | `src/modules/procedures_perioperative/services/or/or.use-cases.ts:793` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El bloque no está activo |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El bloque tiene casos ligados: reubicarlos primero |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopOrController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /or-blocks/{id}/cancel

- **Origen:** CONTRATO
- **Nombre:** Cancelar un bloque
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopOrController.cancel` — `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:305`

### Qué es y para qué sirve (negocio)

Cancelar un bloque. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /or-blocks/{id}/cancel` la atiende `PeriopOrController.cancel` (src/modules/procedures_perioperative/controllers/periop-or.controller.ts:305). Exige sesión; el controlador no declara roles. Valida el cuerpo como `OrBlockReasonDto` (1 campo, 0 obligatorios). Delega en `OrBlocksUseCases.close`. Actualiza procedures_perioperative.operating_room_blocks. Lee delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.space_unit_assignments, procedures_perioperative.operating_room_blocks y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:305` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match (opcional) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:305` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | PeriopOrController.cancel → OrBlocksUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | PeriopOrController.cancel → OrBlocksUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PeriopOrController.cancel → OrBlocksUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | PeriopOrController.cancel → OrBlocksUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | PeriopOrController.cancel → OrBlocksUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PeriopOrController.cancel → OrBlocksUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | PeriopOrController.cancel → OrBlocksUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpaceOpsRepository.unitsOf | `src/modules/practice/repositories/care-space-ops.repository.ts:146` |
| `procedures_perioperative.operating_room_blocks` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopOrController.cancel → OrBlocksUseCases.close → OrBlocksUseCases.closeInTx | `src/modules/procedures_perioperative/services/or/or.use-cases.ts:911` |
| `procedures_perioperative.operating_room_blocks` | LEE | LEE | DIRECTA | PeriopOrController.cancel → OrBlocksUseCases.close | `src/modules/procedures_perioperative/services/or/or.use-cases.ts:764` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopOrController.cancel → OrBlocksUseCases.close → OrBlocksUseCases.closeInTx | `src/modules/procedures_perioperative/services/or/or.use-cases.ts:899` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `If-Match` | header | No | `string` | rowVersion del bloque (412 si no coincide) |

### Cuerpo — DTO `OrBlockReasonDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reasonText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:136` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `no declarado` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Bloque no encontrado; ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 409 | `CONFLICT` | ConflictException: El bloque no está activo |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El bloque tiene casos ligados: reubicarlos primero |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Acción de infraestructura no registrada: {action} |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-or-f4.int-spec.ts:465` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopOrController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /or-blocks/{id}/release

- **Origen:** CONTRATO
- **Nombre:** Liberar un bloque
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopOrController.release` — `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:276`

### Qué es y para qué sirve (negocio)

Liberar un bloque. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /or-blocks/{id}/release` la atiende `PeriopOrController.release` (src/modules/procedures_perioperative/controllers/periop-or.controller.ts:276). Exige sesión; el controlador no declara roles. Valida el cuerpo como `OrBlockReasonDto` (1 campo, 0 obligatorios). Delega en `OrBlocksUseCases.close`. Actualiza procedures_perioperative.operating_room_blocks. Lee delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.space_unit_assignments, procedures_perioperative.operating_room_blocks y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:276` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match (opcional) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | PeriopOrController.release → OrBlocksUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | PeriopOrController.release → OrBlocksUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PeriopOrController.release → OrBlocksUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | PeriopOrController.release → OrBlocksUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | PeriopOrController.release → OrBlocksUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PeriopOrController.release → OrBlocksUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | PeriopOrController.release → OrBlocksUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpaceOpsRepository.unitsOf | `src/modules/practice/repositories/care-space-ops.repository.ts:146` |
| `procedures_perioperative.operating_room_blocks` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopOrController.release → OrBlocksUseCases.close → OrBlocksUseCases.closeInTx | `src/modules/procedures_perioperative/services/or/or.use-cases.ts:911` |
| `procedures_perioperative.operating_room_blocks` | LEE | LEE | DIRECTA | PeriopOrController.release → OrBlocksUseCases.close | `src/modules/procedures_perioperative/services/or/or.use-cases.ts:764` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopOrController.release → OrBlocksUseCases.close → OrBlocksUseCases.closeInTx | `src/modules/procedures_perioperative/services/or/or.use-cases.ts:899` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `If-Match` | header | No | `string` | rowVersion del bloque (412 si no coincide) |

### Cuerpo — DTO `OrBlockReasonDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reasonText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:136` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `no declarado` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Bloque no encontrado; ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 409 | `CONFLICT` | ConflictException: El bloque no está activo |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El bloque tiene casos ligados: reubicarlos primero |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Acción de infraestructura no registrada: {action} |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-or-f4.int-spec.ts:296` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopOrController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /pacu-stays/{stayId}/assessments

- **Origen:** CONTRATO
- **Nombre:** Registrar una valoración de recuperación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.recordPacuAssessment` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:662`

### Qué es y para qué sirve (negocio)

Registrar una valoración de recuperación. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /pacu-stays/{stayId}/assessments` la atiende `PeriopController.recordPacuAssessment` (src/modules/procedures_perioperative/controllers/periop.controller.ts:662). Exige sesión con alguno de los roles PERIOP_NURSE, ANESTHESIOLOGIST, PERIOP_ADMIN. Valida el cuerpo como `RecordPacuAssessmentDto` (7 campos, 1 obligatorio). Delega en `PeriopIntraopService.recordPacuAssessment`. Crea filas en procedures_perioperative.pacu_assessments. Lee procedures_perioperative.pacu_stays.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PERIOP_NURSE, ANESTHESIOLOGIST, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:662` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: stayId | `src/modules/procedures_perioperative/controllers/periop.controller.ts:662` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.pacu_assessments` | ESCRIBE | CREA | DIRECTA | PeriopController.recordPacuAssessment → PeriopIntraopService.recordPacuAssessment → PeriopIntraopRepository.createPacuAssessment | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:940` |
| `procedures_perioperative.pacu_stays` | LEE | LEE | DIRECTA | PeriopController.recordPacuAssessment → PeriopIntraopService.recordPacuAssessment → PeriopIntraopService.loadPacuStayInScope → PeriopIntraopRepository.findPacuStayById | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:867` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `stayId` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordPacuAssessmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `assessedByProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2558` |
| `aldreteScore` | `number` | No | mínimo 0; máximo 10 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(10)` | Puntuación de Aldrete | `src/modules/procedures_perioperative/dto/periop.dto.ts:2572` |
| `painScore` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Escala de dolor | `src/modules/procedures_perioperative/dto/periop.dto.ts:2580` |
| `nauseaScore` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Escala de náusea | `src/modules/procedures_perioperative/dto/periop.dto.ts:2588` |
| `airwayStatus` | `string` | No | valores: PATENT, SUPPORTED | `@IsOptional()` `@IsIn(['PATENT', 'SUPPORTED'])` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2596` |
| `observationsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Observaciones registradas | `src/modules/procedures_perioperative/dto/periop.dto.ts:2604` |
| `criteriaJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Criterios de alta evaluados | `src/modules/procedures_perioperative/dto/periop.dto.ts:2612` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "assessedByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "assessedByProfileId": "00000000-0000-4000-8000-000000000001",
  "aldreteScore": 1,
  "painScore": "valor-ejemplo",
  "nauseaScore": "valor-ejemplo",
  "airwayStatus": "PATENT",
  "observationsJson": {},
  "criteriaJson": {}
}
```

</details>

### Respuesta — `Promise<PacuAssessmentResponseDto>` · DTO `PacuAssessmentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2623` |
| `pacuStayId` | `string` | Sí | formato uuid | — | Identificador asociado a pacu stay. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2629` |
| `meetsDischargeCriteria` | `boolean` | Sí | — | — | true si la valoración cumple el criterio de alta | `src/modules/procedures_perioperative/dto/periop.dto.ts:2637` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El paciente ya salió de recuperación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:308` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. POST /pacu-stays/{stayId}/discharge

- **Origen:** CONTRATO
- **Nombre:** Dar el alta de recuperación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.dischargeFromPacu` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:683`

### Qué es y para qué sirve (negocio)

Dar el alta de recuperación. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /pacu-stays/{stayId}/discharge` la atiende `PeriopController.dischargeFromPacu` (src/modules/procedures_perioperative/controllers/periop.controller.ts:683). Exige sesión con alguno de los roles ANESTHESIOLOGIST, PERIOP_ADMIN. Valida el cuerpo como `DischargePacuDto` (10 campos, 1 obligatorio). Delega en `PeriopIntraopService.dischargeFromPacu`. Crea filas en procedures_perioperative.postoperative_followups, procedures_perioperative.postoperative_orders. Actualiza procedures_perioperative.procedure_case_locations. Lee procedures_perioperative.pacu_assessments, procedures_perioperative.pacu_stays, procedures_perioperative.procedure_case_locations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ANESTHESIOLOGIST, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:683` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: stayId | `src/modules/procedures_perioperative/controllers/periop.controller.ts:683` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.pacu_assessments` | LEE | LEE | DIRECTA | PeriopController.dischargeFromPacu → PeriopIntraopService.dischargeFromPacu → PeriopIntraopRepository.findAssessmentsByStay | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:963` |
| `procedures_perioperative.pacu_stays` | LEE | LEE | DIRECTA | PeriopController.dischargeFromPacu → PeriopIntraopService.dischargeFromPacu → PeriopIntraopService.loadPacuStayInScope → PeriopIntraopRepository.findPacuStayById | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:867` |
| `procedures_perioperative.postoperative_followups` | ESCRIBE | CREA | DIRECTA | PeriopController.dischargeFromPacu → PeriopIntraopService.dischargeFromPacu → PeriopIntraopRepository.createFollowup | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:1056` |
| `procedures_perioperative.postoperative_orders` | ESCRIBE | CREA | DIRECTA | PeriopController.dischargeFromPacu → PeriopIntraopService.dischargeFromPacu → PeriopIntraopRepository.createPostoperativeOrder | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:1002` |
| `procedures_perioperative.procedure_case_locations` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.dischargeFromPacu → PeriopIntraopService.dischargeFromPacu | `src/modules/procedures_perioperative/services/periop-intraop.service.ts:874` |
| `procedures_perioperative.procedure_case_locations` | LEE | LEE | DIRECTA | PeriopController.dischargeFromPacu → PeriopIntraopService.dischargeFromPacu → PeriopCasesRepository.findOpenLocation | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:699` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `stayId` | path | Sí | `string` | — |

### Cuerpo — DTO `DischargePacuDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `destination` | `string` | Sí | valores: PACU, ICU, WARD, HOME | `@IsIn(DISPOSITIONS)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2702` |
| `dischargedByProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2710` |
| `orders` | `array<PostoperativeOrderDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => PostoperativeOrderDto)` | Órdenes postoperatorias | `src/modules/procedures_perioperative/dto/periop.dto.ts:2723` |
| `orders[].serviceRequestId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2649` |
| `orders[].orderRole` | `string` | No | valores: LAB, IMAGING, CONSULT, MEDICATION | `@IsIn(['LAB', 'IMAGING', 'CONSULT', 'MEDICATION'])` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2656` |
| `followups` | `array<PostoperativeFollowupDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => PostoperativeFollowupDto)` | Seguimientos a agendar | `src/modules/procedures_perioperative/dto/periop.dto.ts:2736` |
| `followups[].followupType` | `string` | No | valores: WOUND_CHECK, VISIT | `@IsIn(['WOUND_CHECK', 'VISIT'])` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2668` |
| `followups[].appointmentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2676` |
| `followups[].dueAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2684` |
| `followups[].instructionsText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2692` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "destination": "PACU"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "destination": "PACU",
  "dischargedByProfileId": "00000000-0000-4000-8000-000000000001",
  "orders": [
    {
      "serviceRequestId": "00000000-0000-4000-8000-000000000001",
      "orderRole": "LAB"
    }
  ],
  "followups": [
    {
      "followupType": "WOUND_CHECK",
      "appointmentId": "00000000-0000-4000-8000-000000000001",
      "dueAt": "2026-07-31T12:00:00.000Z",
      "instructionsText": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<DischargePacuResponseDto>` · DTO `DischargePacuResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2747` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2753` |
| `ordersCreated` | `number` | Sí | — | — | Órdenes postoperatorias creadas | `src/modules/procedures_perioperative/dto/periop.dto.ts:2759` |
| `followupsCreated` | `number` | Sí | — | — | Seguimientos agendados | `src/modules/procedures_perioperative/dto/periop.dto.ts:2765` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El paciente ya salió de recuperación |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El alta de recuperación exige al menos una valoración; PreconditionFailedException: La última valoración no cumple el criterio de alta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:309` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. GET /procedure-cases

- **Origen:** CONTRATO
- **Nombre:** Listar casos quirúrgicos (agenda)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.listCases` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:105`

### Qué es y para qué sirve (negocio)

Listar casos quirúrgicos (agenda). Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /procedure-cases` la atiende `PeriopController.listCases` (src/modules/procedures_perioperative/controllers/periop.controller.ts:105). Exige sesión con alguno de los roles SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN. Delega en `PeriopCasesService.listCases`. Lee practice.care_spaces, practice.clinical_units, procedures_perioperative.operating_room_blocks, procedures_perioperative.procedure_cases, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:105` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `practice.care_spaces` | LEE | LEE | POR_SQL | PeriopController.listCases → PeriopCasesService.listCases → CaseOrViewBuilder.fields | `src/modules/procedures_perioperative/services/or/case-or-view.ts:79` |
| `practice.clinical_units` | LEE | LEE | POR_SQL | PeriopController.listCases → PeriopCasesService.listCases → CaseOrViewBuilder.fields → CaseOrViewBuilder.blockLabels | `src/modules/procedures_perioperative/services/or/case-or-view.ts:145` |
| `procedures_perioperative.operating_room_blocks` | LEE | LEE | POR_SQL | PeriopController.listCases → PeriopCasesService.listCases → CaseOrViewBuilder.fields → CaseOrViewBuilder.blockLabels | `src/modules/procedures_perioperative/services/or/case-or-view.ts:145` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.listCases → PeriopCasesService.listCases → PeriopCasesRepository.findCases | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:307` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | PeriopController.listCases → PeriopCasesService.listCases → CaseOrViewBuilder.fields | `src/modules/procedures_perioperative/services/or/case-or-view.ts:87` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | query | No | `string` | Paciente |
| `operatingRoomId` | query | No | `string` | Quirófano reservado |
| `primarySurgeonProfileId` | query | No | `string` | Cirujano principal |
| `statusConceptId` | query | No | `string` | Estado del caso |
| `from` | query | No | `string` | Inicio de la ventana (inclusive) |
| `to` | query | No | `string` | Fin de la ventana (exclusivo) |
| `limit` | query | No | `number` | — |
| `offset` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CaseListResponseDto>` · DTO `CaseListResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<CaseSummaryDto>` | Sí | — | — | Valor de items mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:819` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:734` |
| `items[].caseNumber` | `string` | Sí | — | — | Valor de case number mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:740` |
| `items[].patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/procedures_perioperative/dto/periop.dto.ts:746` |
| `items[].primarySurgeonProfileId` | `string` | No | formato uuid | — | Identificador asociado a primary surgeon profile. | `src/modules/procedures_perioperative/dto/periop.dto.ts:752` |
| `items[].operatingRoomId` | `string` | No | formato uuid | — | Identificador asociado a operating room. | `src/modules/procedures_perioperative/dto/periop.dto.ts:758` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:764` |
| `items[].scheduledStartAt` | `string` | No | formato date-time | — | Valor de scheduled start at mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:770` |
| `items[].scheduledEndAt` | `string` | No | formato date-time | — | Valor de scheduled end at mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:776` |
| `items[].operatingRoom` | `CaseOperatingRoomDto` | No | — | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:779` |
| `items[].operatingRoom.id` | `string` | No | formato uuid | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:675` |
| `items[].operatingRoom.code` | `string` | No | — | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:676` |
| `items[].operatingRoom.name` | `string` | No | — | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:677` |
| `items[].block` | `CaseBlockRefDto` | No | — | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:782` |
| `items[].block.id` | `string` | No | formato uuid | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:682` |
| `items[].block.label` | `string` | No | — | — | Servicio (unidad) o cirujano dueño del bloque | `src/modules/procedures_perioperative/dto/periop.dto.ts:684` |
| `items[].caseType` | `CaseConceptRefDto` | No | — | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:785` |
| `items[].caseType.code` | `string` | No | — | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:689` |
| `items[].caseType.display` | `string` | No | — | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:690` |
| `items[].encounterId` | `string` | No | formato uuid; admite null | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:788` |
| `items[].reservedStartAt` | `string` | No | formato date-time; admite null | — | Inicio reservado (programado − preparación) | `src/modules/procedures_perioperative/dto/periop.dto.ts:796` |
| `items[].reservedEndAt` | `string` | No | formato date-time; admite null | — | Fin reservado (programado + limpieza) | `src/modules/procedures_perioperative/dto/periop.dto.ts:804` |
| `items[].prepMinutes` | `number` | No | admite null | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:807` |
| `items[].cleanupMinutes` | `number` | No | admite null | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:810` |
| `total` | `number` | Sí | — | — | Casos que cumplen el filtro, sin paginar | `src/modules/procedures_perioperative/dto/periop.dto.ts:825` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-or-f4.int-spec.ts:433` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /procedure-cases

- **Origen:** CONTRATO
- **Nombre:** Programar un caso quirúrgico y reservar el quirófano
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.scheduleCase` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:146`

### Qué es y para qué sirve (negocio)

Programar un caso quirúrgico y reservar el quirófano. Caso de uso UC-53-01: Programar caso y reservar quirófano. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:85`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases` la atiende `PeriopController.scheduleCase` (src/modules/procedures_perioperative/controllers/periop.controller.ts:146). Exige sesión con alguno de los roles SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN. Valida el cuerpo como `ScheduleCaseDto` (15 campos, 8 obligatorios). Delega en `PeriopCasesService.scheduleCase`. Crea filas en procedures_perioperative.operating_room_utilization_events, procedures_perioperative.procedure_case_milestones, procedures_perioperative.procedure_case_status_history, procedures_perioperative.procedure_case_team_members, procedures_perioperative.procedure_cases. Actualiza procedures_perioperative.procedure_cases. Lee clinical.encounter_locations, practice.care_space_blocks, practice.care_spaces, practice.practice_settings, practice.practice_sites, procedures_perioperative.operating_room_blocks, procedures_perioperative.procedure_cases, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:146` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | LEE | LEE | POR_SQL | PeriopController.scheduleCase → PeriopCasesService.scheduleCase → OperatingRoomValidator.validate → PracticeCareSpaceOpsAdapter.getOperationalState → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.occupancy → CareSpaceOpsRepository.occupancy | `src/modules/practice/repositories/care-space-ops.repository.ts:178` |
| `practice.care_space_blocks` | LEE | LEE | DIRECTA | PeriopController.scheduleCase → PeriopCasesService.scheduleCase → OperatingRoomValidator.validate → PracticeCareSpaceOpsAdapter.assertBookable → CareSpaceOpsRepository.openBlocks | `src/modules/practice/repositories/care-space-ops.repository.ts:223` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | PeriopController.scheduleCase → PeriopCasesService.scheduleCase → OperatingRoomValidator.validate → PracticeCareSpaceOpsAdapter.getOperationalState → PracticeCareSpaceOpsAdapter.load → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.practice_settings` | LEE | LEE | POR_SQL | PeriopController.scheduleCase → PeriopCasesService.scheduleCase → OperatingRoomValidator.validate → PracticeCareSpaceOpsAdapter.getOperationalState → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.settings → CareSpaceOpsRepository.settings | `src/modules/practice/repositories/care-space-ops.repository.ts:431` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PeriopController.scheduleCase → PeriopCasesService.scheduleCase → OperatingRoomValidator.validate → PracticeCareSpaceOpsAdapter.getOperationalState → PracticeCareSpaceOpsAdapter.load → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `procedures_perioperative.operating_room_blocks` | LEE | LEE | DIRECTA | PeriopController.scheduleCase → PeriopCasesService.scheduleCase → OperatingRoomValidator.validate | `src/modules/procedures_perioperative/services/or/operating-room.validator.ts:118` |
| `procedures_perioperative.operating_room_utilization_events` | ESCRIBE | CREA | DIRECTA | PeriopController.scheduleCase → PeriopCasesService.scheduleCase → PeriopCasesRepository.createUtilizationEvent | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:758` |
| `procedures_perioperative.procedure_case_milestones` | ESCRIBE | CREA | DIRECTA | PeriopController.scheduleCase → PeriopCasesService.scheduleCase → PeriopCasesRepository.createMilestone | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:495` |
| `procedures_perioperative.procedure_case_status_history` | ESCRIBE | CREA | DIRECTA | PeriopController.scheduleCase → PeriopCasesService.scheduleCase → PeriopCasesRepository.createStatusHistory | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:437` |
| `procedures_perioperative.procedure_case_team_members` | ESCRIBE | CREA | DIRECTA | PeriopController.scheduleCase → PeriopCasesService.scheduleCase → PeriopCasesRepository.createTeamMember | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:628` |
| `procedures_perioperative.procedure_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.scheduleCase → PeriopCasesService.scheduleCase | `src/modules/procedures_perioperative/services/periop-cases.service.ts:333` |
| `procedures_perioperative.procedure_cases` | ESCRIBE | CREA | DIRECTA | PeriopController.scheduleCase → PeriopCasesService.scheduleCase → PeriopCasesRepository.createCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:155` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.scheduleCase → PeriopCasesService.scheduleCase → PeriopCasesService.nextCaseNumber → PeriopCasesRepository.countCases | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:385` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | PeriopController.scheduleCase → PeriopCasesService.scheduleCase → OperatingRoomValidator.validate | `src/modules/procedures_perioperative/services/or/operating-room.validator.ts:107` |

### Cuerpo — DTO `ScheduleCaseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `custodianTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:49` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:56` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:64` |
| `serviceRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Solicitud que origina el caso | `src/modules/procedures_perioperative/dto/periop.dto.ts:75` |
| `primaryProcedureId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:83` |
| `caseType` | `string` | Sí | valores: ELECTIVE, URGENT, EMERGENCY | `@IsIn(CASE_TYPES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:90` |
| `priority` | `string` | Sí | valores: ROUTINE, URGENT, STAT | `@IsIn(CASE_PRIORITIES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:97` |
| `surgicalSpecialtyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:105` |
| `requestedByProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:113` |
| `primarySurgeonProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Cirujano principal | `src/modules/procedures_perioperative/dto/periop.dto.ts:120` |
| `practiceSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:128` |
| `operatingRoomId` | `string` | Sí | formato uuid | `@IsUUID()` | Quirófano que se reserva | `src/modules/procedures_perioperative/dto/periop.dto.ts:135` |
| `scheduledStartAt` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:142` |
| `scheduledEndAt` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:149` |
| `urgencyReasonText` | `string` | No | — | `@IsOptional()` `@IsString()` | Justificación de la urgencia; obligatoria si el caso no es electivo | `src/modules/procedures_perioperative/dto/periop.dto.ts:160` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "caseType": "ELECTIVE",
  "priority": "ROUTINE",
  "primarySurgeonProfileId": "00000000-0000-4000-8000-000000000001",
  "operatingRoomId": "00000000-0000-4000-8000-000000000001",
  "scheduledStartAt": "2026-07-31T12:00:00.000Z",
  "scheduledEndAt": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "primaryProcedureId": "00000000-0000-4000-8000-000000000001",
  "caseType": "ELECTIVE",
  "priority": "ROUTINE",
  "surgicalSpecialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "requestedByProfileId": "00000000-0000-4000-8000-000000000001",
  "primarySurgeonProfileId": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "operatingRoomId": "00000000-0000-4000-8000-000000000001",
  "scheduledStartAt": "2026-07-31T12:00:00.000Z",
  "scheduledEndAt": "2026-07-31T12:00:00.000Z",
  "urgencyReasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<CaseResponseDto>` · DTO `CaseResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:171` |
| `caseNumber` | `string` | Sí | — | — | Número del caso | `src/modules/procedures_perioperative/dto/periop.dto.ts:177` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:183` |
| `operatingRoomId` | `string` | Sí | formato uuid | — | Quirófano reservado | `src/modules/procedures_perioperative/dto/periop.dto.ts:189` |
| `milestoneId` | `string` | Sí | formato uuid | — | Hito de programación creado | `src/modules/procedures_perioperative/dto/periop.dto.ts:195` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Sitio no encontrado |
| 409 | `CONFLICT` | ConflictException: La ventana cae en un bloque de otro dueño; ConflictException: El quirófano ya está reservado en esa ventana; ConflictException: No se pudo asignar número de caso |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso debe terminar después de empezar; PreconditionFailedException: Un caso urgente o de emergencia necesita justificar su urgencia; PreconditionFailedException: El quirófano es de otra sede; PreconditionFailedException: El espacio no es un quirófano; PreconditionFailedException: El quirófano no está disponible en esa ventana; PreconditionFailedException: El quirófano no tiene recurso agendable activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-or-f4.int-spec.ts:120` |
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:70` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `UC-53-01`

---

## 11. GET /procedure-cases/{id}

- **Origen:** CONTRATO
- **Nombre:** Detalle completo del caso quirúrgico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.getCase` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:124`

### Qué es y para qué sirve (negocio)

Detalle completo del caso quirúrgico. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /procedure-cases/{id}` la atiende `PeriopController.getCase` (src/modules/procedures_perioperative/controllers/periop.controller.ts:124). Exige sesión con alguno de los roles SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN. Delega en `PeriopCasesService.getCaseDetail`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 34 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:124` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:124` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesService.assertCanReadCaseDetail → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesService.assertCanReadCaseDetail → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesService.assertCanReadCaseDetail → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesService.assertCanReadCaseDetail → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesService.assertCanReadCaseDetail → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesService.assertCanReadCaseDetail → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesService.assertCanReadCaseDetail → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesService.assertCanReadCaseDetail → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesService.assertCanReadCaseDetail → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesService.assertCanReadCaseDetail → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesService.assertCanReadCaseDetail → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | PeriopController.getCase → PeriopCasesService.getCaseDetail → CaseOrViewBuilder.detail → InfrastructureAccessService.actionsOn → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → CaseOrViewBuilder.detail → InfrastructureAccessService.actionsOn → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → CaseOrViewBuilder.detail → InfrastructureAccessService.actionsOn → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → CaseOrViewBuilder.detail → InfrastructureAccessService.actionsOn → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.cleaning_orders` | LEE | LEE | POR_SQL | PeriopController.getCase → PeriopCasesService.getCaseDetail → CaseOrViewBuilder.detail | `src/modules/procedures_perioperative/services/or/case-or-view.ts:216` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → CaseOrViewBuilder.detail → InfrastructureAccessService.actionsOn → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → CaseOrViewBuilder.detail → InfrastructureAccessService.actionsOn → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | PeriopController.getCase → PeriopCasesService.getCaseDetail → CaseOrViewBuilder.detail → InfrastructureAccessService.actionsOn → InfrastructureAccessService.resolve → CareSpaceOpsRepository.unitsOf | `src/modules/practice/repositories/care-space-ops.repository.ts:146` |
| `procedures_perioperative.anesthesia_plans` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopPreopRepository.findAnesthesiaPlanByCase | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:551` |
| `procedures_perioperative.implant_identifiers` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopIntraopRepository.findIdentifiersByImplants | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:749` |
| `procedures_perioperative.operating_room_blocks` | LEE | LEE | POR_SQL | PeriopController.getCase → PeriopCasesService.getCaseDetail → CaseOrViewBuilder.fields → CaseOrViewBuilder.blockLabels | `src/modules/procedures_perioperative/services/or/case-or-view.ts:145` |
| `procedures_perioperative.operating_room_utilization_events` | LEE | LEE | POR_SQL | PeriopController.getCase → PeriopCasesService.getCaseDetail → CaseOrViewBuilder.detail | `src/modules/procedures_perioperative/services/or/case-or-view.ts:200` |
| `procedures_perioperative.operative_findings` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopIntraopRepository.findFindingsByCase | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:706` |
| `procedures_perioperative.operative_reports` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopIntraopRepository.findReportsByCase | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:677` |
| `procedures_perioperative.operative_steps` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopIntraopRepository.findStepsByCase | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:239` |
| `procedures_perioperative.preoperative_assessments` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopPreopRepository.findAssessmentByCase | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:178` |
| `procedures_perioperative.preoperative_orders` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopPreopRepository.findOrdersByCase | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:295` |
| `procedures_perioperative.procedure_case_diagnoses` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesRepository.findDiagnosesByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:589` |
| `procedures_perioperative.procedure_case_milestones` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesRepository.findMilestonesByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:370` |
| `procedures_perioperative.procedure_case_team_members` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesRepository.findTeamByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:647` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesRepository.findCaseById | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:193` |
| `procedures_perioperative.procedure_implants` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopIntraopRepository.findImplantsByCase | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:724` |
| `procedures_perioperative.surgical_safety_checklists` | LEE | LEE | POR_SQL | PeriopController.getCase → PeriopCasesService.getCaseDetail → CaseOrViewBuilder.detail | `src/modules/procedures_perioperative/services/or/case-or-view.ts:186` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesService.assertCanReadCaseDetail → ClinicalReadService.assertCanReadHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesService.assertCanReadCaseDetail → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesService.assertCanReadCaseDetail → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesService.assertCanReadCaseDetail → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesService.assertCanReadCaseDetail → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesService.assertCanReadCaseDetail → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | PeriopController.getCase → PeriopCasesService.getCaseDetail → PeriopCasesService.assertCanReadCaseDetail → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | PeriopController.getCase → PeriopCasesService.getCaseDetail → CaseOrViewBuilder.fields | `src/modules/procedures_perioperative/services/or/case-or-view.ts:87` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CaseDetailDto>` · DTO `CaseDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `case` | `CaseSummaryDto` | Sí | — | — | Datos de cabecera del caso. | `src/modules/procedures_perioperative/dto/periop.dto.ts:868` |
| `case.id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:734` |
| `case.caseNumber` | `string` | Sí | — | — | Valor de case number mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:740` |
| `case.patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/procedures_perioperative/dto/periop.dto.ts:746` |
| `case.primarySurgeonProfileId` | `string` | No | formato uuid | — | Identificador asociado a primary surgeon profile. | `src/modules/procedures_perioperative/dto/periop.dto.ts:752` |
| `case.operatingRoomId` | `string` | No | formato uuid | — | Identificador asociado a operating room. | `src/modules/procedures_perioperative/dto/periop.dto.ts:758` |
| `case.statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:764` |
| `case.scheduledStartAt` | `string` | No | formato date-time | — | Valor de scheduled start at mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:770` |
| `case.scheduledEndAt` | `string` | No | formato date-time | — | Valor de scheduled end at mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:776` |
| `case.operatingRoom` | `CaseOperatingRoomDto` | No | — | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:779` |
| `case.operatingRoom.id` | `string` | No | formato uuid | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:675` |
| `case.operatingRoom.code` | `string` | No | — | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:676` |
| `case.operatingRoom.name` | `string` | No | — | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:677` |
| `case.block` | `CaseBlockRefDto` | No | — | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:782` |
| `case.block.id` | `string` | No | formato uuid | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:682` |
| `case.block.label` | `string` | No | — | — | Servicio (unidad) o cirujano dueño del bloque | `src/modules/procedures_perioperative/dto/periop.dto.ts:684` |
| `case.caseType` | `CaseConceptRefDto` | No | — | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:785` |
| `case.caseType.code` | `string` | No | — | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:689` |
| `case.caseType.display` | `string` | No | — | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:690` |
| `case.encounterId` | `string` | No | formato uuid; admite null | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:788` |
| `case.reservedStartAt` | `string` | No | formato date-time; admite null | — | Inicio reservado (programado − preparación) | `src/modules/procedures_perioperative/dto/periop.dto.ts:796` |
| `case.reservedEndAt` | `string` | No | formato date-time; admite null | — | Fin reservado (programado + limpieza) | `src/modules/procedures_perioperative/dto/periop.dto.ts:804` |
| `case.prepMinutes` | `number` | No | admite null | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:807` |
| `case.cleanupMinutes` | `number` | No | admite null | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:810` |
| `checklist` | `CaseChecklistDto` | Sí | — | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:871` |
| `checklist.id` | `string` | Sí | formato uuid | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:701` |
| `checklist.signIn` | `ChecklistPhaseDto` | Sí | — | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:702` |
| `checklist.signIn.completedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:696` |
| `checklist.timeOut` | `ChecklistPhaseDto` | Sí | — | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:703` |
| `checklist.timeOut.completedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:696` |
| `checklist.signOut` | `ChecklistPhaseDto` | Sí | — | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:704` |
| `checklist.signOut.completedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:696` |
| `roomEvents` | `array<CaseRoomEventDto>` | Sí | — | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:874` |
| `roomEvents[].id` | `string` | Sí | formato uuid | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:709` |
| `roomEvents[].eventCode` | `string` | Sí | — | — | PATIENT_IN_ROOM, ANESTHESIA_START, INCISION, CLOSURE, PATIENT_OUT_OF_ROOM, CLEANUP_START, CLEANUP_END, ROOM_READY | `src/modules/procedures_perioperative/dto/periop.dto.ts:714` |
| `roomEvents[].occurredAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:716` |
| `roomEvents[].recordedByUserId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:718` |
| `turnoverCleaning` | `CaseTurnoverCleaningDto` | Sí | — | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:877` |
| `turnoverCleaning.id` | `string` | Sí | formato uuid | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:723` |
| `turnoverCleaning.status` | `string` | Sí | admite null | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:724` |
| `turnoverCleaning.rowVersion` | `number` | Sí | — | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:725` |
| `turnoverCleaning.allowedTransitions` | `array<string>` | Sí | — | — | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:726` |
| `diagnoses` | `array<object>` | Sí | — | — | Diagnósticos del caso con su papel y orden | `src/modules/procedures_perioperative/dto/periop.dto.ts:886` |
| `diagnoses[].id` | `string` | Sí | — | — | Identificador del diagnóstico del caso. | sin fuente |
| `diagnoses[].conditionId` | `string` | Sí | — | — | Condición clínica a la que apunta. | sin fuente |
| `diagnoses[].diagnosisRoleConceptId` | `string` | Sí | — | — | Papel del diagnóstico (principal, secundario, postoperatorio). | sin fuente |
| `diagnoses[].sequenceNumber` | `number` | Sí | — | — | Orden dentro del caso. | sin fuente |
| `team` | `array<TeamMemberSummaryDto>` | Sí | — | — | Valor de team mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:901` |
| `team[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:834` |
| `team[].practitionerProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a practitioner profile. | `src/modules/procedures_perioperative/dto/periop.dto.ts:840` |
| `team[].teamRoleConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a team role concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:846` |
| `team[].statusConceptId` | `string` | Sí | formato uuid | — | Asignado o aceptado | `src/modules/procedures_perioperative/dto/periop.dto.ts:852` |
| `milestones` | `array<object>` | Sí | — | — | Hitos del caso | `src/modules/procedures_perioperative/dto/periop.dto.ts:907` |
| `milestones[].id` | `string` | Sí | — | — | Identificador del hito. | sin fuente |
| `milestones[].milestoneTypeConceptId` | `string` | Sí | — | — | Tipo de hito. | sin fuente |
| `milestones[].statusConceptId` | `string` | Sí | — | — | Estado del hito. | sin fuente |
| `milestones[].plannedAt` | `string` | No | formato date-time | — | Momento planificado, si lo tiene. | sin fuente |
| `milestones[].reachedAt` | `string` | No | formato date-time | — | Momento en que se alcanzó, si ya ocurrió. | sin fuente |
| `preoperativeOrders` | `array<object>` | Sí | — | — | Órdenes preoperatorias | `src/modules/procedures_perioperative/dto/periop.dto.ts:924` |
| `preoperativeOrders[].id` | `string` | Sí | — | — | Identificador de la orden. | sin fuente |
| `preoperativeOrders[].serviceRequestId` | `string` | Sí | — | — | Orden clínica a la que apunta. | sin fuente |
| `preoperativeOrders[].orderRoleConceptId` | `string` | Sí | — | — | Papel de la orden. | sin fuente |
| `preoperativeOrders[].statusConceptId` | `string` | Sí | — | — | Estado: pendiente o verificada. | sin fuente |
| `preoperativeAssessment` | `object` | No | admite null | — | Valoración preoperatoria, si ya se hizo | `src/modules/procedures_perioperative/dto/periop.dto.ts:941` |
| `preoperativeAssessment.id` | `string` | No | — | — | Identificador de la valoración. | sin fuente |
| `preoperativeAssessment.fitnessStatusConceptId` | `string` | No | — | — | Aptitud del paciente para la intervención. | sin fuente |
| `preoperativeAssessment.asaClassConceptId` | `string` | No | — | — | Clase ASA, si se registró. | sin fuente |
| `anesthesiaPlan` | `object` | No | admite null | — | Plan anestésico, si ya se redactó | `src/modules/procedures_perioperative/dto/periop.dto.ts:954` |
| `anesthesiaPlan.id` | `string` | No | — | — | Identificador del plan. | sin fuente |
| `anesthesiaPlan.anesthesiaTypeConceptId` | `string` | No | — | — | Tipo de anestesia previsto. | sin fuente |
| `anesthesiaPlan.statusConceptId` | `string` | No | — | — | Estado del plan: borrador o aprobado. | sin fuente |
| `operativeReports` | `array<object>` | Sí | — | — | Versiones del informe operatorio, de la última a la primera | `src/modules/procedures_perioperative/dto/periop.dto.ts:970` |
| `operativeReports[].id` | `string` | Sí | — | — | Identificador del informe. | sin fuente |
| `operativeReports[].reportVersion` | `number` | Sí | — | — | Número de versión. | sin fuente |
| `operativeReports[].statusConceptId` | `string` | Sí | — | — | Estado: borrador o firmado. | sin fuente |
| `operativeReports[].signedAt` | `string` | No | formato date-time | — | Cuándo se firmó, si ya ocurrió. | sin fuente |
| `operativeSteps` | `array<OperativeStepItemDto>` | Sí | — | — | Pasos de la intervención, en orden | `src/modules/procedures_perioperative/dto/periop.dto.ts:993` |
| `operativeSteps[].id` | `string` | Sí | formato uuid | — | Identificador del paso. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1841` |
| `operativeSteps[].stepNumber` | `number` | Sí | — | — | Orden dentro de la intervención. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1845` |
| `operativeSteps[].stepCodeConceptId` | `string` | Sí | formato uuid | — | Código del paso. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1849` |
| `operativeSteps[].description` | `string` | Sí | — | — | Descripción escrita por quien lo registró. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1853` |
| `operativeSteps[].performedByProfileId` | `string` | No | formato uuid | — | Profesional que lo ejecutó, si se registró. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1857` |
| `operativeSteps[].bodySiteConceptId` | `string` | No | formato uuid | — | Sitio anatómico, si se registró. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1861` |
| `operativeSteps[].lateralityConceptId` | `string` | No | formato uuid | — | Lateralidad, si aplica. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1865` |
| `operativeSteps[].statusConceptId` | `string` | Sí | formato uuid | — | Estado del paso. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1869` |
| `operativeSteps[].startedAt` | `string` | No | formato date-time | — | Cuándo empezó, si se cronometró. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1873` |
| `operativeSteps[].endedAt` | `string` | No | formato date-time | — | Cuándo terminó, si se cronometró. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1877` |
| `findings` | `array<object>` | Sí | — | — | Hallazgos registrados durante la intervención | `src/modules/procedures_perioperative/dto/periop.dto.ts:1000` |
| `findings[].id` | `string` | Sí | — | — | Identificador del hallazgo. | sin fuente |
| `findings[].operativeStepId` | `string` | No | — | — | Paso en el que se halló, si se ató a uno. | sin fuente |
| `findings[].findingCodeConceptId` | `string` | Sí | — | — | Código del hallazgo. | sin fuente |
| `findings[].findingText` | `string` | Sí | — | — | Descripción escrita por quien lo halló. | sin fuente |
| `findings[].bodySiteConceptId` | `string` | No | — | — | Sitio anatómico, si se registró. | sin fuente |
| `findings[].lateralityConceptId` | `string` | No | — | — | Lateralidad, si aplica. | sin fuente |
| `findings[].severityConceptId` | `string` | No | — | — | Severidad, si se graduó. | sin fuente |
| `findings[].recordedByProfileId` | `string` | No | — | — | Profesional que lo registró, si consta. | sin fuente |
| `findings[].recordedAt` | `string` | Sí | formato date-time | — | Cuándo se registró. | sin fuente |
| `implants` | `array<object>` | Sí | — | — | Implantes colocados, con sus identificadores | `src/modules/procedures_perioperative/dto/periop.dto.ts:1033` |
| `implants[].id` | `string` | Sí | — | — | Identificador del implante en el caso. | sin fuente |
| `implants[].procedureId` | `string` | Sí | — | — | Procedimiento clínico al que se imputa. | sin fuente |
| `implants[].implantDeviceId` | `string` | Sí | — | — | Dispositivo implantado. | sin fuente |
| `implants[].implantRoleConceptId` | `string` | Sí | — | — | Papel del implante en la intervención. | sin fuente |
| `implants[].bodySiteConceptId` | `string` | No | — | — | Sitio anatómico, si se registró. | sin fuente |
| `implants[].lateralityConceptId` | `string` | No | — | — | Lateralidad, si aplica. | sin fuente |
| `implants[].implantedAt` | `string` | Sí | formato date-time | — | Cuándo se implantó. | sin fuente |
| `implants[].explantedAt` | `string` | No | formato date-time | — | Cuándo se explantó, si se explantó. | sin fuente |
| `implants[].statusConceptId` | `string` | No | — | — | Estado del implante, si se registró. | sin fuente |
| `implants[].identifiers` | `array<object>` | Sí | — | — | UDI, lote y serie del implante. | sin fuente |
| `implants[].identifiers[].id` | `string` | Sí | — | — | Identificador de la fila. | sin fuente |
| `implants[].identifiers[].identifierTypeConceptId` | `string` | Sí | — | — | Tipo de identificador (UDI-DI, UDI-PI, …). | sin fuente |
| `implants[].identifiers[].identifierValue` | `string` | Sí | — | — | Valor del identificador. | sin fuente |
| `implants[].identifiers[].issuingSystem` | `string` | No | — | — | Sistema emisor, si consta. | sin fuente |
| `implants[].identifiers[].lotNumber` | `string` | No | — | — | Número de lote, si consta. | sin fuente |
| `implants[].identifiers[].serialNumber` | `string` | No | — | — | Número de serie, si consta. | sin fuente |
| `implants[].identifiers[].expirationDate` | `string` | No | formato date-time | — | Vencimiento, si consta. | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-or-f4.int-spec.ts:405` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. PATCH /procedure-cases/{id}

- **Origen:** CONTRATO
- **Nombre:** Modificar el caso quirúrgico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.updateCase` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:167`

### Qué es y para qué sirve (negocio)

Modificar el caso quirúrgico. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /procedure-cases/{id}` la atiende `PeriopController.updateCase` (src/modules/procedures_perioperative/controllers/periop.controller.ts:167). Exige sesión con alguno de los roles SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN. Valida el cuerpo como `UpdateCaseDto` (5 campos, 0 obligatorios). Delega en `PeriopCasesService.updateCase`. Crea filas en messaging.domain_events, messaging.outbox_messages, procedures_perioperative.procedure_case_status_history. Actualiza procedures_perioperative.procedure_case_team_members, procedures_perioperative.procedure_cases. Lee clinical.encounter_locations, messaging.outbox_messages, practice.care_space_blocks, practice.care_spaces, practice.practice_settings, practice.practice_sites, procedures_perioperative.operating_room_blocks, procedures_perioperative.procedure_case_diagnoses y 3 más. Publica periop.case.reacceptance_required.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:167` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:167` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | LEE | LEE | POR_SQL | PeriopController.updateCase → PeriopCasesService.updateCase → OperatingRoomValidator.validate → PracticeCareSpaceOpsAdapter.getOperationalState → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.occupancy → CareSpaceOpsRepository.occupancy | `src/modules/practice/repositories/care-space-ops.repository.ts:178` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PeriopController.updateCase → PeriopCasesService.updateCase → PeriopReacceptanceService.invalidate → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PeriopController.updateCase → PeriopCasesService.updateCase → PeriopReacceptanceService.invalidate → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PeriopController.updateCase → PeriopCasesService.updateCase → PeriopReacceptanceService.invalidate → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `practice.care_space_blocks` | LEE | LEE | DIRECTA | PeriopController.updateCase → PeriopCasesService.updateCase → OperatingRoomValidator.validate → PracticeCareSpaceOpsAdapter.assertBookable → CareSpaceOpsRepository.openBlocks | `src/modules/practice/repositories/care-space-ops.repository.ts:223` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | PeriopController.updateCase → PeriopCasesService.updateCase → OperatingRoomValidator.validate → PracticeCareSpaceOpsAdapter.getOperationalState → PracticeCareSpaceOpsAdapter.load → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.practice_settings` | LEE | LEE | POR_SQL | PeriopController.updateCase → PeriopCasesService.updateCase → OperatingRoomValidator.validate → PracticeCareSpaceOpsAdapter.getOperationalState → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.settings → CareSpaceOpsRepository.settings | `src/modules/practice/repositories/care-space-ops.repository.ts:431` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PeriopController.updateCase → PeriopCasesService.updateCase → OperatingRoomValidator.validate → PracticeCareSpaceOpsAdapter.getOperationalState → PracticeCareSpaceOpsAdapter.load → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `procedures_perioperative.operating_room_blocks` | LEE | LEE | DIRECTA | PeriopController.updateCase → PeriopCasesService.updateCase → OperatingRoomValidator.validate | `src/modules/procedures_perioperative/services/or/operating-room.validator.ts:118` |
| `procedures_perioperative.procedure_case_diagnoses` | LEE | LEE | DIRECTA | PeriopController.updateCase → PeriopCasesService.updateCase → PeriopCasesService.caseHasBlockingDependencies → PeriopCasesRepository.findDiagnosesByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:589` |
| `procedures_perioperative.procedure_case_status_history` | ESCRIBE | CREA | DIRECTA | PeriopController.updateCase → PeriopCasesService.updateCase → PeriopReacceptanceService.invalidate → PeriopCasesRepository.createStatusHistory | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:437` |
| `procedures_perioperative.procedure_case_team_members` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.updateCase → PeriopCasesService.updateCase → PeriopReacceptanceService.invalidate | `src/modules/procedures_perioperative/services/periop-reacceptance.service.ts:97` |
| `procedures_perioperative.procedure_case_team_members` | LEE | LEE | DIRECTA | PeriopController.updateCase → PeriopCasesService.updateCase → PeriopCasesService.caseHasBlockingDependencies → PeriopCasesRepository.findTeamByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:647` |
| `procedures_perioperative.procedure_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.updateCase → PeriopCasesService.updateCase → PeriopReacceptanceService.invalidate | `src/modules/procedures_perioperative/services/periop-reacceptance.service.ts:115` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | POR_SQL | PeriopController.updateCase → PeriopCasesService.updateCase → OperatingRoomValidator.validate | `src/modules/procedures_perioperative/services/or/operating-room.validator.ts:152` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | PeriopController.updateCase → PeriopCasesService.updateCase → OperatingRoomValidator.validate | `src/modules/procedures_perioperative/services/or/operating-room.validator.ts:107` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `periop.case.reacceptance_required` | `src/modules/procedures_perioperative/services/periop-reacceptance.service.ts:121` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateCaseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paciente de la intervención. Sólo corregible con el caso en borrador y sin dependencias (CAN-INT-001). | `src/modules/procedures_perioperative/dto/periop.dto.ts:214` |
| `priority` | `string` | No | valores: ROUTINE, URGENT, STAT | `@IsOptional()` `@IsIn(CASE_PRIORITIES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:222` |
| `scheduledStartAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:230` |
| `scheduledEndAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:238` |
| `urgencyReasonText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:246` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "priority": "ROUTINE",
  "scheduledStartAt": "2026-07-31T12:00:00.000Z",
  "scheduledEndAt": "2026-07-31T12:00:00.000Z",
  "urgencyReasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<UpdateCaseResponseDto>` · DTO `UpdateCaseResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:257` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:263` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Paciente vigente del caso | `src/modules/procedures_perioperative/dto/periop.dto.ts:269` |
| `patientChanged` | `boolean` | Sí | — | — | true si se corrigió el paciente del caso | `src/modules/procedures_perioperative/dto/periop.dto.ts:275` |
| `reacceptanceRequired` | `boolean` | Sí | — | — | true si la modificación fue relevante y el equipo debe volver a aceptar | `src/modules/procedures_perioperative/dto/periop.dto.ts:284` |
| `acceptancesInvalidated` | `number` | Sí | — | — | Aceptaciones que quedaron invalidadas por la modificación relevante | `src/modules/procedures_perioperative/dto/periop.dto.ts:293` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Sitio no encontrado |
| 409 | `CONFLICT` | ConflictException: La ventana cae en un bloque de otro dueño; ConflictException: El quirófano ya está reservado en esa ventana |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso está cancelado; PreconditionFailedException: CAN-INT-001: el paciente de la intervención no puede cambiarse una vez confirmada; cancele el caso y cree uno nuevo; PreconditionFailedException: CAN-INT-001: el paciente no puede cambiarse: el caso ya tiene asignaciones o evidencias asociadas; PreconditionFailedException: El caso debe terminar después de empezar; PreconditionFailedException: El quirófano es de otra sede; PreconditionFailedException: El espacio no es un quirófano; PreconditionFailedException: El quirófano no está disponible en esa ventana; PreconditionFailedException: El quirófano no tiene recurso agendable activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:81` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /procedure-cases/{id}/anesthesia-events

- **Origen:** CONTRATO
- **Nombre:** Anotar un evento intraoperatorio de anestesia
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.recordAnesthesiaEvent` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:480`

### Qué es y para qué sirve (negocio)

Anotar un evento intraoperatorio de anestesia. Caso de uso UC-53-07: Eventos intraoperatorios. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:91`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/anesthesia-events` la atiende `PeriopController.recordAnesthesiaEvent` (src/modules/procedures_perioperative/controllers/periop.controller.ts:480). Exige sesión con alguno de los roles ANESTHESIOLOGIST, PERIOP_NURSE, PERIOP_ADMIN. Valida el cuerpo como `RecordAnesthesiaEventDto` (8 campos, 2 obligatorios). Delega en `PeriopPreopService.recordAnesthesiaEvent`. Crea filas en procedures_perioperative.anesthesia_events, procedures_perioperative.operating_room_utilization_events, procedures_perioperative.procedure_case_milestones, procedures_perioperative.procedure_case_status_history. Lee procedures_perioperative.anesthesia_plans, procedures_perioperative.procedure_case_milestones.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ANESTHESIOLOGIST, PERIOP_NURSE, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:480` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:480` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.anesthesia_events` | ESCRIBE | CREA | DIRECTA | PeriopController.recordAnesthesiaEvent → PeriopPreopService.recordAnesthesiaEvent → PeriopPreopRepository.createAnesthesiaEvent | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:651` |
| `procedures_perioperative.anesthesia_plans` | LEE | LEE | DIRECTA | PeriopController.recordAnesthesiaEvent → PeriopPreopService.recordAnesthesiaEvent → PeriopPreopRepository.findAnesthesiaPlanByCase | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:551` |
| `procedures_perioperative.operating_room_utilization_events` | ESCRIBE | CREA | DIRECTA | PeriopController.recordAnesthesiaEvent → PeriopPreopService.recordAnesthesiaEvent → PeriopCasesRepository.createUtilizationEvent | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:758` |
| `procedures_perioperative.procedure_case_milestones` | ESCRIBE | CREA | DIRECTA | PeriopController.recordAnesthesiaEvent → PeriopPreopService.recordAnesthesiaEvent → PeriopCasesRepository.createMilestone | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:495` |
| `procedures_perioperative.procedure_case_milestones` | LEE | LEE | DIRECTA | PeriopController.recordAnesthesiaEvent → PeriopPreopService.recordAnesthesiaEvent → PeriopCasesRepository.findMilestone | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:524` |
| `procedures_perioperative.procedure_case_status_history` | ESCRIBE | CREA | DIRECTA | PeriopController.recordAnesthesiaEvent → PeriopPreopService.recordAnesthesiaEvent → PeriopCasesRepository.createStatusHistory | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:437` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordAnesthesiaEventDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `eventType` | `string` | Sí | valores: INDUCTION, INTUBATION, MEDICATION, VITALS, EMERGENCE, COMPLICATION | `@IsIn(ANESTHESIA_EVENT_TYPES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1667` |
| `occurredAt` | `string` | Sí | formato date-time | `@IsISO8601()` | Momento del evento | `src/modules/procedures_perioperative/dto/periop.dto.ts:1674` |
| `severity` | `string` | No | valores: ROUTINE, MINOR, MAJOR, CRITICAL | `@IsOptional()` `@IsIn(CLINICAL_SEVERITIES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1682` |
| `medicationAdministrationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1690` |
| `observationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1698` |
| `deviceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1706` |
| `performedByProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1714` |
| `detailsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Detalle del evento | `src/modules/procedures_perioperative/dto/periop.dto.ts:1722` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "eventType": "INDUCTION",
  "occurredAt": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "eventType": "INDUCTION",
  "occurredAt": "2026-07-31T12:00:00.000Z",
  "severity": "ROUTINE",
  "medicationAdministrationId": "00000000-0000-4000-8000-000000000001",
  "observationId": "00000000-0000-4000-8000-000000000001",
  "deviceId": "00000000-0000-4000-8000-000000000001",
  "performedByProfileId": "00000000-0000-4000-8000-000000000001",
  "detailsJson": {}
}
```

</details>

### Respuesta — `Promise<AnesthesiaEventResponseDto>` · DTO `AnesthesiaEventResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1733` |
| `eventTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a event type concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1739` |
| `milestoneId` | `string` | No | formato uuid | — | Hito creado si el evento fue inducción o despertar | `src/modules/procedures_perioperative/dto/periop.dto.ts:1748` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso está cancelado; PreconditionFailedException: La inducción exige un plan de anestesia aprobado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:198` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `UC-53-07`

---

## 14. POST /procedure-cases/{id}/anesthesia-plans

- **Origen:** CONTRATO
- **Nombre:** Registrar el plan de anestesia y la valoración de vía aérea
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.createAnesthesiaPlan` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:440`

### Qué es y para qué sirve (negocio)

Registrar el plan de anestesia y la valoración de vía aérea. Caso de uso UC-53-06: Plan de anestesia. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:90`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/anesthesia-plans` la atiende `PeriopController.createAnesthesiaPlan` (src/modules/procedures_perioperative/controllers/periop.controller.ts:440). Exige sesión con alguno de los roles ANESTHESIOLOGIST, PERIOP_ADMIN. Valida el cuerpo como `CreateAnesthesiaPlanDto` (13 campos, 5 obligatorios). Delega en `PeriopPreopService.createAnesthesiaPlan`. Crea filas en procedures_perioperative.anesthesia_airway_assessments, procedures_perioperative.anesthesia_plans. Lee procedures_perioperative.anesthesia_plans.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ANESTHESIOLOGIST, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:440` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:440` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.anesthesia_airway_assessments` | ESCRIBE | CREA | DIRECTA | PeriopController.createAnesthesiaPlan → PeriopPreopService.createAnesthesiaPlan → PeriopPreopRepository.createAirwayAssessment | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:588` |
| `procedures_perioperative.anesthesia_plans` | ESCRIBE | CREA | DIRECTA | PeriopController.createAnesthesiaPlan → PeriopPreopService.createAnesthesiaPlan → PeriopPreopRepository.createAnesthesiaPlan | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:504` |
| `procedures_perioperative.anesthesia_plans` | LEE | LEE | DIRECTA | PeriopController.createAnesthesiaPlan → PeriopPreopService.createAnesthesiaPlan → PeriopPreopRepository.findAnesthesiaPlanByCase | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:551` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateAnesthesiaPlanDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `anesthesiologistProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1531` |
| `anesthesiaType` | `string` | Sí | valores: GENERAL, REGIONAL, LOCAL, SEDATION | `@IsIn(ANESTHESIA_TYPES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1538` |
| `airwayPlan` | `string` | No | valores: ETT, LMA, MASK | `@IsOptional()` `@IsIn(AIRWAY_PLANS)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1546` |
| `monitoringPlanJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Monitorización planificada | `src/modules/procedures_perioperative/dto/periop.dto.ts:1554` |
| `medicationsPlanJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Medicación planificada | `src/modules/procedures_perioperative/dto/periop.dto.ts:1562` |
| `postoperativeAnalgesiaPlanText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1570` |
| `airwayAssessment` | `AirwayAssessmentDto` | Sí | — | `@ValidateNested()` `@Type(() => AirwayAssessmentDto)` | Valoración de vía aérea | `src/modules/procedures_perioperative/dto/periop.dto.ts:1581` |
| `airwayAssessment.assessedByProfileId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `airwayAssessment.mallampati` | `string` | No | valores: I, II, III, IV | — | — | sin fuente |
| `airwayAssessment.mouthOpeningMm` | `string` | No | — | — | Apertura bucal en milímetros | sin fuente |
| `airwayAssessment.thyromentalDistanceMm` | `string` | No | — | — | Distancia tiromentoniana en milímetros | sin fuente |
| `airwayAssessment.difficultAirwayExpected` | `boolean` | Sí | — | — | Se anticipa vía aérea difícil | sin fuente |
| `airwayAssessment.rescuePlanText` | `string` | No | — | — | Plan de rescate; obligatorio si se anticipa vía aérea difícil | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "anesthesiologistProfileId": "00000000-0000-4000-8000-000000000001",
  "anesthesiaType": "GENERAL",
  "airwayAssessment": {
    "assessedByProfileId": "00000000-0000-4000-8000-000000000001",
    "difficultAirwayExpected": true
  }
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "anesthesiologistProfileId": "00000000-0000-4000-8000-000000000001",
  "anesthesiaType": "GENERAL",
  "airwayPlan": "ETT",
  "monitoringPlanJson": {},
  "medicationsPlanJson": {},
  "postoperativeAnalgesiaPlanText": "valor-ejemplo",
  "airwayAssessment": {
    "assessedByProfileId": "00000000-0000-4000-8000-000000000001",
    "mallampati": "I",
    "mouthOpeningMm": "valor-ejemplo",
    "thyromentalDistanceMm": "valor-ejemplo",
    "difficultAirwayExpected": true,
    "rescuePlanText": "valor-ejemplo"
  }
}
```

</details>

### Respuesta — `Promise<AnesthesiaPlanResponseDto>` · DTO `AnesthesiaPlanResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1592` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1598` |
| `airwayAssessmentId` | `string` | Sí | formato uuid | — | Identificador asociado a airway assessment. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1604` |
| `difficultAirwayExpected` | `boolean` | Sí | — | — | true si se anticipa vía aérea difícil | `src/modules/procedures_perioperative/dto/periop.dto.ts:1610` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El caso ya tiene plan de anestesia |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una vía aérea difícil anticipada necesita plan de rescate; PreconditionFailedException: El caso está cancelado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:175` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `UC-53-06`

---

## 15. POST /procedure-cases/{id}/anesthesia-plans/{planId}/approve

- **Origen:** CONTRATO
- **Nombre:** Aprobar el plan de anestesia
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.approveAnesthesiaPlan` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:462`

### Qué es y para qué sirve (negocio)

Aprobar el plan de anestesia. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/anesthesia-plans/{planId}/approve` la atiende `PeriopController.approveAnesthesiaPlan` (src/modules/procedures_perioperative/controllers/periop.controller.ts:462). Exige sesión con alguno de los roles ANESTHESIOLOGIST, PERIOP_ADMIN. Delega en `PeriopPreopService.approveAnesthesiaPlan`. Actualiza procedures_perioperative.anesthesia_plans. Lee procedures_perioperative.anesthesia_plans.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ANESTHESIOLOGIST, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:462` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, planId | `src/modules/procedures_perioperative/controllers/periop.controller.ts:462` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.anesthesia_plans` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.approveAnesthesiaPlan → PeriopPreopService.approveAnesthesiaPlan | `src/modules/procedures_perioperative/services/periop-preop.service.ts:808` |
| `procedures_perioperative.anesthesia_plans` | LEE | LEE | DIRECTA | PeriopController.approveAnesthesiaPlan → PeriopPreopService.approveAnesthesiaPlan → PeriopPreopRepository.findAnesthesiaPlanForUpdate | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:533` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `planId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ApprovePlanResponseDto>` · DTO `ApprovePlanResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1621` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1627` |
| `anesthesiologistProfileId` | `string` | Sí | formato uuid | — | Anestesiólogo asignado al caso | `src/modules/procedures_perioperative/dto/periop.dto.ts:1636` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plan de anestesia no encontrado |
| 409 | `CONFLICT` | ConflictException: El plan ya está aprobado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El plan pertenece a otro caso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:176` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. POST /procedure-cases/{id}/cancel

- **Origen:** CONTRATO
- **Nombre:** Cancelar el caso quirúrgico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.cancelCase` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:704`

### Qué es y para qué sirve (negocio)

Cancelar el caso quirúrgico. Caso de uso UC-53-13: Cancelar y liberar quirófano. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:97`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/cancel` la atiende `PeriopController.cancelCase` (src/modules/procedures_perioperative/controllers/periop.controller.ts:704). Exige sesión con alguno de los roles SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN. Valida el cuerpo como `CancelCaseDto` (5 campos, 3 obligatorios). Delega en `PeriopCasesService.cancelCase`. Crea filas en procedures_perioperative.operating_room_utilization_events, procedures_perioperative.procedure_cancellations, procedures_perioperative.procedure_case_status_history.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:704` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:704` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.operating_room_utilization_events` | ESCRIBE | CREA | DIRECTA | PeriopController.cancelCase → PeriopCasesService.cancelCase → PeriopCasesRepository.createUtilizationEvent | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:758` |
| `procedures_perioperative.procedure_cancellations` | ESCRIBE | CREA | DIRECTA | PeriopController.cancelCase → PeriopCasesService.cancelCase → PeriopCasesRepository.createCancellation | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:823` |
| `procedures_perioperative.procedure_case_status_history` | ESCRIBE | CREA | DIRECTA | PeriopController.cancelCase → PeriopCasesService.cancelCase → PeriopCasesRepository.createStatusHistory | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:437` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CancelCaseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `cancellationReasonConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Motivo de la cancelación | `src/modules/procedures_perioperative/dto/periop.dto.ts:2783` |
| `category` | `string` | Sí | valores: PATIENT, FACILITY, CLINICAL | `@IsIn(CANCELLATION_CATEGORIES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2790` |
| `preventable` | `boolean` | Sí | — | `@IsBoolean()` | Si era evitable; es lo que mide la calidad del proceso | `src/modules/procedures_perioperative/dto/periop.dto.ts:2799` |
| `explanationText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2807` |
| `rescheduleRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2815` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "cancellationReasonConceptId": "00000000-0000-4000-8000-000000000001",
  "category": "PATIENT",
  "preventable": true
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "cancellationReasonConceptId": "00000000-0000-4000-8000-000000000001",
  "category": "PATIENT",
  "preventable": true,
  "explanationText": "valor-ejemplo",
  "rescheduleRequired": false
}
```

</details>

### Respuesta — `Promise<CancelCaseResponseDto>` · DTO `CancelCaseResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2826` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2832` |
| `cancellationId` | `string` | Sí | formato uuid | — | Registro de la cancelación | `src/modules/procedures_perioperative/dto/periop.dto.ts:2838` |
| `operatingRoomReleased` | `boolean` | Sí | — | — | true si se liberó el quirófano reservado | `src/modules/procedures_perioperative/dto/periop.dto.ts:2844` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El caso ya está cancelado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso no admite cancelación en su estado actual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:339` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `UC-53-13`

---

## 17. POST /procedure-cases/{id}/charge-items/post

- **Origen:** CONTRATO
- **Nombre:** Generar los cargos y consolidar el uso del quirófano
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.postCharges` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:725`

### Qué es y para qué sirve (negocio)

Generar los cargos y consolidar el uso del quirófano. Caso de uso UC-53-14: Cargos y utilización. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:98`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/charge-items/post` la atiende `PeriopController.postCharges` (src/modules/procedures_perioperative/controllers/periop.controller.ts:725). Exige sesión con alguno de los roles PERIOP_ADMIN, BILLING. Valida el cuerpo como `PostChargesDto` (8 campos, 4 obligatorios). Delega en `PeriopCasesService.postCharges`. Crea filas en procedures_perioperative.operating_room_utilization_events, procedures_perioperative.procedure_charge_items. Lee procedures_perioperative.procedure_charge_items.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PERIOP_ADMIN, BILLING | `src/modules/procedures_perioperative/controllers/periop.controller.ts:725` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:725` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.operating_room_utilization_events` | ESCRIBE | CREA | DIRECTA | PeriopController.postCharges → PeriopCasesService.postCharges → PeriopCasesRepository.createUtilizationEvent | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:758` |
| `procedures_perioperative.procedure_charge_items` | ESCRIBE | CREA | DIRECTA | PeriopController.postCharges → PeriopCasesService.postCharges → PeriopCasesRepository.createChargeItem | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:854` |
| `procedures_perioperative.procedure_charge_items` | LEE | LEE | DIRECTA | PeriopController.postCharges → PeriopCasesService.postCharges → PeriopCasesRepository.findChargeItemsForUpdate | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:890` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PostChargesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ChargeItemDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ChargeItemDto)` | Cargos a generar, al menos uno | `src/modules/procedures_perioperative/dto/periop.dto.ts:2914` |
| `items[].chargeType` | `string` | Sí | valores: PROCEDURE, IMPLANT, SUPPLY, OR_TIME | `@IsIn(CHARGE_TYPES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2864` |
| `items[].billableItemId` | `string` | Sí | formato uuid | `@IsUUID()` | Concepto facturable del catálogo | `src/modules/procedures_perioperative/dto/periop.dto.ts:2874` |
| `items[].quantity` | `string` | Sí | — | `@IsNumberString()` | Cantidad, como cadena decimal | `src/modules/procedures_perioperative/dto/periop.dto.ts:2881` |
| `items[].unitPrice` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Precio unitario | `src/modules/procedures_perioperative/dto/periop.dto.ts:2889` |
| `items[].currencyCode` | `string` | No | longitud máxima 3 | `@IsOptional()` `@IsString()` `@MaxLength(3)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2898` |
| `consolidateUtilization` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Consolidar además el uso real del quirófano | `src/modules/procedures_perioperative/dto/periop.dto.ts:2925` |
| `turnoverSeconds` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Segundos de recambio hasta el siguiente caso | `src/modules/procedures_perioperative/dto/periop.dto.ts:2936` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "items": [
    {
      "chargeType": "PROCEDURE",
      "billableItemId": "00000000-0000-4000-8000-000000000001",
      "quantity": "valor-ejemplo"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "items": [
    {
      "chargeType": "PROCEDURE",
      "billableItemId": "00000000-0000-4000-8000-000000000001",
      "quantity": "valor-ejemplo",
      "unitPrice": "valor-ejemplo",
      "currencyCode": "BOB"
    }
  ],
  "consolidateUtilization": true,
  "turnoverSeconds": 1
}
```

</details>

### Respuesta — `Promise<PostChargesResponseDto>` · DTO `PostChargesResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `procedureCaseId` | `string` | Sí | formato uuid | — | Identificador asociado a procedure case. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2947` |
| `charged` | `number` | Sí | — | — | Cargos generados | `src/modules/procedures_perioperative/dto/periop.dto.ts:2953` |
| `totalAmount` | `string` | Sí | — | — | Importe total de los cargos | `src/modules/procedures_perioperative/dto/periop.dto.ts:2959` |
| `actualDurationSeconds` | `number` | No | — | — | Duración real del caso, en segundos | `src/modules/procedures_perioperative/dto/periop.dto.ts:2965` |
| `scheduleVarianceSeconds` | `number` | No | — | — | Desviación frente a lo programado, en segundos | `src/modules/procedures_perioperative/dto/periop.dto.ts:2973` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El caso ya tiene cargos emitidos |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El cargo de sala se genera automáticamente al completar el caso; PreconditionFailedException: Sólo se factura un caso completado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:340` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `UC-53-14`

---

## 18. POST /procedure-cases/{id}/confirm

- **Origen:** CONTRATO
- **Nombre:** Confirmar la intervención verificando las credenciales del equipo
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.confirmCase` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:189`

### Qué es y para qué sirve (negocio)

Confirmar la intervención verificando las credenciales del equipo. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/confirm` la atiende `PeriopController.confirmCase` (src/modules/procedures_perioperative/controllers/periop.controller.ts:189). Exige sesión con alguno de los roles SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN. Delega en `PeriopCasesService.confirmCase`. Crea filas en audit.audit_log, messaging.domain_events, messaging.outbox_messages, procedures_perioperative.procedure_case_status_history. Lee audit.audit_log, iam.sessions, messaging.outbox_messages, procedures_perioperative.procedure_case_team_members, profiles.professional_credentials. Publica periop.case.confirmation_blocked.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:189` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:189` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PeriopController.confirmCase → PeriopCasesService.confirmCase → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PeriopController.confirmCase → PeriopCasesService.confirmCase → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | PeriopController.confirmCase → PeriopCasesService.confirmCase → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PeriopController.confirmCase → PeriopCasesService.confirmCase → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PeriopController.confirmCase → PeriopCasesService.confirmCase → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PeriopController.confirmCase → PeriopCasesService.confirmCase → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `procedures_perioperative.procedure_case_status_history` | ESCRIBE | CREA | DIRECTA | PeriopController.confirmCase → PeriopCasesService.confirmCase → PeriopCasesRepository.createStatusHistory | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:437` |
| `procedures_perioperative.procedure_case_team_members` | LEE | LEE | DIRECTA | PeriopController.confirmCase → PeriopCasesService.confirmCase → PeriopCasesRepository.findTeamByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:647` |
| `profiles.professional_credentials` | LEE | LEE | DIRECTA | PeriopController.confirmCase → PeriopCasesService.confirmCase → ProfessionalCredentialsRepository.hasCurrentCredential | `src/modules/profiles/infrastructure/repositories/professional-credentials.repository.ts:155` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `periop.case.confirmation_blocked` | `src/modules/procedures_perioperative/services/periop-cases.service.ts:659` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ConfirmCaseResponseDto>` · DTO `ConfirmCaseResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:304` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado tras confirmar | `src/modules/procedures_perioperative/dto/periop.dto.ts:310` |
| `teamVerified` | `number` | Sí | — | — | Miembros del equipo con credencial verificada al confirmar | `src/modules/procedures_perioperative/dto/periop.dto.ts:318` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso está cancelado; PreconditionFailedException: El caso no admite confirmación en su estado actual; PreconditionFailedException: CAN-INT-002: no puede confirmarse: hay integrantes del equipo sin credencial profesional vigente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:82` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. POST /procedure-cases/{id}/diagnoses

- **Origen:** CONTRATO
- **Nombre:** Registrar los diagnósticos del caso
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.addDiagnoses` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:211`

### Qué es y para qué sirve (negocio)

Registrar los diagnósticos del caso. Caso de uso UC-53-02: Diagnósticos y equipo. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:86`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/diagnoses` la atiende `PeriopController.addDiagnoses` (src/modules/procedures_perioperative/controllers/periop.controller.ts:211). Exige sesión con alguno de los roles SURGEON, PERIOP_ADMIN. Valida el cuerpo como `AddDiagnosesDto` (5 campos, 2 obligatorios). Delega en `PeriopCasesService.addDiagnoses`. Crea filas en audit.audit_log, audit.conditions_history, clinical.conditions, procedures_perioperative.procedure_case_diagnoses. Actualiza audit.conditions_history. Lee audit.audit_log, audit.conditions_history, clinical.conditions, clinical.encounters, iam.sessions, procedures_perioperative.procedure_case_diagnoses.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:211` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:211` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PeriopController.addDiagnoses → PeriopCasesService.addDiagnoses → PeriopCasesService.ensureCondition → ConditionsService.create → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PeriopController.addDiagnoses → PeriopCasesService.addDiagnoses → PeriopCasesService.ensureCondition → ConditionsService.create → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `audit.conditions_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | PeriopController.addDiagnoses → PeriopCasesService.addDiagnoses → PeriopCasesService.ensureCondition → ConditionsService.create | `src/modules/clinical/services/conditions.service.ts:275` |
| `audit.conditions_history` | ESCRIBE | CREA | POR_REGISTRO | PeriopController.addDiagnoses → PeriopCasesService.addDiagnoses → PeriopCasesService.ensureCondition → ConditionsService.create | `src/modules/clinical/services/conditions.service.ts:275` |
| `audit.conditions_history` | LEE | LEE | POR_REGISTRO | PeriopController.addDiagnoses → PeriopCasesService.addDiagnoses → PeriopCasesService.ensureCondition → ConditionsService.create | `src/modules/clinical/services/conditions.service.ts:275` |
| `clinical.conditions` | ESCRIBE | CREA | DIRECTA | PeriopController.addDiagnoses → PeriopCasesService.addDiagnoses → PeriopCasesService.ensureCondition → ConditionsService.create → ConditionsRepository.create | `src/modules/clinical/repositories/conditions.repository.ts:153` |
| `clinical.conditions` | LEE | LEE | DIRECTA | PeriopController.addDiagnoses → PeriopCasesService.addDiagnoses → PeriopCasesService.ensureCondition → ConditionsService.create → ConditionsRepository.findActiveByCode | `src/modules/clinical/repositories/conditions.repository.ts:137` |
| `clinical.encounters` | LEE | LEE | DIRECTA | PeriopController.addDiagnoses → PeriopCasesService.addDiagnoses → PeriopCasesService.ensureCondition → ConditionsService.create → ConditionsService.assertEncounterBelongsToPatient → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:174` |
| `iam.sessions` | LEE | LEE | POR_SQL | PeriopController.addDiagnoses → PeriopCasesService.addDiagnoses → PeriopCasesService.ensureCondition → ConditionsService.create → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `procedures_perioperative.procedure_case_diagnoses` | ESCRIBE | CREA | DIRECTA | PeriopController.addDiagnoses → PeriopCasesService.addDiagnoses → PeriopCasesRepository.createDiagnosis | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:564` |
| `procedures_perioperative.procedure_case_diagnoses` | LEE | LEE | DIRECTA | PeriopController.addDiagnoses → PeriopCasesService.addDiagnoses → PeriopCasesRepository.findDiagnosesByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:589` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AddDiagnosesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `diagnoses` | `array<CaseDiagnosisDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => CaseDiagnosisDto)` | Diagnósticos del caso, al menos uno | `src/modules/procedures_perioperative/dto/periop.dto.ts:394` |
| `diagnoses[].conditionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Condición ya registrada en la historia clínica | `src/modules/procedures_perioperative/dto/periop.dto.ts:344` |
| `diagnoses[].conditionCodeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Código de la condición a registrar si aún no existe | `src/modules/procedures_perioperative/dto/periop.dto.ts:363` |
| `diagnoses[].role` | `string` | Sí | valores: PRIMARY, SECONDARY, POSTOPERATIVE | `@IsIn(DIAGNOSIS_ROLES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:370` |
| `diagnoses[].presentOnAdmission` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Presente al ingresar | `src/modules/procedures_perioperative/dto/periop.dto.ts:378` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "diagnoses": [
    {
      "role": "PRIMARY"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "diagnoses": [
    {
      "conditionId": "00000000-0000-4000-8000-000000000001",
      "conditionCodeConceptId": "00000000-0000-4000-8000-000000000001",
      "role": "PRIMARY",
      "presentOnAdmission": false
    }
  ]
}
```

</details>

### Respuesta — `Promise<DiagnosesResponseDto>` · DTO `DiagnosesResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `procedureCaseId` | `string` | Sí | formato uuid | — | Identificador asociado a procedure case. | `src/modules/procedures_perioperative/dto/periop.dto.ts:405` |
| `diagnosisIds` | `array<string>` | Sí | formato uuid | — | Valor de diagnosis ids mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:411` |
| `skipped` | `number` | Sí | — | — | Diagnósticos que ya estaban registrados y se omitieron | `src/modules/procedures_perioperative/dto/periop.dto.ts:419` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado |
| 409 | `CONFLICT` | ConflictException: El caso sólo admite un diagnóstico principal; ConflictException: El paciente ya tiene esa condición activa |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso está cancelado; PreconditionFailedException: Indique la condición por `conditionId` o por `conditionCodeConceptId`; PreconditionFailedException: Un diagnóstico se registra presuntivo o confirmado. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:99` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `UC-53-02`

---

## 20. POST /procedure-cases/{id}/findings

- **Origen:** CONTRATO
- **Nombre:** Registrar un hallazgo operatorio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.recordFinding` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:520`

### Qué es y para qué sirve (negocio)

Registrar un hallazgo operatorio. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/findings` la atiende `PeriopController.recordFinding` (src/modules/procedures_perioperative/controllers/periop.controller.ts:520). Exige sesión con alguno de los roles SURGEON, PERIOP_ADMIN. Valida el cuerpo como `RecordFindingDto` (8 campos, 2 obligatorios). Delega en `PeriopIntraopService.recordFinding`. Crea filas en procedures_perioperative.operative_findings, procedures_perioperative.procedure_body_sites. Lee procedures_perioperative.operative_steps, procedures_perioperative.procedure_body_sites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:520` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:520` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.operative_findings` | ESCRIBE | CREA | DIRECTA | PeriopController.recordFinding → PeriopIntraopService.recordFinding → PeriopIntraopRepository.createFinding | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:288` |
| `procedures_perioperative.operative_steps` | LEE | LEE | DIRECTA | PeriopController.recordFinding → PeriopIntraopService.recordFinding → PeriopIntraopRepository.findStepById | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:213` |
| `procedures_perioperative.procedure_body_sites` | ESCRIBE | CREA | DIRECTA | PeriopController.recordFinding → PeriopIntraopService.recordFinding → PeriopIntraopRepository.createBodySite | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:339` |
| `procedures_perioperative.procedure_body_sites` | LEE | LEE | DIRECTA | PeriopController.recordFinding → PeriopIntraopService.recordFinding → PeriopIntraopRepository.findBodySite | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:366` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordFindingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `findingCodeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Código del hallazgo | `src/modules/procedures_perioperative/dto/periop.dto.ts:1887` |
| `findingText` | `string` | Sí | — | `@IsString()` | Qué se encontró | `src/modules/procedures_perioperative/dto/periop.dto.ts:1894` |
| `operativeStepId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paso en el que se observó | `src/modules/procedures_perioperative/dto/periop.dto.ts:1905` |
| `bodySiteConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1913` |
| `laterality` | `string` | No | valores: LEFT, RIGHT, BILATERAL | `@IsOptional()` `@IsIn(LATERALITIES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1921` |
| `severity` | `string` | No | valores: ROUTINE, MINOR, MAJOR, CRITICAL | `@IsOptional()` `@IsIn(CLINICAL_SEVERITIES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1929` |
| `observationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1937` |
| `recordedByProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1945` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "findingCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "findingText": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "findingCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "findingText": "valor-ejemplo",
  "operativeStepId": "00000000-0000-4000-8000-000000000001",
  "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
  "laterality": "LEFT",
  "severity": "ROUTINE",
  "observationId": "00000000-0000-4000-8000-000000000001",
  "recordedByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<FindingResponseDto>` · DTO `FindingResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1956` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Paso operatorio no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso no está en curso; PreconditionFailedException: El paso pertenece a otro caso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:218` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. POST /procedure-cases/{id}/implants

- **Origen:** CONTRATO
- **Nombre:** Registrar un implante con su trazabilidad UDI, lote o serie
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.recordImplant` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:542`

### Qué es y para qué sirve (negocio)

Registrar un implante con su trazabilidad UDI, lote o serie. Caso de uso UC-53-09: Implantes con UDI, lote y serie. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:93`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/implants` la atiende `PeriopController.recordImplant` (src/modules/procedures_perioperative/controllers/periop.controller.ts:542). Exige sesión con alguno de los roles SURGEON, PERIOP_NURSE, PERIOP_ADMIN. Valida el cuerpo como `RecordImplantDto` (13 campos, 6 obligatorios). Delega en `PeriopIntraopService.recordImplant`. Crea filas en procedures_perioperative.implant_identifiers, procedures_perioperative.procedure_devices, procedures_perioperative.procedure_implants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, PERIOP_NURSE, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:542` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:542` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.implant_identifiers` | ESCRIBE | CREA | DIRECTA | PeriopController.recordImplant → PeriopIntraopService.recordImplant → PeriopIntraopRepository.createImplantIdentifier | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:430` |
| `procedures_perioperative.procedure_devices` | ESCRIBE | CREA | DIRECTA | PeriopController.recordImplant → PeriopIntraopService.recordImplant → PeriopIntraopRepository.createDevice | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:482` |
| `procedures_perioperative.procedure_implants` | ESCRIBE | CREA | DIRECTA | PeriopController.recordImplant → PeriopIntraopService.recordImplant → PeriopIntraopRepository.createImplant | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:379` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordImplantDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `procedureId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2046` |
| `implantDeviceId` | `string` | Sí | formato uuid | `@IsUUID()` | Dispositivo implantado | `src/modules/procedures_perioperative/dto/periop.dto.ts:2053` |
| `implantRole` | `string` | Sí | valores: PRIMARY, ADJUNCT | `@IsIn(['PRIMARY', 'ADJUNCT'])` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2060` |
| `bodySiteConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2068` |
| `laterality` | `string` | No | valores: LEFT, RIGHT, BILATERAL | `@IsOptional()` `@IsIn(LATERALITIES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2076` |
| `identifiers` | `array<ImplantIdentifierDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ImplantIdentifierDto)` | Identificadores de trazabilidad, al menos uno | `src/modules/procedures_perioperative/dto/periop.dto.ts:2089` |
| `identifiers[].identifierType` | `string` | Sí | valores: UDI_DI, UDI_PI, SERIAL | `@IsIn(IMPLANT_IDENTIFIER_TYPES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1993` |
| `identifiers[].identifierValue` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Valor del identificador | `src/modules/procedures_perioperative/dto/periop.dto.ts:2001` |
| `identifiers[].issuingSystem` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Sistema emisor | `src/modules/procedures_perioperative/dto/periop.dto.ts:2010` |
| `identifiers[].lotNumber` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2019` |
| `identifiers[].serialNumber` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2028` |
| `identifiers[].expirationDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2036` |
| `udiCarrier` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Portador UDI leído del envase | `src/modules/procedures_perioperative/dto/periop.dto.ts:2101` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "procedureId": "00000000-0000-4000-8000-000000000001",
  "implantDeviceId": "00000000-0000-4000-8000-000000000001",
  "implantRole": "PRIMARY",
  "identifiers": [
    {
      "identifierType": "UDI_DI",
      "identifierValue": "valor-ejemplo"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "procedureId": "00000000-0000-4000-8000-000000000001",
  "implantDeviceId": "00000000-0000-4000-8000-000000000001",
  "implantRole": "PRIMARY",
  "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
  "laterality": "LEFT",
  "identifiers": [
    {
      "identifierType": "UDI_DI",
      "identifierValue": "valor-ejemplo",
      "issuingSystem": "valor-ejemplo",
      "lotNumber": "valor-ejemplo",
      "serialNumber": "valor-ejemplo",
      "expirationDate": "2026-07-31"
    }
  ],
  "udiCarrier": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ImplantResponseDto>` · DTO `ImplantResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2112` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2118` |
| `identifierIds` | `array<string>` | Sí | formato uuid | — | Valor de identifier ids mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2124` |
| `deviceUseId` | `string` | Sí | formato uuid | — | Registro del dispositivo usado | `src/modules/procedures_perioperative/dto/periop.dto.ts:2133` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso no está en curso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:237` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `UC-53-09`

---

## 22. POST /procedure-cases/{id}/medication-uses

- **Origen:** CONTRATO
- **Nombre:** Registrar el uso de un medicamento en la intervención
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.recordMedicationUse` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:563`

### Qué es y para qué sirve (negocio)

Registrar el uso de un medicamento en la intervención. Caso de uso UC-53-10: Insumos y muestras. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:94`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/medication-uses` la atiende `PeriopController.recordMedicationUse` (src/modules/procedures_perioperative/controllers/periop.controller.ts:563). Exige sesión con alguno de los roles ANESTHESIOLOGIST, PERIOP_NURSE, PERIOP_ADMIN. Valida el cuerpo como `RecordMedicationUseDto` (4 campos, 2 obligatorios). Delega en `PeriopIntraopService.recordMedicationUse`. Crea filas en procedures_perioperative.procedure_medication_uses. Lee procedures_perioperative.operative_steps.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ANESTHESIOLOGIST, PERIOP_NURSE, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:563` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:563` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.operative_steps` | LEE | LEE | DIRECTA | PeriopController.recordMedicationUse → PeriopIntraopService.recordMedicationUse → PeriopIntraopRepository.findStepById | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:213` |
| `procedures_perioperative.procedure_medication_uses` | ESCRIBE | CREA | DIRECTA | PeriopController.recordMedicationUse → PeriopIntraopService.recordMedicationUse → PeriopIntraopRepository.createMedicationUse | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:532` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordMedicationUseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `medicationAdministrationId` | `string` | Sí | formato uuid | `@IsUUID()` | Administración registrada en farmacia | `src/modules/procedures_perioperative/dto/periop.dto.ts:2158` |
| `useRole` | `string` | Sí | valores: ANESTHESIA, ANTIBIOTIC, ANALGESIA | `@IsIn(MEDICATION_USE_ROLES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2165` |
| `procedureId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2173` |
| `operativeStepId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paso durante el que se administró | `src/modules/procedures_perioperative/dto/periop.dto.ts:2184` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "medicationAdministrationId": "00000000-0000-4000-8000-000000000001",
  "useRole": "ANESTHESIA"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "medicationAdministrationId": "00000000-0000-4000-8000-000000000001",
  "useRole": "ANESTHESIA",
  "procedureId": "00000000-0000-4000-8000-000000000001",
  "operativeStepId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<SuppliesResponseDto>` · DTO `SuppliesResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2256` |
| `procedureCaseId` | `string` | Sí | formato uuid | — | Identificador asociado a procedure case. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2262` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso no está en curso; PreconditionFailedException: El paso no pertenece al caso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:256` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `UC-53-10`

---

## 23. POST /procedure-cases/{id}/operative-reports

- **Origen:** CONTRATO
- **Nombre:** Redactar el reporte operatorio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.draftReport` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:601`

### Qué es y para qué sirve (negocio)

Redactar el reporte operatorio. Caso de uso UC-53-11: Reporte operatorio. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:95`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/operative-reports` la atiende `PeriopController.draftReport` (src/modules/procedures_perioperative/controllers/periop.controller.ts:601). Exige sesión con alguno de los roles SURGEON, PERIOP_ADMIN. Valida el cuerpo como `DraftOperativeReportDto` (17 campos, 3 obligatorios). Delega en `PeriopIntraopService.draftReport`. Crea filas en clinical.procedures, clinical.received_services, procedures_perioperative.operative_reports, procedures_perioperative.procedure_complications. Actualiza clinical.service_requests. Lee clinical.procedures, clinical.received_services, clinical.service_requests, procedures_perioperative.operative_reports, procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:601` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:601` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.procedures` | ESCRIBE | CREA | DIRECTA | PeriopController.draftReport → PeriopIntraopService.draftReport → PeriopIntraopService.ensureProcedure → ProceduresService.create → ProceduresRepository.create | `src/modules/clinical/repositories/procedures.repository.ts:106` |
| `clinical.procedures` | LEE | LEE | DIRECTA | PeriopController.draftReport → PeriopIntraopService.draftReport → PeriopIntraopService.ensureProcedure → ProceduresService.create → ProceduresRepository.findById | `src/modules/clinical/repositories/procedures.repository.ts:95` |
| `clinical.received_services` | ESCRIBE | CREA | DIRECTA | PeriopController.draftReport → PeriopIntraopService.draftReport → PeriopIntraopService.ensureProcedure → ProceduresService.create → ReceivedServicesProjector.projectProcedure → ReceivedServicesRepository.upsert | `src/modules/clinical/repositories/received-services.repository.ts:146` |
| `clinical.received_services` | LEE | LEE | DIRECTA | PeriopController.draftReport → PeriopIntraopService.draftReport → PeriopIntraopService.ensureProcedure → ProceduresService.create → ReceivedServicesProjector.projectProcedure → ReceivedServicesRepository.upsert → ReceivedServicesRepository.findBySourceProcedure | `src/modules/clinical/repositories/received-services.repository.ts:54` |
| `clinical.service_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.draftReport → PeriopIntraopService.draftReport → PeriopIntraopService.ensureProcedure → ProceduresService.create | `src/modules/clinical/services/procedures.service.ts:81` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | PeriopController.draftReport → PeriopIntraopService.draftReport → PeriopIntraopService.ensureProcedure → ProceduresService.create → ServiceRequestsRepository.findById | `src/modules/clinical/repositories/service-requests.repository.ts:107` |
| `procedures_perioperative.operative_reports` | ESCRIBE | CREA | DIRECTA | PeriopController.draftReport → PeriopIntraopService.draftReport → PeriopIntraopRepository.createReport | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:620` |
| `procedures_perioperative.operative_reports` | LEE | LEE | DIRECTA | PeriopController.draftReport → PeriopIntraopService.draftReport → PeriopIntraopRepository.findLastReport | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:688` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.draftReport → PeriopIntraopService.draftReport → PeriopIntraopService.ensureProcedure → ProceduresService.create → ReceivedServicesProjector.projectProcedure → ReceivedServicesRepository.findCaseByPrimaryProcedure | `src/modules/clinical/repositories/received-services.repository.ts:71` |
| `procedures_perioperative.procedure_complications` | ESCRIBE | CREA | DIRECTA | PeriopController.draftReport → PeriopIntraopService.draftReport → PeriopIntraopRepository.createComplication | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:792` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DraftOperativeReportDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `procedureId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Procedimiento ya registrado en la historia clínica | `src/modules/procedures_perioperative/dto/periop.dto.ts:2332` |
| `procedureCodeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Código del procedimiento a registrar si aún no existe | `src/modules/procedures_perioperative/dto/periop.dto.ts:2348` |
| `authorProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Autor del reporte | `src/modules/procedures_perioperative/dto/periop.dto.ts:2355` |
| `preoperativeDiagnosisText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2363` |
| `postoperativeDiagnosisText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2371` |
| `procedureDescription` | `string` | Sí | — | `@IsString()` | Descripción de lo realizado | `src/modules/procedures_perioperative/dto/periop.dto.ts:2378` |
| `findingsText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2386` |
| `estimatedBloodLossMl` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Sangrado estimado en mililitros | `src/modules/procedures_perioperative/dto/periop.dto.ts:2394` |
| `drainsText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2402` |
| `complicationsText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2410` |
| `disposition` | `string` | Sí | valores: PACU, ICU, WARD, HOME | `@IsIn(DISPOSITIONS)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2417` |
| `complications` | `array<ComplicationDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ComplicationDto)` | Complicaciones a registrar | `src/modules/procedures_perioperative/dto/periop.dto.ts:2430` |
| `complications[].complicationCodeConceptId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2286` |
| `complications[].severity` | `string` | No | valores: ROUTINE, MINOR, MAJOR, CRITICAL | `@IsIn(CLINICAL_SEVERITIES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2293` |
| `complications[].relatedness` | `string` | No | valores: PROCEDURE, ANESTHESIA, UNRELATED | `@IsIn(RELATEDNESS)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2300` |
| `complications[].conditionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2308` |
| `complications[].managementText` | `string` | No | — | `@IsOptional()` `@IsString()` | Cómo se manejó | `src/modules/procedures_perioperative/dto/periop.dto.ts:2316` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "procedureDescription": "Texto descriptivo de ejemplo",
  "disposition": "PACU"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "procedureId": "00000000-0000-4000-8000-000000000001",
  "procedureCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "preoperativeDiagnosisText": "valor-ejemplo",
  "postoperativeDiagnosisText": "valor-ejemplo",
  "procedureDescription": "Texto descriptivo de ejemplo",
  "findingsText": "valor-ejemplo",
  "estimatedBloodLossMl": "valor-ejemplo",
  "drainsText": "valor-ejemplo",
  "complicationsText": "valor-ejemplo",
  "disposition": "PACU",
  "complications": [
    {
      "complicationCodeConceptId": "00000000-0000-4000-8000-000000000001",
      "severity": "ROUTINE",
      "relatedness": "PROCEDURE",
      "conditionId": "00000000-0000-4000-8000-000000000001",
      "managementText": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<OperativeReportResponseDto>` · DTO `OperativeReportResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2441` |
| `reportVersion` | `number` | Sí | — | — | Versión del reporte | `src/modules/procedures_perioperative/dto/periop.dto.ts:2447` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2453` |
| `complicationIds` | `array<string>` | Sí | formato uuid | — | Valor de complication ids mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2459` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Orden de servicio no encontrada; ResourceNotFoundException: Procedimiento padre no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso está cancelado; PreconditionFailedException: Indique el procedimiento por `procedureId` o por `procedureCodeConceptId` |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:282` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `UC-53-11`

---

## 24. POST /procedure-cases/{id}/operative-reports/{reportId}/sign

- **Origen:** CONTRATO
- **Nombre:** Firmar el reporte operatorio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.signReport` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:622`

### Qué es y para qué sirve (negocio)

Firmar el reporte operatorio. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/operative-reports/{reportId}/sign` la atiende `PeriopController.signReport` (src/modules/procedures_perioperative/controllers/periop.controller.ts:622). Exige sesión con alguno de los roles SURGEON, PERIOP_ADMIN. Valida el cuerpo como `SignReportDto` (2 campos, 1 obligatorio). Delega en `PeriopIntraopService.signReport`. Crea filas en clinical.received_services, procedures_perioperative.procedure_case_milestones, procedures_perioperative.procedure_case_status_history. Actualiza procedures_perioperative.operative_reports. Lee clinical.procedures, clinical.received_services, procedures_perioperative.operative_reports.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:622` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, reportId | `src/modules/procedures_perioperative/controllers/periop.controller.ts:622` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.procedures` | LEE | LEE | DIRECTA | PeriopController.signReport → PeriopIntraopService.signReport → ReceivedServicesProjector.projectCompletedCase → ReceivedServicesRepository.isProcedureOf | `src/modules/clinical/repositories/received-services.repository.ts:177` |
| `clinical.received_services` | ESCRIBE | CREA | DIRECTA | PeriopController.signReport → PeriopIntraopService.signReport → ReceivedServicesProjector.projectCompletedCase → ReceivedServicesRepository.upsert | `src/modules/clinical/repositories/received-services.repository.ts:146` |
| `clinical.received_services` | LEE | LEE | DIRECTA | PeriopController.signReport → PeriopIntraopService.signReport → ReceivedServicesProjector.projectCompletedCase → ReceivedServicesRepository.upsert → ReceivedServicesRepository.findBySourceProcedure | `src/modules/clinical/repositories/received-services.repository.ts:54` |
| `procedures_perioperative.operative_reports` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.signReport → PeriopIntraopService.signReport | `src/modules/procedures_perioperative/services/periop-intraop.service.ts:653` |
| `procedures_perioperative.operative_reports` | LEE | LEE | DIRECTA | PeriopController.signReport → PeriopIntraopService.signReport → PeriopIntraopRepository.findReportForUpdate | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:655` |
| `procedures_perioperative.procedure_case_milestones` | ESCRIBE | CREA | DIRECTA | PeriopController.signReport → PeriopIntraopService.signReport → PeriopCasesRepository.createMilestone | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:495` |
| `procedures_perioperative.procedure_case_status_history` | ESCRIBE | CREA | DIRECTA | PeriopController.signReport → PeriopIntraopService.signReport → PeriopCasesRepository.createStatusHistory | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:437` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `reportId` | path | Sí | `string` | — |

### Cuerpo — DTO `SignReportDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `signatureId` | `string` | Sí | formato uuid | `@IsUUID()` | Firma electrónica aplicada | `src/modules/procedures_perioperative/dto/periop.dto.ts:2469` |
| `fileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Documento firmado | `src/modules/procedures_perioperative/dto/periop.dto.ts:2477` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "signatureId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "signatureId": "00000000-0000-4000-8000-000000000001",
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<SignReportResponseDto>` · DTO `SignReportResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2488` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2494` |
| `caseStatusConceptId` | `string` | Sí | formato uuid | — | Estado en el que queda el caso | `src/modules/procedures_perioperative/dto/periop.dto.ts:2503` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Reporte operatorio no encontrado |
| 409 | `CONFLICT` | ConflictException: El reporte ya está firmado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El reporte pertenece a otro caso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:283` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. POST /procedure-cases/{id}/operative-steps

- **Origen:** CONTRATO
- **Nombre:** Registrar un paso operatorio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.createStep` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:502`

### Qué es y para qué sirve (negocio)

Registrar un paso operatorio. Caso de uso UC-53-08: Pasos y hallazgos. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:92`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/operative-steps` la atiende `PeriopController.createStep` (src/modules/procedures_perioperative/controllers/periop.controller.ts:502). Exige sesión con alguno de los roles SURGEON, PERIOP_NURSE, PERIOP_ADMIN. Valida el cuerpo como `CreateOperativeStepDto` (6 campos, 2 obligatorios). Delega en `PeriopIntraopService.createStep`. Crea filas en procedures_perioperative.operative_steps. Lee procedures_perioperative.operative_steps.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, PERIOP_NURSE, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:502` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:502` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.operative_steps` | ESCRIBE | CREA | DIRECTA | PeriopController.createStep → PeriopIntraopService.createStep → PeriopIntraopRepository.createStep | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:186` |
| `procedures_perioperative.operative_steps` | LEE | LEE | DIRECTA | PeriopController.createStep → PeriopIntraopService.createStep → PeriopIntraopRepository.findStepsByCase | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:239` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateOperativeStepDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `stepCodeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Código del paso operatorio | `src/modules/procedures_perioperative/dto/periop.dto.ts:1762` |
| `description` | `string` | Sí | — | `@IsString()` | Qué se hizo | `src/modules/procedures_perioperative/dto/periop.dto.ts:1769` |
| `procedureId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1777` |
| `performedByProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1785` |
| `bodySiteConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sitio anatómico intervenido | `src/modules/procedures_perioperative/dto/periop.dto.ts:1796` |
| `laterality` | `string` | No | valores: LEFT, RIGHT, BILATERAL | `@IsOptional()` `@IsIn(LATERALITIES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1804` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "stepCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "description": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "stepCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "description": "Texto descriptivo de ejemplo",
  "procedureId": "00000000-0000-4000-8000-000000000001",
  "performedByProfileId": "00000000-0000-4000-8000-000000000001",
  "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
  "laterality": "LEFT"
}
```

</details>

### Respuesta — `Promise<OperativeStepResponseDto>` · DTO `OperativeStepResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1815` |
| `stepNumber` | `number` | Sí | — | — | Número del paso dentro del caso | `src/modules/procedures_perioperative/dto/periop.dto.ts:1821` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1827` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso no está en curso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:217` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `UC-53-08`

---

## 26. POST /procedure-cases/{id}/pacu-stays

- **Origen:** CONTRATO
- **Nombre:** Admitir al paciente en recuperación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.admitToPacu` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:644`

### Qué es y para qué sirve (negocio)

Admitir al paciente en recuperación. Caso de uso UC-53-12: Recuperación. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:96`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/pacu-stays` la atiende `PeriopController.admitToPacu` (src/modules/procedures_perioperative/controllers/periop.controller.ts:644). Exige sesión con alguno de los roles PERIOP_NURSE, ANESTHESIOLOGIST, PERIOP_ADMIN. Valida el cuerpo como `AdmitToPacuDto` (2 campos, 1 obligatorio). Delega en `PeriopIntraopService.admitToPacu`. Crea filas en procedures_perioperative.pacu_stays, procedures_perioperative.procedure_case_locations. Lee procedures_perioperative.pacu_stays.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PERIOP_NURSE, ANESTHESIOLOGIST, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:644` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:644` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.pacu_stays` | ESCRIBE | CREA | DIRECTA | PeriopController.admitToPacu → PeriopIntraopService.admitToPacu → PeriopIntraopRepository.createPacuStay | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:844` |
| `procedures_perioperative.pacu_stays` | LEE | LEE | DIRECTA | PeriopController.admitToPacu → PeriopIntraopService.admitToPacu → PeriopIntraopRepository.findPacuStayByCase | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:899` |
| `procedures_perioperative.procedure_case_locations` | ESCRIBE | CREA | DIRECTA | PeriopController.admitToPacu → PeriopIntraopService.admitToPacu → PeriopCasesRepository.createLocation | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:680` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AdmitToPacuDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `careSpaceId` | `string` | Sí | formato uuid | `@IsUUID()` | Espacio de recuperación | `src/modules/procedures_perioperative/dto/periop.dto.ts:2517` |
| `admittedByProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2525` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "careSpaceId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "admittedByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<PacuStayResponseDto>` · DTO `PacuStayResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2536` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2542` |
| `locationId` | `string` | Sí | formato uuid | — | Ubicación del caso creada | `src/modules/procedures_perioperative/dto/periop.dto.ts:2548` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El caso ya tiene estancia en recuperación |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso está cancelado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:307` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `UC-53-12`

---

## 27. POST /procedure-cases/{id}/preoperative-assessments

- **Origen:** CONTRATO
- **Nombre:** Registrar la valoración preoperatoria y sus puntuaciones de riesgo
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.createAssessment` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:250`

### Qué es y para qué sirve (negocio)

Registrar la valoración preoperatoria y sus puntuaciones de riesgo. Caso de uso UC-53-03: Valoración y riesgo. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:87`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/preoperative-assessments` la atiende `PeriopController.createAssessment` (src/modules/procedures_perioperative/controllers/periop.controller.ts:250). Exige sesión con alguno de los roles ANESTHESIOLOGIST, SURGEON, PERIOP_ADMIN. Valida el cuerpo como `CreatePreopAssessmentDto` (15 campos, 5 obligatorios). Delega en `PeriopPreopService.createAssessment`. Crea filas en messaging.domain_events, messaging.outbox_messages, procedures_perioperative.preoperative_assessments, procedures_perioperative.preoperative_risk_scores, procedures_perioperative.procedure_case_milestones, procedures_perioperative.procedure_case_status_history. Actualiza procedures_perioperative.procedure_case_team_members, procedures_perioperative.procedure_cases. Lee messaging.outbox_messages, procedures_perioperative.preoperative_assessments, procedures_perioperative.procedure_case_team_members. Publica periop.case.reacceptance_required.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ANESTHESIOLOGIST, SURGEON, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:250` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:250` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PeriopController.createAssessment → PeriopPreopService.createAssessment → PeriopReacceptanceService.invalidateBeforeExecution → PeriopReacceptanceService.invalidate → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PeriopController.createAssessment → PeriopPreopService.createAssessment → PeriopReacceptanceService.invalidateBeforeExecution → PeriopReacceptanceService.invalidate → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PeriopController.createAssessment → PeriopPreopService.createAssessment → PeriopReacceptanceService.invalidateBeforeExecution → PeriopReacceptanceService.invalidate → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `procedures_perioperative.preoperative_assessments` | ESCRIBE | CREA | DIRECTA | PeriopController.createAssessment → PeriopPreopService.createAssessment → PeriopPreopRepository.createAssessment | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:144` |
| `procedures_perioperative.preoperative_assessments` | LEE | LEE | DIRECTA | PeriopController.createAssessment → PeriopPreopService.createAssessment → PeriopPreopRepository.findAssessmentByCase | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:178` |
| `procedures_perioperative.preoperative_risk_scores` | ESCRIBE | CREA | DIRECTA | PeriopController.createAssessment → PeriopPreopService.createAssessment → PeriopPreopRepository.createRiskScore | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:215` |
| `procedures_perioperative.procedure_case_milestones` | ESCRIBE | CREA | DIRECTA | PeriopController.createAssessment → PeriopPreopService.createAssessment → PeriopCasesRepository.createMilestone | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:495` |
| `procedures_perioperative.procedure_case_status_history` | ESCRIBE | CREA | DIRECTA | PeriopController.createAssessment → PeriopPreopService.createAssessment → PeriopReacceptanceService.invalidateBeforeExecution → PeriopReacceptanceService.invalidate → PeriopCasesRepository.createStatusHistory | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:437` |
| `procedures_perioperative.procedure_case_team_members` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.createAssessment → PeriopPreopService.createAssessment → PeriopReacceptanceService.invalidateBeforeExecution → PeriopReacceptanceService.invalidate | `src/modules/procedures_perioperative/services/periop-reacceptance.service.ts:97` |
| `procedures_perioperative.procedure_case_team_members` | LEE | LEE | DIRECTA | PeriopController.createAssessment → PeriopPreopService.createAssessment → PeriopReacceptanceService.invalidateBeforeExecution → PeriopCasesRepository.findTeamByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:647` |
| `procedures_perioperative.procedure_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.createAssessment → PeriopPreopService.createAssessment → PeriopReacceptanceService.invalidateBeforeExecution → PeriopReacceptanceService.invalidate | `src/modules/procedures_perioperative/services/periop-reacceptance.service.ts:115` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `periop.case.reacceptance_required` | `src/modules/procedures_perioperative/services/periop-reacceptance.service.ts:121` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreatePreopAssessmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `assessmentType` | `string` | Sí | valores: ANESTHESIA, SURGICAL | `@IsIn(['ANESTHESIA', 'SURGICAL'])` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1079` |
| `assessedByProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Profesional que valora | `src/modules/procedures_perioperative/dto/periop.dto.ts:1086` |
| `fitnessStatus` | `string` | Sí | valores: FIT, FIT_WITH_CAUTION, UNFIT | `@IsIn(FITNESS_STATUSES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1093` |
| `asaClass` | `string` | No | valores: I, II, III, IV, V | `@IsOptional()` `@IsIn(ASA_CLASSES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1101` |
| `allergiesReviewed` | `boolean` | Sí | — | `@IsBoolean()` | Se revisaron las alergias del paciente | `src/modules/procedures_perioperative/dto/periop.dto.ts:1108` |
| `medicationsReviewed` | `boolean` | Sí | — | `@IsBoolean()` | Se revisó la medicación del paciente | `src/modules/procedures_perioperative/dto/periop.dto.ts:1115` |
| `anticoagulationPlanText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1123` |
| `fastingInstructionsText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1131` |
| `assessmentJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Detalle estructurado de la valoración | `src/modules/procedures_perioperative/dto/periop.dto.ts:1139` |
| `riskScores` | `array<RiskScoreDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => RiskScoreDto)` | Puntuaciones de riesgo calculadas | `src/modules/procedures_perioperative/dto/periop.dto.ts:1152` |
| `riskScores[].model` | `string` | No | valores: ASA, RCRI, APFEL | `@IsIn(RISK_MODELS)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:560` |
| `riskScores[].modelVersion` | `string` | No | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | Versión del modelo aplicada | `src/modules/procedures_perioperative/dto/periop.dto.ts:568` |
| `riskScores[].scoreValue` | `string` | No | — | `@IsNumberString()` | Puntuación obtenida | `src/modules/procedures_perioperative/dto/periop.dto.ts:575` |
| `riskScores[].inputsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Entradas con las que se calculó | `src/modules/procedures_perioperative/dto/periop.dto.ts:583` |
| `riskScores[].interpretationText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:591` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "assessmentType": "ANESTHESIA",
  "assessedByProfileId": "00000000-0000-4000-8000-000000000001",
  "fitnessStatus": "FIT",
  "allergiesReviewed": true,
  "medicationsReviewed": true
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "assessmentType": "ANESTHESIA",
  "assessedByProfileId": "00000000-0000-4000-8000-000000000001",
  "fitnessStatus": "FIT",
  "asaClass": "I",
  "allergiesReviewed": true,
  "medicationsReviewed": true,
  "anticoagulationPlanText": "valor-ejemplo",
  "fastingInstructionsText": "valor-ejemplo",
  "assessmentJson": {},
  "riskScores": [
    {
      "model": "ASA",
      "modelVersion": "valor-ejemplo",
      "scoreValue": "valor-ejemplo",
      "inputsJson": {},
      "interpretationText": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<PreopAssessmentResponseDto>` · DTO `PreopAssessmentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1163` |
| `fitnessStatusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a fitness status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1169` |
| `riskScoreIds` | `array<string>` | Sí | formato uuid | — | Valor de risk score ids mantenido por la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1175` |
| `milestoneId` | `string` | No | formato uuid | — | Hito de aptitud preoperatoria, si el paciente quedó apto | `src/modules/procedures_perioperative/dto/periop.dto.ts:1184` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El caso ya tiene valoración preoperatoria |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La valoración exige revisar alergias y medicación; PreconditionFailedException: El caso está cancelado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:133` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `UC-53-03`

---

## 28. POST /procedure-cases/{id}/preoperative-orders

- **Origen:** CONTRATO
- **Nombre:** Indicar una orden preoperatoria para el caso
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.createPreoperativeOrder` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:279`

### Qué es y para qué sirve (negocio)

Indicar una orden preoperatoria para el caso. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/preoperative-orders` la atiende `PeriopController.createPreoperativeOrder` (src/modules/procedures_perioperative/controllers/periop.controller.ts:279). Exige sesión con alguno de los roles ANESTHESIOLOGIST, SURGEON, PERIOP_ADMIN. Valida el cuerpo como `CreatePreoperativeOrderDto` (4 campos, 1 obligatorio). Delega en `PeriopPreopService.createOrder`. Crea filas en clinical.service_request_components, clinical.service_request_notes, clinical.service_requests, messaging.domain_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, messaging.outbox_messages y 1 más. Actualiza iam.devices. Lee billing.service_catalog, chart.clinical_note_headers, clinical.diagnostic_reports, clinical.encounters, clinical.service_request_components, clinical.service_requests, diagnostics.diagnostic_report_versions, directory.tenants y 19 más. Publica ServiceRequestPlaced, clinical.service_request.collection_point_suggested.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ANESTHESIOLOGIST, SURGEON, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:279` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:279` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → PerformerSelectionValidator.resolve → PerformerSiteDbReader.offersProcedureWithPrice | `src/modules/clinical/services/performer-site-db.reader.ts:40` |
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ServiceRequestNotesService.assertUsable | `src/modules/clinical/services/service-request-notes.service.ts:57` |
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ServiceRequestsService.resolveDuplicateDecision → DuplicateStudyDetector.findDuplicate | `src/modules/clinical/services/duplicate-study-detector.ts:191` |
| `clinical.encounters` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ServiceRequestNotesService.assertUsable | `src/modules/clinical/services/service-request-notes.service.ts:80` |
| `clinical.service_request_components` | ESCRIBE | CREA | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ServiceRequestDetailService.writeComponents | `src/modules/clinical/services/service-request-detail.service.ts:365` |
| `clinical.service_request_components` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ServiceRequestDetailService.describe → ServiceRequestDetailService.loadComponents | `src/modules/clinical/services/service-request-detail.service.ts:466` |
| `clinical.service_request_notes` | ESCRIBE | CREA | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ServiceRequestNotesService.link | `src/modules/clinical/services/service-request-notes.service.ts:136` |
| `clinical.service_requests` | ESCRIBE | CREA | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ServiceRequestsRepository.create | `src/modules/clinical/repositories/service-requests.repository.ts:118` |
| `clinical.service_requests` | LEE | LEE | POR_SQL | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ServiceRequestsService.resolveDuplicateDecision → DuplicateStudyDetector.findDuplicate | `src/modules/clinical/services/duplicate-study-detector.ts:163` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ServiceRequestsService.resolveDuplicateDecision → DuplicateStudyDetector.findDuplicate → DuplicateStudyDetector.releasedVersionOf | `src/modules/clinical/services/duplicate-study-detector.ts:438` |
| `directory.tenants` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ServiceRequestsService.resolveDuplicateDecision → DuplicateStudyDetector.describe → DuplicateStudyDetector.providerName | `src/modules/clinical/services/duplicate-study-detector.ts:488` |
| `forms.form_instances` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → FormInstanceOriginValidator.assertUsableOrigin | `src/modules/forms/services/form-instance-origin.validator.ts:43` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.healthcare_services` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → PerformerSelectionValidator.resolve → PerformerSiteDbReader.offersProcedureWithPrice | `src/modules/clinical/services/performer-site-db.reader.ts:32` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → SuggestedSiteNamesReader.namesFor | `src/modules/clinical/services/suggested-site-names.reader.ts:31` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → PerformerSelectionValidator.resolve → PerformerSiteDbReader.isActivelyAffiliated | `src/modules/clinical/services/performer-site-db.reader.ts:55` |
| `procedures_perioperative.preoperative_orders` | ESCRIBE | CREA | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → PeriopPreopRepository.createOrder | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:266` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ServiceRequestDetailService.describe → ServiceRequestDetailService.displays | `src/modules/clinical/services/service-request-detail.service.ts:493` |
| `terminology.concept_designations` | LEE | LEE | DIRECTA | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ServiceRequestDetailService.describe → ServiceRequestDetailService.displays → ConceptDesignationsRepository.findPreferredByLanguageForConcepts | `src/modules/terminology/repositories/concept-designations.repository.ts:176` |
| `terminology.concept_properties` | LEE | LEE | POR_SQL | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.findStudy → TerminologyStudyCatalogAdapter.property | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:132` |
| `terminology.concept_relationships` | LEE | LEE | POR_SQL | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.panelComponentIds | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:69` |
| `terminology.value_set_members` | LEE | LEE | POR_SQL | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.isInValueSet | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:98` |
| `terminology.value_set_versions` | LEE | LEE | POR_SQL | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.isInValueSet | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:98` |
| `terminology.value_sets` | LEE | LEE | POR_SQL | PeriopController.createPreoperativeOrder → PeriopPreopService.createOrder → ServiceRequestsService.create → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.isInValueSet | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:98` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `ServiceRequestPlaced` | `src/modules/clinical/services/service-requests.service.ts:436` |
| Evento de dominio | `clinical.service_request.collection_point_suggested` | `src/modules/clinical/services/service-requests.service.ts:448` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreatePreoperativeOrderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `serviceRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Orden clínica ya existente | `src/modules/procedures_perioperative/dto/periop.dto.ts:1214` |
| `serviceRequestCodeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Código de la orden clínica a registrar si aún no existe | `src/modules/procedures_perioperative/dto/periop.dto.ts:1229` |
| `orderRole` | `string` | Sí | valores: LAB, IMAGING, CONSULT, MEDICATION | `@IsIn(PREOP_ORDER_ROLES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1236` |
| `mandatory` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si es obligatoria antes de la cirugía; una pendiente impide que el caso quede listo | `src/modules/procedures_perioperative/dto/periop.dto.ts:1248` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "orderRole": "LAB"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "serviceRequestCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "orderRole": "LAB",
  "mandatory": true
}
```

</details>

### Respuesta — `Promise<PreoperativeOrderResponseDto>` · DTO `PreoperativeOrderResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1257` |
| `serviceRequestId` | `string` | Sí | formato uuid | — | Identificador asociado a service request. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1263` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1269` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Indique la orden por `serviceRequestId` o por `serviceRequestCodeConceptId`; PreconditionFailedException: El caso está cancelado; PreconditionFailedException: La categoría indicada no corresponde al concepto de categoría; PreconditionFailedException: {message}; PreconditionFailedException: La nota médica citada no está disponible como motivo de esta orden; PreconditionFailedException: La nota médica citada pertenece a otra consulta; PreconditionFailedException: El modo de ejecutor no es válido; PreconditionFailedException: Si elige el paciente, la orden no lleva médico ni sede sugeridos; PreconditionFailedException: La orden necesita la sede sugerida; PreconditionFailedException: Si se recomienda un centro, la orden no lleva médico ejecutor; PreconditionFailedException: Si lo hace el médico, la orden necesita el médico ejecutor; PreconditionFailedException: El médico ejecutor debe ser quien pide la orden; PreconditionFailedException: La sede sugerida no ofrece ese procedimiento con precio; PreconditionFailedException: El médico no tiene una afiliación activa para ese procedimiento en la sede sugerida; PreconditionFailedException: El paciente ya tiene este estudio dentro de la ventana; hace falta reutilizar el informe o justificar la repetición; PreconditionFailedException: El informe previo indicado no coincide con el duplicado detectado; PreconditionFailedException: El paciente ya tiene una orden activa de este estudio, sin informe; hace falta justificar la repetición; PreconditionFailedException: No se detectó ningún estudio duplicado para justificar; PreconditionFailedException: El punto de toma no es un punto disponible de la sede sugerida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. POST /procedure-cases/{id}/preoperative-orders/verify

- **Origen:** CONTRATO
- **Nombre:** Verificar las órdenes preoperatorias
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.verifyOrders` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:396`

### Qué es y para qué sirve (negocio)

Verificar las órdenes preoperatorias. Caso de uso UC-53-04: Clearance de órdenes. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:88`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/preoperative-orders/verify` la atiende `PeriopController.verifyOrders` (src/modules/procedures_perioperative/controllers/periop.controller.ts:396). Exige sesión con alguno de los roles ANESTHESIOLOGIST, PERIOP_NURSE, PERIOP_ADMIN. Valida el cuerpo como `VerifyOrdersDto` (2 campos, 2 obligatorios). Delega en `PeriopPreopService.verifyOrders`. Crea filas en procedures_perioperative.procedure_case_status_history. Lee procedures_perioperative.preoperative_orders.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ANESTHESIOLOGIST, PERIOP_NURSE, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:396` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:396` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.preoperative_orders` | LEE | LEE | DIRECTA | PeriopController.verifyOrders → PeriopPreopService.verifyOrders → PeriopPreopRepository.findOrdersByCaseForUpdate | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:310` |
| `procedures_perioperative.procedure_case_status_history` | ESCRIBE | CREA | DIRECTA | PeriopController.verifyOrders → PeriopPreopService.verifyOrders → PeriopCasesRepository.createStatusHistory | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:437` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `VerifyOrdersDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `orderIds` | `array<string>` | Sí | formato uuid; mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@IsUUID(undefined, { each: true })` | Órdenes que se dan por verificadas | `src/modules/procedures_perioperative/dto/periop.dto.ts:1285` |
| `verifiedByProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Profesional que verifica | `src/modules/procedures_perioperative/dto/periop.dto.ts:1292` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "orderIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "verifiedByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "orderIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "verifiedByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<VerifyOrdersResponseDto>` · DTO `VerifyOrdersResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `procedureCaseId` | `string` | Sí | formato uuid | — | Identificador asociado a procedure case. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1303` |
| `verified` | `number` | Sí | — | — | Órdenes que pasaron a verificadas | `src/modules/procedures_perioperative/dto/periop.dto.ts:1309` |
| `pendingMandatory` | `number` | Sí | — | — | Órdenes obligatorias que siguen pendientes | `src/modules/procedures_perioperative/dto/periop.dto.ts:1315` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado en el que queda el caso | `src/modules/procedures_perioperative/dto/periop.dto.ts:1324` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Orden preoperatoria no encontrada en el caso |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo un caso programado admite verificación de órdenes |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:147` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `UC-53-04`

---

## 30. POST /procedure-cases/{id}/room-events

- **Origen:** CONTRATO
- **Nombre:** Registrar un evento de sala
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopOrController.roomEvent` — `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:206`

### Qué es y para qué sirve (negocio)

Registrar un evento de sala. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/room-events` la atiende `PeriopOrController.roomEvent` (src/modules/procedures_perioperative/controllers/periop-or.controller.ts:206). Exige sesión con alguno de los roles PERIOP_ADMIN, PERIOP_NURSE, SURGEON, ANESTHESIOLOGIST. Valida el cuerpo como `RoomEventDto` (2 campos, 1 obligatorio). Delega en `RecordRoomEventUseCase.execute`. Crea filas en practice.care_space_status_events, practice.cleaning_orders, procedures_perioperative.operating_room_utilization_events, procedures_perioperative.procedure_case_milestones. Actualiza practice.care_spaces, practice.cleaning_orders. Lee clinical.encounter_locations, practice.care_spaces, practice.cleaning_orders, practice.practice_settings, practice.practice_sites, procedures_perioperative.operating_room_utilization_events. Hay 4 llamadas cuyo destino depende de un dato en tiempo de ejecución y no se siguieron.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PERIOP_ADMIN, PERIOP_NURSE, SURGEON, ANESTHESIOLOGIST | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:206` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:206` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | LEE | LEE | POR_SQL | PeriopOrController.roomEvent → RecordRoomEventUseCase.execute → PracticeCareSpaceOpsAdapter.markDirtyFromSource → CareSpaceOpsCore.openCleaningOrder → CareSpaceOpsCore.changeAxis → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.occupancy → CareSpaceOpsRepository.occupancy | `src/modules/practice/repositories/care-space-ops.repository.ts:178` |
| `practice.care_space_status_events` | ESCRIBE | CREA | DIRECTA | PeriopOrController.roomEvent → RecordRoomEventUseCase.execute → PracticeCareSpaceOpsAdapter.markDirtyFromSource → CareSpaceOpsCore.openCleaningOrder → CareSpaceOpsCore.changeAxis | `src/modules/practice/services/ops/care-space-ops-core.ts:367` |
| `practice.care_spaces` | ESCRIBE | ACTUALIZA | DIRECTA | PeriopOrController.roomEvent → RecordRoomEventUseCase.execute → PracticeCareSpaceOpsAdapter.markDirtyFromSource → CareSpaceOpsCore.updateOps | `src/modules/practice/services/ops/care-space-ops-core.ts:441` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | PeriopOrController.roomEvent → RecordRoomEventUseCase.execute → PracticeCareSpaceOpsAdapter.markDirtyFromSource → PracticeCareSpaceOpsAdapter.load → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.cleaning_orders` | ESCRIBE | CREA | DIRECTA | PeriopOrController.roomEvent → RecordRoomEventUseCase.execute → PracticeCareSpaceOpsAdapter.markDirtyFromSource → CareSpaceOpsCore.openCleaningOrder | `src/modules/practice/services/ops/care-space-ops-core.ts:502` |
| `practice.cleaning_orders` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopOrController.roomEvent → RecordRoomEventUseCase.execute → PracticeCareSpaceOpsAdapter.markDirtyFromSource → CareSpaceOpsCore.openCleaningOrder → CareSpaceOpsCore.supersedeIfDone | `src/modules/practice/services/ops/care-space-ops-core.ts:573` |
| `practice.cleaning_orders` | LEE | LEE | DIRECTA | PeriopOrController.roomEvent → RecordRoomEventUseCase.execute → PracticeCareSpaceOpsAdapter.markDirtyFromSource → CareSpaceOpsCore.openCleaningOrder → CareSpaceOpsRepository.openCleaningOrders | `src/modules/practice/repositories/care-space-ops.repository.ts:283` |
| `practice.practice_settings` | LEE | LEE | POR_SQL | PeriopOrController.roomEvent → RecordRoomEventUseCase.execute → PracticeCareSpaceOpsAdapter.markDirtyFromSource → CareSpaceOpsCore.openCleaningOrder → CareSpaceOpsCore.supersedeIfDone → CareSpaceOpsCore.settings → CareSpaceOpsRepository.settings | `src/modules/practice/repositories/care-space-ops.repository.ts:431` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PeriopOrController.roomEvent → RecordRoomEventUseCase.execute → PracticeCareSpaceOpsAdapter.markDirtyFromSource → PracticeCareSpaceOpsAdapter.load → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `procedures_perioperative.operating_room_utilization_events` | ESCRIBE | CREA | DIRECTA | PeriopOrController.roomEvent → RecordRoomEventUseCase.execute | `src/modules/procedures_perioperative/services/or/or.use-cases.ts:396` |
| `procedures_perioperative.operating_room_utilization_events` | LEE | LEE | DIRECTA | PeriopOrController.roomEvent → RecordRoomEventUseCase.execute | `src/modules/procedures_perioperative/services/or/or.use-cases.ts:369` |
| `procedures_perioperative.procedure_case_milestones` | ESCRIBE | CREA | DIRECTA | PeriopOrController.roomEvent → RecordRoomEventUseCase.execute → PeriopCasesRepository.createMilestone | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:495` |

**No se pudo seguir** (el destino depende de un dato en tiempo de ejecución):

- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RoomEventDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `eventCode` | `string` | Sí | valores: PATIENT_IN_ROOM, ANESTHESIA_START, INCISION, CLOSURE, PATIENT_OUT_OF_ROOM | `@IsIn([...ROOM_EVENT_ORDER])` | — | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:61` |
| `occurredAt` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | — | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:66` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "eventCode": "PATIENT_IN_ROOM"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "eventCode": "PATIENT_IN_ROOM",
  "occurredAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Sitio no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso no tiene quirófano; PreconditionFailedException: La fecha no puede ser futura |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-or-f4.int-spec.ts:237` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopOrController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 31. POST /procedure-cases/{id}/safety-checklists

- **Origen:** CONTRATO
- **Nombre:** Crear el check-list OMS del caso (201; 200 si ya existe)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopOrController.createChecklist` — `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:169`

### Qué es y para qué sirve (negocio)

Crear el check-list OMS del caso (201; 200 si ya existe). Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/safety-checklists` la atiende `PeriopOrController.createChecklist` (src/modules/procedures_perioperative/controllers/periop-or.controller.ts:169). Exige sesión con alguno de los roles PERIOP_ADMIN, PERIOP_NURSE, SURGEON, ANESTHESIOLOGIST, SURGERY_SCHEDULER. Delega en `SafetyChecklistUseCases.create`. Crea filas en procedures_perioperative.surgical_safety_checklists, procedures_perioperative.surgical_safety_items. Lee procedures_perioperative.surgical_safety_checklists, procedures_perioperative.surgical_safety_items, procedures_perioperative.surgical_safety_responses.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PERIOP_ADMIN, PERIOP_NURSE, SURGEON, ANESTHESIOLOGIST, SURGERY_SCHEDULER | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:169` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:169` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.surgical_safety_checklists` | ESCRIBE | CREA | DIRECTA | PeriopOrController.createChecklist → SafetyChecklistUseCases.create | `src/modules/procedures_perioperative/services/or/or.use-cases.ts:182` |
| `procedures_perioperative.surgical_safety_checklists` | LEE | LEE | DIRECTA | PeriopOrController.createChecklist → SafetyChecklistUseCases.create → PeriopCasesRepository.findSafetyChecklistByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:909` |
| `procedures_perioperative.surgical_safety_items` | ESCRIBE | CREA | DIRECTA | PeriopOrController.createChecklist → SafetyChecklistUseCases.create → SafetyChecklistUseCases.seedItems | `src/modules/procedures_perioperative/services/or/or.use-cases.ts:248` |
| `procedures_perioperative.surgical_safety_items` | LEE | LEE | DIRECTA | PeriopOrController.createChecklist → SafetyChecklistUseCases.create → SafetyChecklistUseCases.view | `src/modules/procedures_perioperative/services/or/or.use-cases.ts:275` |
| `procedures_perioperative.surgical_safety_responses` | LEE | LEE | DIRECTA | PeriopOrController.createChecklist → SafetyChecklistUseCases.create → SafetyChecklistUseCases.view | `src/modules/procedures_perioperative/services/or/or.use-cases.ts:284` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El caso está cancelado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-or-f4.int-spec.ts:225` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopOrController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 32. GET /procedure-cases/{id}/safety-checklists/{checklistId}

- **Origen:** CONTRATO
- **Nombre:** Check-list OMS por fases
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopOrController.getChecklist` — `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:195`

### Qué es y para qué sirve (negocio)

Check-list OMS por fases. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /procedure-cases/{id}/safety-checklists/{checklistId}` la atiende `PeriopOrController.getChecklist` (src/modules/procedures_perioperative/controllers/periop-or.controller.ts:195). Exige sesión con alguno de los roles PERIOP_ADMIN, PERIOP_NURSE, SURGEON, ANESTHESIOLOGIST, SURGERY_SCHEDULER. Delega en `SafetyChecklistUseCases.get`. Lee procedures_perioperative.surgical_safety_checklists, procedures_perioperative.surgical_safety_items, procedures_perioperative.surgical_safety_responses.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PERIOP_ADMIN, PERIOP_NURSE, SURGEON, ANESTHESIOLOGIST, SURGERY_SCHEDULER | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:195` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, checklistId | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:195` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.surgical_safety_checklists` | LEE | LEE | DIRECTA | PeriopOrController.getChecklist → SafetyChecklistUseCases.get | `src/modules/procedures_perioperative/services/or/or.use-cases.ts:225` |
| `procedures_perioperative.surgical_safety_items` | LEE | LEE | DIRECTA | PeriopOrController.getChecklist → SafetyChecklistUseCases.get → SafetyChecklistUseCases.view | `src/modules/procedures_perioperative/services/or/or.use-cases.ts:275` |
| `procedures_perioperative.surgical_safety_responses` | LEE | LEE | DIRECTA | PeriopOrController.getChecklist → SafetyChecklistUseCases.get → SafetyChecklistUseCases.view | `src/modules/procedures_perioperative/services/or/or.use-cases.ts:284` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `checklistId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Check-list no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopOrController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 33. POST /procedure-cases/{id}/safety-checklists/{checklistId}/responses

- **Origen:** CONTRATO
- **Nombre:** Responder una fase del checklist quirúrgico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.submitChecklistPhase` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:417`

### Qué es y para qué sirve (negocio)

Responder una fase del checklist quirúrgico. Caso de uso UC-53-05: Checklist por fases. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/procedures_perioperative/README.md:89`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/safety-checklists/{checklistId}/responses` la atiende `PeriopController.submitChecklistPhase` (src/modules/procedures_perioperative/controllers/periop.controller.ts:417). Exige sesión con alguno de los roles PERIOP_NURSE, SURGEON, ANESTHESIOLOGIST, PERIOP_ADMIN. Valida el cuerpo como `SubmitChecklistPhaseDto` (8 campos, 5 obligatorios). Delega en `PeriopPreopService.submitChecklistPhase`. Crea filas en procedures_perioperative.procedure_case_milestones, procedures_perioperative.surgical_safety_responses. Actualiza procedures_perioperative.surgical_safety_checklists. Lee procedures_perioperative.surgical_safety_checklists, procedures_perioperative.surgical_safety_items, procedures_perioperative.surgical_safety_responses.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PERIOP_NURSE, SURGEON, ANESTHESIOLOGIST, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:417` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, checklistId | `src/modules/procedures_perioperative/controllers/periop.controller.ts:417` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.procedure_case_milestones` | ESCRIBE | CREA | DIRECTA | PeriopController.submitChecklistPhase → PeriopPreopService.submitChecklistPhase → PeriopCasesRepository.createMilestone | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:495` |
| `procedures_perioperative.surgical_safety_checklists` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.submitChecklistPhase → PeriopPreopService.submitChecklistPhase | `src/modules/procedures_perioperative/services/periop-preop.service.ts:610` |
| `procedures_perioperative.surgical_safety_checklists` | LEE | LEE | DIRECTA | PeriopController.submitChecklistPhase → PeriopPreopService.submitChecklistPhase → PeriopPreopRepository.findChecklistForUpdate | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:377` |
| `procedures_perioperative.surgical_safety_items` | LEE | LEE | DIRECTA | PeriopController.submitChecklistPhase → PeriopPreopService.submitChecklistPhase → PeriopPreopRepository.findItemsByPhase | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:406` |
| `procedures_perioperative.surgical_safety_responses` | ESCRIBE | CREA | DIRECTA | PeriopController.submitChecklistPhase → PeriopPreopService.submitChecklistPhase → PeriopPreopRepository.createResponse | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:466` |
| `procedures_perioperative.surgical_safety_responses` | LEE | LEE | DIRECTA | PeriopController.submitChecklistPhase → PeriopPreopService.submitChecklistPhase → PeriopPreopRepository.findResponsesByChecklist | `src/modules/procedures_perioperative/repositories/periop-preop.repository.ts:488` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `checklistId` | path | Sí | `string` | — |

### Cuerpo — DTO `SubmitChecklistPhaseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `phase` | `string` | Sí | valores: SIGN_IN, TIME_OUT, SIGN_OUT | `@IsIn(CHECKLIST_PHASES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1391` |
| `respondedByProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Profesional que responde | `src/modules/procedures_perioperative/dto/periop.dto.ts:1398` |
| `responses` | `array<ChecklistResponseItemDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ChecklistResponseItemDto)` | Respuestas de la fase | `src/modules/procedures_perioperative/dto/periop.dto.ts:1411` |
| `responses[].itemId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1348` |
| `responses[].status` | `string` | Sí | valores: CONFIRMED, NOT_APPLICABLE, EXCEPTION | `@IsIn(RESPONSE_STATUSES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1355` |
| `responses[].responseBoolean` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1363` |
| `responses[].responseText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:1371` |
| `responses[].exceptionReason` | `string` | No | — | `@IsOptional()` `@IsString()` | Justificación; obligatoria cuando la respuesta es EXCEPTION | `src/modules/procedures_perioperative/dto/periop.dto.ts:1381` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "phase": "SIGN_IN",
  "respondedByProfileId": "00000000-0000-4000-8000-000000000001",
  "responses": [
    {
      "itemId": "00000000-0000-4000-8000-000000000001",
      "status": "CONFIRMED"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "phase": "SIGN_IN",
  "respondedByProfileId": "00000000-0000-4000-8000-000000000001",
  "responses": [
    {
      "itemId": "00000000-0000-4000-8000-000000000001",
      "status": "CONFIRMED",
      "responseBoolean": true,
      "responseText": "valor-ejemplo",
      "exceptionReason": "Texto descriptivo de ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<ChecklistPhaseResponseDto>` · DTO `ChecklistPhaseResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `checklistId` | `string` | Sí | formato uuid | — | Identificador asociado a checklist. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1422` |
| `recorded` | `number` | Sí | — | — | Respuestas registradas en esta fase | `src/modules/procedures_perioperative/dto/periop.dto.ts:1428` |
| `phaseCompleted` | `boolean` | Sí | — | — | true si la fase quedó completa | `src/modules/procedures_perioperative/dto/periop.dto.ts:1434` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:1440` |
| `milestoneId` | `string` | No | formato uuid | — | Hito de time-out, si la fase completada fue esa | `src/modules/procedures_perioperative/dto/periop.dto.ts:1449` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Checklist no encontrado |
| 409 | `CONFLICT` | ConflictException: El checklist ya está completo; ConflictException: La fase ya está completa |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una respuesta de excepción necesita justificación; PreconditionFailedException: El checklist pertenece a otro caso; PreconditionFailedException: La fase no tiene ítems definidos; PreconditionFailedException: El ítem no pertenece a esta fase |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:159` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `UC-53-05`

---

## 34. POST /procedure-cases/{id}/specimens

- **Origen:** CONTRATO
- **Nombre:** Registrar una muestra tomada en la intervención
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.recordSpecimen` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:583`

### Qué es y para qué sirve (negocio)

Registrar una muestra tomada en la intervención. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/specimens` la atiende `PeriopController.recordSpecimen` (src/modules/procedures_perioperative/controllers/periop.controller.ts:583). Exige sesión con alguno de los roles SURGEON, PERIOP_NURSE, PERIOP_ADMIN. Valida el cuerpo como `RecordSpecimenDto` (7 campos, 3 obligatorios). Delega en `PeriopIntraopService.recordSpecimen`. Crea filas en procedures_perioperative.procedure_specimens. Lee procedures_perioperative.operative_steps.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, PERIOP_NURSE, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:583` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:583` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.operative_steps` | LEE | LEE | DIRECTA | PeriopController.recordSpecimen → PeriopIntraopService.recordSpecimen → PeriopIntraopRepository.findStepById | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:213` |
| `procedures_perioperative.procedure_specimens` | ESCRIBE | CREA | DIRECTA | PeriopController.recordSpecimen → PeriopIntraopService.recordSpecimen → PeriopIntraopRepository.createSpecimen | `src/modules/procedures_perioperative/repositories/periop-intraop.repository.ts:590` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordSpecimenDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `procedureId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2194` |
| `specimenId` | `string` | Sí | formato uuid | `@IsUUID()` | Muestra registrada en laboratorio | `src/modules/procedures_perioperative/dto/periop.dto.ts:2204` |
| `specimenRole` | `string` | Sí | valores: BIOPSY, RESECTION, CULTURE | `@IsIn(SPECIMEN_ROLES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2211` |
| `operativeStepId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2219` |
| `bodySiteConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2227` |
| `orientationText` | `string` | No | — | `@IsOptional()` `@IsString()` | Orientación de la pieza para el patólogo | `src/modules/procedures_perioperative/dto/periop.dto.ts:2237` |
| `surgeonComment` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:2245` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "procedureId": "00000000-0000-4000-8000-000000000001",
  "specimenId": "00000000-0000-4000-8000-000000000001",
  "specimenRole": "BIOPSY"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "procedureId": "00000000-0000-4000-8000-000000000001",
  "specimenId": "00000000-0000-4000-8000-000000000001",
  "specimenRole": "BIOPSY",
  "operativeStepId": "00000000-0000-4000-8000-000000000001",
  "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
  "orientationText": "valor-ejemplo",
  "surgeonComment": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<SuppliesResponseDto>` · DTO `SuppliesResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2256` |
| `procedureCaseId` | `string` | Sí | formato uuid | — | Identificador asociado a procedure case. | `src/modules/procedures_perioperative/dto/periop.dto.ts:2262` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso no está en curso; PreconditionFailedException: El paso no pertenece al caso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:257` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 35. GET /procedure-cases/{id}/team-members

- **Origen:** CONTRATO
- **Nombre:** Listar el equipo del caso quirúrgico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.listTeamMembers` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:309`

### Qué es y para qué sirve (negocio)

Listar el equipo del caso quirúrgico. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /procedure-cases/{id}/team-members` la atiende `PeriopController.listTeamMembers` (src/modules/procedures_perioperative/controllers/periop.controller.ts:309). Exige sesión con alguno de los roles SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN. Delega en `PeriopCasesService.listTeamMembers`. Lee procedures_perioperative.procedure_case_team_members, procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:309` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:309` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.procedure_case_team_members` | LEE | LEE | DIRECTA | PeriopController.listTeamMembers → PeriopCasesService.listTeamMembers → PeriopCasesRepository.findTeamByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:647` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopController.listTeamMembers → PeriopCasesService.listTeamMembers → PeriopCasesRepository.findCaseById | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:193` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<TeamMemberSummaryDto[]>` · DTO `TeamMemberSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:834` |
| `practitionerProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a practitioner profile. | `src/modules/procedures_perioperative/dto/periop.dto.ts:840` |
| `teamRoleConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a team role concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:846` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Asignado o aceptado | `src/modules/procedures_perioperative/dto/periop.dto.ts:852` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 36. POST /procedure-cases/{id}/team-members

- **Origen:** CONTRATO
- **Nombre:** Asignar un miembro al equipo quirúrgico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.assignTeamMember` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:232`

### Qué es y para qué sirve (negocio)

Asignar un miembro al equipo quirúrgico. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/team-members` la atiende `PeriopController.assignTeamMember` (src/modules/procedures_perioperative/controllers/periop.controller.ts:232). Exige sesión con alguno de los roles SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN. Valida el cuerpo como `AssignTeamMemberDto` (2 campos, 2 obligatorios). Delega en `PeriopCasesService.assignTeamMember`. Crea filas en messaging.domain_events, messaging.outbox_messages, procedures_perioperative.procedure_case_status_history, procedures_perioperative.procedure_case_team_members. Actualiza procedures_perioperative.procedure_case_team_members, procedures_perioperative.procedure_cases. Lee messaging.outbox_messages, procedures_perioperative.procedure_case_team_members. Publica periop.case.reacceptance_required.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGERY_SCHEDULER, SURGEON, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:232` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/procedures_perioperative/controllers/periop.controller.ts:232` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PeriopController.assignTeamMember → PeriopCasesService.assignTeamMember → PeriopReacceptanceService.invalidateBeforeExecution → PeriopReacceptanceService.invalidate → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PeriopController.assignTeamMember → PeriopCasesService.assignTeamMember → PeriopReacceptanceService.invalidateBeforeExecution → PeriopReacceptanceService.invalidate → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PeriopController.assignTeamMember → PeriopCasesService.assignTeamMember → PeriopReacceptanceService.invalidateBeforeExecution → PeriopReacceptanceService.invalidate → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `procedures_perioperative.procedure_case_status_history` | ESCRIBE | CREA | DIRECTA | PeriopController.assignTeamMember → PeriopCasesService.assignTeamMember → PeriopReacceptanceService.invalidateBeforeExecution → PeriopReacceptanceService.invalidate → PeriopCasesRepository.createStatusHistory | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:437` |
| `procedures_perioperative.procedure_case_team_members` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.assignTeamMember → PeriopCasesService.assignTeamMember → PeriopReacceptanceService.invalidateBeforeExecution → PeriopReacceptanceService.invalidate | `src/modules/procedures_perioperative/services/periop-reacceptance.service.ts:97` |
| `procedures_perioperative.procedure_case_team_members` | ESCRIBE | CREA | DIRECTA | PeriopController.assignTeamMember → PeriopCasesService.assignTeamMember → PeriopCasesRepository.createTeamMember | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:628` |
| `procedures_perioperative.procedure_case_team_members` | LEE | LEE | DIRECTA | PeriopController.assignTeamMember → PeriopCasesService.assignTeamMember → PeriopCasesRepository.findTeamByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:647` |
| `procedures_perioperative.procedure_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | PeriopController.assignTeamMember → PeriopCasesService.assignTeamMember → PeriopReacceptanceService.invalidateBeforeExecution → PeriopReacceptanceService.invalidate | `src/modules/procedures_perioperative/services/periop-reacceptance.service.ts:115` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `periop.case.reacceptance_required` | `src/modules/procedures_perioperative/services/periop-reacceptance.service.ts:121` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AssignTeamMemberDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practitionerProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:444` |
| `role` | `string` | Sí | valores: SURGEON, ASSISTANT, ANESTHESIOLOGIST, SCRUB_NURSE, CIRCULATING_NURSE | `@IsIn(TEAM_ROLES)` | — | `src/modules/procedures_perioperative/dto/periop.dto.ts:451` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "role": "SURGEON"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "role": "SURGEON"
}
```

</details>

### Respuesta — `Promise<TeamMemberResponseDto>` · DTO `TeamMemberResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:514` |
| `procedureCaseId` | `string` | Sí | formato uuid | — | Identificador asociado a procedure case. | `src/modules/procedures_perioperative/dto/periop.dto.ts:520` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:526` |
| `teamSize` | `number` | Sí | — | — | Miembros del equipo tras la asignación | `src/modules/procedures_perioperative/dto/periop.dto.ts:532` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El profesional ya tiene ese rol en el caso |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso está cancelado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:100` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 37. POST /procedure-cases/{id}/team-members/{memberId}/accept

- **Origen:** CONTRATO
- **Nombre:** Aceptar la participación en el equipo quirúrgico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.acceptTeamMember` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:332`

### Qué es y para qué sirve (negocio)

Aceptar la participación en el equipo quirúrgico. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/team-members/{memberId}/accept` la atiende `PeriopController.acceptTeamMember` (src/modules/procedures_perioperative/controllers/periop.controller.ts:332). Exige sesión con alguno de los roles SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN. Delega en `PeriopCasesService.acceptTeamMember`. Lee procedures_perioperative.procedure_case_team_members, profiles.professional_credentials.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:332` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, memberId | `src/modules/procedures_perioperative/controllers/periop.controller.ts:332` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `procedures_perioperative.procedure_case_team_members` | LEE | LEE | DIRECTA | PeriopController.acceptTeamMember → PeriopCasesService.acceptTeamMember → PeriopCasesRepository.findTeamByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:647` |
| `profiles.professional_credentials` | LEE | LEE | DIRECTA | PeriopController.acceptTeamMember → PeriopCasesService.acceptTeamMember → ProfessionalCredentialsRepository.hasCurrentCredential | `src/modules/profiles/infrastructure/repositories/professional-credentials.repository.ts:155` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `memberId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<TeamMemberResponseDto>` · DTO `TeamMemberResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:514` |
| `procedureCaseId` | `string` | Sí | formato uuid | — | Identificador asociado a procedure case. | `src/modules/procedures_perioperative/dto/periop.dto.ts:520` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:526` |
| `teamSize` | `number` | Sí | — | — | Miembros del equipo tras la asignación | `src/modules/procedures_perioperative/dto/periop.dto.ts:532` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El integrante no pertenece al caso |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso está cancelado; PreconditionFailedException: Sólo el propio integrante puede aceptar su participación; PreconditionFailedException: CAN-INT-002: el integrante no tiene credencial profesional vigente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 38. POST /procedure-cases/{id}/team-members/{memberId}/respond

- **Origen:** CONTRATO
- **Nombre:** Rechazar, pedir cambios o informar indisponibilidad
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopController.respondTeamMember` — `src/modules/procedures_perioperative/controllers/periop.controller.ts:367`

### Qué es y para qué sirve (negocio)

Rechazar, pedir cambios o informar indisponibilidad. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /procedure-cases/{id}/team-members/{memberId}/respond` la atiende `PeriopController.respondTeamMember` (src/modules/procedures_perioperative/controllers/periop.controller.ts:367). Exige sesión con alguno de los roles SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN. Valida el cuerpo como `RespondTeamMemberDto` (2 campos, 2 obligatorios). Delega en `PeriopCasesService.respondTeamMember`. Crea filas en audit.audit_log, messaging.domain_events, messaging.outbox_messages. Lee audit.audit_log, iam.sessions, messaging.outbox_messages, procedures_perioperative.procedure_case_team_members. Publica periop.case.team_participation_declined.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SURGEON, ANESTHESIOLOGIST, PERIOP_NURSE, SURGERY_SCHEDULER, PERIOP_ADMIN | `src/modules/procedures_perioperative/controllers/periop.controller.ts:367` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, memberId | `src/modules/procedures_perioperative/controllers/periop.controller.ts:367` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PeriopController.respondTeamMember → PeriopCasesService.respondTeamMember → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PeriopController.respondTeamMember → PeriopCasesService.respondTeamMember → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | PeriopController.respondTeamMember → PeriopCasesService.respondTeamMember → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | PeriopController.respondTeamMember → PeriopCasesService.respondTeamMember → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | PeriopController.respondTeamMember → PeriopCasesService.respondTeamMember → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | PeriopController.respondTeamMember → PeriopCasesService.respondTeamMember → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `procedures_perioperative.procedure_case_team_members` | LEE | LEE | DIRECTA | PeriopController.respondTeamMember → PeriopCasesService.respondTeamMember → PeriopCasesRepository.findTeamByCase | `src/modules/procedures_perioperative/repositories/periop-cases.repository.ts:647` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `periop.case.team_participation_declined` | `src/modules/procedures_perioperative/services/periop-cases.service.ts:1536` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `memberId` | path | Sí | `string` | — |

### Cuerpo — DTO `RespondTeamMemberDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `response` | `string` | Sí | valores: DECLINE, REQUEST_CHANGE, UNAVAILABLE | `@IsIn(TEAM_PARTICIPATION_RESPONSES)` | Rechazo, solicitud de modificación o indisponibilidad informada | `src/modules/procedures_perioperative/dto/periop.dto.ts:486` |
| `reasonText` | `string` | Sí | longitud mínima 1; longitud máxima 2000 | `@IsString()` `@MinLength(1)` `@MaxLength(2000)` | Motivo de la respuesta (obligatorio) | `src/modules/procedures_perioperative/dto/periop.dto.ts:503` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "response": "DECLINE",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "response": "DECLINE",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<TeamMemberResponseDto>` · DTO `TeamMemberResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/procedures_perioperative/dto/periop.dto.ts:514` |
| `procedureCaseId` | `string` | Sí | formato uuid | — | Identificador asociado a procedure case. | `src/modules/procedures_perioperative/dto/periop.dto.ts:520` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/procedures_perioperative/dto/periop.dto.ts:526` |
| `teamSize` | `number` | Sí | — | — | Miembros del equipo tras la asignación | `src/modules/procedures_perioperative/dto/periop.dto.ts:532` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El integrante no pertenece al caso |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso está cancelado; PreconditionFailedException: Sólo el propio integrante puede responder a su participación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/procedures_perioperative/controllers/periop.controller.spec.ts:118` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 39. GET /sites/{siteId}/operating-rooms

- **Origen:** CONTRATO
- **Nombre:** Quirófanos de una sede
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopOrController.operatingRooms` — `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:228`

### Qué es y para qué sirve (negocio)

Quirófanos de una sede. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /sites/{siteId}/operating-rooms` la atiende `PeriopOrController.operatingRooms` (src/modules/procedures_perioperative/controllers/periop-or.controller.ts:228). Exige sesión; el controlador no declara roles. Delega en `OperatingRoomsReadUseCases.list`. Lee clinical.encounter_locations, delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.clinical_units, practice.practice_settings, practice.practice_sites y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:228` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:228` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | LEE | LEE | POR_SQL | PeriopOrController.operatingRooms → OperatingRoomsReadUseCases.list → PracticeCareSpaceOpsAdapter.getOperationalState → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.occupancy → CareSpaceOpsRepository.occupancy | `src/modules/practice/repositories/care-space-ops.repository.ts:178` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | PeriopOrController.operatingRooms → OperatingRoomsReadUseCases.list → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | PeriopOrController.operatingRooms → OperatingRoomsReadUseCases.list → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PeriopOrController.operatingRooms → OperatingRoomsReadUseCases.list → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | PeriopOrController.operatingRooms → OperatingRoomsReadUseCases.list → PracticeCareSpaceOpsAdapter.getOperationalState → PracticeCareSpaceOpsAdapter.load → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | PeriopOrController.operatingRooms → OperatingRoomsReadUseCases.list → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_settings` | LEE | LEE | POR_SQL | PeriopOrController.operatingRooms → OperatingRoomsReadUseCases.list → PracticeCareSpaceOpsAdapter.getOperationalState → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.settings → CareSpaceOpsRepository.settings | `src/modules/practice/repositories/care-space-ops.repository.ts:431` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PeriopOrController.operatingRooms → OperatingRoomsReadUseCases.list → PracticeCareSpaceOpsAdapter.getOperationalState → PracticeCareSpaceOpsAdapter.load → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | PeriopOrController.operatingRooms → OperatingRoomsReadUseCases.list → InfrastructureAccessService.scopeFilter → CareSpaceOpsRepository.siteScopeIndex | `src/modules/practice/repositories/care-space-ops.repository.ts:473` |
| `procedures_perioperative.operating_room_blocks` | LEE | LEE | DIRECTA | PeriopOrController.operatingRooms → OperatingRoomsReadUseCases.list | `src/modules/procedures_perioperative/services/or/or-read.use-cases.ts:100` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopOrController.operatingRooms → OperatingRoomsReadUseCases.list | `src/modules/procedures_perioperative/services/or/or-read.use-cases.ts:95` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | PeriopOrController.operatingRooms → OperatingRoomsReadUseCases.list → OperatingRoomsReadUseCases.rooms | `src/modules/procedures_perioperative/services/or/or-read.use-cases.ts:54` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Acción de infraestructura no registrada: {action} |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-or-f4.int-spec.ts:348` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopOrController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 40. GET /sites/{siteId}/or-blocks

- **Origen:** CONTRATO
- **Nombre:** Bloques de quirófano
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopOrController.listBlocks` — `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:238`

### Qué es y para qué sirve (negocio)

Bloques de quirófano. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /sites/{siteId}/or-blocks` la atiende `PeriopOrController.listBlocks` (src/modules/procedures_perioperative/controllers/periop-or.controller.ts:238). Exige sesión; el controlador no declara roles. Delega en `OrBlocksUseCases.list`. Lee delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.space_unit_assignments, procedures_perioperative.operating_room_blocks y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:238` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:238` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | PeriopOrController.listBlocks → OrBlocksUseCases.list → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | PeriopOrController.listBlocks → OrBlocksUseCases.list → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PeriopOrController.listBlocks → OrBlocksUseCases.list → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | PeriopOrController.listBlocks → OrBlocksUseCases.list → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | PeriopOrController.listBlocks → OrBlocksUseCases.list → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PeriopOrController.listBlocks → OrBlocksUseCases.list → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | PeriopOrController.listBlocks → OrBlocksUseCases.list → InfrastructureAccessService.scopeFilter → CareSpaceOpsRepository.siteScopeIndex | `src/modules/practice/repositories/care-space-ops.repository.ts:473` |
| `procedures_perioperative.operating_room_blocks` | LEE | LEE | DIRECTA | PeriopOrController.listBlocks → OrBlocksUseCases.list | `src/modules/procedures_perioperative/services/or/or.use-cases.ts:849` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | PeriopOrController.listBlocks → OrBlocksUseCases.list | `src/modules/procedures_perioperative/services/or/or.use-cases.ts:862` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | PeriopOrController.listBlocks → OrBlocksUseCases.list → OrBlocksUseCases.labels → CaseOrViewBuilder.blockLabels | `src/modules/procedures_perioperative/services/or/case-or-view.ts:145` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado; ResourceNotFoundException: Quirófano no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Acción de infraestructura no registrada: {action} |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-or-f4.int-spec.ts:338` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopOrController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 41. POST /sites/{siteId}/or-blocks

- **Origen:** CONTRATO
- **Nombre:** Crear un bloque de quirófano
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopOrController.createBlocks` — `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:255`

### Qué es y para qué sirve (negocio)

Crear un bloque de quirófano. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /sites/{siteId}/or-blocks` la atiende `PeriopOrController.createBlocks` (src/modules/procedures_perioperative/controllers/periop-or.controller.ts:255). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateOrBlocksDto` (11 campos, 4 obligatorios). Delega en `OrBlocksUseCases.create`. Crea filas en procedures_perioperative.operating_room_block_series, procedures_perioperative.operating_room_blocks. Lee delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, practice.care_space_blocks, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.space_unit_assignments y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:255` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:255` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | PeriopOrController.createBlocks → OrBlocksUseCases.create → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | PeriopOrController.createBlocks → OrBlocksUseCases.create → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PeriopOrController.createBlocks → OrBlocksUseCases.create → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_space_blocks` | LEE | LEE | DIRECTA | PeriopOrController.createBlocks → OrBlocksUseCases.create → PracticeCareSpaceOpsAdapter.assertBookable → CareSpaceOpsRepository.openBlocks | `src/modules/practice/repositories/care-space-ops.repository.ts:223` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | PeriopOrController.createBlocks → OrBlocksUseCases.create → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | PeriopOrController.createBlocks → OrBlocksUseCases.create → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PeriopOrController.createBlocks → OrBlocksUseCases.create → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | PeriopOrController.createBlocks → OrBlocksUseCases.create → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpaceOpsRepository.unitsOf | `src/modules/practice/repositories/care-space-ops.repository.ts:146` |
| `procedures_perioperative.operating_room_block_series` | ESCRIBE | CREA | DIRECTA | PeriopOrController.createBlocks → OrBlocksUseCases.create | `src/modules/procedures_perioperative/services/or/or.use-cases.ts:652` |
| `procedures_perioperative.operating_room_blocks` | ESCRIBE | CREA | DIRECTA | PeriopOrController.createBlocks → OrBlocksUseCases.create | `src/modules/procedures_perioperative/services/or/or.use-cases.ts:695` |
| `procedures_perioperative.operating_room_blocks` | LEE | LEE | POR_SQL | PeriopOrController.createBlocks → OrBlocksUseCases.create → OrBlocksUseCases.labels → CaseOrViewBuilder.blockLabels | `src/modules/procedures_perioperative/services/or/case-or-view.ts:145` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | PeriopOrController.createBlocks → OrBlocksUseCases.create → OrBlocksUseCases.labels → CaseOrViewBuilder.blockLabels | `src/modules/procedures_perioperative/services/or/case-or-view.ts:145` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateOrBlocksDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `operatingRoomId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:90` |
| `ownerKind` | `string` | Sí | valores: SERVICE, SURGEON | `@IsIn(['SERVICE', 'SURGEON'])` | — | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:93` |
| `clinicalUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:97` |
| `specialtyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de especialidad | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:104` |
| `surgeonProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:108` |
| `startsAt` | `string` | Sí | formato date-time | `@Type(() => Date)` `@IsDate()` | — | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:112` |
| `endsAt` | `string` | Sí | formato date-time | `@Type(() => Date)` `@IsDate()` | — | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:116` |
| `releaseHours` | `number` | No | mínimo 0; máximo 720 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(720)` | — | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:122` |
| `recurrence` | `OrBlockRecurrenceDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => OrBlockRecurrenceDto)` | — | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:127` |
| `recurrence.weekdays` | `array<number>` | No | mínimo 1; máximo 7; máximo 7 elemento(s) | `@IsArray()` `@ArrayNotEmpty()` `@ArrayMaxSize(7)` `@ArrayUnique()` `@IsInt({ each: true })` `@Min(1, { each: true })` `@Max(7, { each: true })` | Días ISO 1–7, sin repetir | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:79` |
| `recurrence.until` | `string` | No | patrón runtime /^\d{4}-\d{2}-\d{2}$/ | `@IsISO8601({ strict: true })` `@Matches(/^\d{4}-\d{2}-\d{2}$/)` | yyyy-mm-dd, como mucho un año después del inicio | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:85` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "operatingRoomId": "00000000-0000-4000-8000-000000000001",
  "ownerKind": "SERVICE",
  "startsAt": "2026-07-31T12:00:00.000Z",
  "endsAt": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "operatingRoomId": "00000000-0000-4000-8000-000000000001",
  "ownerKind": "SERVICE",
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "surgeonProfileId": "00000000-0000-4000-8000-000000000001",
  "startsAt": "2026-07-31T12:00:00.000Z",
  "endsAt": "2026-07-31T12:00:00.000Z",
  "releaseHours": 1,
  "recurrence": {
    "weekdays": [
      1
    ],
    "until": "valor-ejemplo"
  }
}
```

</details>

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El espacio no es un quirófano de la sede; PreconditionFailedException: El bloque necesita dueño; PreconditionFailedException: El bloque no puede empezar en el pasado; PreconditionFailedException: El bloque debe terminar después de empezar y durar como mucho 24 h; PreconditionFailedException: La serie necesita días ISO 1–7 sin repetir y un fin dentro del año siguiente; PreconditionFailedException: Máximo 400 instancias; PreconditionFailedException: El quirófano no está disponible |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Acción de infraestructura no registrada: {action} |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-or-f4.int-spec.ts:273` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopOrController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 42. GET /sites/{siteId}/or-utilization

- **Origen:** CONTRATO
- **Nombre:** Utilización de quirófanos
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PeriopOrController.utilization` — `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:334`

### Qué es y para qué sirve (negocio)

Utilización de quirófanos. Dentro del módulo (descripción del modelo, en inglés): «Models medical interventions and operations from request and scheduling through preoperative assessment, surgical safety, anesthesia, operative execution, devices/implants/specimens, complications, recovery, follow-up…» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_53_procedures_perioperative.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /sites/{siteId}/or-utilization` la atiende `PeriopOrController.utilization` (src/modules/procedures_perioperative/controllers/periop-or.controller.ts:334). Exige sesión; el controlador no declara roles. Delega en `OperatingRoomsReadUseCases.utilization`. Lee delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.space_unit_assignments, procedures_perioperative.operating_room_blocks y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:334` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_QUERY | from (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | to (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/procedures_perioperative/controllers/periop-or.controller.ts:334` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | PeriopOrController.utilization → OperatingRoomsReadUseCases.utilization → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | PeriopOrController.utilization → OperatingRoomsReadUseCases.utilization → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | PeriopOrController.utilization → OperatingRoomsReadUseCases.utilization → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | PeriopOrController.utilization → OperatingRoomsReadUseCases.utilization → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | PeriopOrController.utilization → OperatingRoomsReadUseCases.utilization → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | PeriopOrController.utilization → OperatingRoomsReadUseCases.utilization → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | PeriopOrController.utilization → OperatingRoomsReadUseCases.utilization → InfrastructureAccessService.scopeFilter → CareSpaceOpsRepository.siteScopeIndex | `src/modules/practice/repositories/care-space-ops.repository.ts:473` |
| `procedures_perioperative.operating_room_blocks` | LEE | LEE | DIRECTA | PeriopOrController.utilization → OperatingRoomsReadUseCases.utilization | `src/modules/procedures_perioperative/services/or/or-read.use-cases.ts:186` |
| `procedures_perioperative.operating_room_utilization_events` | LEE | LEE | DIRECTA | PeriopOrController.utilization → OperatingRoomsReadUseCases.utilization | `src/modules/procedures_perioperative/services/or/or-read.use-cases.ts:191` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | PeriopOrController.utilization → OperatingRoomsReadUseCases.utilization → OperatingRoomsReadUseCases.rooms | `src/modules/procedures_perioperative/services/or/or-read.use-cases.ts:54` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |
| `from` | query | Sí | `string` | — |
| `to` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado; ResourceNotFoundException: Quirófano no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Rango de fechas inválido; PreconditionFailedException: El rango no puede superar 366 días |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Acción de infraestructura no registrada: {action} |

El árbol de decisión completo está en [flujos](../flujos/procedures_perioperative.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-or-f4.int-spec.ts:342` |

### Flujos

- Módulo 53 — Procedimientos y Perioperatorio — etapa `ctrl:PeriopOrController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

