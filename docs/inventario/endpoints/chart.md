<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `chart`

- **Bloque:** Clínico y Diagnóstico (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)
- **Operaciones:** 23 (23 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 3 · MEDIO 13 · BAJO 7
- **Tablas distintas que tocan:** 41
- **Respuestas de error y detalle contractual:** `openapi/endpoints/chart.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/charts/care-plans` | Crear un plan de cuidado con actividades | MEDIO | 5 | CLINICIAN, PRACTITIONER |
| 2 | PATCH | `/charts/care-plans/{planId}/activities/{activityId}` | Actualizar una actividad del plan de cuidado | MEDIO | 20 | CLINICIAN, PRACTITIONER |
| 3 | POST | `/charts/documents` | Adjuntar un documento con archivos gobernados | MEDIO | 5 | CLINICIAN, PRACTITIONER |
| 4 | GET | `/charts/documents/{documentId}/files/{fileId}/content` | Descargar el archivo de un documento del expediente | BAJO | 22 | CLINICIAN, PRACTITIONER |
| 5 | GET | `/charts/encounters/{id}/pdf` | Descargar el PDF oficial de un encuentro cerrado | BAJO | 30 | CLINICIAN, PRACTITIONER |
| 6 | GET | `/charts/me/documents` | Ver mis documentos visibles | ALTO | 3 | sesión (sin roles) |
| 7 | GET | `/charts/me/documents/{documentId}/files/{fileId}/content` | Descargar el archivo de un documento propio | ALTO | 5 | sesión (sin roles) |
| 8 | GET | `/charts/me/encounters/{id}/pdf` | Descargar el PDF oficial de una atención propia | BAJO | 14 | sesión (sin roles) |
| 9 | GET | `/charts/me/notes` | Ver mis evoluciones liberadas | ALTO | 3 | sesión (sin roles) |
| 10 | GET | `/charts/notes` | Listar las notas de evolución de un profesional por ventana de fechas | BAJO | 2 | CLINICIAN, PRACTITIONER |
| 11 | POST | `/charts/notes` | Crear una nota clínica versionada (borrador SOAP) | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 12 | POST | `/charts/notes/{noteId}/amendments` | Enmendar una nota firmada (addendum versionado) | MEDIO | 20 | CLINICIAN, PRACTITIONER |
| 13 | PUT | `/charts/notes/{noteId}/versions` | Editar borrador creando una nueva versión inmutable | MEDIO | 20 | CLINICIAN, PRACTITIONER |
| 14 | POST | `/charts/notes/{noteId}/versions/{versionId}/cosign` | Cofirmar una versión firmada (cadena de firmas) | MEDIO | 20 | CLINICIAN, PRACTITIONER |
| 15 | POST | `/charts/notes/{noteId}/versions/{versionId}/sign` | Firmar una versión y sellar su contenido | MEDIO | 19 | CLINICIAN, PRACTITIONER |
| 16 | POST | `/charts/notes/versions/{versionId}/exam-findings` | Registrar hallazgos de examen físico | MEDIO | 20 | CLINICIAN, PRACTITIONER |
| 17 | POST | `/charts/notes/versions/{versionId}/release` | Liberar una versión al paciente | MEDIO | 20 | CLINICIAN, PRACTITIONER |
| 18 | POST | `/charts/notes/versions/{versionId}/withhold` | Retener una versión del paciente (motivo legal) | MEDIO | 20 | CLINICIAN, PRACTITIONER |
| 19 | GET | `/charts/patients/{patientProfileId}/chart` | UC-40-14: expediente del paciente (notas, planes de cuidados y documentos) | BAJO | 6 | CLINICIAN, PRACTITIONER |
| 20 | GET | `/charts/templates` | Listar las plantillas de chart por especialidad | BAJO | 3 | CLINICIAN, PRACTITIONER, SECURITY_ADMIN |
| 21 | POST | `/charts/templates` | Crear una plantilla de chart con su esquema de campos, por especialidad | MEDIO | 5 | SECURITY_ADMIN |
| 22 | GET | `/charts/templates/{id}` | Leer el esquema de una plantilla de chart | BAJO | 3 | CLINICIAN, PRACTITIONER, SECURITY_ADMIN |
| 23 | POST | `/charts/templates/{templateId}/assignments` | Asignar una plantilla de chart por especialidad | MEDIO | 3 | SECURITY_ADMIN |

---

## 1. POST /charts/care-plans

- **Origen:** CONTRATO
- **Nombre:** Crear un plan de cuidado con actividades
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartCarePlansController.createCarePlan` — `src/modules/chart/controllers/chart-care-plans.controller.ts:48`

### Qué es y para qué sirve (negocio)

Crear un plan de cuidado con actividades. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /charts/care-plans` la atiende `ChartCarePlansController.createCarePlan` (src/modules/chart/controllers/chart-care-plans.controller.ts:48). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateCarePlanDto` (13 campos, 1 obligatorio). Delega en `ChartCarePlansService.createCarePlan`. Crea filas en chart.care_plan_activities, chart.care_plans. Lee clinical.conditions, clinical.encounters, forms.form_instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-care-plans.controller.ts:48` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.care_plan_activities` | ESCRIBE | CREA | DIRECTA | ChartCarePlansController.createCarePlan → ChartCarePlansService.createCarePlan → CarePlansRepository.createActivity | `src/modules/chart/repositories/care-plans.repository.ts:240` |
| `chart.care_plans` | ESCRIBE | CREA | DIRECTA | ChartCarePlansController.createCarePlan → ChartCarePlansService.createCarePlan → CarePlansRepository.createPlan | `src/modules/chart/repositories/care-plans.repository.ts:210` |
| `clinical.conditions` | LEE | LEE | DIRECTA | ChartCarePlansController.createCarePlan → ChartCarePlansService.createCarePlan → ChartEncounterScopeService.assertConditionBelongsToPatient → ConditionsRepository.findById | `src/modules/clinical/repositories/conditions.repository.ts:107` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ChartCarePlansController.createCarePlan → ChartCarePlansService.createCarePlan → ChartEncounterScopeService.assertEncounterBelongsToPatientAndWritable → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:169` |
| `forms.form_instances` | LEE | LEE | DIRECTA | ChartCarePlansController.createCarePlan → ChartCarePlansService.createCarePlan → FormInstanceOriginValidator.assertUsableOrigin | `src/modules/forms/services/form-instance-origin.validator.ts:43` |

### Cuerpo — DTO `CreateCarePlanDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil de paciente (profiles.patient_profiles) | `src/modules/chart/dto/care-plans.dto.ts:59` |
| `conditionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Condición clínica asociada | `src/modules/chart/dto/care-plans.dto.ts:70` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro clínico asociado | `src/modules/chart/dto/care-plans.dto.ts:81` |
| `formInstanceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Instancia CERRADA del formulario médico (forms.form_instances) de la que sale el plan. Opcional: desde la historia se emite sin formulario. Si viaja, debe existir, estar cerrada y ser del mismo encuentro (422 PRECONDITION_FAILED si no) | `src/modules/chart/dto/care-plans.dto.ts:95` |
| `intentConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de la intención del plan | `src/modules/chart/dto/care-plans.dto.ts:106` |
| `authorProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil del clínico autor | `src/modules/chart/dto/care-plans.dto.ts:117` |
| `goalText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Meta clínica del plan | `src/modules/chart/dto/care-plans.dto.ts:126` |
| `startDate` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | Fecha de inicio (YYYY-MM-DD) | `src/modules/chart/dto/care-plans.dto.ts:138` |
| `endDate` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | Fecha de fin (YYYY-MM-DD) | `src/modules/chart/dto/care-plans.dto.ts:150` |
| `activities` | `array<CarePlanActivityInputDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => CarePlanActivityInputDto)` | Actividades iniciales (0..n) | `src/modules/chart/dto/care-plans.dto.ts:163` |
| `activities[].activityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del tipo de actividad | `src/modules/chart/dto/care-plans.dto.ts:25` |
| `activities[].scheduledAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Momento programado | `src/modules/chart/dto/care-plans.dto.ts:37` |
| `activities[].detailText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/chart/dto/care-plans.dto.ts:46` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "conditionId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "formInstanceId": "00000000-0000-4000-8000-000000000001",
  "intentConceptId": "00000000-0000-4000-8000-000000000001",
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "goalText": "valor-ejemplo",
  "startDate": "2026-07-31",
  "endDate": "2026-07-31",
  "activities": [
    {
      "activityConceptId": "00000000-0000-4000-8000-000000000001",
      "scheduledAt": "2026-07-31T12:00:00.000Z",
      "detailText": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<CarePlanResponseDto>` · DTO `CarePlanResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/chart/dto/care-plans.dto.ts:207` |
| `formInstanceId` | `string` | No | formato uuid; admite null | — | Instancia del formulario médico de la que salió el plan (nulo = sin formulario) | `src/modules/chart/dto/care-plans.dto.ts:218` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado del plan | `src/modules/chart/dto/care-plans.dto.ts:227` |
| `activityCount` | `number` | Sí | — | — | Nº de actividades creadas | `src/modules/chart/dto/care-plans.dto.ts:233` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/chart/dto/care-plans.dto.ts:239` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Un plan de cuidados necesita un profesional autor.; ForbiddenException: La sesión no tiene un perfil profesional con el que crear el plan.; ForbiddenException: El autor del plan es el profesional de la sesión: no se crea en nombre de otro perfil. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado; ResourceNotFoundException: Diagnóstico no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El encuentro ya está cerrado y sellado: no admite más escrituras. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:504` |
| CONTROLADOR | `src/modules/chart/controllers/chart-care-plans.controller.spec.ts:31` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartCarePlansController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. PATCH /charts/care-plans/{planId}/activities/{activityId}

- **Origen:** CONTRATO
- **Nombre:** Actualizar una actividad del plan de cuidado
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartCarePlansController.updateActivity` — `src/modules/chart/controllers/chart-care-plans.controller.ts:65`

### Qué es y para qué sirve (negocio)

Actualizar una actividad del plan de cuidado. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /charts/care-plans/{planId}/activities/{activityId}` la atiende `ChartCarePlansController.updateActivity` (src/modules/chart/controllers/chart-care-plans.controller.ts:65). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `UpdateActivityDto` (3 campos, 0 obligatorios). Delega en `ChartCarePlansService.updateActivity`. Actualiza chart.care_plan_activities, chart.care_plans. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 10 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-care-plans.controller.ts:65` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: planId, activityId | `src/modules/chart/controllers/chart-care-plans.controller.ts:65` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `chart.care_plan_activities` | ESCRIBE | ACTUALIZA | POR_TIPO | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity | `src/modules/chart/services/chart-care-plans.service.ts:233` |
| `chart.care_plan_activities` | LEE | LEE | DIRECTA | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity → CarePlansRepository.findActivityById | `src/modules/chart/repositories/care-plans.repository.ts:185` |
| `chart.care_plans` | ESCRIBE | ACTUALIZA | POR_TIPO | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity | `src/modules/chart/services/chart-care-plans.service.ts:248` |
| `chart.care_plans` | LEE | LEE | DIRECTA | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity → CarePlansRepository.findPlanById | `src/modules/chart/repositories/care-plans.repository.ts:96` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1007` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ChartCarePlansController.updateActivity → ChartCarePlansService.updateActivity → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `planId` | path | Sí | `string` | — |
| `activityId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateActivityDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `status` | `string` | No | valores: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED | `@IsOptional()` `@IsIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])` | Nuevo estado de la actividad | `src/modules/chart/dto/care-plans.dto.ts:181` |
| `scheduledAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | — | `src/modules/chart/dto/care-plans.dto.ts:189` |
| `detailText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/chart/dto/care-plans.dto.ts:198` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "status": "SCHEDULED",
  "scheduledAt": "2026-07-31T12:00:00.000Z",
  "detailText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ActivityResponseDto>` · DTO `ActivityResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/chart/dto/care-plans.dto.ts:248` |
| `activityType` | `string` | Sí | valores: APPOINTMENT, PROCEDURE, FOLLOW_UP, TELEHEALTH, OTHER | — | Valor de activity type mantenido por la instancia. | sin fuente |
| `subtypeCreated` | `boolean` | Sí | — | — | true si además se creó la fila del subtipo (tarea o nota) | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plan de cuidado no encontrado; ResourceNotFoundException: Actividad no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El plan de cuidado no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-care-plans.controller.spec.ts:38` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartCarePlansController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /charts/documents

- **Origen:** CONTRATO
- **Nombre:** Adjuntar un documento con archivos gobernados
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartDocumentsController.createDocument` — `src/modules/chart/controllers/chart-documents.controller.ts:55`

### Qué es y para qué sirve (negocio)

Adjuntar un documento con archivos gobernados. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /charts/documents` la atiende `ChartDocumentsController.createDocument` (src/modules/chart/controllers/chart-documents.controller.ts:55). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateDocumentDto` (14 campos, 3 obligatorios). Delega en `ChartDocumentsService.createDocument`. Crea filas en chart.document_record_files, chart.document_records. Lee clinical.encounters, common.file_versions, common.files.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-documents.controller.ts:55` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.document_record_files` | ESCRIBE | CREA | DIRECTA | ChartDocumentsController.createDocument → ChartDocumentsService.createDocument → DocumentsRepository.createFile | `src/modules/chart/repositories/documents.repository.ts:224` |
| `chart.document_records` | ESCRIBE | CREA | DIRECTA | ChartDocumentsController.createDocument → ChartDocumentsService.createDocument → DocumentsRepository.createRecord | `src/modules/chart/repositories/documents.repository.ts:192` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ChartDocumentsController.createDocument → ChartDocumentsService.createDocument → ChartEncounterScopeService.assertEncounterBelongsToPatientAndWritable → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:169` |
| `common.file_versions` | LEE | LEE | DIRECTA | ChartDocumentsController.createDocument → ChartDocumentsService.createDocument → AttachableFileService.assertUsableBy → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | ChartDocumentsController.createDocument → ChartDocumentsService.createDocument → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |

### Cuerpo — DTO `CreateDocumentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil de paciente (profiles.patient_profiles) | `src/modules/chart/dto/documents.dto.ts:66` |
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant propietario (directory.tenants) | `src/modules/chart/dto/documents.dto.ts:76` |
| `title` | `string` | Sí | longitud mínima 1; longitud máxima 500 | `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Título del documento | `src/modules/chart/dto/documents.dto.ts:85` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro clínico asociado | `src/modules/chart/dto/documents.dto.ts:96` |
| `categoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de la categoría documental | `src/modules/chart/dto/documents.dto.ts:107` |
| `sourceConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de la fuente del documento | `src/modules/chart/dto/documents.dto.ts:118` |
| `confidentialityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de confidencialidad | `src/modules/chart/dto/documents.dto.ts:129` |
| `patientVisibilityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de visibilidad para el paciente | `src/modules/chart/dto/documents.dto.ts:140` |
| `authorText` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | Autor libre (documentos externos) | `src/modules/chart/dto/documents.dto.ts:149` |
| `isExternal` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | true si el documento proviene de una fuente externa | `src/modules/chart/dto/documents.dto.ts:159` |
| `files` | `array<DocumentFileInputDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => DocumentFileInputDto)` | Archivos gobernados (0..n) | `src/modules/chart/dto/documents.dto.ts:172` |
| `files[].fileId` | `string` | No | formato uuid | `@IsUUID()` | Archivo ya subido a object_storage (common.files) | `src/modules/chart/dto/documents.dto.ts:30` |
| `files[].contentRole` | `string` | No | valores: PRIMARY, ATTACHMENT | `@IsOptional()` `@IsIn(['PRIMARY', 'ATTACHMENT'])` | Rol de contenido | `src/modules/chart/dto/documents.dto.ts:41` |
| `files[].ordinal` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Orden del archivo dentro del documento | `src/modules/chart/dto/documents.dto.ts:53` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "title": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "title": "valor-ejemplo",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "categoryConceptId": "00000000-0000-4000-8000-000000000001",
  "sourceConceptId": "00000000-0000-4000-8000-000000000001",
  "confidentialityConceptId": "00000000-0000-4000-8000-000000000001",
  "patientVisibilityConceptId": "00000000-0000-4000-8000-000000000001",
  "authorText": "valor-ejemplo",
  "isExternal": true,
  "files": [
    {
      "fileId": "00000000-0000-4000-8000-000000000001",
      "contentRole": "PRIMARY",
      "ordinal": 1
    }
  ]
}
```

</details>

### Respuesta — `Promise<DocumentResponseDto>` · DTO `DocumentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador del documento (ObjectId hex) | `src/modules/chart/dto/documents.dto.ts:181` |
| `tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | sin fuente |
| `documentType` | `string` | Sí | — | — | Valor de document type mantenido por la instancia. | sin fuente |
| `payload` | `object` | Sí | — | — | Valor de payload mantenido por la instancia. | sin fuente |
| `version` | `number` | Sí | — | — | Versión vigente (concurrencia optimista) | sin fuente |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/chart/dto/documents.dto.ts:202` |
| `updatedAt` | `string` | Sí | formato date-time | — | Fecha y hora de la última actualización. | sin fuente |
| `deletedAt` | `string` | No | formato date-time; admite null | — | Marca de borrado lógico; null si el documento está vivo | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado; ResourceNotFoundException: {labels.notFound} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El encuentro ya está cerrado y sellado: no admite más escrituras.; PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: {labels.subject} resultó infectado; PreconditionFailedException: {labels.subject} no es de un formato admitido para este uso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx15-documentos-del-expediente.int-spec.ts:143` |
| CONTROLADOR | `src/modules/chart/controllers/chart-documents.controller.spec.ts:19` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartDocumentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. GET /charts/documents/{documentId}/files/{fileId}/content

- **Origen:** CONTRATO
- **Nombre:** Descargar el archivo de un documento del expediente
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartDocumentsController.getDocumentFileContent` — `src/modules/chart/controllers/chart-documents.controller.ts:79`

### Qué es y para qué sirve (negocio)

Descargar el archivo de un documento del expediente. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /charts/documents/{documentId}/files/{fileId}/content` la atiende `ChartDocumentsController.getDocumentFileContent` (src/modules/chart/controllers/chart-documents.controller.ts:79). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `ChartDocumentsService.getDocumentFileContent`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 14 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-documents.controller.ts:79` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: documentId, fileId | `src/modules/chart/controllers/chart-documents.controller.ts:79` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ChartDocumentsController.getDocumentFileContent → ChartDocumentsService.getDocumentFileContent → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ChartDocumentsController.getDocumentFileContent → ChartDocumentsService.getDocumentFileContent → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ChartDocumentsController.getDocumentFileContent → ChartDocumentsService.getDocumentFileContent → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ChartDocumentsController.getDocumentFileContent → ChartDocumentsService.getDocumentFileContent → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ChartDocumentsController.getDocumentFileContent → ChartDocumentsService.getDocumentFileContent → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ChartDocumentsController.getDocumentFileContent → ChartDocumentsService.getDocumentFileContent → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ChartDocumentsController.getDocumentFileContent → ChartDocumentsService.getDocumentFileContent → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ChartDocumentsController.getDocumentFileContent → ChartDocumentsService.getDocumentFileContent → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ChartDocumentsController.getDocumentFileContent → ChartDocumentsService.getDocumentFileContent → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ChartDocumentsController.getDocumentFileContent → ChartDocumentsService.getDocumentFileContent → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ChartDocumentsController.getDocumentFileContent → ChartDocumentsService.getDocumentFileContent → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `chart.document_record_files` | LEE | LEE | DIRECTA | ChartDocumentsController.getDocumentFileContent → ChartDocumentsService.getDocumentFileContent → DocumentsRepository.findFilesForRecords | `src/modules/chart/repositories/documents.repository.ts:174` |
| `chart.document_records` | LEE | LEE | DIRECTA | ChartDocumentsController.getDocumentFileContent → ChartDocumentsService.getDocumentFileContent → DocumentsRepository.findRecordById | `src/modules/chart/repositories/documents.repository.ts:123` |
| `common.file_versions` | LEE | LEE | DIRECTA | ChartDocumentsController.getDocumentFileContent → ChartDocumentsService.getDocumentFileContent → FileUploadService.downloadForAuthorizedContext → FileUploadService.serveCurrentVersion → AttachableFileService.assertUsableForAuthorizedContext → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | ChartDocumentsController.getDocumentFileContent → ChartDocumentsService.getDocumentFileContent → FileUploadService.downloadForAuthorizedContext → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ChartDocumentsController.getDocumentFileContent → ChartDocumentsService.getDocumentFileContent → ClinicalReadService.assertCanReadHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | ChartDocumentsController.getDocumentFileContent → ChartDocumentsService.getDocumentFileContent → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ChartDocumentsController.getDocumentFileContent → ChartDocumentsService.getDocumentFileContent → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ChartDocumentsController.getDocumentFileContent → ChartDocumentsService.getDocumentFileContent → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ChartDocumentsController.getDocumentFileContent → ChartDocumentsService.getDocumentFileContent → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ChartDocumentsController.getDocumentFileContent → ChartDocumentsService.getDocumentFileContent → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1007` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ChartDocumentsController.getDocumentFileContent → ChartDocumentsService.getDocumentFileContent → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `documentId` | path | Sí | `string` | — |
| `fileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Documento no encontrado; ResourceNotFoundException: Archivo no encontrado; ResourceNotFoundException: {labels.notFound}; ResourceNotFoundException: El contenido no está disponible en el almacenamiento local; ResourceNotFoundException: El contenido no está disponible en el almacenamiento configurado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: S3 object body is empty |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx15-documentos-del-expediente.int-spec.ts:241` |
| CONTROLADOR | `src/modules/chart/controllers/chart-documents.controller.spec.ts:35` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartDocumentsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. GET /charts/encounters/{id}/pdf

- **Origen:** CONTRATO
- **Nombre:** Descargar el PDF oficial de un encuentro cerrado
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartEncountersController.getEncounterPdf` — `src/modules/chart/controllers/chart-encounters.controller.ts:48`

### Qué es y para qué sirve (negocio)

Descargar el PDF oficial de un encuentro cerrado. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /charts/encounters/{id}/pdf` la atiende `ChartEncountersController.getEncounterPdf` (src/modules/chart/controllers/chart-encounters.controller.ts:48). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `EncounterPdfService.render`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 22 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-encounters.controller.ts:48` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/chart/controllers/chart-encounters.controller.ts:48` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `chart.care_plan_activities` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → EncounterPdfService.compose → CarePlansRepository.findByEncounter → CarePlansRepository.findActivitiesForPlans | `src/modules/chart/repositories/care-plans.repository.ts:171` |
| `chart.care_plans` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → EncounterPdfService.compose → CarePlansRepository.findByEncounter | `src/modules/chart/repositories/care-plans.repository.ts:131` |
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → EncounterPdfService.compose → ClinicalNotesRepository.findHeadersByEncounter | `src/modules/chart/repositories/clinical-notes.repository.ts:280` |
| `chart.clinical_note_versions` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → EncounterPdfService.compose → ClinicalNotesRepository.findVersionsByIds | `src/modules/chart/repositories/clinical-notes.repository.ts:368` |
| `chart.document_record_files` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → EncounterPdfService.compose → DocumentsRepository.findByEncounter → DocumentsRepository.findFilesForRecords | `src/modules/chart/repositories/documents.repository.ts:174` |
| `chart.document_records` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → EncounterPdfService.compose → DocumentsRepository.findByEncounter | `src/modules/chart/repositories/documents.repository.ts:138` |
| `clinical.conditions` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → EncounterPdfService.compose → ConditionsRepository.findByEncounter | `src/modules/clinical/repositories/conditions.repository.ts:122` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:169` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → EncounterPdfService.compose → MedicationRequestsRepository.findByEncounter | `src/modules/clinical/repositories/medication-requests.repository.ts:162` |
| `common.files` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → EncounterPdfService.compose → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → ClinicalReadService.assertCanReadHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → EncounterPdfService.compose → EncounterPdfService.resolvePatientName → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1007` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | ChartEncountersController.getEncounterPdf → EncounterPdfService.render → EncounterPdfService.compose → CatalogConceptsRepository.findByIds | `src/modules/terminology/repositories/catalog-concepts.repository.ts:202` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El encuentro no está cerrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx17-sello-del-encuentro.int-spec.ts:174` |
| CONTROLADOR | `src/modules/chart/controllers/chart-encounters.controller.spec.ts:27` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartEncountersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. GET /charts/me/documents

- **Origen:** CONTRATO
- **Nombre:** Ver mis documentos visibles
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartMeController.listMyDocuments` — `src/modules/chart/controllers/chart-me.controller.ts:68`

### Qué es y para qué sirve (negocio)

Ver mis documentos visibles. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /charts/me/documents` la atiende `ChartMeController.listMyDocuments` (src/modules/chart/controllers/chart-me.controller.ts:68). Exige sesión; el controlador no declara roles. Delega en `ChartMeReadService.listMyDocuments`. Crea filas en audit.data_access_log. Lee chart.document_record_files, chart.document_records.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/chart/controllers/chart-me.controller.ts:68` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.data_access_log` | ESCRIBE | CREA | DIRECTA | ChartMeController.listMyDocuments → ChartMeReadService.listMyDocuments → DataAccessLogRepository.record | `src/modules/audit/repositories/data-access-log.repository.ts:98` |
| `chart.document_record_files` | LEE | LEE | DIRECTA | ChartMeController.listMyDocuments → ChartMeReadService.listMyDocuments → DocumentsRepository.findFilesForRecords | `src/modules/chart/repositories/documents.repository.ts:174` |
| `chart.document_records` | LEE | LEE | DIRECTA | ChartMeController.listMyDocuments → ChartMeReadService.listMyDocuments → DocumentsRepository.findRecordsByPatient | `src/modules/chart/repositories/documents.repository.ts:105` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | No | `number` | Tope del listado (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyChartDocumentListResponseDto>` · DTO `MyChartDocumentListResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<MyChartDocumentItemDto>` | Sí | — | — | — | `src/modules/chart/dto/chart-me.dto.ts:118` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/chart/dto/chart-me.dto.ts:97` |
| `items[].encounterId` | `string` | No | formato uuid | — | — | `src/modules/chart/dto/chart-me.dto.ts:100` |
| `items[].title` | `string` | No | — | — | — | `src/modules/chart/dto/chart-me.dto.ts:103` |
| `items[].categoryConceptId` | `string` | No | formato uuid | — | — | `src/modules/chart/dto/chart-me.dto.ts:106` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/chart/dto/chart-me.dto.ts:109` |
| `items[].files` | `array<ChartDocumentFileItemDto>` | Sí | — | — | — | `src/modules/chart/dto/chart-me.dto.ts:112` |
| `items[].files[].fileId` | `string` | Sí | formato uuid | — | Identificador asociado a file. | `src/modules/chart/dto/chart-read.dto.ts:199` |
| `items[].files[].contentRole` | `string` | Sí | valores: PRIMARY, ATTACHMENT | — | Rol del contenido: la pieza principal del documento o un adjunto suyo. | `src/modules/chart/dto/chart-read.dto.ts:205` |
| `items[].files[].ordinal` | `number` | No | — | — | Posición del archivo dentro del documento. | `src/modules/chart/dto/chart-read.dto.ts:211` |
| `limit` | `number` | Sí | — | — | — | `src/modules/chart/dto/chart-me.dto.ts:121` |
| `truncated` | `boolean` | Sí | — | — | — | `src/modules/chart/dto/chart-me.dto.ts:124` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión no tiene perfil de paciente asociado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-me.controller.spec.ts:41` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartMeController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. GET /charts/me/documents/{documentId}/files/{fileId}/content

- **Origen:** CONTRATO
- **Nombre:** Descargar el archivo de un documento propio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartMeController.getMyDocumentFileContent` — `src/modules/chart/controllers/chart-me.controller.ts:87`

### Qué es y para qué sirve (negocio)

Descargar el archivo de un documento propio. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /charts/me/documents/{documentId}/files/{fileId}/content` la atiende `ChartMeController.getMyDocumentFileContent` (src/modules/chart/controllers/chart-me.controller.ts:87). Exige sesión; el controlador no declara roles. Delega en `ChartMeReadService.getMyDocumentFileContent`. Crea filas en audit.data_access_log. Lee chart.document_record_files, chart.document_records, common.file_versions, common.files.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/chart/controllers/chart-me.controller.ts:87` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: documentId, fileId | `src/modules/chart/controllers/chart-me.controller.ts:87` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.data_access_log` | ESCRIBE | CREA | DIRECTA | ChartMeController.getMyDocumentFileContent → ChartMeReadService.getMyDocumentFileContent → DataAccessLogRepository.record | `src/modules/audit/repositories/data-access-log.repository.ts:98` |
| `chart.document_record_files` | LEE | LEE | DIRECTA | ChartMeController.getMyDocumentFileContent → ChartMeReadService.getMyDocumentFileContent → DocumentsRepository.findFilesForRecords | `src/modules/chart/repositories/documents.repository.ts:174` |
| `chart.document_records` | LEE | LEE | DIRECTA | ChartMeController.getMyDocumentFileContent → ChartMeReadService.getMyDocumentFileContent → DocumentsRepository.findRecordById | `src/modules/chart/repositories/documents.repository.ts:123` |
| `common.file_versions` | LEE | LEE | DIRECTA | ChartMeController.getMyDocumentFileContent → ChartMeReadService.getMyDocumentFileContent → FileUploadService.downloadForAuthorizedContext → FileUploadService.serveCurrentVersion → AttachableFileService.assertUsableForAuthorizedContext → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | ChartMeController.getMyDocumentFileContent → ChartMeReadService.getMyDocumentFileContent → FileUploadService.downloadForAuthorizedContext → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `documentId` | path | Sí | `string` | — |
| `fileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Archivo no encontrado; ResourceNotFoundException: {labels.notFound}; ResourceNotFoundException: El contenido no está disponible en el almacenamiento local; ResourceNotFoundException: El contenido no está disponible en el almacenamiento configurado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión no tiene perfil de paciente asociado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: S3 object body is empty |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-me.controller.spec.ts:56` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartMeController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /charts/me/encounters/{id}/pdf

- **Origen:** CONTRATO
- **Nombre:** Descargar el PDF oficial de una atención propia
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartMeController.getMyEncounterPdf` — `src/modules/chart/controllers/chart-me.controller.ts:123`

### Qué es y para qué sirve (negocio)

Descargar el PDF oficial de una atención propia. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /charts/me/encounters/{id}/pdf` la atiende `ChartMeController.getMyEncounterPdf` (src/modules/chart/controllers/chart-me.controller.ts:123). Exige sesión; el controlador no declara roles. Delega en `EncounterPdfService.renderForPatient`. Lee chart.care_plan_activities, chart.care_plans, chart.clinical_note_headers, chart.clinical_note_versions, chart.document_record_files, chart.document_records, clinical.conditions, clinical.encounters y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/chart/controllers/chart-me.controller.ts:123` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/chart/controllers/chart-me.controller.ts:123` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.care_plan_activities` | LEE | LEE | DIRECTA | ChartMeController.getMyEncounterPdf → EncounterPdfService.renderForPatient → EncounterPdfService.compose → CarePlansRepository.findByEncounter → CarePlansRepository.findActivitiesForPlans | `src/modules/chart/repositories/care-plans.repository.ts:171` |
| `chart.care_plans` | LEE | LEE | DIRECTA | ChartMeController.getMyEncounterPdf → EncounterPdfService.renderForPatient → EncounterPdfService.compose → CarePlansRepository.findByEncounter | `src/modules/chart/repositories/care-plans.repository.ts:131` |
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ChartMeController.getMyEncounterPdf → EncounterPdfService.renderForPatient → EncounterPdfService.compose → ClinicalNotesRepository.findHeadersByEncounter | `src/modules/chart/repositories/clinical-notes.repository.ts:280` |
| `chart.clinical_note_versions` | LEE | LEE | DIRECTA | ChartMeController.getMyEncounterPdf → EncounterPdfService.renderForPatient → EncounterPdfService.compose → ClinicalNotesRepository.findVersionsByIds | `src/modules/chart/repositories/clinical-notes.repository.ts:368` |
| `chart.document_record_files` | LEE | LEE | DIRECTA | ChartMeController.getMyEncounterPdf → EncounterPdfService.renderForPatient → EncounterPdfService.compose → DocumentsRepository.findByEncounter → DocumentsRepository.findFilesForRecords | `src/modules/chart/repositories/documents.repository.ts:174` |
| `chart.document_records` | LEE | LEE | DIRECTA | ChartMeController.getMyEncounterPdf → EncounterPdfService.renderForPatient → EncounterPdfService.compose → DocumentsRepository.findByEncounter | `src/modules/chart/repositories/documents.repository.ts:138` |
| `clinical.conditions` | LEE | LEE | DIRECTA | ChartMeController.getMyEncounterPdf → EncounterPdfService.renderForPatient → EncounterPdfService.compose → ConditionsRepository.findByEncounter | `src/modules/clinical/repositories/conditions.repository.ts:122` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ChartMeController.getMyEncounterPdf → EncounterPdfService.renderForPatient → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:169` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ChartMeController.getMyEncounterPdf → EncounterPdfService.renderForPatient → EncounterPdfService.compose → MedicationRequestsRepository.findByEncounter | `src/modules/clinical/repositories/medication-requests.repository.ts:162` |
| `common.files` | LEE | LEE | DIRECTA | ChartMeController.getMyEncounterPdf → EncounterPdfService.renderForPatient → EncounterPdfService.compose → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ChartMeController.getMyEncounterPdf → EncounterPdfService.renderForPatient → EncounterPdfService.compose → EncounterPdfService.resolvePractitionerName → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ChartMeController.getMyEncounterPdf → EncounterPdfService.renderForPatient → EncounterPdfService.compose → EncounterPdfService.resolvePatientName → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | ChartMeController.getMyEncounterPdf → EncounterPdfService.renderForPatient → EncounterPdfService.compose → EncounterPdfService.resolvePatientName → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | ChartMeController.getMyEncounterPdf → EncounterPdfService.renderForPatient → EncounterPdfService.compose → CatalogConceptsRepository.findByIds | `src/modules/terminology/repositories/catalog-concepts.repository.ts:202` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El encuentro no está cerrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-me.controller.spec.ts:81` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartMeController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. GET /charts/me/notes

- **Origen:** CONTRATO
- **Nombre:** Ver mis evoluciones liberadas
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartMeController.listMyNotes` — `src/modules/chart/controllers/chart-me.controller.ts:53`

### Qué es y para qué sirve (negocio)

Ver mis evoluciones liberadas. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /charts/me/notes` la atiende `ChartMeController.listMyNotes` (src/modules/chart/controllers/chart-me.controller.ts:53). Exige sesión; el controlador no declara roles. Delega en `ChartMeReadService.listMyNotes`. Crea filas en audit.data_access_log. Lee chart.clinical_note_headers, chart.clinical_note_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/chart/controllers/chart-me.controller.ts:53` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.data_access_log` | ESCRIBE | CREA | DIRECTA | ChartMeController.listMyNotes → ChartMeReadService.listMyNotes → DataAccessLogRepository.record | `src/modules/audit/repositories/data-access-log.repository.ts:98` |
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ChartMeController.listMyNotes → ChartMeReadService.listMyNotes → ClinicalNotesRepository.findHeadersByPatient | `src/modules/chart/repositories/clinical-notes.repository.ts:261` |
| `chart.clinical_note_versions` | LEE | LEE | DIRECTA | ChartMeController.listMyNotes → ChartMeReadService.listMyNotes → ClinicalNotesRepository.findVersionsByIds | `src/modules/chart/repositories/clinical-notes.repository.ts:368` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | No | `number` | Tope del listado (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyChartNoteListResponseDto>` · DTO `MyChartNoteListResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<MyChartNoteItemDto>` | Sí | — | — | — | `src/modules/chart/dto/chart-me.dto.ts:80` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la nota (cabecera). | `src/modules/chart/dto/chart-me.dto.ts:20` |
| `items[].encounterId` | `string` | No | formato uuid | — | Encuentro al que pertenece la nota. | `src/modules/chart/dto/chart-me.dto.ts:26` |
| `items[].noteTypeConceptId` | `string` | No | formato uuid | — | Tipo de nota (concept id). | `src/modules/chart/dto/chart-me.dto.ts:32` |
| `items[].chiefComplaintText` | `string` | No | — | — | Motivo de consulta de la versión liberada. | `src/modules/chart/dto/chart-me.dto.ts:38` |
| `items[].subjectiveText` | `string` | No | — | — | Subjetivo (SOAP) de la versión liberada. | `src/modules/chart/dto/chart-me.dto.ts:44` |
| `items[].objectiveText` | `string` | No | — | — | Objetivo (SOAP) de la versión liberada. | `src/modules/chart/dto/chart-me.dto.ts:50` |
| `items[].assessmentText` | `string` | No | — | — | Evaluación (SOAP) de la versión liberada. | `src/modules/chart/dto/chart-me.dto.ts:56` |
| `items[].planText` | `string` | No | — | — | Plan (SOAP) de la versión liberada. | `src/modules/chart/dto/chart-me.dto.ts:62` |
| `items[].releasedAt` | `string` | No | formato date-time | — | Cuándo se liberó esta versión al paciente. | `src/modules/chart/dto/chart-me.dto.ts:68` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Fecha de creación de la nota (cabecera). | `src/modules/chart/dto/chart-me.dto.ts:74` |
| `limit` | `number` | Sí | — | — | — | `src/modules/chart/dto/chart-me.dto.ts:83` |
| `truncated` | `boolean` | Sí | — | — | — | `src/modules/chart/dto/chart-me.dto.ts:86` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión no tiene perfil de paciente asociado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-me.controller.spec.ts:35` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartMeController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. GET /charts/notes

- **Origen:** CONTRATO
- **Nombre:** Listar las notas de evolución de un profesional por ventana de fechas
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartNotesController.listNotes` — `src/modules/chart/controllers/chart-notes.controller.ts:79`

### Qué es y para qué sirve (negocio)

Listar las notas de evolución de un profesional por ventana de fechas. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /charts/notes` la atiende `ChartNotesController.listNotes` (src/modules/chart/controllers/chart-notes.controller.ts:79). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `ChartNotesReadService.listNotes`. Lee chart.clinical_note_headers, chart.clinical_note_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-notes.controller.ts:79` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ChartNotesController.listNotes → ChartNotesReadService.listNotes → ClinicalNotesRepository.findHeadersPageByAuthor | `src/modules/chart/repositories/clinical-notes.repository.ts:344` |
| `chart.clinical_note_versions` | LEE | LEE | DIRECTA | ChartNotesController.listNotes → ChartNotesReadService.listNotes → ClinicalNotesRepository.findVersionsByIds | `src/modules/chart/repositories/clinical-notes.repository.ts:368` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `practitionerId` | query | No | `string` | Perfil profesional autor; por defecto, el de la sesión |
| `patientProfileId` | query | No | `string` | — |
| `from` | query | No | `string` | — |
| `to` | query | No | `string` | — |
| `cursor` | query | No | `string` | — |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ChartNotesListResponseDto>` · DTO `ChartNotesListResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ChartNoteListItemDto>` | Sí | — | — | — | `src/modules/chart/dto/notes.dto.ts:554` |
| `items[].noteId` | `string` | Sí | formato uuid | — | — | `src/modules/chart/dto/chart-read.dto.ts:15` |
| `items[].encounterId` | `string` | No | formato uuid | — | — | `src/modules/chart/dto/chart-read.dto.ts:21` |
| `items[].noteTypeConceptId` | `string` | No | formato uuid | — | — | `src/modules/chart/dto/chart-read.dto.ts:27` |
| `items[].lifecycleStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/chart/dto/chart-read.dto.ts:33` |
| `items[].currentVersionId` | `string` | No | formato uuid; admite null | — | — | `src/modules/chart/dto/chart-read.dto.ts:39` |
| `items[].versionNumber` | `number` | No | — | — | Número de la versión vigente | `src/modules/chart/dto/chart-read.dto.ts:45` |
| `items[].authorProfileId` | `string` | No | formato uuid | — | — | `src/modules/chart/dto/chart-read.dto.ts:51` |
| `items[].chiefComplaintText` | `string` | No | — | — | — | `src/modules/chart/dto/chart-read.dto.ts:57` |
| `items[].subjectiveText` | `string` | No | — | — | — | `src/modules/chart/dto/chart-read.dto.ts:63` |
| `items[].objectiveText` | `string` | No | — | — | — | `src/modules/chart/dto/chart-read.dto.ts:69` |
| `items[].assessmentText` | `string` | No | — | — | — | `src/modules/chart/dto/chart-read.dto.ts:75` |
| `items[].planText` | `string` | No | — | — | — | `src/modules/chart/dto/chart-read.dto.ts:81` |
| `items[].signedAt` | `string` | No | formato date-time; admite null | — | — | `src/modules/chart/dto/chart-read.dto.ts:87` |
| `items[].releasedToPatient` | `boolean` | Sí | — | — | Si la nota tiene una versión liberada al portal del paciente. Derivado, para no obligar a resolver terminología antes de decidir si se muestra | `src/modules/chart/dto/chart-read.dto.ts:96` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/chart/dto/chart-read.dto.ts:102` |
| `items[].patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/chart/dto/notes.dto.ts:547` |
| `count` | `number` | Sí | — | — | Cantidad devuelta en esta página | `src/modules/chart/dto/notes.dto.ts:558` |
| `limit` | `number` | Sí | — | — | Tope de resultados aplicado | `src/modules/chart/dto/notes.dto.ts:562` |
| `nextCursor` | `string` | Sí | admite null | — | Cursor opaco para la página siguiente; `null` sin más | `src/modules/chart/dto/notes.dto.ts:570` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | BadRequestException: La fecha "from" no puede ser posterior a "to" |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Estas notas son de otro profesional: solo las lista quien las firma.; ForbiddenException: Esta lectura es la de un profesional: la sesión no tiene perfil profesional. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx11-notas-de-evolucion-coleccion.int-spec.ts:164` |
| CONTROLADOR | `src/modules/chart/controllers/chart-notes.controller.spec.ts:41` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartNotesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. POST /charts/notes

- **Origen:** CONTRATO
- **Nombre:** Crear una nota clínica versionada (borrador SOAP)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartNotesController.createNote` — `src/modules/chart/controllers/chart-notes.controller.ts:99`

### Qué es y para qué sirve (negocio)

Crear una nota clínica versionada (borrador SOAP). Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /charts/notes` la atiende `ChartNotesController.createNote` (src/modules/chart/controllers/chart-notes.controller.ts:99). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateNoteDto` (10 campos, 1 obligatorio). Delega en `ChartNotesService.createNote`. Crea filas en chart.clinical_note_headers, chart.clinical_note_versions. Actualiza chart.clinical_note_headers. Lee clinical.encounters.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-notes.controller.ts:99` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.clinical_note_headers` | ESCRIBE | ACTUALIZA | POR_TIPO | ChartNotesController.createNote → ChartNotesService.createNote | `src/modules/chart/services/chart-notes.service.ts:124` |
| `chart.clinical_note_headers` | ESCRIBE | CREA | DIRECTA | ChartNotesController.createNote → ChartNotesService.createNote → ClinicalNotesRepository.createHeader | `src/modules/chart/repositories/clinical-notes.repository.ts:410` |
| `chart.clinical_note_versions` | ESCRIBE | CREA | DIRECTA | ChartNotesController.createNote → ChartNotesService.createNote → ClinicalNotesRepository.createVersion | `src/modules/chart/repositories/clinical-notes.repository.ts:436` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ChartNotesController.createNote → ChartNotesService.createNote → ChartEncounterScopeService.assertEncounterBelongsToPatientAndWritable → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:169` |

### Cuerpo — DTO `CreateNoteDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil de paciente (profiles.patient_profiles) | `src/modules/chart/dto/notes.dto.ts:36` |
| `authorProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil del clínico autor. Se toma de la sesión; si viaja otro, 403 | `src/modules/chart/dto/notes.dto.ts:49` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro clínico asociado | `src/modules/chart/dto/notes.dto.ts:60` |
| `noteTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del tipo de nota | `src/modules/chart/dto/notes.dto.ts:71` |
| `confidentialityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de confidencialidad | `src/modules/chart/dto/notes.dto.ts:82` |
| `chiefComplaintText` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | — | `src/modules/chart/dto/notes.dto.ts:91` |
| `subjectiveText` | `string` | No | — | `@IsOptional()` `@IsString()` | Bloque S (subjetivo) del SOAP | `src/modules/chart/dto/notes.dto.ts:99` |
| `objectiveText` | `string` | No | — | `@IsOptional()` `@IsString()` | Bloque O (objetivo) del SOAP | `src/modules/chart/dto/notes.dto.ts:107` |
| `assessmentText` | `string` | No | — | `@IsOptional()` `@IsString()` | Bloque A (evaluación) del SOAP | `src/modules/chart/dto/notes.dto.ts:115` |
| `planText` | `string` | No | — | `@IsOptional()` `@IsString()` | Bloque P (plan) del SOAP | `src/modules/chart/dto/notes.dto.ts:123` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "noteTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "confidentialityConceptId": "00000000-0000-4000-8000-000000000001",
  "chiefComplaintText": "valor-ejemplo",
  "subjectiveText": "valor-ejemplo",
  "objectiveText": "valor-ejemplo",
  "assessmentText": "valor-ejemplo",
  "planText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<NoteVersionResponseDto>` · DTO `NoteVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `noteId` | `string` | Sí | formato uuid | — | Identificador asociado a note. | `src/modules/chart/dto/notes.dto.ts:433` |
| `versionId` | `string` | Sí | formato uuid | — | Identificador asociado a version. | `src/modules/chart/dto/notes.dto.ts:439` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/chart/dto/notes.dto.ts:445` |
| `lifecycleStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del ciclo de vida de la cabecera | `src/modules/chart/dto/notes.dto.ts:454` |
| `versionStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de la versión | `src/modules/chart/dto/notes.dto.ts:463` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Una nota clínica necesita un profesional autor.; ForbiddenException: La sesión no tiene un perfil profesional con el que escribir la nota.; ForbiddenException: El autor de la nota es el profesional de la sesión: no se escribe en nombre de otro perfil. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El encuentro ya está cerrado y sellado: no admite más escrituras. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:456` |
| INTEGRACION | `test/integration/fx11-notas-de-evolucion-coleccion.int-spec.ts:85` |
| INTEGRACION | `test/integration/fx15-documentos-del-expediente.int-spec.ts:274` |
| INTEGRACION | `test/integration/fx17-sello-del-encuentro.int-spec.ts:145` |
| CONTROLADOR | `src/modules/chart/controllers/chart-notes.controller.spec.ts:48` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartNotesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. POST /charts/notes/{noteId}/amendments

- **Origen:** CONTRATO
- **Nombre:** Enmendar una nota firmada (addendum versionado)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartNotesController.amendNote` — `src/modules/chart/controllers/chart-notes.controller.ts:173`

### Qué es y para qué sirve (negocio)

Enmendar una nota firmada (addendum versionado). Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /charts/notes/{noteId}/amendments` la atiende `ChartNotesController.amendNote` (src/modules/chart/controllers/chart-notes.controller.ts:173). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `AmendNoteDto` (7 campos, 1 obligatorio). Delega en `ChartNotesService.amendNote`. Crea filas en chart.clinical_note_versions. Actualiza chart.clinical_note_headers. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 10 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-notes.controller.ts:173` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: noteId | `src/modules/chart/controllers/chart-notes.controller.ts:173` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ChartNotesController.amendNote → ChartNotesService.amendNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ChartNotesController.amendNote → ChartNotesService.amendNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ChartNotesController.amendNote → ChartNotesService.amendNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ChartNotesController.amendNote → ChartNotesService.amendNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ChartNotesController.amendNote → ChartNotesService.amendNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ChartNotesController.amendNote → ChartNotesService.amendNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ChartNotesController.amendNote → ChartNotesService.amendNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ChartNotesController.amendNote → ChartNotesService.amendNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ChartNotesController.amendNote → ChartNotesService.amendNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ChartNotesController.amendNote → ChartNotesService.amendNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ChartNotesController.amendNote → ChartNotesService.amendNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `chart.clinical_note_headers` | ESCRIBE | ACTUALIZA | POR_TIPO | ChartNotesController.amendNote → ChartNotesService.amendNote | `src/modules/chart/services/chart-notes.service.ts:375` |
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ChartNotesController.amendNote → ChartNotesService.amendNote → ClinicalNotesRepository.findHeaderById | `src/modules/chart/repositories/clinical-notes.repository.ts:231` |
| `chart.clinical_note_versions` | ESCRIBE | CREA | DIRECTA | ChartNotesController.amendNote → ChartNotesService.amendNote → ClinicalNotesRepository.createVersion | `src/modules/chart/repositories/clinical-notes.repository.ts:436` |
| `chart.clinical_note_versions` | LEE | LEE | DIRECTA | ChartNotesController.amendNote → ChartNotesService.amendNote → ClinicalNotesRepository.maxVersionNumber | `src/modules/chart/repositories/clinical-notes.repository.ts:377` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ChartNotesController.amendNote → ChartNotesService.amendNote → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ChartNotesController.amendNote → ChartNotesService.amendNote → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ChartNotesController.amendNote → ChartNotesService.amendNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ChartNotesController.amendNote → ChartNotesService.amendNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1007` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ChartNotesController.amendNote → ChartNotesService.amendNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `noteId` | path | Sí | `string` | — |

### Cuerpo — DTO `AmendNoteDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `authorProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil del clínico que enmienda. Se toma de la sesión; si viaja otro, 403 | `src/modules/chart/dto/notes.dto.ts:265` |
| `amendmentReasonText` | `string` | Sí | longitud mínima 1; longitud máxima 2000 | `@IsString()` `@MinLength(1)` `@MaxLength(2000)` | Motivo textual de la enmienda (obligatorio) | `src/modules/chart/dto/notes.dto.ts:274` |
| `amendmentReasonConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del motivo de enmienda | `src/modules/chart/dto/notes.dto.ts:285` |
| `subjectiveText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/chart/dto/notes.dto.ts:293` |
| `objectiveText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/chart/dto/notes.dto.ts:301` |
| `assessmentText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/chart/dto/notes.dto.ts:309` |
| `planText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/chart/dto/notes.dto.ts:317` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "amendmentReasonText": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "amendmentReasonText": "Texto descriptivo de ejemplo",
  "amendmentReasonConceptId": "00000000-0000-4000-8000-000000000001",
  "subjectiveText": "valor-ejemplo",
  "objectiveText": "valor-ejemplo",
  "assessmentText": "valor-ejemplo",
  "planText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<NoteVersionResponseDto>` · DTO `NoteVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `noteId` | `string` | Sí | formato uuid | — | Identificador asociado a note. | `src/modules/chart/dto/notes.dto.ts:433` |
| `versionId` | `string` | Sí | formato uuid | — | Identificador asociado a version. | `src/modules/chart/dto/notes.dto.ts:439` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/chart/dto/notes.dto.ts:445` |
| `lifecycleStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del ciclo de vida de la cabecera | `src/modules/chart/dto/notes.dto.ts:454` |
| `versionStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de la versión | `src/modules/chart/dto/notes.dto.ts:463` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY}; ForbiddenException: Una nota clínica necesita un profesional autor.; ForbiddenException: La sesión no tiene un perfil profesional con el que escribir la nota.; ForbiddenException: El autor de la nota es el profesional de la sesión: no se escribe en nombre de otro perfil. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Nota clínica no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La nota no está firmada; edítela como borrador (UC-15-02) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx11-notas-de-evolucion-coleccion.int-spec.ts:271` |
| CONTROLADOR | `src/modules/chart/controllers/chart-notes.controller.spec.ts:86` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartNotesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. PUT /charts/notes/{noteId}/versions

- **Origen:** CONTRATO
- **Nombre:** Editar borrador creando una nueva versión inmutable
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartNotesController.addVersion` — `src/modules/chart/controllers/chart-notes.controller.ts:118`

### Qué es y para qué sirve (negocio)

Editar borrador creando una nueva versión inmutable. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PUT /charts/notes/{noteId}/versions` la atiende `ChartNotesController.addVersion` (src/modules/chart/controllers/chart-notes.controller.ts:118). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `AddVersionDto` (6 campos, 0 obligatorios). Delega en `ChartNotesService.addVersion`. Crea filas en chart.clinical_note_versions. Actualiza chart.clinical_note_headers. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 10 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-notes.controller.ts:118` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: noteId | `src/modules/chart/controllers/chart-notes.controller.ts:118` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ChartNotesController.addVersion → ChartNotesService.addVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ChartNotesController.addVersion → ChartNotesService.addVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ChartNotesController.addVersion → ChartNotesService.addVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ChartNotesController.addVersion → ChartNotesService.addVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ChartNotesController.addVersion → ChartNotesService.addVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ChartNotesController.addVersion → ChartNotesService.addVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ChartNotesController.addVersion → ChartNotesService.addVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ChartNotesController.addVersion → ChartNotesService.addVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ChartNotesController.addVersion → ChartNotesService.addVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ChartNotesController.addVersion → ChartNotesService.addVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ChartNotesController.addVersion → ChartNotesService.addVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `chart.clinical_note_headers` | ESCRIBE | ACTUALIZA | POR_TIPO | ChartNotesController.addVersion → ChartNotesService.addVersion | `src/modules/chart/services/chart-notes.service.ts:189` |
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ChartNotesController.addVersion → ChartNotesService.addVersion → ClinicalNotesRepository.findHeaderById | `src/modules/chart/repositories/clinical-notes.repository.ts:231` |
| `chart.clinical_note_versions` | ESCRIBE | CREA | DIRECTA | ChartNotesController.addVersion → ChartNotesService.addVersion → ClinicalNotesRepository.createVersion | `src/modules/chart/repositories/clinical-notes.repository.ts:436` |
| `chart.clinical_note_versions` | LEE | LEE | DIRECTA | ChartNotesController.addVersion → ChartNotesService.addVersion → ClinicalNotesRepository.maxVersionNumber | `src/modules/chart/repositories/clinical-notes.repository.ts:377` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ChartNotesController.addVersion → ChartNotesService.addVersion → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ChartNotesController.addVersion → ChartNotesService.addVersion → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ChartNotesController.addVersion → ChartNotesService.addVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ChartNotesController.addVersion → ChartNotesService.addVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1007` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ChartNotesController.addVersion → ChartNotesService.addVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `noteId` | path | Sí | `string` | — |

### Cuerpo — DTO `AddVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `authorProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil del clínico autor. Se toma de la sesión; si viaja otro, 403 | `src/modules/chart/dto/notes.dto.ts:138` |
| `chiefComplaintText` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | — | `src/modules/chart/dto/notes.dto.ts:147` |
| `subjectiveText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/chart/dto/notes.dto.ts:155` |
| `objectiveText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/chart/dto/notes.dto.ts:163` |
| `assessmentText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/chart/dto/notes.dto.ts:171` |
| `planText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/chart/dto/notes.dto.ts:179` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "chiefComplaintText": "valor-ejemplo",
  "subjectiveText": "valor-ejemplo",
  "objectiveText": "valor-ejemplo",
  "assessmentText": "valor-ejemplo",
  "planText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<NoteVersionResponseDto>` · DTO `NoteVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `noteId` | `string` | Sí | formato uuid | — | Identificador asociado a note. | `src/modules/chart/dto/notes.dto.ts:433` |
| `versionId` | `string` | Sí | formato uuid | — | Identificador asociado a version. | `src/modules/chart/dto/notes.dto.ts:439` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/chart/dto/notes.dto.ts:445` |
| `lifecycleStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del ciclo de vida de la cabecera | `src/modules/chart/dto/notes.dto.ts:454` |
| `versionStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de la versión | `src/modules/chart/dto/notes.dto.ts:463` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY}; ForbiddenException: Una nota clínica necesita un profesional autor.; ForbiddenException: La sesión no tiene un perfil profesional con el que escribir la nota.; ForbiddenException: El autor de la nota es el profesional de la sesión: no se escribe en nombre de otro perfil. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Nota clínica no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La nota ya no está en borrador; use una enmienda (UC-15-05) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-notes.controller.spec.ts:55` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartNotesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. POST /charts/notes/{noteId}/versions/{versionId}/cosign

- **Origen:** CONTRATO
- **Nombre:** Cofirmar una versión firmada (cadena de firmas)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartNotesController.cosignVersion` — `src/modules/chart/controllers/chart-notes.controller.ts:155`

### Qué es y para qué sirve (negocio)

Cofirmar una versión firmada (cadena de firmas). Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /charts/notes/{noteId}/versions/{versionId}/cosign` la atiende `ChartNotesController.cosignVersion` (src/modules/chart/controllers/chart-notes.controller.ts:155). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CosignVersionDto` (3 campos, 0 obligatorios). Delega en `ChartNotesService.cosignVersion`. Crea filas en chart.clinical_note_signatures. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 11 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-notes.controller.ts:155` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: noteId, versionId | `src/modules/chart/controllers/chart-notes.controller.ts:155` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ChartNotesService.loadNoteAndVersion → ClinicalNotesRepository.findHeaderById | `src/modules/chart/repositories/clinical-notes.repository.ts:231` |
| `chart.clinical_note_signatures` | ESCRIBE | CREA | DIRECTA | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ClinicalNotesRepository.createSignature | `src/modules/chart/repositories/clinical-notes.repository.ts:470` |
| `chart.clinical_note_signatures` | LEE | LEE | DIRECTA | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ClinicalNotesRepository.findSignatures | `src/modules/chart/repositories/clinical-notes.repository.ts:394` |
| `chart.clinical_note_versions` | LEE | LEE | DIRECTA | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ChartNotesService.loadNoteAndVersion → ClinicalNotesRepository.findVersionById | `src/modules/chart/repositories/clinical-notes.repository.ts:245` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1007` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ChartNotesController.cosignVersion → ChartNotesService.cosignVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `noteId` | path | Sí | `string` | — |
| `versionId` | path | Sí | `string` | — |

### Cuerpo — DTO `CosignVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `signerProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil del cofirmante / supervisor. Si se omite, es el perfil profesional de la sesión. | `src/modules/chart/dto/notes.dto.ts:233` |
| `certificateThumbprint` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/modules/chart/dto/notes.dto.ts:242` |
| `signatureValueEncrypted` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/chart/dto/notes.dto.ts:250` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "signerProfileId": "00000000-0000-4000-8000-000000000001",
  "certificateThumbprint": "valor-ejemplo",
  "signatureValueEncrypted": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<NoteVersionResponseDto>` · DTO `NoteVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `noteId` | `string` | Sí | formato uuid | — | Identificador asociado a note. | `src/modules/chart/dto/notes.dto.ts:433` |
| `versionId` | `string` | Sí | formato uuid | — | Identificador asociado a version. | `src/modules/chart/dto/notes.dto.ts:439` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/chart/dto/notes.dto.ts:445` |
| `lifecycleStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del ciclo de vida de la cabecera | `src/modules/chart/dto/notes.dto.ts:454` |
| `versionStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de la versión | `src/modules/chart/dto/notes.dto.ts:463` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Una firma clínica necesita un perfil profesional firmante.; ForbiddenException: La sesión no tiene un perfil profesional con el que firmar.; ForbiddenException: Una nota la firma su profesional: no se puede firmar en nombre de otro perfil.; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de nota no encontrada; ResourceNotFoundException: Nota clínica no encontrada |
| 409 | `CONFLICT` | ConflictException: El cofirmante ya firmó esta versión |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La versión no está firmada (SIGNED); PreconditionFailedException: Falta la firma primaria del autor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-notes.controller.spec.ts:74` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartNotesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. POST /charts/notes/{noteId}/versions/{versionId}/sign

- **Origen:** CONTRATO
- **Nombre:** Firmar una versión y sellar su contenido
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartNotesController.signVersion` — `src/modules/chart/controllers/chart-notes.controller.ts:137`

### Qué es y para qué sirve (negocio)

Firmar una versión y sellar su contenido. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /charts/notes/{noteId}/versions/{versionId}/sign` la atiende `ChartNotesController.signVersion` (src/modules/chart/controllers/chart-notes.controller.ts:137). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `SignVersionDto` (3 campos, 0 obligatorios). Delega en `ChartNotesService.signVersion`. Crea filas en chart.clinical_note_signatures. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 10 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-notes.controller.ts:137` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: noteId, versionId | `src/modules/chart/controllers/chart-notes.controller.ts:137` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ChartNotesController.signVersion → ChartNotesService.signVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ChartNotesController.signVersion → ChartNotesService.signVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ChartNotesController.signVersion → ChartNotesService.signVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ChartNotesController.signVersion → ChartNotesService.signVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ChartNotesController.signVersion → ChartNotesService.signVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ChartNotesController.signVersion → ChartNotesService.signVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ChartNotesController.signVersion → ChartNotesService.signVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ChartNotesController.signVersion → ChartNotesService.signVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ChartNotesController.signVersion → ChartNotesService.signVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ChartNotesController.signVersion → ChartNotesService.signVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ChartNotesController.signVersion → ChartNotesService.signVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ChartNotesController.signVersion → ChartNotesService.signVersion → ChartNotesService.loadNoteAndVersion → ClinicalNotesRepository.findHeaderById | `src/modules/chart/repositories/clinical-notes.repository.ts:231` |
| `chart.clinical_note_signatures` | ESCRIBE | CREA | DIRECTA | ChartNotesController.signVersion → ChartNotesService.signVersion → ClinicalNotesRepository.createSignature | `src/modules/chart/repositories/clinical-notes.repository.ts:470` |
| `chart.clinical_note_versions` | LEE | LEE | DIRECTA | ChartNotesController.signVersion → ChartNotesService.signVersion → ChartNotesService.loadNoteAndVersion → ClinicalNotesRepository.findVersionById | `src/modules/chart/repositories/clinical-notes.repository.ts:245` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ChartNotesController.signVersion → ChartNotesService.signVersion → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ChartNotesController.signVersion → ChartNotesService.signVersion → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ChartNotesController.signVersion → ChartNotesService.signVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ChartNotesController.signVersion → ChartNotesService.signVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1007` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ChartNotesController.signVersion → ChartNotesService.signVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `noteId` | path | Sí | `string` | — |
| `versionId` | path | Sí | `string` | — |

### Cuerpo — DTO `SignVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `signerProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil del firmante. Si se omite, es el perfil profesional de la sesión. | `src/modules/chart/dto/notes.dto.ts:196` |
| `certificateThumbprint` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | Huella del certificado usado en la firma | `src/modules/chart/dto/notes.dto.ts:207` |
| `signatureValueEncrypted` | `string` | No | — | `@IsOptional()` `@IsString()` | Valor de firma cifrado (opaco al backend) | `src/modules/chart/dto/notes.dto.ts:217` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "signerProfileId": "00000000-0000-4000-8000-000000000001",
  "certificateThumbprint": "valor-ejemplo",
  "signatureValueEncrypted": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<NoteVersionResponseDto>` · DTO `NoteVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `noteId` | `string` | Sí | formato uuid | — | Identificador asociado a note. | `src/modules/chart/dto/notes.dto.ts:433` |
| `versionId` | `string` | Sí | formato uuid | — | Identificador asociado a version. | `src/modules/chart/dto/notes.dto.ts:439` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/chart/dto/notes.dto.ts:445` |
| `lifecycleStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del ciclo de vida de la cabecera | `src/modules/chart/dto/notes.dto.ts:454` |
| `versionStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de la versión | `src/modules/chart/dto/notes.dto.ts:463` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Una firma clínica necesita un perfil profesional firmante.; ForbiddenException: La sesión no tiene un perfil profesional con el que firmar.; ForbiddenException: Una nota la firma su profesional: no se puede firmar en nombre de otro perfil.; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de nota no encontrada; ResourceNotFoundException: Nota clínica no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La versión no está en borrador |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:469` |
| INTEGRACION | `test/integration/fx11-notas-de-evolucion-coleccion.int-spec.ts:263` |
| INTEGRACION | `test/integration/fx15-documentos-del-expediente.int-spec.ts:284` |
| CONTROLADOR | `src/modules/chart/controllers/chart-notes.controller.spec.ts:62` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartNotesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. POST /charts/notes/versions/{versionId}/exam-findings

- **Origen:** CONTRATO
- **Nombre:** Registrar hallazgos de examen físico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartNotesController.recordExamFindings` — `src/modules/chart/controllers/chart-notes.controller.ts:224`

### Qué es y para qué sirve (negocio)

Registrar hallazgos de examen físico. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /charts/notes/versions/{versionId}/exam-findings` la atiende `ChartNotesController.recordExamFindings` (src/modules/chart/controllers/chart-notes.controller.ts:224). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `ExamFindingsDto` (6 campos, 1 obligatorio). Delega en `ChartNotesService.recordExamFindings`. Crea filas en chart.physical_exam_findings. Actualiza chart.clinical_note_versions. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 10 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-notes.controller.ts:224` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: versionId | `src/modules/chart/controllers/chart-notes.controller.ts:224` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings → ChartNotesService.assertCanWriteNote → ClinicalNotesRepository.findHeaderById | `src/modules/chart/repositories/clinical-notes.repository.ts:231` |
| `chart.clinical_note_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings | `src/modules/chart/services/chart-notes.service.ts:549` |
| `chart.clinical_note_versions` | LEE | LEE | DIRECTA | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings → ClinicalNotesRepository.findVersionById | `src/modules/chart/repositories/clinical-notes.repository.ts:245` |
| `chart.physical_exam_findings` | ESCRIBE | CREA | DIRECTA | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings → ClinicalNotesRepository.createExamFinding | `src/modules/chart/repositories/clinical-notes.repository.ts:523` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1007` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ChartNotesController.recordExamFindings → ChartNotesService.recordExamFindings → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `versionId` | path | Sí | `string` | — |

### Cuerpo — DTO `ExamFindingsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `findings` | `array<ExamFindingInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ExamFindingInputDto)` | Batch de hallazgos | `src/modules/chart/dto/notes.dto.ts:413` |
| `findings[].bodySystemConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del sistema corporal | `src/modules/chart/dto/notes.dto.ts:370` |
| `findings[].findingConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del hallazgo codificado | `src/modules/chart/dto/notes.dto.ts:381` |
| `findings[].isNormal` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | true si el hallazgo es normal | `src/modules/chart/dto/notes.dto.ts:389` |
| `findings[].findingText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/chart/dto/notes.dto.ts:397` |
| `objectiveText` | `string` | No | — | `@IsOptional()` `@IsString()` | Texto objetivo sintetizado (solo si la versión sigue en DRAFT) | `src/modules/chart/dto/notes.dto.ts:424` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "findings": [
    {}
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "findings": [
    {
      "bodySystemConceptId": "00000000-0000-4000-8000-000000000001",
      "findingConceptId": "00000000-0000-4000-8000-000000000001",
      "isNormal": true,
      "findingText": "valor-ejemplo"
    }
  ],
  "objectiveText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ExamFindingsResultDto>` · DTO `ExamFindingsResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `versionId` | `string` | Sí | formato uuid | — | Identificador asociado a version. | `src/modules/chart/dto/notes.dto.ts:472` |
| `recordedFindings` | `number` | Sí | — | — | Nº de hallazgos registrados | `src/modules/chart/dto/notes.dto.ts:478` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de nota no encontrada; ResourceNotFoundException: Nota clínica no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La versión ya está firmada; los hallazgos quedan sellados |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-notes.controller.spec.ts:109` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartNotesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. POST /charts/notes/versions/{versionId}/release

- **Origen:** CONTRATO
- **Nombre:** Liberar una versión al paciente
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartNotesController.releaseVersion` — `src/modules/chart/controllers/chart-notes.controller.ts:190`

### Qué es y para qué sirve (negocio)

Liberar una versión al paciente. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /charts/notes/versions/{versionId}/release` la atiende `ChartNotesController.releaseVersion` (src/modules/chart/controllers/chart-notes.controller.ts:190). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `ReleaseVersionDto` (1 campo, 0 obligatorios). Delega en `ChartNotesService.releaseVersion`. Crea filas en chart.note_release_events. Actualiza chart.clinical_note_headers. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 10 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-notes.controller.ts:190` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: versionId | `src/modules/chart/controllers/chart-notes.controller.ts:190` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `chart.clinical_note_headers` | ESCRIBE | ACTUALIZA | POR_TIPO | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion | `src/modules/chart/services/chart-notes.service.ts:441` |
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion → ClinicalNotesRepository.findHeaderById | `src/modules/chart/repositories/clinical-notes.repository.ts:231` |
| `chart.clinical_note_versions` | LEE | LEE | DIRECTA | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion → ClinicalNotesRepository.findVersionById | `src/modules/chart/repositories/clinical-notes.repository.ts:245` |
| `chart.note_release_events` | ESCRIBE | CREA | DIRECTA | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion → ClinicalNotesRepository.createReleaseEvent | `src/modules/chart/repositories/clinical-notes.repository.ts:496` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1007` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ChartNotesController.releaseVersion → ChartNotesService.releaseVersion → ChartNotesService.assertCanWriteNote → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `versionId` | path | Sí | `string` | — |

### Cuerpo — DTO `ReleaseVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `policyVersion` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Versión de la política de liberación aplicada | `src/modules/chart/dto/notes.dto.ts:331` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "policyVersion": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ReleaseResultDto>` · DTO `ReleaseResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `versionId` | `string` | Sí | formato uuid | — | Identificador asociado a version. | `src/modules/chart/dto/notes.dto.ts:579` |
| `releaseEventId` | `string` | Sí | formato uuid | — | Identificador asociado a release event. | `src/modules/chart/dto/notes.dto.ts:585` |
| `patientReleaseStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de liberación de la cabecera | `src/modules/chart/dto/notes.dto.ts:594` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de nota no encontrada; ResourceNotFoundException: Nota clínica no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La versión no está firmada; PreconditionFailedException: La versión no es elegible para liberación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:477` |
| CONTROLADOR | `src/modules/chart/controllers/chart-notes.controller.spec.ts:92` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartNotesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. POST /charts/notes/versions/{versionId}/withhold

- **Origen:** CONTRATO
- **Nombre:** Retener una versión del paciente (motivo legal)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartNotesController.withholdVersion` — `src/modules/chart/controllers/chart-notes.controller.ts:207`

### Qué es y para qué sirve (negocio)

Retener una versión del paciente (motivo legal). Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /charts/notes/versions/{versionId}/withhold` la atiende `ChartNotesController.withholdVersion` (src/modules/chart/controllers/chart-notes.controller.ts:207). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `WithholdVersionDto` (2 campos, 0 obligatorios). Delega en `ChartNotesService.withholdVersion`. Crea filas en chart.note_release_events. Actualiza chart.clinical_note_headers. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 10 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-notes.controller.ts:207` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: versionId | `src/modules/chart/controllers/chart-notes.controller.ts:207` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `chart.clinical_note_headers` | ESCRIBE | ACTUALIZA | POR_TIPO | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion | `src/modules/chart/services/chart-notes.service.ts:493` |
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion → ClinicalNotesRepository.findHeaderById | `src/modules/chart/repositories/clinical-notes.repository.ts:231` |
| `chart.clinical_note_versions` | LEE | LEE | DIRECTA | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion → ClinicalNotesRepository.findVersionById | `src/modules/chart/repositories/clinical-notes.repository.ts:245` |
| `chart.note_release_events` | ESCRIBE | CREA | DIRECTA | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion → ClinicalNotesRepository.createReleaseEvent | `src/modules/chart/repositories/clinical-notes.repository.ts:496` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1007` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ChartNotesController.withholdVersion → ChartNotesService.withholdVersion → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:981` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `versionId` | path | Sí | `string` | — |

### Cuerpo — DTO `WithholdVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reasonConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del motivo de retención | `src/modules/chart/dto/notes.dto.ts:345` |
| `policyVersion` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Versión de la política de retención aplicada | `src/modules/chart/dto/notes.dto.ts:356` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reasonConceptId": "00000000-0000-4000-8000-000000000001",
  "policyVersion": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ReleaseResultDto>` · DTO `ReleaseResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `versionId` | `string` | Sí | formato uuid | — | Identificador asociado a version. | `src/modules/chart/dto/notes.dto.ts:579` |
| `releaseEventId` | `string` | Sí | formato uuid | — | Identificador asociado a release event. | `src/modules/chart/dto/notes.dto.ts:585` |
| `patientReleaseStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de liberación de la cabecera | `src/modules/chart/dto/notes.dto.ts:594` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de nota no encontrada; ResourceNotFoundException: Nota clínica no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-notes.controller.spec.ts:98` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartNotesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. GET /charts/patients/{patientProfileId}/chart

- **Origen:** CONTRATO
- **Nombre:** UC-40-14: expediente del paciente (notas, planes de cuidados y documentos)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartReadController.getPatientChart` — `src/modules/chart/controllers/chart-read.controller.ts:51`

### Qué es y para qué sirve (negocio)

UC-40-14: expediente del paciente (notas, planes de cuidados y documentos). Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /charts/patients/{patientProfileId}/chart` la atiende `ChartReadController.getPatientChart` (src/modules/chart/controllers/chart-read.controller.ts:51). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `ChartReadService.getPatientChart`. Lee chart.care_plan_activities, chart.care_plans, chart.clinical_note_headers, chart.clinical_note_versions, chart.document_record_files, chart.document_records.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/chart/controllers/chart-read.controller.ts:51` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: patientProfileId | `src/modules/chart/controllers/chart-read.controller.ts:51` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.care_plan_activities` | LEE | LEE | DIRECTA | ChartReadController.getPatientChart → ChartReadService.getPatientChart → CarePlansRepository.findActivitiesForPlans | `src/modules/chart/repositories/care-plans.repository.ts:171` |
| `chart.care_plans` | LEE | LEE | DIRECTA | ChartReadController.getPatientChart → ChartReadService.getPatientChart → CarePlansRepository.findPlansByPatient | `src/modules/chart/repositories/care-plans.repository.ts:112` |
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ChartReadController.getPatientChart → ChartReadService.getPatientChart → ClinicalNotesRepository.findHeadersByPatient | `src/modules/chart/repositories/clinical-notes.repository.ts:261` |
| `chart.clinical_note_versions` | LEE | LEE | DIRECTA | ChartReadController.getPatientChart → ChartReadService.getPatientChart → ClinicalNotesRepository.findVersionsByIds | `src/modules/chart/repositories/clinical-notes.repository.ts:368` |
| `chart.document_record_files` | LEE | LEE | DIRECTA | ChartReadController.getPatientChart → ChartReadService.getPatientChart → DocumentsRepository.findFilesForRecords | `src/modules/chart/repositories/documents.repository.ts:174` |
| `chart.document_records` | LEE | LEE | DIRECTA | ChartReadController.getPatientChart → ChartReadService.getPatientChart → DocumentsRepository.findRecordsByPatient | `src/modules/chart/repositories/documents.repository.ts:105` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | — |
| `limit` | query | No | `number` | Tope aplicado a cada bloque (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientChartResponseDto>` · DTO `PatientChartResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/chart/dto/chart-read.dto.ts:286` |
| `notes` | `array<ChartNoteItemDto>` | Sí | — | — | Valor de notes mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:292` |
| `notes[].noteId` | `string` | Sí | formato uuid | — | Identificador asociado a note. | `src/modules/chart/dto/chart-read.dto.ts:15` |
| `notes[].encounterId` | `string` | No | formato uuid | — | Identificador asociado a encounter. | `src/modules/chart/dto/chart-read.dto.ts:21` |
| `notes[].noteTypeConceptId` | `string` | No | formato uuid | — | Identificador asociado a note type concept. | `src/modules/chart/dto/chart-read.dto.ts:27` |
| `notes[].lifecycleStatusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a lifecycle status concept. | `src/modules/chart/dto/chart-read.dto.ts:33` |
| `notes[].currentVersionId` | `string` | No | formato uuid | — | Identificador asociado a current version. | `src/modules/chart/dto/chart-read.dto.ts:39` |
| `notes[].versionNumber` | `number` | No | — | — | Número de la versión vigente | `src/modules/chart/dto/chart-read.dto.ts:45` |
| `notes[].authorProfileId` | `string` | No | formato uuid | — | Identificador asociado a author profile. | `src/modules/chart/dto/chart-read.dto.ts:51` |
| `notes[].chiefComplaintText` | `string` | No | — | — | Valor de chief complaint text mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:57` |
| `notes[].subjectiveText` | `string` | No | — | — | Valor de subjective text mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:63` |
| `notes[].objectiveText` | `string` | No | — | — | Valor de objective text mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:69` |
| `notes[].assessmentText` | `string` | No | — | — | Valor de assessment text mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:75` |
| `notes[].planText` | `string` | No | — | — | Valor de plan text mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:81` |
| `notes[].signedAt` | `string` | No | formato date-time | — | Valor de signed at mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:87` |
| `notes[].releasedToPatient` | `boolean` | Sí | — | — | Si la nota tiene una versión liberada al portal del paciente. Derivado, para no obligar a resolver terminología antes de decidir si se muestra | `src/modules/chart/dto/chart-read.dto.ts:96` |
| `notes[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/chart/dto/chart-read.dto.ts:102` |
| `carePlans` | `array<ChartCarePlanItemDto>` | Sí | — | — | Valor de care plans mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:298` |
| `carePlans[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/chart/dto/chart-read.dto.ts:148` |
| `carePlans[].statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/chart/dto/chart-read.dto.ts:154` |
| `carePlans[].intentConceptId` | `string` | No | formato uuid | — | Identificador asociado a intent concept. | `src/modules/chart/dto/chart-read.dto.ts:160` |
| `carePlans[].goalText` | `string` | No | — | — | Valor de goal text mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:166` |
| `carePlans[].startDate` | `string` | No | formato date | — | Valor de start date mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:172` |
| `carePlans[].endDate` | `string` | No | formato date | — | Valor de end date mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:178` |
| `carePlans[].activities` | `array<CarePlanActivityItemDto>` | Sí | — | — | Valor de activities mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:184` |
| `carePlans[].activities[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/chart/dto/chart-read.dto.ts:111` |
| `carePlans[].activities[].activityConceptId` | `string` | No | formato uuid | — | Clase de la actividad (concept id) — columna existente (`chart.care_plan_activities.activity_concept_id`, NOT NULL, siempre `CPACT_GENERAL` por defecto). BR-16/CL-26: el alta ya la manda y la guarda; esta lectura no la exponía, así que el expediente mostraba un plan sin la clase de actividad que se eligió. | `src/modules/chart/dto/chart-read.dto.ts:121` |
| `carePlans[].activities[].statusConceptId` | `string` | No | formato uuid | — | Identificador asociado a status concept. | `src/modules/chart/dto/chart-read.dto.ts:127` |
| `carePlans[].activities[].detailText` | `string` | No | — | — | Valor de detail text mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:133` |
| `carePlans[].activities[].scheduledAt` | `string` | No | formato date-time | — | Valor de scheduled at mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:139` |
| `carePlans[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/chart/dto/chart-read.dto.ts:190` |
| `documents` | `array<ChartDocumentItemDto>` | Sí | — | — | Valor de documents mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:304` |
| `documents[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/chart/dto/chart-read.dto.ts:220` |
| `documents[].title` | `string` | No | — | — | Valor de title mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:226` |
| `documents[].categoryConceptId` | `string` | No | formato uuid | — | Identificador asociado a category concept. | `src/modules/chart/dto/chart-read.dto.ts:232` |
| `documents[].statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/chart/dto/chart-read.dto.ts:238` |
| `documents[].authorText` | `string` | No | — | — | Valor de author text mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:244` |
| `documents[].isExternal` | `boolean` | No | — | — | Valor de is external mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:250` |
| `documents[].documentDate` | `string` | No | formato date | — | Valor de document date mantenido por la instancia. | `src/modules/chart/dto/chart-read.dto.ts:256` |
| `documents[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/chart/dto/chart-read.dto.ts:262` |
| `documents[].files` | `array<ChartDocumentFileItemDto>` | Sí | — | — | Archivos gobernados vinculados al documento, ordenados por `ordinal`. | `src/modules/chart/dto/chart-read.dto.ts:268` |
| `documents[].files[].fileId` | `string` | Sí | formato uuid | — | Identificador asociado a file. | `src/modules/chart/dto/chart-read.dto.ts:199` |
| `documents[].files[].contentRole` | `string` | Sí | valores: PRIMARY, ATTACHMENT | — | Rol del contenido: la pieza principal del documento o un adjunto suyo. | `src/modules/chart/dto/chart-read.dto.ts:205` |
| `documents[].files[].ordinal` | `number` | No | — | — | Posición del archivo dentro del documento. | `src/modules/chart/dto/chart-read.dto.ts:211` |
| `limit` | `number` | Sí | — | — | Tope aplicado a cada bloque | `src/modules/chart/dto/chart-read.dto.ts:310` |
| `truncated` | `array<string>` | Sí | — | — | Qué bloques quedaron recortados por el tope. Vacío si el expediente cabe entero | `src/modules/chart/dto/chart-read.dto.ts:321` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:483` |
| INTEGRACION | `test/integration/fx15-documentos-del-expediente.int-spec.ts:224` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. GET /charts/templates

- **Origen:** CONTRATO
- **Nombre:** Listar las plantillas de chart por especialidad
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartTemplatesController.listTemplates` — `src/modules/chart/controllers/chart-templates.controller.ts:94`

### Qué es y para qué sirve (negocio)

Listar las plantillas de chart por especialidad. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /charts/templates` la atiende `ChartTemplatesController.listTemplates` (src/modules/chart/controllers/chart-templates.controller.ts:94). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, SECURITY_ADMIN. Delega en `ChartTemplatesService.listTemplates`. Lee chart.specialty_chart_templates, forms.dynamic_field_definitions, forms.field_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `src/modules/chart/controllers/chart-templates.controller.ts:94` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.specialty_chart_templates` | LEE | LEE | DIRECTA | ChartTemplatesController.listTemplates → ChartTemplatesService.listTemplates → ChartTemplatesRepository.findTemplates | `src/modules/chart/repositories/chart-templates.repository.ts:199` |
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | ChartTemplatesController.listTemplates → ChartTemplatesService.listTemplates → ChartTemplatesService.resolveSchema → ChartTemplatesRepository.findFieldDefinitionsByIds | `src/modules/chart/repositories/chart-templates.repository.ts:294` |
| `forms.field_assignments` | LEE | LEE | DIRECTA | ChartTemplatesController.listTemplates → ChartTemplatesService.listTemplates → ChartTemplatesService.resolveSchema → ChartTemplatesRepository.findFieldAssignmentsBySection | `src/modules/chart/repositories/chart-templates.repository.ts:272` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `specialtyId` | query | No | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ChartTemplateResponseDto[]>` · DTO `ChartTemplateResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la plantilla. | `src/modules/chart/dto/templates.dto.ts:452` |
| `specialtyConceptId` | `string` | Sí | formato uuid | — | Especialidad a la que pertenece la plantilla. | `src/modules/chart/dto/templates.dto.ts:458` |
| `tenantId` | `string` | No | formato uuid | — | Tenant dueño de la plantilla, si no es global. | `src/modules/chart/dto/templates.dto.ts:464` |
| `code` | `string` | Sí | — | — | Código único de la plantilla. | `src/modules/chart/dto/templates.dto.ts:470` |
| `name` | `string` | Sí | — | — | Nombre legible de la plantilla. | `src/modules/chart/dto/templates.dto.ts:476` |
| `version` | `number` | Sí | — | — | Versión de la plantilla. | `src/modules/chart/dto/templates.dto.ts:482` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de la plantilla. | `src/modules/chart/dto/templates.dto.ts:488` |
| `sectionId` | `string` | No | formato uuid | — | Sección que aloja los campos de la plantilla. Se publica porque colgar un campo propio **dentro** de la plantilla exige nombrarla: una asignación en otra sección existe pero no la dibuja nadie. | `src/modules/chart/dto/templates.dto.ts:497` |
| `fieldTargetConceptId` | `string` | Sí | formato uuid | — | Target de las asignaciones de campo de las plantillas de chart. Es un concepto del catálogo, y su UUID se deriva de un código: publicarlo evita que cada cliente lo copie a mano y quede clavado el día que cambie. | `src/modules/chart/dto/templates.dto.ts:506` |
| `fields` | `array<ChartTemplateFieldDto>` | Sí | — | — | Los campos del esquema, en su orden de presentación. | `src/modules/chart/dto/templates.dto.ts:512` |
| `fields[].assignmentId` | `string` | Sí | formato uuid | — | Identificador de la asignación (`forms.field_assignments.id`). | `src/modules/chart/dto/templates.dto.ts:312` |
| `fields[].fieldId` | `string` | Sí | formato uuid | — | Identificador del campo (`forms.dynamic_field_definitions.id`). | `src/modules/chart/dto/templates.dto.ts:318` |
| `fields[].code` | `string` | Sí | — | — | Código del campo. | `src/modules/chart/dto/templates.dto.ts:324` |
| `fields[].name` | `string` | Sí | — | — | Nombre legible del campo. | `src/modules/chart/dto/templates.dto.ts:330` |
| `fields[].dataType` | `object` | Sí | — | — | Tipo de dato técnico del campo. | `src/modules/chart/dto/templates.dto.ts:336` |
| `fields[].valueSetId` | `string` | No | formato uuid | — | Value set de valores permitidos, si el campo es de selección. | `src/modules/chart/dto/templates.dto.ts:342` |
| `fields[].cardinalityMin` | `number` | No | — | — | Casillas: marcar al menos N. Sólo con `multiple`. | `src/modules/chart/dto/templates.dto.ts:346` |
| `fields[].cardinalityMax` | `number` | No | — | — | Casillas: marcar como máximo N. Sólo con `multiple`. | `src/modules/chart/dto/templates.dto.ts:350` |
| `fields[].required` | `boolean` | Sí | — | — | Si el campo es obligatorio al completar la plantilla. | `src/modules/chart/dto/templates.dto.ts:356` |
| `fields[].ordinal` | `number` | No | — | — | Orden de presentación del campo dentro de la plantilla. | `src/modules/chart/dto/templates.dto.ts:362` |
| `fields[].own` | `boolean` | Sí | — | — | ¿Es un campo propio del tenant, o del formulario estándar? | `src/modules/chart/dto/templates.dto.ts:374` |
| `fields[].section` | `string` | No | — | — | La sección de la ficha en la que va (motivo, antecedentes, examen…). | `src/modules/chart/dto/templates.dto.ts:378` |
| `fields[].options` | `array<string>` | No | — | — | Las respuestas ofrecidas de una lista cerrada. Con `multiple`, el valor es la lista elegida (`json`); sin él, la opción elegida (`string`). | `src/modules/chart/dto/templates.dto.ts:385` |
| `fields[].multiple` | `boolean` | No | — | — | Si se pueden elegir varias opciones. | `src/modules/chart/dto/templates.dto.ts:389` |
| `fields[].allowOther` | `boolean` | No | — | — | Si además se ofrece «Otro» con texto libre. | `src/modules/chart/dto/templates.dto.ts:393` |
| `fields[].description` | `string` | No | — | — | La ayuda bajo el campo. | `src/modules/chart/dto/templates.dto.ts:397` |
| `fields[].showWhen` | `ChartTemplateShowWhenDto` | No | — | — | Cuándo se muestra el campo; ausente = siempre. | `src/modules/chart/dto/templates.dto.ts:401` |
| `fields[].showWhen.fieldId` | `string` | No | formato uuid | — | El campo del que depende (`fieldId` de la misma plantilla). | `src/modules/chart/dto/templates.dto.ts:290` |
| `fields[].showWhen.equals` | `array<object>` | No | — | — | El valor, o los valores, que lo muestran. | `src/modules/chart/dto/templates.dto.ts:303` |
| `provenance` | `ChartTemplateProvenanceDto` | No | — | — | De dónde salió la plantilla, si vino del catálogo de formularios estándar. | `src/modules/chart/dto/templates.dto.ts:518` |
| `provenance.sourceTitle` | `string` | No | — | — | Título del documento tal como lo publica el organismo. | `src/modules/chart/dto/templates.dto.ts:419` |
| `provenance.organization` | `string` | No | — | — | Organismo que lo publica. | `src/modules/chart/dto/templates.dto.ts:423` |
| `provenance.url` | `string` | No | — | — | URL de la que se descargó. | `src/modules/chart/dto/templates.dto.ts:427` |
| `provenance.license` | `string` | No | — | — | Licencia bajo la que se puede usar. | `src/modules/chart/dto/templates.dto.ts:431` |
| `provenance.sourceVersion` | `string` | No | — | — | Versión o edición del documento de origen. | `src/modules/chart/dto/templates.dto.ts:435` |
| `provenance.retrievedAt` | `string` | No | — | — | Fecha de descarga, en ISO `YYYY-MM-DD`. | `src/modules/chart/dto/templates.dto.ts:439` |
| `provenance.note` | `string` | No | — | — | Qué se transcribió y qué quedó afuera, cuando no es obvio. | `src/modules/chart/dto/templates.dto.ts:443` |
| `kind` | `string` | No | valores: BASE, SPECIFIC, GENERAL | — | Qué clase de ficha es, en el catálogo estándar: la consulta inicial de la especialidad (`BASE`), el control estándar de una condición (`SPECIFIC`) o una de toda consulta (`GENERAL`). Ausente en las plantillas armadas a mano. | `src/modules/chart/dto/templates.dto.ts:526` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/hardening/mch-001.int-spec.ts:106` |
| CONTROLADOR | `src/modules/chart/controllers/chart-templates.controller.spec.ts:44` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartTemplatesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. POST /charts/templates

- **Origen:** CONTRATO
- **Nombre:** Crear una plantilla de chart con su esquema de campos, por especialidad
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartTemplatesController.createTemplate` — `src/modules/chart/controllers/chart-templates.controller.ts:67`

### Qué es y para qué sirve (negocio)

Crear una plantilla de chart con su esquema de campos, por especialidad. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /charts/templates` la atiende `ChartTemplatesController.createTemplate` (src/modules/chart/controllers/chart-templates.controller.ts:67). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateChartTemplateDto` (17 campos, 7 obligatorios). Delega en `ChartTemplatesService.createTemplate`. Crea filas en chart.specialty_chart_templates, forms.dynamic_field_definitions, forms.dynamic_field_sections, forms.field_assignments. Actualiza chart.specialty_chart_templates.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/chart/controllers/chart-templates.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.specialty_chart_templates` | ESCRIBE | ACTUALIZA | POR_TIPO | ChartTemplatesController.createTemplate → ChartTemplatesService.createTemplate | `src/modules/chart/services/chart-templates.service.ts:223` |
| `chart.specialty_chart_templates` | ESCRIBE | CREA | DIRECTA | ChartTemplatesController.createTemplate → ChartTemplatesService.createTemplate → ChartTemplatesRepository.createTemplate | `src/modules/chart/repositories/chart-templates.repository.ts:215` |
| `forms.dynamic_field_definitions` | ESCRIBE | CREA | DIRECTA | ChartTemplatesController.createTemplate → ChartTemplatesService.createTemplate → ChartTemplatesRepository.createTemplateField | `src/modules/chart/repositories/chart-templates.repository.ts:241` |
| `forms.dynamic_field_sections` | ESCRIBE | CREA | DIRECTA | ChartTemplatesController.createTemplate → ChartTemplatesService.createTemplate → ChartTemplatesRepository.createTemplateSection | `src/modules/chart/repositories/chart-templates.repository.ts:228` |
| `forms.field_assignments` | ESCRIBE | CREA | DIRECTA | ChartTemplatesController.createTemplate → ChartTemplatesService.createTemplate → ChartTemplatesRepository.createTemplateFieldAssignment | `src/modules/chart/repositories/chart-templates.repository.ts:254` |

### Cuerpo — DTO `CreateChartTemplateDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `specialtyConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Especialidad de la plantilla (concept id) | `src/modules/chart/dto/templates.dto.ts:234` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant dueño de la plantilla | `src/modules/chart/dto/templates.dto.ts:245` |
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único de la plantilla | `src/modules/chart/dto/templates.dto.ts:254` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre legible de la plantilla | `src/modules/chart/dto/templates.dto.ts:266` |
| `fields` | `array<TemplateFieldInputDto>` | Sí | — | `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => TemplateFieldInputDto)` | Campos del esquema, en el orden en que se presentan | `src/modules/chart/dto/templates.dto.ts:278` |
| `fields[].code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único del campo | `src/modules/chart/dto/templates.dto.ts:117` |
| `fields[].name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre legible del campo | `src/modules/chart/dto/templates.dto.ts:126` |
| `fields[].dataType` | `string` | Sí | valores: string, text, integer, decimal, boolean, date, datetime, time, uuid, json, binary, reference, code | `@IsIn(TECHNICAL_DATA_TYPES)` | Tipo de dato técnico | `src/modules/chart/dto/templates.dto.ts:136` |
| `fields[].valueSetId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Value set de valores permitidos (campos de selección) | `src/modules/chart/dto/templates.dto.ts:147` |
| `fields[].options` | `array<string>` | No | mínimo 2 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMinSize(2, { message: 'Un campo de elección necesita al menos dos opciones', })` `@IsString({ each: true })` | Opciones propias de un campo de elección (dataType "code" sin valueSetId) | `src/modules/chart/dto/templates.dto.ts:165` |
| `fields[].multiple` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Admite varias respuestas en vez de una sola | `src/modules/chart/dto/templates.dto.ts:173` |
| `fields[].allowOther` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Ofrece «Otro», con texto libre | `src/modules/chart/dto/templates.dto.ts:179` |
| `fields[].description` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Ayuda que se lee bajo la pregunta (se sirve como "hint") | `src/modules/chart/dto/templates.dto.ts:189` |
| `fields[].cardinalityMin` | `number` | No | — | `@IsOptional()` `@IsInt()` | Cardinalidad mínima (sólo con multiple) | `src/modules/chart/dto/templates.dto.ts:197` |
| `fields[].cardinalityMax` | `number` | No | — | `@IsOptional()` `@IsInt()` | Cardinalidad máxima (sólo con multiple) | `src/modules/chart/dto/templates.dto.ts:205` |
| `fields[].required` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/chart/dto/templates.dto.ts:213` |
| `fields[].ordinal` | `number` | No | — | `@IsOptional()` `@IsInt()` | Orden de presentación | `src/modules/chart/dto/templates.dto.ts:221` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "fields": [
    {
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "dataType": "string"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "fields": [
    {
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "dataType": "string",
      "valueSetId": "00000000-0000-4000-8000-000000000001",
      "options": [
        "valor-ejemplo",
        "valor-ejemplo"
      ],
      "multiple": true,
      "allowOther": true,
      "description": "Texto descriptivo de ejemplo",
      "cardinalityMin": 1,
      "cardinalityMax": 1,
      "required": false,
      "ordinal": 1
    }
  ]
}
```

</details>

### Respuesta — `Promise<ChartTemplateResponseDto>` · DTO `ChartTemplateResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la plantilla. | `src/modules/chart/dto/templates.dto.ts:452` |
| `specialtyConceptId` | `string` | Sí | formato uuid | — | Especialidad a la que pertenece la plantilla. | `src/modules/chart/dto/templates.dto.ts:458` |
| `tenantId` | `string` | No | formato uuid | — | Tenant dueño de la plantilla, si no es global. | `src/modules/chart/dto/templates.dto.ts:464` |
| `code` | `string` | Sí | — | — | Código único de la plantilla. | `src/modules/chart/dto/templates.dto.ts:470` |
| `name` | `string` | Sí | — | — | Nombre legible de la plantilla. | `src/modules/chart/dto/templates.dto.ts:476` |
| `version` | `number` | Sí | — | — | Versión de la plantilla. | `src/modules/chart/dto/templates.dto.ts:482` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de la plantilla. | `src/modules/chart/dto/templates.dto.ts:488` |
| `sectionId` | `string` | No | formato uuid | — | Sección que aloja los campos de la plantilla. Se publica porque colgar un campo propio **dentro** de la plantilla exige nombrarla: una asignación en otra sección existe pero no la dibuja nadie. | `src/modules/chart/dto/templates.dto.ts:497` |
| `fieldTargetConceptId` | `string` | Sí | formato uuid | — | Target de las asignaciones de campo de las plantillas de chart. Es un concepto del catálogo, y su UUID se deriva de un código: publicarlo evita que cada cliente lo copie a mano y quede clavado el día que cambie. | `src/modules/chart/dto/templates.dto.ts:506` |
| `fields` | `array<ChartTemplateFieldDto>` | Sí | — | — | Los campos del esquema, en su orden de presentación. | `src/modules/chart/dto/templates.dto.ts:512` |
| `fields[].assignmentId` | `string` | Sí | formato uuid | — | Identificador de la asignación (`forms.field_assignments.id`). | `src/modules/chart/dto/templates.dto.ts:312` |
| `fields[].fieldId` | `string` | Sí | formato uuid | — | Identificador del campo (`forms.dynamic_field_definitions.id`). | `src/modules/chart/dto/templates.dto.ts:318` |
| `fields[].code` | `string` | Sí | — | — | Código del campo. | `src/modules/chart/dto/templates.dto.ts:324` |
| `fields[].name` | `string` | Sí | — | — | Nombre legible del campo. | `src/modules/chart/dto/templates.dto.ts:330` |
| `fields[].dataType` | `object` | Sí | — | — | Tipo de dato técnico del campo. | `src/modules/chart/dto/templates.dto.ts:336` |
| `fields[].valueSetId` | `string` | No | formato uuid | — | Value set de valores permitidos, si el campo es de selección. | `src/modules/chart/dto/templates.dto.ts:342` |
| `fields[].cardinalityMin` | `number` | No | — | — | Casillas: marcar al menos N. Sólo con `multiple`. | `src/modules/chart/dto/templates.dto.ts:346` |
| `fields[].cardinalityMax` | `number` | No | — | — | Casillas: marcar como máximo N. Sólo con `multiple`. | `src/modules/chart/dto/templates.dto.ts:350` |
| `fields[].required` | `boolean` | Sí | — | — | Si el campo es obligatorio al completar la plantilla. | `src/modules/chart/dto/templates.dto.ts:356` |
| `fields[].ordinal` | `number` | No | — | — | Orden de presentación del campo dentro de la plantilla. | `src/modules/chart/dto/templates.dto.ts:362` |
| `fields[].own` | `boolean` | Sí | — | — | ¿Es un campo propio del tenant, o del formulario estándar? | `src/modules/chart/dto/templates.dto.ts:374` |
| `fields[].section` | `string` | No | — | — | La sección de la ficha en la que va (motivo, antecedentes, examen…). | `src/modules/chart/dto/templates.dto.ts:378` |
| `fields[].options` | `array<string>` | No | — | — | Las respuestas ofrecidas de una lista cerrada. Con `multiple`, el valor es la lista elegida (`json`); sin él, la opción elegida (`string`). | `src/modules/chart/dto/templates.dto.ts:385` |
| `fields[].multiple` | `boolean` | No | — | — | Si se pueden elegir varias opciones. | `src/modules/chart/dto/templates.dto.ts:389` |
| `fields[].allowOther` | `boolean` | No | — | — | Si además se ofrece «Otro» con texto libre. | `src/modules/chart/dto/templates.dto.ts:393` |
| `fields[].description` | `string` | No | — | — | La ayuda bajo el campo. | `src/modules/chart/dto/templates.dto.ts:397` |
| `fields[].showWhen` | `ChartTemplateShowWhenDto` | No | — | — | Cuándo se muestra el campo; ausente = siempre. | `src/modules/chart/dto/templates.dto.ts:401` |
| `fields[].showWhen.fieldId` | `string` | No | formato uuid | — | El campo del que depende (`fieldId` de la misma plantilla). | `src/modules/chart/dto/templates.dto.ts:290` |
| `fields[].showWhen.equals` | `array<object>` | No | — | — | El valor, o los valores, que lo muestran. | `src/modules/chart/dto/templates.dto.ts:303` |
| `provenance` | `ChartTemplateProvenanceDto` | No | — | — | De dónde salió la plantilla, si vino del catálogo de formularios estándar. | `src/modules/chart/dto/templates.dto.ts:518` |
| `provenance.sourceTitle` | `string` | No | — | — | Título del documento tal como lo publica el organismo. | `src/modules/chart/dto/templates.dto.ts:419` |
| `provenance.organization` | `string` | No | — | — | Organismo que lo publica. | `src/modules/chart/dto/templates.dto.ts:423` |
| `provenance.url` | `string` | No | — | — | URL de la que se descargó. | `src/modules/chart/dto/templates.dto.ts:427` |
| `provenance.license` | `string` | No | — | — | Licencia bajo la que se puede usar. | `src/modules/chart/dto/templates.dto.ts:431` |
| `provenance.sourceVersion` | `string` | No | — | — | Versión o edición del documento de origen. | `src/modules/chart/dto/templates.dto.ts:435` |
| `provenance.retrievedAt` | `string` | No | — | — | Fecha de descarga, en ISO `YYYY-MM-DD`. | `src/modules/chart/dto/templates.dto.ts:439` |
| `provenance.note` | `string` | No | — | — | Qué se transcribió y qué quedó afuera, cuando no es obvio. | `src/modules/chart/dto/templates.dto.ts:443` |
| `kind` | `string` | No | valores: BASE, SPECIFIC, GENERAL | — | Qué clase de ficha es, en el catálogo estándar: la consulta inicial de la especialidad (`BASE`), el control estándar de una condición (`SPECIFIC`) o una de toda consulta (`GENERAL`). Ausente en las plantillas armadas a mano. | `src/modules/chart/dto/templates.dto.ts:526` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: `options`/`allowOther` sólo aplican a dataType "code"; PreconditionFailedException: Un campo "code" declara valueSetId u options, no los dos; PreconditionFailedException: `allowOther` no aplica sobre un valueSetId; PreconditionFailedException: Un campo "code" sin valueSetId necesita al menos dos opciones; PreconditionFailedException: Una opción no puede estar vacía; PreconditionFailedException: Las opciones no pueden repetirse |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-templates.controller.spec.ts:37` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartTemplatesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. GET /charts/templates/{id}

- **Origen:** CONTRATO
- **Nombre:** Leer el esquema de una plantilla de chart
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartTemplatesController.getTemplate` — `src/modules/chart/controllers/chart-templates.controller.ts:109`

### Qué es y para qué sirve (negocio)

Leer el esquema de una plantilla de chart. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /charts/templates/{id}` la atiende `ChartTemplatesController.getTemplate` (src/modules/chart/controllers/chart-templates.controller.ts:109). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, SECURITY_ADMIN. Delega en `ChartTemplatesService.getTemplate`. Lee chart.specialty_chart_templates, forms.dynamic_field_definitions, forms.field_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `src/modules/chart/controllers/chart-templates.controller.ts:109` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/chart/controllers/chart-templates.controller.ts:109` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.specialty_chart_templates` | LEE | LEE | DIRECTA | ChartTemplatesController.getTemplate → ChartTemplatesService.getTemplate → ChartTemplatesRepository.findTemplateById | `src/modules/chart/repositories/chart-templates.repository.ts:144` |
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | ChartTemplatesController.getTemplate → ChartTemplatesService.getTemplate → ChartTemplatesService.resolveSchema → ChartTemplatesRepository.findFieldDefinitionsByIds | `src/modules/chart/repositories/chart-templates.repository.ts:294` |
| `forms.field_assignments` | LEE | LEE | DIRECTA | ChartTemplatesController.getTemplate → ChartTemplatesService.getTemplate → ChartTemplatesService.resolveSchema → ChartTemplatesRepository.findFieldAssignmentsBySection | `src/modules/chart/repositories/chart-templates.repository.ts:272` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ChartTemplateResponseDto>` · DTO `ChartTemplateResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la plantilla. | `src/modules/chart/dto/templates.dto.ts:452` |
| `specialtyConceptId` | `string` | Sí | formato uuid | — | Especialidad a la que pertenece la plantilla. | `src/modules/chart/dto/templates.dto.ts:458` |
| `tenantId` | `string` | No | formato uuid | — | Tenant dueño de la plantilla, si no es global. | `src/modules/chart/dto/templates.dto.ts:464` |
| `code` | `string` | Sí | — | — | Código único de la plantilla. | `src/modules/chart/dto/templates.dto.ts:470` |
| `name` | `string` | Sí | — | — | Nombre legible de la plantilla. | `src/modules/chart/dto/templates.dto.ts:476` |
| `version` | `number` | Sí | — | — | Versión de la plantilla. | `src/modules/chart/dto/templates.dto.ts:482` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de la plantilla. | `src/modules/chart/dto/templates.dto.ts:488` |
| `sectionId` | `string` | No | formato uuid | — | Sección que aloja los campos de la plantilla. Se publica porque colgar un campo propio **dentro** de la plantilla exige nombrarla: una asignación en otra sección existe pero no la dibuja nadie. | `src/modules/chart/dto/templates.dto.ts:497` |
| `fieldTargetConceptId` | `string` | Sí | formato uuid | — | Target de las asignaciones de campo de las plantillas de chart. Es un concepto del catálogo, y su UUID se deriva de un código: publicarlo evita que cada cliente lo copie a mano y quede clavado el día que cambie. | `src/modules/chart/dto/templates.dto.ts:506` |
| `fields` | `array<ChartTemplateFieldDto>` | Sí | — | — | Los campos del esquema, en su orden de presentación. | `src/modules/chart/dto/templates.dto.ts:512` |
| `fields[].assignmentId` | `string` | Sí | formato uuid | — | Identificador de la asignación (`forms.field_assignments.id`). | `src/modules/chart/dto/templates.dto.ts:312` |
| `fields[].fieldId` | `string` | Sí | formato uuid | — | Identificador del campo (`forms.dynamic_field_definitions.id`). | `src/modules/chart/dto/templates.dto.ts:318` |
| `fields[].code` | `string` | Sí | — | — | Código del campo. | `src/modules/chart/dto/templates.dto.ts:324` |
| `fields[].name` | `string` | Sí | — | — | Nombre legible del campo. | `src/modules/chart/dto/templates.dto.ts:330` |
| `fields[].dataType` | `object` | Sí | — | — | Tipo de dato técnico del campo. | `src/modules/chart/dto/templates.dto.ts:336` |
| `fields[].valueSetId` | `string` | No | formato uuid | — | Value set de valores permitidos, si el campo es de selección. | `src/modules/chart/dto/templates.dto.ts:342` |
| `fields[].cardinalityMin` | `number` | No | — | — | Casillas: marcar al menos N. Sólo con `multiple`. | `src/modules/chart/dto/templates.dto.ts:346` |
| `fields[].cardinalityMax` | `number` | No | — | — | Casillas: marcar como máximo N. Sólo con `multiple`. | `src/modules/chart/dto/templates.dto.ts:350` |
| `fields[].required` | `boolean` | Sí | — | — | Si el campo es obligatorio al completar la plantilla. | `src/modules/chart/dto/templates.dto.ts:356` |
| `fields[].ordinal` | `number` | No | — | — | Orden de presentación del campo dentro de la plantilla. | `src/modules/chart/dto/templates.dto.ts:362` |
| `fields[].own` | `boolean` | Sí | — | — | ¿Es un campo propio del tenant, o del formulario estándar? | `src/modules/chart/dto/templates.dto.ts:374` |
| `fields[].section` | `string` | No | — | — | La sección de la ficha en la que va (motivo, antecedentes, examen…). | `src/modules/chart/dto/templates.dto.ts:378` |
| `fields[].options` | `array<string>` | No | — | — | Las respuestas ofrecidas de una lista cerrada. Con `multiple`, el valor es la lista elegida (`json`); sin él, la opción elegida (`string`). | `src/modules/chart/dto/templates.dto.ts:385` |
| `fields[].multiple` | `boolean` | No | — | — | Si se pueden elegir varias opciones. | `src/modules/chart/dto/templates.dto.ts:389` |
| `fields[].allowOther` | `boolean` | No | — | — | Si además se ofrece «Otro» con texto libre. | `src/modules/chart/dto/templates.dto.ts:393` |
| `fields[].description` | `string` | No | — | — | La ayuda bajo el campo. | `src/modules/chart/dto/templates.dto.ts:397` |
| `fields[].showWhen` | `ChartTemplateShowWhenDto` | No | — | — | Cuándo se muestra el campo; ausente = siempre. | `src/modules/chart/dto/templates.dto.ts:401` |
| `fields[].showWhen.fieldId` | `string` | No | formato uuid | — | El campo del que depende (`fieldId` de la misma plantilla). | `src/modules/chart/dto/templates.dto.ts:290` |
| `fields[].showWhen.equals` | `array<object>` | No | — | — | El valor, o los valores, que lo muestran. | `src/modules/chart/dto/templates.dto.ts:303` |
| `provenance` | `ChartTemplateProvenanceDto` | No | — | — | De dónde salió la plantilla, si vino del catálogo de formularios estándar. | `src/modules/chart/dto/templates.dto.ts:518` |
| `provenance.sourceTitle` | `string` | No | — | — | Título del documento tal como lo publica el organismo. | `src/modules/chart/dto/templates.dto.ts:419` |
| `provenance.organization` | `string` | No | — | — | Organismo que lo publica. | `src/modules/chart/dto/templates.dto.ts:423` |
| `provenance.url` | `string` | No | — | — | URL de la que se descargó. | `src/modules/chart/dto/templates.dto.ts:427` |
| `provenance.license` | `string` | No | — | — | Licencia bajo la que se puede usar. | `src/modules/chart/dto/templates.dto.ts:431` |
| `provenance.sourceVersion` | `string` | No | — | — | Versión o edición del documento de origen. | `src/modules/chart/dto/templates.dto.ts:435` |
| `provenance.retrievedAt` | `string` | No | — | — | Fecha de descarga, en ISO `YYYY-MM-DD`. | `src/modules/chart/dto/templates.dto.ts:439` |
| `provenance.note` | `string` | No | — | — | Qué se transcribió y qué quedó afuera, cuando no es obvio. | `src/modules/chart/dto/templates.dto.ts:443` |
| `kind` | `string` | No | valores: BASE, SPECIFIC, GENERAL | — | Qué clase de ficha es, en el catálogo estándar: la consulta inicial de la especialidad (`BASE`), el control estándar de una condición (`SPECIFIC`) o una de toda consulta (`GENERAL`). Ausente en las plantillas armadas a mano. | `src/modules/chart/dto/templates.dto.ts:526` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plantilla no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-templates.controller.spec.ts:56` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartTemplatesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. POST /charts/templates/{templateId}/assignments

- **Origen:** CONTRATO
- **Nombre:** Asignar una plantilla de chart por especialidad
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ChartTemplatesController.assignTemplate` — `src/modules/chart/controllers/chart-templates.controller.ts:49`

### Qué es y para qué sirve (negocio)

Asignar una plantilla de chart por especialidad. Dentro del módulo (descripción del modelo, en inglés): «A patient chart with immutable, signed clinical-note versions; explicit release to the patient; addenda instead of destructive edits; and a document cabinet that supports multiple governed file versions.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_15_chart.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /charts/templates/{templateId}/assignments` la atiende `ChartTemplatesController.assignTemplate` (src/modules/chart/controllers/chart-templates.controller.ts:49). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `AssignTemplateDto` (3 campos, 0 obligatorios). Delega en `ChartTemplatesService.assignTemplate`. Crea filas en chart.chart_template_assignments. Actualiza chart.chart_template_assignments. Lee chart.chart_template_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/chart/controllers/chart-templates.controller.ts:49` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: templateId | `src/modules/chart/controllers/chart-templates.controller.ts:49` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.chart_template_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | ChartTemplatesController.assignTemplate → ChartTemplatesService.assignTemplate | `src/modules/chart/services/chart-templates.service.ts:160` |
| `chart.chart_template_assignments` | ESCRIBE | CREA | DIRECTA | ChartTemplatesController.assignTemplate → ChartTemplatesService.assignTemplate → ChartTemplatesRepository.createAssignment | `src/modules/chart/repositories/chart-templates.repository.ts:172` |
| `chart.chart_template_assignments` | LEE | LEE | DIRECTA | ChartTemplatesController.assignTemplate → ChartTemplatesService.assignTemplate → ChartTemplatesRepository.findActiveDefaults | `src/modules/chart/repositories/chart-templates.repository.ts:153` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `templateId` | path | Sí | `string` | — |

### Cuerpo — DTO `AssignTemplateDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Práctica destino (practice.practices) | `src/modules/chart/dto/templates.dto.ts:47` |
| `practitionerProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil del profesional destino | `src/modules/chart/dto/templates.dto.ts:58` |
| `isDefault` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Marca esta asignación como default del scope | `src/modules/chart/dto/templates.dto.ts:69` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "isDefault": false
}
```

</details>

### Respuesta — `Promise<AssignmentResponseDto>` · DTO `AssignmentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/chart/dto/templates.dto.ts:78` |
| `status` | `string` | Sí | formato uuid | — | Concept id de estado | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/chart.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/chart/controllers/chart-templates.controller.spec.ts:20` |

### Flujos

- src / modules / chart — etapa `ctrl:ChartTemplatesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

