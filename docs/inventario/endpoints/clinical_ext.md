<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `clinical_ext`

- **Bloque:** Clínico y Diagnóstico (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)
- **Operaciones:** 32 (32 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 2 · MEDIO 20 · BAJO 10
- **Tablas distintas que tocan:** 51
- **Respuestas de error y detalle contractual:** `openapi/endpoints/clinical-ext.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | PATCH | `/care-gaps/{id}/close` | Cerrar una brecha de cuidado por evento clínico | MEDIO | 2 | CLINICIAN, PRACTITIONER |
| 2 | POST | `/care-gaps/recompute` | Detectar y abrir brechas de cuidado (batch) | MEDIO | 18 | CLINICIAN, PRACTITIONER |
| 3 | GET | `/care-teams` | Listar equipos de cuidado de un paciente | BAJO | 19 | CLINICIAN, PRACTITIONER |
| 4 | POST | `/care-teams` | Crear un equipo de cuidado con sus miembros | MEDIO | 18 | CLINICIAN, PRACTITIONER |
| 5 | PATCH | `/care-teams/{id}/members/{memberId}/set-responsible` | Designar miembro responsable (transferir liderazgo) | MEDIO | 3 | CLINICIAN, PRACTITIONER |
| 6 | POST | `/cds-rules` | Crear una regla CDS en borrador | MEDIO | 2 | SECURITY_ADMIN |
| 7 | POST | `/cds-rules/{id}/versions/publish` | Publicar una versión de la regla CDS | MEDIO | 2 | SECURITY_ADMIN |
| 8 | POST | `/cds-rules/{id}/versions/rollback` | Rollback de la versión activa de la regla CDS | MEDIO | 2 | SECURITY_ADMIN |
| 9 | POST | `/cds/check-interactions` | Detectar interacciones medicamentosas al prescribir | BAJO | 1 | CLINICIAN, PRACTITIONER |
| 10 | POST | `/cds/evaluate` | Evaluar reglas CDS y generar alertas | MEDIO | 2 | CLINICIAN, PRACTITIONER |
| 11 | PATCH | `/clinical-alerts/{id}/acknowledge` | Reconocer una alerta clínica | BAJO | 1 | CLINICIAN, PRACTITIONER |
| 12 | PATCH | `/clinical-alerts/{id}/override` | Override (sobreescribir) una alerta clínica | BAJO | 1 | CLINICIAN, PRACTITIONER |
| 13 | POST | `/drug-interactions` | Registrar un par de interacción medicamentosa | MEDIO | 1 | SECURITY_ADMIN |
| 14 | POST | `/immunization-schedules` | Registrar una dosis del calendario de inmunización | MEDIO | 1 | SECURITY_ADMIN |
| 15 | POST | `/order-sets` | Crear una plantilla de órdenes (order set) con sus ítems | MEDIO | 3 | SECURITY_ADMIN |
| 16 | POST | `/order-sets/{id}/apply` | Aplicar un order set (fan-out de órdenes) | MEDIO | 20 | CLINICIAN, PRACTITIONER |
| 17 | POST | `/patients/{id}/immunization-plan/project` | Proyectar el plan de inmunización y abrir brechas | MEDIO | 20 | CLINICIAN, PRACTITIONER |
| 18 | GET | `/prescription-favorites` | Listar mis favoritos de prescripción | BAJO | 3 | sesión (sin roles) |
| 19 | POST | `/prescription-favorites` | Guardar un favorito de prescripción | ALTO | 4 | sesión (sin roles) |
| 20 | DELETE | `/prescription-favorites/{id}` | Borrar un favorito de prescripción propio | ALTO | 4 | sesión (sin roles) |
| 21 | GET | `/referrals` | Listar derivaciones de un paciente | BAJO | 22 | CLINICIAN, PRACTITIONER |
| 22 | POST | `/referrals` | Emitir una referencia desde un encuentro | MEDIO | 38 | CLINICIAN, PRACTITIONER |
| 23 | GET | `/referrals/{id}` | Leer una derivación | BAJO | 21 | CLINICIAN, PRACTITIONER |
| 24 | PATCH | `/referrals/{id}/cancel` | Anular una derivación | MEDIO | 20 | CLINICIAN, PRACTITIONER |
| 25 | PATCH | `/referrals/{id}/counter-referral` | Registrar la contrarreferencia de una derivación | MEDIO | 20 | CLINICIAN, PRACTITIONER |
| 26 | PATCH | `/referrals/{id}/respond` | Responder / aceptar una referencia inter-tenant | MEDIO | 3 | CLINICIAN, PRACTITIONER |
| 27 | GET | `/referrals/me` | Mis derivaciones | BAJO | 6 | CLINICIAN, PRACTITIONER, PATIENT |
| 28 | GET | `/referrals/target-services` | Servicios activos de un destino de derivación | BAJO | 4 | CLINICIAN, PRACTITIONER |
| 29 | GET | `/referrals/targets` | Buscar destinos de derivación | BAJO | 5 | CLINICIAN, PRACTITIONER |
| 30 | POST | `/virtual-encounters` | Iniciar una sesión de telesalud | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 31 | PATCH | `/virtual-encounters/{id}/end` | Finalizar una sesión de telesalud | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 32 | PATCH | `/virtual-encounters/{id}/join` | Unirse a una sesión de telesalud | MEDIO | 4 | CLINICIAN, PRACTITIONER, PATIENT |

---

## 1. PATCH /care-gaps/{id}/close

- **Origen:** CONTRATO
- **Nombre:** Cerrar una brecha de cuidado por evento clínico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareGapsController.close` — `src/modules/clinical_ext/controllers/care-gaps.controller.ts:63`

### Qué es y para qué sirve (negocio)

Cerrar una brecha de cuidado por evento clínico. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /care-gaps/{id}/close` la atiende `CareGapsController.close` (src/modules/clinical_ext/controllers/care-gaps.controller.ts:63). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CloseCareGapDto` (2 campos, 0 obligatorios). Delega en `CareGapsService.close`. Actualiza clinical_ext.care_gaps. Lee clinical_ext.care_gaps.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:63` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:63` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.care_gaps` | ESCRIBE | ACTUALIZA | POR_TIPO | CareGapsController.close → CareGapsService.close | `src/modules/clinical_ext/services/care-gaps.service.ts:168` |
| `clinical_ext.care_gaps` | LEE | LEE | DIRECTA | CareGapsController.close → CareGapsService.close → CareGapsRepository.findById | `src/modules/clinical_ext/repositories/care-gaps.repository.ts:45` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CloseCareGapDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `closedByResourceType` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Tipo de recurso que cierra la brecha | `src/modules/clinical_ext/dto/care-gap.dto.ts:73` |
| `closedByResourceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id del recurso que cierra la brecha | `src/modules/clinical_ext/dto/care-gap.dto.ts:84` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "closedByResourceType": "valor-ejemplo",
  "closedByResourceId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/clinical_ext/dto/operation-result.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {notFound.message} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La brecha no está abierta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/care-gaps.controller.spec.ts:40` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:CareGapsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /care-gaps/recompute

- **Origen:** CONTRATO
- **Nombre:** Detectar y abrir brechas de cuidado (batch)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareGapsController.recompute` — `src/modules/clinical_ext/controllers/care-gaps.controller.ts:46`

### Qué es y para qué sirve (negocio)

Detectar y abrir brechas de cuidado (batch). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /care-gaps/recompute` la atiende `CareGapsController.recompute` (src/modules/clinical_ext/controllers/care-gaps.controller.ts:46). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `RecomputeCareGapsDto` (5 campos, 3 obligatorios). Delega en `CareGapsService.recompute`. Crea filas en clinical_ext.care_gaps. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 9 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:46` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | CareGapsController.recompute → CareGapsService.recompute → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | CareGapsController.recompute → CareGapsService.recompute → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | CareGapsController.recompute → CareGapsService.recompute → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | CareGapsController.recompute → CareGapsService.recompute → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | CareGapsController.recompute → CareGapsService.recompute → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | CareGapsController.recompute → CareGapsService.recompute → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | CareGapsController.recompute → CareGapsService.recompute → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | CareGapsController.recompute → CareGapsService.recompute → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | CareGapsController.recompute → CareGapsService.recompute → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | CareGapsController.recompute → CareGapsService.recompute → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | CareGapsController.recompute → CareGapsService.recompute → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical_ext.care_gaps` | ESCRIBE | CREA | DIRECTA | CareGapsController.recompute → CareGapsService.recompute → CareGapsRepository.create | `src/modules/clinical_ext/repositories/care-gaps.repository.ts:72` |
| `clinical_ext.care_gaps` | LEE | LEE | DIRECTA | CareGapsController.recompute → CareGapsService.recompute → CareGapsRepository.findOpen | `src/modules/clinical_ext/repositories/care-gaps.repository.ts:56` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | CareGapsController.recompute → CareGapsService.recompute → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | CareGapsController.recompute → CareGapsService.recompute → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | CareGapsController.recompute → CareGapsService.recompute → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CareGapsController.recompute → CareGapsService.recompute → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CareGapsController.recompute → CareGapsService.recompute → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Cuerpo — DTO `RecomputeCareGapsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical_ext/dto/care-gap.dto.ts:51` |
| `gaps` | `array<CareGapInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => CareGapInputDto)` | — | `src/modules/clinical_ext/dto/care-gap.dto.ts:61` |
| `gaps[].gapTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Tipo de brecha (concept id) | `src/modules/clinical_ext/dto/care-gap.dto.ts:22` |
| `gaps[].measureConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Medida de calidad / vacuna (concept id) | `src/modules/clinical_ext/dto/care-gap.dto.ts:33` |
| `gaps[].dueDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | — | `src/modules/clinical_ext/dto/care-gap.dto.ts:41` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "gaps": [
    {
      "gapTypeConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "gaps": [
    {
      "gapTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "measureConceptId": "00000000-0000-4000-8000-000000000001",
      "dueDate": "2026-07-31"
    }
  ]
}
```

</details>

### Respuesta — `Promise<RecomputeCareGapsResponseDto>` · DTO `RecomputeCareGapsResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `opened` | `number` | Sí | — | — | Nº de brechas abiertas nuevas | `src/modules/clinical_ext/dto/care-gap.dto.ts:216` |
| `skipped` | `number` | Sí | — | — | Nº de brechas ya abiertas que se dejaron intactas | `src/modules/clinical_ext/dto/care-gap.dto.ts:224` |
| `openedIds` | `array<string>` | Sí | — | — | Ids de las brechas abiertas en esta corrida | `src/modules/clinical_ext/dto/care-gap.dto.ts:233` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/care-gaps.controller.spec.ts:33` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:CareGapsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. GET /care-teams

- **Origen:** CONTRATO
- **Nombre:** Listar equipos de cuidado de un paciente
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareTeamsController.listByPatient` — `src/modules/clinical_ext/controllers/care-teams.controller.ts:84`

### Qué es y para qué sirve (negocio)

Listar equipos de cuidado de un paciente. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /care-teams` la atiende `CareTeamsController.listByPatient` (src/modules/clinical_ext/controllers/care-teams.controller.ts:84). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `CareTeamsService.listByPatient`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 11 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/care-teams.controller.ts:84` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | patientProfileId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | CareTeamsController.listByPatient → CareTeamsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | CareTeamsController.listByPatient → CareTeamsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | CareTeamsController.listByPatient → CareTeamsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | CareTeamsController.listByPatient → CareTeamsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | CareTeamsController.listByPatient → CareTeamsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | CareTeamsController.listByPatient → CareTeamsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | CareTeamsController.listByPatient → CareTeamsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | CareTeamsController.listByPatient → CareTeamsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | CareTeamsController.listByPatient → CareTeamsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | CareTeamsController.listByPatient → CareTeamsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | CareTeamsController.listByPatient → CareTeamsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical_ext.care_teams` | LEE | LEE | DIRECTA | CareTeamsController.listByPatient → CareTeamsService.listByPatient → CareTeamsRepository.findByPatient | `src/modules/clinical_ext/repositories/care-teams.repository.ts:84` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | CareTeamsController.listByPatient → CareTeamsService.listByPatient → ClinicalReadService.assertCanReadHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | CareTeamsController.listByPatient → CareTeamsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | CareTeamsController.listByPatient → CareTeamsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | CareTeamsController.listByPatient → CareTeamsService.listByPatient → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | CareTeamsController.listByPatient → CareTeamsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CareTeamsController.listByPatient → CareTeamsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CareTeamsController.listByPatient → CareTeamsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/care-teams.controller.spec.ts:51` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:CareTeamsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /care-teams

- **Origen:** CONTRATO
- **Nombre:** Crear un equipo de cuidado con sus miembros
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareTeamsController.create` — `src/modules/clinical_ext/controllers/care-teams.controller.ts:45`

### Qué es y para qué sirve (negocio)

Crear un equipo de cuidado con sus miembros. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /care-teams` la atiende `CareTeamsController.create` (src/modules/clinical_ext/controllers/care-teams.controller.ts:45). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateCareTeamDto` (11 campos, 4 obligatorios). Delega en `CareTeamsService.create`. Crea filas en clinical_ext.care_team_members, clinical_ext.care_teams. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 8 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/care-teams.controller.ts:45` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | CareTeamsController.create → CareTeamsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | CareTeamsController.create → CareTeamsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | CareTeamsController.create → CareTeamsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | CareTeamsController.create → CareTeamsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | CareTeamsController.create → CareTeamsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | CareTeamsController.create → CareTeamsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | CareTeamsController.create → CareTeamsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | CareTeamsController.create → CareTeamsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | CareTeamsController.create → CareTeamsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | CareTeamsController.create → CareTeamsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | CareTeamsController.create → CareTeamsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical_ext.care_team_members` | ESCRIBE | CREA | DIRECTA | CareTeamsController.create → CareTeamsService.create → CareTeamMembersRepository.create | `src/modules/clinical_ext/repositories/care-team-members.repository.ts:80` |
| `clinical_ext.care_teams` | ESCRIBE | CREA | DIRECTA | CareTeamsController.create → CareTeamsService.create → CareTeamsRepository.create | `src/modules/clinical_ext/repositories/care-teams.repository.ts:92` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | CareTeamsController.create → CareTeamsService.create → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | CareTeamsController.create → CareTeamsService.create → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | CareTeamsController.create → CareTeamsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CareTeamsController.create → CareTeamsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CareTeamsController.create → CareTeamsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Cuerpo — DTO `CreateCareTeamDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente del equipo | `src/modules/clinical_ext/dto/care-team.dto.ts:61` |
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant custodio | `src/modules/clinical_ext/dto/care-team.dto.ts:68` |
| `episodeId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Episodio de cuidado | `src/modules/clinical_ext/dto/care-team.dto.ts:76` |
| `name` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/clinical_ext/dto/care-team.dto.ts:85` |
| `categoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Categoría del equipo (concept id) | `src/modules/clinical_ext/dto/care-team.dto.ts:96` |
| `periodStart` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/clinical_ext/dto/care-team.dto.ts:104` |
| `members` | `array<CareTeamMemberInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => CareTeamMemberInputDto)` | Miembros iniciales del equipo | `src/modules/clinical_ext/dto/care-team.dto.ts:117` |
| `members[].practitionerProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional de salud | `src/modules/clinical_ext/dto/care-team.dto.ts:23` |
| `members[].relatedPersonId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Persona relacionada (cuidador) | `src/modules/clinical_ext/dto/care-team.dto.ts:34` |
| `members[].memberRoleConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Rol del miembro (concept id) | `src/modules/clinical_ext/dto/care-team.dto.ts:41` |
| `members[].isResponsible` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Marca al miembro como responsable del equipo | `src/modules/clinical_ext/dto/care-team.dto.ts:51` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "members": [
    {
      "memberRoleConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "episodeId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "categoryConceptId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31T12:00:00.000Z",
  "members": [
    {
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "relatedPersonId": "00000000-0000-4000-8000-000000000001",
      "memberRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "isResponsible": true
    }
  ]
}
```

</details>

### Respuesta — `Promise<CareTeamResponseDto>` · DTO `CareTeamResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/care-team.dto.ts:147` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical_ext/dto/care-team.dto.ts:153` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado del equipo (concept id) | `src/modules/clinical_ext/dto/care-team.dto.ts:162` |
| `members` | `array<CareTeamMemberResponseDto>` | Sí | — | — | Valor de members mantenido por la instancia. | `src/modules/clinical_ext/dto/care-team.dto.ts:168` |
| `members[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/care-team.dto.ts:126` |
| `members[].memberRoleConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a member role concept. | `src/modules/clinical_ext/dto/care-team.dto.ts:132` |
| `members[].isResponsible` | `boolean` | Sí | — | — | Valor de is responsible mantenido por la instancia. | `src/modules/clinical_ext/dto/care-team.dto.ts:138` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical_ext/dto/care-team.dto.ts:174` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 409 | `CONFLICT` | ConflictException: A lo sumo un miembro puede ser responsable |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/care-teams.controller.spec.ts:33` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:CareTeamsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. PATCH /care-teams/{id}/members/{memberId}/set-responsible

- **Origen:** CONTRATO
- **Nombre:** Designar miembro responsable (transferir liderazgo)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareTeamsController.setResponsible` — `src/modules/clinical_ext/controllers/care-teams.controller.ts:61`

### Qué es y para qué sirve (negocio)

Designar miembro responsable (transferir liderazgo). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /care-teams/{id}/members/{memberId}/set-responsible` la atiende `CareTeamsController.setResponsible` (src/modules/clinical_ext/controllers/care-teams.controller.ts:61). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `CareTeamsService.setResponsible`. Actualiza clinical_ext.care_team_members. Lee clinical_ext.care_team_members, clinical_ext.care_teams.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/care-teams.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, memberId | `src/modules/clinical_ext/controllers/care-teams.controller.ts:61` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.care_team_members` | ESCRIBE | ACTUALIZA | POR_TIPO | CareTeamsController.setResponsible → CareTeamsService.setResponsible | `src/modules/clinical_ext/services/care-teams.service.ts:197` |
| `clinical_ext.care_team_members` | LEE | LEE | DIRECTA | CareTeamsController.setResponsible → CareTeamsService.setResponsible → CareTeamMembersRepository.findById | `src/modules/clinical_ext/repositories/care-team-members.repository.ts:53` |
| `clinical_ext.care_teams` | LEE | LEE | DIRECTA | CareTeamsController.setResponsible → CareTeamsService.setResponsible → CareTeamsRepository.findById | `src/modules/clinical_ext/repositories/care-teams.repository.ts:56` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `memberId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/clinical_ext/dto/operation-result.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Miembro no encontrado en el equipo |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El equipo no está activo; PreconditionFailedException: El miembro destino no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/care-teams.controller.spec.ts:41` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:CareTeamsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /cds-rules

- **Origen:** CONTRATO
- **Nombre:** Crear una regla CDS en borrador
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CdsController.createRule` — `src/modules/clinical_ext/controllers/cds.controller.ts:53`

### Qué es y para qué sirve (negocio)

Crear una regla CDS en borrador. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /cds-rules` la atiende `CdsController.createRule` (src/modules/clinical_ext/controllers/cds.controller.ts:53). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateCdsRuleDto` (7 campos, 2 obligatorios). Delega en `CdsService.createRule`. Crea filas en clinical_ext.cds_rules. Lee clinical_ext.cds_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/clinical_ext/controllers/cds.controller.ts:53` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.cds_rules` | ESCRIBE | CREA | DIRECTA | CdsController.createRule → CdsService.createRule → CdsRulesRepository.create | `src/modules/clinical_ext/repositories/cds-rules.repository.ts:100` |
| `clinical_ext.cds_rules` | LEE | LEE | DIRECTA | CdsController.createRule → CdsService.createRule → CdsRulesRepository.findByCode | `src/modules/clinical_ext/repositories/cds-rules.repository.ts:76` |

### Cuerpo — DTO `CreateCdsRuleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant propietario (null = global) | `src/modules/clinical_ext/dto/cds.dto.ts:27` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/clinical_ext/dto/cds.dto.ts:35` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/clinical_ext/dto/cds.dto.ts:43` |
| `ruleTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de regla (concept id) | `src/modules/clinical_ext/dto/cds.dto.ts:54` |
| `severityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Severidad de la alerta que genera (concept id) | `src/modules/clinical_ext/dto/cds.dto.ts:65` |
| `logicJson` | `object` | No | — | `@IsOptional()` `@MaxJsonSize(256 * 1024)` `@IsObject()` | Lógica de la regla (JSON) | `src/modules/clinical_ext/dto/cds.dto.ts:74` |
| `messageTemplate` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Plantilla del mensaje de alerta | `src/modules/clinical_ext/dto/cds.dto.ts:86` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "ruleTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "severityConceptId": "00000000-0000-4000-8000-000000000001",
  "logicJson": {},
  "messageTemplate": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<CdsRuleResponseDto>` · DTO `CdsRuleResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:314` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:320` |
| `version` | `number` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:326` |
| `isActive` | `boolean` | Sí | — | — | Valor de is active mantenido por la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:332` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/clinical_ext/dto/cds.dto.ts:338` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El código de regla ya existe |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La lógica de la regla no se puede interpretar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | UnparseableCdsRuleError: logic_json no es un objeto; UnparseableCdsRuleError: op 'in' exige un array en value; UnparseableCdsRuleError: op '{op}' exige un número en value; UnparseableCdsRuleError: operador no soportado: {op}; UnparseableCdsRuleError: nodo de lógica no reconocido |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/cds.controller.spec.ts:35` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:CdsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /cds-rules/{id}/versions/publish

- **Origen:** CONTRATO
- **Nombre:** Publicar una versión de la regla CDS
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CdsController.publish` — `src/modules/clinical_ext/controllers/cds.controller.ts:70`

### Qué es y para qué sirve (negocio)

Publicar una versión de la regla CDS. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /cds-rules/{id}/versions/publish` la atiende `CdsController.publish` (src/modules/clinical_ext/controllers/cds.controller.ts:70). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PublishRuleVersionDto` (3 campos, 0 obligatorios). Delega en `CdsService.publishVersion`. Actualiza clinical_ext.cds_rules. Lee clinical_ext.cds_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/clinical_ext/controllers/cds.controller.ts:70` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/cds.controller.ts:70` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.cds_rules` | ESCRIBE | ACTUALIZA | POR_TIPO | CdsController.publish → CdsService.publishVersion | `src/modules/clinical_ext/services/cds.service.ts:126` |
| `clinical_ext.cds_rules` | LEE | LEE | DIRECTA | CdsController.publish → CdsService.publishVersion → CdsRulesRepository.findById | `src/modules/clinical_ext/repositories/cds-rules.repository.ts:65` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PublishRuleVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `logicJson` | `object` | No | — | `@IsOptional()` `@MaxJsonSize(256 * 1024)` `@IsObject()` | Nueva lógica de la regla (JSON) | `src/modules/clinical_ext/dto/cds.dto.ts:98` |
| `messageTemplate` | `string` | No | — | `@IsOptional()` `@IsString()` | Nueva plantilla del mensaje | `src/modules/clinical_ext/dto/cds.dto.ts:106` |
| `severityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nueva severidad (concept id) | `src/modules/clinical_ext/dto/cds.dto.ts:117` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "logicJson": {},
  "messageTemplate": "valor-ejemplo",
  "severityConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<CdsRuleResponseDto>` · DTO `CdsRuleResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:314` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:320` |
| `version` | `number` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:326` |
| `isActive` | `boolean` | Sí | — | — | Valor de is active mantenido por la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:332` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/clinical_ext/dto/cds.dto.ts:338` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Regla CDS no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La lógica de la regla no se puede interpretar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | UnparseableCdsRuleError: logic_json no es un objeto; UnparseableCdsRuleError: op 'in' exige un array en value; UnparseableCdsRuleError: op '{op}' exige un número en value; UnparseableCdsRuleError: operador no soportado: {op}; UnparseableCdsRuleError: nodo de lógica no reconocido |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/cds.controller.spec.ts:42` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:CdsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. POST /cds-rules/{id}/versions/rollback

- **Origen:** CONTRATO
- **Nombre:** Rollback de la versión activa de la regla CDS
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CdsController.rollback` — `src/modules/clinical_ext/controllers/cds.controller.ts:88`

### Qué es y para qué sirve (negocio)

Rollback de la versión activa de la regla CDS. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /cds-rules/{id}/versions/rollback` la atiende `CdsController.rollback` (src/modules/clinical_ext/controllers/cds.controller.ts:88). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `CdsService.rollbackVersion`. Actualiza clinical_ext.cds_rules. Lee clinical_ext.cds_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/clinical_ext/controllers/cds.controller.ts:88` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/cds.controller.ts:88` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.cds_rules` | ESCRIBE | ACTUALIZA | POR_TIPO | CdsController.rollback → CdsService.rollbackVersion | `src/modules/clinical_ext/services/cds.service.ts:167` |
| `clinical_ext.cds_rules` | LEE | LEE | DIRECTA | CdsController.rollback → CdsService.rollbackVersion → CdsRulesRepository.findById | `src/modules/clinical_ext/repositories/cds-rules.repository.ts:65` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CdsRuleResponseDto>` · DTO `CdsRuleResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:314` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:320` |
| `version` | `number` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:326` |
| `isActive` | `boolean` | Sí | — | — | Valor de is active mantenido por la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:332` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/clinical_ext/dto/cds.dto.ts:338` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Regla CDS no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo se puede hacer rollback de una regla activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/cds.controller.spec.ts:48` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:CdsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /cds/check-interactions

- **Origen:** CONTRATO
- **Nombre:** Detectar interacciones medicamentosas al prescribir
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CdsController.checkInteractions` — `src/modules/clinical_ext/controllers/cds.controller.ts:137`

### Qué es y para qué sirve (negocio)

Detectar interacciones medicamentosas al prescribir. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /cds/check-interactions` la atiende `CdsController.checkInteractions` (src/modules/clinical_ext/controllers/cds.controller.ts:137). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CheckInteractionsDto` (4 campos, 2 obligatorios). Delega en `CdsService.checkInteractions`. Lee clinical_ext.drug_interactions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/cds.controller.ts:137` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.drug_interactions` | LEE | LEE | DIRECTA | CdsController.checkInteractions → CdsService.checkInteractions → DrugInteractionsRepository.findByPair | `src/modules/clinical_ext/repositories/drug-interactions.repository.ts:55` |

### Cuerpo — DTO `CheckInteractionsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical_ext/dto/cds.dto.ts:227` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical_ext/dto/cds.dto.ts:235` |
| `medicationRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Prescripción en borrador que se evalúa | `src/modules/clinical_ext/dto/cds.dto.ts:246` |
| `substanceConceptIds` | `array<string>` | Sí | formato uuid; mínimo 2 elemento(s) | `@IsArray()` `@ArrayMinSize(2)` `@IsUUID(undefined, { each: true })` | Concept ids de las sustancias activas + la nueva a prescribir | `src/modules/clinical_ext/dto/cds.dto.ts:259` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "substanceConceptIds": [
    "valor-ejemplo",
    "valor-ejemplo"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "medicationRequestId": "00000000-0000-4000-8000-000000000001",
  "substanceConceptIds": [
    "valor-ejemplo",
    "valor-ejemplo"
  ]
}
```

</details>

### Respuesta — `Promise<AlertBatchResponseDto>` · DTO `AlertBatchResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `alerts` | `array<GeneratedAlertDto>` | Sí | — | — | Valor de alerts mantenido por la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:374` |
| `alerts[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:347` |
| `alerts[].alertTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a alert type concept. | `src/modules/clinical_ext/dto/cds.dto.ts:353` |
| `alerts[].severityConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a severity concept. | `src/modules/clinical_ext/dto/cds.dto.ts:359` |
| `alerts[].ruleId` | `string` | No | formato uuid | — | Identificador asociado a rule. | `src/modules/clinical_ext/dto/cds.dto.ts:365` |
| `count` | `number` | Sí | — | — | Nº de alertas generadas | `src/modules/clinical_ext/dto/cds.dto.ts:380` |
| `unevaluatedRuleIds` | `array<string>` | No | formato uuid | — | Reglas activas que no se pudieron evaluar porque su lógica no se entiende. Ausente cuando todas se evaluaron: una alerta que no se disparó por eso no puede confundirse con una que no aplica. | `src/modules/clinical_ext/dto/cds.dto.ts:388` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/br14-encuentros-seguridad-clinica.int-spec.ts:196` |
| CONTROLADOR | `src/modules/clinical_ext/controllers/cds.controller.spec.ts:62` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:CdsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /cds/evaluate

- **Origen:** CONTRATO
- **Nombre:** Evaluar reglas CDS y generar alertas
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CdsController.evaluate` — `src/modules/clinical_ext/controllers/cds.controller.ts:113`

### Qué es y para qué sirve (negocio)

Evaluar reglas CDS y generar alertas. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /cds/evaluate` la atiende `CdsController.evaluate` (src/modules/clinical_ext/controllers/cds.controller.ts:113). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `EvaluateCdsDto` (9 campos, 1 obligatorio). Delega en `CdsService.evaluate`. Crea filas en clinical_ext.clinical_alerts. Lee clinical_ext.cds_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/cds.controller.ts:113` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.cds_rules` | LEE | LEE | DIRECTA | CdsController.evaluate → CdsService.evaluate → CdsRulesRepository.findActive | `src/modules/clinical_ext/repositories/cds-rules.repository.ts:85` |
| `clinical_ext.clinical_alerts` | ESCRIBE | CREA | DIRECTA | CdsController.evaluate → CdsService.evaluate → ClinicalAlertsRepository.create | `src/modules/clinical_ext/repositories/clinical-alerts.repository.ts:104` |

### Cuerpo — DTO `EvaluateCdsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical_ext/dto/cds.dto.ts:150` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical_ext/dto/cds.dto.ts:158` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant de las reglas a evaluar | `src/modules/clinical_ext/dto/cds.dto.ts:169` |
| `sourceResourceType` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Tipo del recurso disparador (p.ej. allergy_intolerance) | `src/modules/clinical_ext/dto/cds.dto.ts:180` |
| `sourceResourceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id del recurso disparador | `src/modules/clinical_ext/dto/cds.dto.ts:191` |
| `medicationConceptIds` | `array<string>` | No | formato uuid | `@IsOptional()` `@IsArray()` `@IsUUID('4', { each: true })` | Concept ids de los medicamentos activos del paciente (contexto de evaluación) | `src/modules/clinical_ext/dto/cds.dto.ts:204` |
| `observations` | `array<CdsObservationInputDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => CdsObservationInputDto)` | Observaciones del paciente (contexto de evaluación) | `src/modules/clinical_ext/dto/cds.dto.ts:217` |
| `observations[].codeConceptId` | `string` | No | formato uuid | `@IsUUID()` | Código de la observación (concept id) | `src/modules/clinical_ext/dto/cds.dto.ts:130` |
| `observations[].valueNumber` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Valor numérico observado (p.ej. glucemia) | `src/modules/clinical_ext/dto/cds.dto.ts:140` |

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
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "sourceResourceType": "valor-ejemplo",
  "sourceResourceId": "00000000-0000-4000-8000-000000000001",
  "medicationConceptIds": [
    "valor-ejemplo"
  ],
  "observations": [
    {
      "codeConceptId": "00000000-0000-4000-8000-000000000001",
      "valueNumber": 1
    }
  ]
}
```

</details>

### Respuesta — `Promise<AlertBatchResponseDto>` · DTO `AlertBatchResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `alerts` | `array<GeneratedAlertDto>` | Sí | — | — | Valor de alerts mantenido por la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:374` |
| `alerts[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:347` |
| `alerts[].alertTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a alert type concept. | `src/modules/clinical_ext/dto/cds.dto.ts:353` |
| `alerts[].severityConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a severity concept. | `src/modules/clinical_ext/dto/cds.dto.ts:359` |
| `alerts[].ruleId` | `string` | No | formato uuid | — | Identificador asociado a rule. | `src/modules/clinical_ext/dto/cds.dto.ts:365` |
| `count` | `number` | Sí | — | — | Nº de alertas generadas | `src/modules/clinical_ext/dto/cds.dto.ts:380` |
| `unevaluatedRuleIds` | `array<string>` | No | formato uuid | — | Reglas activas que no se pudieron evaluar porque su lógica no se entiende. Ausente cuando todas se evaluaron: una alerta que no se disparó por eso no puede confundirse con una que no aplica. | `src/modules/clinical_ext/dto/cds.dto.ts:388` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | UnparseableCdsRuleError: logic_json no es un objeto; UnparseableCdsRuleError: op 'in' exige un array en value; UnparseableCdsRuleError: op '{op}' exige un número en value; UnparseableCdsRuleError: operador no soportado: {op}; UnparseableCdsRuleError: nodo de lógica no reconocido |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/br14-encuentros-seguridad-clinica.int-spec.ts:188` |
| CONTROLADOR | `src/modules/clinical_ext/controllers/cds.controller.spec.ts:55` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:CdsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. PATCH /clinical-alerts/{id}/acknowledge

- **Origen:** CONTRATO
- **Nombre:** Reconocer una alerta clínica
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalAlertsController.acknowledge` — `src/modules/clinical_ext/controllers/clinical-alerts.controller.ts:37`

### Qué es y para qué sirve (negocio)

Reconocer una alerta clínica. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /clinical-alerts/{id}/acknowledge` la atiende `ClinicalAlertsController.acknowledge` (src/modules/clinical_ext/controllers/clinical-alerts.controller.ts:37). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `ClinicalAlertsService.acknowledge`. Lee clinical_ext.clinical_alerts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/clinical-alerts.controller.ts:37` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/clinical-alerts.controller.ts:37` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.clinical_alerts` | LEE | LEE | DIRECTA | ClinicalAlertsController.acknowledge → ClinicalAlertsService.acknowledge → ClinicalAlertsService.loadActive → ClinicalAlertsRepository.findById | `src/modules/clinical_ext/repositories/clinical-alerts.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ClinicalAlertResponseDto>` · DTO `ClinicalAlertResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/clinical-alert.dto.ts:25` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado de la alerta (concept id) | `src/modules/clinical_ext/dto/clinical-alert.dto.ts:34` |
| `overriddenAt` | `string` | No | formato date-time | — | Valor de overridden at mantenido por la instancia. | `src/modules/clinical_ext/dto/clinical-alert.dto.ts:40` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {notFound.message} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La alerta no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/clinical-alerts.controller.spec.ts:27` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:ClinicalAlertsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. PATCH /clinical-alerts/{id}/override

- **Origen:** CONTRATO
- **Nombre:** Override (sobreescribir) una alerta clínica
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalAlertsController.override` — `src/modules/clinical_ext/controllers/clinical-alerts.controller.ts:53`

### Qué es y para qué sirve (negocio)

Override (sobreescribir) una alerta clínica. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /clinical-alerts/{id}/override` la atiende `ClinicalAlertsController.override` (src/modules/clinical_ext/controllers/clinical-alerts.controller.ts:53). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `OverrideAlertDto` (1 campo, 0 obligatorios). Delega en `ClinicalAlertsService.override`. Lee clinical_ext.clinical_alerts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/clinical-alerts.controller.ts:53` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/clinical-alerts.controller.ts:53` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.clinical_alerts` | LEE | LEE | DIRECTA | ClinicalAlertsController.override → ClinicalAlertsService.override → ClinicalAlertsService.loadActive → ClinicalAlertsRepository.findById | `src/modules/clinical_ext/repositories/clinical-alerts.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `OverrideAlertDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Motivo del override (obligatorio para alertas de alta severidad) | `src/modules/clinical_ext/dto/clinical-alert.dto.ts:16` |

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

### Respuesta — `Promise<ClinicalAlertResponseDto>` · DTO `ClinicalAlertResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/clinical-alert.dto.ts:25` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado de la alerta (concept id) | `src/modules/clinical_ext/dto/clinical-alert.dto.ts:34` |
| `overriddenAt` | `string` | No | formato date-time | — | Valor de overridden at mantenido por la instancia. | `src/modules/clinical_ext/dto/clinical-alert.dto.ts:40` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {notFound.message} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La alerta no está activa; PreconditionFailedException: El override de una alerta de alta severidad requiere un motivo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/clinical-alerts.controller.spec.ts:34` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:ClinicalAlertsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /drug-interactions

- **Origen:** CONTRATO
- **Nombre:** Registrar un par de interacción medicamentosa
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CdsController.createDrugInteraction` — `src/modules/clinical_ext/controllers/cds.controller.ts:157`

### Qué es y para qué sirve (negocio)

Registrar un par de interacción medicamentosa. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /drug-interactions` la atiende `CdsController.createDrugInteraction` (src/modules/clinical_ext/controllers/cds.controller.ts:157). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateDrugInteractionDto` (5 campos, 2 obligatorios). Delega en `CdsService.createDrugInteraction`. Crea filas en clinical_ext.drug_interactions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/clinical_ext/controllers/cds.controller.ts:157` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.drug_interactions` | ESCRIBE | CREA | DIRECTA | CdsController.createDrugInteraction → CdsService.createDrugInteraction → DrugInteractionsRepository.create | `src/modules/clinical_ext/repositories/drug-interactions.repository.ts:71` |

### Cuerpo — DTO `CreateDrugInteractionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `substanceAConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical_ext/dto/cds.dto.ts:269` |
| `substanceBConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical_ext/dto/cds.dto.ts:276` |
| `severityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Severidad (concept id) | `src/modules/clinical_ext/dto/cds.dto.ts:287` |
| `mechanismText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/clinical_ext/dto/cds.dto.ts:296` |
| `managementText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/clinical_ext/dto/cds.dto.ts:305` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "substanceAConceptId": "00000000-0000-4000-8000-000000000001",
  "substanceBConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "substanceAConceptId": "00000000-0000-4000-8000-000000000001",
  "substanceBConceptId": "00000000-0000-4000-8000-000000000001",
  "severityConceptId": "00000000-0000-4000-8000-000000000001",
  "mechanismText": "valor-ejemplo",
  "managementText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<{ /** * Identificador único de la instancia. */ id: string; }>` · HTTP `HttpStatus.CREATED`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/cds.controller.spec.ts:69` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:CdsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. POST /immunization-schedules

- **Origen:** CONTRATO
- **Nombre:** Registrar una dosis del calendario de inmunización
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareGapsController.createSchedule` — `src/modules/clinical_ext/controllers/care-gaps.controller.ts:101`

### Qué es y para qué sirve (negocio)

Registrar una dosis del calendario de inmunización. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /immunization-schedules` la atiende `CareGapsController.createSchedule` (src/modules/clinical_ext/controllers/care-gaps.controller.ts:101). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateImmunizationScheduleDto` (7 campos, 2 obligatorios). Delega en `CareGapsService.createSchedule`. Crea filas en clinical_ext.immunization_schedules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:101` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.immunization_schedules` | ESCRIBE | CREA | DIRECTA | CareGapsController.createSchedule → CareGapsService.createSchedule → ImmunizationSchedulesRepository.create | `src/modules/clinical_ext/repositories/immunization-schedules.repository.ts:83` |

### Cuerpo — DTO `CreateImmunizationScheduleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical_ext/dto/care-gap.dto.ts:134` |
| `vaccineConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Vacuna (concept id) | `src/modules/clinical_ext/dto/care-gap.dto.ts:141` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/clinical_ext/dto/care-gap.dto.ts:149` |
| `recommendedAgeDays` | `number` | No | — | `@IsOptional()` `@IsInt()` | Edad recomendada en días desde el nacimiento | `src/modules/clinical_ext/dto/care-gap.dto.ts:159` |
| `doseNumber` | `number` | No | — | `@IsOptional()` `@IsInt()` | — | `src/modules/clinical_ext/dto/care-gap.dto.ts:167` |
| `intervalDays` | `number` | No | — | `@IsOptional()` `@IsInt()` | — | `src/modules/clinical_ext/dto/care-gap.dto.ts:175` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical_ext/dto/care-gap.dto.ts:183` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "vaccineConceptId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "vaccineConceptId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "recommendedAgeDays": 1,
  "doseNumber": 1,
  "intervalDays": 1,
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<{ /** * Identificador único de la instancia. */ id: string; }>` · HTTP `HttpStatus.CREATED`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/care-gaps.controller.spec.ts:58` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:CareGapsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. POST /order-sets

- **Origen:** CONTRATO
- **Nombre:** Crear una plantilla de órdenes (order set) con sus ítems
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrderSetsController.create` — `src/modules/clinical_ext/controllers/order-sets.controller.ts:41`

### Qué es y para qué sirve (negocio)

Crear una plantilla de órdenes (order set) con sus ítems. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /order-sets` la atiende `OrderSetsController.create` (src/modules/clinical_ext/controllers/order-sets.controller.ts:41). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateOrderSetDto` (12 campos, 4 obligatorios). Delega en `OrderSetsService.create`. Crea filas en clinical_ext.order_set_items, clinical_ext.order_sets. Lee clinical_ext.order_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/clinical_ext/controllers/order-sets.controller.ts:41` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.order_set_items` | ESCRIBE | CREA | DIRECTA | OrderSetsController.create → OrderSetsService.create → OrderSetsRepository.createItem | `src/modules/clinical_ext/repositories/order-sets.repository.ts:159` |
| `clinical_ext.order_sets` | ESCRIBE | CREA | DIRECTA | OrderSetsController.create → OrderSetsService.create → OrderSetsRepository.create | `src/modules/clinical_ext/repositories/order-sets.repository.ts:134` |
| `clinical_ext.order_sets` | LEE | LEE | DIRECTA | OrderSetsController.create → OrderSetsService.create → OrderSetsRepository.findByCode | `src/modules/clinical_ext/repositories/order-sets.repository.ts:108` |

### Cuerpo — DTO `CreateOrderSetDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical_ext/dto/order-set.dto.ts:81` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/clinical_ext/dto/order-set.dto.ts:89` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/clinical_ext/dto/order-set.dto.ts:97` |
| `description` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/clinical_ext/dto/order-set.dto.ts:105` |
| `specialtyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical_ext/dto/order-set.dto.ts:113` |
| `items` | `array<OrderSetItemInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => OrderSetItemInputDto)` | — | `src/modules/clinical_ext/dto/order-set.dto.ts:123` |
| `items[].itemTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de ítem (concept id) | `src/modules/clinical_ext/dto/order-set.dto.ts:26` |
| `items[].codeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Código de la orden (concept id) | `src/modules/clinical_ext/dto/order-set.dto.ts:36` |
| `items[].defaultDoseText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/clinical_ext/dto/order-set.dto.ts:45` |
| `items[].defaultFrequencyText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/clinical_ext/dto/order-set.dto.ts:54` |
| `items[].isSelectedDefault` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Seleccionado por defecto al aplicar | `src/modules/clinical_ext/dto/order-set.dto.ts:62` |
| `items[].ordinal` | `number` | No | — | `@IsOptional()` `@IsInt()` | — | `src/modules/clinical_ext/dto/order-set.dto.ts:70` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
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
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "itemTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "codeConceptId": "00000000-0000-4000-8000-000000000001",
      "defaultDoseText": "valor-ejemplo",
      "defaultFrequencyText": "valor-ejemplo",
      "isSelectedDefault": true,
      "ordinal": 1
    }
  ]
}
```

</details>

### Respuesta — `Promise<OrderSetResponseDto>` · DTO `OrderSetResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/order-set.dto.ts:174` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/clinical_ext/dto/order-set.dto.ts:180` |
| `version` | `number` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/clinical_ext/dto/order-set.dto.ts:186` |
| `itemCount` | `number` | Sí | — | — | Nº de ítems creados | `src/modules/clinical_ext/dto/order-set.dto.ts:192` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/clinical_ext/dto/order-set.dto.ts:198` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El código de order set ya existe |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/order-sets.controller.spec.ts:28` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:OrderSetsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. POST /order-sets/{id}/apply

- **Origen:** CONTRATO
- **Nombre:** Aplicar un order set (fan-out de órdenes)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrderSetsController.apply` — `src/modules/clinical_ext/controllers/order-sets.controller.ts:60`

### Qué es y para qué sirve (negocio)

Aplicar un order set (fan-out de órdenes). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /order-sets/{id}/apply` la atiende `OrderSetsController.apply` (src/modules/clinical_ext/controllers/order-sets.controller.ts:60). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `ApplyOrderSetDto` (4 campos, 2 obligatorios). Delega en `OrderSetsService.apply`. Crea filas en clinical.service_requests. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 11 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/order-sets.controller.ts:60` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/order-sets.controller.ts:60` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | OrderSetsController.apply → OrderSetsService.apply → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | OrderSetsController.apply → OrderSetsService.apply → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | OrderSetsController.apply → OrderSetsService.apply → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | OrderSetsController.apply → OrderSetsService.apply → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | OrderSetsController.apply → OrderSetsService.apply → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | OrderSetsController.apply → OrderSetsService.apply → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | OrderSetsController.apply → OrderSetsService.apply → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | OrderSetsController.apply → OrderSetsService.apply → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | OrderSetsController.apply → OrderSetsService.apply → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | OrderSetsController.apply → OrderSetsService.apply → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | OrderSetsController.apply → OrderSetsService.apply → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical_ext.order_set_items` | LEE | LEE | DIRECTA | OrderSetsController.apply → OrderSetsService.apply → OrderSetsRepository.itemsBySet | `src/modules/clinical_ext/repositories/order-sets.repository.ts:119` |
| `clinical_ext.order_sets` | LEE | LEE | DIRECTA | OrderSetsController.apply → OrderSetsService.apply → OrderSetsRepository.findById | `src/modules/clinical_ext/repositories/order-sets.repository.ts:97` |
| `clinical.encounters` | LEE | LEE | DIRECTA | OrderSetsController.apply → OrderSetsService.apply → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:169` |
| `clinical.service_requests` | ESCRIBE | CREA | DIRECTA | OrderSetsController.apply → OrderSetsService.apply → ServiceRequestsRepository.create | `src/modules/clinical/repositories/service-requests.repository.ts:104` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | OrderSetsController.apply → OrderSetsService.apply → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | OrderSetsController.apply → OrderSetsService.apply → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | OrderSetsController.apply → OrderSetsService.apply → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | OrderSetsController.apply → OrderSetsService.apply → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | OrderSetsController.apply → OrderSetsService.apply → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ApplyOrderSetDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `encounterId` | `string` | Sí | formato uuid | `@IsUUID()` | Encuentro clínico abierto | `src/modules/clinical_ext/dto/order-set.dto.ts:133` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical_ext/dto/order-set.dto.ts:140` |
| `custodianTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant custodio de las órdenes derivadas; si se omite, se usa el del order set | `src/modules/clinical_ext/dto/order-set.dto.ts:152` |
| `selectedItemIds` | `array<string>` | No | formato uuid | `@IsOptional()` `@IsArray()` `@IsUUID('4', { each: true })` | Ítems seleccionados explícitamente; si se omite, se usan los default | `src/modules/clinical_ext/dto/order-set.dto.ts:165` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "selectedItemIds": [
    "valor-ejemplo"
  ]
}
```

</details>

### Respuesta — `Promise<ApplyOrderSetResponseDto>` · DTO `ApplyOrderSetResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `orderSetId` | `string` | Sí | formato uuid | — | Identificador asociado a order set. | `src/modules/clinical_ext/dto/order-set.dto.ts:243` |
| `appliedOrders` | `array<AppliedOrderDto>` | Sí | — | — | Valor de applied orders mantenido por la instancia. | `src/modules/clinical_ext/dto/order-set.dto.ts:249` |
| `appliedOrders[].serviceRequestId` | `string` | Sí | formato uuid | — | Service request persistido para este ítem | `src/modules/clinical_ext/dto/order-set.dto.ts:210` |
| `appliedOrders[].orderSetItemId` | `string` | Sí | formato uuid | — | Identificador asociado a order set item. | `src/modules/clinical_ext/dto/order-set.dto.ts:216` |
| `appliedOrders[].codeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a code concept. | `src/modules/clinical_ext/dto/order-set.dto.ts:222` |
| `appliedOrders[].doseText` | `string` | No | — | — | Valor de dose text mantenido por la instancia. | `src/modules/clinical_ext/dto/order-set.dto.ts:228` |
| `appliedOrders[].frequencyText` | `string` | No | — | — | Valor de frequency text mantenido por la instancia. | `src/modules/clinical_ext/dto/order-set.dto.ts:234` |
| `count` | `number` | Sí | — | — | Nº de órdenes generadas | `src/modules/clinical_ext/dto/order-set.dto.ts:255` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado; ResourceNotFoundException: Order set no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El order set no está activo; PreconditionFailedException: No hay ítems seleccionados para aplicar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/order-sets.controller.spec.ts:35` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:OrderSetsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. POST /patients/{id}/immunization-plan/project

- **Origen:** CONTRATO
- **Nombre:** Proyectar el plan de inmunización y abrir brechas
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareGapsController.projectImmunizationPlan` — `src/modules/clinical_ext/controllers/care-gaps.controller.ts:81`

### Qué es y para qué sirve (negocio)

Proyectar el plan de inmunización y abrir brechas. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /patients/{id}/immunization-plan/project` la atiende `CareGapsController.projectImmunizationPlan` (src/modules/clinical_ext/controllers/care-gaps.controller.ts:81). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `ProjectImmunizationPlanDto` (3 campos, 0 obligatorios). Delega en `CareGapsService.projectImmunizationPlan`. Crea filas en clinical_ext.care_gaps. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 11 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:81` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:81` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical_ext.care_gaps` | ESCRIBE | CREA | DIRECTA | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → CareGapsRepository.create | `src/modules/clinical_ext/repositories/care-gaps.repository.ts:72` |
| `clinical_ext.care_gaps` | LEE | LEE | DIRECTA | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → CareGapsRepository.findOpen | `src/modules/clinical_ext/repositories/care-gaps.repository.ts:56` |
| `clinical_ext.immunization_schedules` | LEE | LEE | DIRECTA | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → ImmunizationSchedulesRepository.findActive | `src/modules/clinical_ext/repositories/immunization-schedules.repository.ts:61` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → CareGapsService.resolveBirthDate → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ProjectImmunizationPlanDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `birthDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | Opcional y sólo de contraste: la fecha de nacimiento se toma del perfil del paciente; si se envía y difiere, se rechaza | `src/modules/clinical_ext/dto/care-gap.dto.ts:100` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Jurisdicción del calendario (concept id) | `src/modules/clinical_ext/dto/care-gap.dto.ts:111` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Opcional y sólo de contraste: el calendario es el del tenant activo; si se envía y difiere, se rechaza | `src/modules/clinical_ext/dto/care-gap.dto.ts:123` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "birthDate": "2026-07-31",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ImmunizationPlanResponseDto>` · DTO `ImmunizationPlanResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `gapsOpened` | `number` | Sí | — | — | Nº de brechas de dosis abiertas | `src/modules/clinical_ext/dto/care-gap.dto.ts:242` |
| `dosesEvaluated` | `number` | Sí | — | — | Nº de dosis del calendario evaluadas | `src/modules/clinical_ext/dto/care-gap.dto.ts:248` |
| `openedIds` | `array<string>` | Sí | — | — | Valor de opened ids mantenido por la instancia. | `src/modules/clinical_ext/dto/care-gap.dto.ts:254` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El perfil del paciente no tiene una fecha de nacimiento válida; PreconditionFailedException: La fecha de nacimiento enviada no coincide con la del perfil del paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/care-gaps.controller.spec.ts:47` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:CareGapsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. GET /prescription-favorites

- **Origen:** CONTRATO
- **Nombre:** Listar mis favoritos de prescripción
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PrescriptionFavoritesController.listOwn` — `src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:43`

### Qué es y para qué sirve (negocio)

Listar mis favoritos de prescripción. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /prescription-favorites` la atiende `PrescriptionFavoritesController.listOwn` (src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:43). Exige sesión; el controlador no declara roles. Delega en `PrescriptionFavoritesService.listOwn`. Lee clinical_ext.prescription_favorites, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:43` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.prescription_favorites` | LEE | LEE | DIRECTA | PrescriptionFavoritesController.listOwn → PrescriptionFavoritesService.listOwn → PrescriptionFavoritesRepository.findByPractitioner | `src/modules/clinical_ext/repositories/prescription-favorites.repository.ts:80` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | PrescriptionFavoritesController.listOwn → PrescriptionFavoritesService.listOwn → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PrescriptionFavoritesController.listOwn → PrescriptionFavoritesService.listOwn → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PrescriptionFavoriteResponseDto[]>` · DTO `PrescriptionFavoriteResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la instancia. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:119` |
| `name` | `string` | Sí | — | — | Rótulo del favorito. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:125` |
| `medicationConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a medication concept. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:131` |
| `substanceAtcConceptId` | `string` | No | formato uuid | — | Identificador asociado a substance atc concept. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:137` |
| `doseText` | `string` | No | — | — | Posología por defecto. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:143` |
| `routeConceptId` | `string` | No | formato uuid | — | Identificador asociado a route concept. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:149` |
| `frequencyText` | `string` | No | — | — | Frecuencia por defecto. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:155` |
| `quantityDecimal` | `string` | No | — | — | Cantidad por defecto. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:161` |
| `unitConceptId` | `string` | No | formato uuid | — | Identificador asociado a unit concept. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:167` |
| `patientInstructionsText` | `string` | No | — | — | Indicaciones al paciente por defecto. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:173` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:PrescriptionFavoritesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. POST /prescription-favorites

- **Origen:** CONTRATO
- **Nombre:** Guardar un favorito de prescripción
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PrescriptionFavoritesController.create` — `src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:57`

### Qué es y para qué sirve (negocio)

Guardar un favorito de prescripción. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /prescription-favorites` la atiende `PrescriptionFavoritesController.create` (src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:57). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreatePrescriptionFavoriteDto` (9 campos, 2 obligatorios). Delega en `PrescriptionFavoritesService.create`. Crea filas en clinical_ext.prescription_favorites. Lee clinical_ext.prescription_favorites, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:57` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.prescription_favorites` | ESCRIBE | CREA | DIRECTA | PrescriptionFavoritesController.create → PrescriptionFavoritesService.create → PrescriptionFavoritesRepository.create | `src/modules/clinical_ext/repositories/prescription-favorites.repository.ts:129` |
| `clinical_ext.prescription_favorites` | LEE | LEE | DIRECTA | PrescriptionFavoritesController.create → PrescriptionFavoritesService.create → PrescriptionFavoritesRepository.countByPractitioner | `src/modules/clinical_ext/repositories/prescription-favorites.repository.ts:115` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | PrescriptionFavoritesController.create → PrescriptionFavoritesService.create → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PrescriptionFavoritesController.create → PrescriptionFavoritesService.create → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Cuerpo — DTO `CreatePrescriptionFavoriteDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 120 | `@IsString()` `@MinLength(1)` `@MaxLength(120)` | Rótulo del favorito, único dentro de la lista del profesional (p. ej. «ATB post extracción») | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:25` |
| `medicationConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Medicamento codificado (terminology.catalog_concepts) | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:35` |
| `substanceAtcConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Principio activo ATC | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:43` |
| `doseText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Posología por defecto | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:55` |
| `routeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Vía de administración por defecto | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:66` |
| `frequencyText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Frecuencia por defecto | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:78` |
| `quantityDecimal` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Cantidad por defecto | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:86` |
| `unitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad de la cantidad | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:97` |
| `patientInstructionsText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Indicaciones al paciente por defecto, separadas de la posología | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:110` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "name": "Nombre de ejemplo",
  "medicationConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "name": "Nombre de ejemplo",
  "medicationConceptId": "00000000-0000-4000-8000-000000000001",
  "substanceAtcConceptId": "00000000-0000-4000-8000-000000000001",
  "doseText": "valor-ejemplo",
  "routeConceptId": "00000000-0000-4000-8000-000000000001",
  "frequencyText": "valor-ejemplo",
  "quantityDecimal": 1,
  "unitConceptId": "00000000-0000-4000-8000-000000000001",
  "patientInstructionsText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<PrescriptionFavoriteResponseDto>` · DTO `PrescriptionFavoriteResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la instancia. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:119` |
| `name` | `string` | Sí | — | — | Rótulo del favorito. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:125` |
| `medicationConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a medication concept. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:131` |
| `substanceAtcConceptId` | `string` | No | formato uuid | — | Identificador asociado a substance atc concept. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:137` |
| `doseText` | `string` | No | — | — | Posología por defecto. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:143` |
| `routeConceptId` | `string` | No | formato uuid | — | Identificador asociado a route concept. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:149` |
| `frequencyText` | `string` | No | — | — | Frecuencia por defecto. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:155` |
| `quantityDecimal` | `string` | No | — | — | Cantidad por defecto. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:161` |
| `unitConceptId` | `string` | No | formato uuid | — | Identificador asociado a unit concept. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:167` |
| `patientInstructionsText` | `string` | No | — | — | Indicaciones al paciente por defecto. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:173` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado |
| 409 | `CONFLICT` | ConflictException: Ya tiene un favorito con ese nombre |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La lista de favoritos llegó a su máximo; borre alguno antes de guardar otro |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:PrescriptionFavoritesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. DELETE /prescription-favorites/{id}

- **Origen:** CONTRATO
- **Nombre:** Borrar un favorito de prescripción propio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Borra filas; Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PrescriptionFavoritesController.remove` — `src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:73`

### Qué es y para qué sirve (negocio)

Borrar un favorito de prescripción propio. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`DELETE /prescription-favorites/{id}` la atiende `PrescriptionFavoritesController.remove` (src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:73). Exige sesión; el controlador no declara roles. Delega en `PrescriptionFavoritesService.remove`. Borra de clinical_ext.prescription_favorites. Lee clinical_ext.prescription_favorites, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:73` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:73` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.prescription_favorites` | BORRA | BORRA | POR_TIPO | PrescriptionFavoritesController.remove → PrescriptionFavoritesService.remove | `src/modules/clinical_ext/services/prescription-favorites.service.ts:190` |
| `clinical_ext.prescription_favorites` | LEE | LEE | DIRECTA | PrescriptionFavoritesController.remove → PrescriptionFavoritesService.remove → PrescriptionFavoritesRepository.findById | `src/modules/clinical_ext/repositories/prescription-favorites.repository.ts:101` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | PrescriptionFavoritesController.remove → PrescriptionFavoritesService.remove → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PrescriptionFavoritesController.remove → PrescriptionFavoritesService.remove → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

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
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Favorito no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:PrescriptionFavoritesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. GET /referrals

- **Origen:** CONTRATO
- **Nombre:** Listar derivaciones de un paciente
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReferralsController.listByPatient` — `src/modules/clinical_ext/controllers/referrals.controller.ts:162`

### Qué es y para qué sirve (negocio)

Listar derivaciones de un paciente. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /referrals` la atiende `ReferralsController.listByPatient` (src/modules/clinical_ext/controllers/referrals.controller.ts:162). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `ReferralsService.listByPatient`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 14 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/referrals.controller.ts:162` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | patientProfileId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ReferralsController.listByPatient → ReferralsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ReferralsController.listByPatient → ReferralsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ReferralsController.listByPatient → ReferralsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ReferralsController.listByPatient → ReferralsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ReferralsController.listByPatient → ReferralsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ReferralsController.listByPatient → ReferralsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ReferralsController.listByPatient → ReferralsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ReferralsController.listByPatient → ReferralsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ReferralsController.listByPatient → ReferralsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ReferralsController.listByPatient → ReferralsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ReferralsController.listByPatient → ReferralsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `billing.service_catalog` | LEE | LEE | DIRECTA | ReferralsController.listByPatient → ReferralsService.listByPatient → ReferralsService.toListItems → SchedulingOfferingsRepository.findCatalogItems | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:116` |
| `clinical_ext.referrals` | LEE | LEE | DIRECTA | ReferralsController.listByPatient → ReferralsService.listByPatient → ReferralsRepository.findByPatient | `src/modules/clinical_ext/repositories/referrals.repository.ts:166` |
| `directory.branches` | LEE | LEE | DIRECTA | ReferralsController.listByPatient → ReferralsService.listByPatient → ReferralsService.toListItems → ReferralsService.resolveNames | `src/modules/clinical_ext/services/referrals.service.ts:678` |
| `directory.tenants` | LEE | LEE | DIRECTA | ReferralsController.listByPatient → ReferralsService.listByPatient → ReferralsService.toListItems → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:77` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ReferralsController.listByPatient → ReferralsService.listByPatient → ClinicalReadService.assertCanReadHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | ReferralsController.listByPatient → ReferralsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ReferralsController.listByPatient → ReferralsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ReferralsController.listByPatient → ReferralsService.listByPatient → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ReferralsController.listByPatient → ReferralsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ReferralsController.listByPatient → ReferralsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ReferralsController.listByPatient → ReferralsService.listByPatient → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReferralListItemDto[]>` · DTO `ReferralListItemDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:435` |
| `patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:441` |
| `status` | `string` | Sí | valores: PENDING, ACCEPTED, REJECTED, COMPLETED, CANCELLED | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:449` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado de la referencia (concept id) | `src/modules/clinical_ext/dto/referral.dto.ts:458` |
| `referralType` | `string` | Sí | valores: TREATMENT, CONSULTATION, DIAGNOSTIC_STUDY, PROCEDURE, SECOND_OPINION, THERAPY, HOSPITALIZATION, OTHER; admite null | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:465` |
| `referralTypeConceptId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:471` |
| `targetServiceCatalogId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:477` |
| `sourceEncounterId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:483` |
| `referringProfileId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:489` |
| `targetProfileId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:495` |
| `targetTenantId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:501` |
| `targetTenantName` | `string` | No | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:507` |
| `targetBranchId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:513` |
| `targetBranchName` | `string` | No | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:519` |
| `targetExternalName` | `string` | No | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:525` |
| `targetExternalContact` | `string` | No | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:531` |
| `specialtyConceptId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:537` |
| `serviceRequestId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:543` |
| `requestedServiceText` | `string` | No | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:549` |
| `requestedServiceConceptId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:555` |
| `reasonConceptId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:561` |
| `reasonText` | `string` | No | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:567` |
| `diagnosisText` | `string` | No | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:573` |
| `clinicalSummary` | `string` | No | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:579` |
| `treatmentGivenText` | `string` | No | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:585` |
| `informedConsentId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:591` |
| `priorityConceptId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:597` |
| `validUntil` | `string` | No | formato date | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:603` |
| `respondedAt` | `string` | No | formato date-time | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:609` |
| `rejectReason` | `string` | No | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:615` |
| `counterReferralText` | `string` | No | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:621` |
| `counterReferralAt` | `string` | No | formato date-time | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:627` |
| `updatedAt` | `string` | No | formato date-time | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:633` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:639` |
| `createdByUserId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:662` |
| `updatedByUserId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:666` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:670` |
| `targetDisplayName` | `string` | Sí | admite null | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:674` |
| `targetServiceName` | `string` | Sí | admite null | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:678` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/referrals.controller.spec.ts:60` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:ReferralsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. POST /referrals

- **Origen:** CONTRATO
- **Nombre:** Emitir una referencia desde un encuentro
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReferralsController.create` — `src/modules/clinical_ext/controllers/referrals.controller.ts:66`

### Qué es y para qué sirve (negocio)

Emitir una referencia desde un encuentro. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /referrals` la atiende `ReferralsController.create` (src/modules/clinical_ext/controllers/referrals.controller.ts:66). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `ClinicalExtCreateReferralDto` (21 campos, 1 obligatorio). Delega en `ReferralsService.create`. Crea filas en clinical_ext.referrals, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza iam.devices, messaging.notification_requests. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 24 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/referrals.controller.ts:66` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `billing.service_catalog` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ReferralsService.assertServiceOfTarget → ServiceCatalogRepository.findById | `src/modules/billing/repositories/service-catalog.repository.ts:89` |
| `clinical_ext.referrals` | ESCRIBE | CREA | DIRECTA | ReferralsController.create → ReferralsService.create → ReferralsRepository.create | `src/modules/clinical_ext/repositories/referrals.repository.ts:174` |
| `clinical_ext.referrals` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ReferralsRepository.findDuplicate | `src/modules/clinical_ext/repositories/referrals.repository.ts:140` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ReferralsService.assertEncounterBelongsToPatient → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:169` |
| `directory.branches` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create | `src/modules/clinical_ext/services/referrals.service.ts:292` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | ReferralsController.create → ReferralsService.create → ReferralNotifier.notifyRecommended → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ReferralNotifier.notifyRecommended → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | ReferralsController.create → ReferralsService.create → ReferralNotifier.notifyRecommended → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ReferralNotifier.notifyRecommended → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ReferralNotifier.notifyRecommended → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ReferralNotifier.notifyRecommended → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | ReferralsController.create → ReferralsService.create → ReferralNotifier.notifyRecommended → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ReferralNotifier.notifyRecommended → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | ReferralsController.create → ReferralsService.create → ReferralNotifier.notifyRecommended → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ReferralsController.create → ReferralsService.create → ReferralNotifier.notifyRecommended → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ReferralNotifier.notifyRecommended → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ReferralNotifier.notifyRecommended → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ReferralNotifier.notifyRecommended → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practices` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ReferralsService.assertServiceOfTarget → PracticesRepository.findById | `src/modules/practice/repositories/practices.repository.ts:92` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.person_profiles` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ReferralNotifier.notifyRecommended → ReferralNotifier.accountOf → ReferralNotifier.personIdOf | `src/modules/clinical_ext/services/referral-notifier.service.ts:167` |
| `profiles.persons` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ReferralNotifier.notifyRecommended → ReferralNotifier.displayNameOf | `src/modules/clinical_ext/services/referral-notifier.service.ts:190` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ReferralsController.create → ReferralsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ReferralsController.create → ReferralsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.practitioner_service_offerings` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ReferralsService.assertServiceOfTarget → SchedulingOfferingsRepository.findOfferingOf | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:62` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ReferralsController.create → ReferralsService.create → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Cuerpo — DTO `ClinicalExtCreateReferralDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical_ext/dto/referral.dto.ts:51` |
| `sourceEncounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro origen | `src/modules/clinical_ext/dto/referral.dto.ts:59` |
| `referringProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional que deriva | `src/modules/clinical_ext/dto/referral.dto.ts:70` |
| `targetProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional destino | `src/modules/clinical_ext/dto/referral.dto.ts:78` |
| `targetTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant destino (referencia inter-tenant) | `src/modules/clinical_ext/dto/referral.dto.ts:89` |
| `specialtyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Especialidad destino (concept id) | `src/modules/clinical_ext/dto/referral.dto.ts:100` |
| `reasonConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Motivo codificado (concept id) | `src/modules/clinical_ext/dto/referral.dto.ts:111` |
| `reasonText` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | — | `src/modules/clinical_ext/dto/referral.dto.ts:120` |
| `priorityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Prioridad (concept id) | `src/modules/clinical_ext/dto/referral.dto.ts:131` |
| `validUntil` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | Vigencia de la referencia | `src/modules/clinical_ext/dto/referral.dto.ts:143` |
| `referralType` | `string` | No | valores: TREATMENT, CONSULTATION, DIAGNOSTIC_STUDY, PROCEDURE, SECOND_OPINION, THERAPY, HOSPITALIZATION, OTHER | `@IsOptional()` `@IsIn(REFERRAL_TYPES)` | Tipo de derivación (tratamiento, consulta, estudio, …) | `src/modules/clinical_ext/dto/referral.dto.ts:155` |
| `targetBranchId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sede u organización médica destino | `src/modules/clinical_ext/dto/referral.dto.ts:166` |
| `targetExternalName` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@IsNotEmpty()` `@MaxLength(200)` | Doctor u organización destino fuera de la plataforma | `src/modules/clinical_ext/dto/referral.dto.ts:179` |
| `targetExternalContact` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@IsNotEmpty()` `@MaxLength(200)` | Contacto del destino externo | `src/modules/clinical_ext/dto/referral.dto.ts:192` |
| `requestedServiceText` | `string` | No | longitud mínima 1; longitud máxima 500 | `@IsOptional()` `@IsString()` `@IsNotEmpty()` `@MaxLength(500)` | Servicio específico pedido | `src/modules/clinical_ext/dto/referral.dto.ts:205` |
| `requestedServiceConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Servicio codificado (concept id) | `src/modules/clinical_ext/dto/referral.dto.ts:216` |
| `diagnosisText` | `string` | No | longitud mínima 1; longitud máxima 4000 | `@IsOptional()` `@IsString()` `@IsNotEmpty()` `@MaxLength(4000)` | Diagnóstico presuntivo o definitivo | `src/modules/clinical_ext/dto/referral.dto.ts:229` |
| `clinicalSummary` | `string` | No | longitud mínima 1; longitud máxima 8000 | `@IsOptional()` `@IsString()` `@IsNotEmpty()` `@MaxLength(8000)` | Resumen clínico | `src/modules/clinical_ext/dto/referral.dto.ts:239` |
| `treatmentGivenText` | `string` | No | longitud mínima 1; longitud máxima 4000 | `@IsOptional()` `@IsString()` `@IsNotEmpty()` `@MaxLength(4000)` | Tratamiento realizado antes de derivar | `src/modules/clinical_ext/dto/referral.dto.ts:252` |
| `informedConsentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | NO enviar: se rechaza con 400 REFERRAL_CONSENT_LINK_NOT_ALLOWED. El vínculo lo escribe el consentimiento registrado con targetType=REFERRAL y targetId=<derivación>. | `src/modules/clinical_ext/dto/referral.dto.ts:264` |
| `targetServiceCatalogId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Servicio del catálogo del destino | `src/modules/clinical_ext/dto/referral.dto.ts:277` |

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
  "sourceEncounterId": "00000000-0000-4000-8000-000000000001",
  "referringProfileId": "00000000-0000-4000-8000-000000000001",
  "targetProfileId": "00000000-0000-4000-8000-000000000001",
  "targetTenantId": "00000000-0000-4000-8000-000000000001",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "reasonConceptId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo",
  "priorityConceptId": "00000000-0000-4000-8000-000000000001",
  "validUntil": "2026-07-31",
  "referralType": "CONSULTATION",
  "targetBranchId": "00000000-0000-4000-8000-000000000001",
  "targetExternalName": "Nombre de ejemplo",
  "targetExternalContact": "valor-ejemplo",
  "requestedServiceText": "valor-ejemplo",
  "requestedServiceConceptId": "00000000-0000-4000-8000-000000000001",
  "diagnosisText": "valor-ejemplo",
  "clinicalSummary": "valor-ejemplo",
  "treatmentGivenText": "valor-ejemplo",
  "informedConsentId": "00000000-0000-4000-8000-000000000001",
  "targetServiceCatalogId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ReferralResponseDto>` · DTO `ReferralResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/referral.dto.ts:435` |
| `referralCode` | `string` | Sí | — | — | Código a compartir | sin fuente |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/clinical_ext/dto/referral.dto.ts:458` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Profesional no encontrado; ResourceNotFoundException: Servicio no encontrado; ResourceNotFoundException: Encuentro no encontrado; ResourceNotFoundException: Sede destino no encontrada; ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada; ResourceNotFoundException: Solicitud de notificación no encontrada; ResourceNotFoundException: El proveedor configurado para el canal no existe |
| 409 | `CONFLICT` | ConflictException: Ya existe una referencia equivalente |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La derivación necesita un destino: profesional, organización, servicio, sede o destino externo.; PreconditionFailedException: Ese servicio está inactivo en el catálogo.; PreconditionFailedException: El servicio no pertenece a la organización destino.; PreconditionFailedException: El profesional destino no ofrece ese servicio.; PreconditionFailedException: La notificación a una dirección externa también necesita el usuario destinatario / La notificación necesita el usuario destinatario; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal; PreconditionFailedException: La notificación está suprimida; PreconditionFailedException: La notificación ya no admite intentos; PreconditionFailedException: El canal no tiene configuración de proveedor activa; PreconditionFailedException: Una notificación in-app necesita destinatario interno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/referrals.controller.spec.ts:47` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:ReferralsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. GET /referrals/{id}

- **Origen:** CONTRATO
- **Nombre:** Leer una derivación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReferralsController.get` — `src/modules/clinical_ext/controllers/referrals.controller.ts:193`

### Qué es y para qué sirve (negocio)

Leer una derivación. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /referrals/{id}` la atiende `ReferralsController.get` (src/modules/clinical_ext/controllers/referrals.controller.ts:193). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `ReferralsService.get`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 13 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/referrals.controller.ts:193` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/referrals.controller.ts:193` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ReferralsController.get → ReferralsService.get → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ReferralsController.get → ReferralsService.get → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ReferralsController.get → ReferralsService.get → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ReferralsController.get → ReferralsService.get → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ReferralsController.get → ReferralsService.get → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ReferralsController.get → ReferralsService.get → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ReferralsController.get → ReferralsService.get → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ReferralsController.get → ReferralsService.get → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ReferralsController.get → ReferralsService.get → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ReferralsController.get → ReferralsService.get → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ReferralsController.get → ReferralsService.get → ClinicalReadService.assertCanReadHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical_ext.referrals` | LEE | LEE | DIRECTA | ReferralsController.get → ReferralsService.get → ReferralsService.findOrFail → ReferralsRepository.findById | `src/modules/clinical_ext/repositories/referrals.repository.ts:99` |
| `directory.branches` | LEE | LEE | DIRECTA | ReferralsController.get → ReferralsService.get → ReferralsService.isDestination | `src/modules/clinical_ext/services/referrals.service.ts:651` |
| `directory.tenants` | LEE | LEE | DIRECTA | ReferralsController.get → ReferralsService.get → ReferralsService.resolveNames | `src/modules/clinical_ext/services/referrals.service.ts:681` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ReferralsController.get → ReferralsService.get → ClinicalReadService.assertCanReadHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | ReferralsController.get → ReferralsService.get → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientRepresentationService.representsPatient → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ReferralsController.get → ReferralsService.get → ClinicalReadService.assertCanReadHistory → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ReferralsController.get → ReferralsService.get → ClinicalReadService.assertCanReadHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ReferralsController.get → ReferralsService.get → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ReferralsController.get → ReferralsService.get → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ReferralsController.get → ReferralsService.get → ClinicalReadService.assertCanReadHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReferralResponseDto>` · DTO `ReferralResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/referral.dto.ts:435` |
| `referralCode` | `string` | Sí | — | — | Código a compartir | sin fuente |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/clinical_ext/dto/referral.dto.ts:458` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Referencia no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/referrals.controller.spec.ts:66` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:ReferralsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. PATCH /referrals/{id}/cancel

- **Origen:** CONTRATO
- **Nombre:** Anular una derivación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReferralsController.cancel` — `src/modules/clinical_ext/controllers/referrals.controller.ts:142`

### Qué es y para qué sirve (negocio)

Anular una derivación. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /referrals/{id}/cancel` la atiende `ReferralsController.cancel` (src/modules/clinical_ext/controllers/referrals.controller.ts:142). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `ReferralsService.cancel`. Actualiza clinical_ext.referrals. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 11 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/referrals.controller.ts:142` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/referrals.controller.ts:142` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ReferralsController.cancel → ReferralsService.cancel → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ReferralsController.cancel → ReferralsService.cancel → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ReferralsController.cancel → ReferralsService.cancel → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ReferralsController.cancel → ReferralsService.cancel → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ReferralsController.cancel → ReferralsService.cancel → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ReferralsController.cancel → ReferralsService.cancel → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ReferralsController.cancel → ReferralsService.cancel → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ReferralsController.cancel → ReferralsService.cancel → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ReferralsController.cancel → ReferralsService.cancel → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ReferralsController.cancel → ReferralsService.cancel → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ReferralsController.cancel → ReferralsService.cancel → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical_ext.referrals` | ESCRIBE | ACTUALIZA | POR_TIPO | ReferralsController.cancel → ReferralsService.cancel | `src/modules/clinical_ext/services/referrals.service.ts:557` |
| `clinical_ext.referrals` | LEE | LEE | DIRECTA | ReferralsController.cancel → ReferralsService.cancel → ReferralsService.findOrFail → ReferralsRepository.findById | `src/modules/clinical_ext/repositories/referrals.repository.ts:99` |
| `directory.branches` | LEE | LEE | DIRECTA | ReferralsController.cancel → ReferralsService.cancel → ReferralsService.resolveNames | `src/modules/clinical_ext/services/referrals.service.ts:678` |
| `directory.tenants` | LEE | LEE | DIRECTA | ReferralsController.cancel → ReferralsService.cancel → ReferralsService.resolveNames | `src/modules/clinical_ext/services/referrals.service.ts:681` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ReferralsController.cancel → ReferralsService.cancel → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ReferralsController.cancel → ReferralsService.cancel → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ReferralsController.cancel → ReferralsService.cancel → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ReferralsController.cancel → ReferralsService.cancel → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ReferralsController.cancel → ReferralsService.cancel → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReferralResponseDto>` · DTO `ReferralResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/referral.dto.ts:435` |
| `referralCode` | `string` | Sí | — | — | Código a compartir | sin fuente |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/clinical_ext/dto/referral.dto.ts:458` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Referencia no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La derivación ya está cerrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/referrals.controller.spec.ts:75` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:ReferralsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. PATCH /referrals/{id}/counter-referral

- **Origen:** CONTRATO
- **Nombre:** Registrar la contrarreferencia de una derivación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReferralsController.counterReferral` — `src/modules/clinical_ext/controllers/referrals.controller.ts:125`

### Qué es y para qué sirve (negocio)

Registrar la contrarreferencia de una derivación. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /referrals/{id}/counter-referral` la atiende `ReferralsController.counterReferral` (src/modules/clinical_ext/controllers/referrals.controller.ts:125). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CounterReferralDto` (1 campo, 1 obligatorio). Delega en `ReferralsService.counterReferral`. Actualiza clinical_ext.referrals. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 11 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/referrals.controller.ts:125` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/referrals.controller.ts:125` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | ReferralsController.counterReferral → ReferralsService.counterReferral → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | ReferralsController.counterReferral → ReferralsService.counterReferral → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.hasCareCurrentRelation → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | ReferralsController.counterReferral → ReferralsService.counterReferral → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | ReferralsController.counterReferral → ReferralsService.counterReferral → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | ReferralsController.counterReferral → ReferralsService.counterReferral → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | ReferralsController.counterReferral → ReferralsService.counterReferral → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | ReferralsController.counterReferral → ReferralsService.counterReferral → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | ReferralsController.counterReferral → ReferralsService.counterReferral → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | ReferralsController.counterReferral → ReferralsService.counterReferral → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | ReferralsController.counterReferral → ReferralsService.counterReferral → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ReferralsController.counterReferral → ReferralsService.counterReferral → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.hasAuthorizedAccess → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `clinical_ext.referrals` | ESCRIBE | ACTUALIZA | POR_TIPO | ReferralsController.counterReferral → ReferralsService.counterReferral | `src/modules/clinical_ext/services/referrals.service.ts:516` |
| `clinical_ext.referrals` | LEE | LEE | DIRECTA | ReferralsController.counterReferral → ReferralsService.counterReferral → ReferralsService.findOrFail → ReferralsRepository.findById | `src/modules/clinical_ext/repositories/referrals.repository.ts:99` |
| `directory.branches` | LEE | LEE | DIRECTA | ReferralsController.counterReferral → ReferralsService.counterReferral → ReferralsService.isDestination | `src/modules/clinical_ext/services/referrals.service.ts:651` |
| `directory.tenants` | LEE | LEE | DIRECTA | ReferralsController.counterReferral → ReferralsService.counterReferral → ReferralsService.resolveNames | `src/modules/clinical_ext/services/referrals.service.ts:681` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ReferralsController.counterReferral → ReferralsService.counterReferral → ClinicalReadService.assertCanWriteHistory → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ReferralsController.counterReferral → ReferralsService.counterReferral → ClinicalReadService.assertCanWriteHistory → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ReferralsController.counterReferral → ReferralsService.counterReferral → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ReferralsController.counterReferral → ReferralsService.counterReferral → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → ClinicalReadService.attendsToday → SchedulingBookingsRepository.findConfirmedWithPatientBetween | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1057` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ReferralsController.counterReferral → ReferralsService.counterReferral → ClinicalReadService.assertCanWriteHistory → ClinicalReadService.isAttending → SchedulingBookingsRepository.hasConsultationInProgress | `src/modules/scheduling/infrastructure/repositories/scheduling-bookings.repository.ts:1031` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CounterReferralDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `counterReferralText` | `string` | Sí | longitud mínima 1; longitud máxima 8000 | `@IsString()` `@IsNotEmpty()` `@MaxLength(8000)` | Contrarreferencia | `src/modules/clinical_ext/dto/referral.dto.ts:425` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "counterReferralText": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "counterReferralText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ReferralResponseDto>` · DTO `ReferralResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/referral.dto.ts:435` |
| `referralCode` | `string` | Sí | — | — | Código a compartir | sin fuente |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/clinical_ext/dto/referral.dto.ts:458` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {WITHOUT_ACCESS_TO_HISTORY} |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Referencia no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La derivación no admite contrarreferencia en su estado actual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/referrals.controller.spec.ts:69` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:ReferralsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. PATCH /referrals/{id}/respond

- **Origen:** CONTRATO
- **Nombre:** Responder / aceptar una referencia inter-tenant
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReferralsController.respond` — `src/modules/clinical_ext/controllers/referrals.controller.ts:108`

### Qué es y para qué sirve (negocio)

Responder / aceptar una referencia inter-tenant. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /referrals/{id}/respond` la atiende `ReferralsController.respond` (src/modules/clinical_ext/controllers/referrals.controller.ts:108). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `RespondReferralDto` (2 campos, 1 obligatorio). Delega en `ReferralsService.respond`. Actualiza clinical_ext.referrals. Lee clinical_ext.referrals, directory.branches.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/referrals.controller.ts:108` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/referrals.controller.ts:108` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.referrals` | ESCRIBE | ACTUALIZA | POR_TIPO | ReferralsController.respond → ReferralsService.respond | `src/modules/clinical_ext/services/referrals.service.ts:428` |
| `clinical_ext.referrals` | LEE | LEE | DIRECTA | ReferralsController.respond → ReferralsService.respond → ReferralsRepository.findById | `src/modules/clinical_ext/repositories/referrals.repository.ts:99` |
| `directory.branches` | LEE | LEE | DIRECTA | ReferralsController.respond → ReferralsService.respond → ReferralsService.isDestination | `src/modules/clinical_ext/services/referrals.service.ts:651` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RespondReferralDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: ACCEPT, REJECT | `@IsIn(['ACCEPT', 'REJECT'])` | Decisión del tenant destino | `src/modules/clinical_ext/dto/referral.dto.ts:401` |
| `rejectReason` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | Motivo del rechazo (obligatorio si REJECT) | `src/modules/clinical_ext/dto/referral.dto.ts:413` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decision": "ACCEPT"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "ACCEPT",
  "rejectReason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<RespondReferralResultDto>` · DTO `RespondReferralResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | Siempre `true` cuando la operación se aplicó. | `src/modules/clinical_ext/dto/referral.dto.ts:651` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Referencia no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La referencia no está en estado solicitado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/referrals.controller.spec.ts:54` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:ReferralsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 27. GET /referrals/me

- **Origen:** CONTRATO
- **Nombre:** Mis derivaciones
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReferralsController.listMine` — `src/modules/clinical_ext/controllers/referrals.controller.ts:178`

### Qué es y para qué sirve (negocio)

Mis derivaciones. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /referrals/me` la atiende `ReferralsController.listMine` (src/modules/clinical_ext/controllers/referrals.controller.ts:178). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, PATIENT. Delega en `ReferralsService.listMine`. Lee billing.service_catalog, clinical_ext.referrals, directory.branches, directory.tenants, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, PATIENT | `src/modules/clinical_ext/controllers/referrals.controller.ts:178` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | ReferralsController.listMine → ReferralsService.listMine → ReferralsService.toListItems → SchedulingOfferingsRepository.findCatalogItems | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:116` |
| `clinical_ext.referrals` | LEE | LEE | DIRECTA | ReferralsController.listMine → ReferralsService.listMine → ReferralsRepository.findByPatient | `src/modules/clinical_ext/repositories/referrals.repository.ts:166` |
| `directory.branches` | LEE | LEE | DIRECTA | ReferralsController.listMine → ReferralsService.listMine → ReferralsService.toListItems → ReferralsService.resolveNames | `src/modules/clinical_ext/services/referrals.service.ts:678` |
| `directory.tenants` | LEE | LEE | DIRECTA | ReferralsController.listMine → ReferralsService.listMine → ReferralsService.toListItems → TenantsRepository.findById | `src/modules/directory/repositories/tenants.repository.ts:77` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ReferralsController.listMine → ReferralsService.listMine → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ReferralsController.listMine → ReferralsService.listMine → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReferralListItemDto[]>` · DTO `ReferralListItemDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:435` |
| `patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:441` |
| `status` | `string` | Sí | valores: PENDING, ACCEPTED, REJECTED, COMPLETED, CANCELLED | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:449` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado de la referencia (concept id) | `src/modules/clinical_ext/dto/referral.dto.ts:458` |
| `referralType` | `string` | Sí | valores: TREATMENT, CONSULTATION, DIAGNOSTIC_STUDY, PROCEDURE, SECOND_OPINION, THERAPY, HOSPITALIZATION, OTHER; admite null | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:465` |
| `referralTypeConceptId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:471` |
| `targetServiceCatalogId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:477` |
| `sourceEncounterId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:483` |
| `referringProfileId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:489` |
| `targetProfileId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:495` |
| `targetTenantId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:501` |
| `targetTenantName` | `string` | No | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:507` |
| `targetBranchId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:513` |
| `targetBranchName` | `string` | No | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:519` |
| `targetExternalName` | `string` | No | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:525` |
| `targetExternalContact` | `string` | No | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:531` |
| `specialtyConceptId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:537` |
| `serviceRequestId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:543` |
| `requestedServiceText` | `string` | No | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:549` |
| `requestedServiceConceptId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:555` |
| `reasonConceptId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:561` |
| `reasonText` | `string` | No | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:567` |
| `diagnosisText` | `string` | No | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:573` |
| `clinicalSummary` | `string` | No | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:579` |
| `treatmentGivenText` | `string` | No | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:585` |
| `informedConsentId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:591` |
| `priorityConceptId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:597` |
| `validUntil` | `string` | No | formato date | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:603` |
| `respondedAt` | `string` | No | formato date-time | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:609` |
| `rejectReason` | `string` | No | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:615` |
| `counterReferralText` | `string` | No | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:621` |
| `counterReferralAt` | `string` | No | formato date-time | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:627` |
| `updatedAt` | `string` | No | formato date-time | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:633` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:639` |
| `createdByUserId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:662` |
| `updatedByUserId` | `string` | No | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:666` |
| `rowVersion` | `number` | Sí | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:670` |
| `targetDisplayName` | `string` | Sí | admite null | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:674` |
| `targetServiceName` | `string` | Sí | admite null | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:678` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/referrals.controller.spec.ts:81` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:ReferralsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 28. GET /referrals/target-services

- **Origen:** CONTRATO
- **Nombre:** Servicios activos de un destino de derivación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReferralsController.listTargetServices` — `src/modules/clinical_ext/controllers/referrals.controller.ts:97`

### Qué es y para qué sirve (negocio)

Servicios activos de un destino de derivación. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /referrals/target-services` la atiende `ReferralsController.listTargetServices` (src/modules/clinical_ext/controllers/referrals.controller.ts:97). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `ReferralsService.listTargetServices`. Lee billing.service_catalog, practice.practices, scheduling.practitioner_service_offerings, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/referrals.controller.ts:97` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | Límite propio: Throttle(REFERRAL_TARGETS_RATE_LIMIT) | `src/modules/clinical_ext/controllers/referrals.controller.ts:97` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `billing.service_catalog` | LEE | LEE | DIRECTA | ReferralsController.listTargetServices → ReferralsService.listTargetServices → SchedulingOfferingsRepository.findCatalogItems | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:116` |
| `practice.practices` | LEE | LEE | DIRECTA | ReferralsController.listTargetServices → ReferralsService.listTargetServices → PracticesRepository.findByTenant | `src/modules/practice/repositories/practices.repository.ts:69` |
| `scheduling.practitioner_service_offerings` | LEE | LEE | DIRECTA | ReferralsController.listTargetServices → ReferralsService.listTargetServices → SchedulingOfferingsRepository.listOfferings | `src/modules/scheduling/infrastructure/repositories/scheduling-offerings.repository.ts:74` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | ReferralsController.listTargetServices → ReferralsService.listTargetServices → CatalogConceptsRepository.findByIds | `src/modules/terminology/repositories/catalog-concepts.repository.ts:202` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `targetProfileId` | query | No | `string` | — |
| `targetTenantId` | query | No | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReferralTargetServiceListDto>` · DTO `ReferralTargetServiceListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ReferralTargetServiceDto>` | Sí | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:388` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:353` |
| `items[].code` | `string` | Sí | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:357` |
| `items[].name` | `string` | Sí | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:361` |
| `items[].description` | `string` | Sí | admite null | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:365` |
| `items[].price` | `number` | Sí | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:369` |
| `items[].currency` | `string` | Sí | admite null | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:373` |
| `items[].tenantId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:377` |
| `items[].practiceName` | `string` | Sí | admite null | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:381` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Indique targetProfileId o targetTenantId. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/referrals.controller.spec.ts:95` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:ReferralsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. GET /referrals/targets

- **Origen:** CONTRATO
- **Nombre:** Buscar destinos de derivación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReferralsController.searchTargets` — `src/modules/clinical_ext/controllers/referrals.controller.ts:86`

### Qué es y para qué sirve (negocio)

Buscar destinos de derivación. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /referrals/targets` la atiende `ReferralsController.searchTargets` (src/modules/clinical_ext/controllers/referrals.controller.ts:86). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `ReferralsService.searchTargets`. Lee directory.tenants, practice.practices, practice.practitioner_role_assignments, profiles.health_practitioner_profiles, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/referrals.controller.ts:86` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | q (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle(REFERRAL_TARGETS_RATE_LIMIT) | `src/modules/clinical_ext/controllers/referrals.controller.ts:86` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenants` | LEE | LEE | POR_SQL | ReferralsController.searchTargets → ReferralsService.searchTargets → ReferralsService.searchOrganizationTargets → ReferralTargetsRepository.searchOrganizations | `src/modules/clinical_ext/repositories/referral-targets.repository.ts:150` |
| `practice.practices` | LEE | LEE | POR_SQL | ReferralsController.searchTargets → ReferralsService.searchTargets → ReferralsService.searchPractitionerTargets → ReferralTargetsRepository.searchPractitioners | `src/modules/clinical_ext/repositories/referral-targets.repository.ts:90` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | ReferralsController.searchTargets → ReferralsService.searchTargets → ReferralsService.searchPractitionerTargets → ReferralTargetsRepository.searchPractitioners | `src/modules/clinical_ext/repositories/referral-targets.repository.ts:90` |
| `profiles.health_practitioner_profiles` | LEE | LEE | POR_SQL | ReferralsController.searchTargets → ReferralsService.searchTargets → ReferralsService.searchPractitionerTargets → ReferralTargetsRepository.searchPractitioners | `src/modules/clinical_ext/repositories/referral-targets.repository.ts:90` |
| `profiles.persons` | LEE | LEE | POR_SQL | ReferralsController.searchTargets → ReferralsService.searchTargets → ReferralsService.searchPractitionerTargets → ReferralTargetsRepository.searchPractitioners | `src/modules/clinical_ext/repositories/referral-targets.repository.ts:90` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `q` | query | Sí | `string` | — |
| `kind` | query | No | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReferralTargetListDto>` · DTO `ReferralTargetListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ReferralTargetDto>` | Sí | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:346` |
| `items[].kind` | `string` | Sí | valores: PRACTITIONER, ORGANIZATION | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:323` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:327` |
| `items[].displayName` | `string` | Sí | — | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:331` |
| `items[].tenantId` | `string` | Sí | formato uuid; admite null | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:335` |
| `items[].subtitle` | `string` | Sí | admite null | — | — | `src/modules/clinical_ext/dto/referral.dto.ts:339` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La búsqueda necesita al menos dos caracteres. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/referrals.controller.spec.ts:88` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:ReferralsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 30. POST /virtual-encounters

- **Origen:** CONTRATO
- **Nombre:** Iniciar una sesión de telesalud
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VirtualEncountersController.create` — `src/modules/clinical_ext/controllers/virtual-encounters.controller.ts:44`

### Qué es y para qué sirve (negocio)

Iniciar una sesión de telesalud. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /virtual-encounters` la atiende `VirtualEncountersController.create` (src/modules/clinical_ext/controllers/virtual-encounters.controller.ts:44). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateVirtualEncounterDto` (4 campos, 1 obligatorio). Delega en `VirtualEncountersService.create`. Crea filas en clinical_ext.virtual_encounters. Lee clinical_ext.virtual_encounters, clinical.encounter_participants, clinical.encounters.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/virtual-encounters.controller.ts:44` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.virtual_encounters` | ESCRIBE | CREA | DIRECTA | VirtualEncountersController.create → VirtualEncountersService.create → VirtualEncountersRepository.create | `src/modules/clinical_ext/repositories/virtual-encounters.repository.ts:67` |
| `clinical_ext.virtual_encounters` | LEE | LEE | DIRECTA | VirtualEncountersController.create → VirtualEncountersService.create → VirtualEncountersRepository.findByEncounter | `src/modules/clinical_ext/repositories/virtual-encounters.repository.ts:53` |
| `clinical.encounter_participants` | LEE | LEE | DIRECTA | VirtualEncountersController.create → VirtualEncountersService.create → VirtualEncountersService.requireEncounterParticipant → EncountersRepository.findActiveParticipants | `src/modules/clinical/repositories/encounters.repository.ts:371` |
| `clinical.encounters` | LEE | LEE | DIRECTA | VirtualEncountersController.create → VirtualEncountersService.create → VirtualEncountersService.requireEncounterParticipant → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:169` |

### Cuerpo — DTO `CreateVirtualEncounterDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `encounterId` | `string` | Sí | formato uuid | `@IsUUID()` | Encuentro clínico (1:1) | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:11` |
| `platformConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Plataforma de telesalud (concept id) | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:22` |
| `meetingUrl` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | URL de la reunión | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:31` |
| `meetingId` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Identificador de la reunión | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:40` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "encounterId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "platformConceptId": "00000000-0000-4000-8000-000000000001",
  "meetingUrl": "valor-ejemplo",
  "meetingId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<VirtualEncounterResponseDto>` · DTO `VirtualEncounterResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:63` |
| `encounterId` | `string` | Sí | formato uuid | — | Identificador asociado a encounter. | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:69` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado de la sesión (concept id) | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:78` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La sesión virtual pertenece a otra organización.; ForbiddenException: No participa de este encuentro clínico. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro clínico no encontrado |
| 409 | `CONFLICT` | ConflictException: El encuentro ya tiene una sesión virtual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/virtual-encounter-auth.int-spec.ts:109` |
| CONTROLADOR | `src/modules/clinical_ext/controllers/virtual-encounters.controller.spec.ts:35` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:VirtualEncountersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 31. PATCH /virtual-encounters/{id}/end

- **Origen:** CONTRATO
- **Nombre:** Finalizar una sesión de telesalud
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VirtualEncountersController.end` — `src/modules/clinical_ext/controllers/virtual-encounters.controller.ts:77`

### Qué es y para qué sirve (negocio)

Finalizar una sesión de telesalud. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /virtual-encounters/{id}/end` la atiende `VirtualEncountersController.end` (src/modules/clinical_ext/controllers/virtual-encounters.controller.ts:77). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `EndVirtualEncounterDto` (1 campo, 0 obligatorios). Delega en `VirtualEncountersService.end`. Actualiza clinical_ext.virtual_encounters. Lee clinical_ext.virtual_encounters, clinical.encounter_participants, clinical.encounters.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/virtual-encounters.controller.ts:77` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/virtual-encounters.controller.ts:77` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.virtual_encounters` | ESCRIBE | ACTUALIZA | POR_TIPO | VirtualEncountersController.end → VirtualEncountersService.end | `src/modules/clinical_ext/services/virtual-encounters.service.ts:158` |
| `clinical_ext.virtual_encounters` | LEE | LEE | DIRECTA | VirtualEncountersController.end → VirtualEncountersService.end → VirtualEncountersRepository.findById | `src/modules/clinical_ext/repositories/virtual-encounters.repository.ts:45` |
| `clinical.encounter_participants` | LEE | LEE | DIRECTA | VirtualEncountersController.end → VirtualEncountersService.end → VirtualEncountersService.requireEncounterParticipant → EncountersRepository.findActiveParticipants | `src/modules/clinical/repositories/encounters.repository.ts:371` |
| `clinical.encounters` | LEE | LEE | DIRECTA | VirtualEncountersController.end → VirtualEncountersService.end → VirtualEncountersService.requireEncounterParticipant → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:169` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `EndVirtualEncounterDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `recordingFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Manifiesto de grabación (common.files) | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:54` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "recordingFileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<VirtualEncounterResponseDto>` · DTO `VirtualEncounterResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:63` |
| `encounterId` | `string` | Sí | formato uuid | — | Identificador asociado a encounter. | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:69` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado de la sesión (concept id) | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:78` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La sesión virtual pertenece a otra organización.; ForbiddenException: No participa de este encuentro clínico. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sesión virtual no encontrada; ResourceNotFoundException: Encuentro clínico no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión no está en progreso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/virtual-encounter-auth.int-spec.ts:120` |
| CONTROLADOR | `src/modules/clinical_ext/controllers/virtual-encounters.controller.spec.ts:58` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:VirtualEncountersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 32. PATCH /virtual-encounters/{id}/join

- **Origen:** CONTRATO
- **Nombre:** Unirse a una sesión de telesalud
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VirtualEncountersController.join` — `src/modules/clinical_ext/controllers/virtual-encounters.controller.ts:60`

### Qué es y para qué sirve (negocio)

Unirse a una sesión de telesalud. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /virtual-encounters/{id}/join` la atiende `VirtualEncountersController.join` (src/modules/clinical_ext/controllers/virtual-encounters.controller.ts:60). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, PATIENT. Delega en `VirtualEncountersService.join`. Actualiza clinical_ext.virtual_encounters. Lee clinical_ext.virtual_encounters, clinical.encounter_participants, clinical.encounters.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, PATIENT | `src/modules/clinical_ext/controllers/virtual-encounters.controller.ts:60` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/virtual-encounters.controller.ts:60` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.virtual_encounters` | ESCRIBE | ACTUALIZA | POR_TIPO | VirtualEncountersController.join → VirtualEncountersService.join | `src/modules/clinical_ext/services/virtual-encounters.service.ts:123` |
| `clinical_ext.virtual_encounters` | LEE | LEE | DIRECTA | VirtualEncountersController.join → VirtualEncountersService.join → VirtualEncountersRepository.findById | `src/modules/clinical_ext/repositories/virtual-encounters.repository.ts:45` |
| `clinical.encounter_participants` | LEE | LEE | DIRECTA | VirtualEncountersController.join → VirtualEncountersService.join → VirtualEncountersService.requireEncounterParticipant → EncountersRepository.findActiveParticipants | `src/modules/clinical/repositories/encounters.repository.ts:371` |
| `clinical.encounters` | LEE | LEE | DIRECTA | VirtualEncountersController.join → VirtualEncountersService.join → VirtualEncountersService.requireEncounterParticipant → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:169` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<VirtualEncounterResponseDto>` · DTO `VirtualEncounterResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:63` |
| `encounterId` | `string` | Sí | formato uuid | — | Identificador asociado a encounter. | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:69` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado de la sesión (concept id) | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:78` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La sesión virtual pertenece a otra organización.; ForbiddenException: No participa de este encuentro clínico. |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sesión virtual no encontrada; ResourceNotFoundException: Encuentro clínico no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión no está agendada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical_ext.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/virtual-encounter-auth.int-spec.ts:115` |
| CONTROLADOR | `src/modules/clinical_ext/controllers/virtual-encounters.controller.spec.ts:41` |

### Flujos

- `clinical_ext` — coordinación y soporte clínico — etapa `ctrl:VirtualEncountersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

