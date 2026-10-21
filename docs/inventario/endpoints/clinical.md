<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `clinical`

- **Bloque:** Clínico y Diagnóstico (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)
- **Operaciones:** 28 (25 en el contrato, 3 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 23 · BAJO 5
- **Tablas distintas que tocan:** 40
- **Respuestas de error y detalle contractual:** `openapi/endpoints/clinical.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/clinical/allergy-intolerances` | Registrar una alergia con reacciones | MEDIO | 3 | CLINICIAN, PRACTITIONER |
| 2 | POST | `/clinical/care-episodes` | Abrir un episodio de cuidado | MEDIO | 2 | CLINICIAN, PRACTITIONER |
| 3 | POST | `/clinical/conditions` | Registrar una condición/diagnóstico | MEDIO | 7 | CLINICIAN, PRACTITIONER |
| 4 | POST | `/clinical/conditions/{id}/change-status` | Cambiar el estado clínico de una condición | MEDIO | 7 | CLINICIAN, PRACTITIONER |
| 5 | POST | `/clinical/diagnostic-reports` | Emitir un reporte diagnóstico desde la orden | MEDIO | 3 | CLINICIAN, PRACTITIONER |
| 6 | POST | `/clinical/diagnostic-reports/{id}/release` | Liberar los resultados de un reporte diagnóstico | MEDIO | 2 | CLINICIAN, PRACTITIONER |
| 7 | POST | `/clinical/encounters/{id}/close` | Cerrar un encuentro en curso (gatilla facturación) | MEDIO | 15 | CLINICIAN, PRACTITIONER |
| 8 | POST | `/clinical/encounters/check-in` | Check-in de un encuentro con participantes y ubicación | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 9 | POST | `/clinical/immunizations` | Registrar una inmunización | MEDIO | 2 | CLINICIAN, PRACTITIONER |
| 10 | POST | `/clinical/medication-records` | Administrar/registrar medicación | MEDIO | 3 | CLINICIAN, PRACTITIONER |
| 11 | POST | `/clinical/medication-requests` | Prescribir medicación | MEDIO | 2 | CLINICIAN, PRACTITIONER |
| 12 | POST | `/clinical/medication-requests/{id}/edit` | Editar ítems de una receta en borrador (DRAFT) | MEDIO | 3 | CLINICIAN, PRACTITIONER |
| 13 | POST | `/clinical/medication-requests/{id}/invalidate` | Invalidar una receta emitida | MEDIO | 7 | CLINICIAN, PRACTITIONER |
| 14 | POST | `/clinical/medication-requests/{id}/issue` | Emitir una receta (la vuelve inmutable) | MEDIO | 17 | CLINICIAN, PRACTITIONER |
| 15 | POST | `/clinical/medication-requests/{id}/renew` | Renovar una receta (crea una nueva copiando datos) | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 16 | POST | `/clinical/medication-requests/{id}/replace` | Reemplazar una receta emitida (crea la corrección) | MEDIO | 8 | CLINICIAN, PRACTITIONER |
| 17 | POST | `/clinical/medication-requests/{id}/sign` | Firmar una receta en borrador (DRAFT) | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 18 | POST | `/clinical/observations` | Registrar una observación con componentes y ejecutantes | MEDIO | 7 | CLINICIAN, PRACTITIONER |
| 19 | PATCH | `/clinical/observations/{id}/amend` | Corregir/enmendar una observación (value contract) | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 20 | GET | `/clinical/patients/{patientProfileId}/prescriptions` | — | BAJO | 11 | PATIENT, PRACTITIONER, CLINICIAN |
| 21 | GET | `/clinical/patients/{patientProfileId}/prescriptions/history.pdf` | — | BAJO | 9 | PATIENT, PRACTITIONER, CLINICIAN |
| 22 | GET | `/clinical/patients/{patientProfileId}/summary` | UC-39-20: historial clínico del paciente (condiciones, alergias, medicación, observaciones, encuentros) | BAJO | 14 | CLINICIAN, PRACTITIONER, PATIENT |
| 23 | GET | `/clinical/prescription-signature-policies` | Listar las políticas de firma de un tenant | BAJO | 1 | CLINICIAN, SECURITY_ADMIN |
| 24 | POST | `/clinical/prescription-signature-policies` | Crear una política de firma de receta | MEDIO | 1 | CLINICIAN, SECURITY_ADMIN |
| 25 | POST | `/clinical/prescription-signature-policies/{id}/deactivate` | Desactivar una política (cierra vigencia, sin borrado duro) | MEDIO | 2 | CLINICIAN, SECURITY_ADMIN |
| 26 | GET | `/clinical/prescriptions/{id}/pdf` | — | BAJO | 12 | PATIENT, PRACTITIONER, CLINICIAN |
| 27 | POST | `/clinical/procedures` | Registrar un procedimiento | MEDIO | 4 | CLINICIAN, PRACTITIONER |
| 28 | POST | `/clinical/service-requests` | Crear una orden de servicio | MEDIO | 2 | CLINICIAN, PRACTITIONER |

---

## 1. POST /clinical/allergy-intolerances

- **Origen:** CONTRATO
- **Nombre:** Registrar una alergia con reacciones
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.createAllergy` — `src/modules/clinical/controllers/clinical-records.controller.ts:90`

### Qué es y para qué sirve (negocio)

Registrar una alergia con reacciones. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/allergy-intolerances` la atiende `ClinicalRecordsController.createAllergy` (src/modules/clinical/controllers/clinical-records.controller.ts:90). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateAllergyIntoleranceDto` (10 campos, 3 obligatorios). Delega en `AllergyIntolerancesService.create`. Crea filas en clinical.allergy_intolerances, clinical.allergy_reactions. Lee clinical.allergy_intolerances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:90` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.allergy_intolerances` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.createAllergy → AllergyIntolerancesService.create → AllergyIntolerancesRepository.create | `src/modules/clinical/repositories/allergy-intolerances.repository.ts:140` |
| `clinical.allergy_intolerances` | LEE | LEE | DIRECTA | ClinicalRecordsController.createAllergy → AllergyIntolerancesService.create → AllergyIntolerancesRepository.findActiveBySubstance | `src/modules/clinical/repositories/allergy-intolerances.repository.ts:124` |
| `clinical.allergy_reactions` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.createAllergy → AllergyIntolerancesService.create → AllergyIntolerancesRepository.createReaction | `src/modules/clinical/repositories/allergy-intolerances.repository.ts:169` |

### Cuerpo — DTO `CreateAllergyIntoleranceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `custodianTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant custodio (directory.tenants) | `src/modules/clinical/dto/allergy.dto.ts:50` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente (profiles.patient_profiles) | `src/modules/clinical/dto/allergy.dto.ts:60` |
| `substanceConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Sustancia alergénica (concept id) | `src/modules/clinical/dto/allergy.dto.ts:70` |
| `typeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo (concept id) | `src/modules/clinical/dto/allergy.dto.ts:78` |
| `categoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Categoría (concept id) | `src/modules/clinical/dto/allergy.dto.ts:89` |
| `criticalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Criticidad (concept id) | `src/modules/clinical/dto/allergy.dto.ts:100` |
| `reactions` | `array<AllergyReactionInput>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => AllergyReactionInput)` | — | `src/modules/clinical/dto/allergy.dto.ts:110` |
| `reactions[].manifestationConceptId` | `string` | No | formato uuid | `@IsUUID()` | Manifestación (concept id) | `src/modules/clinical/dto/allergy.dto.ts:18` |
| `reactions[].severityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Severidad (concept id) | `src/modules/clinical/dto/allergy.dto.ts:29` |
| `reactions[].description` | `string` | No | — | `@IsOptional()` `@IsString()` | Descripción libre | `src/modules/clinical/dto/allergy.dto.ts:37` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/allergy.dto.ts:119` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/allergy.dto.ts:125` |
| `clinicalStatus` | `string` | Sí | formato uuid; admite null | — | Estado clínico (concept id) | `src/modules/clinical/dto/allergy.dto.ts:135` |
| `reactionIds` | `array<string>` | Sí | — | — | Ids de reacciones creadas | `src/modules/clinical/dto/allergy.dto.ts:141` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/allergy.dto.ts:147` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El paciente ya tiene una alergia activa a esa sustancia |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:611` |
| CONTROLADOR | `src/modules/clinical/controllers/clinical-records.controller.spec.ts:68` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /clinical/care-episodes

- **Origen:** CONTRATO
- **Nombre:** Abrir un episodio de cuidado
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalEncountersController.openEpisode` — `src/modules/clinical/controllers/clinical-encounters.controller.ts:42`

### Qué es y para qué sirve (negocio)

Abrir un episodio de cuidado. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/care-episodes` la atiende `ClinicalEncountersController.openEpisode` (src/modules/clinical/controllers/clinical-encounters.controller.ts:42). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateCareEpisodeDto` (5 campos, 2 obligatorios). Delega en `CareEpisodesService.open`. Crea filas en clinical.care_episodes. Lee clinical.care_episodes.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-encounters.controller.ts:42` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

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
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:583` |
| CONTROLADOR | `src/modules/clinical/controllers/clinical-encounters.controller.spec.ts:33` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalEncountersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /clinical/conditions

- **Origen:** CONTRATO
- **Nombre:** Registrar una condición/diagnóstico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.createCondition` — `src/modules/clinical/controllers/clinical-records.controller.ts:67`

### Qué es y para qué sirve (negocio)

Registrar una condición/diagnóstico. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/conditions` la atiende `ClinicalRecordsController.createCondition` (src/modules/clinical/controllers/clinical-records.controller.ts:67). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateConditionDto` (11 campos, 3 obligatorios). Delega en `ConditionsService.create`. Crea filas en audit.audit_log, audit.conditions_history, clinical.conditions. Actualiza audit.conditions_history. Lee audit.audit_log, audit.conditions_history, clinical.conditions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.createCondition → ConditionsService.create → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:176` |
| `audit.audit_log` | LEE | LEE | DIRECTA | ClinicalRecordsController.createCondition → ConditionsService.create → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:151` |
| `audit.conditions_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | ClinicalRecordsController.createCondition → ConditionsService.create | `src/modules/clinical/services/conditions.service.ts:179` |
| `audit.conditions_history` | ESCRIBE | CREA | POR_REGISTRO | ClinicalRecordsController.createCondition → ConditionsService.create | `src/modules/clinical/services/conditions.service.ts:179` |
| `audit.conditions_history` | LEE | LEE | POR_REGISTRO | ClinicalRecordsController.createCondition → ConditionsService.create | `src/modules/clinical/services/conditions.service.ts:179` |
| `clinical.conditions` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.createCondition → ConditionsService.create → ConditionsRepository.create | `src/modules/clinical/repositories/conditions.repository.ts:134` |
| `clinical.conditions` | LEE | LEE | DIRECTA | ClinicalRecordsController.createCondition → ConditionsService.create → ConditionsRepository.findActiveByCode | `src/modules/clinical/repositories/conditions.repository.ts:118` |

### Cuerpo — DTO `CreateConditionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `custodianTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant custodio (directory.tenants) | `src/modules/clinical/dto/condition.dto.ts:14` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente (profiles.patient_profiles) | `src/modules/clinical/dto/condition.dto.ts:24` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro en curso | `src/modules/clinical/dto/condition.dto.ts:32` |
| `codeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Código de la condición/diagnóstico (concept id) | `src/modules/clinical/dto/condition.dto.ts:42` |
| `categoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Categoría (concept id) | `src/modules/clinical/dto/condition.dto.ts:53` |
| `severityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Severidad (concept id) | `src/modules/clinical/dto/condition.dto.ts:64` |
| `lateralityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Lateralidad (concept id) | `src/modules/clinical/dto/condition.dto.ts:75` |
| `clinicalCourseConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Curso clínico: agudo/crónico/subagudo/recurrente (concept id). Sin declarar es un dato legítimo, no un olvido. | `src/modules/clinical/dto/condition.dto.ts:87` |
| `onsetAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de la condición | `src/modules/clinical/dto/condition.dto.ts:98` |
| `expectedResolutionAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fecha esperada de resolución o próxima revisión. Sólo tiene sentido en curso agudo/subagudo. | `src/modules/clinical/dto/condition.dto.ts:110` |
| `noteText` | `string` | No | — | `@IsOptional()` `@IsString()` | Hallazgos y justificación clínica (narrativa libre de quien registra; Patch v4.1.3) | `src/modules/clinical/dto/condition.dto.ts:121` |

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
  "onsetAt": "2026-07-31T12:00:00.000Z",
  "expectedResolutionAt": "2026-07-31T12:00:00.000Z",
  "noteText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ConditionResponseDto>` · DTO `ConditionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/condition.dto.ts:151` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/condition.dto.ts:157` |
| `clinicalStatus` | `string` | Sí | formato uuid; admite null | — | Estado clínico (concept id) | `src/modules/clinical/dto/condition.dto.ts:167` |
| `verificationStatus` | `string` | Sí | formato uuid; admite null | — | Estado de verificación (concept id) | `src/modules/clinical/dto/condition.dto.ts:177` |
| `clinicalCourse` | `string` | Sí | formato uuid; admite null | — | Curso clínico (concept id) | `src/modules/clinical/dto/condition.dto.ts:187` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/condition.dto.ts:193` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El paciente ya tiene esa condición activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:600` |
| CONTROLADOR | `src/modules/clinical/controllers/clinical-records.controller.spec.ts:57` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /clinical/conditions/{id}/change-status

- **Origen:** CONTRATO
- **Nombre:** Cambiar el estado clínico de una condición
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.changeConditionStatus` — `src/modules/clinical/controllers/clinical-records.controller.ts:78`

### Qué es y para qué sirve (negocio)

Cambiar el estado clínico de una condición. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/conditions/{id}/change-status` la atiende `ClinicalRecordsController.changeConditionStatus` (src/modules/clinical/controllers/clinical-records.controller.ts:78). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `ChangeConditionClinicalStatusDto` (2 campos, 2 obligatorios). Delega en `ConditionsService.changeClinicalStatus`. Crea filas en audit.audit_log, audit.conditions_history. Actualiza audit.conditions_history, clinical.conditions. Lee audit.audit_log, audit.conditions_history, clinical.conditions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:78` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-records.controller.ts:78` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:176` |
| `audit.audit_log` | LEE | LEE | DIRECTA | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:151` |
| `audit.conditions_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus | `src/modules/clinical/services/conditions.service.ts:268` |
| `audit.conditions_history` | ESCRIBE | CREA | POR_REGISTRO | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus | `src/modules/clinical/services/conditions.service.ts:268` |
| `audit.conditions_history` | LEE | LEE | POR_REGISTRO | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus | `src/modules/clinical/services/conditions.service.ts:268` |
| `clinical.conditions` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus | `src/modules/clinical/services/conditions.service.ts:251` |
| `clinical.conditions` | LEE | LEE | DIRECTA | ClinicalRecordsController.changeConditionStatus → ConditionsService.changeClinicalStatus → ConditionsService.loadConditionOrThrow → ConditionsRepository.findById | `src/modules/clinical/repositories/conditions.repository.ts:107` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ChangeConditionClinicalStatusDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `newClinicalStatusConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Estado clínico destino (concept id de `condition-clinical-status`) | `src/modules/clinical/dto/condition.dto.ts:135` |
| `reasonText` | `string` | Sí | — | `@IsString()` | Motivo del cambio de estado (obligatorio) | `src/modules/clinical/dto/condition.dto.ts:142` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/condition.dto.ts:151` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/condition.dto.ts:157` |
| `clinicalStatus` | `string` | Sí | formato uuid; admite null | — | Estado clínico (concept id) | `src/modules/clinical/dto/condition.dto.ts:167` |
| `verificationStatus` | `string` | Sí | formato uuid; admite null | — | Estado de verificación (concept id) | `src/modules/clinical/dto/condition.dto.ts:177` |
| `clinicalCourse` | `string` | Sí | formato uuid; admite null | — | Curso clínico (concept id) | `src/modules/clinical/dto/condition.dto.ts:187` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/condition.dto.ts:193` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Condición no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Esa transición de estado clínico no es válida desde el estado actual; PreconditionFailedException: Una condición de curso crónico no pasa a resuelta; marcala inactiva o en remisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /clinical/diagnostic-reports

- **Origen:** CONTRATO
- **Nombre:** Emitir un reporte diagnóstico desde la orden
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalOrdersController.createDiagnosticReport` — `src/modules/clinical/controllers/clinical-orders.controller.ts:50`

### Qué es y para qué sirve (negocio)

Emitir un reporte diagnóstico desde la orden. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/diagnostic-reports` la atiende `ClinicalOrdersController.createDiagnosticReport` (src/modules/clinical/controllers/clinical-orders.controller.ts:50). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateDiagnosticReportDto` (7 campos, 3 obligatorios). Delega en `DiagnosticReportsService.create`. Crea filas en clinical.diagnostic_reports. Actualiza clinical.service_requests. Lee clinical.service_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-orders.controller.ts:50` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | ESCRIBE | CREA | DIRECTA | ClinicalOrdersController.createDiagnosticReport → DiagnosticReportsService.create → DiagnosticReportsRepository.create | `src/modules/clinical/repositories/diagnostic-reports.repository.ts:77` |
| `clinical.service_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalOrdersController.createDiagnosticReport → DiagnosticReportsService.create | `src/modules/clinical/services/diagnostic-reports.service.ts:72` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | ClinicalOrdersController.createDiagnosticReport → DiagnosticReportsService.create → ServiceRequestsRepository.findById | `src/modules/clinical/repositories/service-requests.repository.ts:67` |

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
| CONTROLADOR | `src/modules/clinical/controllers/clinical-orders.controller.spec.ts:47` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /clinical/diagnostic-reports/{id}/release

- **Origen:** CONTRATO
- **Nombre:** Liberar los resultados de un reporte diagnóstico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalOrdersController.releaseDiagnosticReport` — `src/modules/clinical/controllers/clinical-orders.controller.ts:61`

### Qué es y para qué sirve (negocio)

Liberar los resultados de un reporte diagnóstico. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/diagnostic-reports/{id}/release` la atiende `ClinicalOrdersController.releaseDiagnosticReport` (src/modules/clinical/controllers/clinical-orders.controller.ts:61). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `ReleaseDiagnosticReportDto` (1 campo, 0 obligatorios). Delega en `DiagnosticReportsService.release`. Actualiza clinical.diagnostic_reports. Lee clinical.diagnostic_reports.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-orders.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-orders.controller.ts:61` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.diagnostic_reports` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalOrdersController.releaseDiagnosticReport → DiagnosticReportsService.release | `src/modules/clinical/services/diagnostic-reports.service.ts:139` |
| `clinical.diagnostic_reports` | LEE | LEE | DIRECTA | ClinicalOrdersController.releaseDiagnosticReport → DiagnosticReportsService.release → DiagnosticReportsRepository.findById | `src/modules/clinical/repositories/diagnostic-reports.repository.ts:63` |

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
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Reporte diagnóstico no encontrado |
| 409 | `CONCURRENCY_CONFLICT` | ConcurrencyConflictException: Versión del reporte desactualizada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El reporte no está en estado liberable |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical/controllers/clinical-orders.controller.spec.ts:53` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /clinical/encounters/{id}/close

- **Origen:** CONTRATO
- **Nombre:** Cerrar un encuentro en curso (gatilla facturación)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalEncountersController.close` — `src/modules/clinical/controllers/clinical-encounters.controller.ts:66`

### Qué es y para qué sirve (negocio)

Cerrar un encuentro en curso (gatilla facturación). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/encounters/{id}/close` la atiende `ClinicalEncountersController.close` (src/modules/clinical/controllers/clinical-encounters.controller.ts:66). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CloseEncounterDto` (1 campo, 0 obligatorios). Delega en `EncountersService.close`. Crea filas en messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza clinical.encounter_locations, clinical.encounter_participants, clinical.encounters. Lee clinical.encounter_locations, clinical.encounter_participants, clinical.encounters, messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers, messaging.provider_channel_configs, messaging.recipient_preferences y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-encounters.controller.ts:66` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-encounters.controller.ts:66` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_locations` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalEncountersController.close → EncountersService.close | `src/modules/clinical/services/encounters.service.ts:195` |
| `clinical.encounter_locations` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → EncountersRepository.findActiveLocations | `src/modules/clinical/repositories/encounters.repository.ts:282` |
| `clinical.encounter_participants` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalEncountersController.close → EncountersService.close | `src/modules/clinical/services/encounters.service.ts:184` |
| `clinical.encounter_participants` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → EncountersRepository.findActiveParticipants | `src/modules/clinical/repositories/encounters.repository.ts:263` |
| `clinical.encounters` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalEncountersController.close → EncountersService.close | `src/modules/clinical/services/encounters.service.ts:174` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:167` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalNotificationsService.encounterClosed → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalNotificationsService.encounterClosed → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalNotificationsService.encounterClosed → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalNotificationsService.encounterClosed → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalNotificationsService.encounterClosed → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalNotificationsService.encounterClosed → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalNotificationsService.encounterClosed → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalNotificationsService.encounterClosed → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalEncountersController.close → EncountersService.close → ClinicalNotificationsService.encounterClosed → ClinicalNotificationsService.emitToPatient → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/repositories/person-account-links.repository.ts:101` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CloseEncounterDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expectedRowVersion` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | row_version esperado (bloqueo optimista) | `src/modules/clinical/dto/encounter.dto.ts:201` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/encounter.dto.ts:210` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/encounter.dto.ts:216` |
| `episodeId` | `string` | No | formato uuid; admite null | — | Identificador asociado a episode. | `src/modules/clinical/dto/encounter.dto.ts:222` |
| `status` | `string` | Sí | formato uuid | — | Estado del encuentro (concept id) | `src/modules/clinical/dto/encounter.dto.ts:231` |
| `participantIds` | `array<string>` | Sí | — | — | Ids de participantes creados | `src/modules/clinical/dto/encounter.dto.ts:237` |
| `locationIds` | `array<string>` | Sí | — | — | Ids de ubicaciones creadas | `src/modules/clinical/dto/encounter.dto.ts:243` |
| `startAt` | `string` | Sí | formato date-time; admite null | — | Valor de start at mantenido por la instancia. | `src/modules/clinical/dto/encounter.dto.ts:249` |
| `endAt` | `string` | Sí | formato date-time; admite null | — | Valor de end at mantenido por la instancia. | `src/modules/clinical/dto/encounter.dto.ts:255` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/encounter.dto.ts:261` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado |
| 409 | `CONCURRENCY_CONFLICT` | ConcurrencyConflictException: Versión del encuentro desactualizada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El encuentro no está en curso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical/controllers/clinical-encounters.controller.spec.ts:48` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalEncountersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. POST /clinical/encounters/check-in

- **Origen:** CONTRATO
- **Nombre:** Check-in de un encuentro con participantes y ubicación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalEncountersController.checkIn` — `src/modules/clinical/controllers/clinical-encounters.controller.ts:53`

### Qué es y para qué sirve (negocio)

Check-in de un encuentro con participantes y ubicación. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/encounters/check-in` la atiende `ClinicalEncountersController.checkIn` (src/modules/clinical/controllers/clinical-encounters.controller.ts:53). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CheckInEncounterDto` (17 campos, 2 obligatorios). Delega en `EncountersService.checkIn`. Crea filas en clinical.encounter_locations, clinical.encounter_participants, clinical.encounters. Lee clinical.care_episodes.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-encounters.controller.ts:53` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.care_episodes` | LEE | LEE | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → CareEpisodesRepository.findById | `src/modules/clinical/repositories/care-episodes.repository.ts:50` |
| `clinical.encounter_locations` | ESCRIBE | CREA | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → EncountersRepository.createLocation | `src/modules/clinical/repositories/encounters.repository.ts:235` |
| `clinical.encounter_participants` | ESCRIBE | CREA | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → EncountersRepository.createParticipant | `src/modules/clinical/repositories/encounters.repository.ts:209` |
| `clinical.encounters` | ESCRIBE | CREA | DIRECTA | ClinicalEncountersController.checkIn → EncountersService.checkIn → EncountersRepository.create | `src/modules/clinical/repositories/encounters.repository.ts:178` |

### Cuerpo — DTO `CheckInEncounterDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente (profiles.patient_profiles) | `src/modules/clinical/dto/encounter.dto.ts:87` |
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant custodio (directory.tenants) | `src/modules/clinical/dto/encounter.dto.ts:97` |
| `episodeId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Episodio de cuidado asociado | `src/modules/clinical/dto/encounter.dto.ts:108` |
| `branchId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sucursal (directory.branches) | `src/modules/clinical/dto/encounter.dto.ts:119` |
| `primaryPractitionerId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional principal | `src/modules/clinical/dto/encounter.dto.ts:127` |
| `appointmentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cita que origina el check-in | `src/modules/clinical/dto/encounter.dto.ts:138` |
| `classConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Clase del encuentro (concept id) | `src/modules/clinical/dto/encounter.dto.ts:149` |
| `typeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo del encuentro (concept id) | `src/modules/clinical/dto/encounter.dto.ts:160` |
| `reasonText` | `string` | No | — | `@IsOptional()` `@IsString()` | Motivo de consulta | `src/modules/clinical/dto/encounter.dto.ts:168` |
| `participants` | `array<EncounterParticipantInput>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => EncounterParticipantInput)` | — | `src/modules/clinical/dto/encounter.dto.ts:178` |
| `participants[].practitionerProfileId` | `string` | No | formato uuid | `@IsUUID()` | Profesional participante | `src/modules/clinical/dto/encounter.dto.ts:21` |
| `participants[].roleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Rol del participante (concept id) | `src/modules/clinical/dto/encounter.dto.ts:32` |
| `participants[].isResponsible` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Marca al participante como responsable | `src/modules/clinical/dto/encounter.dto.ts:42` |
| `location` | `EncounterLocationInput` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => EncounterLocationInput)` | — | `src/modules/clinical/dto/encounter.dto.ts:187` |
| `location.practiceSiteId` | `string` | No | formato uuid | `@IsUUID()` | Sede de práctica (practice.practice_sites) | `src/modules/clinical/dto/encounter.dto.ts:55` |
| `location.clinicalUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad clínica | `src/modules/clinical/dto/encounter.dto.ts:63` |
| `location.careSpaceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Espacio de atención (cama/consultorio) | `src/modules/clinical/dto/encounter.dto.ts:74` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/encounter.dto.ts:210` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/encounter.dto.ts:216` |
| `episodeId` | `string` | No | formato uuid; admite null | — | Identificador asociado a episode. | `src/modules/clinical/dto/encounter.dto.ts:222` |
| `status` | `string` | Sí | formato uuid | — | Estado del encuentro (concept id) | `src/modules/clinical/dto/encounter.dto.ts:231` |
| `participantIds` | `array<string>` | Sí | — | — | Ids de participantes creados | `src/modules/clinical/dto/encounter.dto.ts:237` |
| `locationIds` | `array<string>` | Sí | — | — | Ids de ubicaciones creadas | `src/modules/clinical/dto/encounter.dto.ts:243` |
| `startAt` | `string` | Sí | formato date-time; admite null | — | Valor de start at mantenido por la instancia. | `src/modules/clinical/dto/encounter.dto.ts:249` |
| `endAt` | `string` | Sí | formato date-time; admite null | — | Valor de end at mantenido por la instancia. | `src/modules/clinical/dto/encounter.dto.ts:255` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/encounter.dto.ts:261` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Episodio de cuidado no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:589` |
| CONTROLADOR | `src/modules/clinical/controllers/clinical-encounters.controller.spec.ts:42` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalEncountersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /clinical/immunizations

- **Origen:** CONTRATO
- **Nombre:** Registrar una inmunización
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.createImmunization` — `src/modules/clinical/controllers/clinical-records.controller.ts:209`

### Qué es y para qué sirve (negocio)

Registrar una inmunización. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/immunizations` la atiende `ClinicalRecordsController.createImmunization` (src/modules/clinical/controllers/clinical-records.controller.ts:209). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateImmunizationDto` (8 campos, 3 obligatorios). Delega en `ImmunizationsService.create`. Crea filas en clinical.immunizations. Lee clinical.immunizations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:209` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.immunizations` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.createImmunization → ImmunizationsService.create → ImmunizationsRepository.create | `src/modules/clinical/repositories/immunizations.repository.ts:90` |
| `clinical.immunizations` | LEE | LEE | DIRECTA | ClinicalRecordsController.createImmunization → ImmunizationsService.create → ImmunizationsRepository.findByPatientVaccineDose | `src/modules/clinical/repositories/immunizations.repository.ts:74` |

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
| CONTROLADOR | `src/modules/clinical/controllers/clinical-records.controller.spec.ts:163` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /clinical/medication-records

- **Origen:** CONTRATO
- **Nombre:** Administrar/registrar medicación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.administerMedication` — `src/modules/clinical/controllers/clinical-records.controller.ts:112`

### Qué es y para qué sirve (negocio)

Administrar/registrar medicación. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/medication-records` la atiende `ClinicalRecordsController.administerMedication` (src/modules/clinical/controllers/clinical-records.controller.ts:112). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateMedicationRecordDto` (8 campos, 3 obligatorios). Delega en `MedicationsService.administer`. Crea filas en clinical.medication_records. Actualiza clinical.medication_requests. Lee clinical.medication_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:112` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_records` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.administerMedication → MedicationsService.administer → MedicationRecordsRepository.create | `src/modules/clinical/repositories/medication-records.repository.ts:81` |
| `clinical.medication_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalRecordsController.administerMedication → MedicationsService.administer | `src/modules/clinical/services/medications.service.ts:661` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalRecordsController.administerMedication → MedicationsService.administer → MedicationRequestsRepository.findById | `src/modules/clinical/repositories/medication-requests.repository.ts:139` |

### Cuerpo — DTO `CreateMedicationRecordDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `custodianTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant custodio (directory.tenants) | `src/modules/clinical/dto/medication.dto.ts:167` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente (profiles.patient_profiles) | `src/modules/clinical/dto/medication.dto.ts:177` |
| `requestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Prescripción que se administra | `src/modules/clinical/dto/medication.dto.ts:188` |
| `medicationConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Medicamento (concept id) | `src/modules/clinical/dto/medication.dto.ts:195` |
| `doseDecimal` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Dosis administrada | `src/modules/clinical/dto/medication.dto.ts:203` |
| `unitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad (concept id) | `src/modules/clinical/dto/medication.dto.ts:211` |
| `administeredAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Momento de administración | `src/modules/clinical/dto/medication.dto.ts:222` |
| `isFinalDose` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Marca la dosis final: cierra la prescripción | `src/modules/clinical/dto/medication.dto.ts:232` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/medication.dto.ts:602` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/medication.dto.ts:608` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/medication.dto.ts:614` |
| `requestId` | `string` | No | formato uuid; admite null | — | Identificador asociado a request. | `src/modules/clinical/dto/medication.dto.ts:620` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/medication.dto.ts:626` |

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

## 11. POST /clinical/medication-requests

- **Origen:** CONTRATO
- **Nombre:** Prescribir medicación
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.prescribeMedication` — `src/modules/clinical/controllers/clinical-records.controller.ts:101`

### Qué es y para qué sirve (negocio)

Prescribir medicación. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/medication-requests` la atiende `ClinicalRecordsController.prescribeMedication` (src/modules/clinical/controllers/clinical-records.controller.ts:101). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateMedicationRequestDto` (15 campos, 3 obligatorios). Delega en `MedicationsService.prescribe`. Crea filas en clinical.medication_requests. Lee clinical.conditions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:101` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.conditions` | LEE | LEE | DIRECTA | ClinicalRecordsController.prescribeMedication → MedicationsService.prescribe → MedicationsService.assertIndicationBelongsToPatient → ConditionsRepository.findById | `src/modules/clinical/repositories/conditions.repository.ts:107` |
| `clinical.medication_requests` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.prescribeMedication → MedicationsService.prescribe → MedicationRequestsRepository.create | `src/modules/clinical/repositories/medication-requests.repository.ts:169` |

### Cuerpo — DTO `CreateMedicationRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `custodianTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant custodio (directory.tenants) | `src/modules/clinical/dto/medication.dto.ts:21` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente (profiles.patient_profiles) | `src/modules/clinical/dto/medication.dto.ts:31` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro en curso | `src/modules/clinical/dto/medication.dto.ts:39` |
| `medicationConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Medicamento (concept id) | `src/modules/clinical/dto/medication.dto.ts:46` |
| `substanceAtcConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sustancia ATC (concept id) | `src/modules/clinical/dto/medication.dto.ts:57` |
| `prescriberProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional prescriptor | `src/modules/clinical/dto/medication.dto.ts:68` |
| `doseText` | `string` | No | — | `@IsOptional()` `@IsString()` | Dosis en texto libre | `src/modules/clinical/dto/medication.dto.ts:76` |
| `routeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Vía de administración (concept id) | `src/modules/clinical/dto/medication.dto.ts:87` |
| `frequencyText` | `string` | No | — | `@IsOptional()` `@IsString()` | Frecuencia en texto libre | `src/modules/clinical/dto/medication.dto.ts:95` |
| `quantityDecimal` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Cantidad prescrita | `src/modules/clinical/dto/medication.dto.ts:103` |
| `unitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad (concept id) | `src/modules/clinical/dto/medication.dto.ts:111` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de vigencia | `src/modules/clinical/dto/medication.dto.ts:122` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fin de vigencia | `src/modules/clinical/dto/medication.dto.ts:130` |
| `patientInstructionsText` | `string` | No | — | `@IsOptional()` `@IsString()` | Indicaciones al paciente impresas en la receta, separadas de la posología (Patch v4.1.3) | `src/modules/clinical/dto/medication.dto.ts:141` |
| `indicationConditionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Condición clínica que motiva la prescripción — para qué es la receta. Debe pertenecer al mismo paciente (Patch v4.1.6) | `src/modules/clinical/dto/medication.dto.ts:154` |

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
  "indicationConditionId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<MedicationRequestResponseDto>` · DTO `MedicationRequestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/medication.dto.ts:534` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/medication.dto.ts:540` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/medication.dto.ts:546` |
| `replacesRequestId` | `string` | No | formato uuid; admite null | — | Receta a la que esta sustituye | `src/modules/clinical/dto/medication.dto.ts:556` |
| `replacedByRequestId` | `string` | No | formato uuid; admite null | — | Receta que sustituye a esta | `src/modules/clinical/dto/medication.dto.ts:566` |
| `renewedFromRequestId` | `string` | No | formato uuid; admite null | — | Receta de la que esta es renovación | `src/modules/clinical/dto/medication.dto.ts:576` |
| `signedAt` | `string` | No | formato date-time; admite null | — | Instante de firma de la receta (nulo = sin firmar) | `src/modules/clinical/dto/medication.dto.ts:587` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/medication.dto.ts:593` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La condición indicada no existe o no pertenece a este paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:632` |
| CONTROLADOR | `src/modules/clinical/controllers/clinical-records.controller.spec.ts:79` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. POST /clinical/medication-requests/{id}/edit

- **Origen:** CONTRATO
- **Nombre:** Editar ítems de una receta en borrador (DRAFT)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.editMedicationDraft` — `src/modules/clinical/controllers/clinical-records.controller.ts:123`

### Qué es y para qué sirve (negocio)

Editar ítems de una receta en borrador (DRAFT). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/medication-requests/{id}/edit` la atiende `ClinicalRecordsController.editMedicationDraft` (src/modules/clinical/controllers/clinical-records.controller.ts:123). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `EditMedicationRequestDraftDto` (13 campos, 0 obligatorios). Delega en `MedicationsService.editDraft`. Actualiza clinical.medication_requests. Lee clinical.conditions, clinical.medication_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:123` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-records.controller.ts:123` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.conditions` | LEE | LEE | DIRECTA | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.assertIndicationBelongsToPatient → ConditionsRepository.findById | `src/modules/clinical/repositories/conditions.repository.ts:107` |
| `clinical.medication_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft | `src/modules/clinical/services/medications.service.ts:234` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalRecordsController.editMedicationDraft → MedicationsService.editDraft → MedicationsService.loadRequestOrThrow → MedicationRequestsRepository.findById | `src/modules/clinical/repositories/medication-requests.repository.ts:139` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `EditMedicationRequestDraftDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro en curso | `src/modules/clinical/dto/medication.dto.ts:247` |
| `medicationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Medicamento (concept id) | `src/modules/clinical/dto/medication.dto.ts:258` |
| `substanceAtcConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sustancia ATC (concept id) | `src/modules/clinical/dto/medication.dto.ts:269` |
| `prescriberProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional prescriptor | `src/modules/clinical/dto/medication.dto.ts:280` |
| `doseText` | `string` | No | — | `@IsOptional()` `@IsString()` | Dosis en texto libre | `src/modules/clinical/dto/medication.dto.ts:288` |
| `routeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Vía de administración (concept id) | `src/modules/clinical/dto/medication.dto.ts:299` |
| `frequencyText` | `string` | No | — | `@IsOptional()` `@IsString()` | Frecuencia en texto libre | `src/modules/clinical/dto/medication.dto.ts:307` |
| `quantityDecimal` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Cantidad prescrita | `src/modules/clinical/dto/medication.dto.ts:315` |
| `unitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad (concept id) | `src/modules/clinical/dto/medication.dto.ts:323` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de vigencia | `src/modules/clinical/dto/medication.dto.ts:334` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fin de vigencia | `src/modules/clinical/dto/medication.dto.ts:342` |
| `indicationConditionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Condición que motiva la prescripción; debe ser del mismo paciente (Patch v4.1.6) | `src/modules/clinical/dto/medication.dto.ts:354` |
| `patientInstructionsText` | `string` | No | — | `@IsOptional()` `@IsString()` | Indicaciones al paciente impresas en la receta (Patch v4.1.3) | `src/modules/clinical/dto/medication.dto.ts:365` |

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
  "patientInstructionsText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<MedicationRequestResponseDto>` · DTO `MedicationRequestResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/medication.dto.ts:534` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/medication.dto.ts:540` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/medication.dto.ts:546` |
| `replacesRequestId` | `string` | No | formato uuid; admite null | — | Receta a la que esta sustituye | `src/modules/clinical/dto/medication.dto.ts:556` |
| `replacedByRequestId` | `string` | No | formato uuid; admite null | — | Receta que sustituye a esta | `src/modules/clinical/dto/medication.dto.ts:566` |
| `renewedFromRequestId` | `string` | No | formato uuid; admite null | — | Receta de la que esta es renovación | `src/modules/clinical/dto/medication.dto.ts:576` |
| `signedAt` | `string` | No | formato date-time; admite null | — | Instante de firma de la receta (nulo = sin firmar) | `src/modules/clinical/dto/medication.dto.ts:587` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/medication.dto.ts:593` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Receta no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo un borrador (DRAFT) admite edición; una receta emitida es inmutable; PreconditionFailedException: La condición indicada no existe o no pertenece a este paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical/controllers/clinical-records.controller.spec.ts:97` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /clinical/medication-requests/{id}/invalidate

- **Origen:** CONTRATO
- **Nombre:** Invalidar una receta emitida
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.invalidateMedicationRequest` — `src/modules/clinical/controllers/clinical-records.controller.ts:158`

### Qué es y para qué sirve (negocio)

Invalidar una receta emitida. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/medication-requests/{id}/invalidate` la atiende `ClinicalRecordsController.invalidateMedicationRequest` (src/modules/clinical/controllers/clinical-records.controller.ts:158). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `InvalidateMedicationRequestDto` (1 campo, 1 obligatorio). Delega en `MedicationsService.invalidate`. Crea filas en audit.audit_log, audit.medication_requests_history. Actualiza audit.medication_requests_history, clinical.medication_requests. Lee audit.audit_log, audit.medication_requests_history, clinical.medication_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:158` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-records.controller.ts:158` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:176` |
| `audit.audit_log` | LEE | LEE | DIRECTA | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:151` |
| `audit.medication_requests_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate | `src/modules/clinical/services/medications.service.ts:454` |
| `audit.medication_requests_history` | ESCRIBE | CREA | POR_REGISTRO | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate | `src/modules/clinical/services/medications.service.ts:454` |
| `audit.medication_requests_history` | LEE | LEE | POR_REGISTRO | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate | `src/modules/clinical/services/medications.service.ts:454` |
| `clinical.medication_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate | `src/modules/clinical/services/medications.service.ts:443` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalRecordsController.invalidateMedicationRequest → MedicationsService.invalidate → MedicationsService.loadRequestOrThrow → MedicationRequestsRepository.findById | `src/modules/clinical/repositories/medication-requests.repository.ts:139` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `InvalidateMedicationRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reasonText` | `string` | Sí | — | `@IsString()` | Motivo de la invalidación (obligatorio) | `src/modules/clinical/dto/medication.dto.ts:375` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/medication.dto.ts:534` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/medication.dto.ts:540` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/medication.dto.ts:546` |
| `replacesRequestId` | `string` | No | formato uuid; admite null | — | Receta a la que esta sustituye | `src/modules/clinical/dto/medication.dto.ts:556` |
| `replacedByRequestId` | `string` | No | formato uuid; admite null | — | Receta que sustituye a esta | `src/modules/clinical/dto/medication.dto.ts:566` |
| `renewedFromRequestId` | `string` | No | formato uuid; admite null | — | Receta de la que esta es renovación | `src/modules/clinical/dto/medication.dto.ts:576` |
| `signedAt` | `string` | No | formato date-time; admite null | — | Instante de firma de la receta (nulo = sin firmar) | `src/modules/clinical/dto/medication.dto.ts:587` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/medication.dto.ts:593` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
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

## 14. POST /clinical/medication-requests/{id}/issue

- **Origen:** CONTRATO
- **Nombre:** Emitir una receta (la vuelve inmutable)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.issueMedicationRequest` — `src/modules/clinical/controllers/clinical-records.controller.ts:146`

### Qué es y para qué sirve (negocio)

Emitir una receta (la vuelve inmutable). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/medication-requests/{id}/issue` la atiende `ClinicalRecordsController.issueMedicationRequest` (src/modules/clinical/controllers/clinical-records.controller.ts:146). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `MedicationsService.issue`. Crea filas en audit.audit_log, audit.medication_requests_history, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza audit.medication_requests_history, clinical.medication_requests. Lee audit.audit_log, audit.medication_requests_history, clinical.medication_requests, clinical.prescription_signature_policies, messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers, messaging.provider_channel_configs y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:146` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CABECERA | idempotency-key (obligatoria) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-records.controller.ts:146` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:176` |
| `audit.audit_log` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:151` |
| `audit.medication_requests_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue | `src/modules/clinical/services/medications.service.ts:391` |
| `audit.medication_requests_history` | ESCRIBE | CREA | POR_REGISTRO | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue | `src/modules/clinical/services/medications.service.ts:391` |
| `audit.medication_requests_history` | LEE | LEE | POR_REGISTRO | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue | `src/modules/clinical/services/medications.service.ts:391` |
| `clinical.medication_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue | `src/modules/clinical/services/medications.service.ts:378` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → MedicationRequestsRepository.findByIssueIdempotencyKey | `src/modules/clinical/repositories/medication-requests.repository.ts:153` |
| `clinical.prescription_signature_policies` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → PrescriptionSignaturePoliciesService.isSignatureRequired → PrescriptionSignaturePoliciesRepository.findActive | `src/modules/clinical/repositories/prescription-signature-policies.repository.ts:81` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → ClinicalNotificationsService.prescriptionIssued → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → ClinicalNotificationsService.prescriptionIssued → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → ClinicalNotificationsService.prescriptionIssued → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → ClinicalNotificationsService.prescriptionIssued → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → ClinicalNotificationsService.prescriptionIssued → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → ClinicalNotificationsService.prescriptionIssued → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → ClinicalNotificationsService.prescriptionIssued → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → ClinicalNotificationsService.prescriptionIssued → ClinicalNotificationsService.emitToPatient → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalRecordsController.issueMedicationRequest → MedicationsService.issue → ClinicalNotificationsService.prescriptionIssued → ClinicalNotificationsService.emitToPatient → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/repositories/person-account-links.repository.ts:101` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/medication.dto.ts:534` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/medication.dto.ts:540` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/medication.dto.ts:546` |
| `replacesRequestId` | `string` | No | formato uuid; admite null | — | Receta a la que esta sustituye | `src/modules/clinical/dto/medication.dto.ts:556` |
| `replacedByRequestId` | `string` | No | formato uuid; admite null | — | Receta que sustituye a esta | `src/modules/clinical/dto/medication.dto.ts:566` |
| `renewedFromRequestId` | `string` | No | formato uuid; admite null | — | Receta de la que esta es renovación | `src/modules/clinical/dto/medication.dto.ts:576` |
| `signedAt` | `string` | No | formato date-time; admite null | — | Instante de firma de la receta (nulo = sin firmar) | `src/modules/clinical/dto/medication.dto.ts:587` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/medication.dto.ts:593` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Receta no encontrada |
| 409 | `CONFLICT` | ConflictException: La clave de idempotencia ya fue usada para emitir otra receta |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo un borrador (DRAFT) puede emitirse; PreconditionFailedException: La política vigente exige firmar la receta antes de emitirla |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Entidad de historial no registrada: {entity} |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical/controllers/clinical-records.controller.spec.ts:107` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. POST /clinical/medication-requests/{id}/renew

- **Origen:** CONTRATO
- **Nombre:** Renovar una receta (crea una nueva copiando datos)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.renewMedicationRequest` — `src/modules/clinical/controllers/clinical-records.controller.ts:184`

### Qué es y para qué sirve (negocio)

Renovar una receta (crea una nueva copiando datos). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/medication-requests/{id}/renew` la atiende `ClinicalRecordsController.renewMedicationRequest` (src/modules/clinical/controllers/clinical-records.controller.ts:184). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `RenewMedicationRequestDto` (5 campos, 0 obligatorios). Delega en `MedicationsService.renew`. Crea filas en audit.audit_log, clinical.medication_requests. Lee audit.audit_log, clinical.medication_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:184` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-records.controller.ts:184` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:176` |
| `audit.audit_log` | LEE | LEE | DIRECTA | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:151` |
| `clinical.medication_requests` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationRequestsRepository.create | `src/modules/clinical/repositories/medication-requests.repository.ts:169` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalRecordsController.renewMedicationRequest → MedicationsService.renew → MedicationsService.loadRequestOrThrow → MedicationRequestsRepository.findById | `src/modules/clinical/repositories/medication-requests.repository.ts:139` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RenewMedicationRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `doseText` | `string` | No | — | `@IsOptional()` `@IsString()` | Dosis en texto libre | `src/modules/clinical/dto/medication.dto.ts:490` |
| `frequencyText` | `string` | No | — | `@IsOptional()` `@IsString()` | Frecuencia en texto libre | `src/modules/clinical/dto/medication.dto.ts:498` |
| `quantityDecimal` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Cantidad prescrita | `src/modules/clinical/dto/medication.dto.ts:506` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de vigencia | `src/modules/clinical/dto/medication.dto.ts:517` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fin de vigencia | `src/modules/clinical/dto/medication.dto.ts:525` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/medication.dto.ts:534` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/medication.dto.ts:540` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/medication.dto.ts:546` |
| `replacesRequestId` | `string` | No | formato uuid; admite null | — | Receta a la que esta sustituye | `src/modules/clinical/dto/medication.dto.ts:556` |
| `replacedByRequestId` | `string` | No | formato uuid; admite null | — | Receta que sustituye a esta | `src/modules/clinical/dto/medication.dto.ts:566` |
| `renewedFromRequestId` | `string` | No | formato uuid; admite null | — | Receta de la que esta es renovación | `src/modules/clinical/dto/medication.dto.ts:576` |
| `signedAt` | `string` | No | formato date-time; admite null | — | Instante de firma de la receta (nulo = sin firmar) | `src/modules/clinical/dto/medication.dto.ts:587` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/medication.dto.ts:593` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Receta no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo una receta emitida o completada puede renovarse |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical/controllers/clinical-records.controller.spec.ts:141` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. POST /clinical/medication-requests/{id}/replace

- **Origen:** CONTRATO
- **Nombre:** Reemplazar una receta emitida (crea la corrección)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.replaceMedicationRequest` — `src/modules/clinical/controllers/clinical-records.controller.ts:170`

### Qué es y para qué sirve (negocio)

Reemplazar una receta emitida (crea la corrección). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/medication-requests/{id}/replace` la atiende `ClinicalRecordsController.replaceMedicationRequest` (src/modules/clinical/controllers/clinical-records.controller.ts:170). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `ReplaceMedicationRequestDto` (10 campos, 1 obligatorio). Delega en `MedicationsService.replace`. Crea filas en audit.audit_log, audit.medication_requests_history, clinical.medication_requests. Actualiza audit.medication_requests_history, clinical.medication_requests. Lee audit.audit_log, audit.medication_requests_history, clinical.medication_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:170` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-records.controller.ts:170` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:176` |
| `audit.audit_log` | LEE | LEE | DIRECTA | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:151` |
| `audit.medication_requests_history` | ESCRIBE | ACTUALIZA | POR_REGISTRO | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace | `src/modules/clinical/services/medications.service.ts:537` |
| `audit.medication_requests_history` | ESCRIBE | CREA | POR_REGISTRO | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace | `src/modules/clinical/services/medications.service.ts:537` |
| `audit.medication_requests_history` | LEE | LEE | POR_REGISTRO | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace | `src/modules/clinical/services/medications.service.ts:537` |
| `clinical.medication_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace | `src/modules/clinical/services/medications.service.ts:525` |
| `clinical.medication_requests` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationRequestsRepository.create | `src/modules/clinical/repositories/medication-requests.repository.ts:169` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalRecordsController.replaceMedicationRequest → MedicationsService.replace → MedicationsService.loadRequestOrThrow → MedicationRequestsRepository.findById | `src/modules/clinical/repositories/medication-requests.repository.ts:139` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ReplaceMedicationRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reasonText` | `string` | Sí | — | `@IsString()` | Motivo de la corrección/reemplazo (obligatorio) | `src/modules/clinical/dto/medication.dto.ts:391` |
| `medicationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Medicamento (concept id) | `src/modules/clinical/dto/medication.dto.ts:402` |
| `substanceAtcConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sustancia ATC (concept id) | `src/modules/clinical/dto/medication.dto.ts:413` |
| `doseText` | `string` | No | — | `@IsOptional()` `@IsString()` | Dosis en texto libre | `src/modules/clinical/dto/medication.dto.ts:421` |
| `routeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Vía de administración (concept id) | `src/modules/clinical/dto/medication.dto.ts:432` |
| `frequencyText` | `string` | No | — | `@IsOptional()` `@IsString()` | Frecuencia en texto libre | `src/modules/clinical/dto/medication.dto.ts:440` |
| `quantityDecimal` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Cantidad prescrita | `src/modules/clinical/dto/medication.dto.ts:448` |
| `unitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad (concept id) | `src/modules/clinical/dto/medication.dto.ts:456` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de vigencia | `src/modules/clinical/dto/medication.dto.ts:467` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fin de vigencia | `src/modules/clinical/dto/medication.dto.ts:475` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/medication.dto.ts:534` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/medication.dto.ts:540` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/medication.dto.ts:546` |
| `replacesRequestId` | `string` | No | formato uuid; admite null | — | Receta a la que esta sustituye | `src/modules/clinical/dto/medication.dto.ts:556` |
| `replacedByRequestId` | `string` | No | formato uuid; admite null | — | Receta que sustituye a esta | `src/modules/clinical/dto/medication.dto.ts:566` |
| `renewedFromRequestId` | `string` | No | formato uuid; admite null | — | Receta de la que esta es renovación | `src/modules/clinical/dto/medication.dto.ts:576` |
| `signedAt` | `string` | No | formato date-time; admite null | — | Instante de firma de la receta (nulo = sin firmar) | `src/modules/clinical/dto/medication.dto.ts:587` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/medication.dto.ts:593` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
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

## 17. POST /clinical/medication-requests/{id}/sign

- **Origen:** CONTRATO
- **Nombre:** Firmar una receta en borrador (DRAFT)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.signMedicationRequest` — `src/modules/clinical/controllers/clinical-records.controller.ts:135`

### Qué es y para qué sirve (negocio)

Firmar una receta en borrador (DRAFT). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/medication-requests/{id}/sign` la atiende `ClinicalRecordsController.signMedicationRequest` (src/modules/clinical/controllers/clinical-records.controller.ts:135). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `MedicationsService.sign`. Crea filas en audit.audit_log. Actualiza clinical.medication_requests. Lee audit.audit_log, clinical.medication_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:135` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-records.controller.ts:135` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:176` |
| `audit.audit_log` | LEE | LEE | DIRECTA | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:151` |
| `clinical.medication_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign | `src/modules/clinical/services/medications.service.ts:296` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalRecordsController.signMedicationRequest → MedicationsService.sign → MedicationsService.loadRequestOrThrow → MedicationRequestsRepository.findById | `src/modules/clinical/repositories/medication-requests.repository.ts:139` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MedicationRequestResponseDto>` · DTO `MedicationRequestResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/medication.dto.ts:534` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/medication.dto.ts:540` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/medication.dto.ts:546` |
| `replacesRequestId` | `string` | No | formato uuid; admite null | — | Receta a la que esta sustituye | `src/modules/clinical/dto/medication.dto.ts:556` |
| `replacedByRequestId` | `string` | No | formato uuid; admite null | — | Receta que sustituye a esta | `src/modules/clinical/dto/medication.dto.ts:566` |
| `renewedFromRequestId` | `string` | No | formato uuid; admite null | — | Receta de la que esta es renovación | `src/modules/clinical/dto/medication.dto.ts:576` |
| `signedAt` | `string` | No | formato date-time; admite null | — | Instante de firma de la receta (nulo = sin firmar) | `src/modules/clinical/dto/medication.dto.ts:587` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/medication.dto.ts:593` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Receta no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo un borrador (DRAFT) puede firmarse antes de emitirse |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalRecordsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. POST /clinical/observations

- **Origen:** CONTRATO
- **Nombre:** Registrar una observación con componentes y ejecutantes
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalObservationsController.record` — `src/modules/clinical/controllers/clinical-observations.controller.ts:34`

### Qué es y para qué sirve (negocio)

Registrar una observación con componentes y ejecutantes. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/observations` la atiende `ClinicalObservationsController.record` (src/modules/clinical/controllers/clinical-observations.controller.ts:34). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateObservationDto` (39 campos, 3 obligatorios). Delega en `ObservationsService.record`. Crea filas en clinical.observation_components, clinical.observation_notes, clinical.observation_performers, clinical.observation_reference_ranges, clinical.observations. Lee clinical.encounters, clinical.service_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-observations.controller.ts:34` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalObservationsController.record → ObservationsService.record → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:167` |
| `clinical.observation_components` | ESCRIBE | CREA | DIRECTA | ClinicalObservationsController.record → ObservationsService.record → ObservationsRepository.createComponent | `src/modules/clinical/repositories/observations.repository.ts:346` |
| `clinical.observation_notes` | ESCRIBE | CREA | DIRECTA | ClinicalObservationsController.record → ObservationsService.record → ObservationsRepository.createNote | `src/modules/clinical/repositories/observations.repository.ts:435` |
| `clinical.observation_performers` | ESCRIBE | CREA | DIRECTA | ClinicalObservationsController.record → ObservationsService.record → ObservationsRepository.createPerformer | `src/modules/clinical/repositories/observations.repository.ts:412` |
| `clinical.observation_reference_ranges` | ESCRIBE | CREA | DIRECTA | ClinicalObservationsController.record → ObservationsService.record → ObservationsRepository.createReferenceRange | `src/modules/clinical/repositories/observations.repository.ts:382` |
| `clinical.observations` | ESCRIBE | CREA | DIRECTA | ClinicalObservationsController.record → ObservationsService.record → ObservationsRepository.create | `src/modules/clinical/repositories/observations.repository.ts:300` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | ClinicalObservationsController.record → ObservationsService.record → ServiceRequestsRepository.findById | `src/modules/clinical/repositories/service-requests.repository.ts:67` |

### Cuerpo — DTO `CreateObservationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `valueTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de valor (concept id) | `src/modules/clinical/dto/observation.dto.ts:27` |
| `valueDecimal` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Valor decimal | `src/modules/clinical/dto/observation.dto.ts:35` |
| `valueBoolean` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Valor booleano | `src/modules/clinical/dto/observation.dto.ts:43` |
| `valueText` | `string` | No | — | `@IsOptional()` `@IsString()` | Valor de texto | `src/modules/clinical/dto/observation.dto.ts:51` |
| `valueConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Valor codificado (concept id) | `src/modules/clinical/dto/observation.dto.ts:62` |
| `quantityValue` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Magnitud de la cantidad | `src/modules/clinical/dto/observation.dto.ts:70` |
| `quantityUnitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad de la cantidad (concept id) | `src/modules/clinical/dto/observation.dto.ts:81` |
| `custodianTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant custodio (directory.tenants) | `src/modules/clinical/dto/observation.dto.ts:187` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente (profiles.patient_profiles) | `src/modules/clinical/dto/observation.dto.ts:197` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro en curso | `src/modules/clinical/dto/observation.dto.ts:205` |
| `basedOnServiceRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Orden de servicio que la origina | `src/modules/clinical/dto/observation.dto.ts:216` |
| `codeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Código de la observación (concept id) | `src/modules/clinical/dto/observation.dto.ts:226` |
| `categoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Categoría (concept id) | `src/modules/clinical/dto/observation.dto.ts:237` |
| `interpretationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Interpretación (concept id) | `src/modules/clinical/dto/observation.dto.ts:248` |
| `methodConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Método (concept id) | `src/modules/clinical/dto/observation.dto.ts:256` |
| `bodySiteConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sitio anatómico (concept id) | `src/modules/clinical/dto/observation.dto.ts:267` |
| `sourceDeviceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Dispositivo de origen | `src/modules/clinical/dto/observation.dto.ts:275` |
| `effectiveStartAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de vigencia clínica | `src/modules/clinical/dto/observation.dto.ts:286` |
| `issuedAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Momento de emisión | `src/modules/clinical/dto/observation.dto.ts:297` |
| `components` | `array<ObservationComponentInput>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ObservationComponentInput)` | — | `src/modules/clinical/dto/observation.dto.ts:307` |
| `components[].valueTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de valor (concept id) | `src/modules/clinical/dto/observation.dto.ts:27` |
| `components[].valueDecimal` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Valor decimal | `src/modules/clinical/dto/observation.dto.ts:35` |
| `components[].valueBoolean` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Valor booleano | `src/modules/clinical/dto/observation.dto.ts:43` |
| `components[].valueText` | `string` | No | — | `@IsOptional()` `@IsString()` | Valor de texto | `src/modules/clinical/dto/observation.dto.ts:51` |
| `components[].valueConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Valor codificado (concept id) | `src/modules/clinical/dto/observation.dto.ts:62` |
| `components[].quantityValue` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Magnitud de la cantidad | `src/modules/clinical/dto/observation.dto.ts:70` |
| `components[].quantityUnitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad de la cantidad (concept id) | `src/modules/clinical/dto/observation.dto.ts:81` |
| `components[].codeConceptId` | `string` | No | formato uuid | `@IsUUID()` | Código del componente (concept id) | `src/modules/clinical/dto/observation.dto.ts:94` |
| `components[].interpretationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Interpretación (concept id) | `src/modules/clinical/dto/observation.dto.ts:105` |
| `performers` | `array<ObservationPerformerInput>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ObservationPerformerInput)` | — | `src/modules/clinical/dto/observation.dto.ts:317` |
| `performers[].performerTypeConceptId` | `string` | No | formato uuid | `@IsUUID()` | Tipo de ejecutante (concept id) | `src/modules/clinical/dto/observation.dto.ts:118` |
| `performers[].performerId` | `string` | No | formato uuid | `@IsUUID()` | Id del ejecutante (profesional/dispositivo) | `src/modules/clinical/dto/observation.dto.ts:128` |
| `performers[].performerRoleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Rol del ejecutante (concept id) | `src/modules/clinical/dto/observation.dto.ts:139` |
| `referenceRanges` | `array<ObservationReferenceRangeInput>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ObservationReferenceRangeInput)` | — | `src/modules/clinical/dto/observation.dto.ts:327` |
| `referenceRanges[].lowValue` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Límite inferior | `src/modules/clinical/dto/observation.dto.ts:150` |
| `referenceRanges[].highValue` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Límite superior | `src/modules/clinical/dto/observation.dto.ts:158` |
| `referenceRanges[].unitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad (concept id) | `src/modules/clinical/dto/observation.dto.ts:166` |
| `referenceRanges[].text` | `string` | No | — | `@IsOptional()` `@IsString()` | Texto libre del rango | `src/modules/clinical/dto/observation.dto.ts:174` |
| `notes` | `array<string>` | No | — | `@IsOptional()` `@IsArray()` `@IsString({ each: true })` | Notas de la observación | `src/modules/clinical/dto/observation.dto.ts:339` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/observation.dto.ts:380` |
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
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La observación requiere un valor (cantidad, decimal, texto, booleano o concepto) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:621` |
| CONTROLADOR | `src/modules/clinical/controllers/clinical-observations.controller.spec.ts:35` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalObservationsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. PATCH /clinical/observations/{id}/amend

- **Origen:** CONTRATO
- **Nombre:** Corregir/enmendar una observación (value contract)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalObservationsController.amend` — `src/modules/clinical/controllers/clinical-observations.controller.ts:47`

### Qué es y para qué sirve (negocio)

Corregir/enmendar una observación (value contract). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /clinical/observations/{id}/amend` la atiende `ClinicalObservationsController.amend` (src/modules/clinical/controllers/clinical-observations.controller.ts:47). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `AmendObservationDto` (10 campos, 1 obligatorio). Delega en `ObservationsService.amend`. Crea filas en clinical.observation_notes. Actualiza clinical.observations. Lee clinical.observation_components, clinical.observations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-observations.controller.ts:47` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-observations.controller.ts:47` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.observation_components` | LEE | LEE | DIRECTA | ClinicalObservationsController.amend → ObservationsService.amend → ObservationsRepository.findComponents | `src/modules/clinical/repositories/observations.repository.ts:458` |
| `clinical.observation_notes` | ESCRIBE | CREA | DIRECTA | ClinicalObservationsController.amend → ObservationsService.amend → ObservationsRepository.createNote | `src/modules/clinical/repositories/observations.repository.ts:435` |
| `clinical.observations` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalObservationsController.amend → ObservationsService.amend | `src/modules/clinical/services/observations.service.ts:295` |
| `clinical.observations` | LEE | LEE | DIRECTA | ClinicalObservationsController.amend → ObservationsService.amend → ObservationsRepository.findById | `src/modules/clinical/repositories/observations.repository.ts:289` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AmendObservationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `valueTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de valor (concept id) | `src/modules/clinical/dto/observation.dto.ts:27` |
| `valueDecimal` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Valor decimal | `src/modules/clinical/dto/observation.dto.ts:35` |
| `valueBoolean` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Valor booleano | `src/modules/clinical/dto/observation.dto.ts:43` |
| `valueText` | `string` | No | — | `@IsOptional()` `@IsString()` | Valor de texto | `src/modules/clinical/dto/observation.dto.ts:51` |
| `valueConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Valor codificado (concept id) | `src/modules/clinical/dto/observation.dto.ts:62` |
| `quantityValue` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Magnitud de la cantidad | `src/modules/clinical/dto/observation.dto.ts:70` |
| `quantityUnitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad de la cantidad (concept id) | `src/modules/clinical/dto/observation.dto.ts:81` |
| `note` | `string` | Sí | — | `@IsString()` | Nota que justifica la enmienda | `src/modules/clinical/dto/observation.dto.ts:349` |
| `expectedRowVersion` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | row_version esperado (bloqueo optimista) | `src/modules/clinical/dto/observation.dto.ts:360` |
| `interpretationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Interpretación revisada (concept id) | `src/modules/clinical/dto/observation.dto.ts:371` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/observation.dto.ts:380` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | sin fuente |
| `duplicate` | `boolean` | Sí | — | — | true si ya se había recogido el mismo contenido en la corrida | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
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

## 20. GET /clinical/patients/{patientProfileId}/prescriptions

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalPrescriptionsController.list` — `src/modules/clinical/controllers/clinical-prescriptions.controller.ts:50`

### Qué es y para qué sirve (negocio)

Dominio: Clínico y Diagnóstico.

_Fuentes:_ MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /clinical/patients/{patientProfileId}/prescriptions` la atiende `ClinicalPrescriptionsController.list` (src/modules/clinical/controllers/clinical-prescriptions.controller.ts:50). Exige sesión con alguno de los roles PATIENT, PRACTITIONER, CLINICIAN. Delega en `ClinicalReadService.assertPuedeLeerHistoria`, `PrescriptionDocumentsService.list`, `PinoLogger.info`. Lee clinical.medication_requests, profiles.health_practitioner_profiles, profiles.patient_portal_proxies, profiles.patient_profiles, profiles.person_account_links, profiles.persons, scheduling.appointment_bookings, scheduling.bookable_slots y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT, PRACTITIONER, CLINICIAN | `src/modules/clinical/controllers/clinical-prescriptions.controller.ts:50` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: patientProfileId | `src/modules/clinical/controllers/clinical-prescriptions.controller.ts:50` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.list → PrescriptionDocumentsService.list | `src/modules/clinical/services/prescription-documents.service.ts:37` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.list → ClinicalReadService.assertPuedeLeerHistoria → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.list → ClinicalReadService.assertPuedeLeerHistoria → ClinicalReadService.assertOwnRecord | `src/modules/clinical/services/clinical-read.service.ts:362` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.list → ClinicalReadService.assertPuedeLeerHistoria → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.list → ClinicalReadService.assertPuedeLeerHistoria → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.list → PrescriptionDocumentsService.list → PrescriptionDocumentsService.people | `src/modules/clinical/services/prescription-documents.service.ts:447` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalPrescriptionsController.list → ClinicalReadService.assertPuedeLeerHistoria → ClinicalReadService.estaAtendiendo → SchedulingBookingsRepository.tieneConsultaEnCurso | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:891` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalPrescriptionsController.list → ClinicalReadService.assertPuedeLeerHistoria → ClinicalReadService.estaAtendiendo → ClinicalReadService.atiendeHoy → SchedulingBookingsRepository.findConfirmadasConPacienteEntre | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:916` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalPrescriptionsController.list → ClinicalReadService.assertPuedeLeerHistoria → ClinicalReadService.estaAtendiendo → SchedulingBookingsRepository.tieneConsultaEnCurso | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:891` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.list → PrescriptionDocumentsService.list → PrescriptionDocumentsService.labels | `src/modules/clinical/services/prescription-documents.service.ts:485` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.list → ClinicalReadService.assertPuedeLeerHistoria → ClinicalReadService.assertOwnRecord | `src/modules/clinical/services/clinical-read.service.ts:373` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | — |
| `offset` | query | sin dato | `string` | — |
| `limit` | query | sin dato | `string` | — |

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
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo podés consultar tu propia historia clínica. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalPrescriptionsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. GET /clinical/patients/{patientProfileId}/prescriptions/history.pdf

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalPrescriptionsController.history` — `src/modules/clinical/controllers/clinical-prescriptions.controller.ts:81`

### Qué es y para qué sirve (negocio)

Dominio: Clínico y Diagnóstico.

_Fuentes:_ MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /clinical/patients/{patientProfileId}/prescriptions/history.pdf` la atiende `ClinicalPrescriptionsController.history` (src/modules/clinical/controllers/clinical-prescriptions.controller.ts:81). Exige sesión con alguno de los roles PATIENT, PRACTITIONER, CLINICIAN. Delega en `ClinicalReadService.assertOwnRecord`, `PrescriptionDocumentsService.all`, `PrescriptionDocumentsService.pdf`, `PinoLogger.info`. Lee clinical.medication_requests, profiles.health_practitioner_profiles, profiles.jurisdiction_authorizations, profiles.patient_portal_proxies, profiles.patient_profiles, profiles.person_account_links, profiles.persons, terminology.catalog_concepts y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT, PRACTITIONER, CLINICIAN | `src/modules/clinical/controllers/clinical-prescriptions.controller.ts:81` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: patientProfileId | `src/modules/clinical/controllers/clinical-prescriptions.controller.ts:81` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.history → PrescriptionDocumentsService.all | `src/modules/clinical/services/prescription-documents.service.ts:71` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.history → PrescriptionDocumentsService.pdf | `src/modules/clinical/services/prescription-documents.service.ts:114` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.history → PrescriptionDocumentsService.pdf | `src/modules/clinical/services/prescription-documents.service.ts:124` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.history → ClinicalReadService.assertOwnRecord | `src/modules/clinical/services/clinical-read.service.ts:362` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.history → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.history → ClinicalReadService.assertOwnRecord → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.history → PrescriptionDocumentsService.pdf → PrescriptionDocumentsService.people | `src/modules/clinical/services/prescription-documents.service.ts:447` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.history → PrescriptionDocumentsService.pdf → PrescriptionDocumentsService.labels | `src/modules/clinical/services/prescription-documents.service.ts:485` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.history → ClinicalReadService.assertOwnRecord | `src/modules/clinical/services/clinical-read.service.ts:373` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StreamableFile>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo podés consultar tu propia historia clínica. |
| 413 | `PAYLOAD_TOO_LARGE` | PayloadTooLargeException: El historial supera el máximo operativo de {MAX_HISTORY_PRESCRIPTIONS} recetas. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical/controllers/clinical-prescriptions.controller.spec.ts:50` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalPrescriptionsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. GET /clinical/patients/{patientProfileId}/summary

- **Origen:** CONTRATO
- **Nombre:** UC-39-20: historial clínico del paciente (condiciones, alergias, medicación, observaciones, encuentros)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalReadController.getPatientSummary` — `src/modules/clinical/controllers/clinical-read.controller.ts:56`

### Qué es y para qué sirve (negocio)

UC-39-20: historial clínico del paciente (condiciones, alergias, medicación, observaciones, encuentros). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /clinical/patients/{patientProfileId}/summary` la atiende `ClinicalReadController.getPatientSummary` (src/modules/clinical/controllers/clinical-read.controller.ts:56). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER, PATIENT. Delega en `ClinicalReadService.assertPuedeLeerHistoria`, `ClinicalReadService.getPatientSummary`. Lee clinical.allergy_intolerances, clinical.care_episodes, clinical.conditions, clinical.encounters, clinical.medication_requests, clinical.observations, profiles.health_practitioner_profiles, profiles.patient_portal_proxies y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER, PATIENT | `src/modules/clinical/controllers/clinical-read.controller.ts:56` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: patientProfileId | `src/modules/clinical/controllers/clinical-read.controller.ts:56` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.allergy_intolerances` | LEE | LEE | DIRECTA | ClinicalReadController.getPatientSummary → ClinicalReadService.getPatientSummary → AllergyIntolerancesRepository.findByPatient | `src/modules/clinical/repositories/allergy-intolerances.repository.ts:98` |
| `clinical.care_episodes` | LEE | LEE | DIRECTA | ClinicalReadController.getPatientSummary → ClinicalReadService.getPatientSummary → CareEpisodesRepository.findByPatient | `src/modules/clinical/repositories/care-episodes.repository.ts:85` |
| `clinical.conditions` | LEE | LEE | DIRECTA | ClinicalReadController.getPatientSummary → ClinicalReadService.getPatientSummary → ConditionsRepository.findByPatient | `src/modules/clinical/repositories/conditions.repository.ts:92` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalReadController.getPatientSummary → ClinicalReadService.getPatientSummary → EncountersRepository.findByPatient | `src/modules/clinical/repositories/encounters.repository.ts:152` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalReadController.getPatientSummary → ClinicalReadService.getPatientSummary → MedicationRequestsRepository.findByPatient | `src/modules/clinical/repositories/medication-requests.repository.ts:124` |
| `clinical.observations` | LEE | LEE | DIRECTA | ClinicalReadController.getPatientSummary → ClinicalReadService.getPatientSummary → ObservationsRepository.findByPatient | `src/modules/clinical/repositories/observations.repository.ts:274` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalReadController.getPatientSummary → ClinicalReadService.assertPuedeLeerHistoria → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | ClinicalReadController.getPatientSummary → ClinicalReadService.assertPuedeLeerHistoria → ClinicalReadService.assertOwnRecord | `src/modules/clinical/services/clinical-read.service.ts:362` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ClinicalReadController.getPatientSummary → ClinicalReadService.assertPuedeLeerHistoria → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalReadController.getPatientSummary → ClinicalReadService.assertPuedeLeerHistoria → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalReadController.getPatientSummary → ClinicalReadService.assertPuedeLeerHistoria → ClinicalReadService.estaAtendiendo → SchedulingBookingsRepository.tieneConsultaEnCurso | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:891` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalReadController.getPatientSummary → ClinicalReadService.assertPuedeLeerHistoria → ClinicalReadService.estaAtendiendo → ClinicalReadService.atiendeHoy → SchedulingBookingsRepository.findConfirmadasConPacienteEntre | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:916` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalReadController.getPatientSummary → ClinicalReadService.assertPuedeLeerHistoria → ClinicalReadService.estaAtendiendo → SchedulingBookingsRepository.tieneConsultaEnCurso | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:891` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | ClinicalReadController.getPatientSummary → ClinicalReadService.assertPuedeLeerHistoria → ClinicalReadService.assertOwnRecord | `src/modules/clinical/services/clinical-read.service.ts:373` |

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
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/clinical-read.dto.ts:405` |
| `conditions` | `array<ConditionItemDto>` | Sí | — | — | Valor de conditions mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:411` |
| `conditions[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:9` |
| `conditions[].codeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a code concept. | `src/modules/clinical/dto/clinical-read.dto.ts:15` |
| `conditions[].categoryConceptId` | `string` | No | formato uuid | — | Identificador asociado a category concept. | `src/modules/clinical/dto/clinical-read.dto.ts:21` |
| `conditions[].clinicalStatusConceptId` | `string` | No | formato uuid | — | Identificador asociado a clinical status concept. | `src/modules/clinical/dto/clinical-read.dto.ts:27` |
| `conditions[].verificationStatusConceptId` | `string` | No | formato uuid | — | Identificador asociado a verification status concept. | `src/modules/clinical/dto/clinical-read.dto.ts:33` |
| `conditions[].severityConceptId` | `string` | No | formato uuid | — | Identificador asociado a severity concept. | `src/modules/clinical/dto/clinical-read.dto.ts:39` |
| `conditions[].encounterId` | `string` | No | formato uuid | — | Identificador asociado a encounter. | `src/modules/clinical/dto/clinical-read.dto.ts:45` |
| `conditions[].clinicalCourseConceptId` | `string` | No | formato uuid | — | Identificador asociado a clinical course concept (Patch v4.0.8). | `src/modules/clinical/dto/clinical-read.dto.ts:51` |
| `conditions[].onsetAt` | `string` | No | formato date-time | — | Valor de onset at mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:57` |
| `conditions[].expectedResolutionAt` | `string` | No | formato date-time | — | Fecha esperada de resolución o próxima revisión (Patch v4.0.8). | `src/modules/clinical/dto/clinical-read.dto.ts:63` |
| `conditions[].resolvedAt` | `string` | No | formato date-time | — | Valor de resolved at mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:69` |
| `conditions[].noteText` | `string` | No | — | — | Hallazgos y justificación clínica (Patch v4.1.3). | `src/modules/clinical/dto/clinical-read.dto.ts:75` |
| `conditions[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/clinical-read.dto.ts:81` |
| `allergies` | `array<AllergyItemDto>` | Sí | — | — | Valor de allergies mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:417` |
| `allergies[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:90` |
| `allergies[].substanceConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a substance concept. | `src/modules/clinical/dto/clinical-read.dto.ts:96` |
| `allergies[].typeConceptId` | `string` | No | formato uuid | — | Identificador asociado a type concept. | `src/modules/clinical/dto/clinical-read.dto.ts:102` |
| `allergies[].categoryConceptId` | `string` | No | formato uuid | — | Identificador asociado a category concept. | `src/modules/clinical/dto/clinical-read.dto.ts:108` |
| `allergies[].criticalityConceptId` | `string` | No | formato uuid | — | Identificador asociado a criticality concept. | `src/modules/clinical/dto/clinical-read.dto.ts:114` |
| `allergies[].clinicalStatusConceptId` | `string` | No | formato uuid | — | Identificador asociado a clinical status concept. | `src/modules/clinical/dto/clinical-read.dto.ts:120` |
| `allergies[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/clinical-read.dto.ts:126` |
| `medicationRequests` | `array<MedicationRequestItemDto>` | Sí | — | — | Valor de medication requests mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:423` |
| `medicationRequests[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:135` |
| `medicationRequests[].medicationConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a medication concept. | `src/modules/clinical/dto/clinical-read.dto.ts:141` |
| `medicationRequests[].statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/clinical/dto/clinical-read.dto.ts:147` |
| `medicationRequests[].prescriberProfileId` | `string` | No | formato uuid | — | Identificador asociado a prescriber profile. | `src/modules/clinical/dto/clinical-read.dto.ts:153` |
| `medicationRequests[].doseText` | `string` | No | — | — | Valor de dose text mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:159` |
| `medicationRequests[].frequencyText` | `string` | No | — | — | Valor de frequency text mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:165` |
| `medicationRequests[].validFrom` | `string` | No | formato date-time | — | Valor de valid from mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:171` |
| `medicationRequests[].validTo` | `string` | No | formato date-time | — | Valor de valid to mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:177` |
| `medicationRequests[].patientInstructionsText` | `string` | No | — | — | Indicaciones al paciente impresas en la receta (Patch v4.1.3). | `src/modules/clinical/dto/clinical-read.dto.ts:183` |
| `medicationRequests[].indicationConditionId` | `string` | No | formato uuid | — | Condición que motiva la prescripción — para qué es la receta (Patch v4.1.6). | `src/modules/clinical/dto/clinical-read.dto.ts:189` |
| `medicationRequests[].signedAt` | `string` | No | formato date-time | — | Valor de signed at mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:195` |
| `medicationRequests[].issuedAt` | `string` | No | formato date-time | — | Valor de issued at mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:201` |
| `medicationRequests[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/clinical-read.dto.ts:207` |
| `observations` | `array<ObservationItemDto>` | Sí | — | — | Valor de observations mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:429` |
| `observations[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:216` |
| `observations[].codeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a code concept. | `src/modules/clinical/dto/clinical-read.dto.ts:222` |
| `observations[].statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/clinical/dto/clinical-read.dto.ts:228` |
| `observations[].interpretationConceptId` | `string` | No | formato uuid | — | Identificador asociado a interpretation concept. | `src/modules/clinical/dto/clinical-read.dto.ts:234` |
| `observations[].valueDecimal` | `string` | No | — | — | Valor de value decimal mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:240` |
| `observations[].valueText` | `string` | No | — | — | Valor de value text mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:246` |
| `observations[].valueBoolean` | `boolean` | No | — | — | Valor de value boolean mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:252` |
| `observations[].valueConceptId` | `string` | No | formato uuid | — | Identificador asociado a value concept. | `src/modules/clinical/dto/clinical-read.dto.ts:258` |
| `observations[].quantityValue` | `string` | No | — | — | Valor de quantity value mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:264` |
| `observations[].quantityUnitConceptId` | `string` | No | formato uuid | — | Identificador asociado a quantity unit concept. | `src/modules/clinical/dto/clinical-read.dto.ts:270` |
| `observations[].effectiveStartAt` | `string` | No | formato date-time | — | Valor de effective start at mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:276` |
| `observations[].encounterId` | `string` | No | formato uuid | — | Identificador asociado a encounter. | `src/modules/clinical/dto/clinical-read.dto.ts:282` |
| `encounters` | `array<EncounterItemDto>` | Sí | — | — | Valor de encounters mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:435` |
| `encounters[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:291` |
| `encounters[].episodeId` | `string` | No | formato uuid | — | Identificador asociado a episode. | `src/modules/clinical/dto/clinical-read.dto.ts:297` |
| `encounters[].statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/clinical/dto/clinical-read.dto.ts:303` |
| `encounters[].classConceptId` | `string` | No | formato uuid | — | Identificador asociado a class concept. | `src/modules/clinical/dto/clinical-read.dto.ts:309` |
| `encounters[].primaryPractitionerId` | `string` | No | formato uuid | — | Identificador asociado a primary practitioner. | `src/modules/clinical/dto/clinical-read.dto.ts:315` |
| `encounters[].reasonText` | `string` | No | — | — | Valor de reason text mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:321` |
| `encounters[].startAt` | `string` | No | formato date-time | — | Valor de start at mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:327` |
| `encounters[].endAt` | `string` | No | formato date-time | — | Valor de end at mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:333` |
| `careEpisodes` | `array<CareEpisodeItemDto>` | Sí | — | — | Episodios de cuidado (internaciones y estancias) del paciente. Va en el mismo `GET` que el resto y no en una llamada aparte por lo mismo que las alergias: es contexto de la atención, y depender de que el cliente se acuerde de pedirlo es depender de que nadie se olvide. | `src/modules/clinical/dto/clinical-read.dto.ts:445` |
| `careEpisodes[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:348` |
| `careEpisodes[].tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | `src/modules/clinical/dto/clinical-read.dto.ts:354` |
| `careEpisodes[].typeConceptId` | `string` | No | formato uuid | — | Identificador asociado a type concept. | `src/modules/clinical/dto/clinical-read.dto.ts:360` |
| `careEpisodes[].statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/clinical/dto/clinical-read.dto.ts:366` |
| `careEpisodes[].responsiblePractitionerId` | `string` | No | formato uuid | — | Identificador asociado a responsible practitioner. | `src/modules/clinical/dto/clinical-read.dto.ts:372` |
| `careEpisodes[].startAt` | `string` | No | formato date-time | — | Valor de start at mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:378` |
| `careEpisodes[].endAt` | `string` | No | formato date-time | — | Valor de end at mantenido por la instancia. | `src/modules/clinical/dto/clinical-read.dto.ts:384` |
| `careEpisodes[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/clinical-read.dto.ts:390` |
| `limit` | `number` | Sí | — | — | Tope aplicado a cada bloque | `src/modules/clinical/dto/clinical-read.dto.ts:451` |
| `truncated` | `array<string>` | Sí | — | — | Qué bloques quedaron recortados por el tope | `src/modules/clinical/dto/clinical-read.dto.ts:461` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo podés consultar tu propia historia clínica. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:645` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. GET /clinical/prescription-signature-policies

- **Origen:** CONTRATO
- **Nombre:** Listar las políticas de firma de un tenant
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalPrescriptionPoliciesController.list` — `src/modules/clinical/controllers/clinical-prescription-policies.controller.ts:62`

### Qué es y para qué sirve (negocio)

Listar las políticas de firma de un tenant. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /clinical/prescription-signature-policies` la atiende `ClinicalPrescriptionPoliciesController.list` (src/modules/clinical/controllers/clinical-prescription-policies.controller.ts:62). Exige sesión con alguno de los roles CLINICIAN, SECURITY_ADMIN. Delega en `PrescriptionSignaturePoliciesService.list`. Lee clinical.prescription_signature_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, SECURITY_ADMIN | `src/modules/clinical/controllers/clinical-prescription-policies.controller.ts:62` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_QUERY | tenantId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

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

## 24. POST /clinical/prescription-signature-policies

- **Origen:** CONTRATO
- **Nombre:** Crear una política de firma de receta
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalPrescriptionPoliciesController.create` — `src/modules/clinical/controllers/clinical-prescription-policies.controller.ts:46`

### Qué es y para qué sirve (negocio)

Crear una política de firma de receta. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/prescription-signature-policies` la atiende `ClinicalPrescriptionPoliciesController.create` (src/modules/clinical/controllers/clinical-prescription-policies.controller.ts:46). Exige sesión con alguno de los roles CLINICIAN, SECURITY_ADMIN. Valida el cuerpo como `CreatePrescriptionSignaturePolicyDto` (7 campos, 2 obligatorios). Delega en `PrescriptionSignaturePoliciesService.create`. Crea filas en clinical.prescription_signature_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, SECURITY_ADMIN | `src/modules/clinical/controllers/clinical-prescription-policies.controller.ts:46` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

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

## 25. POST /clinical/prescription-signature-policies/{id}/deactivate

- **Origen:** CONTRATO
- **Nombre:** Desactivar una política (cierra vigencia, sin borrado duro)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalPrescriptionPoliciesController.deactivate` — `src/modules/clinical/controllers/clinical-prescription-policies.controller.ts:77`

### Qué es y para qué sirve (negocio)

Desactivar una política (cierra vigencia, sin borrado duro). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/prescription-signature-policies/{id}/deactivate` la atiende `ClinicalPrescriptionPoliciesController.deactivate` (src/modules/clinical/controllers/clinical-prescription-policies.controller.ts:77). Exige sesión con alguno de los roles CLINICIAN, SECURITY_ADMIN. Delega en `PrescriptionSignaturePoliciesService.deactivate`. Actualiza clinical.prescription_signature_policies. Lee clinical.prescription_signature_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, SECURITY_ADMIN | `src/modules/clinical/controllers/clinical-prescription-policies.controller.ts:77` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-prescription-policies.controller.ts:77` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.prescription_signature_policies` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalPrescriptionPoliciesController.deactivate → PrescriptionSignaturePoliciesService.deactivate | `src/modules/clinical/services/prescription-signature-policies.service.ts:148` |
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

## 26. GET /clinical/prescriptions/{id}/pdf

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalPrescriptionsController.one` — `src/modules/clinical/controllers/clinical-prescriptions.controller.ts:113`

### Qué es y para qué sirve (negocio)

Dominio: Clínico y Diagnóstico.

_Fuentes:_ MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /clinical/prescriptions/{id}/pdf` la atiende `ClinicalPrescriptionsController.one` (src/modules/clinical/controllers/clinical-prescriptions.controller.ts:113). Exige sesión con alguno de los roles PATIENT, PRACTITIONER, CLINICIAN. Delega en `PrescriptionDocumentsService.one`, `ClinicalReadService.assertPuedeLeerHistoria`, `PrescriptionDocumentsService.pdf`, `PinoLogger.info`. Lee clinical.medication_requests, profiles.health_practitioner_profiles, profiles.jurisdiction_authorizations, profiles.patient_portal_proxies, profiles.patient_profiles, profiles.person_account_links, profiles.persons, scheduling.appointment_bookings y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT, PRACTITIONER, CLINICIAN | `src/modules/clinical/controllers/clinical-prescriptions.controller.ts:113` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical/controllers/clinical-prescriptions.controller.ts:113` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.one → PrescriptionDocumentsService.one | `src/modules/clinical/services/prescription-documents.service.ts:58` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.one → PrescriptionDocumentsService.pdf | `src/modules/clinical/services/prescription-documents.service.ts:114` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.one → PrescriptionDocumentsService.pdf | `src/modules/clinical/services/prescription-documents.service.ts:124` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.one → ClinicalReadService.assertPuedeLeerHistoria → ClinicalReadService.assertOwnRecord | `src/modules/clinical/services/clinical-read.service.ts:362` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.one → ClinicalReadService.assertPuedeLeerHistoria → ClinicalReadService.assertOwnRecord → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.one → ClinicalReadService.assertPuedeLeerHistoria → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.one → PrescriptionDocumentsService.pdf → PrescriptionDocumentsService.people | `src/modules/clinical/services/prescription-documents.service.ts:447` |
| `scheduling.appointment_bookings` | LEE | LEE | POR_SQL | ClinicalPrescriptionsController.one → ClinicalReadService.assertPuedeLeerHistoria → ClinicalReadService.estaAtendiendo → SchedulingBookingsRepository.tieneConsultaEnCurso | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:891` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | ClinicalPrescriptionsController.one → ClinicalReadService.assertPuedeLeerHistoria → ClinicalReadService.estaAtendiendo → ClinicalReadService.atiendeHoy → SchedulingBookingsRepository.findConfirmadasConPacienteEntre | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:916` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | ClinicalPrescriptionsController.one → ClinicalReadService.assertPuedeLeerHistoria → ClinicalReadService.estaAtendiendo → SchedulingBookingsRepository.tieneConsultaEnCurso | `src/modules/scheduling/repositories/scheduling-bookings.repository.ts:891` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.one → PrescriptionDocumentsService.pdf → PrescriptionDocumentsService.labels | `src/modules/clinical/services/prescription-documents.service.ts:485` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | ClinicalPrescriptionsController.one → ClinicalReadService.assertPuedeLeerHistoria → ClinicalReadService.assertOwnRecord | `src/modules/clinical/services/clinical-read.service.ts:373` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StreamableFile>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo podés consultar tu propia historia clínica. |
| 404 | `NOT_FOUND` | NotFoundException: Receta emitida no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical/controllers/clinical-prescriptions.controller.spec.ts:67` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalPrescriptionsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 27. POST /clinical/procedures

- **Origen:** CONTRATO
- **Nombre:** Registrar un procedimiento
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalRecordsController.createProcedure` — `src/modules/clinical/controllers/clinical-records.controller.ts:198`

### Qué es y para qué sirve (negocio)

Registrar un procedimiento. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/procedures` la atiende `ClinicalRecordsController.createProcedure` (src/modules/clinical/controllers/clinical-records.controller.ts:198). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateProcedureDto` (15 campos, 3 obligatorios). Delega en `ProceduresService.create`. Crea filas en clinical.procedures. Actualiza clinical.service_requests. Lee clinical.procedures, clinical.service_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-records.controller.ts:198` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.procedures` | ESCRIBE | CREA | DIRECTA | ClinicalRecordsController.createProcedure → ProceduresService.create → ProceduresRepository.create | `src/modules/clinical/repositories/procedures.repository.ts:106` |
| `clinical.procedures` | LEE | LEE | DIRECTA | ClinicalRecordsController.createProcedure → ProceduresService.create → ProceduresRepository.findById | `src/modules/clinical/repositories/procedures.repository.ts:95` |
| `clinical.service_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ClinicalRecordsController.createProcedure → ProceduresService.create | `src/modules/clinical/services/procedures.service.ts:62` |
| `clinical.service_requests` | LEE | LEE | DIRECTA | ClinicalRecordsController.createProcedure → ProceduresService.create → ServiceRequestsRepository.findById | `src/modules/clinical/repositories/service-requests.repository.ts:67` |

### Cuerpo — DTO `CreateProcedureDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `custodianTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant custodio (directory.tenants) | `src/modules/clinical/dto/procedure.dto.ts:14` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente (profiles.patient_profiles) | `src/modules/clinical/dto/procedure.dto.ts:24` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro en curso | `src/modules/clinical/dto/procedure.dto.ts:32` |
| `codeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Código del procedimiento (concept id) | `src/modules/clinical/dto/procedure.dto.ts:42` |
| `performerProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional ejecutante | `src/modules/clinical/dto/procedure.dto.ts:53` |
| `serviceRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Orden de servicio que lo origina | `src/modules/clinical/dto/procedure.dto.ts:64` |
| `parentProcedureId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Procedimiento padre (jerarquía) | `src/modules/clinical/dto/procedure.dto.ts:75` |
| `categoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Categoría (concept id) | `src/modules/clinical/dto/procedure.dto.ts:86` |
| `outcomeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Resultado (concept id) | `src/modules/clinical/dto/procedure.dto.ts:97` |
| `practiceSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sede de práctica | `src/modules/clinical/dto/procedure.dto.ts:105` |
| `careSpaceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Espacio de atención | `src/modules/clinical/dto/procedure.dto.ts:113` |
| `occurrenceStartAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Inicio de la ocurrencia | `src/modules/clinical/dto/procedure.dto.ts:124` |
| `occurrenceEndAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Fin de la ocurrencia | `src/modules/clinical/dto/procedure.dto.ts:135` |
| `operativeReportFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Reporte operatorio (common.files) | `src/modules/clinical/dto/procedure.dto.ts:146` |
| `followUpText` | `string` | No | — | `@IsOptional()` `@IsString()` | Seguimiento en texto libre | `src/modules/clinical/dto/procedure.dto.ts:154` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/procedure.dto.ts:163` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/procedure.dto.ts:169` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/procedure.dto.ts:175` |
| `serviceRequestId` | `string` | No | formato uuid; admite null | — | Identificador asociado a service request. | `src/modules/clinical/dto/procedure.dto.ts:181` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/procedure.dto.ts:187` |

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

## 28. POST /clinical/service-requests

- **Origen:** CONTRATO
- **Nombre:** Crear una orden de servicio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalOrdersController.createServiceRequest` — `src/modules/clinical/controllers/clinical-orders.controller.ts:39`

### Qué es y para qué sirve (negocio)

Crear una orden de servicio. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /clinical/service-requests` la atiende `ClinicalOrdersController.createServiceRequest` (src/modules/clinical/controllers/clinical-orders.controller.ts:39). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateServiceRequestDto` (8 campos, 3 obligatorios). Delega en `ServiceRequestsService.create`. Crea filas en clinical.service_requests. Lee clinical.encounters.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical/controllers/clinical-orders.controller.ts:39` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:167` |
| `clinical.service_requests` | ESCRIBE | CREA | DIRECTA | ClinicalOrdersController.createServiceRequest → ServiceRequestsService.create → ServiceRequestsRepository.create | `src/modules/clinical/repositories/service-requests.repository.ts:78` |

### Cuerpo — DTO `CreateServiceRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `custodianTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant custodio (directory.tenants) | `src/modules/clinical/dto/service-request.dto.ts:14` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente (profiles.patient_profiles) | `src/modules/clinical/dto/service-request.dto.ts:24` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro en curso | `src/modules/clinical/dto/service-request.dto.ts:32` |
| `codeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Código del servicio pedido (concept id) | `src/modules/clinical/dto/service-request.dto.ts:42` |
| `categoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Categoría (concept id) | `src/modules/clinical/dto/service-request.dto.ts:53` |
| `priorityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Prioridad (concept id) | `src/modules/clinical/dto/service-request.dto.ts:64` |
| `requesterProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional solicitante | `src/modules/clinical/dto/service-request.dto.ts:75` |
| `performerTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant ejecutante | `src/modules/clinical/dto/service-request.dto.ts:83` |

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
  "priorityConceptId": "00000000-0000-4000-8000-000000000001",
  "requesterProfileId": "00000000-0000-4000-8000-000000000001",
  "performerTenantId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ServiceRequestResponseDto>` · DTO `ServiceRequestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical/dto/service-request.dto.ts:92` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical/dto/service-request.dto.ts:98` |
| `status` | `string` | Sí | formato uuid | — | Estado (concept id) | `src/modules/clinical/dto/service-request.dto.ts:104` |
| `intent` | `string` | Sí | formato uuid | — | Intención (concept id) | `src/modules/clinical/dto/service-request.dto.ts:110` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical/dto/service-request.dto.ts:116` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuentro no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/clinical.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/patient-diagnostic-orders.int-spec.ts:77` |
| CONTROLADOR | `src/modules/clinical/controllers/clinical-orders.controller.spec.ts:36` |

### Flujos

- Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics — etapa `ctrl:ClinicalOrdersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

