<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `clinical`

- **Bloque:** Clínico y Diagnóstico (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)
- **Operaciones:** 62 (62 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 10 · MEDIO 32 · BAJO 20
- **Tablas distintas que tocan:** 114
- **Respuestas de error y detalle contractual:** `openapi/endpoints/clinical.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/census-days/{id}/adjustments` | Ajustar un día de censo cerrado | ALTO | 13 | sesión (sin roles) |
| 2 | POST | `/clinical/admissions` | Internar a un paciente | ALTO | 29 | sesión (sin roles) |
| 3 | POST | `/clinical/allergy-intolerances` | Registrar una alergia con reacciones | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 4 | GET | `/clinical/allergy-intolerances/{id}/attachments` | Listar los adjuntos de una alergia | BAJO | 22 | CLINICIAN, PRACTITIONER, PATIENT |
| 5 | POST | `/clinical/allergy-intolerances/{id}/attachments` | Adjuntar un archivo ya subido a una alergia | MEDIO | 21 | CLINICIAN, PRACTITIONER |
| 6 | POST | `/clinical/bed-compatibility` | Compatibilidad prospectiva de una cama con un paciente | BAJO | 16 | sesión (sin roles) |
| 7 | POST | `/clinical/bed-swaps` | Intercambiar camas entre dos pacientes | ALTO | 21 | sesión (sin roles) |
| 8 | POST | `/clinical/care-episodes` | Abrir un episodio de cuidado | MEDIO | 2 | CLINICIAN, PRACTITIONER |
| 9 | POST | `/clinical/conditions` | Registrar una condición/diagnóstico | MEDIO | 9 | CLINICIAN, PRACTITIONER |
| 10 | POST | `/clinical/conditions/{id}/attachments` | Adjuntar un archivo ya subido a una condición | MEDIO | 21 | CLINICIAN, PRACTITIONER |
| 11 | POST | `/clinical/conditions/{id}/change-status` | Cambiar el estado clínico de una condición | MEDIO | 24 | CLINICIAN, PRACTITIONER |
| 12 | POST | `/clinical/conditions/{id}/verification` | Confirmar o refutar un diagnóstico presuntivo | MEDIO | 27 | CLINICIAN, PRACTITIONER |
| 13 | POST | `/clinical/diagnostic-reports` | Emitir un reporte diagnóstico desde la orden | MEDIO | 3 | CLINICIAN, PRACTITIONER |
| 14 | POST | `/clinical/diagnostic-reports/{id}/release` | Liberar los resultados de un reporte diagnóstico | BAJO | 17 | CLINICIAN, PRACTITIONER |
| 15 | POST | `/clinical/encounter-locations/{id}/cancel` | Anular una reserva o un traslado | ALTO | 13 | sesión (sin roles) |
| 16 | GET | `/clinical/encounters/{id}/attachments` | Listar los adjuntos de un encuentro | BAJO | 22 | CLINICIAN, PRACTITIONER, PATIENT |
| 17 | POST | `/clinical/encounters/{id}/attachments` | Adjuntar un archivo ya subido a un encuentro | MEDIO | 21 | CLINICIAN, PRACTITIONER |
| 18 | POST | `/clinical/encounters/{id}/bed-assignment` | Asignar o reservar cama | ALTO | 21 | sesión (sin roles) |
| 19 | POST | `/clinical/encounters/{id}/bed-compatibility` | Compatibilidad de una cama con el encuentro | BAJO | 13 | sesión (sin roles) |
| 20 | POST | `/clinical/encounters/{id}/close` | Cerrar un encuentro en curso (gatilla facturación) | MEDIO | 40 | CLINICIAN, PRACTITIONER |
| 21 | POST | `/clinical/encounters/{id}/discharge` | Dar de alta (egreso) | ALTO | 26 | sesión (sin roles) |
| 22 | GET | `/clinical/encounters/{id}/stay` | Ficha de internación | BAJO | 28 | sesión (sin roles) |
| 23 | POST | `/clinical/encounters/{id}/transfer` | Trasladar de cama | ALTO | 21 | sesión (sin roles) |
| 24 | POST | `/clinical/encounters/check-in` | Check-in de un encuentro con participantes y ubicación | MEDIO | 31 | CLINICIAN, PRACTITIONER |
| 25 | POST | `/clinical/immunizations` | Registrar una inmunización | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 26 | POST | `/clinical/internal/prescription-expiry-notices` | Avisar al paciente de las recetas por vencer (barrido) | MEDIO | 13 | SYSTEM, SYSTEM_WORKER |
| 27 | GET | `/clinical/me/medical-aspects` | Ver mis aspectos médicos declarados | BAJO | 3 | sesión (sin roles) |
| 28 | PUT | `/clinical/me/medical-aspects` | Guardar mis aspectos médicos declarados | ALTO | 4 | sesión (sin roles) |
| 29 | GET | `/clinical/me/procedure-centers` | Dónde hacerme los procedimientos que me pidieron | BAJO | 7 | PATIENT |
| 30 | POST | `/clinical/medication-records` | Administrar/registrar medicación | MEDIO | 3 | CLINICIAN, PRACTITIONER |
| 31 | POST | `/clinical/medication-requests` | Prescribir medicación | MEDIO | 6 | CLINICIAN, PRACTITIONER |
| 32 | GET | `/clinical/medication-requests/{id}/attachments` | Listar los adjuntos de una receta | BAJO | 22 | CLINICIAN, PRACTITIONER, PATIENT |
| 33 | POST | `/clinical/medication-requests/{id}/attachments` | Adjuntar un archivo ya subido a una receta | MEDIO | 21 | CLINICIAN, PRACTITIONER |
| 34 | POST | `/clinical/medication-requests/{id}/edit` | Editar ítems de una receta en borrador (DRAFT) | MEDIO | 22 | CLINICIAN, PRACTITIONER |
| 35 | POST | `/clinical/medication-requests/{id}/invalidate` | Invalidar una receta emitida | MEDIO | 24 | CLINICIAN, PRACTITIONER |
| 36 | POST | `/clinical/medication-requests/{id}/issue` | Emitir una receta (la vuelve inmutable) | MEDIO | 35 | CLINICIAN, PRACTITIONER |
| 37 | POST | `/clinical/medication-requests/{id}/renew` | Renovar una receta (crea una nueva copiando datos) | MEDIO | 24 | CLINICIAN, PRACTITIONER |
| 38 | POST | `/clinical/medication-requests/{id}/replace` | Reemplazar una receta emitida (crea la corrección) | MEDIO | 25 | CLINICIAN, PRACTITIONER |
| 39 | POST | `/clinical/medication-requests/{id}/sign` | Firmar una receta en borrador (DRAFT) | MEDIO | 24 | CLINICIAN, PRACTITIONER |
| 40 | POST | `/clinical/observations` | Registrar una observación con componentes y ejecutantes | MEDIO | 7 | CLINICIAN, PRACTITIONER |
| 41 | PATCH | `/clinical/observations/{id}/amend` | Corregir/enmendar una observación (value contract) | MEDIO | 20 | CLINICIAN, PRACTITIONER |
| 42 | GET | `/clinical/patients/{id}/inpatient-stay` | Estancia de internación vigente del paciente | BAJO | 30 | sesión (sin roles) |
| 43 | GET | `/clinical/patients/{patientProfileId}/received-services` | Servicios recibidos del paciente: intervenciones médicas realizadas y vacunas | BAJO | 6 | CLINICIAN, PRACTITIONER, PATIENT |
| 44 | GET | `/clinical/patients/{patientProfileId}/summary` | UC-39-20: historial clínico del paciente (condiciones, alergias, medicación, observaciones, encuentros) | MEDIO | 9 | CLINICIAN, PRACTITIONER, PATIENT |
| 45 | PATCH | `/clinical/placement-incidents/{id}` | Revisar un incidente de ubicación | ALTO | 12 | sesión (sin roles) |
| 46 | GET | `/clinical/prescription-signature-policies` | Listar las políticas de firma de un tenant | BAJO | 1 | CLINICIAN, SECURITY_ADMIN |
| 47 | POST | `/clinical/prescription-signature-policies` | Crear una política de firma de receta | MEDIO | 1 | CLINICIAN, SECURITY_ADMIN |
| 48 | POST | `/clinical/prescription-signature-policies/{id}/deactivate` | Desactivar una política (cierra vigencia, sin borrado duro) | MEDIO | 2 | CLINICIAN, SECURITY_ADMIN |
| 49 | GET | `/clinical/prescriptions/{id}/pdf` | Descargar el PDF oficial de una receta | BAJO | 30 | CLINICIAN, PRACTITIONER, PATIENT |
| 50 | POST | `/clinical/procedures` | Registrar un procedimiento | MEDIO | 7 | CLINICIAN, PRACTITIONER |
| 51 | POST | `/clinical/procedures/{id}/attachments` | Adjuntar un archivo ya subido a un procedimiento | MEDIO | 21 | CLINICIAN, PRACTITIONER |
| 52 | POST | `/clinical/requisitions` | Crear una requisición: varios estudios con su detalle, atómicos | MEDIO | 37 | CLINICIAN, PRACTITIONER |
| 53 | POST | `/clinical/service-requests` | Crear una orden de servicio | MEDIO | 36 | CLINICIAN, PRACTITIONER |
| 54 | GET | `/clinical/service-requests/{id}` | Leer una orden de servicio con su detalle | BAJO | 24 | CLINICIAN, PRACTITIONER |
| 55 | POST | `/clinical/service-requests/duplicate-check` | Pre-validar si el paciente ya se hizo este estudio en la ventana (antiduplicación · T-26) | BAJO | 26 | CLINICIAN, PRACTITIONER |
| 56 | POST | `/internal/clinical/census-close-tick` | Cerrar los censos vencidos (worker) | MEDIO | 15 | SYSTEM, SYSTEM_WORKER |
| 57 | GET | `/public/prescriptions/{id}/verify` | Verificar la autenticidad de una receta por su sello | BAJO | 2 | pública |
| 58 | GET | `/sites/{siteId}/attending-practitioners` | Profesionales a cargo posibles en la sede | BAJO | 9 | sesión (sin roles) |
| 59 | GET | `/sites/{siteId}/census` | Censo de un día | BAJO | 11 | sesión (sin roles) |
| 60 | POST | `/sites/{siteId}/census/{date}/close` | Cerrar el censo de un día | ALTO | 15 | sesión (sin roles) |
| 61 | GET | `/sites/{siteId}/inpatient-indicators` | Indicadores hospitalarios (OPS) | BAJO | 10 | sesión (sin roles) |
| 62 | GET | `/sites/{siteId}/inpatients` | Pacientes internados de una sede | BAJO | 9 | sesión (sin roles) |

---

## 1. POST /census-days/{id}/adjustments

- **Origen:** CONTRATO
- **Nombre:** Ajustar un día de censo cerrado
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalCensusController.adjust` — `src/modules/clinical/controllers/clinical-adt.controller.ts:381`

### Qué es y para qué sirve (negocio)

Ajustar un día de censo cerrado. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /census-days/{id}/adjustments` la atiende `ClinicalCensusController.adjust` (src/modules/clinical/controllers/clinical-adt.controller.ts:381). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CensusAdjustmentDto` (4 campos, 3 obligatorios). Delega en `InpatientCensusService.adjust`. Crea filas en clinical.inpatient_census_adjustments, messaging.domain_events, messaging.outbox_messages. Lee clinical.inpatient_census_adjustments, clinical.inpatient_census_days, delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, messaging.outbox_messages, practice.care_spaces, practice.clinical_units y 2 más. Publica un evento calculado (eventType).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical/controllers/clinical-adt.controller.ts:381` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-adt.controller.ts:381` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.inpatient_census_adjustments` | ESCRIBE | CREA | DIRECTA | ClinicalCensusController.adjust → InpatientCensusService.adjust → InpatientCensusUseCases.adjust | `src/modules/clinical/services/inpatient/census.use-cases.ts:444` |
| `clinical.inpatient_census_adjustments` | LEE | LEE | DIRECTA | ClinicalCensusController.adjust → InpatientCensusService.adjust → InpatientCensusUseCases.adjust | `src/modules/clinical/services/inpatient/census.use-cases.ts:440` |
| `clinical.inpatient_census_days` | LEE | LEE | DIRECTA | ClinicalCensusController.adjust → InpatientCensusService.adjust → InpatientCensusUseCases.adjust | `src/modules/clinical/services/inpatient/census.use-cases.ts:410` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | ClinicalCensusController.adjust → InpatientCensusService.adjust → InpatientCensusUseCases.adjust → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | ClinicalCensusController.adjust → InpatientCensusService.adjust → InpatientCensusUseCases.adjust → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClinicalCensusController.adjust → InpatientCensusService.adjust → InpatientCensusUseCases.adjust → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | ClinicalCensusController.adjust → InpatientCensusService.adjust → InpatientCensusUseCases.adjust → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | ClinicalCensusController.adjust → InpatientCensusService.adjust → InpatientCensusUseCases.adjust → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | ClinicalCensusController.adjust → InpatientCensusService.adjust → InpatientCensusUseCases.adjust → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | ClinicalCensusController.adjust → InpatientCensusService.adjust → InpatientCensusUseCases.adjust → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | ClinicalCensusController.adjust → InpatientCensusService.adjust → InpatientCensusUseCases.adjust → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalCensusController.adjust → InpatientCensusService.adjust → InpatientCensusUseCases.adjust → InfrastructureAccessService.scopeFilter → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | ClinicalCensusController.adjust → InpatientCensusService.adjust → InpatientCensusUseCases.adjust → InfrastructureAccessService.scopeFilter → CareSpaceOpsRepository.siteScopeIndex | `src/modules/practice/repositories/care-space-ops.repository.ts:473` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `eventType` | `src/modules/clinical/services/inpatient/adt-support.ts:447` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CensusAdjustmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fieldCode` | `string` | Sí | — | `@IsString()` | Columna numérica (camelCase o snake_case) | `src/modules/clinical/dto/inpatient.dto.ts:315` |
| `newValue` | `number` | Sí | mínimo 0 | `@Type(() => Number)` `@IsInt()` `@Min(0)` | — | `src/modules/clinical/dto/inpatient.dto.ts:316` |
| `reasonText` | `string` | Sí | longitud máxima 2000 | `@IsString()` `@MaxLength(2000)` | — | `src/modules/clinical/dto/inpatient.dto.ts:317` |
| `entryRefId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical/dto/inpatient.dto.ts:321` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "fieldCode": "CODIGO_EJEMPLO",
  "newValue": 1,
  "reasonText": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fieldCode": "CODIGO_EJEMPLO",
  "newValue": 1,
  "reasonText": "Texto descriptivo de ejemplo",
  "entryRefId": "00000000-0000-4000-8000-000000000001"
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
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite ajustar el censo de esa unidad |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Día de censo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-adt-f3.int-spec.ts:320` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalCensusController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /clinical/admissions

- **Origen:** CONTRATO
- **Nombre:** Internar a un paciente
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalAdtController.admit` — `src/modules/clinical/controllers/clinical-adt.controller.ts:113`

### Qué es y para qué sirve (negocio)

Internar a un paciente. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/admissions` la atiende `ClinicalAdtController.admit` (src/modules/clinical/controllers/clinical-adt.controller.ts:113). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateAdmissionDto` (22 campos, 5 obligatorios). Delega en `InpatientAdtService.admit`. Crea filas en clinical.care_episodes, clinical.encounter_locations, clinical.encounters, clinical.patient_admission_footprints, clinical.placement_incidents, messaging.domain_events, messaging.outbox_messages, practice.care_space_status_events. Actualiza clinical.encounter_locations, practice.care_spaces. Lee clinical_ext.referrals, clinical.care_episodes, clinical.encounter_locations, clinical.encounters, clinical.patient_admission_footprints, delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships y 11 más. Publica un evento calculado (eventType). Hay 1 llamada cuyo destino depende de un dato en tiempo de ejecución y no se siguió.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical/controllers/clinical-adt.controller.ts:113` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.referrals` | LEE | LEE | POR_SQL | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → AdmitPatientUseCase.footprintFor | `src/modules/clinical/services/inpatient/adt.use-cases.ts:252` |
| `clinical.care_episodes` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute | `src/modules/clinical/services/inpatient/adt.use-cases.ts:130` |
| `clinical.care_episodes` | LEE | LEE | DIRECTA | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute | `src/modules/clinical/services/inpatient/adt.use-cases.ts:118` |
| `clinical.encounter_locations` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → AdtSupport.place | `src/modules/clinical/services/inpatient/adt-support.ts:319` |
| `clinical.encounter_locations` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → AdtSupport.place | `src/modules/clinical/services/inpatient/adt-support.ts:370` |
| `clinical.encounter_locations` | LEE | LEE | POR_SQL | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → AdtSupport.place → AdtSupport.compatibility → AdtSupport.compatibilityFor → InpatientRepository.roommates | `src/modules/clinical/repositories/inpatient.repository.ts:115` |
| `clinical.encounters` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute | `src/modules/clinical/services/inpatient/adt.use-cases.ts:149` |
| `clinical.encounters` | LEE | LEE | POR_SQL | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → InpatientRepository.inpatientInProgress | `src/modules/clinical/repositories/inpatient.repository.ts:143` |
| `clinical.patient_admission_footprints (vista u objeto no catalogado)` | ESCRIBE | CREA | POR_SQL | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → AdmitPatientUseCase.recordFootprint | `src/modules/clinical/services/inpatient/adt.use-cases.ts:284` |
| `clinical.patient_admission_footprints (vista u objeto no catalogado)` | LEE | LEE | POR_SQL | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant → AuthzClinicalScopeRepository.hasAdmissionFootprint | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:124` |
| `clinical.placement_incidents` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → AdtSupport.place | `src/modules/clinical/services/inpatient/adt-support.ts:347` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:106` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `practice.care_space_status_events` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → AdtSupport.place → PracticeCareSpaceOpsAdapter.recordOccupancyChange → CareSpaceOpsCore.changeAxis | `src/modules/practice/services/ops/care-space-ops-core.ts:367` |
| `practice.care_spaces` | ESCRIBE | ACTUALIZA | DIRECTA | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → AdtSupport.place → PracticeCareSpaceOpsAdapter.recordOccupancyChange → CareSpaceOpsCore.changeAxis → CareSpaceOpsCore.updateOps | `src/modules/practice/services/ops/care-space-ops-core.ts:441` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_settings` | LEE | LEE | POR_SQL | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → AdtSupport.place → PracticeCareSpaceOpsAdapter.getOperationalState → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.settings → CareSpaceOpsRepository.settings | `src/modules/practice/repositories/care-space-ops.repository.ts:431` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → AdtSupport.place → InpatientRepository.bedContext | `src/modules/clinical/repositories/inpatient.repository.ts:88` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientExists | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:40` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:92` |
| `profiles.person_profiles` | LEE | LEE | POR_SQL | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → AdtSupport.place → AdtSupport.compatibility → AdtSupport.compatibilityFor → InpatientRepository.patient | `src/modules/clinical/repositories/inpatient.repository.ts:67` |
| `profiles.persons` | LEE | LEE | POR_SQL | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → AdtSupport.place → AdtSupport.compatibility → AdtSupport.compatibilityFor → InpatientRepository.patient | `src/modules/clinical/repositories/inpatient.repository.ts:67` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | ClinicalAdtController.admit → InpatientAdtService.admit → AdmitPatientUseCase.execute → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:98` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `eventType` | `src/modules/clinical/services/inpatient/adt-support.ts:447` |

**No se pudo seguir** (el destino depende de un dato en tiempo de ejecución):

- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`

### Cuerpo — DTO `CreateAdmissionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical/dto/inpatient.dto.ts:100` |
| `practiceSiteId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical/dto/inpatient.dto.ts:101` |
| `episodeId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical/dto/inpatient.dto.ts:105` |
| `openEpisode` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/clinical/dto/inpatient.dto.ts:109` |
| `attendingPractitionerId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical/dto/inpatient.dto.ts:113` |
| `levelOfCareCode` | `string` | Sí | valores: LOC_CARE_GENERAL, LOC_CARE_INTERMEDIATE, LOC_CARE_ICU, LOC_CARE_NEONATAL_ICU | `@IsIn(LEVELS)` | — | `src/modules/clinical/dto/inpatient.dto.ts:114` |
| `admissionSourceCode` | `string` | Sí | valores: ADM_SRC_EMERGENCY, ADM_SRC_OUTPATIENT, ADM_SRC_REFERRAL, ADM_SRC_BIRTH, ADM_SRC_TRANSFER_IN | `@IsIn(SOURCES)` | — | `src/modules/clinical/dto/inpatient.dto.ts:115` |
| `isolationPrecautionCode` | `string` | No | valores: ISO_NONE, ISO_CONTACT, ISO_DROPLET, ISO_AIRBORNE, ISO_PROTECTIVE | `@IsOptional()` `@IsIn(ISO)` | — | `src/modules/clinical/dto/inpatient.dto.ts:119` |
| `isolationOrganismText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/clinical/dto/inpatient.dto.ts:124` |
| `reasonText` | `string` | Sí | longitud máxima 2000 | `@IsString()` `@MaxLength(2000)` | — | `src/modules/clinical/dto/inpatient.dto.ts:125` |
| `expectedDischargeAt` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | — | `src/modules/clinical/dto/inpatient.dto.ts:130` |
| `bed` | `AdmissionBedDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => AdmissionBedDto)` | — | `src/modules/clinical/dto/inpatient.dto.ts:135` |
| `bed.careSpaceId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/clinical/dto/inpatient.dto.ts:69` |
| `bed.mode` | `string` | No | valores: ASSIGN, RESERVE | `@IsIn(['ASSIGN', 'RESERVE'])` | — | `src/modules/clinical/dto/inpatient.dto.ts:73` |
| `override` | `PlacementOverrideDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => PlacementOverrideDto)` | — | `src/modules/clinical/dto/inpatient.dto.ts:140` |
| `override.justification` | `string` | No | longitud mínima 20; longitud máxima 2000 | `@IsString()` `@MaxLength(2000)` | — | `src/modules/clinical/dto/inpatient.dto.ts:52` |
| `override.ruleCodes` | `array<string>` | No | longitud máxima 40; máximo 10 elemento(s) | `@IsArray()` `@ArrayMaxSize(10)` `@IsString({ each: true })` `@MaxLength(40, { each: true })` | Reglas forzadas (SEX, AGE, ISOLATION_COHORT, LEVEL_OF_CARE) | `src/modules/clinical/dto/inpatient.dto.ts:62` |
| `admissionOriginCode` | `string` | No | valores: EMERGENCY, REFERRAL, SCHEDULED, TRANSFER_IN | `@IsOptional()` `@IsIn(ADMISSION_ORIGINS)` | — | `src/modules/clinical/dto/inpatient.dto.ts:149` |
| `identityVerification` | `IdentityVerificationDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => IdentityVerificationDto)` | — | `src/modules/clinical/dto/inpatient.dto.ts:155` |
| `identityVerification.methodCode` | `string` | No | valores: IDV_CI, IDV_PASSPORT, IDV_FOREIGN_ID, IDV_BIRTH_CERT, IDV_OTHER | `@IsIn(IDV_METHODS)` | — | `src/modules/clinical/dto/inpatient.dto.ts:88` |
| `identityVerification.documentReference` | `string` | No | longitud mínima 3; longitud máxima 64 | `@IsString()` `@MinLength(3)` `@MaxLength(64)` | Número o referencia del documento | `src/modules/clinical/dto/inpatient.dto.ts:96` |
| `referralId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical/dto/inpatient.dto.ts:160` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "levelOfCareCode": "LOC_CARE_GENERAL",
  "admissionSourceCode": "ADM_SRC_EMERGENCY",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "episodeId": "00000000-0000-4000-8000-000000000001",
  "openEpisode": true,
  "attendingPractitionerId": "00000000-0000-4000-8000-000000000001",
  "levelOfCareCode": "LOC_CARE_GENERAL",
  "admissionSourceCode": "ADM_SRC_EMERGENCY",
  "isolationPrecautionCode": "ISO_NONE",
  "isolationOrganismText": "valor-ejemplo",
  "reasonText": "Texto descriptivo de ejemplo",
  "expectedDischargeAt": "2026-07-31T12:00:00.000Z",
  "bed": {
    "careSpaceId": "00000000-0000-4000-8000-000000000001",
    "mode": "ASSIGN"
  },
  "override": {
    "justification": "valor-ejemploxxxxxxx",
    "ruleCodes": [
      "CODIGO_EJEMPLO"
    ]
  },
  "admissionOriginCode": "EMERGENCY",
  "identityVerification": {
    "methodCode": "IDV_CI",
    "documentReference": "valor-ejemplo"
  },
  "referralId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<AdtResultDto>` · DTO `AdtResultDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `episodeId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:326` |
| `encounterId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:327` |
| `encounterLocationId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:328` |
| `fromLocationId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:329` |
| `toLocationId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:330` |
| `cleaningOrderId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:331` |
| `incidentId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:332` |
| `cell` | `object` | No | — | — | Estado operativo de la cama (CareSpaceOpsPort) | `src/modules/clinical/dto/inpatient.dto.ts:336` |
| `locations` | `array<object>` | No | — | — | — | `src/modules/clinical/dto/inpatient.dto.ts:337` |
| `requestId` | `string` | No | — | — | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `src/modules/clinical/dto/inpatient.dto.ts:345` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado; ResourceNotFoundException: Derivación no encontrada; ResourceNotFoundException: Episodio de cuidado no encontrado; ResourceNotFoundException: Paciente no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El ingreso de un paciente sin vínculo previo exige origen e identidad verificada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Acción de infraestructura no registrada: {action} |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-admission-footprint.int-spec.ts:62` |
| INTEGRACION | `test/integration/infrastructure-adt-f3-scope.int-spec.ts:144` |
| INTEGRACION | `test/integration/infrastructure-adt-f3.int-spec.ts:75` |
| INTEGRACION | `test/integration/infrastructure-web-f2f3.int-spec.ts:191` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalAdtController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /clinical/allergy-intolerances

- **Origen:** CONTRATO
- **Nombre:** Registrar una alergia con reacciones
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.createAllergy` — `src/modules/clinical/controllers/clinical-records.controller.ts:175`

### Qué es y para qué sirve (negocio)

Registrar una alergia con reacciones. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/allergy-intolerances` la atiende `ClinicalRecordsController.createAllergy` (src/modules/clinical/controllers/clinical-records.controller.ts:175). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateAllergyIntoleranceDto` (11 campos, 3 obligatorios). Delega en `AllergyIntolerancesService.create`. Crea filas en clinical.allergy_intolerances, clinical.allergy_reactions. Lee clinical.allergy_intolerances, clinical.encounters.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:175` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.allergy_intolerances` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.createAllergy → AllergyIntolerancesService.create → AllergyIntolerancesRepository.create | `src/modules/clinical/repositories/allergy-intolerances.repository.ts:144` |
| `clinical.allergy_intolerances` | LEE | LEE | DIRECTA | ClinicalRecordsController.createAllergy → AllergyIntolerancesService.create → AllergyIntolerancesRepository.findActiveBySubstance | `src/modules/clinical/repositories/allergy-intolerances.repository.ts:128` |
| `clinical.allergy_reactions` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.createAllergy → AllergyIntolerancesService.create → AllergyIntolerancesRepository.createReaction | `src/modules/clinical/repositories/allergy-intolerances.repository.ts:174` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalRecordsController.createAllergy → AllergyIntolerancesService.create → AllergyIntolerancesService.assertEncounterBelongsToPatient → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:174` |

### Cuerpo — DTO `CreateAllergyIntoleranceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `custodianTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant custodio (directory.tenants) | `src/modules/clinical/dto/allergy.dto.ts:52` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente (profiles.patient_profiles) | `src/modules/clinical/dto/allergy.dto.ts:62` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro en el que se detectó (clinical.encounters) | `src/modules/clinical/dto/allergy.dto.ts:77` |
| `substanceConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Sustancia alergénica (concept id) | `src/modules/clinical/dto/allergy.dto.ts:87` |
| `typeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo (concept id) | `src/modules/clinical/dto/allergy.dto.ts:95` |
| `categoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Categoría (concept id) | `src/modules/clinical/dto/allergy.dto.ts:106` |
| `criticalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Criticidad (concept id) | `src/modules/clinical/dto/allergy.dto.ts:117` |
| `reactions` | `array<AllergyReactionInput>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => AllergyReactionInput)` | — | `src/modules/clinical/dto/allergy.dto.ts:127` |
| `reactions[].manifestationConceptId` | `string` | No | formato uuid | `@IsUUID()` | Manifestación (concept id) | `src/modules/clinical/dto/allergy.dto.ts:19` |
| `reactions[].severityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Severidad (concept id) | `src/modules/clinical/dto/allergy.dto.ts:30` |
| `reactions[].description` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Descripción libre | `src/modules/clinical/dto/allergy.dto.ts:39` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "substanceConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "substanceConceptId": "00000000-0000-4000-8000-000000000001",
  "typeConceptId": "00000000-0000-4000-8000-000000000001",
  "categoryConceptId": "00000000-0000-4000-8000-000000000001",
  "criticalityConceptId": "00000000-0000-4000-8000-000000000001",
  "reactions": [
    {
      "manifestationConceptId": "00000000-0000-4000-8000-000000000001",
      "severityConceptId": "00000000-0000-4000-8000-000000000001",
      "description": "Texto descriptivo de ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<AllergyIntoleranceResponseDto>` · DTO `AllergyIntoleranceResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/allergy.dto.ts:136` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/allergy.dto.ts:142` |
| `encounterId` | `string` | Sí | formato uuid; admite null | — | Encuentro en el que se detectó, si se registró dentro de una atención. | `src/modules/clinical/dto/allergy.dto.ts:148` |
| `clinicalStatus` | `string` | Sí | formato uuid; admite null | — | Estado clínico (concept id) | `src/modules/clinical/dto/allergy.dto.ts:158` |
| `reactionIds` | `array<string>` | Sí | — | — | Ids de reacciones creadas | `src/modules/clinical/dto/allergy.dto.ts:164` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/allergy.dto.ts:170` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El paciente ya tiene una alergia activa a esa sustancia |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El encuentro indicado no existe o no pertenece a este paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:623` |
| CONTROLADOR | `src/modules/clinical/controllers/clinical-records.controller.spec.ts:68` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. GET /clinical/allergy-intolerances/{id}/attachments

- **Origen:** CONTRATO
- **Nombre:** Listar los adjuntos de una alergia
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.listAllergyAttachments` — `src/modules/clinical/controllers/clinical-records.controller.ts:212`

### Qué es y para qué sirve (negocio)

Listar los adjuntos de una alergia. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /clinical/allergy-intolerances/{id}/attachments` la atiende `ClinicalRecordsController.listAllergyAttachments` (src/modules/clinical/controllers/clinical-records.controller.ts:212). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, PATIENT. Delega en `AllergyIntolerancesService.listAttachments`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 14 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, PATIENT | `src/modules/clinical/controllers/clinical-records.controller.ts:212` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-records.controller.ts:212` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalRecordsController.listAllergyAttachments → AllergyIntolerancesService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalRecordsController.listAllergyAttachments → AllergyIntolerancesService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.listAllergyAttachments → AllergyIntolerancesService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.listAllergyAttachments → AllergyIntolerancesService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalRecordsController.listAllergyAttachments → AllergyIntolerancesService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.listAllergyAttachments → AllergyIntolerancesService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.listAllergyAttachments → AllergyIntolerancesService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.listAllergyAttachments → AllergyIntolerancesService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalRecordsController.listAllergyAttachments → AllergyIntolerancesService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.listAllergyAttachments → AllergyIntolerancesService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalRecordsController.listAllergyAttachments → AllergyIntolerancesService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.allergy_intolerances` | LEE | LEE | DIRECTA | ClinicalRecordsController.listAllergyAttachments → AllergyIntolerancesService.listAttachments → AllergyIntolerancesRepository.findById | `src/modules/clinical/repositories/allergy-intolerances.repository.ts:117` |
| `common.file_links` | LEE | LEE | DIRECTA | ClinicalRecordsController.listAllergyAttachments → AllergyIntolerancesService.listAttachments → FilesService.listLinkedFilesOf → FileLinksRepository.findByOwner | `src/modules/common/repositories/file-links.repository.ts:78` |
| `common.file_versions` | LEE | LEE | DIRECTA | ClinicalRecordsController.listAllergyAttachments → AllergyIntolerancesService.listAttachments → FilesService.listLinkedFilesOf → FileVersionsRepository.findByIds | `src/modules/common/repositories/file-versions.repository.ts:95` |
| `common.files` | LEE | LEE | DIRECTA | ClinicalRecordsController.listAllergyAttachments → AllergyIntolerancesService.listAttachments → FilesService.listLinkedFilesOf → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalRecordsController.listAllergyAttachments → AllergyIntolerancesService.listAttachments → ClinicalReadService.assertCanReadHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | ClinicalRecordsController.listAllergyAttachments → AllergyIntolerancesService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ClinicalRecordsController.listAllergyAttachments → AllergyIntolerancesService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalRecordsController.listAllergyAttachments → AllergyIntolerancesService.listAttachments → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalRecordsController.listAllergyAttachments → AllergyIntolerancesService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalRecordsController.listAllergyAttachments → AllergyIntolerancesService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalRecordsController.listAllergyAttachments → AllergyIntolerancesService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LinkedFilePageDto>` · DTO `LinkedFilePageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<LinkedFileResponseDto>` | Sí | — | — | — | `src/modules/common/dto/files.dto.ts:547` |
| `items[].linkId` | `string` | Sí | formato uuid | — | Id del vínculo, no del archivo. | `src/modules/common/dto/files.dto.ts:529` |
| `items[].ownerId` | `string` | Sí | formato uuid | — | — | `src/modules/common/dto/files.dto.ts:532` |
| `items[].ownerType` | `string` | Sí | valores: USER, PATIENT, TENANT, CONDITION, PROCEDURE, MEDICATION_REQUEST, ALLERGY_INTOLERANCE, ENCOUNTER | — | — | `src/modules/common/dto/files.dto.ts:535` |
| `items[].linkedAt` | `string` | Sí | formato date-time | — | Cuándo se adjuntó. | `src/modules/common/dto/files.dto.ts:538` |
| `items[].file` | `FileResponseDto` | Sí | — | — | — | `src/modules/common/dto/files.dto.ts:541` |
| `items[].file.id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/common/dto/files.dto.ts:279` |
| `items[].file.currentVersionId` | `string` | No | formato uuid | — | Identificador asociado a current version. | `src/modules/common/dto/files.dto.ts:285` |
| `items[].file.originalName` | `string` | No | — | — | Valor de original name mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:291` |
| `items[].file.mimeType` | `string` | No | — | — | Tipo MIME de la versión vigente. Ausente si no hay versión vigente. | `src/modules/common/dto/files.dto.ts:308` |
| `items[].file.sizeBytes` | `number` | No | — | — | Tamaño en bytes de la versión vigente. Ausente si no hay versión vigente. | `src/modules/common/dto/files.dto.ts:325` |
| `items[].file.category` | `string` | Sí | valores: DOCUMENT, IMAGE | — | Valor de category mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:331` |
| `items[].file.sensitivity` | `string` | Sí | valores: NORMAL, PHI | — | Valor de sensitivity mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:337` |
| `items[].file.lifecycleStatusConceptId` | `string` | Sí | — | — | Estado del ciclo de vida (concept id). | `src/modules/common/dto/files.dto.ts:343` |
| `items[].file.createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/common/dto/files.dto.ts:349` |
| `count` | `number` | Sí | — | — | Cuántos vinieron en esta página. | `src/modules/common/dto/files.dto.ts:550` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY}; ForbiddenException: No tiene acceso a los adjuntos de este recurso |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Alergia no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/audit-trail-seal.int-spec.ts:134` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /clinical/allergy-intolerances/{id}/attachments

- **Origen:** CONTRATO
- **Nombre:** Adjuntar un archivo ya subido a una alergia
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.attachFileToAllergy` — `src/modules/clinical/controllers/clinical-records.controller.ts:192`

### Qué es y para qué sirve (negocio)

Adjuntar un archivo ya subido a una alergia. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/allergy-intolerances/{id}/attachments` la atiende `ClinicalRecordsController.attachFileToAllergy` (src/modules/clinical/controllers/clinical-records.controller.ts:192). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `AttachFileToAllergyIntoleranceDto` (1 campo, 1 obligatorio). Delega en `AllergyIntolerancesService.attachFile`. Crea filas en common.file_links. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 12 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:192` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-records.controller.ts:192` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToAllergy → AllergyIntolerancesService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToAllergy → AllergyIntolerancesService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToAllergy → AllergyIntolerancesService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToAllergy → AllergyIntolerancesService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToAllergy → AllergyIntolerancesService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToAllergy → AllergyIntolerancesService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToAllergy → AllergyIntolerancesService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToAllergy → AllergyIntolerancesService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToAllergy → AllergyIntolerancesService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToAllergy → AllergyIntolerancesService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToAllergy → AllergyIntolerancesService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.allergy_intolerances` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToAllergy → AllergyIntolerancesService.attachFile → AllergyIntolerancesRepository.findById | `src/modules/clinical/repositories/allergy-intolerances.repository.ts:117` |
| `common.file_links` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.attachFileToAllergy → AllergyIntolerancesService.attachFile → FilesService.createLink → FileLinksRepository.create | `src/modules/common/repositories/file-links.repository.ts:43` |
| `common.file_versions` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToAllergy → AllergyIntolerancesService.attachFile → FilesService.createLink → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:190` |
| `common.files` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToAllergy → AllergyIntolerancesService.attachFile → FilesService.createLink → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:182` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToAllergy → AllergyIntolerancesService.attachFile → FilesService.createLink → StoragePublicationService.guardFile → StorageLifecycleCoordinator.assertNoContender → QueuesRepository.findStorageIntents | `src/modules/messaging/repositories/queues.repository.ts:62` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToAllergy → AllergyIntolerancesService.attachFile → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToAllergy → AllergyIntolerancesService.attachFile → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalRecordsController.attachFileToAllergy → AllergyIntolerancesService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalRecordsController.attachFileToAllergy → AllergyIntolerancesService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalRecordsController.attachFileToAllergy → AllergyIntolerancesService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AttachFileToAllergyIntoleranceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical/dto/allergy.dto.ts:177` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<FileLinkResponseDto>` · DTO `FileLinkResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/common/dto/files.dto.ts:444` |
| `fileId` | `string` | Sí | formato uuid | — | Identificador asociado a file. | `src/modules/common/dto/files.dto.ts:450` |
| `ownerId` | `string` | Sí | formato uuid | — | Identificador asociado a owner. | `src/modules/common/dto/files.dto.ts:456` |
| `ownerType` | `string` | Sí | valores: USER, PATIENT, TENANT, CONDITION, PROCEDURE, MEDICATION_REQUEST, ALLERGY_INTOLERANCE, ENCOUNTER | — | Valor de owner type mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:462` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/common/dto/files.dto.ts:468` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY}; InsufficientRoleException: No tiene permiso para modificar este archivo |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Alergia no encontrada; ResourceNotFoundException: Archivo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING; StorageLifecycleDenied: {identity.reasonCode}; StorageLifecycleDenied: FILE_NOT_LIVE; StorageLifecycleDenied: VERSION_UNKNOWN; StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN; StorageLifecycleDenied: PRODUCER_OR_PURGE_IN_FLIGHT |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /clinical/bed-compatibility

- **Origen:** CONTRATO
- **Nombre:** Compatibilidad prospectiva de una cama con un paciente
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalAdtController.prospectiveCompatibility` — `src/modules/clinical/controllers/clinical-adt.controller.ts:91`

### Qué es y para qué sirve (negocio)

Compatibilidad prospectiva de una cama con un paciente. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/bed-compatibility` la atiende `ClinicalAdtController.prospectiveCompatibility` (src/modules/clinical/controllers/clinical-adt.controller.ts:91). Exige sesión; el controlador no declara roles. Valida el cuerpo como `ProspectiveCompatibilityDto` (5 campos, 2 obligatorios). Delega en `InpatientAdtService.prospectiveCompatibility`. Lee clinical.encounter_locations, clinical.encounters, clinical.patient_admission_footprints, delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.clinical_units y 8 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical/controllers/clinical-adt.controller.ts:91` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | LEE | LEE | POR_SQL | ClinicalAdtController.prospectiveCompatibility → InpatientAdtService.prospectiveCompatibility → InpatientReadUseCases.prospectiveCompatibility → AdtSupport.compatibilityFor → InpatientRepository.roommates | `src/modules/clinical/repositories/inpatient.repository.ts:115` |
| `clinical.encounters` | LEE | LEE | POR_SQL | ClinicalAdtController.prospectiveCompatibility → InpatientAdtService.prospectiveCompatibility → InpatientReadUseCases.prospectiveCompatibility → AdtSupport.compatibilityFor → InpatientRepository.roommates | `src/modules/clinical/repositories/inpatient.repository.ts:115` |
| `clinical.patient_admission_footprints (vista u objeto no catalogado)` | LEE | LEE | POR_SQL | ClinicalAdtController.prospectiveCompatibility → InpatientAdtService.prospectiveCompatibility → InpatientReadUseCases.prospectiveCompatibility → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant → AuthzClinicalScopeRepository.hasAdmissionFootprint | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:124` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.prospectiveCompatibility → InpatientAdtService.prospectiveCompatibility → InpatientReadUseCases.prospectiveCompatibility → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.prospectiveCompatibility → InpatientAdtService.prospectiveCompatibility → InpatientReadUseCases.prospectiveCompatibility → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.prospectiveCompatibility → InpatientAdtService.prospectiveCompatibility → InpatientReadUseCases.prospectiveCompatibility → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:106` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | ClinicalAdtController.prospectiveCompatibility → InpatientAdtService.prospectiveCompatibility → InpatientReadUseCases.prospectiveCompatibility → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | ClinicalAdtController.prospectiveCompatibility → InpatientAdtService.prospectiveCompatibility → InpatientReadUseCases.prospectiveCompatibility → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_settings` | LEE | LEE | POR_SQL | ClinicalAdtController.prospectiveCompatibility → InpatientAdtService.prospectiveCompatibility → InpatientReadUseCases.prospectiveCompatibility → AdtSupport.compatibilityFor → PracticeCareSpaceOpsAdapter.getOperationalState → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.settings → CareSpaceOpsRepository.settings | `src/modules/practice/repositories/care-space-ops.repository.ts:431` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalAdtController.prospectiveCompatibility → InpatientAdtService.prospectiveCompatibility → InpatientReadUseCases.prospectiveCompatibility → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.prospectiveCompatibility → InpatientAdtService.prospectiveCompatibility → InpatientReadUseCases.prospectiveCompatibility → AdtSupport.compatibilityFor → InpatientRepository.bedContext | `src/modules/clinical/repositories/inpatient.repository.ts:88` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ClinicalAdtController.prospectiveCompatibility → InpatientAdtService.prospectiveCompatibility → InpatientReadUseCases.prospectiveCompatibility → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientExists | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:40` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalAdtController.prospectiveCompatibility → InpatientAdtService.prospectiveCompatibility → InpatientReadUseCases.prospectiveCompatibility → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:92` |
| `profiles.person_profiles` | LEE | LEE | POR_SQL | ClinicalAdtController.prospectiveCompatibility → InpatientAdtService.prospectiveCompatibility → InpatientReadUseCases.prospectiveCompatibility → AdtSupport.compatibilityFor → InpatientRepository.patient | `src/modules/clinical/repositories/inpatient.repository.ts:67` |
| `profiles.persons` | LEE | LEE | POR_SQL | ClinicalAdtController.prospectiveCompatibility → InpatientAdtService.prospectiveCompatibility → InpatientReadUseCases.prospectiveCompatibility → AdtSupport.compatibilityFor → InpatientRepository.patient | `src/modules/clinical/repositories/inpatient.repository.ts:67` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | ClinicalAdtController.prospectiveCompatibility → InpatientAdtService.prospectiveCompatibility → InpatientReadUseCases.prospectiveCompatibility → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:98` |

### Cuerpo — DTO `ProspectiveCompatibilityDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `careSpaceId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical/dto/inpatient.dto.ts:179` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical/dto/inpatient.dto.ts:180` |
| `levelOfCareCode` | `string` | No | valores: LOC_CARE_GENERAL, LOC_CARE_INTERMEDIATE, LOC_CARE_ICU, LOC_CARE_NEONATAL_ICU | `@IsOptional()` `@IsIn(LEVELS)` | — | `src/modules/clinical/dto/inpatient.dto.ts:184` |
| `isolationPrecautionCode` | `string` | No | valores: ISO_NONE, ISO_CONTACT, ISO_DROPLET, ISO_AIRBORNE, ISO_PROTECTIVE | `@IsOptional()` `@IsIn(ISO)` | — | `src/modules/clinical/dto/inpatient.dto.ts:188` |
| `isolationOrganismText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/clinical/dto/inpatient.dto.ts:193` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "levelOfCareCode": "LOC_CARE_GENERAL",
  "isolationPrecautionCode": "ISO_NONE",
  "isolationOrganismText": "valor-ejemplo"
}
```

</details>

### Respuesta — `no declarado` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado; ResourceNotFoundException: Paciente no encontrado; ResourceNotFoundException: Cama no encontrada en la sede |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-web-f2f3.int-spec.ts:120` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalAdtController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /clinical/bed-swaps

- **Origen:** CONTRATO
- **Nombre:** Intercambiar camas entre dos pacientes
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalAdtController.swap` — `src/modules/clinical/controllers/clinical-adt.controller.ts:184`

### Qué es y para qué sirve (negocio)

Intercambiar camas entre dos pacientes. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/bed-swaps` la atiende `ClinicalAdtController.swap` (src/modules/clinical/controllers/clinical-adt.controller.ts:184). Exige sesión; el controlador no declara roles. Valida el cuerpo como `BedSwapDto` (7 campos, 3 obligatorios). Delega en `InpatientAdtService.swap`. Crea filas en clinical.encounter_locations, clinical.placement_incidents, messaging.domain_events, messaging.outbox_messages, practice.care_space_status_events. Actualiza clinical.encounter_locations, practice.care_spaces. Lee clinical.encounter_locations, clinical.encounters, delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, messaging.outbox_messages, practice.care_spaces, practice.clinical_units y 6 más. Publica un evento calculado (eventType). Hay 2 llamadas cuyo destino depende de un dato en tiempo de ejecución y no se siguieron.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical/controllers/clinical-adt.controller.ts:184` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalAdtController.swap → InpatientAdtService.swap → SwapBedsUseCase.execute → AdtSupport.close | `src/modules/clinical/services/inpatient/adt-support.ts:421` |
| `clinical.encounter_locations` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.swap → InpatientAdtService.swap → SwapBedsUseCase.execute → AdtSupport.place | `src/modules/clinical/services/inpatient/adt-support.ts:319` |
| `clinical.encounter_locations` | LEE | LEE | DIRECTA | ClinicalAdtController.swap → InpatientAdtService.swap → SwapBedsUseCase.execute → AdtSupport.activeBed | `src/modules/clinical/services/inpatient/adt-support.ts:147` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalAdtController.swap → InpatientAdtService.swap → SwapBedsUseCase.execute → AdtSupport.encounter | `src/modules/clinical/services/inpatient/adt-support.ts:128` |
| `clinical.placement_incidents` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.swap → InpatientAdtService.swap → SwapBedsUseCase.execute → AdtSupport.place | `src/modules/clinical/services/inpatient/adt-support.ts:347` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.swap → InpatientAdtService.swap → SwapBedsUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.swap → InpatientAdtService.swap → SwapBedsUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.swap → InpatientAdtService.swap → SwapBedsUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.swap → InpatientAdtService.swap → SwapBedsUseCase.execute → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.swap → InpatientAdtService.swap → SwapBedsUseCase.execute → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | ClinicalAdtController.swap → InpatientAdtService.swap → SwapBedsUseCase.execute → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `practice.care_space_status_events` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.swap → InpatientAdtService.swap → SwapBedsUseCase.execute → AdtSupport.place → PracticeCareSpaceOpsAdapter.recordOccupancyChange → CareSpaceOpsCore.changeAxis | `src/modules/practice/services/ops/care-space-ops-core.ts:367` |
| `practice.care_spaces` | ESCRIBE | ACTUALIZA | DIRECTA | ClinicalAdtController.swap → InpatientAdtService.swap → SwapBedsUseCase.execute → AdtSupport.place → PracticeCareSpaceOpsAdapter.recordOccupancyChange → CareSpaceOpsCore.changeAxis → CareSpaceOpsCore.updateOps | `src/modules/practice/services/ops/care-space-ops-core.ts:441` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | ClinicalAdtController.swap → InpatientAdtService.swap → SwapBedsUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | ClinicalAdtController.swap → InpatientAdtService.swap → SwapBedsUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_settings` | LEE | LEE | POR_SQL | ClinicalAdtController.swap → InpatientAdtService.swap → SwapBedsUseCase.execute → AdtSupport.place → PracticeCareSpaceOpsAdapter.getOperationalState → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.settings → CareSpaceOpsRepository.settings | `src/modules/practice/repositories/care-space-ops.repository.ts:431` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalAdtController.swap → InpatientAdtService.swap → SwapBedsUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.swap → InpatientAdtService.swap → SwapBedsUseCase.execute → AdtSupport.place → InpatientRepository.bedContext | `src/modules/clinical/repositories/inpatient.repository.ts:88` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | ClinicalAdtController.swap → InpatientAdtService.swap → SwapBedsUseCase.execute → AdtSupport.compatibility → AdtSupport.compatibilityFor → InpatientRepository.patient | `src/modules/clinical/repositories/inpatient.repository.ts:67` |
| `profiles.person_profiles` | LEE | LEE | POR_SQL | ClinicalAdtController.swap → InpatientAdtService.swap → SwapBedsUseCase.execute → AdtSupport.compatibility → AdtSupport.compatibilityFor → InpatientRepository.patient | `src/modules/clinical/repositories/inpatient.repository.ts:67` |
| `profiles.persons` | LEE | LEE | POR_SQL | ClinicalAdtController.swap → InpatientAdtService.swap → SwapBedsUseCase.execute → AdtSupport.compatibility → AdtSupport.compatibilityFor → InpatientRepository.patient | `src/modules/clinical/repositories/inpatient.repository.ts:67` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `eventType` | `src/modules/clinical/services/inpatient/adt-support.ts:447` |

**No se pudo seguir** (el destino depende de un dato en tiempo de ejecución):

- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`
- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`

### Cuerpo — DTO `BedSwapDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `encounterAId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical/dto/inpatient.dto.ts:251` |
| `encounterBId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical/dto/inpatient.dto.ts:252` |
| `occurredAt` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | — | `src/modules/clinical/dto/inpatient.dto.ts:257` |
| `reasonText` | `string` | Sí | longitud máxima 2000 | `@IsString()` `@MaxLength(2000)` | — | `src/modules/clinical/dto/inpatient.dto.ts:258` |
| `override` | `PlacementOverrideDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => PlacementOverrideDto)` | — | `src/modules/clinical/dto/inpatient.dto.ts:263` |
| `override.justification` | `string` | No | longitud mínima 20; longitud máxima 2000 | `@IsString()` `@MaxLength(2000)` | — | `src/modules/clinical/dto/inpatient.dto.ts:52` |
| `override.ruleCodes` | `array<string>` | No | longitud máxima 40; máximo 10 elemento(s) | `@IsArray()` `@ArrayMaxSize(10)` `@IsString({ each: true })` `@MaxLength(40, { each: true })` | Reglas forzadas (SEX, AGE, ISOLATION_COHORT, LEVEL_OF_CARE) | `src/modules/clinical/dto/inpatient.dto.ts:62` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "encounterAId": "00000000-0000-4000-8000-000000000001",
  "encounterBId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "encounterAId": "00000000-0000-4000-8000-000000000001",
  "encounterBId": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-07-31T12:00:00.000Z",
  "reasonText": "Texto descriptivo de ejemplo",
  "override": {
    "justification": "valor-ejemploxxxxxxx",
    "ruleCodes": [
      "CODIGO_EJEMPLO"
    ]
  }
}
```

</details>

### Respuesta — `Promise<AdtResultDto>` · DTO `AdtResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `episodeId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:326` |
| `encounterId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:327` |
| `encounterLocationId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:328` |
| `fromLocationId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:329` |
| `toLocationId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:330` |
| `cleaningOrderId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:331` |
| `incidentId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:332` |
| `cell` | `object` | No | — | — | Estado operativo de la cama (CareSpaceOpsPort) | `src/modules/clinical/dto/inpatient.dto.ts:336` |
| `locations` | `array<object>` | No | — | — | — | `src/modules/clinical/dto/inpatient.dto.ts:337` |
| `requestId` | `string` | No | — | — | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `src/modules/clinical/dto/inpatient.dto.ts:345` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado; ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado; ResourceNotFoundException: Cama no encontrada en la sede |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Acción de infraestructura no registrada: {action} |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-adt-f3.int-spec.ts:213` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalAdtController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. POST /clinical/care-episodes

- **Origen:** CONTRATO
- **Nombre:** Abrir un episodio de cuidado
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalEncountersController.openEpisode` — `src/modules/clinical/controllers/clinical-encounters.controller.ts:73`

### Qué es y para qué sirve (negocio)

Abrir un episodio de cuidado. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/care-episodes` la atiende `ClinicalEncountersController.openEpisode` (src/modules/clinical/controllers/clinical-encounters.controller.ts:73). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateCareEpisodeDto` (5 campos, 2 obligatorios). Delega en `CareEpisodesService.open`. Crea filas en clinical.care_episodes. Lee clinical.care_episodes.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-encounters.controller.ts:73` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.care_episodes` | ESCRIBE | CREA | DIRECTA | ClinicalEncountersController.openEpisode → CareEpisodesService.open → CareEpisodesRepository.create | `src/modules/clinical/repositories/care-episodes.repository.ts:100` |
| `clinical.care_episodes` | LEE | LEE | DIRECTA | ClinicalEncountersController.openEpisode → CareEpisodesService.open → CareEpisodesRepository.findActiveByPatient | `src/modules/clinical/repositories/care-episodes.repository.ts:59` |

### Cuerpo — DTO `CreateCareEpisodeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente (profiles.patient_profiles) | `src/modules/clinical/dto/care-episode.dto.ts:14` |
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant custodio (directory.tenants) | `src/modules/clinical/dto/care-episode.dto.ts:24` |
| `responsiblePractitionerId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional responsable | `src/modules/clinical/dto/care-episode.dto.ts:35` |
| `typeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de episodio (concept id) | `src/modules/clinical/dto/care-episode.dto.ts:46` |
| `startAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio del episodio | `src/modules/clinical/dto/care-episode.dto.ts:57` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "responsiblePractitionerId": "00000000-0000-4000-8000-000000000001",
  "typeConceptId": "00000000-0000-4000-8000-000000000001",
  "startAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<CareEpisodeResponseDto>` · DTO `CareEpisodeResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/care-episode.dto.ts:66` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/care-episode.dto.ts:72` |
| `tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | `src/modules/clinical/dto/care-episode.dto.ts:78` |
| `status` | `string` | Sí | formato uuid | — | Estado del episodio (concept id) | `src/modules/clinical/dto/care-episode.dto.ts:87` |
| `startAt` | `string` | Sí | formato date-time; admite null | — | Valor de start at mantenido por la instancia. | `src/modules/clinical/dto/care-episode.dto.ts:93` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/care-episode.dto.ts:99` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El paciente ya tiene un episodio activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/clinical-c14-c23-notas-e-internacion.int-spec.ts:279` |
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:595` |
| CONTROLADOR | `src/modules/clinical/controllers/clinical-encounters.controller.spec.ts:33` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalEncountersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /clinical/conditions

- **Origen:** CONTRATO
- **Nombre:** Registrar una condición/diagnóstico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.createCondition` — `src/modules/clinical/controllers/clinical-records.controller.ts:92`

### Qué es y para qué sirve (negocio)

Registrar una condición/diagnóstico. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/conditions` la atiende `ClinicalRecordsController.createCondition` (src/modules/clinical/controllers/clinical-records.controller.ts:92). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateConditionDto` (12 campos, 3 obligatorios). Delega en `ConditionsService.create`. Crea filas en audit.audit_log, audit.conditions_history, clinical.conditions. Actualiza audit.conditions_history. Lee audit.audit_log, audit.conditions_history, clinical.conditions, clinical.encounters, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:92` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.createCondition → ConditionsService.create → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | ClinicalRecordsController.createCondition → ConditionsService.create → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `audit.conditions_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | ClinicalRecordsController.createCondition → ConditionsService.create | `src/modules/clinical/services/conditions.service.ts:275` |
| `audit.conditions_history` | ESCRIBE | CREA | POR_REGISTRO | ClinicalRecordsController.createCondition → ConditionsService.create | `src/modules/clinical/services/conditions.service.ts:275` |
| `audit.conditions_history` | LEE | LEE | POR_REGISTRO | ClinicalRecordsController.createCondition → ConditionsService.create | `src/modules/clinical/services/conditions.service.ts:275` |
| `clinical.conditions` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.createCondition → ConditionsService.create → ConditionsRepository.create | `src/modules/clinical/repositories/conditions.repository.ts:153` |
| `clinical.conditions` | LEE | LEE | DIRECTA | ClinicalRecordsController.createCondition → ConditionsService.create → ConditionsRepository.findActiveByCode | `src/modules/clinical/repositories/conditions.repository.ts:137` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalRecordsController.createCondition → ConditionsService.create → ConditionsService.assertEncounterBelongsToPatient → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:174` |
| `iam.sessions` | LEE | LEE | POR_SQL | ClinicalRecordsController.createCondition → ConditionsService.create → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |

### Cuerpo — DTO `CreateConditionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `custodianTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant custodio (directory.tenants) | `src/modules/clinical/dto/condition.dto.ts:24` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente (profiles.patient_profiles) | `src/modules/clinical/dto/condition.dto.ts:34` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro en curso | `src/modules/clinical/dto/condition.dto.ts:42` |
| `codeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Código de la condición/diagnóstico (concept id) | `src/modules/clinical/dto/condition.dto.ts:52` |
| `categoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Categoría (concept id) | `src/modules/clinical/dto/condition.dto.ts:63` |
| `severityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Severidad (concept id) | `src/modules/clinical/dto/condition.dto.ts:74` |
| `lateralityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Lateralidad (concept id) | `src/modules/clinical/dto/condition.dto.ts:85` |
| `clinicalCourseConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Curso clínico: agudo/crónico/subagudo/recurrente (concept id). Sin declarar es un dato legítimo, no un olvido. | `src/modules/clinical/dto/condition.dto.ts:97` |
| `verificationStatusConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Estado de verificación del alta: COND_PROVISIONAL (presuntivo) o COND_CONFIRMED. Por omisión, confirmado | `src/modules/clinical/dto/condition.dto.ts:113` |
| `onsetAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de la condición | `src/modules/clinical/dto/condition.dto.ts:124` |
| `expectedResolutionAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fecha esperada de resolución o próxima revisión. Sólo tiene sentido en curso agudo/subagudo. | `src/modules/clinical/dto/condition.dto.ts:136` |
| `noteText` | `string` | No | — | `@IsOptional()` `@IsString()` | Hallazgos y justificación clínica (narrativa libre de quien registra; Patch v4.1.3) | `src/modules/clinical/dto/condition.dto.ts:147` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001",
  "categoryConceptId": "00000000-0000-4000-8000-000000000001",
  "severityConceptId": "00000000-0000-4000-8000-000000000001",
  "lateralityConceptId": "00000000-0000-4000-8000-000000000001",
  "clinicalCourseConceptId": "00000000-0000-4000-8000-000000000001",
  "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "onsetAt": "2026-07-31T12:00:00.000Z",
  "expectedResolutionAt": "2026-07-31T12:00:00.000Z",
  "noteText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ConditionResponseDto>` · DTO `ConditionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/condition.dto.ts:184` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/condition.dto.ts:190` |
| `clinicalStatus` | `string` | Sí | formato uuid; admite null | — | Estado clínico (concept id) | `src/modules/clinical/dto/condition.dto.ts:200` |
| `verificationStatus` | `string` | Sí | formato uuid; admite null | — | Estado de verificación (concept id) | `src/modules/clinical/dto/condition.dto.ts:210` |
| `clinicalCourse` | `string` | Sí | formato uuid; admite null | — | Curso clínico (concept id) | `src/modules/clinical/dto/condition.dto.ts:220` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/condition.dto.ts:226` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado |
| 409 | `CONFLICT` | ConflictException: El paciente ya tiene esa condición activa |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un diagnóstico se registra presuntivo o confirmado.; PreconditionFailedException: El encuentro ya está cerrado y sellado: no admite más escrituras. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/br14-encuentros-seguridad-clinica.int-spec.ts:151` |
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:612` |
| INTEGRACION | `test/integration/fx17-sello-del-encuentro.int-spec.ts:161` |
| INTEGRACION | `test/integration/hardening/mch-007.int-spec.ts:125` |
| CONTROLADOR | `src/modules/clinical/controllers/clinical-records.controller.spec.ts:57` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /clinical/conditions/{id}/attachments

- **Origen:** CONTRATO
- **Nombre:** Adjuntar un archivo ya subido a una condición
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.attachFileToCondition` — `src/modules/clinical/controllers/clinical-records.controller.ts:158`

### Qué es y para qué sirve (negocio)

Adjuntar un archivo ya subido a una condición. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/conditions/{id}/attachments` la atiende `ClinicalRecordsController.attachFileToCondition` (src/modules/clinical/controllers/clinical-records.controller.ts:158). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `AttachFileToConditionDto` (1 campo, 1 obligatorio). Delega en `ConditionsService.attachFile`. Crea filas en common.file_links. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 12 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:158` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-records.controller.ts:158` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToCondition → ConditionsService.attachFile → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToCondition → ConditionsService.attachFile → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToCondition → ConditionsService.attachFile → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToCondition → ConditionsService.attachFile → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToCondition → ConditionsService.attachFile → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToCondition → ConditionsService.attachFile → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToCondition → ConditionsService.attachFile → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToCondition → ConditionsService.attachFile → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToCondition → ConditionsService.attachFile → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToCondition → ConditionsService.attachFile → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToCondition → ConditionsService.attachFile → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.conditions` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToCondition → ConditionsService.attachFile → ConditionsService.loadConditionForWrite → ConditionsService.loadConditionOrThrow → ConditionsRepository.findById | `src/modules/clinical/repositories/conditions.repository.ts:107` |
| `common.file_links` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.attachFileToCondition → ConditionsService.attachFile → FilesService.createLink → FileLinksRepository.create | `src/modules/common/repositories/file-links.repository.ts:43` |
| `common.file_versions` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToCondition → ConditionsService.attachFile → FilesService.createLink → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:190` |
| `common.files` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToCondition → ConditionsService.attachFile → FilesService.createLink → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:182` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToCondition → ConditionsService.attachFile → FilesService.createLink → StoragePublicationService.guardFile → StorageLifecycleCoordinator.assertNoContender → QueuesRepository.findStorageIntents | `src/modules/messaging/repositories/queues.repository.ts:62` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToCondition → ConditionsService.attachFile → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToCondition → ConditionsService.attachFile → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalRecordsController.attachFileToCondition → ConditionsService.attachFile → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalRecordsController.attachFileToCondition → ConditionsService.attachFile → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalRecordsController.attachFileToCondition → ConditionsService.attachFile → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AttachFileToConditionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical/dto/condition.dto.ts:241` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<FileLinkResponseDto>` · DTO `FileLinkResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/common/dto/files.dto.ts:444` |
| `fileId` | `string` | Sí | formato uuid | — | Identificador asociado a file. | `src/modules/common/dto/files.dto.ts:450` |
| `ownerId` | `string` | Sí | formato uuid | — | Identificador asociado a owner. | `src/modules/common/dto/files.dto.ts:456` |
| `ownerType` | `string` | Sí | valores: USER, PATIENT, TENANT, CONDITION, PROCEDURE, MEDICATION_REQUEST, ALLERGY_INTOLERANCE, ENCOUNTER | — | Valor de owner type mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:462` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/common/dto/files.dto.ts:468` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY}; InsufficientRoleException: No tiene permiso para modificar este archivo |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Condición no encontrada; ResourceNotFoundException: Archivo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING; StorageLifecycleDenied: {identity.reasonCode}; StorageLifecycleDenied: FILE_NOT_LIVE; StorageLifecycleDenied: VERSION_UNKNOWN; StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN; StorageLifecycleDenied: PRODUCER_OR_PURGE_IN_FLIGHT |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. POST /clinical/conditions/{id}/change-status

- **Origen:** CONTRATO
- **Nombre:** Cambiar el estado clínico de una condición
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.changeConditionStatus` — `src/modules/clinical/controllers/clinical-records.controller.ts:109`

### Qué es y para qué sirve (negocio)

Cambiar el estado clínico de una condición. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/conditions/{id}/change-status` la atiende `ClinicalRecordsController.changeConditionStatus` (src/modules/clinical/controllers/clinical-records.controller.ts:109). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `ChangeConditionClinicalStatusDto` (2 campos, 2 obligatorios). Delega en `ConditionsService.changeClinicalStatus`. Crea filas en audit.audit_log, audit.conditions_history. Actualiza audit.conditions_history, clinical.conditions. Lee audit.audit_log, audit.conditions_history, authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions y 12 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:109` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-records.controller.ts:109` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `audit.conditions_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus | `src/modules/clinical/services/conditions.service.ts:370` |
| `audit.conditions_history` | ESCRIBE | CREA | POR_REGISTRO | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus | `src/modules/clinical/services/conditions.service.ts:370` |
| `audit.conditions_history` | LEE | LEE | POR_REGISTRO | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus | `src/modules/clinical/services/conditions.service.ts:370` |
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.conditions` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus | `src/modules/clinical/services/conditions.service.ts:353` |
| `clinical.conditions` | LEE | LEE | DIRECTA | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → ConditionsService.loadConditionForWrite → ConditionsService.loadConditionOrThrow → ConditionsRepository.findById | `src/modules/clinical/repositories/conditions.repository.ts:107` |
| `iam.sessions` | LEE | LEE | POR_SQL | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ChangeConditionClinicalStatusDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `newClinicalStatusConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Estado clínico destino (concept id de `condition-clinical-status`) | `src/modules/clinical/dto/condition.dto.ts:161` |
| `reasonText` | `string` | Sí | longitud mínima 1; longitud máxima 500 | `@IsString()` `@IsNotEmpty()` `@MaxLength(500)` | Motivo del cambio de estado (obligatorio, hasta 500 caracteres) | `src/modules/clinical/dto/condition.dto.ts:175` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "newClinicalStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "newClinicalStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<ConditionResponseDto>` · DTO `ConditionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/condition.dto.ts:184` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/condition.dto.ts:190` |
| `clinicalStatus` | `string` | Sí | formato uuid; admite null | — | Estado clínico (concept id) | `src/modules/clinical/dto/condition.dto.ts:200` |
| `verificationStatus` | `string` | Sí | formato uuid; admite null | — | Estado de verificación (concept id) | `src/modules/clinical/dto/condition.dto.ts:210` |
| `clinicalCourse` | `string` | Sí | formato uuid; admite null | — | Curso clínico (concept id) | `src/modules/clinical/dto/condition.dto.ts:220` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/condition.dto.ts:226` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Condición no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Esa transición de estado clínico no es válida desde el estado actual; PreconditionFailedException: Una condición de curso crónico no pasa a resuelta; márquela inactiva o en remisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/br14-encuentros-seguridad-clinica.int-spec.ts:256` |
| INTEGRACION | `test/integration/hardening/mch-007.int-spec.ts:219` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. POST /clinical/conditions/{id}/verification

- **Origen:** CONTRATO
- **Nombre:** Confirmar o refutar un diagnóstico presuntivo
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.verifyCondition` — `src/modules/clinical/controllers/clinical-records.controller.ts:134`

### Qué es y para qué sirve (negocio)

Confirmar o refutar un diagnóstico presuntivo. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/conditions/{id}/verification` la atiende `ClinicalRecordsController.verifyCondition` (src/modules/clinical/controllers/clinical-records.controller.ts:134). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `VerifyConditionDto` (11 campos, 1 obligatorio). Delega en `ConditionsService.verify`. Crea filas en audit.audit_log, audit.conditions_history. Actualiza audit.conditions_history, clinical.conditions. Lee audit.audit_log, audit.conditions_history, authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions y 15 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:134` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-records.controller.ts:134` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.verifyCondition → ConditionsService.verify → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | ClinicalRecordsController.verifyCondition → ConditionsService.verify → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `audit.conditions_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | ClinicalRecordsController.verifyCondition → ConditionsService.verify | `src/modules/clinical/services/conditions.service.ts:531` |
| `audit.conditions_history` | ESCRIBE | CREA | POR_REGISTRO | ClinicalRecordsController.verifyCondition → ConditionsService.verify | `src/modules/clinical/services/conditions.service.ts:531` |
| `audit.conditions_history` | LEE | LEE | POR_REGISTRO | ClinicalRecordsController.verifyCondition → ConditionsService.verify | `src/modules/clinical/services/conditions.service.ts:531` |
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalRecordsController.verifyCondition → ConditionsService.verify → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalRecordsController.verifyCondition → ConditionsService.verify → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.verifyCondition → ConditionsService.verify → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.verifyCondition → ConditionsService.verify → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalRecordsController.verifyCondition → ConditionsService.verify → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.verifyCondition → ConditionsService.verify → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.verifyCondition → ConditionsService.verify → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.verifyCondition → ConditionsService.verify → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalRecordsController.verifyCondition → ConditionsService.verify → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.verifyCondition → ConditionsService.verify → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalRecordsController.verifyCondition → ConditionsService.verify → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ClinicalRecordsController.verifyCondition → ConditionsService.verify → ConditionsService.resolveEvidenceOfPatient | `src/modules/clinical/services/conditions.service.ts:657` |
| `clinical.conditions` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalRecordsController.verifyCondition → ConditionsService.verify | `src/modules/clinical/services/conditions.service.ts:507` |
| `clinical.conditions` | LEE | LEE | DIRECTA | ClinicalRecordsController.verifyCondition → ConditionsService.verify → ConditionsService.loadConditionForWrite → ConditionsService.loadConditionOrThrow → ConditionsRepository.findById | `src/modules/clinical/repositories/conditions.repository.ts:107` |
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | ClinicalRecordsController.verifyCondition → ConditionsService.verify → ConditionsService.resolveEvidenceOfPatient | `src/modules/clinical/services/conditions.service.ts:673` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | ClinicalRecordsController.verifyCondition → ConditionsService.verify → ConditionsService.resolveEvidenceOfPatient | `src/modules/clinical/services/conditions.service.ts:683` |
| `iam.sessions` | LEE | LEE | POR_SQL | ClinicalRecordsController.verifyCondition → ConditionsService.verify → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalRecordsController.verifyCondition → ConditionsService.verify → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalRecordsController.verifyCondition → ConditionsService.verify → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalRecordsController.verifyCondition → ConditionsService.verify → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalRecordsController.verifyCondition → ConditionsService.verify → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalRecordsController.verifyCondition → ConditionsService.verify → ConditionsService.loadConditionForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `VerifyConditionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `outcome` | `string` | Sí | valores: CONFIRMED, REFUTED | `@IsIn(DIAGNOSIS_OUTCOMES)` | — | `src/modules/clinical/dto/condition.dto.ts:302` |
| `reasonText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/clinical/dto/condition.dto.ts:309` |
| `basedOn` | `DiagnosisEvidenceDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => DiagnosisEvidenceDto)` | — | `src/modules/clinical/dto/condition.dto.ts:316` |
| `basedOn.kind` | `string` | No | valores: NOTE, ANALYSIS | `@IsIn(DIAGNOSIS_EVIDENCE_KINDS)` | — | `src/modules/clinical/dto/condition.dto.ts:263` |
| `basedOn.noteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical/dto/condition.dto.ts:269` |
| `basedOn.encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical/dto/condition.dto.ts:275` |
| `basedOn.serviceRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical/dto/condition.dto.ts:281` |
| `basedOn.diagnosticReportId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical/dto/condition.dto.ts:287` |
| `onsetAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | — | `src/modules/clinical/dto/condition.dto.ts:322` |
| `expectedResolutionAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | — | `src/modules/clinical/dto/condition.dto.ts:328` |
| `clinicalCourseConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical/dto/condition.dto.ts:334` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "outcome": "CONFIRMED"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "outcome": "CONFIRMED",
  "reasonText": "Texto descriptivo de ejemplo",
  "basedOn": {
    "kind": "NOTE",
    "noteId": "00000000-0000-4000-8000-000000000001",
    "encounterId": "00000000-0000-4000-8000-000000000001",
    "serviceRequestId": "00000000-0000-4000-8000-000000000001",
    "diagnosticReportId": "00000000-0000-4000-8000-000000000001"
  },
  "onsetAt": "2026-07-31T12:00:00.000Z",
  "expectedResolutionAt": "2026-07-31T12:00:00.000Z",
  "clinicalCourseConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ConditionItemDto>` · DTO `ConditionItemDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:92` |
| `codeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a code concept. | `src/modules/clinical/dto/clinical-read.dto.ts:98` |
| `categoryConceptId` | `string` | No | formato uuid | — | Identificador asociado a category concept. | `src/modules/clinical/dto/clinical-read.dto.ts:104` |
| `clinicalStatusConceptId` | `string` | No | formato uuid | — | Identificador asociado a clinical status concept. | `src/modules/clinical/dto/clinical-read.dto.ts:110` |
| `verificationStatusConceptId` | `string` | No | formato uuid | — | Identificador asociado a verification status concept. | `src/modules/clinical/dto/clinical-read.dto.ts:116` |
| `severityConceptId` | `string` | No | formato uuid | — | Identificador asociado a severity concept. | `src/modules/clinical/dto/clinical-read.dto.ts:122` |
| `encounterId` | `string` | No | formato uuid | — | Identificador asociado a encounter. | `src/modules/clinical/dto/clinical-read.dto.ts:128` |
| `clinicalCourseConceptId` | `string` | No | formato uuid | — | Identificador asociado a clinical course concept (Patch v4.0.8). | `src/modules/clinical/dto/clinical-read.dto.ts:134` |
| `lateralityConceptId` | `string` | No | formato uuid | — | Lateralidad de la condición (columna existente en el modelo; BR-14/CL-11). | `src/modules/clinical/dto/clinical-read.dto.ts:140` |
| `onsetAt` | `string` | No | formato date-time | — | Valor de onset at mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:146` |
| `expectedResolutionAt` | `string` | No | formato date-time | — | Fecha esperada de resolución o próxima revisión (Patch v4.0.8). | `src/modules/clinical/dto/clinical-read.dto.ts:152` |
| `resolvedAt` | `string` | No | formato date-time | — | Valor de resolved at mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:158` |
| `noteText` | `string` | No | — | — | Hallazgos y justificación clínica (Patch v4.1.3). | `src/modules/clinical/dto/clinical-read.dto.ts:164` |
| `lastStatusChangeReasonText` | `string` | No | — | — | Motivo del último cambio de estado clínico, si hubo alguno | `src/modules/clinical/dto/clinical-read.dto.ts:175` |
| `verification` | `ConditionVerificationDto` | No | — | — | Decisión de verificación (C3 / P41), o `null` si el diagnóstico nunca se confirmó ni refutó por `POST /clinical/conditions/:id/verification`. | `src/modules/clinical/dto/clinical-read.dto.ts:182` |
| `verification.outcome` | `string` | No | valores: CONFIRMED, REFUTED | — | `CONFIRMED` o `REFUTED`. | `src/modules/clinical/dto/clinical-read.dto.ts:67` |
| `verification.decidedAt` | `string` | No | formato date-time | — | Instante de la decisión, ISO. | `src/modules/clinical/dto/clinical-read.dto.ts:71` |
| `verification.decidedByProfileId` | `string` | No | formato uuid | — | Perfil profesional que decidió. | `src/modules/clinical/dto/clinical-read.dto.ts:75` |
| `verification.reasonText` | `string` | No | admite null | — | Motivo escrito, o `null`. | `src/modules/clinical/dto/clinical-read.dto.ts:79` |
| `verification.basedOn` | `ConditionVerificationEvidenceDto` | No | — | — | Evidencia elegida, o `null`. | `src/modules/clinical/dto/clinical-read.dto.ts:83` |
| `verification.basedOn.kind` | `string` | No | valores: NOTE, ANALYSIS | — | `NOTE` o `ANALYSIS`. | `src/modules/clinical/dto/clinical-read.dto.ts:38` |
| `verification.basedOn.noteId` | `string` | No | formato uuid | — | Nota clínica que respalda la decisión. | `src/modules/clinical/dto/clinical-read.dto.ts:42` |
| `verification.basedOn.encounterId` | `string` | No | formato uuid | — | Encuentro de la nota. | `src/modules/clinical/dto/clinical-read.dto.ts:46` |
| `verification.basedOn.serviceRequestId` | `string` | No | formato uuid | — | Orden de estudio. | `src/modules/clinical/dto/clinical-read.dto.ts:50` |
| `verification.basedOn.diagnosticReportId` | `string` | No | formato uuid | — | Informe del estudio. | `src/modules/clinical/dto/clinical-read.dto.ts:54` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/clinical-read.dto.ts:188` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La sesión no tiene un perfil profesional con el que decidir el diagnóstico.; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Condición no encontrada |
| 409 | `CONFLICT` | ConflictException: Ese diagnóstico ya fue decidido: sólo un presuntivo se confirma o se rechaza |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Escriba el motivo o elija una evidencia: al menos uno de los dos.; PreconditionFailedException: Indique desde cuándo la persona presenta la condición.; PreconditionFailedException: El inicio de la condición no puede ser futuro.; PreconditionFailedException: El curso clínico no es uno del catálogo.; PreconditionFailedException: Indique hasta cuándo se espera la condición, o márquela como crónica.; PreconditionFailedException: El fin esperado no puede ser anterior al inicio. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical/controllers/clinical-records.controller.spec.ts:184` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /clinical/diagnostic-reports

- **Origen:** CONTRATO
- **Nombre:** Emitir un reporte diagnóstico desde la orden
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalOrdersController.createDiagnosticReport` — `src/modules/clinical/controllers/clinical-orders.controller.ts:152`

### Qué es y para qué sirve (negocio)

Emitir un reporte diagnóstico desde la orden. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/diagnostic-reports` la atiende `ClinicalOrdersController.createDiagnosticReport` (src/modules/clinical/controllers/clinical-orders.controller.ts:152). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateDiagnosticReportDto` (7 campos, 3 obligatorios). Delega en `DiagnosticReportsService.create`. Crea filas en clinical.diagnostic_reports. Actualiza clinical.service_requests. Lee clinical.service_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-orders.controller.ts:152` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | ESCRIBE | CREA | DIRECTA | ClinicalOrdersController.createDiagnosticReport → DiagnosticReportsService.create → DiagnosticReportsRepository.create | `src/modules/clinical/repositories/diagnostic-reports.repository.ts:77` |
| `clinical.service_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalOrdersController.createDiagnosticReport → DiagnosticReportsService.create | `src/modules/clinical/services/diagnostic-reports.service.ts:76` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | ClinicalOrdersController.createDiagnosticReport → DiagnosticReportsService.create → ServiceRequestsRepository.findById | `src/modules/clinical/repositories/service-requests.repository.ts:107` |

### Cuerpo — DTO `CreateDiagnosticReportDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `custodianTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant custodio (directory.tenants) | `src/modules/clinical/dto/diagnostic-report.dto.ts:14` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente (profiles.patient_profiles) | `src/modules/clinical/dto/diagnostic-report.dto.ts:24` |
| `serviceRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Orden de servicio que origina el reporte | `src/modules/clinical/dto/diagnostic-report.dto.ts:35` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro asociado | `src/modules/clinical/dto/diagnostic-report.dto.ts:43` |
| `codeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Código del estudio (concept id) | `src/modules/clinical/dto/diagnostic-report.dto.ts:53` |
| `categoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Categoría (concept id) | `src/modules/clinical/dto/diagnostic-report.dto.ts:64` |
| `currentVersionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Versión actual del reporte | `src/modules/clinical/dto/diagnostic-report.dto.ts:75` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001",
  "categoryConceptId": "00000000-0000-4000-8000-000000000001",
  "currentVersionId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<DiagnosticReportResponseDto>` · DTO `DiagnosticReportResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/diagnostic-report.dto.ts:98` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/diagnostic-report.dto.ts:104` |
| `lifecycleStatus` | `string` | Sí | formato uuid | — | Estado de ciclo de vida (concept id) | `src/modules/clinical/dto/diagnostic-report.dto.ts:113` |
| `resultReleaseStatus` | `string` | Sí | formato uuid; admite null | — | Estado de liberación de resultados (concept id) | `src/modules/clinical/dto/diagnostic-report.dto.ts:123` |
| `serviceRequestId` | `string` | No | formato uuid; admite null | — | Identificador asociado a service request. | `src/modules/clinical/dto/diagnostic-report.dto.ts:129` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/diagnostic-report.dto.ts:135` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Orden de servicio no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/diagnostics-release.int-spec.ts:72` |
| CONTROLADOR | `src/modules/clinical/controllers/clinical-orders.controller.spec.ts:87` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. POST /clinical/diagnostic-reports/{id}/release

- **Origen:** CONTRATO
- **Nombre:** Liberar los resultados de un reporte diagnóstico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalOrdersController.releaseDiagnosticReport` — `src/modules/clinical/controllers/clinical-orders.controller.ts:175`

### Qué es y para qué sirve (negocio)

Liberar los resultados de un reporte diagnóstico. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/diagnostic-reports/{id}/release` la atiende `ClinicalOrdersController.releaseDiagnosticReport` (src/modules/clinical/controllers/clinical-orders.controller.ts:175). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `ReleaseDiagnosticReportDto` (1 campo, 0 obligatorios). Delega en `DiagnosticReportsService.release`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 9 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-orders.controller.ts:175` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-orders.controller.ts:175` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalOrdersController.releaseDiagnosticReport → DiagnosticReportsService.release → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalOrdersController.releaseDiagnosticReport → DiagnosticReportsService.release → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalOrdersController.releaseDiagnosticReport → DiagnosticReportsService.release → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalOrdersController.releaseDiagnosticReport → DiagnosticReportsService.release → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalOrdersController.releaseDiagnosticReport → DiagnosticReportsService.release → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalOrdersController.releaseDiagnosticReport → DiagnosticReportsService.release → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalOrdersController.releaseDiagnosticReport → DiagnosticReportsService.release → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalOrdersController.releaseDiagnosticReport → DiagnosticReportsService.release → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalOrdersController.releaseDiagnosticReport → DiagnosticReportsService.release → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalOrdersController.releaseDiagnosticReport → DiagnosticReportsService.release → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalOrdersController.releaseDiagnosticReport → DiagnosticReportsService.release → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | ClinicalOrdersController.releaseDiagnosticReport → DiagnosticReportsService.release → DiagnosticReportsRepository.findById | `src/modules/clinical/repositories/diagnostic-reports.repository.ts:63` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalOrdersController.releaseDiagnosticReport → DiagnosticReportsService.release → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalOrdersController.releaseDiagnosticReport → DiagnosticReportsService.release → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalOrdersController.releaseDiagnosticReport → DiagnosticReportsService.release → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalOrdersController.releaseDiagnosticReport → DiagnosticReportsService.release → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalOrdersController.releaseDiagnosticReport → DiagnosticReportsService.release → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ReleaseDiagnosticReportDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expectedRowVersion` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | row_version esperado (bloqueo optimista) | `src/modules/clinical/dto/diagnostic-report.dto.ts:89` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "expectedRowVersion": 1
}
```

</details>

### Respuesta — `Promise<DiagnosticReportResponseDto>` · DTO `DiagnosticReportResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/diagnostic-report.dto.ts:98` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/diagnostic-report.dto.ts:104` |
| `lifecycleStatus` | `string` | Sí | formato uuid | — | Estado de ciclo de vida (concept id) | `src/modules/clinical/dto/diagnostic-report.dto.ts:113` |
| `resultReleaseStatus` | `string` | Sí | formato uuid; admite null | — | Estado de liberación de resultados (concept id) | `src/modules/clinical/dto/diagnostic-report.dto.ts:123` |
| `serviceRequestId` | `string` | No | formato uuid; admite null | — | Identificador asociado a service request. | `src/modules/clinical/dto/diagnostic-report.dto.ts:129` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/diagnostic-report.dto.ts:135` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Reporte diagnóstico no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Esta ruta ya no libera informes. Use POST /diagnostics/reports/:reportId/versions/:versionId/release,que es el único camino que el paciente ve en «Mis resultad… |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/diagnostics-release.int-spec.ts:172` |
| CONTROLADOR | `src/modules/clinical/controllers/clinical-orders.controller.spec.ts:93` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. POST /clinical/encounter-locations/{id}/cancel

- **Origen:** CONTRATO
- **Nombre:** Anular una reserva o un traslado
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalAdtController.cancelLocation` — `src/modules/clinical/controllers/clinical-adt.controller.ts:231`

### Qué es y para qué sirve (negocio)

Anular una reserva o un traslado. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/encounter-locations/{id}/cancel` la atiende `ClinicalAdtController.cancelLocation` (src/modules/clinical/controllers/clinical-adt.controller.ts:231). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CancelLocationDto` (1 campo, 1 obligatorio). Delega en `InpatientAdtService.cancelLocation`. Crea filas en messaging.domain_events, messaging.outbox_messages. Actualiza clinical.encounter_locations. Lee clinical.encounter_locations, clinical.encounters, delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, messaging.outbox_messages, practice.care_spaces, practice.clinical_units y 2 más. Publica un evento calculado (eventType).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical/controllers/clinical-adt.controller.ts:231` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-adt.controller.ts:231` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalAdtController.cancelLocation → InpatientAdtService.cancelLocation → CancelLocationUseCase.execute | `src/modules/clinical/services/inpatient/adt.use-cases.ts:965` |
| `clinical.encounter_locations` | LEE | LEE | DIRECTA | ClinicalAdtController.cancelLocation → InpatientAdtService.cancelLocation → CancelLocationUseCase.execute | `src/modules/clinical/services/inpatient/adt.use-cases.ts:863` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalAdtController.cancelLocation → InpatientAdtService.cancelLocation → CancelLocationUseCase.execute → AdtSupport.encounter | `src/modules/clinical/services/inpatient/adt-support.ts:128` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.cancelLocation → InpatientAdtService.cancelLocation → CancelLocationUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.cancelLocation → InpatientAdtService.cancelLocation → CancelLocationUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.cancelLocation → InpatientAdtService.cancelLocation → CancelLocationUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.cancelLocation → InpatientAdtService.cancelLocation → CancelLocationUseCase.execute → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.cancelLocation → InpatientAdtService.cancelLocation → CancelLocationUseCase.execute → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | ClinicalAdtController.cancelLocation → InpatientAdtService.cancelLocation → CancelLocationUseCase.execute → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | ClinicalAdtController.cancelLocation → InpatientAdtService.cancelLocation → CancelLocationUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | ClinicalAdtController.cancelLocation → InpatientAdtService.cancelLocation → CancelLocationUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalAdtController.cancelLocation → InpatientAdtService.cancelLocation → CancelLocationUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.cancelLocation → InpatientAdtService.cancelLocation → CancelLocationUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpaceOpsRepository.unitsOf | `src/modules/practice/repositories/care-space-ops.repository.ts:146` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `eventType` | `src/modules/clinical/services/inpatient/adt-support.ts:447` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CancelLocationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reasonText` | `string` | Sí | longitud máxima 2000 | `@IsString()` `@MaxLength(2000)` | — | `src/modules/clinical/dto/inpatient.dto.ts:290` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reasonText": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<AdtResultDto>` · DTO `AdtResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `episodeId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:326` |
| `encounterId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:327` |
| `encounterLocationId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:328` |
| `fromLocationId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:329` |
| `toLocationId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:330` |
| `cleaningOrderId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:331` |
| `incidentId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:332` |
| `cell` | `object` | No | — | — | Estado operativo de la cama (CareSpaceOpsPort) | `src/modules/clinical/dto/inpatient.dto.ts:336` |
| `locations` | `array<object>` | No | — | — | — | `src/modules/clinical/dto/inpatient.dto.ts:337` |
| `requestId` | `string` | No | — | — | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `src/modules/clinical/dto/inpatient.dto.ts:345` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Ubicación no encontrada; ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado; ResourceNotFoundException: Encuentro no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-adt-f3-scope.int-spec.ts:161` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalAdtController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. GET /clinical/encounters/{id}/attachments

- **Origen:** CONTRATO
- **Nombre:** Listar los adjuntos de un encuentro
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalEncountersController.listEncounterAttachments` — `src/modules/clinical/controllers/clinical-encounters.controller.ts:151`

### Qué es y para qué sirve (negocio)

Listar los adjuntos de un encuentro. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /clinical/encounters/{id}/attachments` la atiende `ClinicalEncountersController.listEncounterAttachments` (src/modules/clinical/controllers/clinical-encounters.controller.ts:151). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, PATIENT. Delega en `EncountersService.listAttachments`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 14 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, PATIENT | `src/modules/clinical/controllers/clinical-encounters.controller.ts:151` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-encounters.controller.ts:151` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalEncountersController.listEncounterAttachments → EncountersService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalEncountersController.listEncounterAttachments → EncountersService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalEncountersController.listEncounterAttachments → EncountersService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalEncountersController.listEncounterAttachments → EncountersService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalEncountersController.listEncounterAttachments → EncountersService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalEncountersController.listEncounterAttachments → EncountersService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalEncountersController.listEncounterAttachments → EncountersService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalEncountersController.listEncounterAttachments → EncountersService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalEncountersController.listEncounterAttachments → EncountersService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalEncountersController.listEncounterAttachments → EncountersService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalEncountersController.listEncounterAttachments → EncountersService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalEncountersController.listEncounterAttachments → EncountersService.listAttachments → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:174` |
| `common.file_links` | LEE | LEE | DIRECTA | ClinicalEncountersController.listEncounterAttachments → EncountersService.listAttachments → FilesService.listLinkedFilesOf → FileLinksRepository.findByOwner | `src/modules/common/repositories/file-links.repository.ts:78` |
| `common.file_versions` | LEE | LEE | DIRECTA | ClinicalEncountersController.listEncounterAttachments → EncountersService.listAttachments → FilesService.listLinkedFilesOf → FileVersionsRepository.findByIds | `src/modules/common/repositories/file-versions.repository.ts:95` |
| `common.files` | LEE | LEE | DIRECTA | ClinicalEncountersController.listEncounterAttachments → EncountersService.listAttachments → FilesService.listLinkedFilesOf → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalEncountersController.listEncounterAttachments → EncountersService.listAttachments → ClinicalReadService.assertCanReadHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | ClinicalEncountersController.listEncounterAttachments → EncountersService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ClinicalEncountersController.listEncounterAttachments → EncountersService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalEncountersController.listEncounterAttachments → EncountersService.listAttachments → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalEncountersController.listEncounterAttachments → EncountersService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalEncountersController.listEncounterAttachments → EncountersService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalEncountersController.listEncounterAttachments → EncountersService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LinkedFilePageDto>` · DTO `LinkedFilePageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<LinkedFileResponseDto>` | Sí | — | — | — | `src/modules/common/dto/files.dto.ts:547` |
| `items[].linkId` | `string` | Sí | formato uuid | — | Id del vínculo, no del archivo. | `src/modules/common/dto/files.dto.ts:529` |
| `items[].ownerId` | `string` | Sí | formato uuid | — | — | `src/modules/common/dto/files.dto.ts:532` |
| `items[].ownerType` | `string` | Sí | valores: USER, PATIENT, TENANT, CONDITION, PROCEDURE, MEDICATION_REQUEST, ALLERGY_INTOLERANCE, ENCOUNTER | — | — | `src/modules/common/dto/files.dto.ts:535` |
| `items[].linkedAt` | `string` | Sí | formato date-time | — | Cuándo se adjuntó. | `src/modules/common/dto/files.dto.ts:538` |
| `items[].file` | `FileResponseDto` | Sí | — | — | — | `src/modules/common/dto/files.dto.ts:541` |
| `items[].file.id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/common/dto/files.dto.ts:279` |
| `items[].file.currentVersionId` | `string` | No | formato uuid | — | Identificador asociado a current version. | `src/modules/common/dto/files.dto.ts:285` |
| `items[].file.originalName` | `string` | No | — | — | Valor de original name mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:291` |
| `items[].file.mimeType` | `string` | No | — | — | Tipo MIME de la versión vigente. Ausente si no hay versión vigente. | `src/modules/common/dto/files.dto.ts:308` |
| `items[].file.sizeBytes` | `number` | No | — | — | Tamaño en bytes de la versión vigente. Ausente si no hay versión vigente. | `src/modules/common/dto/files.dto.ts:325` |
| `items[].file.category` | `string` | Sí | valores: DOCUMENT, IMAGE | — | Valor de category mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:331` |
| `items[].file.sensitivity` | `string` | Sí | valores: NORMAL, PHI | — | Valor de sensitivity mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:337` |
| `items[].file.lifecycleStatusConceptId` | `string` | Sí | — | — | Estado del ciclo de vida (concept id). | `src/modules/common/dto/files.dto.ts:343` |
| `items[].file.createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/common/dto/files.dto.ts:349` |
| `count` | `number` | Sí | — | — | Cuántos vinieron en esta página. | `src/modules/common/dto/files.dto.ts:550` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY}; ForbiddenException: No tiene acceso a los adjuntos de este recurso |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalEncountersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. POST /clinical/encounters/{id}/attachments

- **Origen:** CONTRATO
- **Nombre:** Adjuntar un archivo ya subido a un encuentro
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalEncountersController.attachFileToEncounter` — `src/modules/clinical/controllers/clinical-encounters.controller.ts:131`

### Qué es y para qué sirve (negocio)

Adjuntar un archivo ya subido a un encuentro. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/encounters/{id}/attachments` la atiende `ClinicalEncountersController.attachFileToEncounter` (src/modules/clinical/controllers/clinical-encounters.controller.ts:131). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `AttachFileToEncounterDto` (1 campo, 1 obligatorio). Delega en `EncountersService.attachFile`. Crea filas en common.file_links. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 12 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-encounters.controller.ts:131` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-encounters.controller.ts:131` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalEncountersController.attachFileToEncounter → EncountersService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalEncountersController.attachFileToEncounter → EncountersService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalEncountersController.attachFileToEncounter → EncountersService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalEncountersController.attachFileToEncounter → EncountersService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalEncountersController.attachFileToEncounter → EncountersService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalEncountersController.attachFileToEncounter → EncountersService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalEncountersController.attachFileToEncounter → EncountersService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalEncountersController.attachFileToEncounter → EncountersService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalEncountersController.attachFileToEncounter → EncountersService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalEncountersController.attachFileToEncounter → EncountersService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalEncountersController.attachFileToEncounter → EncountersService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalEncountersController.attachFileToEncounter → EncountersService.attachFile → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:174` |
| `common.file_links` | ESCRIBE | CREA | DIRECTA | ClinicalEncountersController.attachFileToEncounter → EncountersService.attachFile → FilesService.createLink → FileLinksRepository.create | `src/modules/common/repositories/file-links.repository.ts:43` |
| `common.file_versions` | LEE | LEE | DIRECTA | ClinicalEncountersController.attachFileToEncounter → EncountersService.attachFile → FilesService.createLink → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:190` |
| `common.files` | LEE | LEE | DIRECTA | ClinicalEncountersController.attachFileToEncounter → EncountersService.attachFile → FilesService.createLink → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:182` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | ClinicalEncountersController.attachFileToEncounter → EncountersService.attachFile → FilesService.createLink → StoragePublicationService.guardFile → StorageLifecycleCoordinator.assertNoContender → QueuesRepository.findStorageIntents | `src/modules/messaging/repositories/queues.repository.ts:62` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalEncountersController.attachFileToEncounter → EncountersService.attachFile → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalEncountersController.attachFileToEncounter → EncountersService.attachFile → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalEncountersController.attachFileToEncounter → EncountersService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalEncountersController.attachFileToEncounter → EncountersService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalEncountersController.attachFileToEncounter → EncountersService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AttachFileToEncounterDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical/dto/encounter.dto.ts:197` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<FileLinkResponseDto>` · DTO `FileLinkResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/common/dto/files.dto.ts:444` |
| `fileId` | `string` | Sí | formato uuid | — | Identificador asociado a file. | `src/modules/common/dto/files.dto.ts:450` |
| `ownerId` | `string` | Sí | formato uuid | — | Identificador asociado a owner. | `src/modules/common/dto/files.dto.ts:456` |
| `ownerType` | `string` | Sí | valores: USER, PATIENT, TENANT, CONDITION, PROCEDURE, MEDICATION_REQUEST, ALLERGY_INTOLERANCE, ENCOUNTER | — | Valor de owner type mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:462` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/common/dto/files.dto.ts:468` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY}; InsufficientRoleException: No tiene permiso para modificar este archivo |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado; ResourceNotFoundException: Archivo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING; StorageLifecycleDenied: {identity.reasonCode}; StorageLifecycleDenied: FILE_NOT_LIVE; StorageLifecycleDenied: VERSION_UNKNOWN; StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN; StorageLifecycleDenied: PRODUCER_OR_PURGE_IN_FLIGHT |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalEncountersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. POST /clinical/encounters/{id}/bed-assignment

- **Origen:** CONTRATO
- **Nombre:** Asignar o reservar cama
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalAdtController.assignBed` — `src/modules/clinical/controllers/clinical-adt.controller.ts:134`

### Qué es y para qué sirve (negocio)

Asignar o reservar cama. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/encounters/{id}/bed-assignment` la atiende `ClinicalAdtController.assignBed` (src/modules/clinical/controllers/clinical-adt.controller.ts:134). Exige sesión; el controlador no declara roles. Valida el cuerpo como `BedAssignmentDto` (5 campos, 2 obligatorios). Delega en `InpatientAdtService.assignBed`. Crea filas en clinical.encounter_locations, clinical.placement_incidents, messaging.domain_events, messaging.outbox_messages, practice.care_space_status_events. Actualiza clinical.encounter_locations, practice.care_spaces. Lee clinical.encounter_locations, clinical.encounters, delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, messaging.outbox_messages, practice.care_spaces, practice.clinical_units y 6 más. Publica un evento calculado (eventType). Hay 1 llamada cuyo destino depende de un dato en tiempo de ejecución y no se siguió.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical/controllers/clinical-adt.controller.ts:134` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match (opcional) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-adt.controller.ts:134` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalAdtController.assignBed → InpatientAdtService.assignBed → AssignBedUseCase.execute → AdtSupport.close | `src/modules/clinical/services/inpatient/adt-support.ts:421` |
| `clinical.encounter_locations` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.assignBed → InpatientAdtService.assignBed → AssignBedUseCase.execute → AdtSupport.place | `src/modules/clinical/services/inpatient/adt-support.ts:319` |
| `clinical.encounter_locations` | LEE | LEE | DIRECTA | ClinicalAdtController.assignBed → InpatientAdtService.assignBed → AssignBedUseCase.execute | `src/modules/clinical/services/inpatient/adt.use-cases.ts:381` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalAdtController.assignBed → InpatientAdtService.assignBed → AssignBedUseCase.execute → AdtSupport.encounter | `src/modules/clinical/services/inpatient/adt-support.ts:128` |
| `clinical.placement_incidents` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.assignBed → InpatientAdtService.assignBed → AssignBedUseCase.execute → AdtSupport.place | `src/modules/clinical/services/inpatient/adt-support.ts:347` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.assignBed → InpatientAdtService.assignBed → AssignBedUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.assignBed → InpatientAdtService.assignBed → AssignBedUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.assignBed → InpatientAdtService.assignBed → AssignBedUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.assignBed → InpatientAdtService.assignBed → AssignBedUseCase.execute → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.assignBed → InpatientAdtService.assignBed → AssignBedUseCase.execute → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | ClinicalAdtController.assignBed → InpatientAdtService.assignBed → AssignBedUseCase.execute → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `practice.care_space_status_events` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.assignBed → InpatientAdtService.assignBed → AssignBedUseCase.execute → AdtSupport.place → PracticeCareSpaceOpsAdapter.recordOccupancyChange → CareSpaceOpsCore.changeAxis | `src/modules/practice/services/ops/care-space-ops-core.ts:367` |
| `practice.care_spaces` | ESCRIBE | ACTUALIZA | DIRECTA | ClinicalAdtController.assignBed → InpatientAdtService.assignBed → AssignBedUseCase.execute → AdtSupport.place → PracticeCareSpaceOpsAdapter.recordOccupancyChange → CareSpaceOpsCore.changeAxis → CareSpaceOpsCore.updateOps | `src/modules/practice/services/ops/care-space-ops-core.ts:441` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | ClinicalAdtController.assignBed → InpatientAdtService.assignBed → AssignBedUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | ClinicalAdtController.assignBed → InpatientAdtService.assignBed → AssignBedUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_settings` | LEE | LEE | POR_SQL | ClinicalAdtController.assignBed → InpatientAdtService.assignBed → AssignBedUseCase.execute → AdtSupport.place → PracticeCareSpaceOpsAdapter.getOperationalState → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.settings → CareSpaceOpsRepository.settings | `src/modules/practice/repositories/care-space-ops.repository.ts:431` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalAdtController.assignBed → InpatientAdtService.assignBed → AssignBedUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.assignBed → InpatientAdtService.assignBed → AssignBedUseCase.execute → AdtSupport.place → InpatientRepository.bedContext | `src/modules/clinical/repositories/inpatient.repository.ts:88` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | ClinicalAdtController.assignBed → InpatientAdtService.assignBed → AssignBedUseCase.execute → AdtSupport.place → AdtSupport.compatibility → AdtSupport.compatibilityFor → InpatientRepository.patient | `src/modules/clinical/repositories/inpatient.repository.ts:67` |
| `profiles.person_profiles` | LEE | LEE | POR_SQL | ClinicalAdtController.assignBed → InpatientAdtService.assignBed → AssignBedUseCase.execute → AdtSupport.place → AdtSupport.compatibility → AdtSupport.compatibilityFor → InpatientRepository.patient | `src/modules/clinical/repositories/inpatient.repository.ts:67` |
| `profiles.persons` | LEE | LEE | POR_SQL | ClinicalAdtController.assignBed → InpatientAdtService.assignBed → AssignBedUseCase.execute → AdtSupport.place → AdtSupport.compatibility → AdtSupport.compatibilityFor → InpatientRepository.patient | `src/modules/clinical/repositories/inpatient.repository.ts:67` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `eventType` | `src/modules/clinical/services/inpatient/adt-support.ts:447` |

**No se pudo seguir** (el destino depende de un dato en tiempo de ejecución):

- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `If-Match` | header | No | `string` | rowVersion del encuentro; distinta: 412 |

### Cuerpo — DTO `BedAssignmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `careSpaceId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical/dto/inpatient.dto.ts:69` |
| `mode` | `string` | Sí | valores: ASSIGN, RESERVE | `@IsIn(['ASSIGN', 'RESERVE'])` | — | `src/modules/clinical/dto/inpatient.dto.ts:73` |
| `override` | `PlacementOverrideDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => PlacementOverrideDto)` | — | `src/modules/clinical/dto/inpatient.dto.ts:169` |
| `override.justification` | `string` | No | longitud mínima 20; longitud máxima 2000 | `@IsString()` `@MaxLength(2000)` | — | `src/modules/clinical/dto/inpatient.dto.ts:52` |
| `override.ruleCodes` | `array<string>` | No | longitud máxima 40; máximo 10 elemento(s) | `@IsArray()` `@ArrayMaxSize(10)` `@IsString({ each: true })` `@MaxLength(40, { each: true })` | Reglas forzadas (SEX, AGE, ISOLATION_COHORT, LEVEL_OF_CARE) | `src/modules/clinical/dto/inpatient.dto.ts:62` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "mode": "ASSIGN"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "mode": "ASSIGN",
  "override": {
    "justification": "valor-ejemploxxxxxxx",
    "ruleCodes": [
      "CODIGO_EJEMPLO"
    ]
  }
}
```

</details>

### Respuesta — `Promise<AdtResultDto>` · DTO `AdtResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `episodeId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:326` |
| `encounterId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:327` |
| `encounterLocationId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:328` |
| `fromLocationId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:329` |
| `toLocationId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:330` |
| `cleaningOrderId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:331` |
| `incidentId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:332` |
| `cell` | `object` | No | — | — | Estado operativo de la cama (CareSpaceOpsPort) | `src/modules/clinical/dto/inpatient.dto.ts:336` |
| `locations` | `array<object>` | No | — | — | — | `src/modules/clinical/dto/inpatient.dto.ts:337` |
| `requestId` | `string` | No | — | — | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `src/modules/clinical/dto/inpatient.dto.ts:345` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado; ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Acción de infraestructura no registrada: {action} |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalAdtController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. POST /clinical/encounters/{id}/bed-compatibility

- **Origen:** CONTRATO
- **Nombre:** Compatibilidad de una cama con el encuentro
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalAdtController.compatibility` — `src/modules/clinical/controllers/clinical-adt.controller.ts:71`

### Qué es y para qué sirve (negocio)

Compatibilidad de una cama con el encuentro. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/encounters/{id}/bed-compatibility` la atiende `ClinicalAdtController.compatibility` (src/modules/clinical/controllers/clinical-adt.controller.ts:71). Exige sesión; el controlador no declara roles. Valida el cuerpo como `BedCompatibilityQueryDto` (1 campo, 1 obligatorio). Delega en `InpatientAdtService.compatibility`. Lee clinical.encounter_locations, clinical.encounters, delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.clinical_units, practice.practice_settings y 5 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical/controllers/clinical-adt.controller.ts:71` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-adt.controller.ts:71` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | LEE | LEE | POR_SQL | ClinicalAdtController.compatibility → InpatientAdtService.compatibility → InpatientReadUseCases.compatibility → AdtSupport.compatibility → AdtSupport.compatibilityFor → InpatientRepository.roommates | `src/modules/clinical/repositories/inpatient.repository.ts:115` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalAdtController.compatibility → InpatientAdtService.compatibility → InpatientReadUseCases.compatibility → AdtSupport.encounter | `src/modules/clinical/services/inpatient/adt-support.ts:128` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.compatibility → InpatientAdtService.compatibility → InpatientReadUseCases.compatibility → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.compatibility → InpatientAdtService.compatibility → InpatientReadUseCases.compatibility → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.compatibility → InpatientAdtService.compatibility → InpatientReadUseCases.compatibility → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | ClinicalAdtController.compatibility → InpatientAdtService.compatibility → InpatientReadUseCases.compatibility → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | ClinicalAdtController.compatibility → InpatientAdtService.compatibility → InpatientReadUseCases.compatibility → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_settings` | LEE | LEE | POR_SQL | ClinicalAdtController.compatibility → InpatientAdtService.compatibility → InpatientReadUseCases.compatibility → AdtSupport.compatibility → AdtSupport.compatibilityFor → PracticeCareSpaceOpsAdapter.getOperationalState → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.settings → CareSpaceOpsRepository.settings | `src/modules/practice/repositories/care-space-ops.repository.ts:431` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalAdtController.compatibility → InpatientAdtService.compatibility → InpatientReadUseCases.compatibility → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.compatibility → InpatientAdtService.compatibility → InpatientReadUseCases.compatibility → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpaceOpsRepository.unitsOf | `src/modules/practice/repositories/care-space-ops.repository.ts:146` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | ClinicalAdtController.compatibility → InpatientAdtService.compatibility → InpatientReadUseCases.compatibility → AdtSupport.compatibility → AdtSupport.compatibilityFor → InpatientRepository.patient | `src/modules/clinical/repositories/inpatient.repository.ts:67` |
| `profiles.person_profiles` | LEE | LEE | POR_SQL | ClinicalAdtController.compatibility → InpatientAdtService.compatibility → InpatientReadUseCases.compatibility → AdtSupport.compatibility → AdtSupport.compatibilityFor → InpatientRepository.patient | `src/modules/clinical/repositories/inpatient.repository.ts:67` |
| `profiles.persons` | LEE | LEE | POR_SQL | ClinicalAdtController.compatibility → InpatientAdtService.compatibility → InpatientReadUseCases.compatibility → AdtSupport.compatibility → AdtSupport.compatibilityFor → InpatientRepository.patient | `src/modules/clinical/repositories/inpatient.repository.ts:67` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `BedCompatibilityQueryDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `careSpaceId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical/dto/inpatient.dto.ts:174` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "careSpaceId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "careSpaceId": "00000000-0000-4000-8000-000000000001"
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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado; ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado; ResourceNotFoundException: Cama no encontrada en la sede |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalAdtController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. POST /clinical/encounters/{id}/close

- **Origen:** CONTRATO
- **Nombre:** Cerrar un encuentro en curso (gatilla facturación)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalEncountersController.close` — `src/modules/clinical/controllers/clinical-encounters.controller.ts:107`

### Qué es y para qué sirve (negocio)

Cerrar un encuentro en curso (gatilla facturación). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/encounters/{id}/close` la atiende `ClinicalEncountersController.close` (src/modules/clinical/controllers/clinical-encounters.controller.ts:107). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CloseEncounterDto` (1 campo, 0 obligatorios). Delega en `EncountersService.close`. Crea filas en messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza clinical.encounter_locations, clinical.encounter_participants, clinical.encounters, iam.devices. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 25 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-encounters.controller.ts:107` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-encounters.controller.ts:107` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `chart.care_plan_activities` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → EncounterSealService.computeHash → EncounterSealService.buildPayload → CarePlansRepository.findByEncounter → CarePlansRepository.findActivitiesForPlans | `src/modules/chart/repositories/care-plans.repository.ts:171` |
| `chart.care_plans` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → EncounterSealService.computeHash → EncounterSealService.buildPayload → CarePlansRepository.findByEncounter | `src/modules/chart/repositories/care-plans.repository.ts:131` |
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → EncounterSealService.computeHash → EncounterSealService.buildPayload → ClinicalNotesRepository.findHeadersByEncounter | `src/modules/chart/repositories/clinical-notes.repository.ts:284` |
| `chart.clinical_note_versions` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → EncounterSealService.computeHash → EncounterSealService.buildPayload → ClinicalNotesRepository.findVersionsByIds | `src/modules/chart/repositories/clinical-notes.repository.ts:372` |
| `chart.document_record_files` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → EncounterSealService.computeHash → EncounterSealService.buildPayload → DocumentsRepository.findByEncounter → DocumentsRepository.findFilesForRecords | `src/modules/chart/repositories/documents.repository.ts:174` |
| `chart.document_records` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → EncounterSealService.computeHash → EncounterSealService.buildPayload → DocumentsRepository.findByEncounter | `src/modules/chart/repositories/documents.repository.ts:138` |
| `clinical.conditions` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → EncounterSealService.computeHash → EncounterSealService.buildPayload → ConditionsRepository.findByEncounter | `src/modules/clinical/repositories/conditions.repository.ts:122` |
| `clinical.encounter_locations` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalEncountersController.close → EncountersService.close | `src/modules/clinical/services/encounters.service.ts:461` |
| `clinical.encounter_locations` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → EncountersRepository.findActiveLocations | `src/modules/clinical/repositories/encounters.repository.ts:396` |
| `clinical.encounter_participants` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalEncountersController.close → EncountersService.close | `src/modules/clinical/services/encounters.service.ts:450` |
| `clinical.encounter_participants` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → EncountersRepository.findActiveParticipants | `src/modules/clinical/repositories/encounters.repository.ts:377` |
| `clinical.encounters` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalEncountersController.close → EncountersService.close | `src/modules/clinical/services/encounters.service.ts:440` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:174` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → EncounterSealService.computeHash → EncounterSealService.buildPayload → MedicationRequestsRepository.findByEncounter | `src/modules/clinical/repositories/medication-requests.repository.ts:162` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalEncountersController.close → EncountersService.close → ClinicalNotificationsService.encounterClosed → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalNotificationsService.encounterClosed → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalNotificationsService.encounterClosed → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalNotificationsService.encounterClosed → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalNotificationsService.encounterClosed → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalNotificationsService.encounterClosed → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalNotificationsService.encounterClosed → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalNotificationsService.encounterClosed → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalNotificationsService.encounterClosed → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalNotificationsService.encounterClosed → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalEncountersController.close → EncountersService.close → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalEncountersController.close → EncountersService.close → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalEncountersController.close → EncountersService.close → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CloseEncounterDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expectedRowVersion` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | row_version esperado (bloqueo optimista) | `src/modules/clinical/dto/encounter.dto.ts:210` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "expectedRowVersion": 1
}
```

</details>

### Respuesta — `Promise<EncounterResponseDto>` · DTO `EncounterResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/encounter.dto.ts:219` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/encounter.dto.ts:225` |
| `episodeId` | `string` | No | formato uuid; admite null | — | Identificador asociado a episode. | `src/modules/clinical/dto/encounter.dto.ts:231` |
| `status` | `string` | Sí | formato uuid | — | Estado del encuentro (concept id) | `src/modules/clinical/dto/encounter.dto.ts:240` |
| `participantIds` | `array<string>` | Sí | — | — | Ids de participantes creados | `src/modules/clinical/dto/encounter.dto.ts:246` |
| `locationIds` | `array<string>` | Sí | — | — | Ids de ubicaciones creadas | `src/modules/clinical/dto/encounter.dto.ts:252` |
| `startAt` | `string` | Sí | formato date-time; admite null | — | Valor de start at mantenido por la instancia. | `src/modules/clinical/dto/encounter.dto.ts:258` |
| `endAt` | `string` | Sí | formato date-time; admite null | — | Valor de end at mantenido por la instancia. | `src/modules/clinical/dto/encounter.dto.ts:264` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/encounter.dto.ts:270` |
| `contentHash` | `string` | Sí | admite null | — | Sello SHA-256 del contenido del encuentro, calculado al cerrarlo. `null` mientras el encuentro sigue en curso. | `src/modules/clinical/dto/encounter.dto.ts:277` |
| `sealedAt` | `string` | Sí | formato date-time; admite null | — | Fecha y hora en que se calculó el sello del encuentro. | `src/modules/clinical/dto/encounter.dto.ts:283` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado |
| 409 | `CONCURRENCY_CONFLICT` | ConcurrencyConflictException: Versión del encuentro desactualizada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El encuentro no está en curso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/br14-encuentros-seguridad-clinica.int-spec.ts:132` |
| INTEGRACION | `test/integration/fx12-check-in-idempotente-por-cita.int-spec.ts:226` |
| INTEGRACION | `test/integration/fx17-sello-del-encuentro.int-spec.ts:179` |
| CONTROLADOR | `src/modules/clinical/controllers/clinical-encounters.controller.spec.ts:48` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalEncountersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. POST /clinical/encounters/{id}/discharge

- **Origen:** CONTRATO
- **Nombre:** Dar de alta (egreso)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalAdtController.discharge` — `src/modules/clinical/controllers/clinical-adt.controller.ts:206`

### Qué es y para qué sirve (negocio)

Dar de alta (egreso). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/encounters/{id}/discharge` la atiende `ClinicalAdtController.discharge` (src/modules/clinical/controllers/clinical-adt.controller.ts:206). Exige sesión; el controlador no declara roles. Valida el cuerpo como `DischargeDto` (4 campos, 0 obligatorios). Delega en `InpatientAdtService.discharge`. Crea filas en messaging.domain_events, messaging.outbox_messages. Actualiza clinical.care_episodes, clinical.encounter_locations, clinical.encounter_participants, clinical.encounters. Lee chart.care_plan_activities, chart.care_plans, chart.clinical_note_headers, chart.clinical_note_versions, chart.document_record_files, chart.document_records, clinical.care_episodes, clinical.conditions y 12 más. Publica un evento calculado (eventType).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical/controllers/clinical-adt.controller.ts:206` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match (opcional) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-adt.controller.ts:206` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.care_plan_activities` | LEE | LEE | DIRECTA | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute → EncounterSealService.computeHash → EncounterSealService.buildPayload → CarePlansRepository.findByEncounter → CarePlansRepository.findActivitiesForPlans | `src/modules/chart/repositories/care-plans.repository.ts:171` |
| `chart.care_plans` | LEE | LEE | DIRECTA | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute → EncounterSealService.computeHash → EncounterSealService.buildPayload → CarePlansRepository.findByEncounter | `src/modules/chart/repositories/care-plans.repository.ts:131` |
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute → EncounterSealService.computeHash → EncounterSealService.buildPayload → ClinicalNotesRepository.findHeadersByEncounter | `src/modules/chart/repositories/clinical-notes.repository.ts:284` |
| `chart.clinical_note_versions` | LEE | LEE | DIRECTA | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute → EncounterSealService.computeHash → EncounterSealService.buildPayload → ClinicalNotesRepository.findVersionsByIds | `src/modules/chart/repositories/clinical-notes.repository.ts:372` |
| `chart.document_record_files` | LEE | LEE | DIRECTA | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute → EncounterSealService.computeHash → EncounterSealService.buildPayload → DocumentsRepository.findByEncounter → DocumentsRepository.findFilesForRecords | `src/modules/chart/repositories/documents.repository.ts:174` |
| `chart.document_records` | LEE | LEE | DIRECTA | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute → EncounterSealService.computeHash → EncounterSealService.buildPayload → DocumentsRepository.findByEncounter | `src/modules/chart/repositories/documents.repository.ts:138` |
| `clinical.care_episodes` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute | `src/modules/clinical/services/inpatient/adt.use-cases.ts:791` |
| `clinical.care_episodes` | LEE | LEE | DIRECTA | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute | `src/modules/clinical/services/inpatient/adt.use-cases.ts:789` |
| `clinical.conditions` | LEE | LEE | DIRECTA | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute → EncounterSealService.computeHash → EncounterSealService.buildPayload → ConditionsRepository.findByEncounter | `src/modules/clinical/repositories/conditions.repository.ts:122` |
| `clinical.encounter_locations` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute → AdtSupport.close | `src/modules/clinical/services/inpatient/adt-support.ts:421` |
| `clinical.encounter_locations` | LEE | LEE | DIRECTA | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute | `src/modules/clinical/services/inpatient/adt.use-cases.ts:772` |
| `clinical.encounter_participants` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute | `src/modules/clinical/services/inpatient/adt.use-cases.ts:768` |
| `clinical.encounter_participants` | LEE | LEE | DIRECTA | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute | `src/modules/clinical/services/inpatient/adt.use-cases.ts:764` |
| `clinical.encounters` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute | `src/modules/clinical/services/inpatient/adt.use-cases.ts:779` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute → AdtSupport.encounter | `src/modules/clinical/services/inpatient/adt-support.ts:128` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute → EncounterSealService.computeHash → EncounterSealService.buildPayload → MedicationRequestsRepository.findByEncounter | `src/modules/clinical/repositories/medication-requests.repository.ts:162` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.discharge → InpatientAdtService.discharge → DischargePatientUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpaceOpsRepository.unitsOf | `src/modules/practice/repositories/care-space-ops.repository.ts:146` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `eventType` | `src/modules/clinical/services/inpatient/adt-support.ts:447` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `If-Match` | header | No | `string` | rowVersion del encuentro; distinta: 412 |

### Cuerpo — DTO `DischargeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `dischargeDispositionCode` | `string` | No | valores: DISP_HOME, DISP_TRANSFER, DISP_DEATH, DISP_AGAINST_ADVICE, DISP_OTHER | `@IsOptional()` `@IsIn(DISPOSITIONS)` | — | `src/modules/clinical/dto/inpatient.dto.ts:271` |
| `occurredAt` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | — | `src/modules/clinical/dto/inpatient.dto.ts:276` |
| `reasonText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/clinical/dto/inpatient.dto.ts:281` |
| `closeEpisode` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/clinical/dto/inpatient.dto.ts:285` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "dischargeDispositionCode": "DISP_HOME",
  "occurredAt": "2026-07-31T12:00:00.000Z",
  "reasonText": "Texto descriptivo de ejemplo",
  "closeEpisode": true
}
```

</details>

### Respuesta — `Promise<AdtResultDto>` · DTO `AdtResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `episodeId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:326` |
| `encounterId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:327` |
| `encounterLocationId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:328` |
| `fromLocationId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:329` |
| `toLocationId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:330` |
| `cleaningOrderId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:331` |
| `incidentId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:332` |
| `cell` | `object` | No | — | — | Estado operativo de la cama (CareSpaceOpsPort) | `src/modules/clinical/dto/inpatient.dto.ts:336` |
| `locations` | `array<object>` | No | — | — | — | `src/modules/clinical/dto/inpatient.dto.ts:337` |
| `requestId` | `string` | No | — | — | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `src/modules/clinical/dto/inpatient.dto.ts:345` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado; ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-adt-f3.int-spec.ts:238` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalAdtController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. GET /clinical/encounters/{id}/stay

- **Origen:** CONTRATO
- **Nombre:** Ficha de internación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalAdtController.stay` — `src/modules/clinical/controllers/clinical-adt.controller.ts:296`

### Qué es y para qué sirve (negocio)

Ficha de internación. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /clinical/encounters/{id}/stay` la atiende `ClinicalAdtController.stay` (src/modules/clinical/controllers/clinical-adt.controller.ts:296). Exige sesión; el controlador no declara roles. Delega en `InpatientAdtService.stay`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 20 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical/controllers/clinical-adt.controller.ts:296` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-adt.controller.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.encounter_locations` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay | `src/modules/clinical/services/inpatient/inpatient-read.use-cases.ts:275` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → AdtSupport.encounter | `src/modules/clinical/services/inpatient/adt-support.ts:128` |
| `clinical.placement_incidents` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay | `src/modules/clinical/services/inpatient/inpatient-read.use-cases.ts:281` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpaceOpsRepository.unitsOf | `src/modules/practice/repositories/care-space-ops.repository.ts:146` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → ClinicalReadService.assertCanReadHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalAdtController.stay → InpatientAdtService.stay → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

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
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-adt-f3-scope.int-spec.ts:201` |
| INTEGRACION | `test/integration/infrastructure-adt-f3.int-spec.ts:275` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalAdtController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. POST /clinical/encounters/{id}/transfer

- **Origen:** CONTRATO
- **Nombre:** Trasladar de cama
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalAdtController.transfer` — `src/modules/clinical/controllers/clinical-adt.controller.ts:159`

### Qué es y para qué sirve (negocio)

Trasladar de cama. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/encounters/{id}/transfer` la atiende `ClinicalAdtController.transfer` (src/modules/clinical/controllers/clinical-adt.controller.ts:159). Exige sesión; el controlador no declara roles. Valida el cuerpo como `TransferDto` (6 campos, 1 obligatorio). Delega en `InpatientAdtService.transfer`. Crea filas en clinical.encounter_locations, clinical.placement_incidents, messaging.domain_events, messaging.outbox_messages, practice.care_space_status_events. Actualiza clinical.encounter_locations, practice.care_spaces. Lee clinical.encounter_locations, clinical.encounters, delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, messaging.outbox_messages, practice.care_spaces, practice.clinical_units y 6 más. Publica un evento calculado (eventType). Hay 1 llamada cuyo destino depende de un dato en tiempo de ejecución y no se siguió.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical/controllers/clinical-adt.controller.ts:159` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | If-Match (opcional) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-adt.controller.ts:159` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalAdtController.transfer → InpatientAdtService.transfer → TransferPatientUseCase.execute → AdtSupport.close | `src/modules/clinical/services/inpatient/adt-support.ts:421` |
| `clinical.encounter_locations` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.transfer → InpatientAdtService.transfer → TransferPatientUseCase.execute → AdtSupport.place | `src/modules/clinical/services/inpatient/adt-support.ts:319` |
| `clinical.encounter_locations` | LEE | LEE | DIRECTA | ClinicalAdtController.transfer → InpatientAdtService.transfer → TransferPatientUseCase.execute → AdtSupport.activeBed | `src/modules/clinical/services/inpatient/adt-support.ts:147` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalAdtController.transfer → InpatientAdtService.transfer → TransferPatientUseCase.execute → AdtSupport.encounter | `src/modules/clinical/services/inpatient/adt-support.ts:128` |
| `clinical.placement_incidents` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.transfer → InpatientAdtService.transfer → TransferPatientUseCase.execute → AdtSupport.place | `src/modules/clinical/services/inpatient/adt-support.ts:347` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.transfer → InpatientAdtService.transfer → TransferPatientUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.transfer → InpatientAdtService.transfer → TransferPatientUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.transfer → InpatientAdtService.transfer → TransferPatientUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.transfer → InpatientAdtService.transfer → TransferPatientUseCase.execute → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.transfer → InpatientAdtService.transfer → TransferPatientUseCase.execute → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | ClinicalAdtController.transfer → InpatientAdtService.transfer → TransferPatientUseCase.execute → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `practice.care_space_status_events` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.transfer → InpatientAdtService.transfer → TransferPatientUseCase.execute → AdtSupport.place → PracticeCareSpaceOpsAdapter.recordOccupancyChange → CareSpaceOpsCore.changeAxis | `src/modules/practice/services/ops/care-space-ops-core.ts:367` |
| `practice.care_spaces` | ESCRIBE | ACTUALIZA | DIRECTA | ClinicalAdtController.transfer → InpatientAdtService.transfer → TransferPatientUseCase.execute → AdtSupport.place → PracticeCareSpaceOpsAdapter.recordOccupancyChange → CareSpaceOpsCore.changeAxis → CareSpaceOpsCore.updateOps | `src/modules/practice/services/ops/care-space-ops-core.ts:441` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | ClinicalAdtController.transfer → InpatientAdtService.transfer → TransferPatientUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | ClinicalAdtController.transfer → InpatientAdtService.transfer → TransferPatientUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_settings` | LEE | LEE | POR_SQL | ClinicalAdtController.transfer → InpatientAdtService.transfer → TransferPatientUseCase.execute → AdtSupport.place → PracticeCareSpaceOpsAdapter.getOperationalState → CareSpaceOpsCore.snapshot → CareSpaceOpsCore.settings → CareSpaceOpsRepository.settings | `src/modules/practice/repositories/care-space-ops.repository.ts:431` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalAdtController.transfer → InpatientAdtService.transfer → TransferPatientUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.transfer → InpatientAdtService.transfer → TransferPatientUseCase.execute → AdtSupport.place → InpatientRepository.bedContext | `src/modules/clinical/repositories/inpatient.repository.ts:88` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | ClinicalAdtController.transfer → InpatientAdtService.transfer → TransferPatientUseCase.execute → AdtSupport.place → AdtSupport.compatibility → AdtSupport.compatibilityFor → InpatientRepository.patient | `src/modules/clinical/repositories/inpatient.repository.ts:67` |
| `profiles.person_profiles` | LEE | LEE | POR_SQL | ClinicalAdtController.transfer → InpatientAdtService.transfer → TransferPatientUseCase.execute → AdtSupport.place → AdtSupport.compatibility → AdtSupport.compatibilityFor → InpatientRepository.patient | `src/modules/clinical/repositories/inpatient.repository.ts:67` |
| `profiles.persons` | LEE | LEE | POR_SQL | ClinicalAdtController.transfer → InpatientAdtService.transfer → TransferPatientUseCase.execute → AdtSupport.place → AdtSupport.compatibility → AdtSupport.compatibilityFor → InpatientRepository.patient | `src/modules/clinical/repositories/inpatient.repository.ts:67` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `eventType` | `src/modules/clinical/services/inpatient/adt-support.ts:447` |

**No se pudo seguir** (el destino depende de un dato en tiempo de ejecución):

- `this.history.append (entidad según argumento no literal)` — `src/modules/practice/services/ops/care-space-ops-core.ts:635`

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `If-Match` | header | No | `string` | rowVersion del encuentro; distinta: 412 |

### Cuerpo — DTO `TransferDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `toCareSpaceId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical/dto/inpatient.dto.ts:231` |
| `occurredAt` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | — | `src/modules/clinical/dto/inpatient.dto.ts:236` |
| `reasonCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/clinical/dto/inpatient.dto.ts:241` |
| `override` | `PlacementOverrideDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => PlacementOverrideDto)` | — | `src/modules/clinical/dto/inpatient.dto.ts:246` |
| `override.justification` | `string` | No | longitud mínima 20; longitud máxima 2000 | `@IsString()` `@MaxLength(2000)` | — | `src/modules/clinical/dto/inpatient.dto.ts:52` |
| `override.ruleCodes` | `array<string>` | No | longitud máxima 40; máximo 10 elemento(s) | `@IsArray()` `@ArrayMaxSize(10)` `@IsString({ each: true })` `@MaxLength(40, { each: true })` | Reglas forzadas (SEX, AGE, ISOLATION_COHORT, LEVEL_OF_CARE) | `src/modules/clinical/dto/inpatient.dto.ts:62` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "toCareSpaceId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "toCareSpaceId": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-07-31T12:00:00.000Z",
  "reasonCode": "CODIGO_EJEMPLO",
  "override": {
    "justification": "valor-ejemploxxxxxxx",
    "ruleCodes": [
      "CODIGO_EJEMPLO"
    ]
  }
}
```

</details>

### Respuesta — `Promise<AdtResultDto>` · DTO `AdtResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `episodeId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:326` |
| `encounterId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:327` |
| `encounterLocationId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:328` |
| `fromLocationId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:329` |
| `toLocationId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:330` |
| `cleaningOrderId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:331` |
| `incidentId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/inpatient.dto.ts:332` |
| `cell` | `object` | No | — | — | Estado operativo de la cama (CareSpaceOpsPort) | `src/modules/clinical/dto/inpatient.dto.ts:336` |
| `locations` | `array<object>` | No | — | — | — | `src/modules/clinical/dto/inpatient.dto.ts:337` |
| `requestId` | `string` | No | — | — | Id de la petición (también en la cabecera X-Request-Id); sólo en respuestas de mutación | `src/modules/clinical/dto/inpatient.dto.ts:345` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado; ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Acción de infraestructura no registrada: {action} |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-adt-f3-scope.int-spec.ts:156` |
| INTEGRACION | `test/integration/infrastructure-adt-f3.int-spec.ts:165` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalAdtController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. POST /clinical/encounters/check-in

- **Origen:** CONTRATO
- **Nombre:** Check-in de un encuentro con participantes y ubicación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalEncountersController.checkIn` — `src/modules/clinical/controllers/clinical-encounters.controller.ts:89`

### Qué es y para qué sirve (negocio)

Check-in de un encuentro con participantes y ubicación. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/encounters/check-in` la atiende `ClinicalEncountersController.checkIn` (src/modules/clinical/controllers/clinical-encounters.controller.ts:89). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CheckInEncounterDto` (17 campos, 2 obligatorios). Delega en `EncountersService.checkIn`. Crea filas en audit.audit_log, authz.care_relationships, clinical.encounter_locations, clinical.encounter_participants, clinical.encounters, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza billing.invoices, iam.devices. Lee audit.audit_log, authz.care_relationships, clinical.appointments, clinical.care_episodes, clinical.encounter_locations, clinical.encounter_participants, clinical.encounters, clinical.patient_admission_footprints y 13 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-encounters.controller.ts:89` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → AuthzCareRelationshipsService.recordEncounterCareRelationships → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → AuthzCareRelationshipsService.recordEncounterCareRelationships → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `authz.care_relationships` | ESCRIBE | CREA | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → AuthzCareRelationshipsService.recordEncounterCareRelationships → CareRelationshipsRepository.create | `src/modules/authz/repositories/care-relationships.repository.ts:233` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → AuthzCareRelationshipsService.recordEncounterCareRelationships → CareRelationshipsRepository.findActiveInTenant | `src/modules/authz/repositories/care-relationships.repository.ts:86` |
| `billing.invoices` | ESCRIBE | ACTUALIZA | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → SchedulingBookingsRepository.linkPaymentInvoiceToEncounter | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:496` |
| `clinical.appointments` | LEE | LEE | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → EncountersService.resolverAppointmentEncounter → EncountersRepository.findAppointmentForUpdate | `src/modules/clinical/repositories/encounters.repository.ts:271` |
| `clinical.care_episodes` | LEE | LEE | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → CareEpisodesRepository.findById | `src/modules/clinical/repositories/care-episodes.repository.ts:50` |
| `clinical.encounter_locations` | ESCRIBE | CREA | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → EncountersRepository.createLocation | `src/modules/clinical/repositories/encounters.repository.ts:242` |
| `clinical.encounter_locations` | LEE | LEE | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → EncountersService.resolverAppointmentEncounter → EncountersRepository.findActiveLocations | `src/modules/clinical/repositories/encounters.repository.ts:396` |
| `clinical.encounter_participants` | ESCRIBE | CREA | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → EncountersRepository.createParticipant | `src/modules/clinical/repositories/encounters.repository.ts:216` |
| `clinical.encounter_participants` | LEE | LEE | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → EncountersService.resolverAppointmentEncounter → EncountersRepository.findActiveParticipants | `src/modules/clinical/repositories/encounters.repository.ts:377` |
| `clinical.encounters` | ESCRIBE | CREA | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → EncountersRepository.create | `src/modules/clinical/repositories/encounters.repository.ts:185` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → EncountersService.resolverAppointmentEncounter → EncountersRepository.findByAppointmentId | `src/modules/clinical/repositories/encounters.repository.ts:289` |
| `clinical.patient_admission_footprints (vista u objeto no catalogado)` | LEE | LEE | POR_SQL | ClinicalEncountersController.checkIn → EncountersService.checkIn → AuthzCareRelationshipsService.recordEncounterCareRelationships → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant → AuthzClinicalScopeRepository.hasAdmissionFootprint | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:124` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → AuthzCareRelationshipsService.recordEncounterCareRelationships → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:106` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalEncountersController.checkIn → EncountersService.checkIn → AuthzCareRelationshipsService.notifyEncounterCareRelationshipRequests → AuthzCareRelationshipsService.notifyRequest → NotificationsService.emitInApp → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → AuthzCareRelationshipsService.notifyEncounterCareRelationshipRequests → AuthzCareRelationshipsService.notifyRequest → NotificationsService.emitInApp → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `iam.sessions` | LEE | LEE | POR_SQL | ClinicalEncountersController.checkIn → EncountersService.checkIn → AuthzCareRelationshipsService.recordEncounterCareRelationships → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → AuthzCareRelationshipsService.notifyEncounterCareRelationshipRequests → AuthzCareRelationshipsService.notifyRequest → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → AuthzCareRelationshipsService.notifyEncounterCareRelationshipRequests → AuthzCareRelationshipsService.notifyRequest → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → AuthzCareRelationshipsService.notifyEncounterCareRelationshipRequests → AuthzCareRelationshipsService.notifyRequest → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → AuthzCareRelationshipsService.notifyEncounterCareRelationshipRequests → AuthzCareRelationshipsService.notifyRequest → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → AuthzCareRelationshipsService.notifyEncounterCareRelationshipRequests → AuthzCareRelationshipsService.notifyRequest → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → AuthzCareRelationshipsService.notifyEncounterCareRelationshipRequests → AuthzCareRelationshipsService.notifyRequest → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → AuthzCareRelationshipsService.notifyEncounterCareRelationshipRequests → AuthzCareRelationshipsService.notifyRequest → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → AuthzCareRelationshipsService.notifyEncounterCareRelationshipRequests → AuthzCareRelationshipsService.notifyRequest → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.care_spaces` | LEE | LEE | POR_SQL | ClinicalEncountersController.checkIn → EncountersService.checkIn | `src/modules/clinical/services/encounters.service.ts:185` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → AuthzCareRelationshipsService.recordEncounterCareRelationships → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientExists | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:40` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → AuthzCareRelationshipsService.recordEncounterCareRelationships → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:92` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → SchedulingBookingsRepository.linkPaymentInvoiceToEncounter | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:484` |
| `scheduling.appointment_payment_states` | LEE | LEE | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → SchedulingBookingsRepository.linkPaymentInvoiceToEncounter → SchedulingBookingsRepository.findPaymentState | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:456` |

### Cuerpo — DTO `CheckInEncounterDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente (profiles.patient_profiles) | `src/modules/clinical/dto/encounter.dto.ts:88` |
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant custodio (directory.tenants) | `src/modules/clinical/dto/encounter.dto.ts:98` |
| `episodeId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Episodio de cuidado asociado | `src/modules/clinical/dto/encounter.dto.ts:109` |
| `branchId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sucursal (directory.branches) | `src/modules/clinical/dto/encounter.dto.ts:120` |
| `primaryPractitionerId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional principal | `src/modules/clinical/dto/encounter.dto.ts:128` |
| `appointmentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cita que origina el check-in | `src/modules/clinical/dto/encounter.dto.ts:139` |
| `classConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Clase del encuentro (concept id) | `src/modules/clinical/dto/encounter.dto.ts:150` |
| `typeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo del encuentro (concept id) | `src/modules/clinical/dto/encounter.dto.ts:161` |
| `reasonText` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Motivo de consulta | `src/modules/clinical/dto/encounter.dto.ts:170` |
| `participants` | `array<EncounterParticipantInput>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => EncounterParticipantInput)` | — | `src/modules/clinical/dto/encounter.dto.ts:180` |
| `participants[].practitionerProfileId` | `string` | No | formato uuid | `@IsUUID()` | Profesional participante | `src/modules/clinical/dto/encounter.dto.ts:22` |
| `participants[].roleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Rol del participante (concept id) | `src/modules/clinical/dto/encounter.dto.ts:33` |
| `participants[].isResponsible` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Marca al participante como responsable | `src/modules/clinical/dto/encounter.dto.ts:43` |
| `location` | `EncounterLocationInput` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => EncounterLocationInput)` | — | `src/modules/clinical/dto/encounter.dto.ts:189` |
| `location.practiceSiteId` | `string` | No | formato uuid | `@IsUUID()` | Sede de práctica (practice.practice_sites) | `src/modules/clinical/dto/encounter.dto.ts:56` |
| `location.clinicalUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad clínica | `src/modules/clinical/dto/encounter.dto.ts:64` |
| `location.careSpaceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Espacio de atención (cama/consultorio) | `src/modules/clinical/dto/encounter.dto.ts:75` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "episodeId": "00000000-0000-4000-8000-000000000001",
  "branchId": "00000000-0000-4000-8000-000000000001",
  "primaryPractitionerId": "00000000-0000-4000-8000-000000000001",
  "appointmentId": "00000000-0000-4000-8000-000000000001",
  "classConceptId": "00000000-0000-4000-8000-000000000001",
  "typeConceptId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo",
  "participants": [
    {
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "roleConceptId": "00000000-0000-4000-8000-000000000001",
      "isResponsible": true
    }
  ],
  "location": {
    "practiceSiteId": "00000000-0000-4000-8000-000000000001",
    "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
    "careSpaceId": "00000000-0000-4000-8000-000000000001"
  }
}
```

</details>

### Respuesta — `Promise<EncounterResponseDto>` · DTO `EncounterResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/encounter.dto.ts:219` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/encounter.dto.ts:225` |
| `episodeId` | `string` | No | formato uuid; admite null | — | Identificador asociado a episode. | `src/modules/clinical/dto/encounter.dto.ts:231` |
| `status` | `string` | Sí | formato uuid | — | Estado del encuentro (concept id) | `src/modules/clinical/dto/encounter.dto.ts:240` |
| `participantIds` | `array<string>` | Sí | — | — | Ids de participantes creados | `src/modules/clinical/dto/encounter.dto.ts:246` |
| `locationIds` | `array<string>` | Sí | — | — | Ids de ubicaciones creadas | `src/modules/clinical/dto/encounter.dto.ts:252` |
| `startAt` | `string` | Sí | formato date-time; admite null | — | Valor de start at mantenido por la instancia. | `src/modules/clinical/dto/encounter.dto.ts:258` |
| `endAt` | `string` | Sí | formato date-time; admite null | — | Valor de end at mantenido por la instancia. | `src/modules/clinical/dto/encounter.dto.ts:264` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/encounter.dto.ts:270` |
| `contentHash` | `string` | Sí | admite null | — | Sello SHA-256 del contenido del encuentro, calculado al cerrarlo. `null` mientras el encuentro sigue en curso. | `src/modules/clinical/dto/encounter.dto.ts:277` |
| `sealedAt` | `string` | Sí | formato date-time; admite null | — | Fecha y hora en que se calculó el sello del encuentro. | `src/modules/clinical/dto/encounter.dto.ts:283` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Episodio de cuidado no encontrado |
| 409 | `CONFLICT` | ConflictException: La cita ya cuenta con un encuentro clínico finalizado. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Las camas se ocupan por internación (ADT), no por check-in |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/br14-encuentros-seguridad-clinica.int-spec.ts:125` |
| INTEGRACION | `test/integration/clinical-c14-c23-notas-e-internacion.int-spec.ts:183` |
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:601` |
| INTEGRACION | `test/integration/fx12-check-in-idempotente-por-cita.int-spec.ts:187` |
| INTEGRACION | `test/integration/fx13-encuentro-en-la-reserva.int-spec.ts:211` |
| INTEGRACION | `test/integration/p40-orden-basada-en-notas.int-spec.ts:133` |
| INTEGRACION | `test/integration/virtual-encounter-auth.int-spec.ts:92` |
| CONTROLADOR | `src/modules/clinical/controllers/clinical-encounters.controller.spec.ts:42` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalEncountersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. POST /clinical/immunizations

- **Origen:** CONTRATO
- **Nombre:** Registrar una inmunización
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.createImmunization` — `src/modules/clinical/controllers/clinical-records.controller.ts:443`

### Qué es y para qué sirve (negocio)

Registrar una inmunización. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/immunizations` la atiende `ClinicalRecordsController.createImmunization` (src/modules/clinical/controllers/clinical-records.controller.ts:443). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateImmunizationDto` (8 campos, 3 obligatorios). Delega en `ImmunizationsService.create`. Crea filas en clinical.immunizations, clinical.received_services. Lee clinical.immunizations, clinical.received_services.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:443` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.immunizations` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.createImmunization → ImmunizationsService.create → ImmunizationsRepository.create | `src/modules/clinical/repositories/immunizations.repository.ts:90` |
| `clinical.immunizations` | LEE | LEE | DIRECTA | ClinicalRecordsController.createImmunization → ImmunizationsService.create → ImmunizationsRepository.findByPatientVaccineDose | `src/modules/clinical/repositories/immunizations.repository.ts:74` |
| `clinical.received_services` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.createImmunization → ImmunizationsService.create → ReceivedServicesProjector.projectImmunization → ReceivedServicesRepository.upsert | `src/modules/clinical/repositories/received-services.repository.ts:146` |
| `clinical.received_services` | LEE | LEE | DIRECTA | ClinicalRecordsController.createImmunization → ImmunizationsService.create → ReceivedServicesProjector.projectImmunization → ReceivedServicesRepository.upsert → ReceivedServicesRepository.findBySourceProcedure | `src/modules/clinical/repositories/received-services.repository.ts:54` |

### Cuerpo — DTO `CreateImmunizationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `custodianTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant custodio (directory.tenants) | `src/modules/clinical/dto/immunization.dto.ts:21` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente (profiles.patient_profiles) | `src/modules/clinical/dto/immunization.dto.ts:31` |
| `vaccineConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Vacuna (concept id) | `src/modules/clinical/dto/immunization.dto.ts:38` |
| `doseNumber` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Número de dosis | `src/modules/clinical/dto/immunization.dto.ts:47` |
| `lotNumber` | `string` | No | — | `@IsOptional()` `@IsString()` | Número de lote | `src/modules/clinical/dto/immunization.dto.ts:55` |
| `routeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Vía de administración (concept id) | `src/modules/clinical/dto/immunization.dto.ts:66` |
| `administeredAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Momento de administración | `src/modules/clinical/dto/immunization.dto.ts:77` |
| `administeredByProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional que administra | `src/modules/clinical/dto/immunization.dto.ts:88` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "vaccineConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "vaccineConceptId": "00000000-0000-4000-8000-000000000001",
  "doseNumber": 1,
  "lotNumber": "valor-ejemplo",
  "routeConceptId": "00000000-0000-4000-8000-000000000001",
  "administeredAt": "2026-07-31T12:00:00.000Z",
  "administeredByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ImmunizationResponseDto>` · DTO `ImmunizationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/immunization.dto.ts:97` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/immunization.dto.ts:103` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/immunization.dto.ts:109` |
| `doseNumber` | `number` | No | admite null | — | Valor de dose number mantenido por la instancia. | `src/modules/clinical/dto/immunization.dto.ts:115` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/immunization.dto.ts:121` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Esa dosis de la vacuna ya fue registrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical/controllers/clinical-records.controller.spec.ts:174` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. POST /clinical/internal/prescription-expiry-notices

- **Origen:** CONTRATO
- **Nombre:** Avisar al paciente de las recetas por vencer (barrido)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalPrescriptionExpiryController.sweep` — `src/modules/clinical/controllers/clinical-prescription-expiry.controller.ts:38`

### Qué es y para qué sirve (negocio)

Avisar al paciente de las recetas por vencer (barrido). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/internal/prescription-expiry-notices` la atiende `ClinicalPrescriptionExpiryController.sweep` (src/modules/clinical/controllers/clinical-prescription-expiry.controller.ts:38). Exige sesión con alguno de los roles SYSTEM, SYSTEM_WORKER. Valida el cuerpo como `PrescriptionExpirySweepDto` (1 campo, 0 obligatorios). Delega en `PrescriptionExpiryNoticesService.sweep`. Crea filas en messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza iam.devices. Lee clinical.medication_requests, iam.devices, messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers, messaging.notification_requests, messaging.provider_channel_configs, messaging.recipient_preferences y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SYSTEM_WORKER | `src/modules/clinical/controllers/clinical-prescription-expiry.controller.ts:38` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | POR_SQL | ClinicalPrescriptionExpiryController.sweep → PrescriptionExpiryNoticesService.sweep → PrescriptionExpiryRepository.findToNotify | `src/modules/clinical/repositories/prescription-expiry.repository.ts:49` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalPrescriptionExpiryController.sweep → PrescriptionExpiryNoticesService.sweep → NotificationsService.emitInApp → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | ClinicalPrescriptionExpiryController.sweep → PrescriptionExpiryNoticesService.sweep → NotificationsService.emitInApp → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | ClinicalPrescriptionExpiryController.sweep → PrescriptionExpiryNoticesService.sweep → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | ClinicalPrescriptionExpiryController.sweep → PrescriptionExpiryNoticesService.sweep → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | ClinicalPrescriptionExpiryController.sweep → PrescriptionExpiryNoticesService.sweep → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | ClinicalPrescriptionExpiryController.sweep → PrescriptionExpiryNoticesService.sweep → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | ClinicalPrescriptionExpiryController.sweep → PrescriptionExpiryNoticesService.sweep → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | ClinicalPrescriptionExpiryController.sweep → PrescriptionExpiryNoticesService.sweep → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | POR_SQL | ClinicalPrescriptionExpiryController.sweep → PrescriptionExpiryNoticesService.sweep → PrescriptionExpiryRepository.findToNotify | `src/modules/clinical/repositories/prescription-expiry.repository.ts:49` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | ClinicalPrescriptionExpiryController.sweep → PrescriptionExpiryNoticesService.sweep → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | ClinicalPrescriptionExpiryController.sweep → PrescriptionExpiryNoticesService.sweep → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | ClinicalPrescriptionExpiryController.sweep → PrescriptionExpiryNoticesService.sweep → PrescriptionExpiryRepository.findToNotify | `src/modules/clinical/repositories/prescription-expiry.repository.ts:49` |

### Cuerpo — DTO `PrescriptionExpirySweepDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `limit` | `number` | No | mínimo 1; máximo 500 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(PRESCRIPTION_EXPIRY_MAX_BATCH)` | Tamaño máximo del lote | `src/modules/clinical/dto/prescription-expiry-notice.dto.ts:20` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "limit": 200
}
```

</details>

### Respuesta — `Promise<PrescriptionExpirySweepResultDto>` · DTO `PrescriptionExpirySweepResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `scanned` | `number` | Sí | — | — | Recetas por vencer sin aviso previo que se consideraron | `src/modules/clinical/dto/prescription-expiry-notice.dto.ts:28` |
| `notified` | `number` | Sí | — | — | Avisos entregados a la bandeja del paciente | `src/modules/clinical/dto/prescription-expiry-notice.dto.ts:31` |
| `suppressed` | `number` | Sí | — | — | Avisos que la preferencia del paciente detuvo; quedan registrados y no se reintentan | `src/modules/clinical/dto/prescription-expiry-notice.dto.ts:37` |
| `failed` | `number` | Sí | — | — | Avisos que no se pudieron emitir; el siguiente barrido los reintenta | `src/modules/clinical/dto/prescription-expiry-notice.dto.ts:43` |
| `skipped` | `boolean` | Sí | — | — | `true` si otro barrido estaba en curso y éste no hizo nada | `src/modules/clinical/dto/prescription-expiry-notice.dto.ts:48` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El proveedor configurado para el canal in-app no existe |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No hay canal in-app activo: falta correr el seed de mensajería; PreconditionFailedException: El canal in-app no tiene configuración de proveedor activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical/controllers/clinical-prescription-expiry.controller.spec.ts:21` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalPrescriptionExpiryController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 27. GET /clinical/me/medical-aspects

- **Origen:** CONTRATO
- **Nombre:** Ver mis aspectos médicos declarados
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalMedicalAspectsController.getOwn` — `src/modules/clinical/controllers/clinical-medical-aspects.controller.ts:40`

### Qué es y para qué sirve (negocio)

Ver mis aspectos médicos declarados. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /clinical/me/medical-aspects` la atiende `ClinicalMedicalAspectsController.getOwn` (src/modules/clinical/controllers/clinical-medical-aspects.controller.ts:40). Exige sesión; el controlador no declara roles. Delega en `MedicalAspectsService.getOwn`. Lee clinical.patient_reported_health_statements, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical/controllers/clinical-medical-aspects.controller.ts:40` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.patient_reported_health_statements` | LEE | LEE | DIRECTA | ClinicalMedicalAspectsController.getOwn → MedicalAspectsService.getOwn → PatientReportedHealthStatementsRepository.findByPatient | `src/modules/clinical/repositories/patient-reported-health-statements.repository.ts:35` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ClinicalMedicalAspectsController.getOwn → MedicalAspectsService.getOwn → MedicalAspectsService.resolveOwnPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalMedicalAspectsController.getOwn → MedicalAspectsService.getOwn → MedicalAspectsService.resolveOwnPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MedicalAspectsResponseDto>` · DTO `MedicalAspectsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bloodType` | `string` | No | — | — | — | `src/modules/clinical/dto/medical-aspects.dto.ts:73` |
| `allergiesText` | `string` | No | — | — | — | `src/modules/clinical/dto/medical-aspects.dto.ts:76` |
| `chronicConditionsText` | `string` | No | — | — | — | `src/modules/clinical/dto/medical-aspects.dto.ts:79` |
| `currentMedicationsText` | `string` | No | — | — | — | `src/modules/clinical/dto/medical-aspects.dto.ts:82` |
| `surgeriesText` | `string` | No | — | — | — | `src/modules/clinical/dto/medical-aspects.dto.ts:85` |
| `familyHistoryText` | `string` | No | — | — | — | `src/modules/clinical/dto/medical-aspects.dto.ts:88` |
| `habitsText` | `string` | No | — | — | — | `src/modules/clinical/dto/medical-aspects.dto.ts:91` |
| `updatedAt` | `string` | No | formato date-time | — | Cuándo se guardó por última vez. Sólo lectura: lo pone el servidor. | `src/modules/clinical/dto/medical-aspects.dto.ts:95` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_PATIENT_PROFILE} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalMedicalAspectsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 28. PUT /clinical/me/medical-aspects

- **Origen:** CONTRATO
- **Nombre:** Guardar mis aspectos médicos declarados
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalMedicalAspectsController.updateOwn` — `src/modules/clinical/controllers/clinical-medical-aspects.controller.ts:53`

### Qué es y para qué sirve (negocio)

Guardar mis aspectos médicos declarados. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PUT /clinical/me/medical-aspects` la atiende `ClinicalMedicalAspectsController.updateOwn` (src/modules/clinical/controllers/clinical-medical-aspects.controller.ts:53). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateOwnMedicalAspectsDto` (7 campos, 0 obligatorios). Delega en `MedicalAspectsService.updateOwn`. Crea filas en clinical.patient_reported_health_statements. Lee clinical.patient_reported_health_statements, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical/controllers/clinical-medical-aspects.controller.ts:53` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.patient_reported_health_statements` | ESCRIBE | CREA | DIRECTA | ClinicalMedicalAspectsController.updateOwn → MedicalAspectsService.updateOwn → PatientReportedHealthStatementsRepository.create | `src/modules/clinical/repositories/patient-reported-health-statements.repository.ts:49` |
| `clinical.patient_reported_health_statements` | LEE | LEE | DIRECTA | ClinicalMedicalAspectsController.updateOwn → MedicalAspectsService.updateOwn → PatientReportedHealthStatementsRepository.findByPatient | `src/modules/clinical/repositories/patient-reported-health-statements.repository.ts:35` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ClinicalMedicalAspectsController.updateOwn → MedicalAspectsService.updateOwn → MedicalAspectsService.resolveOwnPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalMedicalAspectsController.updateOwn → MedicalAspectsService.updateOwn → MedicalAspectsService.resolveOwnPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Cuerpo — DTO `UpdateOwnMedicalAspectsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bloodType` | `string` | No | longitud máxima 20 | `@IsOptional()` `@IsString()` `@MaxLength(BLOOD_TYPE_MAX_LENGTH)` | — | `src/modules/clinical/dto/medical-aspects.dto.ts:22` |
| `allergiesText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(MEDICAL_ASPECT_TEXT_MAX_LENGTH)` | — | `src/modules/clinical/dto/medical-aspects.dto.ts:29` |
| `chronicConditionsText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(MEDICAL_ASPECT_TEXT_MAX_LENGTH)` | — | `src/modules/clinical/dto/medical-aspects.dto.ts:36` |
| `currentMedicationsText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(MEDICAL_ASPECT_TEXT_MAX_LENGTH)` | — | `src/modules/clinical/dto/medical-aspects.dto.ts:43` |
| `surgeriesText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(MEDICAL_ASPECT_TEXT_MAX_LENGTH)` | — | `src/modules/clinical/dto/medical-aspects.dto.ts:50` |
| `familyHistoryText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(MEDICAL_ASPECT_TEXT_MAX_LENGTH)` | — | `src/modules/clinical/dto/medical-aspects.dto.ts:57` |
| `habitsText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(MEDICAL_ASPECT_TEXT_MAX_LENGTH)` | — | `src/modules/clinical/dto/medical-aspects.dto.ts:64` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "bloodType": "valor-ejemplo",
  "allergiesText": "valor-ejemplo",
  "chronicConditionsText": "valor-ejemplo",
  "currentMedicationsText": "valor-ejemplo",
  "surgeriesText": "valor-ejemplo",
  "familyHistoryText": "valor-ejemplo",
  "habitsText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<MedicalAspectsResponseDto>` · DTO `MedicalAspectsResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bloodType` | `string` | No | — | — | — | `src/modules/clinical/dto/medical-aspects.dto.ts:73` |
| `allergiesText` | `string` | No | — | — | — | `src/modules/clinical/dto/medical-aspects.dto.ts:76` |
| `chronicConditionsText` | `string` | No | — | — | — | `src/modules/clinical/dto/medical-aspects.dto.ts:79` |
| `currentMedicationsText` | `string` | No | — | — | — | `src/modules/clinical/dto/medical-aspects.dto.ts:82` |
| `surgeriesText` | `string` | No | — | — | — | `src/modules/clinical/dto/medical-aspects.dto.ts:85` |
| `familyHistoryText` | `string` | No | — | — | — | `src/modules/clinical/dto/medical-aspects.dto.ts:88` |
| `habitsText` | `string` | No | — | — | — | `src/modules/clinical/dto/medical-aspects.dto.ts:91` |
| `updatedAt` | `string` | No | formato date-time | — | Cuándo se guardó por última vez. Sólo lectura: lo pone el servidor. | `src/modules/clinical/dto/medical-aspects.dto.ts:95` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_PATIENT_PROFILE} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalMedicalAspectsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. GET /clinical/me/procedure-centers

- **Origen:** CONTRATO
- **Nombre:** Dónde hacerme los procedimientos que me pidieron
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalProcedureCentersController.findOwn` — `src/modules/clinical/controllers/clinical-procedure-centers.controller.ts:39`

### Qué es y para qué sirve (negocio)

Dónde hacerme los procedimientos que me pidieron. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /clinical/me/procedure-centers` la atiende `ClinicalProcedureCentersController.findOwn` (src/modules/clinical/controllers/clinical-procedure-centers.controller.ts:39). Exige sesión con alguno de los roles PATIENT. Delega en `ProcedureCentersService.findForOwnOrders`. Lee clinical.service_requests, common.addresses, practice.healthcare_services, practice.practice_sites, practice.practices, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/clinical/controllers/clinical-procedure-centers.controller.ts:39` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.service_requests` | LEE | LEE | DIRECTA | ClinicalProcedureCentersController.findOwn → ProcedureCentersService.findForOwnOrders → ProcedureCentersReadRepository.findPendingOrders | `src/modules/clinical/repositories/procedure-centers-read.repository.ts:45` |
| `common.addresses` | LEE | LEE | DIRECTA | ClinicalProcedureCentersController.findOwn → ProcedureCentersService.findForOwnOrders → ProcedureCentersReadRepository.findAddresses | `src/modules/clinical/repositories/procedure-centers-read.repository.ts:108` |
| `practice.healthcare_services` | LEE | LEE | DIRECTA | ClinicalProcedureCentersController.findOwn → ProcedureCentersService.findForOwnOrders → ProcedureCentersReadRepository.findActiveOfferings | `src/modules/clinical/repositories/procedure-centers-read.repository.ts:62` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalProcedureCentersController.findOwn → ProcedureCentersService.findForOwnOrders → ProcedureCentersReadRepository.findOpenSites | `src/modules/clinical/repositories/procedure-centers-read.repository.ts:92` |
| `practice.practices` | LEE | LEE | DIRECTA | ClinicalProcedureCentersController.findOwn → ProcedureCentersService.findForOwnOrders → ProcedureCentersReadRepository.findActivePractices | `src/modules/clinical/repositories/procedure-centers-read.repository.ts:74` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ClinicalProcedureCentersController.findOwn → ProcedureCentersService.findForOwnOrders → ProcedureCentersService.resolveOwnPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalProcedureCentersController.findOwn → ProcedureCentersService.findForOwnOrders → ProcedureCentersService.resolveOwnPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `lat` | query | No | `number` | — |
| `lng` | query | No | `number` | — |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ProcedureCentersResponseDto>` · DTO `ProcedureCentersResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `procedures` | `array<PendingProcedureDto>` | Sí | — | — | — | `src/modules/clinical/dto/procedure-centers.dto.ts:109` |
| `procedures[].serviceRequestId` | `string` | Sí | formato uuid | — | — | `src/modules/clinical/dto/procedure-centers.dto.ts:47` |
| `procedures[].conceptId` | `string` | Sí | formato uuid | — | — | `src/modules/clinical/dto/procedure-centers.dto.ts:51` |
| `procedures[].categoryConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/clinical/dto/procedure-centers.dto.ts:55` |
| `procedures[].requestedAt` | `string` | Sí | formato date-time | — | — | `src/modules/clinical/dto/procedure-centers.dto.ts:59` |
| `centers` | `array<ProcedureCenterDto>` | Sí | — | — | — | `src/modules/clinical/dto/procedure-centers.dto.ts:113` |
| `centers[].siteId` | `string` | Sí | formato uuid | — | — | `src/modules/clinical/dto/procedure-centers.dto.ts:66` |
| `centers[].practiceId` | `string` | Sí | formato uuid | — | — | `src/modules/clinical/dto/procedure-centers.dto.ts:70` |
| `centers[].practiceName` | `string` | Sí | — | — | — | `src/modules/clinical/dto/procedure-centers.dto.ts:74` |
| `centers[].siteName` | `string` | Sí | — | — | — | `src/modules/clinical/dto/procedure-centers.dto.ts:78` |
| `centers[].complete` | `boolean` | Sí | — | — | — | `src/modules/clinical/dto/procedure-centers.dto.ts:82` |
| `centers[].missingProcedureConceptIds` | `array<string>` | Sí | — | — | — | `src/modules/clinical/dto/procedure-centers.dto.ts:86` |
| `centers[].distanceKm` | `number` | Sí | admite null | — | — | `src/modules/clinical/dto/procedure-centers.dto.ts:90` |
| `centers[].addressText` | `string` | Sí | admite null | — | — | `src/modules/clinical/dto/procedure-centers.dto.ts:94` |
| `centers[].latitude` | `number` | Sí | admite null | — | — | `src/modules/clinical/dto/procedure-centers.dto.ts:98` |
| `centers[].longitude` | `number` | Sí | admite null | — | — | `src/modules/clinical/dto/procedure-centers.dto.ts:102` |
| `total` | `number` | Sí | — | — | — | `src/modules/clinical/dto/procedure-centers.dto.ts:117` |
| `limit` | `number` | Sí | — | — | — | `src/modules/clinical/dto/procedure-centers.dto.ts:121` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_PATIENT_PROFILE} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical/controllers/clinical-procedure-centers.controller.spec.ts:20` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalProcedureCentersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 30. POST /clinical/medication-records

- **Origen:** CONTRATO
- **Nombre:** Administrar/registrar medicación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.administerMedication` — `src/modules/clinical/controllers/clinical-records.controller.ts:282`

### Qué es y para qué sirve (negocio)

Administrar/registrar medicación. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/medication-records` la atiende `ClinicalRecordsController.administerMedication` (src/modules/clinical/controllers/clinical-records.controller.ts:282). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateMedicationRecordDto` (8 campos, 3 obligatorios). Delega en `MedicationsService.administer`. Crea filas en clinical.medication_records. Actualiza clinical.medication_requests. Lee clinical.medication_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:282` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_records` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.administerMedication → MedicationsService.administer → MedicationRecordsRepository.create | `src/modules/clinical/repositories/medication-records.repository.ts:81` |
| `clinical.medication_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalRecordsController.administerMedication → MedicationsService.administer | `src/modules/clinical/services/medications.service.ts:917` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalRecordsController.administerMedication → MedicationsService.administer → MedicationRequestsRepository.findById | `src/modules/clinical/repositories/medication-requests.repository.ts:147` |

### Cuerpo — DTO `CreateMedicationRecordDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `custodianTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant custodio (directory.tenants) | `src/modules/clinical/dto/medication.dto.ts:217` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente (profiles.patient_profiles) | `src/modules/clinical/dto/medication.dto.ts:227` |
| `requestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Prescripción que se administra | `src/modules/clinical/dto/medication.dto.ts:238` |
| `medicationConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Medicamento (concept id) | `src/modules/clinical/dto/medication.dto.ts:245` |
| `doseDecimal` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Dosis administrada | `src/modules/clinical/dto/medication.dto.ts:253` |
| `unitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad (concept id) | `src/modules/clinical/dto/medication.dto.ts:261` |
| `administeredAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Momento de administración | `src/modules/clinical/dto/medication.dto.ts:272` |
| `isFinalDose` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Marca la dosis final: cierra la prescripción | `src/modules/clinical/dto/medication.dto.ts:282` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "medicationConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "requestId": "00000000-0000-4000-8000-000000000001",
  "medicationConceptId": "00000000-0000-4000-8000-000000000001",
  "doseDecimal": 1,
  "unitConceptId": "00000000-0000-4000-8000-000000000001",
  "administeredAt": "2026-07-31T12:00:00.000Z",
  "isFinalDose": true
}
```

</details>

### Respuesta — `Promise<MedicationRecordResponseDto>` · DTO `MedicationRecordResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/medication.dto.ts:700` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/medication.dto.ts:706` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/medication.dto.ts:712` |
| `requestId` | `string` | No | formato uuid; admite null | — | Identificador asociado a request. | `src/modules/clinical/dto/medication.dto.ts:718` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/medication.dto.ts:724` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Prescripción no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La prescripción no está emitida (ISSUED) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical/controllers/clinical-records.controller.spec.ts:90` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 31. POST /clinical/medication-requests

- **Origen:** CONTRATO
- **Nombre:** Prescribir medicación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.prescribeMedication` — `src/modules/clinical/controllers/clinical-records.controller.ts:227`

### Qué es y para qué sirve (negocio)

Prescribir medicación. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/medication-requests` la atiende `ClinicalRecordsController.prescribeMedication` (src/modules/clinical/controllers/clinical-records.controller.ts:227). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateMedicationRequestDto` (17 campos, 3 obligatorios). Delega en `MedicationsService.prescribe`. Crea filas en audit.medication_requests_history, clinical.medication_requests. Actualiza audit.medication_requests_history. Lee audit.medication_requests_history, clinical.conditions, forms.form_instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:227` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.medication_requests_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | ClinicalRecordsController.prescribeMedication → MedicationsService.prescribe → MedicationsService.versionRequest | `src/modules/clinical/services/medications.service.ts:345` |
| `audit.medication_requests_history` | ESCRIBE | CREA | POR_REGISTRO | ClinicalRecordsController.prescribeMedication → MedicationsService.prescribe → MedicationsService.versionRequest | `src/modules/clinical/services/medications.service.ts:345` |
| `audit.medication_requests_history` | LEE | LEE | POR_REGISTRO | ClinicalRecordsController.prescribeMedication → MedicationsService.prescribe → MedicationsService.versionRequest | `src/modules/clinical/services/medications.service.ts:345` |
| `clinical.conditions` | LEE | LEE | DIRECTA | ClinicalRecordsController.prescribeMedication → MedicationsService.prescribe → MedicationsService.assertIndicationBelongsToPatient → ConditionsRepository.findById | `src/modules/clinical/repositories/conditions.repository.ts:107` |
| `clinical.medication_requests` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.prescribeMedication → MedicationsService.prescribe → MedicationRequestsRepository.create | `src/modules/clinical/repositories/medication-requests.repository.ts:196` |
| `forms.form_instances` | LEE | LEE | DIRECTA | ClinicalRecordsController.prescribeMedication → MedicationsService.prescribe → FormInstanceOriginValidator.assertUsableOrigin | `src/modules/forms/services/form-instance-origin.validator.ts:43` |

### Cuerpo — DTO `CreateMedicationRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `custodianTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant custodio (directory.tenants) | `src/modules/clinical/dto/medication.dto.ts:32` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente (profiles.patient_profiles) | `src/modules/clinical/dto/medication.dto.ts:42` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro en curso | `src/modules/clinical/dto/medication.dto.ts:50` |
| `formInstanceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Instancia CERRADA del formulario médico (forms.form_instances) de la que sale la receta. Opcional: desde la historia se emite sin formulario. Si viaja, debe existir, estar cerrada y ser del mismo encuentro (422 PRECONDITION_FAILED si no) | `src/modules/clinical/dto/medication.dto.ts:64` |
| `medicationConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Medicamento (concept id) | `src/modules/clinical/dto/medication.dto.ts:71` |
| `substanceAtcConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sustancia ATC (concept id) | `src/modules/clinical/dto/medication.dto.ts:82` |
| `prescriberProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional prescriptor | `src/modules/clinical/dto/medication.dto.ts:93` |
| `doseText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Dosis en texto libre | `src/modules/clinical/dto/medication.dto.ts:102` |
| `routeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Vía de administración (concept id) | `src/modules/clinical/dto/medication.dto.ts:113` |
| `frequencyText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Frecuencia en texto libre | `src/modules/clinical/dto/medication.dto.ts:125` |
| `quantityDecimal` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Cantidad prescrita | `src/modules/clinical/dto/medication.dto.ts:133` |
| `unitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad (concept id) | `src/modules/clinical/dto/medication.dto.ts:141` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de vigencia | `src/modules/clinical/dto/medication.dto.ts:152` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fin de vigencia | `src/modules/clinical/dto/medication.dto.ts:160` |
| `patientInstructionsText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Indicaciones al paciente impresas en la receta, separadas de la posología (Patch v4.1.3) | `src/modules/clinical/dto/medication.dto.ts:173` |
| `indicationConditionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Condición clínica que motiva la prescripción — para qué es la receta. Debe pertenecer al mismo paciente (Patch v4.1.6) | `src/modules/clinical/dto/medication.dto.ts:186` |
| `indicationText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(INDICATION_TEXT_MAX_LENGTH)` | Motivo de la receta escrito a mano («Otro motivo»). Excluyente con indicationConditionId: si viajan los dos, gana la condición (P24) | `src/modules/clinical/dto/medication.dto.ts:204` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "medicationConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "formInstanceId": "00000000-0000-4000-8000-000000000001",
  "medicationConceptId": "00000000-0000-4000-8000-000000000001",
  "substanceAtcConceptId": "00000000-0000-4000-8000-000000000001",
  "prescriberProfileId": "00000000-0000-4000-8000-000000000001",
  "doseText": "valor-ejemplo",
  "routeConceptId": "00000000-0000-4000-8000-000000000001",
  "frequencyText": "valor-ejemplo",
  "quantityDecimal": 1,
  "unitConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "patientInstructionsText": "valor-ejemplo",
  "indicationConditionId": "00000000-0000-4000-8000-000000000001",
  "indicationText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<MedicationRequestResponseDto>` · DTO `MedicationRequestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/medication.dto.ts:621` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/medication.dto.ts:627` |
| `formInstanceId` | `string` | No | formato uuid; admite null | — | Instancia del formulario médico de la que salió la receta (nulo = sin formulario) | `src/modules/clinical/dto/medication.dto.ts:638` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/medication.dto.ts:644` |
| `replacesRequestId` | `string` | No | formato uuid; admite null | — | Receta a la que esta sustituye | `src/modules/clinical/dto/medication.dto.ts:654` |
| `replacedByRequestId` | `string` | No | formato uuid; admite null | — | Receta que sustituye a esta | `src/modules/clinical/dto/medication.dto.ts:664` |
| `renewedFromRequestId` | `string` | No | formato uuid; admite null | — | Receta de la que esta es renovación | `src/modules/clinical/dto/medication.dto.ts:674` |
| `signedAt` | `string` | No | formato date-time; admite null | — | Instante de firma de la receta (nulo = sin firmar) | `src/modules/clinical/dto/medication.dto.ts:685` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/medication.dto.ts:691` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Una receta necesita un profesional prescriptor.; ForbiddenException: La sesión no tiene un perfil profesional con el que prescribir.; ForbiddenException: El prescriptor es el profesional de la sesión: no se prescribe en nombre de otro. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La condición indicada no existe o no pertenece a este paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/clinical-prescriptions-pdf.int-spec.ts:148` |
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:644` |
| INTEGRACION | `test/integration/hardening/mch-007.int-spec.ts:245` |
| CONTROLADOR | `src/modules/clinical/controllers/clinical-records.controller.spec.ts:79` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 32. GET /clinical/medication-requests/{id}/attachments

- **Origen:** CONTRATO
- **Nombre:** Listar los adjuntos de una receta
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.listMedicationRequestAttachments` — `src/modules/clinical/controllers/clinical-records.controller.ts:267`

### Qué es y para qué sirve (negocio)

Listar los adjuntos de una receta. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /clinical/medication-requests/{id}/attachments` la atiende `ClinicalRecordsController.listMedicationRequestAttachments` (src/modules/clinical/controllers/clinical-records.controller.ts:267). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, PATIENT. Delega en `MedicationsService.listAttachments`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 14 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, PATIENT | `src/modules/clinical/controllers/clinical-records.controller.ts:267` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-records.controller.ts:267` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalRecordsController.listMedicationRequestAttachments → MedicationsService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalRecordsController.listMedicationRequestAttachments → MedicationsService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.listMedicationRequestAttachments → MedicationsService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.listMedicationRequestAttachments → MedicationsService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalRecordsController.listMedicationRequestAttachments → MedicationsService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.listMedicationRequestAttachments → MedicationsService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.listMedicationRequestAttachments → MedicationsService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.listMedicationRequestAttachments → MedicationsService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalRecordsController.listMedicationRequestAttachments → MedicationsService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.listMedicationRequestAttachments → MedicationsService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalRecordsController.listMedicationRequestAttachments → MedicationsService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalRecordsController.listMedicationRequestAttachments → MedicationsService.listAttachments → MedicationsService.loadRequestOrThrow → MedicationRequestsRepository.findById | `src/modules/clinical/repositories/medication-requests.repository.ts:147` |
| `common.file_links` | LEE | LEE | DIRECTA | ClinicalRecordsController.listMedicationRequestAttachments → MedicationsService.listAttachments → FilesService.listLinkedFilesOf → FileLinksRepository.findByOwner | `src/modules/common/repositories/file-links.repository.ts:78` |
| `common.file_versions` | LEE | LEE | DIRECTA | ClinicalRecordsController.listMedicationRequestAttachments → MedicationsService.listAttachments → FilesService.listLinkedFilesOf → FileVersionsRepository.findByIds | `src/modules/common/repositories/file-versions.repository.ts:95` |
| `common.files` | LEE | LEE | DIRECTA | ClinicalRecordsController.listMedicationRequestAttachments → MedicationsService.listAttachments → FilesService.listLinkedFilesOf → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalRecordsController.listMedicationRequestAttachments → MedicationsService.listAttachments → ClinicalReadService.assertCanReadHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | ClinicalRecordsController.listMedicationRequestAttachments → MedicationsService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ClinicalRecordsController.listMedicationRequestAttachments → MedicationsService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalRecordsController.listMedicationRequestAttachments → MedicationsService.listAttachments → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalRecordsController.listMedicationRequestAttachments → MedicationsService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalRecordsController.listMedicationRequestAttachments → MedicationsService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalRecordsController.listMedicationRequestAttachments → MedicationsService.listAttachments → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LinkedFilePageDto>` · DTO `LinkedFilePageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<LinkedFileResponseDto>` | Sí | — | — | — | `src/modules/common/dto/files.dto.ts:547` |
| `items[].linkId` | `string` | Sí | formato uuid | — | Id del vínculo, no del archivo. | `src/modules/common/dto/files.dto.ts:529` |
| `items[].ownerId` | `string` | Sí | formato uuid | — | — | `src/modules/common/dto/files.dto.ts:532` |
| `items[].ownerType` | `string` | Sí | valores: USER, PATIENT, TENANT, CONDITION, PROCEDURE, MEDICATION_REQUEST, ALLERGY_INTOLERANCE, ENCOUNTER | — | — | `src/modules/common/dto/files.dto.ts:535` |
| `items[].linkedAt` | `string` | Sí | formato date-time | — | Cuándo se adjuntó. | `src/modules/common/dto/files.dto.ts:538` |
| `items[].file` | `FileResponseDto` | Sí | — | — | — | `src/modules/common/dto/files.dto.ts:541` |
| `items[].file.id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/common/dto/files.dto.ts:279` |
| `items[].file.currentVersionId` | `string` | No | formato uuid | — | Identificador asociado a current version. | `src/modules/common/dto/files.dto.ts:285` |
| `items[].file.originalName` | `string` | No | — | — | Valor de original name mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:291` |
| `items[].file.mimeType` | `string` | No | — | — | Tipo MIME de la versión vigente. Ausente si no hay versión vigente. | `src/modules/common/dto/files.dto.ts:308` |
| `items[].file.sizeBytes` | `number` | No | — | — | Tamaño en bytes de la versión vigente. Ausente si no hay versión vigente. | `src/modules/common/dto/files.dto.ts:325` |
| `items[].file.category` | `string` | Sí | valores: DOCUMENT, IMAGE | — | Valor de category mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:331` |
| `items[].file.sensitivity` | `string` | Sí | valores: NORMAL, PHI | — | Valor de sensitivity mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:337` |
| `items[].file.lifecycleStatusConceptId` | `string` | Sí | — | — | Estado del ciclo de vida (concept id). | `src/modules/common/dto/files.dto.ts:343` |
| `items[].file.createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/common/dto/files.dto.ts:349` |
| `count` | `number` | Sí | — | — | Cuántos vinieron en esta página. | `src/modules/common/dto/files.dto.ts:550` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY}; ForbiddenException: No tiene acceso a los adjuntos de este recurso |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Receta no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 33. POST /clinical/medication-requests/{id}/attachments

- **Origen:** CONTRATO
- **Nombre:** Adjuntar un archivo ya subido a una receta
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.attachFileToMedicationRequest` — `src/modules/clinical/controllers/clinical-records.controller.ts:247`

### Qué es y para qué sirve (negocio)

Adjuntar un archivo ya subido a una receta. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/medication-requests/{id}/attachments` la atiende `ClinicalRecordsController.attachFileToMedicationRequest` (src/modules/clinical/controllers/clinical-records.controller.ts:247). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `AttachFileToMedicationRequestDto` (1 campo, 1 obligatorio). Delega en `MedicationsService.attachFile`. Crea filas en common.file_links. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 12 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:247` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-records.controller.ts:247` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToMedicationRequest → MedicationsService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToMedicationRequest → MedicationsService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToMedicationRequest → MedicationsService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToMedicationRequest → MedicationsService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToMedicationRequest → MedicationsService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToMedicationRequest → MedicationsService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToMedicationRequest → MedicationsService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToMedicationRequest → MedicationsService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToMedicationRequest → MedicationsService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToMedicationRequest → MedicationsService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToMedicationRequest → MedicationsService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToMedicationRequest → MedicationsService.attachFile → MedicationsService.loadRequestOrThrow → MedicationRequestsRepository.findById | `src/modules/clinical/repositories/medication-requests.repository.ts:147` |
| `common.file_links` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.attachFileToMedicationRequest → MedicationsService.attachFile → FilesService.createLink → FileLinksRepository.create | `src/modules/common/repositories/file-links.repository.ts:43` |
| `common.file_versions` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToMedicationRequest → MedicationsService.attachFile → FilesService.createLink → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:190` |
| `common.files` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToMedicationRequest → MedicationsService.attachFile → FilesService.createLink → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:182` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToMedicationRequest → MedicationsService.attachFile → FilesService.createLink → StoragePublicationService.guardFile → StorageLifecycleCoordinator.assertNoContender → QueuesRepository.findStorageIntents | `src/modules/messaging/repositories/queues.repository.ts:62` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToMedicationRequest → MedicationsService.attachFile → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToMedicationRequest → MedicationsService.attachFile → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalRecordsController.attachFileToMedicationRequest → MedicationsService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalRecordsController.attachFileToMedicationRequest → MedicationsService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalRecordsController.attachFileToMedicationRequest → MedicationsService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AttachFileToMedicationRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical/dto/medication.dto.ts:19` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<FileLinkResponseDto>` · DTO `FileLinkResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/common/dto/files.dto.ts:444` |
| `fileId` | `string` | Sí | formato uuid | — | Identificador asociado a file. | `src/modules/common/dto/files.dto.ts:450` |
| `ownerId` | `string` | Sí | formato uuid | — | Identificador asociado a owner. | `src/modules/common/dto/files.dto.ts:456` |
| `ownerType` | `string` | Sí | valores: USER, PATIENT, TENANT, CONDITION, PROCEDURE, MEDICATION_REQUEST, ALLERGY_INTOLERANCE, ENCOUNTER | — | Valor de owner type mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:462` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/common/dto/files.dto.ts:468` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY}; InsufficientRoleException: No tiene permiso para modificar este archivo |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Receta no encontrada; ResourceNotFoundException: Archivo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING; StorageLifecycleDenied: {identity.reasonCode}; StorageLifecycleDenied: FILE_NOT_LIVE; StorageLifecycleDenied: VERSION_UNKNOWN; StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN; StorageLifecycleDenied: PRODUCER_OR_PURGE_IN_FLIGHT |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 34. POST /clinical/medication-requests/{id}/edit

- **Origen:** CONTRATO
- **Nombre:** Editar ítems de una receta en borrador (DRAFT)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.editMedicationDraft` — `src/modules/clinical/controllers/clinical-records.controller.ts:299`

### Qué es y para qué sirve (negocio)

Editar ítems de una receta en borrador (DRAFT). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/medication-requests/{id}/edit` la atiende `ClinicalRecordsController.editMedicationDraft` (src/modules/clinical/controllers/clinical-records.controller.ts:299). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `EditMedicationRequestDraftDto` (14 campos, 0 obligatorios). Delega en `MedicationsService.editDraft`. Crea filas en audit.medication_requests_history. Actualiza audit.medication_requests_history, clinical.medication_requests. Lee audit.medication_requests_history, authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants y 11 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:299` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-records.controller.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.medication_requests_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.versionRequest | `src/modules/clinical/services/medications.service.ts:345` |
| `audit.medication_requests_history` | ESCRIBE | CREA | POR_REGISTRO | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.versionRequest | `src/modules/clinical/services/medications.service.ts:345` |
| `audit.medication_requests_history` | LEE | LEE | POR_REGISTRO | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.versionRequest | `src/modules/clinical/services/medications.service.ts:345` |
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.conditions` | LEE | LEE | DIRECTA | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.assertIndicationBelongsToPatient → ConditionsRepository.findById | `src/modules/clinical/repositories/conditions.repository.ts:107` |
| `clinical.medication_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft | `src/modules/clinical/services/medications.service.ts:448` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.loadRequestForWrite → MedicationsService.loadRequestOrThrow → MedicationRequestsRepository.findById | `src/modules/clinical/repositories/medication-requests.repository.ts:147` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `EditMedicationRequestDraftDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro en curso | `src/modules/clinical/dto/medication.dto.ts:297` |
| `medicationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Medicamento (concept id) | `src/modules/clinical/dto/medication.dto.ts:308` |
| `substanceAtcConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sustancia ATC (concept id) | `src/modules/clinical/dto/medication.dto.ts:319` |
| `prescriberProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional prescriptor | `src/modules/clinical/dto/medication.dto.ts:330` |
| `doseText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Dosis en texto libre | `src/modules/clinical/dto/medication.dto.ts:339` |
| `routeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Vía de administración (concept id) | `src/modules/clinical/dto/medication.dto.ts:350` |
| `frequencyText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Frecuencia en texto libre | `src/modules/clinical/dto/medication.dto.ts:362` |
| `quantityDecimal` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Cantidad prescrita | `src/modules/clinical/dto/medication.dto.ts:370` |
| `unitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad (concept id) | `src/modules/clinical/dto/medication.dto.ts:378` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de vigencia | `src/modules/clinical/dto/medication.dto.ts:389` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fin de vigencia | `src/modules/clinical/dto/medication.dto.ts:397` |
| `indicationConditionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Condición que motiva la prescripción; debe ser del mismo paciente (Patch v4.1.6) | `src/modules/clinical/dto/medication.dto.ts:409` |
| `indicationText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(INDICATION_TEXT_MAX_LENGTH)` | Motivo de la receta escrito a mano. Excluyente con indicationConditionId (P24) | `src/modules/clinical/dto/medication.dto.ts:423` |
| `patientInstructionsText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Indicaciones al paciente impresas en la receta (Patch v4.1.3) | `src/modules/clinical/dto/medication.dto.ts:436` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "medicationConceptId": "00000000-0000-4000-8000-000000000001",
  "substanceAtcConceptId": "00000000-0000-4000-8000-000000000001",
  "prescriberProfileId": "00000000-0000-4000-8000-000000000001",
  "doseText": "valor-ejemplo",
  "routeConceptId": "00000000-0000-4000-8000-000000000001",
  "frequencyText": "valor-ejemplo",
  "quantityDecimal": 1,
  "unitConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "indicationConditionId": "00000000-0000-4000-8000-000000000001",
  "indicationText": "valor-ejemplo",
  "patientInstructionsText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<MedicationRequestResponseDto>` · DTO `MedicationRequestResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/medication.dto.ts:621` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/medication.dto.ts:627` |
| `formInstanceId` | `string` | No | formato uuid; admite null | — | Instancia del formulario médico de la que salió la receta (nulo = sin formulario) | `src/modules/clinical/dto/medication.dto.ts:638` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/medication.dto.ts:644` |
| `replacesRequestId` | `string` | No | formato uuid; admite null | — | Receta a la que esta sustituye | `src/modules/clinical/dto/medication.dto.ts:654` |
| `replacedByRequestId` | `string` | No | formato uuid; admite null | — | Receta que sustituye a esta | `src/modules/clinical/dto/medication.dto.ts:664` |
| `renewedFromRequestId` | `string` | No | formato uuid; admite null | — | Receta de la que esta es renovación | `src/modules/clinical/dto/medication.dto.ts:674` |
| `signedAt` | `string` | No | formato date-time; admite null | — | Instante de firma de la receta (nulo = sin firmar) | `src/modules/clinical/dto/medication.dto.ts:685` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/medication.dto.ts:691` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY}; ForbiddenException: Una receta necesita un profesional prescriptor.; ForbiddenException: La sesión no tiene un perfil profesional con el que prescribir.; ForbiddenException: El prescriptor es el profesional de la sesión: no se prescribe en nombre de otro. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Receta no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo un borrador (DRAFT) admite edición; una receta emitida es inmutable; PreconditionFailedException: La condición indicada no existe o no pertenece a este paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical/controllers/clinical-records.controller.spec.ts:97` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 35. POST /clinical/medication-requests/{id}/invalidate

- **Origen:** CONTRATO
- **Nombre:** Invalidar una receta emitida
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.invalidateMedicationRequest` — `src/modules/clinical/controllers/clinical-records.controller.ts:349`

### Qué es y para qué sirve (negocio)

Invalidar una receta emitida. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/medication-requests/{id}/invalidate` la atiende `ClinicalRecordsController.invalidateMedicationRequest` (src/modules/clinical/controllers/clinical-records.controller.ts:349). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `InvalidateMedicationRequestDto` (1 campo, 1 obligatorio). Delega en `MedicationsService.invalidate`. Crea filas en audit.audit_log, audit.medication_requests_history. Actualiza audit.medication_requests_history, clinical.medication_requests. Lee audit.audit_log, audit.medication_requests_history, authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions y 12 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:349` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-records.controller.ts:349` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `audit.medication_requests_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → MedicationsService.versionRequest | `src/modules/clinical/services/medications.service.ts:345` |
| `audit.medication_requests_history` | ESCRIBE | CREA | POR_REGISTRO | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → MedicationsService.versionRequest | `src/modules/clinical/services/medications.service.ts:345` |
| `audit.medication_requests_history` | LEE | LEE | POR_REGISTRO | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → MedicationsService.versionRequest | `src/modules/clinical/services/medications.service.ts:345` |
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.medication_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate | `src/modules/clinical/services/medications.service.ts:682` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → MedicationsService.loadRequestForWrite → MedicationsService.loadRequestOrThrow → MedicationRequestsRepository.findById | `src/modules/clinical/repositories/medication-requests.repository.ts:147` |
| `iam.sessions` | LEE | LEE | POR_SQL | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `InvalidateMedicationRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reasonText` | `string` | Sí | longitud máxima 1000 | `@IsString()` `@MaxLength(1000)` | Motivo de la invalidación (obligatorio) | `src/modules/clinical/dto/medication.dto.ts:450` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reasonText": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<MedicationRequestResponseDto>` · DTO `MedicationRequestResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/medication.dto.ts:621` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/medication.dto.ts:627` |
| `formInstanceId` | `string` | No | formato uuid; admite null | — | Instancia del formulario médico de la que salió la receta (nulo = sin formulario) | `src/modules/clinical/dto/medication.dto.ts:638` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/medication.dto.ts:644` |
| `replacesRequestId` | `string` | No | formato uuid; admite null | — | Receta a la que esta sustituye | `src/modules/clinical/dto/medication.dto.ts:654` |
| `replacedByRequestId` | `string` | No | formato uuid; admite null | — | Receta que sustituye a esta | `src/modules/clinical/dto/medication.dto.ts:664` |
| `renewedFromRequestId` | `string` | No | formato uuid; admite null | — | Receta de la que esta es renovación | `src/modules/clinical/dto/medication.dto.ts:674` |
| `signedAt` | `string` | No | formato date-time; admite null | — | Instante de firma de la receta (nulo = sin firmar) | `src/modules/clinical/dto/medication.dto.ts:685` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/medication.dto.ts:691` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Receta no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo una receta emitida (ISSUED) puede invalidarse |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical/controllers/clinical-records.controller.spec.ts:119` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 36. POST /clinical/medication-requests/{id}/issue

- **Origen:** CONTRATO
- **Nombre:** Emitir una receta (la vuelve inmutable)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.issueMedicationRequest` — `src/modules/clinical/controllers/clinical-records.controller.ts:332`

### Qué es y para qué sirve (negocio)

Emitir una receta (la vuelve inmutable). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/medication-requests/{id}/issue` la atiende `ClinicalRecordsController.issueMedicationRequest` (src/modules/clinical/controllers/clinical-records.controller.ts:332). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `MedicationsService.issue`. Crea filas en audit.audit_log, audit.medication_requests_history, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza audit.medication_requests_history, clinical.medication_requests, iam.devices. Lee audit.audit_log, audit.medication_requests_history, authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions y 19 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:332` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | idempotency-key (obligatoria) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-records.controller.ts:332` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `audit.medication_requests_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → MedicationsService.versionRequest | `src/modules/clinical/services/medications.service.ts:345` |
| `audit.medication_requests_history` | ESCRIBE | CREA | POR_REGISTRO | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → MedicationsService.versionRequest | `src/modules/clinical/services/medications.service.ts:345` |
| `audit.medication_requests_history` | LEE | LEE | POR_REGISTRO | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → MedicationsService.versionRequest | `src/modules/clinical/services/medications.service.ts:345` |
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.medication_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue | `src/modules/clinical/services/medications.service.ts:620` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → MedicationRequestsRepository.findByIssueIdempotencyKey | `src/modules/clinical/repositories/medication-requests.repository.ts:180` |
| `clinical.prescription_signature_policies` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → PrescriptionSignaturePoliciesService.isSignatureRequired → PrescriptionSignaturePoliciesRepository.findActive | `src/modules/clinical/repositories/prescription-signature-policies.repository.ts:81` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → ClinicalNotificationsService.prescriptionIssued → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → ClinicalNotificationsService.prescriptionIssued → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `iam.sessions` | LEE | LEE | POR_SQL | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → ClinicalNotificationsService.prescriptionIssued → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → ClinicalNotificationsService.prescriptionIssued → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → ClinicalNotificationsService.prescriptionIssued → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → ClinicalNotificationsService.prescriptionIssued → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → ClinicalNotificationsService.prescriptionIssued → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → ClinicalNotificationsService.prescriptionIssued → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → ClinicalNotificationsService.prescriptionIssued → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → ClinicalNotificationsService.prescriptionIssued → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `idempotency-key` | header | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MedicationRequestResponseDto>` · DTO `MedicationRequestResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/medication.dto.ts:621` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/medication.dto.ts:627` |
| `formInstanceId` | `string` | No | formato uuid; admite null | — | Instancia del formulario médico de la que salió la receta (nulo = sin formulario) | `src/modules/clinical/dto/medication.dto.ts:638` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/medication.dto.ts:644` |
| `replacesRequestId` | `string` | No | formato uuid; admite null | — | Receta a la que esta sustituye | `src/modules/clinical/dto/medication.dto.ts:654` |
| `replacedByRequestId` | `string` | No | formato uuid; admite null | — | Receta que sustituye a esta | `src/modules/clinical/dto/medication.dto.ts:664` |
| `renewedFromRequestId` | `string` | No | formato uuid; admite null | — | Receta de la que esta es renovación | `src/modules/clinical/dto/medication.dto.ts:674` |
| `signedAt` | `string` | No | formato date-time; admite null | — | Instante de firma de la receta (nulo = sin firmar) | `src/modules/clinical/dto/medication.dto.ts:685` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/medication.dto.ts:691` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Receta no encontrada |
| 409 | `CONFLICT` | ConflictException: La clave de idempotencia ya fue usada para emitir otra receta |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo un borrador (DRAFT) puede emitirse; PreconditionFailedException: La política vigente exige firmar la receta antes de emitirla |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/clinical-prescriptions-pdf.int-spec.ts:197` |
| CONTROLADOR | `src/modules/clinical/controllers/clinical-records.controller.spec.ts:107` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 37. POST /clinical/medication-requests/{id}/renew

- **Origen:** CONTRATO
- **Nombre:** Renovar una receta (crea una nueva copiando datos)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.renewMedicationRequest` — `src/modules/clinical/controllers/clinical-records.controller.ts:385`

### Qué es y para qué sirve (negocio)

Renovar una receta (crea una nueva copiando datos). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/medication-requests/{id}/renew` la atiende `ClinicalRecordsController.renewMedicationRequest` (src/modules/clinical/controllers/clinical-records.controller.ts:385). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `RenewMedicationRequestDto` (5 campos, 0 obligatorios). Delega en `MedicationsService.renew`. Crea filas en audit.audit_log, audit.medication_requests_history, clinical.medication_requests. Actualiza audit.medication_requests_history. Lee audit.audit_log, audit.medication_requests_history, authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions y 12 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:385` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-records.controller.ts:385` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `audit.medication_requests_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationsService.versionRequest | `src/modules/clinical/services/medications.service.ts:345` |
| `audit.medication_requests_history` | ESCRIBE | CREA | POR_REGISTRO | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationsService.versionRequest | `src/modules/clinical/services/medications.service.ts:345` |
| `audit.medication_requests_history` | LEE | LEE | POR_REGISTRO | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationsService.versionRequest | `src/modules/clinical/services/medications.service.ts:345` |
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.medication_requests` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationRequestsRepository.create | `src/modules/clinical/repositories/medication-requests.repository.ts:196` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationsService.loadRequestForWrite → MedicationsService.loadRequestOrThrow → MedicationRequestsRepository.findById | `src/modules/clinical/repositories/medication-requests.repository.ts:147` |
| `iam.sessions` | LEE | LEE | POR_SQL | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RenewMedicationRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `doseText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Dosis en texto libre | `src/modules/clinical/dto/medication.dto.ts:573` |
| `frequencyText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Frecuencia en texto libre | `src/modules/clinical/dto/medication.dto.ts:585` |
| `quantityDecimal` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Cantidad prescrita | `src/modules/clinical/dto/medication.dto.ts:593` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de vigencia | `src/modules/clinical/dto/medication.dto.ts:604` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fin de vigencia | `src/modules/clinical/dto/medication.dto.ts:612` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "doseText": "valor-ejemplo",
  "frequencyText": "valor-ejemplo",
  "quantityDecimal": 1,
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<MedicationRequestResponseDto>` · DTO `MedicationRequestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/medication.dto.ts:621` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/medication.dto.ts:627` |
| `formInstanceId` | `string` | No | formato uuid; admite null | — | Instancia del formulario médico de la que salió la receta (nulo = sin formulario) | `src/modules/clinical/dto/medication.dto.ts:638` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/medication.dto.ts:644` |
| `replacesRequestId` | `string` | No | formato uuid; admite null | — | Receta a la que esta sustituye | `src/modules/clinical/dto/medication.dto.ts:654` |
| `replacedByRequestId` | `string` | No | formato uuid; admite null | — | Receta que sustituye a esta | `src/modules/clinical/dto/medication.dto.ts:664` |
| `renewedFromRequestId` | `string` | No | formato uuid; admite null | — | Receta de la que esta es renovación | `src/modules/clinical/dto/medication.dto.ts:674` |
| `signedAt` | `string` | No | formato date-time; admite null | — | Instante de firma de la receta (nulo = sin firmar) | `src/modules/clinical/dto/medication.dto.ts:685` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/medication.dto.ts:691` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Receta no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo una receta emitida o completada puede renovarse |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical/controllers/clinical-records.controller.spec.ts:141` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 38. POST /clinical/medication-requests/{id}/replace

- **Origen:** CONTRATO
- **Nombre:** Reemplazar una receta emitida (crea la corrección)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.replaceMedicationRequest` — `src/modules/clinical/controllers/clinical-records.controller.ts:366`

### Qué es y para qué sirve (negocio)

Reemplazar una receta emitida (crea la corrección). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/medication-requests/{id}/replace` la atiende `ClinicalRecordsController.replaceMedicationRequest` (src/modules/clinical/controllers/clinical-records.controller.ts:366). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `ReplaceMedicationRequestDto` (10 campos, 1 obligatorio). Delega en `MedicationsService.replace`. Crea filas en audit.audit_log, audit.medication_requests_history, clinical.medication_requests. Actualiza audit.medication_requests_history, clinical.medication_requests. Lee audit.audit_log, audit.medication_requests_history, authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions y 12 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:366` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-records.controller.ts:366` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `audit.medication_requests_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationsService.versionRequest | `src/modules/clinical/services/medications.service.ts:345` |
| `audit.medication_requests_history` | ESCRIBE | CREA | POR_REGISTRO | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationsService.versionRequest | `src/modules/clinical/services/medications.service.ts:345` |
| `audit.medication_requests_history` | LEE | LEE | POR_REGISTRO | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationsService.versionRequest | `src/modules/clinical/services/medications.service.ts:345` |
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.medication_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace | `src/modules/clinical/services/medications.service.ts:770` |
| `clinical.medication_requests` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationRequestsRepository.create | `src/modules/clinical/repositories/medication-requests.repository.ts:196` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationsService.loadRequestForWrite → MedicationsService.loadRequestOrThrow → MedicationRequestsRepository.findById | `src/modules/clinical/repositories/medication-requests.repository.ts:147` |
| `iam.sessions` | LEE | LEE | POR_SQL | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ReplaceMedicationRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reasonText` | `string` | Sí | longitud máxima 1000 | `@IsString()` `@MaxLength(1000)` | Motivo de la corrección/reemplazo (obligatorio) | `src/modules/clinical/dto/medication.dto.ts:468` |
| `medicationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Medicamento (concept id) | `src/modules/clinical/dto/medication.dto.ts:479` |
| `substanceAtcConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sustancia ATC (concept id) | `src/modules/clinical/dto/medication.dto.ts:490` |
| `doseText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Dosis en texto libre | `src/modules/clinical/dto/medication.dto.ts:499` |
| `routeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Vía de administración (concept id) | `src/modules/clinical/dto/medication.dto.ts:510` |
| `frequencyText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Frecuencia en texto libre | `src/modules/clinical/dto/medication.dto.ts:522` |
| `quantityDecimal` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Cantidad prescrita | `src/modules/clinical/dto/medication.dto.ts:530` |
| `unitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad (concept id) | `src/modules/clinical/dto/medication.dto.ts:538` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de vigencia | `src/modules/clinical/dto/medication.dto.ts:549` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fin de vigencia | `src/modules/clinical/dto/medication.dto.ts:557` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reasonText": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reasonText": "Texto descriptivo de ejemplo",
  "medicationConceptId": "00000000-0000-4000-8000-000000000001",
  "substanceAtcConceptId": "00000000-0000-4000-8000-000000000001",
  "doseText": "valor-ejemplo",
  "routeConceptId": "00000000-0000-4000-8000-000000000001",
  "frequencyText": "valor-ejemplo",
  "quantityDecimal": 1,
  "unitConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<MedicationRequestResponseDto>` · DTO `MedicationRequestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/medication.dto.ts:621` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/medication.dto.ts:627` |
| `formInstanceId` | `string` | No | formato uuid; admite null | — | Instancia del formulario médico de la que salió la receta (nulo = sin formulario) | `src/modules/clinical/dto/medication.dto.ts:638` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/medication.dto.ts:644` |
| `replacesRequestId` | `string` | No | formato uuid; admite null | — | Receta a la que esta sustituye | `src/modules/clinical/dto/medication.dto.ts:654` |
| `replacedByRequestId` | `string` | No | formato uuid; admite null | — | Receta que sustituye a esta | `src/modules/clinical/dto/medication.dto.ts:664` |
| `renewedFromRequestId` | `string` | No | formato uuid; admite null | — | Receta de la que esta es renovación | `src/modules/clinical/dto/medication.dto.ts:674` |
| `signedAt` | `string` | No | formato date-time; admite null | — | Instante de firma de la receta (nulo = sin firmar) | `src/modules/clinical/dto/medication.dto.ts:685` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/medication.dto.ts:691` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Receta no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo una receta emitida (ISSUED) puede reemplazarse |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical/controllers/clinical-records.controller.spec.ts:130` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 39. POST /clinical/medication-requests/{id}/sign

- **Origen:** CONTRATO
- **Nombre:** Firmar una receta en borrador (DRAFT)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.signMedicationRequest` — `src/modules/clinical/controllers/clinical-records.controller.ts:316`

### Qué es y para qué sirve (negocio)

Firmar una receta en borrador (DRAFT). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/medication-requests/{id}/sign` la atiende `ClinicalRecordsController.signMedicationRequest` (src/modules/clinical/controllers/clinical-records.controller.ts:316). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `MedicationsService.sign`. Crea filas en audit.audit_log, audit.medication_requests_history. Actualiza audit.medication_requests_history, clinical.medication_requests. Lee audit.audit_log, audit.medication_requests_history, authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions y 12 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:316` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-records.controller.ts:316` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `audit.medication_requests_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → MedicationsService.versionRequest | `src/modules/clinical/services/medications.service.ts:345` |
| `audit.medication_requests_history` | ESCRIBE | CREA | POR_REGISTRO | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → MedicationsService.versionRequest | `src/modules/clinical/services/medications.service.ts:345` |
| `audit.medication_requests_history` | LEE | LEE | POR_REGISTRO | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → MedicationsService.versionRequest | `src/modules/clinical/services/medications.service.ts:345` |
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.medication_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign | `src/modules/clinical/services/medications.service.ts:531` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → MedicationsService.loadRequestForWrite → MedicationsService.loadRequestOrThrow → MedicationRequestsRepository.findById | `src/modules/clinical/repositories/medication-requests.repository.ts:147` |
| `iam.sessions` | LEE | LEE | POR_SQL | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → MedicationsService.loadRequestForWrite → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MedicationRequestResponseDto>` · DTO `MedicationRequestResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/medication.dto.ts:621` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/medication.dto.ts:627` |
| `formInstanceId` | `string` | No | formato uuid; admite null | — | Instancia del formulario médico de la que salió la receta (nulo = sin formulario) | `src/modules/clinical/dto/medication.dto.ts:638` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/medication.dto.ts:644` |
| `replacesRequestId` | `string` | No | formato uuid; admite null | — | Receta a la que esta sustituye | `src/modules/clinical/dto/medication.dto.ts:654` |
| `replacedByRequestId` | `string` | No | formato uuid; admite null | — | Receta que sustituye a esta | `src/modules/clinical/dto/medication.dto.ts:664` |
| `renewedFromRequestId` | `string` | No | formato uuid; admite null | — | Receta de la que esta es renovación | `src/modules/clinical/dto/medication.dto.ts:674` |
| `signedAt` | `string` | No | formato date-time; admite null | — | Instante de firma de la receta (nulo = sin firmar) | `src/modules/clinical/dto/medication.dto.ts:685` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/medication.dto.ts:691` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY}; ForbiddenException: Una receta la firma su prescriptor: no se puede firmar en nombre de otro profesional. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Receta no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo un borrador (DRAFT) puede firmarse antes de emitirse |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/clinical-prescriptions-pdf.int-spec.ts:192` |
| INTEGRACION | `test/integration/hardening/mch-007.int-spec.ts:258` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 40. POST /clinical/observations

- **Origen:** CONTRATO
- **Nombre:** Registrar una observación con componentes y ejecutantes
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalObservationsController.record` — `src/modules/clinical/controllers/clinical-observations.controller.ts:47`

### Qué es y para qué sirve (negocio)

Registrar una observación con componentes y ejecutantes. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/observations` la atiende `ClinicalObservationsController.record` (src/modules/clinical/controllers/clinical-observations.controller.ts:47). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateObservationDto` (39 campos, 3 obligatorios). Delega en `ObservationsService.record`. Crea filas en clinical.observation_components, clinical.observation_notes, clinical.observation_performers, clinical.observation_reference_ranges, clinical.observations. Lee clinical.encounters, clinical.service_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-observations.controller.ts:47` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalObservationsController.record → ObservationsService.record → ObservationsService.assertReferencesBelongToPatient → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:174` |
| `clinical.observation_components` | ESCRIBE | CREA | DIRECTA | ClinicalObservationsController.record → ObservationsService.record → ObservationsRepository.createComponent | `src/modules/clinical/repositories/observations.repository.ts:346` |
| `clinical.observation_notes` | ESCRIBE | CREA | DIRECTA | ClinicalObservationsController.record → ObservationsService.record → ObservationsRepository.createNote | `src/modules/clinical/repositories/observations.repository.ts:435` |
| `clinical.observation_performers` | ESCRIBE | CREA | DIRECTA | ClinicalObservationsController.record → ObservationsService.record → ObservationsRepository.createPerformer | `src/modules/clinical/repositories/observations.repository.ts:412` |
| `clinical.observation_reference_ranges` | ESCRIBE | CREA | DIRECTA | ClinicalObservationsController.record → ObservationsService.record → ObservationsRepository.createReferenceRange | `src/modules/clinical/repositories/observations.repository.ts:382` |
| `clinical.observations` | ESCRIBE | CREA | DIRECTA | ClinicalObservationsController.record → ObservationsService.record → ObservationsRepository.create | `src/modules/clinical/repositories/observations.repository.ts:300` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | ClinicalObservationsController.record → ObservationsService.record → ObservationsService.assertReferencesBelongToPatient → ServiceRequestsRepository.findById | `src/modules/clinical/repositories/service-requests.repository.ts:107` |

### Cuerpo — DTO `CreateObservationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `valueTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de valor (concept id) | `src/modules/clinical/dto/observation.dto.ts:28` |
| `valueDecimal` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Valor decimal | `src/modules/clinical/dto/observation.dto.ts:36` |
| `valueBoolean` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Valor booleano | `src/modules/clinical/dto/observation.dto.ts:44` |
| `valueText` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Valor de texto | `src/modules/clinical/dto/observation.dto.ts:53` |
| `valueConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Valor codificado (concept id) | `src/modules/clinical/dto/observation.dto.ts:64` |
| `quantityValue` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Magnitud de la cantidad | `src/modules/clinical/dto/observation.dto.ts:72` |
| `quantityUnitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad de la cantidad (concept id) | `src/modules/clinical/dto/observation.dto.ts:83` |
| `custodianTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant custodio (directory.tenants) | `src/modules/clinical/dto/observation.dto.ts:190` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente (profiles.patient_profiles) | `src/modules/clinical/dto/observation.dto.ts:200` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro en curso | `src/modules/clinical/dto/observation.dto.ts:208` |
| `basedOnServiceRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Orden de servicio que la origina | `src/modules/clinical/dto/observation.dto.ts:219` |
| `codeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Código de la observación (concept id) | `src/modules/clinical/dto/observation.dto.ts:229` |
| `categoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Categoría (concept id) | `src/modules/clinical/dto/observation.dto.ts:240` |
| `interpretationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Interpretación (concept id) | `src/modules/clinical/dto/observation.dto.ts:251` |
| `methodConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Método (concept id) | `src/modules/clinical/dto/observation.dto.ts:259` |
| `bodySiteConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sitio anatómico (concept id) | `src/modules/clinical/dto/observation.dto.ts:270` |
| `sourceDeviceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Dispositivo de origen | `src/modules/clinical/dto/observation.dto.ts:278` |
| `effectiveStartAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de vigencia clínica | `src/modules/clinical/dto/observation.dto.ts:289` |
| `issuedAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Momento de emisión | `src/modules/clinical/dto/observation.dto.ts:300` |
| `components` | `array<ObservationComponentInput>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ObservationComponentInput)` | — | `src/modules/clinical/dto/observation.dto.ts:310` |
| `components[].valueTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de valor (concept id) | `src/modules/clinical/dto/observation.dto.ts:28` |
| `components[].valueDecimal` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Valor decimal | `src/modules/clinical/dto/observation.dto.ts:36` |
| `components[].valueBoolean` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Valor booleano | `src/modules/clinical/dto/observation.dto.ts:44` |
| `components[].valueText` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Valor de texto | `src/modules/clinical/dto/observation.dto.ts:53` |
| `components[].valueConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Valor codificado (concept id) | `src/modules/clinical/dto/observation.dto.ts:64` |
| `components[].quantityValue` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Magnitud de la cantidad | `src/modules/clinical/dto/observation.dto.ts:72` |
| `components[].quantityUnitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad de la cantidad (concept id) | `src/modules/clinical/dto/observation.dto.ts:83` |
| `components[].codeConceptId` | `string` | No | formato uuid | `@IsUUID()` | Código del componente (concept id) | `src/modules/clinical/dto/observation.dto.ts:96` |
| `components[].interpretationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Interpretación (concept id) | `src/modules/clinical/dto/observation.dto.ts:107` |
| `performers` | `array<ObservationPerformerInput>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ObservationPerformerInput)` | — | `src/modules/clinical/dto/observation.dto.ts:320` |
| `performers[].performerTypeConceptId` | `string` | No | formato uuid | `@IsUUID()` | Tipo de ejecutante (concept id) | `src/modules/clinical/dto/observation.dto.ts:120` |
| `performers[].performerId` | `string` | No | formato uuid | `@IsUUID()` | Id del ejecutante (profesional/dispositivo) | `src/modules/clinical/dto/observation.dto.ts:130` |
| `performers[].performerRoleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Rol del ejecutante (concept id) | `src/modules/clinical/dto/observation.dto.ts:141` |
| `referenceRanges` | `array<ObservationReferenceRangeInput>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ObservationReferenceRangeInput)` | — | `src/modules/clinical/dto/observation.dto.ts:330` |
| `referenceRanges[].lowValue` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Límite inferior | `src/modules/clinical/dto/observation.dto.ts:152` |
| `referenceRanges[].highValue` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Límite superior | `src/modules/clinical/dto/observation.dto.ts:160` |
| `referenceRanges[].unitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad (concept id) | `src/modules/clinical/dto/observation.dto.ts:168` |
| `referenceRanges[].text` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Texto libre del rango | `src/modules/clinical/dto/observation.dto.ts:177` |
| `notes` | `array<string>` | No | longitud máxima 1000 | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` `@MaxLength(1000, { each: true })` | Notas de la observación | `src/modules/clinical/dto/observation.dto.ts:343` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "valueTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "valueDecimal": 1,
  "valueBoolean": true,
  "valueText": "valor-ejemplo",
  "valueConceptId": "00000000-0000-4000-8000-000000000001",
  "quantityValue": 1,
  "quantityUnitConceptId": "00000000-0000-4000-8000-000000000001",
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "basedOnServiceRequestId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001",
  "categoryConceptId": "00000000-0000-4000-8000-000000000001",
  "interpretationConceptId": "00000000-0000-4000-8000-000000000001",
  "methodConceptId": "00000000-0000-4000-8000-000000000001",
  "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
  "sourceDeviceId": "00000000-0000-4000-8000-000000000001",
  "effectiveStartAt": "2026-07-31T12:00:00.000Z",
  "issuedAt": "2026-07-31T12:00:00.000Z",
  "components": [
    {
      "valueTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "valueDecimal": 1,
      "valueBoolean": true,
      "valueText": "valor-ejemplo",
      "valueConceptId": "00000000-0000-4000-8000-000000000001",
      "quantityValue": 1,
      "quantityUnitConceptId": "00000000-0000-4000-8000-000000000001",
      "codeConceptId": "00000000-0000-4000-8000-000000000001",
      "interpretationConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "performers": [
    {
      "performerTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "performerId": "00000000-0000-4000-8000-000000000001",
      "performerRoleConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "referenceRanges": [
    {
      "lowValue": 1,
      "highValue": 1,
      "unitConceptId": "00000000-0000-4000-8000-000000000001",
      "text": "valor-ejemplo"
    }
  ],
  "notes": [
    "Texto descriptivo de ejemplo"
  ]
}
```

</details>

### Respuesta — `Promise<ObservationResponseDto>` · DTO `ObservationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/observation.dto.ts:388` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | sin fuente |
| `duplicate` | `boolean` | Sí | — | — | true si ya se había recogido el mismo contenido en la corrida | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado; ResourceNotFoundException: Orden de servicio no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El encuentro ya está cerrado y sellado: no admite más escrituras.; PreconditionFailedException: La observación requiere un valor (cantidad, decimal, texto, booleano o concepto) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/br14-encuentros-seguridad-clinica.int-spec.ts:172` |
| INTEGRACION | `test/integration/clinical-c14-c23-notas-e-internacion.int-spec.ts:193` |
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:633` |
| INTEGRACION | `test/integration/hardening/mch-008.int-spec.ts:84` |
| CONTROLADOR | `src/modules/clinical/controllers/clinical-observations.controller.spec.ts:35` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalObservationsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 41. PATCH /clinical/observations/{id}/amend

- **Origen:** CONTRATO
- **Nombre:** Corregir/enmendar una observación (value contract)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalObservationsController.amend` — `src/modules/clinical/controllers/clinical-observations.controller.ts:66`

### Qué es y para qué sirve (negocio)

Corregir/enmendar una observación (value contract). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /clinical/observations/{id}/amend` la atiende `ClinicalObservationsController.amend` (src/modules/clinical/controllers/clinical-observations.controller.ts:66). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `AmendObservationDto` (10 campos, 1 obligatorio). Delega en `ObservationsService.amend`. Crea filas en clinical.observation_notes. Actualiza clinical.observations. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 10 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-observations.controller.ts:66` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-observations.controller.ts:66` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalObservationsController.amend → ObservationsService.amend → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalObservationsController.amend → ObservationsService.amend → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalObservationsController.amend → ObservationsService.amend → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalObservationsController.amend → ObservationsService.amend → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalObservationsController.amend → ObservationsService.amend → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalObservationsController.amend → ObservationsService.amend → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalObservationsController.amend → ObservationsService.amend → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalObservationsController.amend → ObservationsService.amend → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalObservationsController.amend → ObservationsService.amend → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalObservationsController.amend → ObservationsService.amend → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalObservationsController.amend → ObservationsService.amend → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.observation_components` | LEE | LEE | DIRECTA | ClinicalObservationsController.amend → ObservationsService.amend → ObservationsRepository.findComponents | `src/modules/clinical/repositories/observations.repository.ts:458` |
| `clinical.observation_notes` | ESCRIBE | CREA | DIRECTA | ClinicalObservationsController.amend → ObservationsService.amend → ObservationsRepository.createNote | `src/modules/clinical/repositories/observations.repository.ts:435` |
| `clinical.observations` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalObservationsController.amend → ObservationsService.amend | `src/modules/clinical/services/observations.service.ts:357` |
| `clinical.observations` | LEE | LEE | DIRECTA | ClinicalObservationsController.amend → ObservationsService.amend → ObservationsRepository.findById | `src/modules/clinical/repositories/observations.repository.ts:289` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalObservationsController.amend → ObservationsService.amend → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalObservationsController.amend → ObservationsService.amend → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalObservationsController.amend → ObservationsService.amend → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalObservationsController.amend → ObservationsService.amend → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalObservationsController.amend → ObservationsService.amend → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AmendObservationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `valueTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de valor (concept id) | `src/modules/clinical/dto/observation.dto.ts:28` |
| `valueDecimal` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Valor decimal | `src/modules/clinical/dto/observation.dto.ts:36` |
| `valueBoolean` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Valor booleano | `src/modules/clinical/dto/observation.dto.ts:44` |
| `valueText` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Valor de texto | `src/modules/clinical/dto/observation.dto.ts:53` |
| `valueConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Valor codificado (concept id) | `src/modules/clinical/dto/observation.dto.ts:64` |
| `quantityValue` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Magnitud de la cantidad | `src/modules/clinical/dto/observation.dto.ts:72` |
| `quantityUnitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad de la cantidad (concept id) | `src/modules/clinical/dto/observation.dto.ts:83` |
| `note` | `string` | Sí | longitud máxima 1000 | `@IsString()` `@MaxLength(1000)` | Nota que justifica la enmienda | `src/modules/clinical/dto/observation.dto.ts:357` |
| `expectedRowVersion` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | row_version esperado (bloqueo optimista) | `src/modules/clinical/dto/observation.dto.ts:368` |
| `interpretationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Interpretación revisada (concept id) | `src/modules/clinical/dto/observation.dto.ts:379` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "note": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "valueTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "valueDecimal": 1,
  "valueBoolean": true,
  "valueText": "valor-ejemplo",
  "valueConceptId": "00000000-0000-4000-8000-000000000001",
  "quantityValue": 1,
  "quantityUnitConceptId": "00000000-0000-4000-8000-000000000001",
  "note": "valor-ejemplo",
  "expectedRowVersion": 1,
  "interpretationConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ObservationResponseDto>` · DTO `ObservationResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/observation.dto.ts:388` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | sin fuente |
| `duplicate` | `boolean` | Sí | — | — | true si ya se había recogido el mismo contenido en la corrida | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Observación no encontrada |
| 409 | `CONCURRENCY_CONFLICT` | ConcurrencyConflictException: Versión de la observación desactualizada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La observación no admite enmienda en su estado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical/controllers/clinical-observations.controller.spec.ts:44` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalObservationsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 42. GET /clinical/patients/{id}/inpatient-stay

- **Origen:** CONTRATO
- **Nombre:** Estancia de internación vigente del paciente
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalAdtController.currentStay` — `src/modules/clinical/controllers/clinical-adt.controller.ts:269`

### Qué es y para qué sirve (negocio)

Estancia de internación vigente del paciente. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /clinical/patients/{id}/inpatient-stay` la atiende `ClinicalAdtController.currentStay` (src/modules/clinical/controllers/clinical-adt.controller.ts:269). Exige sesión; el controlador no declara roles. Delega en `InpatientAdtService.currentStayOfPatient`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 22 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical/controllers/clinical-adt.controller.ts:269` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-adt.controller.ts:269` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.encounter_locations` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → InpatientReadUseCases.stay | `src/modules/clinical/services/inpatient/inpatient-read.use-cases.ts:275` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → InpatientReadUseCases.stay → AdtSupport.encounter | `src/modules/clinical/services/inpatient/adt-support.ts:128` |
| `clinical.patient_admission_footprints (vista u objeto no catalogado)` | LEE | LEE | POR_SQL | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant → AuthzClinicalScopeRepository.hasAdmissionFootprint | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:124` |
| `clinical.placement_incidents` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → InpatientReadUseCases.stay | `src/modules/clinical/services/inpatient/inpatient-read.use-cases.ts:281` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → InfrastructureAccessService.canAnywhere → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → InfrastructureAccessService.canAnywhere → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:106` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.practices` | LEE | LEE | POR_SQL | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → InfrastructureAccessService.canAnywhere | `src/modules/practice/services/infrastructure-access.service.ts:616` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → InpatientReadUseCases.stay → InpatientReadUseCases.authorizeStay → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpaceOpsRepository.unitsOf | `src/modules/practice/repositories/care-space-ops.repository.ts:146` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → ClinicalReadService.assertCanReadHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientExists | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:40` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:92` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:98` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalAdtController.currentStay → InpatientAdtService.currentStayOfPatient → InpatientReadUseCases.currentStayOfPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

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
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-web-f2f3.int-spec.ts:184` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalAdtController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 43. GET /clinical/patients/{patientProfileId}/received-services

- **Origen:** CONTRATO
- **Nombre:** Servicios recibidos del paciente: intervenciones médicas realizadas y vacunas
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalReadController.getReceivedServices` — `src/modules/clinical/controllers/clinical-read.controller.ts:110`

### Qué es y para qué sirve (negocio)

Servicios recibidos del paciente: intervenciones médicas realizadas y vacunas. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /clinical/patients/{patientProfileId}/received-services` la atiende `ClinicalReadController.getReceivedServices` (src/modules/clinical/controllers/clinical-read.controller.ts:110). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, PATIENT. Delega en `ReceivedServicesReadService.list`. Lee billing.invoice_lines, billing.invoices, clinical.received_services, practice.practice_sites, procedures_perioperative.procedure_cases, procedures_perioperative.procedure_charge_items.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, PATIENT | `src/modules/clinical/controllers/clinical-read.controller.ts:110` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: patientProfileId | `src/modules/clinical/controllers/clinical-read.controller.ts:110` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.invoice_lines` | LEE | LEE | DIRECTA | ClinicalReadController.getReceivedServices → ReceivedServicesReadService.list → ReceivedServicesReadService.costsOf → ReceivedServicesRepository.findInvoiceLineAmounts | `src/modules/clinical/repositories/received-services.repository.ts:268` |
| `billing.invoices` | LEE | LEE | DIRECTA | ClinicalReadController.getReceivedServices → ReceivedServicesReadService.list → ReceivedServicesReadService.costsOf → ReceivedServicesRepository.findInvoiceLineAmounts | `src/modules/clinical/repositories/received-services.repository.ts:272` |
| `clinical.received_services` | LEE | LEE | DIRECTA | ClinicalReadController.getReceivedServices → ReceivedServicesReadService.list → ReceivedServicesRepository.findByPatient | `src/modules/clinical/repositories/received-services.repository.ts:195` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalReadController.getReceivedServices → ReceivedServicesReadService.list → ReceivedServicesRepository.findSiteNames | `src/modules/clinical/repositories/received-services.repository.ts:258` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | ClinicalReadController.getReceivedServices → ReceivedServicesReadService.list → ReceivedServicesReadService.costsOf → ReceivedServicesRepository.findChargeLines | `src/modules/clinical/repositories/received-services.repository.ts:221` |
| `procedures_perioperative.procedure_charge_items` | LEE | LEE | DIRECTA | ClinicalReadController.getReceivedServices → ReceivedServicesReadService.list → ReceivedServicesReadService.costsOf → ReceivedServicesRepository.findChargeLines | `src/modules/clinical/repositories/received-services.repository.ts:219` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | — |
| `limit` | query | No | `number` | Tope de la lista (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientReceivedServicesResponseDto>` · DTO `PatientReceivedServicesResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | — | Paciente de quien se lee. | `src/modules/clinical/dto/received-services.dto.ts:96` |
| `items` | `array<ReceivedServiceItemDto>` | Sí | — | — | Servicios, el más reciente primero. | `src/modules/clinical/dto/received-services.dto.ts:100` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del servicio recibido. | `src/modules/clinical/dto/received-services.dto.ts:34` |
| `items[].type` | `object` | Sí | — | — | Tipo de servicio: intervención médica, vacunación u otro. | `src/modules/clinical/dto/received-services.dto.ts:38` |
| `items[].typeConceptId` | `string` | Sí | formato uuid | — | Concepto del tipo, para resolver su etiqueta en terminología. | `src/modules/clinical/dto/received-services.dto.ts:42` |
| `items[].serviceConceptId` | `string` | Sí | formato uuid | — | Qué se hizo: el código del procedimiento, de la vacuna o del tipo de caso. | `src/modules/clinical/dto/received-services.dto.ts:46` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Estado del servicio. | `src/modules/clinical/dto/received-services.dto.ts:50` |
| `items[].performedAt` | `string` | Sí | formato date-time | — | Cuándo se realizó. | `src/modules/clinical/dto/received-services.dto.ts:54` |
| `items[].performerProfileId` | `string` | No | formato uuid | — | Profesional que lo realizó. | `src/modules/clinical/dto/received-services.dto.ts:58` |
| `items[].performerName` | `string` | No | — | — | Nombre del profesional, ya resuelto: el paciente no puede leer el padrón de profesionales, así que no podría resolverlo desde `performerProfileId`. | `src/modules/clinical/dto/received-services.dto.ts:65` |
| `items[].practiceSiteId` | `string` | No | formato uuid | — | Sede donde se realizó. | `src/modules/clinical/dto/received-services.dto.ts:69` |
| `items[].practiceSiteName` | `string` | No | — | — | Nombre de la sede, ya resuelto. | `src/modules/clinical/dto/received-services.dto.ts:73` |
| `items[].encounterId` | `string` | No | formato uuid | — | Atención en la que ocurrió. | `src/modules/clinical/dto/received-services.dto.ts:77` |
| `items[].outcomeConceptId` | `string` | No | formato uuid | — | Resultado del servicio, como concepto. | `src/modules/clinical/dto/received-services.dto.ts:81` |
| `items[].resultText` | `string` | No | — | — | Nota o resultado en texto libre que dejó quien lo realizó. | `src/modules/clinical/dto/received-services.dto.ts:85` |
| `items[].cost` | `ReceivedServiceCostDto` | Sí | — | — | Costo registrado. `null` si no hay cobro registrado o si quien pide no ve importes. | `src/modules/clinical/dto/received-services.dto.ts:89` |
| `items[].cost.amount` | `string` | Sí | — | — | Importe decimal exacto; nunca un número de coma flotante. | `src/modules/clinical/dto/received-services.dto.ts:19` |
| `items[].cost.currencyCode` | `string` | Sí | admite null | — | Código de moneda (`BOB`, `USD`), o `null` si el cargo no lo declara. | `src/modules/clinical/dto/received-services.dto.ts:23` |
| `items[].cost.source` | `string` | Sí | valores: INVOICE_LINE, CHARGE_ITEMS | — | De dónde sale el importe: la línea de factura enlazada o la suma de los cargos del caso. | `src/modules/clinical/dto/received-services.dto.ts:27` |
| `limit` | `number` | Sí | — | — | Tope aplicado a la lista | `src/modules/clinical/dto/received-services.dto.ts:104` |
| `truncated` | `boolean` | Sí | — | — | `true` si hay más servicios de los que el tope dejó pasar. | `src/modules/clinical/dto/received-services.dto.ts:108` |
| `costsVisible` | `boolean` | Sí | — | — | Si quien pide ve importes. Solo los ve el titular o quien lo representa: el personal clínico lee el servicio sin el dinero. Con `false`, todo `cost` es `null` y no significa «sin cobro». | `src/modules/clinical/dto/received-services.dto.ts:116` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 44. GET /clinical/patients/{patientProfileId}/summary

- **Origen:** CONTRATO
- **Nombre:** UC-39-20: historial clínico del paciente (condiciones, alergias, medicación, observaciones, encuentros)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalReadController.getPatientSummary` — `src/modules/clinical/controllers/clinical-read.controller.ts:75`

### Qué es y para qué sirve (negocio)

UC-39-20: historial clínico del paciente (condiciones, alergias, medicación, observaciones, encuentros). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /clinical/patients/{patientProfileId}/summary` la atiende `ClinicalReadController.getPatientSummary` (src/modules/clinical/controllers/clinical-read.controller.ts:75). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, PATIENT. Delega en `ClinicalReadService.getPatientSummary`. Crea filas en audit.data_access_log. Lee audit.conditions_history, clinical.allergy_intolerances, clinical.allergy_reactions, clinical.care_episodes, clinical.conditions, clinical.encounters, clinical.medication_requests, clinical.observations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, PATIENT | `src/modules/clinical/controllers/clinical-read.controller.ts:75` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: patientProfileId | `src/modules/clinical/controllers/clinical-read.controller.ts:75` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.conditions_history` | LEE | LEE | POR_REGISTRO | ClinicalReadController.getPatientSummary → ClinicalReadService.getPatientSummary | `src/modules/clinical/services/clinical-read.service.ts:685` |
| `audit.data_access_log` | ESCRIBE | CREA | DIRECTA | ClinicalReadController.getPatientSummary → ClinicalReadService.getPatientSummary → DataAccessLogRepository.record | `src/modules/audit/repositories/data-access-log.repository.ts:98` |
| `clinical.allergy_intolerances` | LEE | LEE | DIRECTA | ClinicalReadController.getPatientSummary → ClinicalReadService.getPatientSummary → AllergyIntolerancesRepository.findByPatient | `src/modules/clinical/repositories/allergy-intolerances.repository.ts:102` |
| `clinical.allergy_reactions` | LEE | LEE | DIRECTA | ClinicalReadController.getPatientSummary → ClinicalReadService.getPatientSummary → AllergyReactionsReadRepository.findByAllergyIds | `src/modules/clinical/repositories/allergy-reactions-read.repository.ts:32` |
| `clinical.care_episodes` | LEE | LEE | DIRECTA | ClinicalReadController.getPatientSummary → ClinicalReadService.getPatientSummary → CareEpisodesRepository.findByPatient | `src/modules/clinical/repositories/care-episodes.repository.ts:85` |
| `clinical.conditions` | LEE | LEE | DIRECTA | ClinicalReadController.getPatientSummary → ClinicalReadService.getPatientSummary → ConditionsRepository.findByPatient | `src/modules/clinical/repositories/conditions.repository.ts:92` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalReadController.getPatientSummary → ClinicalReadService.getPatientSummary → EncountersRepository.findByPatient | `src/modules/clinical/repositories/encounters.repository.ts:159` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalReadController.getPatientSummary → ClinicalReadService.getPatientSummary → MedicationRequestsRepository.findByPatient | `src/modules/clinical/repositories/medication-requests.repository.ts:132` |
| `clinical.observations` | LEE | LEE | DIRECTA | ClinicalReadController.getPatientSummary → ClinicalReadService.getPatientSummary → ObservationsRepository.findByPatient | `src/modules/clinical/repositories/observations.repository.ts:274` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | — |
| `limit` | query | No | `number` | Tope aplicado a cada bloque (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientClinicalSummaryResponseDto>` · DTO `PatientClinicalSummaryResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/clinical-read.dto.ts:557` |
| `conditions` | `array<ConditionItemDto>` | Sí | — | — | Valor de conditions mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:563` |
| `conditions[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:92` |
| `conditions[].codeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a code concept. | `src/modules/clinical/dto/clinical-read.dto.ts:98` |
| `conditions[].categoryConceptId` | `string` | No | formato uuid | — | Identificador asociado a category concept. | `src/modules/clinical/dto/clinical-read.dto.ts:104` |
| `conditions[].clinicalStatusConceptId` | `string` | No | formato uuid | — | Identificador asociado a clinical status concept. | `src/modules/clinical/dto/clinical-read.dto.ts:110` |
| `conditions[].verificationStatusConceptId` | `string` | No | formato uuid | — | Identificador asociado a verification status concept. | `src/modules/clinical/dto/clinical-read.dto.ts:116` |
| `conditions[].severityConceptId` | `string` | No | formato uuid | — | Identificador asociado a severity concept. | `src/modules/clinical/dto/clinical-read.dto.ts:122` |
| `conditions[].encounterId` | `string` | No | formato uuid | — | Identificador asociado a encounter. | `src/modules/clinical/dto/clinical-read.dto.ts:128` |
| `conditions[].clinicalCourseConceptId` | `string` | No | formato uuid | — | Identificador asociado a clinical course concept (Patch v4.0.8). | `src/modules/clinical/dto/clinical-read.dto.ts:134` |
| `conditions[].lateralityConceptId` | `string` | No | formato uuid | — | Lateralidad de la condición (columna existente en el modelo; BR-14/CL-11). | `src/modules/clinical/dto/clinical-read.dto.ts:140` |
| `conditions[].onsetAt` | `string` | No | formato date-time | — | Valor de onset at mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:146` |
| `conditions[].expectedResolutionAt` | `string` | No | formato date-time | — | Fecha esperada de resolución o próxima revisión (Patch v4.0.8). | `src/modules/clinical/dto/clinical-read.dto.ts:152` |
| `conditions[].resolvedAt` | `string` | No | formato date-time | — | Valor de resolved at mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:158` |
| `conditions[].noteText` | `string` | No | — | — | Hallazgos y justificación clínica (Patch v4.1.3). | `src/modules/clinical/dto/clinical-read.dto.ts:164` |
| `conditions[].lastStatusChangeReasonText` | `string` | No | — | — | Motivo del último cambio de estado clínico, si hubo alguno | `src/modules/clinical/dto/clinical-read.dto.ts:175` |
| `conditions[].verification` | `ConditionVerificationDto` | No | — | — | Decisión de verificación (C3 / P41), o `null` si el diagnóstico nunca se confirmó ni refutó por `POST /clinical/conditions/:id/verification`. | `src/modules/clinical/dto/clinical-read.dto.ts:182` |
| `conditions[].verification.outcome` | `string` | No | valores: CONFIRMED, REFUTED | — | `CONFIRMED` o `REFUTED`. | `src/modules/clinical/dto/clinical-read.dto.ts:67` |
| `conditions[].verification.decidedAt` | `string` | No | formato date-time | — | Instante de la decisión, ISO. | `src/modules/clinical/dto/clinical-read.dto.ts:71` |
| `conditions[].verification.decidedByProfileId` | `string` | No | formato uuid | — | Perfil profesional que decidió. | `src/modules/clinical/dto/clinical-read.dto.ts:75` |
| `conditions[].verification.reasonText` | `string` | No | admite null | — | Motivo escrito, o `null`. | `src/modules/clinical/dto/clinical-read.dto.ts:79` |
| `conditions[].verification.basedOn` | `ConditionVerificationEvidenceDto` | No | — | — | Evidencia elegida, o `null`. | `src/modules/clinical/dto/clinical-read.dto.ts:83` |
| `conditions[].verification.basedOn.kind` | `string` | No | valores: NOTE, ANALYSIS | — | `NOTE` o `ANALYSIS`. | `src/modules/clinical/dto/clinical-read.dto.ts:38` |
| `conditions[].verification.basedOn.noteId` | `string` | No | formato uuid | — | Nota clínica que respalda la decisión. | `src/modules/clinical/dto/clinical-read.dto.ts:42` |
| `conditions[].verification.basedOn.encounterId` | `string` | No | formato uuid | — | Encuentro de la nota. | `src/modules/clinical/dto/clinical-read.dto.ts:46` |
| `conditions[].verification.basedOn.serviceRequestId` | `string` | No | formato uuid | — | Orden de estudio. | `src/modules/clinical/dto/clinical-read.dto.ts:50` |
| `conditions[].verification.basedOn.diagnosticReportId` | `string` | No | formato uuid | — | Informe del estudio. | `src/modules/clinical/dto/clinical-read.dto.ts:54` |
| `conditions[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/clinical-read.dto.ts:188` |
| `allergies` | `array<AllergyItemDto>` | Sí | — | — | Valor de allergies mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:569` |
| `allergies[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:197` |
| `allergies[].substanceConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a substance concept. | `src/modules/clinical/dto/clinical-read.dto.ts:203` |
| `allergies[].encounterId` | `string` | No | formato uuid | — | Encuentro en el que se detectó, si se registró dentro de una atención (P26). | `src/modules/clinical/dto/clinical-read.dto.ts:209` |
| `allergies[].typeConceptId` | `string` | No | formato uuid | — | Identificador asociado a type concept. | `src/modules/clinical/dto/clinical-read.dto.ts:215` |
| `allergies[].categoryConceptId` | `string` | No | formato uuid | — | Identificador asociado a category concept. | `src/modules/clinical/dto/clinical-read.dto.ts:221` |
| `allergies[].criticalityConceptId` | `string` | No | formato uuid | — | Identificador asociado a criticality concept. | `src/modules/clinical/dto/clinical-read.dto.ts:227` |
| `allergies[].clinicalStatusConceptId` | `string` | No | formato uuid | — | Identificador asociado a clinical status concept. | `src/modules/clinical/dto/clinical-read.dto.ts:233` |
| `allergies[].reactions` | `array<AllergyReactionItemDto>` | Sí | — | — | Reacciones registradas de esta alergia (BR-14/CL-11: la tabla existe y se escribía; el resumen no la leía). | `src/modules/clinical/dto/clinical-read.dto.ts:240` |
| `allergies[].reactions[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:13` |
| `allergies[].reactions[].manifestationConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a manifestation concept. | `src/modules/clinical/dto/clinical-read.dto.ts:19` |
| `allergies[].reactions[].severityConceptId` | `string` | No | formato uuid | — | Identificador asociado a severity concept. | `src/modules/clinical/dto/clinical-read.dto.ts:25` |
| `allergies[].reactions[].description` | `string` | No | — | — | Descripción libre de la reacción. | `src/modules/clinical/dto/clinical-read.dto.ts:31` |
| `allergies[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/clinical-read.dto.ts:246` |
| `medicationRequests` | `array<MedicationRequestItemDto>` | Sí | — | — | Valor de medication requests mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:575` |
| `medicationRequests[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:255` |
| `medicationRequests[].medicationConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a medication concept. | `src/modules/clinical/dto/clinical-read.dto.ts:261` |
| `medicationRequests[].statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/clinical/dto/clinical-read.dto.ts:267` |
| `medicationRequests[].prescriberProfileId` | `string` | No | formato uuid | — | Identificador asociado a prescriber profile. | `src/modules/clinical/dto/clinical-read.dto.ts:273` |
| `medicationRequests[].encounterId` | `string` | No | formato uuid | — | Encuentro en el que se prescribió (columna existente en el modelo; BR-14/CL-11: `ConditionItemDto` y `ObservationItemDto` ya lo exponían, la receta no). | `src/modules/clinical/dto/clinical-read.dto.ts:281` |
| `medicationRequests[].formInstanceId` | `string` | No | formato uuid | — | P43: instancia del formulario médico de la que salió la receta, si salió de uno. | `src/modules/clinical/dto/clinical-read.dto.ts:285` |
| `medicationRequests[].doseText` | `string` | No | — | — | Valor de dose text mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:291` |
| `medicationRequests[].frequencyText` | `string` | No | — | — | Valor de frequency text mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:297` |
| `medicationRequests[].quantityDecimal` | `number` | No | — | — | Cantidad recetada, si la receta la declara. Ausente si no fija cantidad. | `src/modules/clinical/dto/clinical-read.dto.ts:303` |
| `medicationRequests[].validFrom` | `string` | No | formato date-time | — | Valor de valid from mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:309` |
| `medicationRequests[].validTo` | `string` | No | formato date-time | — | Valor de valid to mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:315` |
| `medicationRequests[].patientInstructionsText` | `string` | No | — | — | Indicaciones al paciente impresas en la receta (Patch v4.1.3). | `src/modules/clinical/dto/clinical-read.dto.ts:321` |
| `medicationRequests[].indicationConditionId` | `string` | No | formato uuid | — | Condición que motiva la prescripción — para qué es la receta (Patch v4.1.6). | `src/modules/clinical/dto/clinical-read.dto.ts:327` |
| `medicationRequests[].indicationText` | `string` | No | — | — | Motivo escrito a mano cuando no hay condición codificada (P24). | `src/modules/clinical/dto/clinical-read.dto.ts:333` |
| `medicationRequests[].signedAt` | `string` | No | formato date-time | — | Valor de signed at mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:339` |
| `medicationRequests[].issuedAt` | `string` | No | formato date-time | — | Valor de issued at mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:345` |
| `medicationRequests[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/clinical-read.dto.ts:351` |
| `observations` | `array<ObservationItemDto>` | Sí | — | — | Valor de observations mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:581` |
| `observations[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:360` |
| `observations[].codeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a code concept. | `src/modules/clinical/dto/clinical-read.dto.ts:366` |
| `observations[].statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/clinical/dto/clinical-read.dto.ts:372` |
| `observations[].interpretationConceptId` | `string` | No | formato uuid | — | Identificador asociado a interpretation concept. | `src/modules/clinical/dto/clinical-read.dto.ts:378` |
| `observations[].valueDecimal` | `string` | No | — | — | Valor de value decimal mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:384` |
| `observations[].valueText` | `string` | No | — | — | Valor de value text mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:390` |
| `observations[].valueBoolean` | `boolean` | No | — | — | Valor de value boolean mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:396` |
| `observations[].valueConceptId` | `string` | No | formato uuid | — | Identificador asociado a value concept. | `src/modules/clinical/dto/clinical-read.dto.ts:402` |
| `observations[].quantityValue` | `string` | No | — | — | Valor de quantity value mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:408` |
| `observations[].quantityUnitConceptId` | `string` | No | formato uuid | — | Identificador asociado a quantity unit concept. | `src/modules/clinical/dto/clinical-read.dto.ts:414` |
| `observations[].effectiveStartAt` | `string` | No | formato date-time | — | Valor de effective start at mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:420` |
| `observations[].encounterId` | `string` | No | formato uuid | — | Identificador asociado a encounter. | `src/modules/clinical/dto/clinical-read.dto.ts:426` |
| `encounters` | `array<EncounterItemDto>` | Sí | — | — | Valor de encounters mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:587` |
| `encounters[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:435` |
| `encounters[].episodeId` | `string` | No | formato uuid | — | Identificador asociado a episode. | `src/modules/clinical/dto/clinical-read.dto.ts:441` |
| `encounters[].statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/clinical/dto/clinical-read.dto.ts:447` |
| `encounters[].classConceptId` | `string` | No | formato uuid | — | Identificador asociado a class concept. | `src/modules/clinical/dto/clinical-read.dto.ts:453` |
| `encounters[].primaryPractitionerId` | `string` | No | formato uuid | — | Identificador asociado a primary practitioner. | `src/modules/clinical/dto/clinical-read.dto.ts:459` |
| `encounters[].reasonText` | `string` | No | — | — | Valor de reason text mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:465` |
| `encounters[].startAt` | `string` | No | formato date-time | — | Valor de start at mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:471` |
| `encounters[].endAt` | `string` | No | formato date-time | — | Valor de end at mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:477` |
| `encounters[].rowVersion` | `number` | Sí | — | — | Versión de fila para bloqueo optimista (BR-14/CL-16): el cierre concurrente ya compara `expectedRowVersion` contra esta columna; el resumen no la exponía, así que el cliente no tenía con qué mandar el cierre. | `src/modules/clinical/dto/clinical-read.dto.ts:485` |
| `careEpisodes` | `array<CareEpisodeItemDto>` | Sí | — | — | Episodios de cuidado (internaciones y estancias) del paciente. Va en el mismo `GET` que el resto y no en una llamada aparte por lo mismo que las alergias: es contexto de la atención, y depender de que el cliente se acuerde de pedirlo es depender de que nadie se olvide. | `src/modules/clinical/dto/clinical-read.dto.ts:597` |
| `careEpisodes[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:500` |
| `careEpisodes[].tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | `src/modules/clinical/dto/clinical-read.dto.ts:506` |
| `careEpisodes[].typeConceptId` | `string` | No | formato uuid | — | Identificador asociado a type concept. | `src/modules/clinical/dto/clinical-read.dto.ts:512` |
| `careEpisodes[].statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/clinical/dto/clinical-read.dto.ts:518` |
| `careEpisodes[].responsiblePractitionerId` | `string` | No | formato uuid | — | Identificador asociado a responsible practitioner. | `src/modules/clinical/dto/clinical-read.dto.ts:524` |
| `careEpisodes[].startAt` | `string` | No | formato date-time | — | Valor de start at mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:530` |
| `careEpisodes[].endAt` | `string` | No | formato date-time | — | Valor de end at mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:536` |
| `careEpisodes[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/clinical-read.dto.ts:542` |
| `limit` | `number` | Sí | — | — | Tope aplicado a cada bloque | `src/modules/clinical/dto/clinical-read.dto.ts:603` |
| `truncated` | `array<string>` | Sí | — | — | Qué bloques quedaron recortados por el tope | `src/modules/clinical/dto/clinical-read.dto.ts:613` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/br14-encuentros-seguridad-clinica.int-spec.ts:300` |
| INTEGRACION | `test/integration/clinical-c14-c23-notas-e-internacion.int-spec.ts:141` |
| INTEGRACION | `test/integration/dependent-link-requests.int-spec.ts:129` |
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:657` |
| INTEGRACION | `test/integration/fx16-dependientes-y-tutor-legal.int-spec.ts:425` |
| INTEGRACION | `test/integration/hardening/mch-007.int-spec.ts:186` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 45. PATCH /clinical/placement-incidents/{id}

- **Origen:** CONTRATO
- **Nombre:** Revisar un incidente de ubicación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalAdtController.reviewIncident` — `src/modules/clinical/controllers/clinical-adt.controller.ts:306`

### Qué es y para qué sirve (negocio)

Revisar un incidente de ubicación. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /clinical/placement-incidents/{id}` la atiende `ClinicalAdtController.reviewIncident` (src/modules/clinical/controllers/clinical-adt.controller.ts:306). Exige sesión; el controlador no declara roles. Valida el cuerpo como `ReviewIncidentDto` (2 campos, 2 obligatorios). Delega en `InpatientAdtService.reviewIncident`. Crea filas en messaging.domain_events, messaging.outbox_messages. Actualiza clinical.placement_incidents. Lee clinical.placement_incidents, delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, messaging.outbox_messages, practice.care_spaces, practice.clinical_units, practice.practice_sites y 1 más. Publica un evento calculado (eventType).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical/controllers/clinical-adt.controller.ts:306` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-adt.controller.ts:306` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.placement_incidents` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalAdtController.reviewIncident → InpatientAdtService.reviewIncident → ReviewPlacementIncidentUseCase.execute | `src/modules/clinical/services/inpatient/adt.use-cases.ts:1038` |
| `clinical.placement_incidents` | LEE | LEE | DIRECTA | ClinicalAdtController.reviewIncident → InpatientAdtService.reviewIncident → ReviewPlacementIncidentUseCase.execute | `src/modules/clinical/services/inpatient/adt.use-cases.ts:1026` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.reviewIncident → InpatientAdtService.reviewIncident → ReviewPlacementIncidentUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.reviewIncident → InpatientAdtService.reviewIncident → ReviewPlacementIncidentUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.reviewIncident → InpatientAdtService.reviewIncident → ReviewPlacementIncidentUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.reviewIncident → InpatientAdtService.reviewIncident → ReviewPlacementIncidentUseCase.execute → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | ClinicalAdtController.reviewIncident → InpatientAdtService.reviewIncident → ReviewPlacementIncidentUseCase.execute → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | ClinicalAdtController.reviewIncident → InpatientAdtService.reviewIncident → ReviewPlacementIncidentUseCase.execute → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | ClinicalAdtController.reviewIncident → InpatientAdtService.reviewIncident → ReviewPlacementIncidentUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | ClinicalAdtController.reviewIncident → InpatientAdtService.reviewIncident → ReviewPlacementIncidentUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalAdtController.reviewIncident → InpatientAdtService.reviewIncident → ReviewPlacementIncidentUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.reviewIncident → InpatientAdtService.reviewIncident → ReviewPlacementIncidentUseCase.execute → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpaceOpsRepository.unitsOf | `src/modules/practice/repositories/care-space-ops.repository.ts:146` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `eventType` | `src/modules/clinical/services/inpatient/adt-support.ts:447` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ReviewIncidentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `status` | `string` | Sí | valores: REVIEWED, CLOSED | `@IsIn(['REVIEWED', 'CLOSED'])` | — | `src/modules/clinical/dto/inpatient.dto.ts:297` |
| `reviewNote` | `string` | Sí | longitud máxima 2000 | `@IsString()` `@MaxLength(2000)` | — | `src/modules/clinical/dto/inpatient.dto.ts:298` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "status": "REVIEWED",
  "reviewNote": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "status": "REVIEWED",
  "reviewNote": "valor-ejemplo"
}
```

</details>

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Incidente no encontrado; ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalAdtController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 46. GET /clinical/prescription-signature-policies

- **Origen:** CONTRATO
- **Nombre:** Listar las políticas de firma de un tenant
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalPrescriptionPoliciesController.list` — `src/modules/clinical/controllers/clinical-prescription-policies.controller.ts:72`

### Qué es y para qué sirve (negocio)

Listar las políticas de firma de un tenant. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /clinical/prescription-signature-policies` la atiende `ClinicalPrescriptionPoliciesController.list` (src/modules/clinical/controllers/clinical-prescription-policies.controller.ts:72). Exige sesión con alguno de los roles CLINICIAN, SECURITY_ADMIN. Delega en `PrescriptionSignaturePoliciesService.list`. Lee clinical.prescription_signature_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, SECURITY_ADMIN | `src/modules/clinical/controllers/clinical-prescription-policies.controller.ts:72` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_QUERY | tenantId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.prescription_signature_policies` | LEE | LEE | DIRECTA | ClinicalPrescriptionPoliciesController.list → PrescriptionSignaturePoliciesService.list → PrescriptionSignaturePoliciesRepository.findByTenant | `src/modules/clinical/repositories/prescription-signature-policies.repository.ts:64` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PrescriptionSignaturePolicyResponseDto[]>` · DTO `PrescriptionSignaturePolicyResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:99` |
| `tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:105` |
| `jurisdictionCode` | `string` | No | admite null | — | Valor de jurisdiction code mantenido por la instancia. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:111` |
| `medicationTypeConceptId` | `string` | No | formato uuid; admite null | — | Identificador asociado a medication type concept. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:117` |
| `channelConceptId` | `string` | No | formato uuid; admite null | — | Identificador asociado a channel concept. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:123` |
| `signatureRequired` | `boolean` | Sí | — | — | Valor de signature required mantenido por la instancia. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:129` |
| `effectiveFrom` | `string` | Sí | formato date-time | — | Valor de effective from mantenido por la instancia. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:135` |
| `effectiveTo` | `string` | No | formato date-time; admite null | — | Valor de effective to mantenido por la instancia. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:141` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalPrescriptionPoliciesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 47. POST /clinical/prescription-signature-policies

- **Origen:** CONTRATO
- **Nombre:** Crear una política de firma de receta
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalPrescriptionPoliciesController.create` — `src/modules/clinical/controllers/clinical-prescription-policies.controller.ts:51`

### Qué es y para qué sirve (negocio)

Crear una política de firma de receta. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/prescription-signature-policies` la atiende `ClinicalPrescriptionPoliciesController.create` (src/modules/clinical/controllers/clinical-prescription-policies.controller.ts:51). Exige sesión con alguno de los roles CLINICIAN, SECURITY_ADMIN. Valida el cuerpo como `CreatePrescriptionSignaturePolicyDto` (7 campos, 2 obligatorios). Delega en `PrescriptionSignaturePoliciesService.create`. Crea filas en clinical.prescription_signature_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, SECURITY_ADMIN | `src/modules/clinical/controllers/clinical-prescription-policies.controller.ts:51` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.prescription_signature_policies` | ESCRIBE | CREA | DIRECTA | ClinicalPrescriptionPoliciesController.create → PrescriptionSignaturePoliciesService.create → PrescriptionSignaturePoliciesRepository.create | `src/modules/clinical/repositories/prescription-signature-policies.repository.ts:103` |

### Cuerpo — DTO `CreatePrescriptionSignaturePolicyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant al que aplica la política (directory.tenants) | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:25` |
| `jurisdictionCode` | `string` | No | longitud máxima 16 | `@IsOptional()` `@IsString()` `@MaxLength(16)` | Código de jurisdicción (comodín si se omite) | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:37` |
| `medicationTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de medicamento (concept id); comodín si se omite | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:48` |
| `channelConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Canal de emisión (concept id); comodín si se omite | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:59` |
| `signatureRequired` | `boolean` | Sí | — | `@IsBoolean()` | Si la firma es obligatoria cuando esta política aplica | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:68` |
| `effectiveFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de vigencia (por defecto, ahora) | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:79` |
| `effectiveTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fin de vigencia (nulo = indefinido) | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:90` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "signatureRequired": true
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionCode": "CODIGO_EJEMPLO",
  "medicationTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "channelConceptId": "00000000-0000-4000-8000-000000000001",
  "signatureRequired": true,
  "effectiveFrom": "2026-07-31T12:00:00.000Z",
  "effectiveTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<PrescriptionSignaturePolicyResponseDto>` · DTO `PrescriptionSignaturePolicyResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:99` |
| `tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:105` |
| `jurisdictionCode` | `string` | No | admite null | — | Valor de jurisdiction code mantenido por la instancia. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:111` |
| `medicationTypeConceptId` | `string` | No | formato uuid; admite null | — | Identificador asociado a medication type concept. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:117` |
| `channelConceptId` | `string` | No | formato uuid; admite null | — | Identificador asociado a channel concept. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:123` |
| `signatureRequired` | `boolean` | Sí | — | — | Valor de signature required mantenido por la instancia. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:129` |
| `effectiveFrom` | `string` | Sí | formato date-time | — | Valor de effective from mantenido por la instancia. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:135` |
| `effectiveTo` | `string` | No | formato date-time; admite null | — | Valor de effective to mantenido por la instancia. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:141` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalPrescriptionPoliciesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 48. POST /clinical/prescription-signature-policies/{id}/deactivate

- **Origen:** CONTRATO
- **Nombre:** Desactivar una política (cierra vigencia, sin borrado duro)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalPrescriptionPoliciesController.deactivate` — `src/modules/clinical/controllers/clinical-prescription-policies.controller.ts:87`

### Qué es y para qué sirve (negocio)

Desactivar una política (cierra vigencia, sin borrado duro). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/prescription-signature-policies/{id}/deactivate` la atiende `ClinicalPrescriptionPoliciesController.deactivate` (src/modules/clinical/controllers/clinical-prescription-policies.controller.ts:87). Exige sesión con alguno de los roles CLINICIAN, SECURITY_ADMIN. Delega en `PrescriptionSignaturePoliciesService.deactivate`. Actualiza clinical.prescription_signature_policies. Lee clinical.prescription_signature_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, SECURITY_ADMIN | `src/modules/clinical/controllers/clinical-prescription-policies.controller.ts:87` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-prescription-policies.controller.ts:87` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.prescription_signature_policies` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalPrescriptionPoliciesController.deactivate → PrescriptionSignaturePoliciesService.deactivate | `src/modules/clinical/services/prescription-signature-policies.service.ts:153` |
| `clinical.prescription_signature_policies` | LEE | LEE | DIRECTA | ClinicalPrescriptionPoliciesController.deactivate → PrescriptionSignaturePoliciesService.deactivate → PrescriptionSignaturePoliciesRepository.findById | `src/modules/clinical/repositories/prescription-signature-policies.repository.ts:56` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PrescriptionSignaturePolicyResponseDto>` · DTO `PrescriptionSignaturePolicyResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:99` |
| `tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:105` |
| `jurisdictionCode` | `string` | No | admite null | — | Valor de jurisdiction code mantenido por la instancia. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:111` |
| `medicationTypeConceptId` | `string` | No | formato uuid; admite null | — | Identificador asociado a medication type concept. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:117` |
| `channelConceptId` | `string` | No | formato uuid; admite null | — | Identificador asociado a channel concept. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:123` |
| `signatureRequired` | `boolean` | Sí | — | — | Valor de signature required mantenido por la instancia. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:129` |
| `effectiveFrom` | `string` | Sí | formato date-time | — | Valor de effective from mantenido por la instancia. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:135` |
| `effectiveTo` | `string` | No | formato date-time; admite null | — | Valor de effective to mantenido por la instancia. | `src/modules/clinical/dto/prescription-signature-policy.dto.ts:141` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Política no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalPrescriptionPoliciesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 49. GET /clinical/prescriptions/{id}/pdf

- **Origen:** CONTRATO
- **Nombre:** Descargar el PDF oficial de una receta
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalPrescriptionsController.getPrescriptionPdf` — `src/modules/clinical/controllers/clinical-prescriptions.controller.ts:52`

### Qué es y para qué sirve (negocio)

Descargar el PDF oficial de una receta. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /clinical/prescriptions/{id}/pdf` la atiende `ClinicalPrescriptionsController.getPrescriptionPdf` (src/modules/clinical/controllers/clinical-prescriptions.controller.ts:52). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, PATIENT. Delega en `PrescriptionPdfService.render`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 22 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, PATIENT | `src/modules/clinical/controllers/clinical-prescriptions.controller.ts:52` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-prescriptions.controller.ts:52` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → PrescriptionPdfService.assertPrescriptionCanSee → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → PrescriptionPdfService.assertPrescriptionCanSee → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → PrescriptionPdfService.assertPrescriptionCanSee → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → PrescriptionPdfService.assertPrescriptionCanSee → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → PrescriptionPdfService.assertPrescriptionCanSee → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → PrescriptionPdfService.assertPrescriptionCanSee → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → PrescriptionPdfService.assertPrescriptionCanSee → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → PrescriptionPdfService.assertPrescriptionCanSee → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → PrescriptionPdfService.assertPrescriptionCanSee → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → PrescriptionPdfService.assertPrescriptionCanSee → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → PrescriptionPdfService.assertPrescriptionCanSee → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.conditions` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → ConditionsRepository.findById | `src/modules/clinical/repositories/conditions.repository.ts:107` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → MedicationRequestsRepository.findById | `src/modules/clinical/repositories/medication-requests.repository.ts:147` |
| `common.identifiers` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → PrescriptionPdfService.resolvePatientDocument → IdentifiersRepository.findCurrentByOwner | `src/modules/common/repositories/identifiers.repository.ts:126` |
| `insurance.insurance_carriers` | LEE | LEE | POR_SQL | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |
| `insurance.insurance_plan_benefits` | LEE | LEE | POR_SQL | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:168` |
| `insurance.insurance_plans` | LEE | LEE | POR_SQL | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |
| `insurance.insurance_products` | LEE | LEE | POR_SQL | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |
| `insurance.patient_coverages` | LEE | LEE | POR_SQL | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → PrescriptionPdfService.resolvePractitioner → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → PrescriptionPdfService.resolvePractitioner → JurisdictionAuthorizationsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:107` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → PrescriptionPdfService.assertPrescriptionCanSee → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → PrescriptionPdfService.resolvePatientName → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → PrescriptionPdfService.assertPrescriptionCanSee → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → PrescriptionPdfService.resolvePatientName → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → PrescriptionPdfService.resolvePractitioner → PractitionerSpecialtiesRepository.findAllByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:143` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → PrescriptionPdfService.assertPrescriptionCanSee → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → PrescriptionPdfService.assertPrescriptionCanSee → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → PrescriptionPdfService.assertPrescriptionCanSee → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.getPrescriptionPdf → PrescriptionPdfService.render → CatalogConceptsRepository.findByIds | `src/modules/terminology/repositories/catalog-concepts.repository.ts:202` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Receta no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/clinical-prescriptions-pdf.int-spec.ts:163` |
| CONTROLADOR | `src/modules/clinical/controllers/clinical-prescriptions.controller.spec.ts:27` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalPrescriptionsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 50. POST /clinical/procedures

- **Origen:** CONTRATO
- **Nombre:** Registrar un procedimiento
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.createProcedure` — `src/modules/clinical/controllers/clinical-records.controller.ts:404`

### Qué es y para qué sirve (negocio)

Registrar un procedimiento. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/procedures` la atiende `ClinicalRecordsController.createProcedure` (src/modules/clinical/controllers/clinical-records.controller.ts:404). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateProcedureDto` (15 campos, 3 obligatorios). Delega en `ProceduresService.create`. Crea filas en clinical.procedures, clinical.received_services. Actualiza clinical.service_requests. Lee clinical.procedures, clinical.received_services, clinical.service_requests, procedures_perioperative.procedure_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:404` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.procedures` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.createProcedure → ProceduresService.create → ProceduresRepository.create | `src/modules/clinical/repositories/procedures.repository.ts:106` |
| `clinical.procedures` | LEE | LEE | DIRECTA | ClinicalRecordsController.createProcedure → ProceduresService.create → ProceduresRepository.findById | `src/modules/clinical/repositories/procedures.repository.ts:95` |
| `clinical.received_services` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.createProcedure → ProceduresService.create → ReceivedServicesProjector.projectProcedure → ReceivedServicesRepository.upsert | `src/modules/clinical/repositories/received-services.repository.ts:146` |
| `clinical.received_services` | LEE | LEE | DIRECTA | ClinicalRecordsController.createProcedure → ProceduresService.create → ReceivedServicesProjector.projectProcedure → ReceivedServicesRepository.upsert → ReceivedServicesRepository.findBySourceProcedure | `src/modules/clinical/repositories/received-services.repository.ts:54` |
| `clinical.service_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalRecordsController.createProcedure → ProceduresService.create | `src/modules/clinical/services/procedures.service.ts:81` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | ClinicalRecordsController.createProcedure → ProceduresService.create → ServiceRequestsRepository.findById | `src/modules/clinical/repositories/service-requests.repository.ts:107` |
| `procedures_perioperative.procedure_cases` | LEE | LEE | DIRECTA | ClinicalRecordsController.createProcedure → ProceduresService.create → ReceivedServicesProjector.projectProcedure → ReceivedServicesRepository.findCaseByPrimaryProcedure | `src/modules/clinical/repositories/received-services.repository.ts:71` |

### Cuerpo — DTO `CreateProcedureDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `custodianTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant custodio (directory.tenants) | `src/modules/clinical/dto/procedure.dto.ts:27` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente (profiles.patient_profiles) | `src/modules/clinical/dto/procedure.dto.ts:37` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro en curso | `src/modules/clinical/dto/procedure.dto.ts:45` |
| `codeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Código del procedimiento (concept id) | `src/modules/clinical/dto/procedure.dto.ts:55` |
| `performerProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional ejecutante | `src/modules/clinical/dto/procedure.dto.ts:66` |
| `serviceRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Orden de servicio que lo origina | `src/modules/clinical/dto/procedure.dto.ts:77` |
| `parentProcedureId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Procedimiento padre (jerarquía) | `src/modules/clinical/dto/procedure.dto.ts:88` |
| `categoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Categoría (concept id) | `src/modules/clinical/dto/procedure.dto.ts:99` |
| `outcomeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Resultado (concept id) | `src/modules/clinical/dto/procedure.dto.ts:110` |
| `practiceSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sede de práctica | `src/modules/clinical/dto/procedure.dto.ts:118` |
| `careSpaceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Espacio de atención | `src/modules/clinical/dto/procedure.dto.ts:126` |
| `occurrenceStartAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de la ocurrencia | `src/modules/clinical/dto/procedure.dto.ts:137` |
| `occurrenceEndAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fin de la ocurrencia | `src/modules/clinical/dto/procedure.dto.ts:148` |
| `operativeReportFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Reporte operatorio (common.files) | `src/modules/clinical/dto/procedure.dto.ts:159` |
| `followUpText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Seguimiento en texto libre | `src/modules/clinical/dto/procedure.dto.ts:171` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001",
  "performerProfileId": "00000000-0000-4000-8000-000000000001",
  "serviceRequestId": "00000000-0000-4000-8000-000000000001",
  "parentProcedureId": "00000000-0000-4000-8000-000000000001",
  "categoryConceptId": "00000000-0000-4000-8000-000000000001",
  "outcomeConceptId": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "careSpaceId": "00000000-0000-4000-8000-000000000001",
  "occurrenceStartAt": "2026-07-31T12:00:00.000Z",
  "occurrenceEndAt": "2026-07-31T12:00:00.000Z",
  "operativeReportFileId": "00000000-0000-4000-8000-000000000001",
  "followUpText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ProcedureResponseDto>` · DTO `ProcedureResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/procedure.dto.ts:180` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/procedure.dto.ts:186` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/procedure.dto.ts:192` |
| `serviceRequestId` | `string` | No | formato uuid; admite null | — | Identificador asociado a service request. | `src/modules/clinical/dto/procedure.dto.ts:198` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/procedure.dto.ts:204` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Orden de servicio no encontrada; ResourceNotFoundException: Procedimiento padre no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical/controllers/clinical-records.controller.spec.ts:152` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 51. POST /clinical/procedures/{id}/attachments

- **Origen:** CONTRATO
- **Nombre:** Adjuntar un archivo ya subido a un procedimiento
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.attachFileToProcedure` — `src/modules/clinical/controllers/clinical-records.controller.ts:426`

### Qué es y para qué sirve (negocio)

Adjuntar un archivo ya subido a un procedimiento. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/procedures/{id}/attachments` la atiende `ClinicalRecordsController.attachFileToProcedure` (src/modules/clinical/controllers/clinical-records.controller.ts:426). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `AttachFileToProcedureDto` (1 campo, 1 obligatorio). Delega en `ProceduresService.attachFile`. Crea filas en common.file_links. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 12 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:426` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-records.controller.ts:426` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToProcedure → ProceduresService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToProcedure → ProceduresService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToProcedure → ProceduresService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToProcedure → ProceduresService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToProcedure → ProceduresService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToProcedure → ProceduresService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToProcedure → ProceduresService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToProcedure → ProceduresService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToProcedure → ProceduresService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToProcedure → ProceduresService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToProcedure → ProceduresService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.procedures` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToProcedure → ProceduresService.attachFile → ProceduresRepository.findById | `src/modules/clinical/repositories/procedures.repository.ts:95` |
| `common.file_links` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.attachFileToProcedure → ProceduresService.attachFile → FilesService.createLink → FileLinksRepository.create | `src/modules/common/repositories/file-links.repository.ts:43` |
| `common.file_versions` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToProcedure → ProceduresService.attachFile → FilesService.createLink → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:190` |
| `common.files` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToProcedure → ProceduresService.attachFile → FilesService.createLink → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:182` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToProcedure → ProceduresService.attachFile → FilesService.createLink → StoragePublicationService.guardFile → StorageLifecycleCoordinator.assertNoContender → QueuesRepository.findStorageIntents | `src/modules/messaging/repositories/queues.repository.ts:62` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToProcedure → ProceduresService.attachFile → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalRecordsController.attachFileToProcedure → ProceduresService.attachFile → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalRecordsController.attachFileToProcedure → ProceduresService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalRecordsController.attachFileToProcedure → ProceduresService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalRecordsController.attachFileToProcedure → ProceduresService.attachFile → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AttachFileToProcedureDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical/dto/procedure.dto.ts:14` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<FileLinkResponseDto>` · DTO `FileLinkResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/common/dto/files.dto.ts:444` |
| `fileId` | `string` | Sí | formato uuid | — | Identificador asociado a file. | `src/modules/common/dto/files.dto.ts:450` |
| `ownerId` | `string` | Sí | formato uuid | — | Identificador asociado a owner. | `src/modules/common/dto/files.dto.ts:456` |
| `ownerType` | `string` | Sí | valores: USER, PATIENT, TENANT, CONDITION, PROCEDURE, MEDICATION_REQUEST, ALLERGY_INTOLERANCE, ENCOUNTER | — | Valor de owner type mantenido por la instancia. | `src/modules/common/dto/files.dto.ts:462` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/common/dto/files.dto.ts:468` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY}; InsufficientRoleException: No tiene permiso para modificar este archivo |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Procedimiento no encontrado; ResourceNotFoundException: Archivo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING; StorageLifecycleDenied: {identity.reasonCode}; StorageLifecycleDenied: FILE_NOT_LIVE; StorageLifecycleDenied: VERSION_UNKNOWN; StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN; StorageLifecycleDenied: PRODUCER_OR_PURGE_IN_FLIGHT |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical/controllers/clinical-records.controller.spec.ts:159` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 52. POST /clinical/requisitions

- **Origen:** CONTRATO
- **Nombre:** Crear una requisición: varios estudios con su detalle, atómicos
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalOrdersController.createRequisition` — `src/modules/clinical/controllers/clinical-orders.controller.ts:114`

### Qué es y para qué sirve (negocio)

Crear una requisición: varios estudios con su detalle, atómicos. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/requisitions` la atiende `ClinicalOrdersController.createRequisition` (src/modules/clinical/controllers/clinical-orders.controller.ts:114). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateRequisitionDto` (26 campos, 4 obligatorios). Delega en `RequisitionsService.create`. Crea filas en clinical.service_request_components, clinical.service_request_notes, clinical.service_requests, messaging.domain_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, messaging.outbox_messages. Actualiza iam.devices. Lee billing.service_catalog, chart.clinical_note_headers, clinical.diagnostic_reports, clinical.encounters, clinical.service_request_components, clinical.service_request_notes, clinical.service_requests, diagnostics.diagnostic_report_versions y 20 más. Publica ServiceRequestPlaced, clinical.service_request.collection_point_suggested.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-orders.controller.ts:114` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | idempotency-key (obligatoria) | `contrato (parameters)` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → PerformerSelectionValidator.resolve → PerformerSiteDbReader.offersProcedureWithPrice | `src/modules/clinical/services/performer-site-db.reader.ts:40` |
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ServiceRequestNotesService.assertUsable | `src/modules/clinical/services/service-request-notes.service.ts:57` |
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ServiceRequestsService.resolveDuplicateDecision → DuplicateStudyDetector.findDuplicate | `src/modules/clinical/services/duplicate-study-detector.ts:191` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ServiceRequestNotesService.assertUsable | `src/modules/clinical/services/service-request-notes.service.ts:80` |
| `clinical.service_request_components` | ESCRIBE | CREA | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ServiceRequestDetailService.writeComponents | `src/modules/clinical/services/service-request-detail.service.ts:365` |
| `clinical.service_request_components` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestReadService.toResponses → ServiceRequestDetailService.describe → ServiceRequestDetailService.loadComponents | `src/modules/clinical/services/service-request-detail.service.ts:466` |
| `clinical.service_request_notes` | ESCRIBE | CREA | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ServiceRequestNotesService.link | `src/modules/clinical/services/service-request-notes.service.ts:136` |
| `clinical.service_request_notes` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestReadService.toResponses → ServiceRequestNotesService.noteIdsFor | `src/modules/clinical/services/service-request-notes.service.ts:160` |
| `clinical.service_requests` | ESCRIBE | CREA | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ServiceRequestsRepository.create | `src/modules/clinical/repositories/service-requests.repository.ts:118` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create | `src/modules/clinical/services/requisitions.service.ts:98` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ServiceRequestsService.resolveDuplicateDecision → DuplicateStudyDetector.findDuplicate → DuplicateStudyDetector.releasedVersionOf | `src/modules/clinical/services/duplicate-study-detector.ts:438` |
| `directory.tenants` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ServiceRequestsService.resolveDuplicateDecision → DuplicateStudyDetector.describe → DuplicateStudyDetector.providerName | `src/modules/clinical/services/duplicate-study-detector.ts:488` |
| `forms.form_instances` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → FormInstanceOriginValidator.assertUsableOrigin | `src/modules/forms/services/form-instance-origin.validator.ts:43` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.healthcare_services` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → PerformerSelectionValidator.resolve → PerformerSiteDbReader.offersProcedureWithPrice | `src/modules/clinical/services/performer-site-db.reader.ts:32` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestReadService.toResponses → SuggestedSiteNamesReader.namesFor | `src/modules/clinical/services/suggested-site-names.reader.ts:31` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → PerformerSelectionValidator.resolve → PerformerSiteDbReader.isActivelyAffiliated | `src/modules/clinical/services/performer-site-db.reader.ts:55` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestReadService.toResponses → ServiceRequestDetailService.describe → ServiceRequestDetailService.displays | `src/modules/clinical/services/service-request-detail.service.ts:493` |
| `terminology.concept_designations` | LEE | LEE | DIRECTA | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestReadService.toResponses → ServiceRequestDetailService.describe → ServiceRequestDetailService.displays → ConceptDesignationsRepository.findPreferredByLanguageForConcepts | `src/modules/terminology/repositories/concept-designations.repository.ts:176` |
| `terminology.concept_properties` | LEE | LEE | POR_SQL | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.findStudy → TerminologyStudyCatalogAdapter.property | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:132` |
| `terminology.concept_relationships` | LEE | LEE | POR_SQL | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.panelComponentIds | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:69` |
| `terminology.value_set_members` | LEE | LEE | POR_SQL | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.isInValueSet | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:98` |
| `terminology.value_set_versions` | LEE | LEE | POR_SQL | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.isInValueSet | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:98` |
| `terminology.value_sets` | LEE | LEE | POR_SQL | ClinicalOrdersController.createRequisition → RequisitionsService.create → ServiceRequestsService.create → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.isInValueSet | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:98` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `ServiceRequestPlaced` | `src/modules/clinical/services/service-requests.service.ts:436` |
| Evento de dominio | `clinical.service_request.collection_point_suggested` | `src/modules/clinical/services/service-requests.service.ts:448` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `idempotency-key` | header | Sí | `string` | — |

### Cuerpo — DTO `CreateRequisitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `custodianTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical/dto/requisition.dto.ts:115` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical/dto/requisition.dto.ts:119` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical/dto/requisition.dto.ts:124` |
| `formInstanceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical/dto/requisition.dto.ts:129` |
| `requesterProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical/dto/requisition.dto.ts:134` |
| `priorityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical/dto/requisition.dto.ts:139` |
| `basedOnNoteIds` | `array<string>` | No | formato uuid; máximo 20 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(MAX_BASED_ON_NOTES)` `@ArrayUnique()` `@IsUUID(undefined, { each: true })` | — | `src/modules/clinical/dto/requisition.dto.ts:151` |
| `performerSelectionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical/dto/requisition.dto.ts:156` |
| `performerTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical/dto/requisition.dto.ts:161` |
| `performerPractitionerProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical/dto/requisition.dto.ts:166` |
| `suggestedPracticeSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical/dto/requisition.dto.ts:171` |
| `items` | `array<RequisitionItemDto>` | Sí | mínimo 1 elemento(s); máximo 30 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(MAX_REQUISITION_ITEMS)` `@ValidateNested({ each: true })` `@Type(() => RequisitionItemDto)` | — | `src/modules/clinical/dto/requisition.dto.ts:183` |
| `items[].codeConceptId` | `string` | Sí | formato uuid | `@IsConceptId()` | Estudio pedido (concept id de service-request-code) | `src/modules/clinical/dto/requisition.dto.ts:65` |
| `items[].category` | `string` | No | valores: LAB, IMAGING, OTHER | `@IsOptional()` `@IsIn(ANALYSIS_CATEGORIES)` | — | `src/modules/clinical/dto/requisition.dto.ts:70` |
| `items[].categoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | — | `src/modules/clinical/dto/requisition.dto.ts:75` |
| `items[].specimenTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | Muestra (specimen-type); sólo laboratorio/patología | `src/modules/clinical/dto/requisition.dto.ts:83` |
| `items[].componentConceptIds` | `array<string>` | No | máximo 500 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(500)` `@ArrayUnique()` `@IsConceptId({ each: true })` | Componentes MARCADOS del panel. Obligatorio y no vacío si el estudio es un panel desplegable | `src/modules/clinical/dto/requisition.dto.ts:96` |
| `items[].imaging` | `ImagingDetailDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => ImagingDetailDto)` | — | `src/modules/clinical/dto/requisition.dto.ts:102` |
| `items[].imaging.modalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | Modalidad (value set `service-request-imaging-modality`). Si el estudio del catálogo ya fija una y no se envía, se toma la del estudio; si se envía otra: 422 MODALITY_STUDY_MISMATCH | `src/modules/clinical/dto/service-request-detail.dto.ts:18` |
| `items[].imaging.bodySiteConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | Región corporal (value set `imaging-body-structure`). Obligatoria en estudios de imagen del catálogo (422 BODY_SITE_REQUIRED) | `src/modules/clinical/dto/service-request-detail.dto.ts:27` |
| `items[].imaging.lateralityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | Lateralidad (value set `condition-laterality`: izquierda, derecha, bilateral). Exige región; prohibida si la región no es par (422 LATERALITY_NOT_APPLICABLE) | `src/modules/clinical/dto/service-request-detail.dto.ts:36` |
| `items[].imaging.contrastConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | Contraste (value set `imaging-contrast`). Exige modalidad (422 CONTRAST_REQUIRES_MODALITY) | `src/modules/clinical/dto/service-request-detail.dto.ts:45` |
| `items[].duplicateDecision` | `RequisitionDuplicateDecisionDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => RequisitionDuplicateDecisionDto)` | — | `src/modules/clinical/dto/requisition.dto.ts:108` |
| `items[].duplicateDecision.previousDiagnosticReportId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/clinical/dto/requisition.dto.ts:36` |
| `items[].duplicateDecision.reusePreviousReport` | `boolean` | No | — | `@ValidateIf( (o: RequisitionDuplicateDecisionDto) => o.reusePreviousReport !== undefined, )` `@IsBoolean()` | Reutilizar el informe previo | `src/modules/clinical/dto/requisition.dto.ts:43` |
| `items[].duplicateDecision.duplicateOverrideReason` | `string` | No | longitud mínima 20; longitud máxima 1000 | `@ValidateIf( (o: RequisitionDuplicateDecisionDto) => o.duplicateOverrideReason !== undefined, )` `@IsString()` `@MinLength(20, { message: 'La justificación clínica requiere al menos 20 caracteres', })` `@MaxLength(1000)` | — | `src/modules/clinical/dto/requisition.dto.ts:55` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "codeConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "formInstanceId": "00000000-0000-4000-8000-000000000001",
  "requesterProfileId": "00000000-0000-4000-8000-000000000001",
  "priorityConceptId": "00000000-0000-4000-8000-000000000001",
  "basedOnNoteIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "performerSelectionConceptId": "00000000-0000-4000-8000-000000000001",
  "performerTenantId": "00000000-0000-4000-8000-000000000001",
  "performerPractitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "suggestedPracticeSiteId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "codeConceptId": "00000000-0000-4000-8000-000000000001",
      "category": "LAB",
      "categoryConceptId": "00000000-0000-4000-8000-000000000001",
      "specimenTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "componentConceptIds": [
        "00000000-0000-4000-8000-000000000001"
      ],
      "imaging": {
        "modalityConceptId": "00000000-0000-4000-8000-000000000001",
        "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
        "lateralityConceptId": "00000000-0000-4000-8000-000000000001",
        "contrastConceptId": "00000000-0000-4000-8000-000000000001"
      },
      "duplicateDecision": {
        "previousDiagnosticReportId": "00000000-0000-4000-8000-000000000001",
        "reusePreviousReport": true,
        "duplicateOverrideReason": "Texto descriptivo de ejemplo"
      }
    }
  ]
}
```

</details>

### Respuesta — `Promise<RequisitionResponseDto>` · DTO `RequisitionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `requisitionId` | `string` | Sí | formato uuid | — | — | `src/modules/clinical/dto/requisition.dto.ts:189` |
| `replayed` | `boolean` | Sí | — | — | true si la Idempotency-Key ya había creado esta requisición: se devuelve la existente sin escribir nada | `src/modules/clinical/dto/requisition.dto.ts:195` |
| `items` | `array<ServiceRequestResponseDto>` | Sí | — | — | — | `src/modules/clinical/dto/requisition.dto.ts:198` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/service-request.dto.ts:311` |
| `items[].patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/service-request.dto.ts:317` |
| `items[].formInstanceId` | `string` | No | formato uuid; admite null | — | Instancia del formulario médico de la que salió la orden (nulo = sin formulario) | `src/modules/clinical/dto/service-request.dto.ts:328` |
| `items[].category` | `object` | No | — | — | Categoría de análisis derivada de categoryConceptId. Ausente = la orden no declara categoría | `src/modules/clinical/dto/service-request.dto.ts:338` |
| `items[].basedOnNoteIds` | `array<string>` | Sí | formato uuid | — | Notas médicas que motivan la orden (vacío = ninguna) | `src/modules/clinical/dto/service-request.dto.ts:348` |
| `items[].status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/service-request.dto.ts:354` |
| `items[].intent` | `string` | Sí | formato uuid | — | Intención (concept id) | `src/modules/clinical/dto/service-request.dto.ts:360` |
| `items[].performerSelectionConceptId` | `string` | Sí | formato uuid | — | Modo de ejecutor recomendado (concept id) | `src/modules/clinical/dto/service-request.dto.ts:369` |
| `items[].performerPractitionerProfileId` | `string` | Sí | formato uuid; admite null | — | Médico ejecutor, o `null`. | `src/modules/clinical/dto/service-request.dto.ts:375` |
| `items[].suggestedPracticeSiteId` | `string` | Sí | formato uuid; admite null | — | Sede sugerida, o `null`. | `src/modules/clinical/dto/service-request.dto.ts:381` |
| `items[].suggestedPracticeSiteName` | `string` | Sí | admite null | — | Nombre de la sede sugerida: el paciente ve un nombre y nunca un uuid. | `src/modules/clinical/dto/service-request.dto.ts:387` |
| `items[].suggestedCareSpace` | `object` | Sí | admite null | — | Punto de toma sugerido {id, code, name} (F5b) | `src/modules/clinical/dto/service-request.dto.ts:394` |
| `items[].suggestedCareSpace.id` | `string` | Sí | — | — | — | sin fuente |
| `items[].suggestedCareSpace.code` | `string` | Sí | — | — | — | sin fuente |
| `items[].suggestedCareSpace.name` | `string` | Sí | — | — | — | sin fuente |
| `items[].requisitionId` | `string` | No | formato uuid; admite null | — | v4.2.82: requisición que agrupa los renglones pedidos juntos (nulo = alta individual). | `src/modules/clinical/dto/service-request.dto.ts:400` |
| `items[].codeConceptId` | `string` | No | formato uuid | — | v4.2.82: el estudio pedido. | `src/modules/clinical/dto/service-request.dto.ts:404` |
| `items[].codeDisplay` | `string` | No | — | — | v4.2.82: nombre legible del estudio. | `src/modules/clinical/dto/service-request.dto.ts:408` |
| `items[].specimenTypeConceptId` | `string` | No | formato uuid; admite null | — | v4.2.82: muestra pedida (nulo = no se indicó). | `src/modules/clinical/dto/service-request.dto.ts:412` |
| `items[].specimenTypeDisplay` | `string` | No | admite null | — | v4.2.82: nombre legible de la muestra. | `src/modules/clinical/dto/service-request.dto.ts:416` |
| `items[].components` | `array<ServiceRequestComponentDto>` | No | — | — | v4.2.82: componentes marcados. Con `componentsSpecified: false` el arreglo va vacío y significa «estudio completo, sin detalle» (órdenes anteriores). | `src/modules/clinical/dto/service-request.dto.ts:423` |
| `items[].components[].conceptId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:51` |
| `items[].components[].display` | `string` | No | — | — | Nombre legible (castellano si existe) | `src/modules/clinical/dto/service-request-detail.dto.ts:54` |
| `items[].components[].ordinal` | `number` | No | — | — | Posición, desde 1, en el orden en que se marcó | `src/modules/clinical/dto/service-request-detail.dto.ts:59` |
| `items[].componentsSpecified` | `boolean` | No | — | — | v4.2.82: `false` = orden sin detalle de componentes (anterior o estudio sin desglose). | `src/modules/clinical/dto/service-request.dto.ts:427` |
| `items[].imaging` | `ServiceRequestImagingDto` | No | — | — | v4.2.82: detalle de imagen; `null` si la orden no lo trae. | `src/modules/clinical/dto/service-request.dto.ts:431` |
| `items[].imaging.modalityConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:65` |
| `items[].imaging.modalityDisplay` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:67` |
| `items[].imaging.bodySiteConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:69` |
| `items[].imaging.bodySiteDisplay` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:71` |
| `items[].imaging.lateralityConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:73` |
| `items[].imaging.lateralityDisplay` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:75` |
| `items[].imaging.contrastConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:77` |
| `items[].imaging.contrastDisplay` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:79` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/service-request.dto.ts:437` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado |
| 409 | `CONFLICT` | ConflictException: La Idempotency-Key ya se usó con un contenido distinto |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El mismo estudio se pide dos veces en la requisición; PreconditionFailedException: La categoría indicada no corresponde al concepto de categoría; PreconditionFailedException: {message}; PreconditionFailedException: La nota médica citada no está disponible como motivo de esta orden; PreconditionFailedException: La nota médica citada pertenece a otra consulta; PreconditionFailedException: El modo de ejecutor no es válido; PreconditionFailedException: Si elige el paciente, la orden no lleva médico ni sede sugeridos; PreconditionFailedException: La orden necesita la sede sugerida; PreconditionFailedException: Si se recomienda un centro, la orden no lleva médico ejecutor; PreconditionFailedException: Si lo hace el médico, la orden necesita el médico ejecutor; PreconditionFailedException: El médico ejecutor debe ser quien pide la orden; PreconditionFailedException: La sede sugerida no ofrece ese procedimiento con precio; PreconditionFailedException: El médico no tiene una afiliación activa para ese procedimiento en la sede sugerida; PreconditionFailedException: El paciente ya tiene este estudio dentro de la ventana; hace falta reutilizar el informe o justificar la repetición; PreconditionFailedException: El informe previo indicado no coincide con el duplicado detectado; PreconditionFailedException: El paciente ya tiene una orden activa de este estudio, sin informe; hace falta justificar la repetición; PreconditionFailedException: No se detectó ningún estudio duplicado para justificar; PreconditionFailedException: El punto de toma no es un punto disponible de la sede sugerida; PreconditionFailedException: {error.message} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical/controllers/clinical-orders.controller.spec.ts:53` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 53. POST /clinical/service-requests

- **Origen:** CONTRATO
- **Nombre:** Crear una orden de servicio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalOrdersController.createServiceRequest` — `src/modules/clinical/controllers/clinical-orders.controller.ts:93`

### Qué es y para qué sirve (negocio)

Crear una orden de servicio. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/service-requests` la atiende `ClinicalOrdersController.createServiceRequest` (src/modules/clinical/controllers/clinical-orders.controller.ts:93). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateServiceRequestDto` (25 campos, 3 obligatorios). Delega en `ServiceRequestsService.create`. Crea filas en clinical.service_request_components, clinical.service_request_notes, clinical.service_requests, messaging.domain_events, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, messaging.outbox_messages. Actualiza iam.devices. Lee billing.service_catalog, chart.clinical_note_headers, clinical.diagnostic_reports, clinical.encounters, clinical.service_request_components, clinical.service_requests, diagnostics.diagnostic_report_versions, directory.tenants y 19 más. Publica ServiceRequestPlaced, clinical.service_request.collection_point_suggested.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-orders.controller.ts:93` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → PerformerSelectionValidator.resolve → PerformerSiteDbReader.offersProcedureWithPrice | `src/modules/clinical/services/performer-site-db.reader.ts:40` |
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ServiceRequestNotesService.assertUsable | `src/modules/clinical/services/service-request-notes.service.ts:57` |
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ServiceRequestsService.resolveDuplicateDecision → DuplicateStudyDetector.findDuplicate | `src/modules/clinical/services/duplicate-study-detector.ts:191` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ServiceRequestNotesService.assertUsable | `src/modules/clinical/services/service-request-notes.service.ts:80` |
| `clinical.service_request_components` | ESCRIBE | CREA | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ServiceRequestDetailService.writeComponents | `src/modules/clinical/services/service-request-detail.service.ts:365` |
| `clinical.service_request_components` | LEE | LEE | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ServiceRequestDetailService.describe → ServiceRequestDetailService.loadComponents | `src/modules/clinical/services/service-request-detail.service.ts:466` |
| `clinical.service_request_notes` | ESCRIBE | CREA | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ServiceRequestNotesService.link | `src/modules/clinical/services/service-request-notes.service.ts:136` |
| `clinical.service_requests` | ESCRIBE | CREA | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ServiceRequestsRepository.create | `src/modules/clinical/repositories/service-requests.repository.ts:118` |
| `clinical.service_requests` | LEE | LEE | POR_SQL | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ServiceRequestsService.resolveDuplicateDecision → DuplicateStudyDetector.findDuplicate | `src/modules/clinical/services/duplicate-study-detector.ts:163` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ServiceRequestsService.resolveDuplicateDecision → DuplicateStudyDetector.findDuplicate → DuplicateStudyDetector.releasedVersionOf | `src/modules/clinical/services/duplicate-study-detector.ts:438` |
| `directory.tenants` | LEE | LEE | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ServiceRequestsService.resolveDuplicateDecision → DuplicateStudyDetector.describe → DuplicateStudyDetector.providerName | `src/modules/clinical/services/duplicate-study-detector.ts:488` |
| `forms.form_instances` | LEE | LEE | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → FormInstanceOriginValidator.assertUsableOrigin | `src/modules/forms/services/form-instance-origin.validator.ts:43` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.healthcare_services` | LEE | LEE | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → PerformerSelectionValidator.resolve → PerformerSiteDbReader.offersProcedureWithPrice | `src/modules/clinical/services/performer-site-db.reader.ts:32` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → SuggestedSiteNamesReader.namesFor | `src/modules/clinical/services/suggested-site-names.reader.ts:31` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → PerformerSelectionValidator.resolve → PerformerSiteDbReader.isActivelyAffiliated | `src/modules/clinical/services/performer-site-db.reader.ts:55` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ClinicalNotificationsService.serviceRequestPlaced → ClinicalNotificationsService.emitToPatient → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ServiceRequestDetailService.describe → ServiceRequestDetailService.displays | `src/modules/clinical/services/service-request-detail.service.ts:493` |
| `terminology.concept_designations` | LEE | LEE | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ServiceRequestDetailService.describe → ServiceRequestDetailService.displays → ConceptDesignationsRepository.findPreferredByLanguageForConcepts | `src/modules/terminology/repositories/concept-designations.repository.ts:176` |
| `terminology.concept_properties` | LEE | LEE | POR_SQL | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.findStudy → TerminologyStudyCatalogAdapter.property | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:132` |
| `terminology.concept_relationships` | LEE | LEE | POR_SQL | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.panelComponentIds | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:69` |
| `terminology.value_set_members` | LEE | LEE | POR_SQL | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.isInValueSet | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:98` |
| `terminology.value_set_versions` | LEE | LEE | POR_SQL | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.isInValueSet | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:98` |
| `terminology.value_sets` | LEE | LEE | POR_SQL | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ServiceRequestDetailService.prepare → TerminologyStudyCatalogAdapter.isInValueSet | `src/modules/clinical/services/terminology-study-catalog.adapter.ts:98` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `ServiceRequestPlaced` | `src/modules/clinical/services/service-requests.service.ts:436` |
| Evento de dominio | `clinical.service_request.collection_point_suggested` | `src/modules/clinical/services/service-requests.service.ts:448` |

### Cuerpo — DTO `CreateServiceRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `custodianTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant custodio (directory.tenants) | `src/modules/clinical/dto/service-request.dto.ts:41` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente (profiles.patient_profiles) | `src/modules/clinical/dto/service-request.dto.ts:51` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro en curso | `src/modules/clinical/dto/service-request.dto.ts:59` |
| `formInstanceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Instancia CERRADA del formulario médico (forms.form_instances) de la que sale la orden. Opcional: desde la historia se emite sin formulario. Si viaja, debe existir, estar cerrada y ser del mismo encuentro (422 PRECONDITION_FAILED si no) | `src/modules/clinical/dto/service-request.dto.ts:73` |
| `codeConceptId` | `string` | Sí | formato uuid | `@IsConceptId()` | Código del servicio pedido (concept id) | `src/modules/clinical/dto/service-request.dto.ts:83` |
| `categoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | Categoría (concept id) | `src/modules/clinical/dto/service-request.dto.ts:94` |
| `category` | `string` | No | valores: LAB, IMAGING, OTHER | `@IsOptional()` `@IsIn(ANALYSIS_CATEGORIES)` | Categoría de análisis (C2). Se resuelve a categoryConceptId (LAB → SR_LAB, IMAGING → SR_IMAGING, OTHER → SR_OTHER). Si viaja con categoryConceptId y no coinciden: 422 SERVICE_REQUEST_CATEGORY_MISMATCH | `src/modules/clinical/dto/service-request.dto.ts:110` |
| `basedOnNoteIds` | `array<string>` | No | formato uuid; máximo 20 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(MAX_BASED_ON_NOTES)` `@ArrayUnique()` `@IsUUID(undefined, { each: true })` | Notas médicas (chart.clinical_note_headers) que motivan la orden. Cada una debe ser del mismo paciente, de un encuentro del tenant custodio, firmada o enmendada y sin confidencialidad restringida (si no, 422 BASED_ON_NOTE_NOT_FOUND, sin distinguir el motivo); y, si la orden tiene encuentro, del mismo encuentro (422 BASED_ON_NOTE_ENCOUNTER_MISMATCH) | `src/modules/clinical/dto/service-request.dto.ts:132` |
| `priorityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Prioridad (concept id) | `src/modules/clinical/dto/service-request.dto.ts:143` |
| `requesterProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional solicitante | `src/modules/clinical/dto/service-request.dto.ts:154` |
| `performerTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant ejecutante | `src/modules/clinical/dto/service-request.dto.ts:162` |
| `performerSelectionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Quién ejecuta la orden (concept id del conjunto `service-request-performer-selection`: SR_PERF_SELF, SR_PERF_ORGANIZATION, SR_PERF_PATIENT_CHOICE). Es una recomendación, no un candado; omitido = que elija el paciente | `src/modules/clinical/dto/service-request.dto.ts:174` |
| `performerPractitionerProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Médico ejecutor. Obligatorio con SR_PERF_SELF (debe ser quien pide la orden); prohibido con los otros modos | `src/modules/clinical/dto/service-request.dto.ts:186` |
| `suggestedPracticeSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sede sugerida (practice.practice_sites). Obligatoria con SR_PERF_SELF y SR_PERF_ORGANIZATION; prohibida con SR_PERF_PATIENT_CHOICE. Debe ofrecer el procedimiento con precio. No concede acceso a la orden | `src/modules/clinical/dto/service-request.dto.ts:198` |
| `specimenTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | Muestra pedida (value set `specimen-type`). Sólo con laboratorio o anatomía patológica (422 SPECIMEN_NOT_ALLOWED_FOR_CATEGORY / SPECIMEN_TYPE_NOT_IN_CATALOG, con details.reason) | `src/modules/clinical/dto/service-request.dto.ts:211` |
| `componentConceptIds` | `array<string>` | No | máximo 500 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(500)` `@ArrayUnique()` `@IsConceptId({ each: true })` | Componentes MARCADOS del panel (conceptos `part-of` del estudio). Un panel desplegable exige la lista y no vacía (422 COMPONENTS_EMPTY); un estudio que no es panel la prohíbe (COMPONENTS_NOT_SELECTABLE); uno ajeno al panel: COMPONENT_NOT_IN_PANEL | `src/modules/clinical/dto/service-request.dto.ts:229` |
| `imaging` | `ImagingDetailDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => ImagingDetailDto)` | — | `src/modules/clinical/dto/service-request.dto.ts:238` |
| `imaging.modalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | Modalidad (value set `service-request-imaging-modality`). Si el estudio del catálogo ya fija una y no se envía, se toma la del estudio; si se envía otra: 422 MODALITY_STUDY_MISMATCH | `src/modules/clinical/dto/service-request-detail.dto.ts:18` |
| `imaging.bodySiteConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | Región corporal (value set `imaging-body-structure`). Obligatoria en estudios de imagen del catálogo (422 BODY_SITE_REQUIRED) | `src/modules/clinical/dto/service-request-detail.dto.ts:27` |
| `imaging.lateralityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | Lateralidad (value set `condition-laterality`: izquierda, derecha, bilateral). Exige región; prohibida si la región no es par (422 LATERALITY_NOT_APPLICABLE) | `src/modules/clinical/dto/service-request-detail.dto.ts:36` |
| `imaging.contrastConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | Contraste (value set `imaging-contrast`). Exige modalidad (422 CONTRAST_REQUIRES_MODALITY) | `src/modules/clinical/dto/service-request-detail.dto.ts:45` |
| `suggestedCareSpaceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Punto de toma sugerido (F5b) | `src/modules/clinical/dto/service-request.dto.ts:251` |
| `previousDiagnosticReportId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Informe previo que satisface el pedido (antiduplicación). Va con reusePreviousReport o duplicateOverrideReason. | `src/modules/clinical/dto/service-request.dto.ts:267` |
| `reusePreviousReport` | `boolean` | No | — | `@ValidateIf( (o: CreateServiceRequestDto) => o.reusePreviousReport !== undefined, )` `@IsBoolean()` | Reutilizar el informe previo detectado en vez de repetir el estudio | `src/modules/clinical/dto/service-request.dto.ts:282` |
| `duplicateOverrideReason` | `string` | No | longitud mínima 20; longitud máxima 1000 | `@ValidateIf( (o: CreateServiceRequestDto) => o.duplicateOverrideReason !== undefined, )` `@IsString()` `@MinLength(20, { message: 'La justificación clínica requiere al menos 20 caracteres', })` `@MaxLength(1000)` | Justificación clínica formal para repetir un estudio duplicado (mínimo 20 caracteres) | `src/modules/clinical/dto/service-request.dto.ts:302` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "formInstanceId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001",
  "categoryConceptId": "00000000-0000-4000-8000-000000000001",
  "category": "LAB",
  "basedOnNoteIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "priorityConceptId": "00000000-0000-4000-8000-000000000001",
  "requesterProfileId": "00000000-0000-4000-8000-000000000001",
  "performerTenantId": "00000000-0000-4000-8000-000000000001",
  "performerSelectionConceptId": "00000000-0000-4000-8000-000000000001",
  "performerPractitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "suggestedPracticeSiteId": "00000000-0000-4000-8000-000000000001",
  "specimenTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "componentConceptIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "imaging": {
    "modalityConceptId": "00000000-0000-4000-8000-000000000001",
    "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
    "lateralityConceptId": "00000000-0000-4000-8000-000000000001",
    "contrastConceptId": "00000000-0000-4000-8000-000000000001"
  },
  "suggestedCareSpaceId": "00000000-0000-4000-8000-000000000001",
  "previousDiagnosticReportId": "00000000-0000-4000-8000-000000000001",
  "reusePreviousReport": true,
  "duplicateOverrideReason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<ServiceRequestResponseDto>` · DTO `ServiceRequestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/service-request.dto.ts:311` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/service-request.dto.ts:317` |
| `formInstanceId` | `string` | No | formato uuid; admite null | — | Instancia del formulario médico de la que salió la orden (nulo = sin formulario) | `src/modules/clinical/dto/service-request.dto.ts:328` |
| `category` | `object` | No | — | — | Categoría de análisis derivada de categoryConceptId. Ausente = la orden no declara categoría | `src/modules/clinical/dto/service-request.dto.ts:338` |
| `basedOnNoteIds` | `array<string>` | Sí | formato uuid | — | Notas médicas que motivan la orden (vacío = ninguna) | `src/modules/clinical/dto/service-request.dto.ts:348` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/service-request.dto.ts:354` |
| `intent` | `string` | Sí | formato uuid | — | Intención (concept id) | `src/modules/clinical/dto/service-request.dto.ts:360` |
| `performerSelectionConceptId` | `string` | Sí | formato uuid | — | Modo de ejecutor recomendado (concept id) | `src/modules/clinical/dto/service-request.dto.ts:369` |
| `performerPractitionerProfileId` | `string` | Sí | formato uuid; admite null | — | Médico ejecutor, o `null`. | `src/modules/clinical/dto/service-request.dto.ts:375` |
| `suggestedPracticeSiteId` | `string` | Sí | formato uuid; admite null | — | Sede sugerida, o `null`. | `src/modules/clinical/dto/service-request.dto.ts:381` |
| `suggestedPracticeSiteName` | `string` | Sí | admite null | — | Nombre de la sede sugerida: el paciente ve un nombre y nunca un uuid. | `src/modules/clinical/dto/service-request.dto.ts:387` |
| `suggestedCareSpace` | `object` | Sí | admite null | — | Punto de toma sugerido {id, code, name} (F5b) | `src/modules/clinical/dto/service-request.dto.ts:394` |
| `suggestedCareSpace.id` | `string` | Sí | — | — | — | sin fuente |
| `suggestedCareSpace.code` | `string` | Sí | — | — | — | sin fuente |
| `suggestedCareSpace.name` | `string` | Sí | — | — | — | sin fuente |
| `requisitionId` | `string` | No | formato uuid; admite null | — | v4.2.82: requisición que agrupa los renglones pedidos juntos (nulo = alta individual). | `src/modules/clinical/dto/service-request.dto.ts:400` |
| `codeConceptId` | `string` | No | formato uuid | — | v4.2.82: el estudio pedido. | `src/modules/clinical/dto/service-request.dto.ts:404` |
| `codeDisplay` | `string` | No | — | — | v4.2.82: nombre legible del estudio. | `src/modules/clinical/dto/service-request.dto.ts:408` |
| `specimenTypeConceptId` | `string` | No | formato uuid; admite null | — | v4.2.82: muestra pedida (nulo = no se indicó). | `src/modules/clinical/dto/service-request.dto.ts:412` |
| `specimenTypeDisplay` | `string` | No | admite null | — | v4.2.82: nombre legible de la muestra. | `src/modules/clinical/dto/service-request.dto.ts:416` |
| `components` | `array<ServiceRequestComponentDto>` | No | — | — | v4.2.82: componentes marcados. Con `componentsSpecified: false` el arreglo va vacío y significa «estudio completo, sin detalle» (órdenes anteriores). | `src/modules/clinical/dto/service-request.dto.ts:423` |
| `components[].conceptId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:51` |
| `components[].display` | `string` | No | — | — | Nombre legible (castellano si existe) | `src/modules/clinical/dto/service-request-detail.dto.ts:54` |
| `components[].ordinal` | `number` | No | — | — | Posición, desde 1, en el orden en que se marcó | `src/modules/clinical/dto/service-request-detail.dto.ts:59` |
| `componentsSpecified` | `boolean` | No | — | — | v4.2.82: `false` = orden sin detalle de componentes (anterior o estudio sin desglose). | `src/modules/clinical/dto/service-request.dto.ts:427` |
| `imaging` | `ServiceRequestImagingDto` | No | — | — | v4.2.82: detalle de imagen; `null` si la orden no lo trae. | `src/modules/clinical/dto/service-request.dto.ts:431` |
| `imaging.modalityConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:65` |
| `imaging.modalityDisplay` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:67` |
| `imaging.bodySiteConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:69` |
| `imaging.bodySiteDisplay` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:71` |
| `imaging.lateralityConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:73` |
| `imaging.lateralityDisplay` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:75` |
| `imaging.contrastConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:77` |
| `imaging.contrastDisplay` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:79` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/service-request.dto.ts:437` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La categoría indicada no corresponde al concepto de categoría; PreconditionFailedException: {message}; PreconditionFailedException: La nota médica citada no está disponible como motivo de esta orden; PreconditionFailedException: La nota médica citada pertenece a otra consulta; PreconditionFailedException: El modo de ejecutor no es válido; PreconditionFailedException: Si elige el paciente, la orden no lleva médico ni sede sugeridos; PreconditionFailedException: La orden necesita la sede sugerida; PreconditionFailedException: Si se recomienda un centro, la orden no lleva médico ejecutor; PreconditionFailedException: Si lo hace el médico, la orden necesita el médico ejecutor; PreconditionFailedException: El médico ejecutor debe ser quien pide la orden; PreconditionFailedException: La sede sugerida no ofrece ese procedimiento con precio; PreconditionFailedException: El médico no tiene una afiliación activa para ese procedimiento en la sede sugerida; PreconditionFailedException: El paciente ya tiene este estudio dentro de la ventana; hace falta reutilizar el informe o justificar la repetición; PreconditionFailedException: El informe previo indicado no coincide con el duplicado detectado; PreconditionFailedException: El paciente ya tiene una orden activa de este estudio, sin informe; hace falta justificar la repetición; PreconditionFailedException: No se detectó ningún estudio duplicado para justificar; PreconditionFailedException: El punto de toma no es un punto disponible de la sede sugerida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/hardening/mch-027.int-spec.ts:69` |
| INTEGRACION | `test/integration/lab-reception-inbox.int-spec.ts:158` |
| INTEGRACION | `test/integration/medical-centers.int-spec.ts:755` |
| INTEGRACION | `test/integration/p40-orden-basada-en-notas.int-spec.ts:171` |
| INTEGRACION | `test/integration/patient-diagnostic-orders.int-spec.ts:87` |
| CONTROLADOR | `src/modules/clinical/controllers/clinical-orders.controller.spec.ts:46` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 54. GET /clinical/service-requests/{id}

- **Origen:** CONTRATO
- **Nombre:** Leer una orden de servicio con su detalle
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalOrdersController.getServiceRequest` — `src/modules/clinical/controllers/clinical-orders.controller.ts:142`

### Qué es y para qué sirve (negocio)

Leer una orden de servicio con su detalle. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /clinical/service-requests/{id}` la atiende `ClinicalOrdersController.getServiceRequest` (src/modules/clinical/controllers/clinical-orders.controller.ts:142). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `ServiceRequestReadService.getById`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 16 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-orders.controller.ts:142` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-orders.controller.ts:142` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.service_request_components` | LEE | LEE | DIRECTA | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ServiceRequestReadService.toResponses → ServiceRequestDetailService.describe → ServiceRequestDetailService.loadComponents | `src/modules/clinical/services/service-request-detail.service.ts:466` |
| `clinical.service_request_notes` | LEE | LEE | DIRECTA | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ServiceRequestReadService.toResponses → ServiceRequestNotesService.noteIdsFor | `src/modules/clinical/services/service-request-notes.service.ts:160` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById | `src/modules/clinical/services/service-request-read.service.ts:49` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ServiceRequestReadService.toResponses → SuggestedSiteNamesReader.namesFor | `src/modules/clinical/services/suggested-site-names.reader.ts:31` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ClinicalReadService.assertCanReadHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ServiceRequestReadService.toResponses → ServiceRequestDetailService.describe → ServiceRequestDetailService.displays | `src/modules/clinical/services/service-request-detail.service.ts:493` |
| `terminology.concept_designations` | LEE | LEE | DIRECTA | ClinicalOrdersController.getServiceRequest → ServiceRequestReadService.getById → ServiceRequestReadService.toResponses → ServiceRequestDetailService.describe → ServiceRequestDetailService.displays → ConceptDesignationsRepository.findPreferredByLanguageForConcepts | `src/modules/terminology/repositories/concept-designations.repository.ts:176` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ServiceRequestResponseDto>` · DTO `ServiceRequestResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/service-request.dto.ts:311` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/service-request.dto.ts:317` |
| `formInstanceId` | `string` | No | formato uuid; admite null | — | Instancia del formulario médico de la que salió la orden (nulo = sin formulario) | `src/modules/clinical/dto/service-request.dto.ts:328` |
| `category` | `object` | No | — | — | Categoría de análisis derivada de categoryConceptId. Ausente = la orden no declara categoría | `src/modules/clinical/dto/service-request.dto.ts:338` |
| `basedOnNoteIds` | `array<string>` | Sí | formato uuid | — | Notas médicas que motivan la orden (vacío = ninguna) | `src/modules/clinical/dto/service-request.dto.ts:348` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/service-request.dto.ts:354` |
| `intent` | `string` | Sí | formato uuid | — | Intención (concept id) | `src/modules/clinical/dto/service-request.dto.ts:360` |
| `performerSelectionConceptId` | `string` | Sí | formato uuid | — | Modo de ejecutor recomendado (concept id) | `src/modules/clinical/dto/service-request.dto.ts:369` |
| `performerPractitionerProfileId` | `string` | Sí | formato uuid; admite null | — | Médico ejecutor, o `null`. | `src/modules/clinical/dto/service-request.dto.ts:375` |
| `suggestedPracticeSiteId` | `string` | Sí | formato uuid; admite null | — | Sede sugerida, o `null`. | `src/modules/clinical/dto/service-request.dto.ts:381` |
| `suggestedPracticeSiteName` | `string` | Sí | admite null | — | Nombre de la sede sugerida: el paciente ve un nombre y nunca un uuid. | `src/modules/clinical/dto/service-request.dto.ts:387` |
| `suggestedCareSpace` | `object` | Sí | admite null | — | Punto de toma sugerido {id, code, name} (F5b) | `src/modules/clinical/dto/service-request.dto.ts:394` |
| `suggestedCareSpace.id` | `string` | Sí | — | — | — | sin fuente |
| `suggestedCareSpace.code` | `string` | Sí | — | — | — | sin fuente |
| `suggestedCareSpace.name` | `string` | Sí | — | — | — | sin fuente |
| `requisitionId` | `string` | No | formato uuid; admite null | — | v4.2.82: requisición que agrupa los renglones pedidos juntos (nulo = alta individual). | `src/modules/clinical/dto/service-request.dto.ts:400` |
| `codeConceptId` | `string` | No | formato uuid | — | v4.2.82: el estudio pedido. | `src/modules/clinical/dto/service-request.dto.ts:404` |
| `codeDisplay` | `string` | No | — | — | v4.2.82: nombre legible del estudio. | `src/modules/clinical/dto/service-request.dto.ts:408` |
| `specimenTypeConceptId` | `string` | No | formato uuid; admite null | — | v4.2.82: muestra pedida (nulo = no se indicó). | `src/modules/clinical/dto/service-request.dto.ts:412` |
| `specimenTypeDisplay` | `string` | No | admite null | — | v4.2.82: nombre legible de la muestra. | `src/modules/clinical/dto/service-request.dto.ts:416` |
| `components` | `array<ServiceRequestComponentDto>` | No | — | — | v4.2.82: componentes marcados. Con `componentsSpecified: false` el arreglo va vacío y significa «estudio completo, sin detalle» (órdenes anteriores). | `src/modules/clinical/dto/service-request.dto.ts:423` |
| `components[].conceptId` | `string` | No | formato uuid | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:51` |
| `components[].display` | `string` | No | — | — | Nombre legible (castellano si existe) | `src/modules/clinical/dto/service-request-detail.dto.ts:54` |
| `components[].ordinal` | `number` | No | — | — | Posición, desde 1, en el orden en que se marcó | `src/modules/clinical/dto/service-request-detail.dto.ts:59` |
| `componentsSpecified` | `boolean` | No | — | — | v4.2.82: `false` = orden sin detalle de componentes (anterior o estudio sin desglose). | `src/modules/clinical/dto/service-request.dto.ts:427` |
| `imaging` | `ServiceRequestImagingDto` | No | — | — | v4.2.82: detalle de imagen; `null` si la orden no lo trae. | `src/modules/clinical/dto/service-request.dto.ts:431` |
| `imaging.modalityConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:65` |
| `imaging.modalityDisplay` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:67` |
| `imaging.bodySiteConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:69` |
| `imaging.bodySiteDisplay` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:71` |
| `imaging.lateralityConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:73` |
| `imaging.lateralityDisplay` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:75` |
| `imaging.contrastConceptId` | `string` | No | formato uuid; admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:77` |
| `imaging.contrastDisplay` | `string` | No | admite null | — | — | `src/modules/clinical/dto/service-request-detail.dto.ts:79` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/service-request.dto.ts:437` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical/controllers/clinical-orders.controller.spec.ts:73` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 55. POST /clinical/service-requests/duplicate-check

- **Origen:** CONTRATO
- **Nombre:** Pre-validar si el paciente ya se hizo este estudio en la ventana (antiduplicación · T-26)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalOrdersController.checkDuplicateStudy` — `src/modules/clinical/controllers/clinical-orders.controller.ts:74`

### Qué es y para qué sirve (negocio)

Pre-validar si el paciente ya se hizo este estudio en la ventana (antiduplicación · T-26). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/service-requests/duplicate-check` la atiende `ClinicalOrdersController.checkDuplicateStudy` (src/modules/clinical/controllers/clinical-orders.controller.ts:74). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CheckDuplicateStudyDto` (8 campos, 2 obligatorios). Delega en `ServiceRequestsService.checkDuplicate`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 18 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-orders.controller.ts:74` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → DuplicateStudyDetector.findDuplicate | `src/modules/clinical/services/duplicate-study-detector.ts:191` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:174` |
| `clinical.service_requests` | LEE | LEE | POR_SQL | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → DuplicateStudyDetector.findDuplicate | `src/modules/clinical/services/duplicate-study-detector.ts:163` |
| `diagnostic_units.diagnostic_study_offerings` | LEE | LEE | DIRECTA | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → ServiceRequestsService.resolveCodeConceptId | `src/modules/clinical/services/service-requests.service.ts:671` |
| `diagnostics.diagnostic_report_versions` | LEE | LEE | DIRECTA | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → DuplicateStudyDetector.findDuplicate → DuplicateStudyDetector.releasedVersionOf | `src/modules/clinical/services/duplicate-study-detector.ts:438` |
| `directory.tenants` | LEE | LEE | DIRECTA | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → DuplicateStudyDetector.findActiveOrderWithoutReport → DuplicateStudyDetector.providerName | `src/modules/clinical/services/duplicate-study-detector.ts:488` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → ClinicalReadService.assertCanReadHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → DuplicateStudyDetector.findActiveOrderWithoutReport → DuplicateStudyDetector.designationOrDisplay | `src/modules/clinical/services/duplicate-study-detector.ts:478` |
| `terminology.concept_designations` | LEE | LEE | DIRECTA | ClinicalOrdersController.checkDuplicateStudy → ServiceRequestsService.checkDuplicate → DuplicateStudyDetector.findActiveOrderWithoutReport → DuplicateStudyDetector.designationOrDisplay → ConceptDesignationsRepository.findPreferredByLanguageForConcepts | `src/modules/terminology/repositories/concept-designations.repository.ts:176` |

### Cuerpo — DTO `CheckDuplicateStudyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente cuyo historial se revisa (profiles.patient_profiles) | `src/modules/clinical/dto/duplicate-study.dto.ts:27` |
| `codeConceptId` | `string` | No | formato uuid | `@ValidateIf( (o: CheckDuplicateStudyDto) => o.diagnosticStudyOfferingId === undefined, )` `@IsConceptId()` | Código del estudio (concept id del catálogo clínico) | `src/modules/clinical/dto/duplicate-study.dto.ts:42` |
| `diagnosticStudyOfferingId` | `string` | No | formato uuid | `@ValidateIf((o: CheckDuplicateStudyDto) => o.codeConceptId === undefined)` `@IsUUID()` | Oferta de estudio del centro; se resuelve a su study_concept_id (diagnostic_units.diagnostic_study_offerings) | `src/modules/clinical/dto/duplicate-study.dto.ts:51` |
| `encounterId` | `string` | Sí | formato uuid | `@IsUUID()` | Encuentro en curso | `src/modules/clinical/dto/duplicate-study.dto.ts:60` |
| `windowDays` | `number` | No | mínimo 1; máximo 365 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(MAX_DUPLICATE_STUDY_WINDOW_DAYS)` | Ventana de días hacia atrás para buscar duplicados | `src/modules/clinical/dto/duplicate-study.dto.ts:73` |
| `bodySiteConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | V10: región del estudio de imagen. Con ella (y la lateralidad) «mano izquierda» y «mano derecha» no se confunden | `src/modules/clinical/dto/duplicate-study.dto.ts:82` |
| `lateralityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsConceptId()` | V10: lateralidad del estudio de imagen | `src/modules/clinical/dto/duplicate-study.dto.ts:90` |
| `componentConceptIds` | `array<string>` | No | máximo 500 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(500)` `@ArrayUnique()` `@IsConceptId({ each: true })` | V10: componentes marcados; los que el informe previo no cubre no son duplicado | `src/modules/clinical/dto/duplicate-study.dto.ts:103` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "codeConceptId": "00000000-0000-4000-8000-000000000001",
  "diagnosticStudyOfferingId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "windowDays": 30,
  "bodySiteConceptId": "00000000-0000-4000-8000-000000000001",
  "lateralityConceptId": "00000000-0000-4000-8000-000000000001",
  "componentConceptIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

</details>

### Respuesta — `Promise<DuplicateStudyCheckResultDto>` · DTO `DuplicateStudyCheckResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `isDuplicate` | `boolean` | Sí | — | — | — | `src/modules/clinical/dto/duplicate-study.dto.ts:164` |
| `previousStudy` | `PreviousStudyDto` | Sí | — | — | — | `src/modules/clinical/dto/duplicate-study.dto.ts:167` |
| `previousStudy.reportId` | `string` | Sí | formato uuid; admite null | — | null cuando lo que consta es una orden activa que aún no tiene informe | `src/modules/clinical/dto/duplicate-study.dto.ts:115` |
| `previousStudy.serviceRequestId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/clinical/dto/duplicate-study.dto.ts:118` |
| `previousStudy.studyName` | `string` | Sí | — | — | — | `src/modules/clinical/dto/duplicate-study.dto.ts:121` |
| `previousStudy.providerName` | `string` | Sí | — | — | — | `src/modules/clinical/dto/duplicate-study.dto.ts:124` |
| `previousStudy.performedAt` | `string` | Sí | formato date-time | — | — | `src/modules/clinical/dto/duplicate-study.dto.ts:127` |
| `previousStudy.daysAgo` | `number` | Sí | — | — | — | `src/modules/clinical/dto/duplicate-study.dto.ts:130` |
| `previousStudy.resultsAvailable` | `boolean` | Sí | — | — | Si el resultado del estudio ya está liberado, no sólo el informe | `src/modules/clinical/dto/duplicate-study.dto.ts:136` |
| `previousStudy.conclusionText` | `string` | Sí | admite null | — | Conclusión del informe. null salvo que el informe sea de la misma organización de quien pide. | `src/modules/clinical/dto/duplicate-study.dto.ts:144` |
| `previousStudy.reportDownloadUrl` | `string` | Sí | admite null | — | Sin endpoint de descarga para el profesional hoy: siempre null. | `src/modules/clinical/dto/duplicate-study.dto.ts:152` |
| `previousStudy.sameOrganization` | `boolean` | Sí | — | — | Si el informe pertenece a la organización de quien hace el chequeo | `src/modules/clinical/dto/duplicate-study.dto.ts:158` |
| `warningMessage` | `string` | Sí | admite null | — | Texto en castellano para mostrar al médico | `src/modules/clinical/dto/duplicate-study.dto.ts:174` |
| `requiresJustification` | `boolean` | Sí | — | — | Si el alta de la orden va a exigir una decisión (reutilizar o justificar) | `src/modules/clinical/dto/duplicate-study.dto.ts:180` |
| `pendingReport` | `boolean` | Sí | — | — | Si hay un informe del mismo estudio todavía sin liberar dentro de la ventana | `src/modules/clinical/dto/duplicate-study.dto.ts:186` |
| `windowDays` | `number` | Sí | — | — | La ventana efectivamente aplicada, en días | `src/modules/clinical/dto/duplicate-study.dto.ts:189` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado; ResourceNotFoundException: Oferta de estudio no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 56. POST /internal/clinical/census-close-tick

- **Origen:** CONTRATO
- **Nombre:** Cerrar los censos vencidos (worker)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalCensusController.tick` — `src/modules/clinical/controllers/clinical-adt.controller.ts:421`

### Qué es y para qué sirve (negocio)

Cerrar los censos vencidos (worker). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /internal/clinical/census-close-tick` la atiende `ClinicalCensusController.tick` (src/modules/clinical/controllers/clinical-adt.controller.ts:421). Exige sesión con alguno de los roles SYSTEM, SYSTEM_WORKER. Delega en `InpatientCensusService.tick`. Crea filas en clinical.inpatient_census_days, clinical.inpatient_census_entries, messaging.domain_events, messaging.outbox_messages. Lee clinical.encounter_locations, clinical.encounters, clinical.inpatient_census_days, delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, messaging.outbox_messages, practice.care_spaces y 3 más. Publica un evento calculado (eventType).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SYSTEM_WORKER | `src/modules/clinical/controllers/clinical-adt.controller.ts:421` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | LEE | LEE | POR_SQL | ClinicalCensusController.tick → InpatientCensusService.tick → InpatientCensusUseCases.tick → InpatientCensusUseCases.close → InpatientRepository.segments | `src/modules/clinical/repositories/inpatient.repository.ts:195` |
| `clinical.encounters` | LEE | LEE | POR_SQL | ClinicalCensusController.tick → InpatientCensusService.tick → InpatientCensusUseCases.tick → InpatientCensusUseCases.close → InpatientRepository.segments | `src/modules/clinical/repositories/inpatient.repository.ts:195` |
| `clinical.inpatient_census_days` | ESCRIBE | CREA | DIRECTA | ClinicalCensusController.tick → InpatientCensusService.tick → InpatientCensusUseCases.tick → InpatientCensusUseCases.close | `src/modules/clinical/services/inpatient/census.use-cases.ts:312` |
| `clinical.inpatient_census_days` | LEE | LEE | DIRECTA | ClinicalCensusController.tick → InpatientCensusService.tick → InpatientCensusUseCases.tick → InpatientCensusUseCases.close | `src/modules/clinical/services/inpatient/census.use-cases.ts:286` |
| `clinical.inpatient_census_entries` | ESCRIBE | CREA | DIRECTA | ClinicalCensusController.tick → InpatientCensusService.tick → InpatientCensusUseCases.tick → InpatientCensusUseCases.close | `src/modules/clinical/services/inpatient/census.use-cases.ts:351` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | ClinicalCensusController.tick → InpatientCensusService.tick → InpatientCensusUseCases.tick → InpatientCensusUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | ClinicalCensusController.tick → InpatientCensusService.tick → InpatientCensusUseCases.tick → InpatientCensusUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClinicalCensusController.tick → InpatientCensusService.tick → InpatientCensusUseCases.tick → InpatientCensusUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | ClinicalCensusController.tick → InpatientCensusService.tick → InpatientCensusUseCases.tick → InpatientCensusUseCases.close → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | ClinicalCensusController.tick → InpatientCensusService.tick → InpatientCensusUseCases.tick → InpatientCensusUseCases.close → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | ClinicalCensusController.tick → InpatientCensusService.tick → InpatientCensusUseCases.tick → InpatientCensusUseCases.close → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | ClinicalCensusController.tick → InpatientCensusService.tick → InpatientCensusUseCases.tick → InpatientCensusUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | ClinicalCensusController.tick → InpatientCensusService.tick → InpatientCensusUseCases.tick → InpatientCensusUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalCensusController.tick → InpatientCensusService.tick → InpatientCensusUseCases.tick → InpatientCensusUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | ClinicalCensusController.tick → InpatientCensusService.tick → InpatientCensusUseCases.tick → InpatientCensusUseCases.close → InpatientRepository.segments | `src/modules/clinical/repositories/inpatient.repository.ts:195` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `eventType` | `src/modules/clinical/services/inpatient/adt-support.ts:447` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite cerrar el censo de esas unidades; InsufficientRoleException: Su rol no permite cerrar el censo de ninguna unidad de la sede |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalCensusController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 57. GET /public/prescriptions/{id}/verify

- **Origen:** CONTRATO
- **Nombre:** Verificar la autenticidad de una receta por su sello
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalPrescriptionsPublicController.verify` — `src/modules/clinical/controllers/clinical-prescriptions-public.controller.ts:45`

### Qué es y para qué sirve (negocio)

Verificar la autenticidad de una receta por su sello. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /public/prescriptions/{id}/verify` la atiende `ClinicalPrescriptionsPublicController.verify` (src/modules/clinical/controllers/clinical-prescriptions-public.controller.ts:45). Es una ruta pública: no exige token. Delega en `PrescriptionPdfService.verify`. Lee clinical.medication_requests, profiles.jurisdiction_authorizations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/clinical/controllers/clinical-prescriptions-public.controller.ts:45` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-prescriptions-public.controller.ts:45` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/clinical/controllers/clinical-prescriptions-public.controller.ts:45` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalPrescriptionsPublicController.verify → PrescriptionPdfService.verify → MedicationRequestsRepository.findById | `src/modules/clinical/repositories/medication-requests.repository.ts:147` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ClinicalPrescriptionsPublicController.verify → PrescriptionPdfService.verify → PrescriptionPdfService.resolvePrescriberLicense → JurisdictionAuthorizationsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:107` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PrescriptionVerificationResponseDto>` · DTO `PrescriptionVerificationResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/clinical/dto/prescription-verification.dto.ts:28` |
| `status` | `string` | Sí | valores: DRAFT, ISSUED, COMPLETED, INVALIDATED, REPLACED | — | — | `src/modules/clinical/dto/prescription-verification.dto.ts:33` |
| `issuedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/clinical/dto/prescription-verification.dto.ts:36` |
| `contentHash` | `object` | No | admite null | — | — | `src/modules/clinical/dto/prescription-verification.dto.ts:44` |
| `prescriberLicense` | `PrescriberLicenseDto` | No | admite null | — | — | `src/modules/clinical/dto/prescription-verification.dto.ts:47` |
| `prescriberLicense.number` | `string` | No | — | — | — | sin fuente |
| `prescriberLicense.authority` | `object` | No | admite null | — | — | sin fuente |
| `prescriberLicense.state` | `string` | No | valores: ACTIVE, PENDING | — | — | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Receta no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/clinical-prescriptions-pdf.int-spec.ts:181` |
| CONTROLADOR | `src/modules/clinical/controllers/clinical-prescriptions-public.controller.spec.ts:28` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalPrescriptionsPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 58. GET /sites/{siteId}/attending-practitioners

- **Origen:** CONTRATO
- **Nombre:** Profesionales a cargo posibles en la sede
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalAdtController.attendingPractitioners` — `src/modules/clinical/controllers/clinical-adt.controller.ts:282`

### Qué es y para qué sirve (negocio)

Profesionales a cargo posibles en la sede. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /sites/{siteId}/attending-practitioners` la atiende `ClinicalAdtController.attendingPractitioners` (src/modules/clinical/controllers/clinical-adt.controller.ts:282). Exige sesión; el controlador no declara roles. Delega en `InpatientAdtService.attendingPractitioners`. Lee delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.clinical_units, practice.practice_sites, practice.practitioner_role_assignments, practice.space_unit_assignments y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical/controllers/clinical-adt.controller.ts:282` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/clinical/controllers/clinical-adt.controller.ts:282` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.attendingPractitioners → InpatientAdtService.attendingPractitioners → InpatientReadUseCases.attendingPractitioners → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.attendingPractitioners → InpatientAdtService.attendingPractitioners → InpatientReadUseCases.attendingPractitioners → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.attendingPractitioners → InpatientAdtService.attendingPractitioners → InpatientReadUseCases.attendingPractitioners → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | ClinicalAdtController.attendingPractitioners → InpatientAdtService.attendingPractitioners → InpatientReadUseCases.attendingPractitioners → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | ClinicalAdtController.attendingPractitioners → InpatientAdtService.attendingPractitioners → InpatientReadUseCases.attendingPractitioners → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalAdtController.attendingPractitioners → InpatientAdtService.attendingPractitioners → InpatientReadUseCases.attendingPractitioners → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.attendingPractitioners → InpatientAdtService.attendingPractitioners → InpatientReadUseCases.attendingPractitioners | `src/modules/clinical/services/inpatient/inpatient-read.use-cases.ts:230` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.attendingPractitioners → InpatientAdtService.attendingPractitioners → InpatientReadUseCases.attendingPractitioners → InfrastructureAccessService.scopeFilter → CareSpaceOpsRepository.siteScopeIndex | `src/modules/practice/repositories/care-space-ops.repository.ts:473` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | ClinicalAdtController.attendingPractitioners → InpatientAdtService.attendingPractitioners → InpatientReadUseCases.attendingPractitioners | `src/modules/clinical/services/inpatient/inpatient-read.use-cases.ts:230` |

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

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-web-f2f3.int-spec.ts:238` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalAdtController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 59. GET /sites/{siteId}/census

- **Origen:** CONTRATO
- **Nombre:** Censo de un día
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalCensusController.view` — `src/modules/clinical/controllers/clinical-adt.controller.ts:339`

### Qué es y para qué sirve (negocio)

Censo de un día. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /sites/{siteId}/census` la atiende `ClinicalCensusController.view` (src/modules/clinical/controllers/clinical-adt.controller.ts:339). Exige sesión; el controlador no declara roles. Delega en `InpatientCensusService.view`. Lee clinical.encounter_locations, clinical.encounters, clinical.inpatient_census_adjustments, clinical.inpatient_census_days, delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, practice.care_spaces y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical/controllers/clinical-adt.controller.ts:339` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_QUERY | date (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/clinical/controllers/clinical-adt.controller.ts:339` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | LEE | LEE | POR_SQL | ClinicalCensusController.view → InpatientCensusService.view → InpatientCensusUseCases.view → InpatientCensusUseCases.compute → InpatientRepository.segments | `src/modules/clinical/repositories/inpatient.repository.ts:195` |
| `clinical.encounters` | LEE | LEE | POR_SQL | ClinicalCensusController.view → InpatientCensusService.view → InpatientCensusUseCases.view → InpatientCensusUseCases.compute → InpatientRepository.segments | `src/modules/clinical/repositories/inpatient.repository.ts:195` |
| `clinical.inpatient_census_adjustments` | LEE | LEE | DIRECTA | ClinicalCensusController.view → InpatientCensusService.view → InpatientCensusUseCases.view | `src/modules/clinical/services/inpatient/census.use-cases.ts:170` |
| `clinical.inpatient_census_days` | LEE | LEE | DIRECTA | ClinicalCensusController.view → InpatientCensusService.view → InpatientCensusUseCases.view | `src/modules/clinical/services/inpatient/census.use-cases.ts:158` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | ClinicalCensusController.view → InpatientCensusService.view → InpatientCensusUseCases.view → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | ClinicalCensusController.view → InpatientCensusService.view → InpatientCensusUseCases.view → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClinicalCensusController.view → InpatientCensusService.view → InpatientCensusUseCases.view → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | ClinicalCensusController.view → InpatientCensusService.view → InpatientCensusUseCases.view → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | ClinicalCensusController.view → InpatientCensusService.view → InpatientCensusUseCases.view → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalCensusController.view → InpatientCensusService.view → InpatientCensusUseCases.view → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | ClinicalCensusController.view → InpatientCensusService.view → InpatientCensusUseCases.view → InfrastructureAccessService.scopeFilter → CareSpaceOpsRepository.siteScopeIndex | `src/modules/practice/repositories/care-space-ops.repository.ts:473` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |
| `date` | query | Sí | `string` | — |
| `unitId` | query | No | `desconocido` | — |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-adt-f3-scope.int-spec.ts:75` |
| INTEGRACION | `test/integration/infrastructure-adt-f3.int-spec.ts:294` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalCensusController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 60. POST /sites/{siteId}/census/{date}/close

- **Origen:** CONTRATO
- **Nombre:** Cerrar el censo de un día
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalCensusController.close` — `src/modules/clinical/controllers/clinical-adt.controller.ts:356`

### Qué es y para qué sirve (negocio)

Cerrar el censo de un día. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /sites/{siteId}/census/{date}/close` la atiende `ClinicalCensusController.close` (src/modules/clinical/controllers/clinical-adt.controller.ts:356). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CloseCensusDto` (1 campo, 0 obligatorios). Delega en `InpatientCensusService.close`. Crea filas en clinical.inpatient_census_days, clinical.inpatient_census_entries, messaging.domain_events, messaging.outbox_messages. Lee clinical.encounter_locations, clinical.encounters, clinical.inpatient_census_days, delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, messaging.outbox_messages, practice.care_spaces y 3 más. Publica un evento calculado (eventType).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical/controllers/clinical-adt.controller.ts:356` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/clinical/controllers/clinical-adt.controller.ts:356` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | LEE | LEE | POR_SQL | ClinicalCensusController.close → InpatientCensusService.close → InpatientCensusUseCases.close → InpatientRepository.segments | `src/modules/clinical/repositories/inpatient.repository.ts:195` |
| `clinical.encounters` | LEE | LEE | POR_SQL | ClinicalCensusController.close → InpatientCensusService.close → InpatientCensusUseCases.close → InpatientRepository.segments | `src/modules/clinical/repositories/inpatient.repository.ts:195` |
| `clinical.inpatient_census_days` | ESCRIBE | CREA | DIRECTA | ClinicalCensusController.close → InpatientCensusService.close → InpatientCensusUseCases.close | `src/modules/clinical/services/inpatient/census.use-cases.ts:312` |
| `clinical.inpatient_census_days` | LEE | LEE | DIRECTA | ClinicalCensusController.close → InpatientCensusService.close → InpatientCensusUseCases.close | `src/modules/clinical/services/inpatient/census.use-cases.ts:286` |
| `clinical.inpatient_census_entries` | ESCRIBE | CREA | DIRECTA | ClinicalCensusController.close → InpatientCensusService.close → InpatientCensusUseCases.close | `src/modules/clinical/services/inpatient/census.use-cases.ts:351` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | ClinicalCensusController.close → InpatientCensusService.close → InpatientCensusUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | ClinicalCensusController.close → InpatientCensusService.close → InpatientCensusUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClinicalCensusController.close → InpatientCensusService.close → InpatientCensusUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | ClinicalCensusController.close → InpatientCensusService.close → InpatientCensusUseCases.close → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | ClinicalCensusController.close → InpatientCensusService.close → InpatientCensusUseCases.close → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | ClinicalCensusController.close → InpatientCensusService.close → InpatientCensusUseCases.close → AdtSupport.publish → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | ClinicalCensusController.close → InpatientCensusService.close → InpatientCensusUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | ClinicalCensusController.close → InpatientCensusService.close → InpatientCensusUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalCensusController.close → InpatientCensusService.close → InpatientCensusUseCases.close → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | ClinicalCensusController.close → InpatientCensusService.close → InpatientCensusUseCases.close → InpatientRepository.segments | `src/modules/clinical/repositories/inpatient.repository.ts:195` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `eventType` | `src/modules/clinical/services/inpatient/adt-support.ts:447` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |
| `date` | path | Sí | `string` | — |

### Cuerpo — DTO `CloseCensusDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `unitIds` | `array<string>` | No | formato uuid; máximo 200 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(200)` `@IsUUID('all', { each: true })` | — | `src/modules/clinical/dto/inpatient.dto.ts:308` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "unitIds": [
    "valor-ejemplo"
  ]
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
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; InsufficientRoleException: Su rol no permite esta acción sobre este espacio; InsufficientRoleException: Su rol no permite cerrar el censo de esas unidades; InsufficientRoleException: Su rol no permite cerrar el censo de ninguna unidad de la sede |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-adt-f3-scope.int-spec.ts:93` |
| INTEGRACION | `test/integration/infrastructure-adt-f3.int-spec.ts:288` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalCensusController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 61. GET /sites/{siteId}/inpatient-indicators

- **Origen:** CONTRATO
- **Nombre:** Indicadores hospitalarios (OPS)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalCensusController.indicators` — `src/modules/clinical/controllers/clinical-adt.controller.ts:402`

### Qué es y para qué sirve (negocio)

Indicadores hospitalarios (OPS). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /sites/{siteId}/inpatient-indicators` la atiende `ClinicalCensusController.indicators` (src/modules/clinical/controllers/clinical-adt.controller.ts:402). Exige sesión; el controlador no declara roles. Delega en `InpatientIndicatorsService.indicators`. Lee clinical.inpatient_census_adjustments, clinical.inpatient_census_days, delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.cleaning_orders, practice.clinical_units y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical/controllers/clinical-adt.controller.ts:402` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_QUERY | from (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | to (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/clinical/controllers/clinical-adt.controller.ts:402` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.inpatient_census_adjustments` | LEE | LEE | DIRECTA | ClinicalCensusController.indicators → InpatientIndicatorsService.indicators → InpatientCensusUseCases.indicators | `src/modules/clinical/services/inpatient/census.use-cases.ts:526` |
| `clinical.inpatient_census_days` | LEE | LEE | DIRECTA | ClinicalCensusController.indicators → InpatientIndicatorsService.indicators → InpatientCensusUseCases.indicators | `src/modules/clinical/services/inpatient/census.use-cases.ts:518` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | ClinicalCensusController.indicators → InpatientIndicatorsService.indicators → InpatientCensusUseCases.indicators → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | ClinicalCensusController.indicators → InpatientIndicatorsService.indicators → InpatientCensusUseCases.indicators → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClinicalCensusController.indicators → InpatientIndicatorsService.indicators → InpatientCensusUseCases.indicators → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | ClinicalCensusController.indicators → InpatientIndicatorsService.indicators → InpatientCensusUseCases.indicators → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.cleaning_orders` | LEE | LEE | POR_SQL | ClinicalCensusController.indicators → InpatientIndicatorsService.indicators → InpatientCensusUseCases.indicators → InpatientRepository.turnarounds | `src/modules/clinical/repositories/inpatient.repository.ts:253` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | ClinicalCensusController.indicators → InpatientIndicatorsService.indicators → InpatientCensusUseCases.indicators → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalCensusController.indicators → InpatientIndicatorsService.indicators → InpatientCensusUseCases.indicators → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | ClinicalCensusController.indicators → InpatientIndicatorsService.indicators → InpatientCensusUseCases.indicators → InfrastructureAccessService.scopeFilter → CareSpaceOpsRepository.siteScopeIndex | `src/modules/practice/repositories/care-space-ops.repository.ts:473` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |
| `from` | query | Sí | `string` | — |
| `to` | query | Sí | `string` | — |
| `unitId` | query | No | `desconocido` | — |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Espacio no encontrado; ResourceNotFoundException: Unidad clínica no encontrada; ResourceNotFoundException: Sitio no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/infrastructure-adt-f3-scope.int-spec.ts:84` |
| INTEGRACION | `test/integration/infrastructure-adt-f3.int-spec.ts:345` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalCensusController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 62. GET /sites/{siteId}/inpatients

- **Origen:** CONTRATO
- **Nombre:** Pacientes internados de una sede
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalAdtController.inpatients` — `src/modules/clinical/controllers/clinical-adt.controller.ts:254`

### Qué es y para qué sirve (negocio)

Pacientes internados de una sede. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /sites/{siteId}/inpatients` la atiende `ClinicalAdtController.inpatients` (src/modules/clinical/controllers/clinical-adt.controller.ts:254). Exige sesión; el controlador no declara roles. Delega en `InpatientAdtService.inpatients`. Lee clinical.encounter_locations, clinical.encounters, delegated_access.organization_user_assignments, directory.branch_memberships, directory.tenant_memberships, practice.care_spaces, practice.clinical_units, practice.practice_sites y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical/controllers/clinical-adt.controller.ts:254` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: siteId | `src/modules/clinical/controllers/clinical-adt.controller.ts:254` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | LEE | LEE | DIRECTA | ClinicalAdtController.inpatients → InpatientAdtService.inpatients → InpatientReadUseCases.inpatients | `src/modules/clinical/services/inpatient/inpatient-read.use-cases.ts:403` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalAdtController.inpatients → InpatientAdtService.inpatients → InpatientReadUseCases.inpatients | `src/modules/clinical/services/inpatient/inpatient-read.use-cases.ts:412` |
| `delegated_access.organization_user_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.inpatients → InpatientAdtService.inpatients → InpatientReadUseCases.inpatients → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → CareSpaceOpsRepository.grants | `src/modules/practice/repositories/care-space-ops.repository.ts:91` |
| `directory.branch_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.inpatients → InpatientAdtService.inpatients → InpatientReadUseCases.inpatients → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isBranchAdmin | `src/modules/practice/services/structure-access.service.ts:257` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ClinicalAdtController.inpatients → InpatientAdtService.inpatients → InpatientReadUseCases.inpatients → InfrastructureAccessService.assertCan → InfrastructureAccessService.actorScope → StructureAccessService.adminLevelOf → StructureAccessService.isOrganizationAdmin → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:75` |
| `practice.care_spaces` | LEE | LEE | DIRECTA | ClinicalAdtController.inpatients → InpatientAdtService.inpatients → InpatientReadUseCases.inpatients → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → CareSpacesRepository.findById | `src/modules/practice/repositories/care-spaces.repository.ts:85` |
| `practice.clinical_units` | LEE | LEE | DIRECTA | ClinicalAdtController.inpatients → InpatientAdtService.inpatients → InpatientReadUseCases.inpatients → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → ClinicalUnitsRepository.findById | `src/modules/practice/repositories/clinical-units.repository.ts:65` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ClinicalAdtController.inpatients → InpatientAdtService.inpatients → InpatientReadUseCases.inpatients → InfrastructureAccessService.assertCan → InfrastructureAccessService.resolve → PracticeSitesRepository.findById | `src/modules/practice/repositories/practice-sites.repository.ts:74` |
| `practice.space_unit_assignments` | LEE | LEE | POR_SQL | ClinicalAdtController.inpatients → InpatientAdtService.inpatients → InpatientReadUseCases.inpatients → InfrastructureAccessService.scopeFilter → CareSpaceOpsRepository.siteScopeIndex | `src/modules/practice/repositories/care-space-ops.repository.ts:473` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `siteId` | path | Sí | `string` | — |
| `unitId` | query | No | `desconocido` | — |

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

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalAdtController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

