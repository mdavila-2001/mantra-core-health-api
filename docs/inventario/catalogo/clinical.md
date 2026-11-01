<!-- AUTOGENERADO por tools/inventario/catalogo.mjs. No editar manualmente. -->

# Catálogo del schema `clinical`

- **Tablas:** 30 · **Columnas:** 526 (129 con descripción: 24.5 %) · **Índices:** 329
- **Dominio:** Clínico y Diagnóstico
- Método y límites del catálogo: [README del inventario](../README.md)

## Tablas

| Tabla | Propósito | Columnas | Índices | Operaciones | ORM |
|---|---|---|---|---|---|
| [allergy_intolerances](#allergy_intolerances) | Mantiene las alergias e intolerancias conocidas del paciente para que puedan considerarse al decidir y prestar atención clínica. | 16 | 15 | 5 | COINCIDE |
| [allergy_reactions](#allergy_reactions) | Documenta las manifestaciones asociadas a una alergia o intolerancia para caracterizar el antecedente y orientar su evaluación clínica. | 10 | 5 | 2 | COINCIDE |
| [appointments](#appointments) | Representa citas asistenciales en el contexto clínico y permite relacionarlas con el encuentro realizado o planificado. | 17 | 14 | 21 | COINCIDE |
| [care_episodes](#care_episodes) | Agrupa encuentros relacionados dentro de un proceso asistencial del paciente para seguir su evolución y responsabilidad clínica. | 13 | 9 | 8 | COINCIDE |
| [conditions](#conditions) | Registra problemas, diagnósticos y condiciones de salud del paciente con estado, severidad, curso y fechas clínicas relevantes. | 21 | 16 | 22 | COINCIDE |
| [diagnostic_reports](#diagnostic_reports) | Gestiona el ciclo de vida del informe diagnóstico y lo vincula con su solicitud y encuentro; los resultados estructurados y archivos asociados se mantienen en el dominio de diagnóstico. | 16 | 14 | 21 | COINCIDE |
| [encounter_locations](#encounter_locations) | Vincula un encuentro con los lugares de prestación para mantener el contexto físico de la atención. | 20 | 15 | 48 | COINCIDE |
| [encounter_participants](#encounter_participants) | Identifica a las personas que participan en un encuentro y su rol para conservar quién intervino en la atención. | 14 | 7 | 13 | COINCIDE |
| [encounters](#encounters) | Representa cada contacto asistencial y vincula paciente, equipo, sede, agenda, motivo y estado de atención. | 26 | 18 | 113 | COINCIDE |
| [family_member_history](#family_member_history) | Conserva antecedentes familiares relevantes para la evaluación de riesgo y la historia de salud del paciente. | 15 | 9 | 0 | COINCIDE |
| [immunizations](#immunizations) | Registra inmunizaciones administradas o documentadas en la historia de salud para sostener seguimiento y continuidad preventiva. | 15 | 10 | 3 | COINCIDE |
| [inpatient_census_adjustments](#inpatient_census_adjustments) | Deja constancia inmutable de cada corrección a un contador del censo diario cerrado, con valor previo, nuevo y motivo, para indicadores hospitalarios auditables. | 11 | 3 | 4 | COINCIDE |
| [inpatient_census_days](#inpatient_census_days) | Consolida el censo diario de internación por sede y unidad al corte de medianoche (camas, ocupación, ingresos, egresos, días-paciente) y se congela al cerrarse. | 27 | 9 | 7 | COINCIDE |
| [inpatient_census_entries](#inpatient_census_entries) | Fotografía inmutable de cada paciente presente o con movimiento en el censo diario de una unidad, base de los indicadores de ocupación y estancia. | 10 | 7 | 2 | COINCIDE |
| [medication_records](#medication_records) | Conserva el historial clínico de uso o administración de medicación del paciente; no representa el inventario ni la dispensación de farmacia. | 16 | 12 | 1 | COINCIDE |
| [medication_requests](#medication_requests) | Registra solicitudes o prescripciones de medicamentos, su indicación y trazabilidad clínica dentro de la atención del paciente. | 33 | 17 | 52 | COINCIDE |
| [observation_components](#observation_components) | Desglosa observaciones compuestas en componentes ordenados para preservar cada resultado y su tipo de valor de manera interpretable. | 23 | 10 | 2 | COINCIDE |
| [observation_notes](#observation_notes) | Guarda notas narrativas complementarias sobre una observación cuando el dato codificado requiere contexto clínico adicional. | 5 | 2 | 2 | COINCIDE |
| [observation_performers](#observation_performers) | Atribuye quién o qué dispositivo realizó una observación para dar procedencia al resultado clínico. | 8 | 4 | 1 | COINCIDE |
| [observation_reference_ranges](#observation_reference_ranges) | Asocia rangos de referencia a observaciones o componentes para contextualizar la interpretación de resultados medibles. | 13 | 6 | 1 | COINCIDE |
| [observations](#observations) | Conserva hallazgos y mediciones clínicas codificados, tipados y vinculables al paciente, encuentro, solicitud y método de obtención. | 44 | 28 | 10 | COINCIDE |
| [patient_admission_footprints](#patient_admission_footprints) | sin propósito | 13 | 8 | 9 | SIN_ENTIDAD |
| [placement_incidents](#placement_incidents) | Registra la ubicación de un paciente que viola reglas de compatibilidad de cama (sexo, aislamiento, edad, categoría) con su justificación, autorización y revisión. | 18 | 11 | 8 | COINCIDE |
| [prescription_signature_policies](#prescription_signature_policies) | Define las reglas de firma aplicables a prescripciones para controlar quién puede validarlas y bajo qué requisitos operativos. | 13 | 1 | 5 | COINCIDE |
| [procedures](#procedures) | Documenta procedimientos asociados a la atención y enlaza su contexto con el encuentro, las solicitudes y, cuando corresponde, otros procedimientos. | 28 | 15 | 8 | COINCIDE |
| [received_services](#received_services) | sin propósito | 23 | 18 | 11 | COINCIDE |
| [service_request_components](#service_request_components) | sin propósito | 7 | 5 | 11 | COINCIDE |
| [service_request_notes](#service_request_notes) | sin propósito | 6 | 4 | 6 | COINCIDE |
| [service_requests](#service_requests) | Representa solicitudes de servicios clínicos —por ejemplo, estudios o procedimientos— y su estado dentro del proceso asistencial. | 29 | 26 | 40 | COINCIDE |
| [social_history](#social_history) | Registra factores y circunstancias sociales o hábitos que aportan contexto a la valoración y continuidad asistencial del paciente. | 16 | 11 | 0 | COINCIDE |

## Diagrama entidad-relación

Las tablas se agrupan en familias por sus claves foráneas dentro del schema (máximo 40 por diagrama). Las FK hacia otros schemas se listan en la ficha de cada tabla.

### Familia 1 de 1 — 27 tablas

```mermaid
erDiagram
  clinical_allergy_intolerances["clinical.allergy_intolerances"] {
    uuid id PK
    uuid custodian_tenant_id FK
    uuid patient_profile_id FK
    uuid substance_concept_id FK
    uuid type_concept_id FK
    uuid category_concept_id FK
    uuid criticality_concept_id FK
    uuid clinical_status_concept_id FK
  }
  clinical_allergy_reactions["clinical.allergy_reactions"] {
    uuid id PK
    uuid allergy_id FK
    uuid manifestation_concept_id FK
    uuid severity_concept_id FK
    uuid created_by_user_id FK
    uuid updated_by_user_id FK
  }
  clinical_encounters["clinical.encounters"] {
    uuid id PK
    uuid patient_profile_id FK
    uuid episode_id FK
    uuid tenant_id FK
    uuid branch_id FK
    uuid primary_practitioner_id FK
    uuid class_concept_id FK
    uuid type_concept_id FK
  }
  clinical_appointments["clinical.appointments"] {
    uuid id PK
    uuid patient_profile_id FK
    uuid practitioner_profile_id FK
    uuid tenant_id FK
    uuid branch_id FK
    uuid type_concept_id FK
    uuid status_concept_id FK
    uuid channel_concept_id FK
  }
  clinical_care_episodes["clinical.care_episodes"] {
    uuid id PK
    uuid patient_profile_id FK
    uuid tenant_id FK
    uuid responsible_practitioner_id FK
    uuid type_concept_id FK
    uuid status_concept_id FK
    uuid created_by_user_id FK
    uuid updated_by_user_id FK
  }
  clinical_conditions["clinical.conditions"] {
    uuid id PK
    uuid custodian_tenant_id FK
    uuid patient_profile_id FK
    uuid encounter_id FK
    uuid code_concept_id FK
    uuid category_concept_id FK
    uuid clinical_status_concept_id FK
    uuid verification_status_concept_id FK
  }
  clinical_diagnostic_reports["clinical.diagnostic_reports"] {
    uuid id PK
    uuid custodian_tenant_id FK
    uuid patient_profile_id FK
    uuid service_request_id FK
    uuid encounter_id FK
    uuid code_concept_id FK
    uuid category_concept_id FK
    uuid lifecycle_status_concept_id FK
  }
  clinical_encounter_locations["clinical.encounter_locations"] {
    uuid id PK
    uuid encounter_id FK
    uuid practice_site_id FK
    uuid clinical_unit_id FK
    uuid care_space_id FK
    uuid location_status_concept_id FK
    uuid created_by_user_id FK
    uuid updated_by_user_id FK
  }
  clinical_encounter_participants["clinical.encounter_participants"] {
    uuid id PK
    uuid encounter_id FK
    uuid practitioner_profile_id FK
    uuid participant_role_concept_id FK
    uuid practitioner_role_assignment_id FK
    uuid status_concept_id FK
    uuid created_by_user_id FK
    uuid updated_by_user_id FK
  }
  clinical_inpatient_census_entries["clinical.inpatient_census_entries"] {
    uuid id PK
    uuid tenant_id FK
    uuid census_day_id FK
    uuid encounter_id FK
    uuid patient_profile_id FK
    uuid care_space_id FK
    uuid bed_category_concept_id FK
    uuid movement_concept_id FK
  }
  clinical_medication_requests["clinical.medication_requests"] {
    uuid id PK
    uuid custodian_tenant_id FK
    uuid patient_profile_id FK
    uuid encounter_id FK
    uuid medication_concept_id FK
    uuid substance_atc_concept_id FK
    uuid intent_concept_id FK
    uuid status_concept_id FK
  }
  clinical_observations["clinical.observations"] {
    uuid id PK
    uuid custodian_tenant_id FK
    uuid patient_profile_id FK
    uuid encounter_id FK
    uuid based_on_service_request_id FK
    uuid category_concept_id FK
    uuid code_concept_id FK
    uuid status_concept_id FK
  }
  clinical_patient_admission_footprints["clinical.patient_admission_footprints"] {
    uuid id PK
    uuid tenant_id FK
    uuid patient_profile_id FK
    uuid encounter_id FK
    uuid practice_site_id FK
    uuid admission_origin_concept_id FK
    uuid identity_verification_method_concept_id FK
    uuid referral_id FK
  }
  clinical_placement_incidents["clinical.placement_incidents"] {
    uuid id PK
    uuid tenant_id FK
    uuid encounter_id FK
    uuid encounter_location_id FK
    uuid care_space_id FK
    uuid patient_profile_id FK
    uuid authorized_by_user_id FK
    uuid status_concept_id FK
  }
  clinical_procedures["clinical.procedures"] {
    uuid id PK
    uuid custodian_tenant_id FK
    uuid patient_profile_id FK
    uuid encounter_id FK
    uuid code_concept_id FK
    uuid status_concept_id FK
    uuid performer_profile_id FK
    uuid service_request_id FK
  }
  clinical_received_services["clinical.received_services"] {
    uuid id PK
    uuid custodian_tenant_id FK
    uuid patient_profile_id FK
    uuid encounter_id FK
    uuid service_type_concept_id FK
    uuid service_concept_id FK
    uuid status_concept_id FK
    uuid source_procedure_id FK
  }
  clinical_service_requests["clinical.service_requests"] {
    uuid id PK
    uuid custodian_tenant_id FK
    uuid patient_profile_id FK
    uuid encounter_id FK
    uuid code_concept_id FK
    uuid category_concept_id FK
    uuid intent_concept_id FK
    uuid priority_concept_id FK
  }
  clinical_inpatient_census_days["clinical.inpatient_census_days"] {
    uuid id PK
    uuid tenant_id FK
    uuid practice_site_id FK
    uuid clinical_unit_id FK
    uuid status_concept_id FK
    uuid closed_by_user_id FK
    uuid created_by_user_id FK
    uuid updated_by_user_id FK
  }
  clinical_medication_records["clinical.medication_records"] {
    uuid id PK
    uuid custodian_tenant_id FK
    uuid patient_profile_id FK
    uuid request_id FK
    uuid medication_concept_id FK
    uuid status_concept_id FK
    uuid record_type_concept_id FK
    uuid unit_concept_id FK
  }
  clinical_observation_components["clinical.observation_components"] {
    uuid id PK
    uuid observation_id FK
    uuid code_concept_id FK
    uuid value_type_concept_id FK
    uuid value_concept_id FK
    uuid quantity_unit_concept_id FK
    uuid range_unit_concept_id FK
    uuid data_absent_reason_concept_id FK
  }
  clinical_observation_notes["clinical.observation_notes"] {
    uuid id PK
    uuid observation_id FK
    uuid author_user_id FK
  }
  clinical_observation_performers["clinical.observation_performers"] {
    uuid id PK
    uuid observation_id FK
    uuid performer_type_concept_id FK
    uuid performer_role_concept_id FK
    uuid created_by_user_id FK
  }
  clinical_observation_reference_ranges["clinical.observation_reference_ranges"] {
    uuid id PK
    uuid observation_id FK
    uuid observation_component_id FK
    uuid unit_concept_id FK
    uuid type_concept_id FK
    uuid applies_to_concept_id FK
    uuid created_by_user_id FK
  }
  clinical_immunizations["clinical.immunizations"] {
    uuid id PK
    uuid custodian_tenant_id FK
    uuid patient_profile_id FK
    uuid vaccine_concept_id FK
    uuid status_concept_id FK
    uuid route_concept_id FK
    uuid administered_by_profile_id FK
    uuid created_by_user_id FK
  }
  clinical_service_request_components["clinical.service_request_components"] {
    uuid id PK
    uuid service_request_id FK
    uuid custodian_tenant_id FK
    uuid component_concept_id FK
    uuid created_by_user_id FK
  }
  clinical_service_request_notes["clinical.service_request_notes"] {
    uuid id PK
    uuid service_request_id FK
    uuid clinical_note_header_id FK
    uuid created_by_user_id FK
  }
  clinical_inpatient_census_adjustments["clinical.inpatient_census_adjustments"] {
    uuid id PK
    uuid tenant_id FK
    uuid census_day_id FK
    uuid adjusted_by_user_id FK
  }
  clinical_allergy_intolerances }o--o| clinical_encounters : "encounter_id"
  clinical_allergy_reactions }o--|| clinical_allergy_intolerances : "allergy_id"
  clinical_encounters }o--o| clinical_care_episodes : "episode_id"
  clinical_encounters }o--o| clinical_appointments : "appointment_id"
  clinical_conditions }o--o| clinical_encounters : "encounter_id"
  clinical_diagnostic_reports }o--o| clinical_service_requests : "service_request_id"
  clinical_diagnostic_reports }o--o| clinical_encounters : "encounter_id"
  clinical_encounter_locations }o--|| clinical_encounters : "encounter_id"
  clinical_encounter_locations }o--o| clinical_placement_incidents : "placement_incident_id"
  clinical_encounter_participants }o--|| clinical_encounters : "encounter_id"
  clinical_inpatient_census_entries }o--|| clinical_inpatient_census_days : "census_day_id"
  clinical_inpatient_census_entries }o--|| clinical_encounters : "encounter_id"
  clinical_medication_requests }o--o| clinical_encounters : "encounter_id"
  clinical_medication_requests }o--o| clinical_conditions : "indication_condition_id"
  clinical_observations }o--o| clinical_encounters : "encounter_id"
  clinical_observations }o--o| clinical_service_requests : "based_on_service_request_id"
  clinical_patient_admission_footprints }o--|| clinical_encounters : "encounter_id"
  clinical_placement_incidents }o--|| clinical_encounters : "encounter_id"
  clinical_placement_incidents }o--o| clinical_encounter_locations : "encounter_location_id"
  clinical_procedures }o--o| clinical_encounters : "encounter_id"
  clinical_procedures }o--o| clinical_service_requests : "service_request_id"
  clinical_received_services }o--o| clinical_encounters : "encounter_id"
  clinical_received_services }o--o| clinical_procedures : "source_procedure_id"
  clinical_received_services }o--o| clinical_immunizations : "source_immunization_id"
  clinical_service_requests }o--o| clinical_encounters : "encounter_id"
  clinical_service_requests }o--o| clinical_diagnostic_reports : "previous_diagnostic_report_id"
  clinical_medication_records }o--o| clinical_medication_requests : "request_id"
  clinical_observation_components }o--|| clinical_observations : "observation_id"
  clinical_observation_notes }o--|| clinical_observations : "observation_id"
  clinical_observation_performers }o--|| clinical_observations : "observation_id"
  clinical_observation_reference_ranges }o--|| clinical_observations : "observation_id"
  clinical_observation_reference_ranges }o--o| clinical_observation_components : "observation_component_id"
  clinical_service_request_components }o--|| clinical_service_requests : "service_request_id"
  clinical_service_request_notes }o--|| clinical_service_requests : "service_request_id"
  clinical_inpatient_census_adjustments }o--|| clinical_inpatient_census_days : "census_day_id"
```

### Tablas sin relaciones dentro del schema

`clinical.family_member_history` · `clinical.prescription_signature_policies` · `clinical.social_history`

## Fichas

### allergy_intolerances

#### Vista general

Mantiene las alergias e intolerancias conocidas del paciente para que puedan considerarse al decidir y prestar atención clínica.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: allergy_intolerances`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `AllergyIntolerances` — `src/modules/clinical/entities/allergy_intolerances.entity.ts`
- **Resumen:** 16 columnas · 15 índices · 12 FK salientes · 2 entrantes · 5 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/allergy_intolerances.entity.ts:12`)_ | coincide |
| 2 | `custodian_tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 3 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 4 | `substance_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 6 | `category_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 7 | `criticality_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 8 | `clinical_status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 9 | `verification_status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `recorded_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 11 | `encounter_id` | `uuid` | Clave foránea → clinical.encounters.id; Opcional | + v4.2.46 (P26 / CL-01): el encuentro en el que se detectó la alergia. Nullable: hay alergias declaradas fuera de una atención, igual que en `conditions`. La entidad de la API ya declaraba la columna («pedido a M1») pero ni el modelo ni la base la tenían, de modo que cualquier lectura de alergias fallaba con «column does not exist». _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_08_clinical.puml:252`)_ | coincide |
| 12 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/allergy_intolerances.entity.ts:95`)_ | coincide |
| 13 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/allergy_intolerances.entity.ts:101`)_ | coincide |
| 14 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 15 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 16 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/allergy_intolerances.entity.ts:119`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | encounter_id | clinical.encounters (id) | fk_allergy_intolerances_encounter_id |
| hacia | custodian_tenant_id | directory.tenants (id) | fk_allergy_intolerances_custodian_tenant_id |
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_allergy_intolerances_patient_profile_id |
| hacia | substance_concept_id | terminology.catalog_concepts (id) | fk_allergy_intolerances_substance_concept_id |
| hacia | type_concept_id | terminology.catalog_concepts (id) | fk_allergy_intolerances_type_concept_id |
| hacia | category_concept_id | terminology.catalog_concepts (id) | fk_allergy_intolerances_category_concept_id |
| hacia | criticality_concept_id | terminology.catalog_concepts (id) | fk_allergy_intolerances_criticality_concept_id |
| hacia | clinical_status_concept_id | terminology.catalog_concepts (id) | fk_allergy_intolerances_clinical_status_concept_id |
| hacia | verification_status_concept_id | terminology.catalog_concepts (id) | fk_allergy_intolerances_verification_status_concept_id |
| hacia | recorded_by_user_id | iam.users (id) | fk_allergy_intolerances_recorded_by_user_id |
| hacia | created_by_user_id | iam.users (id) | fk_allergy_intolerances_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_allergy_intolerances_updated_by_user_id |
| desde | id | clinical.allergy_reactions (allergy_id) | fk_allergy_reactions_allergy_id |
| desde | id | audit.allergy_intolerances_history (allergy_intolerance_id) | fk_allergy_intolerances_history_allergy_intolerance_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_allergy_intolerances_custodian_tenant_id` | no | custodian_tenant_id | Soporta la clave foránea fk_allergy_intolerances_custodian_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «custodian_tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_allergy_intolerances_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_allergy_intolerances_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 2 consulta(s) de repositorio filtran u ordenan por «patient_profile_id», la primera columna del índice _(CONSULTA)_ |
| `ix_allergy_intolerances_substance_concept_id` | no | substance_concept_id | Soporta la clave foránea fk_allergy_intolerances_substance_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «substance_concept_id», la primera columna del índice _(CONSULTA)_ |
| `ix_allergy_intolerances_type_concept_id` | no | type_concept_id | Soporta la clave foránea fk_allergy_intolerances_type_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_allergy_intolerances_category_concept_id` | no | category_concept_id | Soporta la clave foránea fk_allergy_intolerances_category_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_allergy_intolerances_criticality_concept_id` | no | criticality_concept_id | Soporta la clave foránea fk_allergy_intolerances_criticality_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_allergy_intolerances_clinical_status_concept_id` | no | clinical_status_concept_id | Soporta la clave foránea fk_allergy_intolerances_clinical_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «clinical_status_concept_id», la primera columna del índice _(CONSULTA)_ |
| `ix_allergy_intolerances_verification_status_concept_id` | no | verification_status_concept_id | Soporta la clave foránea fk_allergy_intolerances_verification_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_allergy_intolerances_recorded_by_user_id` | no | recorded_by_user_id | Soporta la clave foránea fk_allergy_intolerances_recorded_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_allergy_intolerances_encounter_id` | no | encounter_id | Soporta la clave foránea fk_allergy_intolerances_encounter_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_allergy_intolerances_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_allergy_intolerances_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_allergy_intolerances_updated_by_user_id` | no | updated_by_user_id | Soporta la clave foránea fk_allergy_intolerances_updated_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_allergy_intolerances_custodian_tenant_id_updated_at` | no | custodian_tenant_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_allergy_intolerances_patient_profile_id_updated_at` | no | custodian_tenant_id, patient_profile_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_allergies_patient_status` | no | custodian_tenant_id, patient_profile_id, clinical_status_concept_id | Soporta la clave foránea fk_allergy_intolerances_custodian_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «custodian_tenant_id», la primera columna del índice _(CONSULTA)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /clinical/allergy-intolerances | CREA | DIRECTA |
| POST /clinical/allergy-intolerances | LEE | DIRECTA |
| GET /clinical/allergy-intolerances/{id}/attachments | LEE | DIRECTA |
| POST /clinical/allergy-intolerances/{id}/attachments | LEE | DIRECTA |
| GET /clinical/patients/{patientProfileId}/summary | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### allergy_reactions

#### Vista general

Documenta las manifestaciones asociadas a una alergia o intolerancia para caracterizar el antecedente y orientar su evaluación clínica.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: allergy_reactions`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `AllergyReactions` — `src/modules/clinical/entities/allergy_reactions.entity.ts`
- **Resumen:** 10 columnas · 5 índices · 5 FK salientes · 0 entrantes · 2 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/allergy_reactions.entity.ts:12`)_ | coincide |
| 2 | `allergy_id` | `uuid` | Clave foránea → clinical.allergy_intolerances.id; Obligatoria | _sin dato_ | coincide |
| 3 | `manifestation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 4 | `severity_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 5 | `description` | `text` | Opcional | _sin dato_ | coincide |
| 6 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/allergy_reactions.entity.ts:42`)_ | coincide |
| 7 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/allergy_reactions.entity.ts:48`)_ | coincide |
| 8 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 9 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 10 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/allergy_reactions.entity.ts:66`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | allergy_id | clinical.allergy_intolerances (id) | fk_allergy_reactions_allergy_id |
| hacia | manifestation_concept_id | terminology.catalog_concepts (id) | fk_allergy_reactions_manifestation_concept_id |
| hacia | severity_concept_id | terminology.catalog_concepts (id) | fk_allergy_reactions_severity_concept_id |
| hacia | created_by_user_id | iam.users (id) | fk_allergy_reactions_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_allergy_reactions_updated_by_user_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_allergy_reactions_allergy_id` | no | allergy_id | Soporta la clave foránea fk_allergy_reactions_allergy_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «allergy_id», la primera columna del índice _(CONSULTA)_ |
| `ix_allergy_reactions_manifestation_concept_id` | no | manifestation_concept_id | Soporta la clave foránea fk_allergy_reactions_manifestation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_allergy_reactions_severity_concept_id` | no | severity_concept_id | Soporta la clave foránea fk_allergy_reactions_severity_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_allergy_reactions_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_allergy_reactions_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_allergy_reactions_updated_by_user_id` | no | updated_by_user_id | Soporta la clave foránea fk_allergy_reactions_updated_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /clinical/allergy-intolerances | CREA | DIRECTA |
| GET /clinical/patients/{patientProfileId}/summary | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### appointments

#### Vista general

Representa citas asistenciales en el contexto clínico y permite relacionarlas con el encuentro realizado o planificado.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: appointments`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `Appointments` — `src/modules/clinical/entities/appointments.entity.ts`
- **Resumen:** 17 columnas · 14 índices · 10 FK salientes · 4 entrantes · 21 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/appointments.entity.ts:12`)_ | coincide |
| 2 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 3 | `practitioner_profile_id` | `uuid` | Clave foránea → profiles.health_practitioner_profiles.profile_id; Opcional | _sin dato_ | coincide |
| 4 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 5 | `branch_id` | `uuid` | Clave foránea → directory.branches.id; Opcional | _sin dato_ | coincide |
| 6 | `type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 7 | `status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 8 | `channel_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 9 | `start_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 10 | `end_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 11 | `reason_text` | `text` | Opcional | _sin dato_ | coincide |
| 12 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/appointments.entity.ts:82`)_ | coincide |
| 13 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/appointments.entity.ts:88`)_ | coincide |
| 14 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 15 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 16 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/appointments.entity.ts:106`)_ | coincide |
| 17 | `care_space_id` | `uuid` | Clave foránea → practice.care_spaces.id; Opcional | + infraestructura hospitalaria F5d: consultorio (o sala) que ocupa la cita. Lo escribe la API desde la plantilla del cupo o el recurso ROOM; NULL para espacios con perfil allowOverlap (salas de espera, gimnasio). ex_appointments_care_space_time (módulo 33) impide que dos citas vivas ocupen el mismo espacio a la vez. Sin backfill. _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_08_clinical.puml:658`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_appointments_patient_profile_id |
| hacia | practitioner_profile_id | profiles.health_practitioner_profiles (profile_id) | fk_appointments_practitioner_profile_id |
| hacia | tenant_id | directory.tenants (id) | fk_appointments_tenant_id |
| hacia | branch_id | directory.branches (id) | fk_appointments_branch_id |
| hacia | type_concept_id | terminology.catalog_concepts (id) | fk_appointments_type_concept_id |
| hacia | status_concept_id | terminology.catalog_concepts (id) | fk_appointments_status_concept_id |
| hacia | channel_concept_id | terminology.catalog_concepts (id) | fk_appointments_channel_concept_id |
| hacia | created_by_user_id | iam.users (id) | fk_appointments_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_appointments_updated_by_user_id |
| hacia | care_space_id | practice.care_spaces (id) | fk_appointments_care_space_id |
| desde | id | clinical.encounters (appointment_id) | fk_encounters_appointment_id |
| desde | id | scheduling.availability_slots (appointment_id) | fk_availability_slots_appointment_id |
| desde | id | scheduling.appointment_bookings (appointment_id) | fk_appointment_bookings_appointment_id |
| desde | id | procedures_perioperative.postoperative_followups (appointment_id) | fk_postoperative_followups_appointment_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_appointments_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_appointments_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_appointments_practitioner_profile_id` | no | practitioner_profile_id | Soporta la clave foránea fk_appointments_practitioner_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 2 consulta(s) de repositorio filtran u ordenan por «practitioner_profile_id», la primera columna del índice _(CONSULTA)_ |
| `ix_appointments_tenant_id` | no | tenant_id | Soporta la clave foránea fk_appointments_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_appointments_branch_id` | no | branch_id | Soporta la clave foránea fk_appointments_branch_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_appointments_type_concept_id` | no | type_concept_id | Soporta la clave foránea fk_appointments_type_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_appointments_status_concept_id` | no | status_concept_id | Soporta la clave foránea fk_appointments_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_appointments_channel_concept_id` | no | channel_concept_id | Soporta la clave foránea fk_appointments_channel_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_appointments_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_appointments_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_appointments_updated_by_user_id` | no | updated_by_user_id | Soporta la clave foránea fk_appointments_updated_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_appointments_tenant_id_status_concept_id` | no | tenant_id, status_concept_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_appointments_patient_profile_id_updated_at` | no | tenant_id, patient_profile_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_appointments_patient_start` | no | patient_profile_id, ("start_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_appointments_care_space_id` | no | care_space_id | Soporta la clave foránea fk_appointments_care_space_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `gist_appointments_effective_period` | no | (tstzrange(start_at, end_at, '[)')) | GiST para periodos, no solapamiento y geografía _(DOCUMENTO)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `ex_appointments_practitioner_time` | EXCLUDE | EXCLUDE USING gist ("practitioner_profile_id" WITH =, tstzrange("start_at", "end_at", '[)') WITH &&) WHERE ("practitioner_profile_id" IS NOT NULL AND "end_at" IS NOT NULL AND "status_concept_id" IN ('51530fd7-05b1-5c29-80c4-da740ede4d27', '37dded87-7a7a-5a24-86f6-0ef48cccb482')) |
| `ex_appointments_care_space_time` | EXCLUDE | EXCLUDE USING gist ("care_space_id" WITH =, tstzrange("start_at", "end_at", '[)') WITH &&) WHERE ("care_space_id" IS NOT NULL AND "end_at" IS NOT NULL AND "status_concept_id" IN ('51530fd7-05b1-5c29-80c4-da740ede4d27', '37dded87-7a7a-5a24-86f6-0ef48cccb482')) |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /accounting/practitioner/consultation-income | LEE | DIRECTA |
| GET /accounting/practitioner/paid-consultations | LEE | DIRECTA |
| GET /accounting/practitioner/simple/summary | LEE | DIRECTA |
| POST /clinical/encounters/check-in | LEE | DIRECTA |
| GET /insurance/analytics/loss-ratio | LEE | POR_SQL |
| POST /care-spaces/{id}/availability | LEE | POR_SQL |
| POST /quotations | LEE | DIRECTA |
| POST /scheduling/appointments/direct | CREA | DIRECTA |
| POST /scheduling/appointments/walk-in | CREA | DIRECTA |
| POST /scheduling/appointments/walk-in | ACTUALIZA | POR_TIPO |
| POST /scheduling/appointments/walk-in | LEE | DIRECTA |
| GET /scheduling/bookings | LEE | DIRECTA |
| GET /scheduling/bookings/{id} | LEE | DIRECTA |
| POST /scheduling/bookings/{id}/accept | ACTUALIZA | POR_TIPO |
| POST /scheduling/bookings/{id}/accept | LEE | DIRECTA |
| POST /scheduling/bookings/{id}/complete | ACTUALIZA | POR_TIPO |
| POST /scheduling/bookings/{id}/complete | LEE | DIRECTA |
| POST /scheduling/bookings/{id}/start | ACTUALIZA | POR_TIPO |
| POST /scheduling/bookings/{id}/start | LEE | DIRECTA |
| POST /scheduling/holds/{holdToken}/confirm | CREA | DIRECTA |
| POST /scheduling/holds/{holdToken}/request | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### care_episodes

#### Vista general

Agrupa encuentros relacionados dentro de un proceso asistencial del paciente para seguir su evolución y responsabilidad clínica.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: care_episodes`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `CareEpisodes` — `src/modules/clinical/entities/care_episodes.entity.ts`
- **Resumen:** 13 columnas · 9 índices · 7 FK salientes · 2 entrantes · 8 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/care_episodes.entity.ts:12`)_ | coincide |
| 2 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 3 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 4 | `responsible_practitioner_id` | `uuid` | Clave foránea → profiles.health_practitioner_profiles.profile_id; Opcional | _sin dato_ | coincide |
| 5 | `type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 6 | `status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 7 | `start_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 8 | `end_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 9 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/care_episodes.entity.ts:68`)_ | coincide |
| 10 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/care_episodes.entity.ts:74`)_ | coincide |
| 11 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 12 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 13 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/care_episodes.entity.ts:92`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_care_episodes_patient_profile_id |
| hacia | tenant_id | directory.tenants (id) | fk_care_episodes_tenant_id |
| hacia | responsible_practitioner_id | profiles.health_practitioner_profiles (profile_id) | fk_care_episodes_responsible_practitioner_id |
| hacia | type_concept_id | terminology.catalog_concepts (id) | fk_care_episodes_type_concept_id |
| hacia | status_concept_id | terminology.catalog_concepts (id) | fk_care_episodes_status_concept_id |
| hacia | created_by_user_id | iam.users (id) | fk_care_episodes_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_care_episodes_updated_by_user_id |
| desde | id | clinical.encounters (episode_id) | fk_encounters_episode_id |
| desde | id | clinical_ext.care_teams (episode_id) | fk_care_teams_episode_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_care_episodes_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_care_episodes_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 2 consulta(s) de repositorio filtran u ordenan por «patient_profile_id», la primera columna del índice _(CONSULTA)_ |
| `ix_care_episodes_tenant_id` | no | tenant_id | Soporta la clave foránea fk_care_episodes_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_care_episodes_responsible_practitioner_id` | no | responsible_practitioner_id | Soporta la clave foránea fk_care_episodes_responsible_practitioner_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_care_episodes_type_concept_id` | no | type_concept_id | Soporta la clave foránea fk_care_episodes_type_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_care_episodes_status_concept_id` | no | status_concept_id | Soporta la clave foránea fk_care_episodes_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «status_concept_id», la primera columna del índice _(CONSULTA)_ |
| `ix_care_episodes_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_care_episodes_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_care_episodes_updated_by_user_id` | no | updated_by_user_id | Soporta la clave foránea fk_care_episodes_updated_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_care_episodes_tenant_id_status_concept_id` | no | tenant_id, status_concept_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_care_episodes_patient_profile_id_updated_at` | no | tenant_id, patient_profile_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /clinical/admissions | CREA | DIRECTA |
| POST /clinical/admissions | LEE | DIRECTA |
| POST /clinical/care-episodes | CREA | DIRECTA |
| POST /clinical/care-episodes | LEE | DIRECTA |
| POST /clinical/encounters/{id}/discharge | ACTUALIZA | POR_TIPO |
| POST /clinical/encounters/{id}/discharge | LEE | DIRECTA |
| POST /clinical/encounters/check-in | LEE | DIRECTA |
| GET /clinical/patients/{patientProfileId}/summary | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### conditions

#### Vista general

Registra problemas, diagnósticos y condiciones de salud del paciente con estado, severidad, curso y fechas clínicas relevantes.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: conditions`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `Conditions` — `src/modules/clinical/entities/conditions.entity.ts`
- **Resumen:** 21 columnas · 16 índices · 13 FK salientes · 6 entrantes · 22 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/conditions.entity.ts:12`)_ | coincide |
| 2 | `custodian_tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 3 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 4 | `encounter_id` | `uuid` | Clave foránea → clinical.encounters.id; Opcional | _sin dato_ | coincide |
| 5 | `code_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 6 | `category_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 7 | `clinical_status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 8 | `verification_status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 9 | `severity_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `laterality_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 11 | `clinical_course_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 12 | `onset_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 13 | `expected_resolution_at` | `timestamptz` | Opcional | + v4.1.3: segunda columna del PR #171 que vivía solo en el ORM (B-9 la promovió a medias: v4.1.2 cubrió el curso clínico y esta quedó afuera). Nullable: una condición crónica no tiene resolución esperada. _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_08_clinical.puml:224`)_ | coincide |
| 14 | `resolved_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 15 | `recorded_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 16 | `note_text` | `text` | Opcional | + v4.1.3: hallazgos y justificación clínica del diagnóstico. Narrativa libre de quien registra; mismo molde que procedures/observation_notes. _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_08_clinical.puml:230`)_ | coincide |
| 17 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/conditions.entity.ts:144`)_ | coincide |
| 18 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/conditions.entity.ts:150`)_ | coincide |
| 19 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 20 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 21 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/conditions.entity.ts:168`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | encounter_id | clinical.encounters (id) | fk_conditions_encounter_id |
| hacia | custodian_tenant_id | directory.tenants (id) | fk_conditions_custodian_tenant_id |
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_conditions_patient_profile_id |
| hacia | code_concept_id | terminology.catalog_concepts (id) | fk_conditions_code_concept_id |
| hacia | category_concept_id | terminology.catalog_concepts (id) | fk_conditions_category_concept_id |
| hacia | clinical_status_concept_id | terminology.catalog_concepts (id) | fk_conditions_clinical_status_concept_id |
| hacia | verification_status_concept_id | terminology.catalog_concepts (id) | fk_conditions_verification_status_concept_id |
| hacia | severity_concept_id | terminology.catalog_concepts (id) | fk_conditions_severity_concept_id |
| hacia | laterality_concept_id | terminology.catalog_concepts (id) | fk_conditions_laterality_concept_id |
| hacia | clinical_course_concept_id | terminology.catalog_concepts (id) | fk_conditions_clinical_course_concept_id |
| hacia | recorded_by_user_id | iam.users (id) | fk_conditions_recorded_by_user_id |
| hacia | created_by_user_id | iam.users (id) | fk_conditions_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_conditions_updated_by_user_id |
| desde | id | clinical.medication_requests (indication_condition_id) | fk_medication_requests_indication_condition_id |
| desde | id | audit.conditions_history (condition_id) | fk_conditions_history_condition_id |
| desde | id | chart.care_plans (condition_id) | fk_care_plans_condition_id |
| desde | id | procedures_perioperative.procedure_case_diagnoses (condition_id) | fk_procedure_case_diagnoses_condition_id |
| desde | id | procedures_perioperative.procedure_complications (condition_id) | fk_procedure_complications_condition_id |
| desde | id | medical_groups.groups (condition_id) | fk_groups_condition_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_conditions_custodian_tenant_id` | no | custodian_tenant_id | Soporta la clave foránea fk_conditions_custodian_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «custodian_tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_conditions_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_conditions_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 2 consulta(s) de repositorio filtran u ordenan por «patient_profile_id», la primera columna del índice _(CONSULTA)_ |
| `ix_conditions_encounter_id` | no | encounter_id | Soporta la clave foránea fk_conditions_encounter_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «encounter_id», la primera columna del índice _(CONSULTA)_ |
| `ix_conditions_code_concept_id` | no | code_concept_id | Soporta la clave foránea fk_conditions_code_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «code_concept_id», la primera columna del índice _(CONSULTA)_ |
| `ix_conditions_category_concept_id` | no | category_concept_id | Soporta la clave foránea fk_conditions_category_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_conditions_clinical_status_concept_id` | no | clinical_status_concept_id | Soporta la clave foránea fk_conditions_clinical_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «clinical_status_concept_id», la primera columna del índice _(CONSULTA)_ |
| `ix_conditions_verification_status_concept_id` | no | verification_status_concept_id | Soporta la clave foránea fk_conditions_verification_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_conditions_severity_concept_id` | no | severity_concept_id | Soporta la clave foránea fk_conditions_severity_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_conditions_laterality_concept_id` | no | laterality_concept_id | Soporta la clave foránea fk_conditions_laterality_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_conditions_clinical_course_concept_id` | no | clinical_course_concept_id | Soporta la clave foránea fk_conditions_clinical_course_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_conditions_recorded_by_user_id` | no | recorded_by_user_id | Soporta la clave foránea fk_conditions_recorded_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_conditions_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_conditions_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_conditions_updated_by_user_id` | no | updated_by_user_id | Soporta la clave foránea fk_conditions_updated_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_conditions_custodian_tenant_id_updated_at` | no | custodian_tenant_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_conditions_patient_profile_id_updated_at` | no | custodian_tenant_id, patient_profile_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_conditions_patient_clinical_status` | no | custodian_tenant_id, patient_profile_id, clinical_status_concept_id, ("onset_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /charts/care-plans | LEE | DIRECTA |
| GET /charts/encounters/{id}/pdf | LEE | DIRECTA |
| GET /charts/me/encounters/{id}/pdf | LEE | DIRECTA |
| POST /clinical/conditions | CREA | DIRECTA |
| POST /clinical/conditions | LEE | DIRECTA |
| POST /clinical/conditions/{id}/attachments | LEE | DIRECTA |
| POST /clinical/conditions/{id}/change-status | ACTUALIZA | POR_TIPO |
| POST /clinical/conditions/{id}/change-status | LEE | DIRECTA |
| POST /clinical/conditions/{id}/verification | ACTUALIZA | POR_TIPO |
| POST /clinical/conditions/{id}/verification | LEE | DIRECTA |
| POST /clinical/encounters/{id}/close | LEE | DIRECTA |
| POST /clinical/encounters/{id}/discharge | LEE | DIRECTA |
| POST /clinical/medication-requests | LEE | DIRECTA |
| POST /clinical/medication-requests/{id}/edit | LEE | DIRECTA |
| GET /clinical/patients/{patientProfileId}/summary | LEE | DIRECTA |
| GET /clinical/prescriptions/{id}/pdf | LEE | DIRECTA |
| GET /insurance/analytics/loss-ratio | LEE | POR_SQL |
| POST /insurance/portability/export | LEE | POR_SQL |
| POST /medical-groups | LEE | DIRECTA |
| GET /medical-groups/patients/{patientProfileId}/conditions | LEE | DIRECTA |
| POST /procedure-cases/{id}/diagnoses | CREA | DIRECTA |
| POST /procedure-cases/{id}/diagnoses | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### diagnostic_reports

#### Vista general

Gestiona el ciclo de vida del informe diagnóstico y lo vincula con su solicitud y encuentro; los resultados estructurados y archivos asociados se mantienen en el dominio de diagnóstico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: diagnostic_reports; REC_DIAGNOSTICS_CLIN`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `DiagnosticReports` — `src/modules/clinical/entities/diagnostic_reports.entity.ts`
- **Resumen:** 16 columnas · 14 índices · 12 FK salientes · 8 entrantes · 21 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/diagnostic_reports.entity.ts:12`)_ | coincide |
| 2 | `custodian_tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 3 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 4 | `service_request_id` | `uuid` | Clave foránea → clinical.service_requests.id; Opcional | _sin dato_ | coincide |
| 5 | `encounter_id` | `uuid` | Clave foránea → clinical.encounters.id; Opcional | _sin dato_ | coincide |
| 6 | `code_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 7 | `category_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 8 | `lifecycle_status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 9 | `current_version_id` | `uuid` | Clave foránea → diagnostics.diagnostic_report_versions.id; Opcional | _sin dato_ | coincide |
| 10 | `current_released_version_id` | `uuid` | Clave foránea → diagnostics.diagnostic_report_versions.id; Opcional | _sin dato_ | coincide |
| 11 | `result_release_status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 12 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/diagnostic_reports.entity.ts:86`)_ | coincide |
| 13 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/diagnostic_reports.entity.ts:92`)_ | coincide |
| 14 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 15 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 16 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/diagnostic_reports.entity.ts:110`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | service_request_id | clinical.service_requests (id) | fk_diagnostic_reports_service_request_id |
| hacia | encounter_id | clinical.encounters (id) | fk_diagnostic_reports_encounter_id |
| hacia | custodian_tenant_id | directory.tenants (id) | fk_diagnostic_reports_custodian_tenant_id |
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_diagnostic_reports_patient_profile_id |
| hacia | code_concept_id | terminology.catalog_concepts (id) | fk_diagnostic_reports_code_concept_id |
| hacia | category_concept_id | terminology.catalog_concepts (id) | fk_diagnostic_reports_category_concept_id |
| hacia | lifecycle_status_concept_id | terminology.catalog_concepts (id) | fk_diagnostic_reports_lifecycle_status_concept_id |
| hacia | current_version_id | diagnostics.diagnostic_report_versions (id) | fk_diagnostic_reports_current_version_id |
| hacia | current_released_version_id | diagnostics.diagnostic_report_versions (id) | fk_diagnostic_reports_current_released_version_id |
| hacia | result_release_status_concept_id | terminology.catalog_concepts (id) | fk_diagnostic_reports_result_release_status_concept_id |
| hacia | created_by_user_id | iam.users (id) | fk_diagnostic_reports_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_diagnostic_reports_updated_by_user_id |
| desde | id | clinical.service_requests (previous_diagnostic_report_id) | fk_service_requests_previous_diagnostic_report_id |
| desde | id | audit.diagnostic_reports_history (diagnostic_report_id) | fk_diagnostic_reports_history_diagnostic_report_id |
| desde | id | diagnostics.diagnostic_report_versions (diagnostic_report_id) | fk_diagnostic_report_versions_diagnostic_report_id |
| desde | id | diagnostics.imaging_studies (diagnostic_report_id) | fk_imaging_studies_diagnostic_report_id |
| desde | id | diagnostics.clinical_media (diagnostic_report_id) | fk_clinical_media_diagnostic_report_id |
| desde | id | diagnostics.laboratory_work_order_tests (diagnostic_report_id) | fk_laboratory_work_order_tests_diagnostic_report_id |
| desde | id | diagnostics.critical_result_notifications (diagnostic_report_id) | fk_critical_result_notifications_diagnostic_report_id |
| desde | id | diagnostics.dicom_structured_reports (diagnostic_report_id) | fk_dicom_structured_reports_diagnostic_report_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_diagnostic_reports_custodian_tenant_id` | no | custodian_tenant_id | Soporta la clave foránea fk_diagnostic_reports_custodian_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «custodian_tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_diagnostic_reports_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_diagnostic_reports_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 4 consulta(s) de repositorio filtran u ordenan por «patient_profile_id», la primera columna del índice _(CONSULTA)_ |
| `ix_diagnostic_reports_service_request_id` | no | service_request_id | Soporta la clave foránea fk_diagnostic_reports_service_request_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «service_request_id», la primera columna del índice _(CONSULTA)_ |
| `ix_diagnostic_reports_encounter_id` | no | encounter_id | Soporta la clave foránea fk_diagnostic_reports_encounter_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_diagnostic_reports_code_concept_id` | no | code_concept_id | Soporta la clave foránea fk_diagnostic_reports_code_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «code_concept_id», la primera columna del índice _(CONSULTA)_ |
| `ix_diagnostic_reports_category_concept_id` | no | category_concept_id | Soporta la clave foránea fk_diagnostic_reports_category_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_diagnostic_reports_lifecycle_status_concept_id` | no | lifecycle_status_concept_id | Soporta la clave foránea fk_diagnostic_reports_lifecycle_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_diagnostic_reports_current_version_id` | no | current_version_id | Soporta la clave foránea fk_diagnostic_reports_current_version_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_diagnostic_reports_current_released_version_id` | no | current_released_version_id | Soporta la clave foránea fk_diagnostic_reports_current_released_version_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_diagnostic_reports_result_release_status_concept_id` | no | result_release_status_concept_id | Soporta la clave foránea fk_diagnostic_reports_result_release_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_diagnostic_reports_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_diagnostic_reports_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_diagnostic_reports_updated_by_user_id` | no | updated_by_user_id | Soporta la clave foránea fk_diagnostic_reports_updated_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_diagnostic_reports_custodian_tenant_id_lifecycle_st_43c65044` | no | custodian_tenant_id, lifecycle_status_concept_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_diagnostic_reports_patient_profile_id_updated_at` | no | custodian_tenant_id, patient_profile_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /clinical/conditions/{id}/verification | LEE | DIRECTA |
| POST /clinical/diagnostic-reports | CREA | DIRECTA |
| POST /clinical/diagnostic-reports/{id}/release | LEE | DIRECTA |
| POST /clinical/requisitions | LEE | DIRECTA |
| POST /clinical/service-requests | LEE | DIRECTA |
| POST /clinical/service-requests/duplicate-check | LEE | DIRECTA |
| GET /diagnostic-results/me | LEE | DIRECTA |
| GET /diagnostic-results/me/{reportId} | LEE | DIRECTA |
| GET /diagnostic-results/me/{reportId}/files/{fileId}/content | LEE | DIRECTA |
| GET /diagnostic-results/me/{reportId}/shares | LEE | DIRECTA |
| POST /diagnostic-results/me/{reportId}/shares | LEE | DIRECTA |
| POST /diagnostic-results/me/{reportId}/shares/{shareId}/revoke | LEE | DIRECTA |
| GET /diagnostic-results/me/orders | LEE | DIRECTA |
| POST /diagnostics/clinical-media | LEE | DIRECTA |
| POST /diagnostics/critical-results | LEE | DIRECTA |
| GET /diagnostics/patients/{patientProfileId}/orders | LEE | DIRECTA |
| POST /diagnostics/reports/{reportId}/versions | LEE | DIRECTA |
| POST /diagnostics/reports/{reportId}/versions/{versionId}/release | ACTUALIZA | POR_TIPO |
| POST /diagnostics/reports/{reportId}/versions/{versionId}/release | LEE | DIRECTA |
| GET /insurance-claims/{id} | LEE | DIRECTA |
| POST /procedure-cases/{id}/preoperative-orders | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### encounter_locations

#### Vista general

Vincula un encuentro con los lugares de prestación para mantener el contexto físico de la atención.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: encounter_locations`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `EncounterLocations` — `src/modules/clinical/entities/encounter_locations.entity.ts`
- **Resumen:** 20 columnas · 15 índices · 13 FK salientes · 3 entrantes · 48 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/encounter_locations.entity.ts:12`)_ | coincide |
| 2 | `encounter_id` | `uuid` | Clave foránea → clinical.encounters.id; Obligatoria | _sin dato_ | coincide |
| 3 | `practice_site_id` | `uuid` | Clave foránea → practice.practice_sites.id; Obligatoria | _sin dato_ | coincide |
| 4 | `clinical_unit_id` | `uuid` | Clave foránea → practice.clinical_units.id; Opcional | _sin dato_ | coincide |
| 5 | `care_space_id` | `uuid` | Clave foránea → practice.care_spaces.id; Opcional | _sin dato_ | coincide |
| 6 | `location_status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 7 | `period_start` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 8 | `period_end` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 9 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/encounter_locations.entity.ts:68`)_ | coincide |
| 10 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/encounter_locations.entity.ts:74`)_ | coincide |
| 11 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 12 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 13 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/encounter_locations.entity.ts:92`)_ | coincide |
| 14 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | + infraestructura hospitalaria F3 (ADT): esta tabla ES el historial de estancias (FHIR Encounter.location). `tenant_id` se copia del encuentro para el RLS. `is_bed_assignment` la pone la API cuando el espacio es forma BED: sólo esas filas entran en los EXCLUDE de ocupación de cama (módulo 33). Movimiento (ADT_ADMIT ¦ TRANSFER ¦ SWAP ¦ RESERVE), ubicación previa (PV1-6), motivo de cierre (ADT_END_*), foto de la categoría de cama al ocupar y el incidente si se forzó compatibilidad. Estados: LOCATION_ACTIVE ¦ COMPLETED (existen) ¦ RESERVED ¦ CANCELLED (nuevos). Como en F1b, encuentro, sede, unidad, espacio, ubicación previa e incidente se referencian además con FK compuesta (tenant_id, x_id) al padre del MISMO tenant (patch 2026-10-29_infraestructura_f3_clinical.sql); por eso los UNIQUE (tenant_id, id). _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_08_clinical.puml:698`)_ | coincide |
| 15 | `is_bed_assignment` | `boolean = false` | Obligatoria | _sin dato_ | coincide |
| 16 | `movement_type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 17 | `previous_encounter_location_id` | `uuid` | Clave foránea → clinical.encounter_locations.id; Opcional | _sin dato_ | coincide |
| 18 | `end_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 19 | `bed_category_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 20 | `placement_incident_id` | `uuid` | Clave foránea → clinical.placement_incidents.id; Opcional | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | encounter_id | clinical.encounters (id) | fk_encounter_locations_encounter_id |
| hacia | previous_encounter_location_id | clinical.encounter_locations (id) | fk_encounter_locations_previous_encounter_location_id |
| hacia | placement_incident_id | clinical.placement_incidents (id) | fk_encounter_locations_placement_incident_id |
| hacia | practice_site_id | practice.practice_sites (id) | fk_encounter_locations_practice_site_id |
| hacia | clinical_unit_id | practice.clinical_units (id) | fk_encounter_locations_clinical_unit_id |
| hacia | care_space_id | practice.care_spaces (id) | fk_encounter_locations_care_space_id |
| hacia | location_status_concept_id | terminology.catalog_concepts (id) | fk_encounter_locations_location_status_concept_id |
| hacia | created_by_user_id | iam.users (id) | fk_encounter_locations_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_encounter_locations_updated_by_user_id |
| hacia | tenant_id | directory.tenants (id) | fk_encounter_locations_tenant_id |
| hacia | movement_type_concept_id | terminology.catalog_concepts (id) | fk_encounter_locations_movement_type_concept_id |
| hacia | end_reason_concept_id | terminology.catalog_concepts (id) | fk_encounter_locations_end_reason_concept_id |
| hacia | bed_category_concept_id | terminology.catalog_concepts (id) | fk_encounter_locations_bed_category_concept_id |
| desde | id | clinical.encounter_locations (previous_encounter_location_id) | fk_encounter_locations_previous_encounter_location_id |
| desde | id | clinical.placement_incidents (encounter_location_id) | fk_placement_incidents_encounter_location_id |
| desde | id | audit.encounter_locations_history (encounter_location_id) | fk_encounter_locations_history_encounter_location_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_encounter_locations_encounter_id` | no | encounter_id | Soporta la clave foránea fk_encounter_locations_encounter_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 5 consulta(s) de repositorio filtran u ordenan por «encounter_id», la primera columna del índice _(CONSULTA)_ |
| `ix_encounter_locations_practice_site_id` | no | practice_site_id | Soporta la clave foránea fk_encounter_locations_practice_site_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «practice_site_id», la primera columna del índice _(CONSULTA)_ |
| `ix_encounter_locations_clinical_unit_id` | no | clinical_unit_id | Soporta la clave foránea fk_encounter_locations_clinical_unit_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounter_locations_care_space_id` | no | care_space_id | Soporta la clave foránea fk_encounter_locations_care_space_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «care_space_id», la primera columna del índice _(CONSULTA)_ |
| `ix_encounter_locations_location_status_concept_id` | no | location_status_concept_id | Soporta la clave foránea fk_encounter_locations_location_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 5 consulta(s) de repositorio filtran u ordenan por «location_status_concept_id», la primera columna del índice _(CONSULTA)_ |
| `ix_encounter_locations_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_encounter_locations_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounter_locations_updated_by_user_id` | no | updated_by_user_id | Soporta la clave foránea fk_encounter_locations_updated_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounter_locations_tenant_id` | no | tenant_id | Soporta la clave foránea fk_encounter_locations_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounter_locations_movement_type_concept_id` | no | movement_type_concept_id | Soporta la clave foránea fk_encounter_locations_movement_type_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounter_locations_previous_encounter_location_id` | no | previous_encounter_location_id | Soporta la clave foránea fk_encounter_locations_previous_encounter_location_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounter_locations_end_reason_concept_id` | no | end_reason_concept_id | Soporta la clave foránea fk_encounter_locations_end_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounter_locations_bed_category_concept_id` | no | bed_category_concept_id | Soporta la clave foránea fk_encounter_locations_bed_category_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounter_locations_placement_incident_id` | no | placement_incident_id | Soporta la clave foránea fk_encounter_locations_placement_incident_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounter_locations_bed_period` | no | care_space_id, ("period_start" DESC) donde WHERE is_bed_assignment | Índice parcial: sólo indexa las filas donde WHERE is_bed_assignment _(ESTRUCTURAL)_ |
| `ux_encounter_locations_tenant_id_id` | sí | tenant_id, id | Garantiza que no se repita la combinación (tenant_id, id) _(DOCUMENTO)_; Soporta la clave foránea fk_encounter_locations_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `ux_encounter_locations_tenant_id_id` | UNIQUE INDEX | UNIQUE INDEX ("tenant_id", "id") |
| `ck_encounter_locations_bed_period` | CHECK | CHECK ((NOT "is_bed_assignment" OR ("period_start" IS NOT NULL AND "care_space_id" IS NOT NULL))) |
| `ex_encounter_locations_bed_occupancy` | EXCLUDE | EXCLUDE USING gist ("care_space_id" WITH =, tstzrange("period_start", "period_end", '[)') WITH &&) WHERE ("is_bed_assignment" AND "location_status_concept_id" IN ('809db700-0627-5fe3-8278-4f038f4475b3', 'cdd86257-4297-5941-8ae8-b95e11439a48', '8cf00069-81ca-56e1-8e71-9e16333a1f6c')) DEFERRABLE INITIALLY IMMEDIATE |
| `ex_encounter_locations_encounter_single_bed` | EXCLUDE | EXCLUDE USING gist ("encounter_id" WITH =, tstzrange("period_start", "period_end", '[)') WITH &&) WHERE ("is_bed_assignment" AND "location_status_concept_id" IN ('809db700-0627-5fe3-8278-4f038f4475b3', '8cf00069-81ca-56e1-8e71-9e16333a1f6c')) DEFERRABLE INITIALLY IMMEDIATE |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| GET /billing/bed-day/stays | LEE | POR_SQL |
| POST /billing/encounters/{encounterId}/bed-day-charges/run | LEE | POR_SQL |
| GET /billing/encounters/{encounterId}/pending-charges | LEE | POR_SQL |
| POST /internal/billing/bed-day-charges/run | LEE | POR_SQL |
| POST /clinical/admissions | CREA | DIRECTA |
| POST /clinical/admissions | ACTUALIZA | POR_TIPO |
| POST /clinical/admissions | LEE | POR_SQL |
| POST /clinical/bed-compatibility | LEE | POR_SQL |
| POST /clinical/bed-swaps | ACTUALIZA | POR_TIPO |
| POST /clinical/bed-swaps | CREA | DIRECTA |
| POST /clinical/bed-swaps | LEE | DIRECTA |
| POST /clinical/encounter-locations/{id}/cancel | ACTUALIZA | POR_TIPO |
| POST /clinical/encounter-locations/{id}/cancel | LEE | DIRECTA |
| POST /clinical/encounters/{id}/bed-assignment | ACTUALIZA | POR_TIPO |
| POST /clinical/encounters/{id}/bed-assignment | CREA | DIRECTA |
| POST /clinical/encounters/{id}/bed-assignment | LEE | DIRECTA |
| POST /clinical/encounters/{id}/bed-compatibility | LEE | POR_SQL |
| POST /clinical/encounters/{id}/close | ACTUALIZA | POR_TIPO |
| POST /clinical/encounters/{id}/close | LEE | DIRECTA |
| POST /clinical/encounters/{id}/discharge | ACTUALIZA | POR_TIPO |
| POST /clinical/encounters/{id}/discharge | LEE | DIRECTA |
| GET /clinical/encounters/{id}/stay | LEE | DIRECTA |
| POST /clinical/encounters/{id}/transfer | ACTUALIZA | POR_TIPO |
| POST /clinical/encounters/{id}/transfer | CREA | DIRECTA |
| POST /clinical/encounters/{id}/transfer | LEE | DIRECTA |
| POST /clinical/encounters/check-in | CREA | DIRECTA |
| POST /clinical/encounters/check-in | LEE | DIRECTA |
| GET /clinical/patients/{id}/inpatient-stay | LEE | DIRECTA |
| POST /internal/clinical/census-close-tick | LEE | POR_SQL |
| GET /sites/{siteId}/census | LEE | POR_SQL |
| POST /sites/{siteId}/census/{date}/close | LEE | POR_SQL |
| GET /sites/{siteId}/inpatients | LEE | DIRECTA |
| POST /care-space-blocks/{id}/cancel | LEE | POR_SQL |
| POST /care-space-blocks/{id}/end | LEE | POR_SQL |
| POST /care-spaces/{id}/availability | LEE | POR_SQL |
| POST /care-spaces/{id}/hygiene | LEE | POR_SQL |
| POST /care-spaces/{id}/isolation | LEE | POR_SQL |
| POST /care-spaces/{id}/lifecycle | LEE | POR_SQL |
| GET /care-spaces/{id}/operational-state | LEE | POR_SQL |
| GET /care-spaces/{id}/retire-check | LEE | POR_SQL |
| POST /internal/practice/blocks-tick | LEE | POR_SQL |
| GET /sites/{siteId}/bed-board | LEE | POR_SQL |
| POST /sites/{siteId}/cleaning-orders | LEE | POR_SQL |
| GET /sites/{siteId}/sample-collection-points | LEE | POR_SQL |
| POST /procedure-cases | LEE | POR_SQL |
| PATCH /procedure-cases/{id} | LEE | POR_SQL |
| POST /procedure-cases/{id}/room-events | LEE | POR_SQL |
| GET /sites/{siteId}/operating-rooms | LEE | POR_SQL |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### encounter_participants

#### Vista general

Identifica a las personas que participan en un encuentro y su rol para conservar quién intervino en la atención.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: encounter_participants`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `EncounterParticipants` — `src/modules/clinical/entities/encounter_participants.entity.ts`
- **Resumen:** 14 columnas · 7 índices · 7 FK salientes · 0 entrantes · 13 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/encounter_participants.entity.ts:12`)_ | coincide |
| 2 | `encounter_id` | `uuid` | Clave foránea → clinical.encounters.id; Obligatoria | _sin dato_ | coincide |
| 3 | `practitioner_profile_id` | `uuid` | Clave foránea → profiles.health_practitioner_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 4 | `participant_role_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `practitioner_role_assignment_id` | `uuid` | Clave foránea → practice.practitioner_role_assignments.id; Opcional | _sin dato_ | coincide |
| 6 | `period_start` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 7 | `period_end` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 8 | `is_responsible` | `boolean` | Opcional | _sin dato_ | coincide |
| 9 | `status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 10 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/encounter_participants.entity.ts:78`)_ | coincide |
| 11 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/encounter_participants.entity.ts:84`)_ | coincide |
| 12 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 13 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 14 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/encounter_participants.entity.ts:102`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | encounter_id | clinical.encounters (id) | fk_encounter_participants_encounter_id |
| hacia | practitioner_profile_id | profiles.health_practitioner_profiles (profile_id) | fk_encounter_participants_practitioner_profile_id |
| hacia | participant_role_concept_id | terminology.catalog_concepts (id) | fk_encounter_participants_participant_role_concept_id |
| hacia | practitioner_role_assignment_id | practice.practitioner_role_assignments (id) | fk_encounter_participants_practitioner_role_assignment_id |
| hacia | status_concept_id | terminology.catalog_concepts (id) | fk_encounter_participants_status_concept_id |
| hacia | created_by_user_id | iam.users (id) | fk_encounter_participants_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_encounter_participants_updated_by_user_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_encounter_participants_encounter_id` | no | encounter_id | Soporta la clave foránea fk_encounter_participants_encounter_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 4 consulta(s) de repositorio filtran u ordenan por «encounter_id», la primera columna del índice _(CONSULTA)_ |
| `ix_encounter_participants_practitioner_profile_id` | no | practitioner_profile_id | Soporta la clave foránea fk_encounter_participants_practitioner_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 2 consulta(s) de repositorio filtran u ordenan por «practitioner_profile_id», la primera columna del índice _(CONSULTA)_ |
| `ix_encounter_participants_participant_role_concept_id` | no | participant_role_concept_id | Soporta la clave foránea fk_encounter_participants_participant_role_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounter_participants_practitioner_role_assignment_id` | no | practitioner_role_assignment_id | Soporta la clave foránea fk_encounter_participants_practitioner_role_assignment_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounter_participants_status_concept_id` | no | status_concept_id | Soporta la clave foránea fk_encounter_participants_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 2 consulta(s) de repositorio filtran u ordenan por «status_concept_id», la primera columna del índice _(CONSULTA)_ |
| `ix_encounter_participants_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_encounter_participants_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounter_participants_updated_by_user_id` | no | updated_by_user_id | Soporta la clave foránea fk_encounter_participants_updated_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /clinical/encounters/{id}/close | ACTUALIZA | POR_TIPO |
| POST /clinical/encounters/{id}/close | LEE | DIRECTA |
| POST /clinical/encounters/{id}/discharge | ACTUALIZA | POR_TIPO |
| POST /clinical/encounters/{id}/discharge | LEE | DIRECTA |
| POST /clinical/encounters/check-in | CREA | DIRECTA |
| POST /clinical/encounters/check-in | LEE | DIRECTA |
| POST /virtual-encounters | LEE | DIRECTA |
| PATCH /virtual-encounters/{id}/end | LEE | DIRECTA |
| PATCH /virtual-encounters/{id}/join | LEE | DIRECTA |
| POST /community/profiles/{profileId}/reviews | LEE | DIRECTA |
| PUT /community/ratings | LEE | DIRECTA |
| POST /patients/me/reviews | LEE | DIRECTA |
| POST /scheduling/appointments/walk-in | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### encounters

#### Vista general

Representa cada contacto asistencial y vincula paciente, equipo, sede, agenda, motivo y estado de atención.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: encounters`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `Encounters` — `src/modules/clinical/entities/encounters.entity.ts`
- **Resumen:** 26 columnas · 18 índices · 15 FK salientes · 36 entrantes · 113 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/encounters.entity.ts:12`)_ | coincide |
| 2 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 3 | `episode_id` | `uuid` | Clave foránea → clinical.care_episodes.id; Opcional | _sin dato_ | coincide |
| 4 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 5 | `branch_id` | `uuid` | Clave foránea → directory.branches.id; Opcional | _sin dato_ | coincide |
| 6 | `primary_practitioner_id` | `uuid` | Clave foránea → profiles.health_practitioner_profiles.profile_id; Opcional | _sin dato_ | coincide |
| 7 | `class_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 8 | `type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 9 | `status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 10 | `reason_text` | `text` | Opcional | _sin dato_ | coincide |
| 11 | `start_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 12 | `end_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 13 | `appointment_id` | `uuid` | Clave foránea → clinical.appointments.id; Opcional | _sin dato_ | coincide |
| 14 | `content_hash` | `varchar` | Opcional | Sello SHA-256 del contenido del encuentro, calculado al cerrarlo. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/encounters.entity.ts:98`)_ | coincide |
| 15 | `sealed_at` | `timestamptz` | Opcional | Fecha y hora en que se calculó el sello del encuentro. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/encounters.entity.ts:108`)_ | coincide |
| 16 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/encounters.entity.ts:118`)_ | coincide |
| 17 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/encounters.entity.ts:124`)_ | coincide |
| 18 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 19 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 20 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/encounters.entity.ts:142`)_ | coincide |
| 21 | `level_of_care_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | + infraestructura hospitalaria F3 (ADT): la internación es un encuentro de clase ENC_IMP dentro de un care_episode. Nivel de cuidado (LOC_CARE_*), origen del ingreso (ADM_SRC_*), disposición al egreso (DISP_*), precaución de aislamiento del paciente (ISO_* de F2) con su organismo, y fecha estimada de alta. Nulas fuera de internación. _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_08_clinical.puml:123`)_ | coincide |
| 22 | `admission_source_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 23 | `discharge_disposition_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 24 | `isolation_precaution_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 25 | `isolation_organism_text` | `varchar` | Opcional | _sin dato_ | coincide |
| 26 | `expected_discharge_at` | `timestamptz` | Opcional | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | episode_id | clinical.care_episodes (id) | fk_encounters_episode_id |
| hacia | appointment_id | clinical.appointments (id) | fk_encounters_appointment_id |
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_encounters_patient_profile_id |
| hacia | tenant_id | directory.tenants (id) | fk_encounters_tenant_id |
| hacia | branch_id | directory.branches (id) | fk_encounters_branch_id |
| hacia | primary_practitioner_id | profiles.health_practitioner_profiles (profile_id) | fk_encounters_primary_practitioner_id |
| hacia | class_concept_id | terminology.catalog_concepts (id) | fk_encounters_class_concept_id |
| hacia | type_concept_id | terminology.catalog_concepts (id) | fk_encounters_type_concept_id |
| hacia | status_concept_id | terminology.catalog_concepts (id) | fk_encounters_status_concept_id |
| hacia | created_by_user_id | iam.users (id) | fk_encounters_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_encounters_updated_by_user_id |
| hacia | level_of_care_concept_id | terminology.catalog_concepts (id) | fk_encounters_level_of_care_concept_id |
| hacia | admission_source_concept_id | terminology.catalog_concepts (id) | fk_encounters_admission_source_concept_id |
| hacia | discharge_disposition_concept_id | terminology.catalog_concepts (id) | fk_encounters_discharge_disposition_concept_id |
| hacia | isolation_precaution_concept_id | terminology.catalog_concepts (id) | fk_encounters_isolation_precaution_concept_id |
| desde | id | clinical.observations (encounter_id) | fk_observations_encounter_id |
| desde | id | clinical.conditions (encounter_id) | fk_conditions_encounter_id |
| desde | id | clinical.allergy_intolerances (encounter_id) | fk_allergy_intolerances_encounter_id |
| desde | id | clinical.service_requests (encounter_id) | fk_service_requests_encounter_id |
| desde | id | clinical.diagnostic_reports (encounter_id) | fk_diagnostic_reports_encounter_id |
| desde | id | clinical.medication_requests (encounter_id) | fk_medication_requests_encounter_id |
| desde | id | clinical.procedures (encounter_id) | fk_procedures_encounter_id |
| desde | id | clinical.received_services (encounter_id) | fk_received_services_encounter_id |
| desde | id | clinical.encounter_participants (encounter_id) | fk_encounter_participants_encounter_id |
| desde | id | clinical.encounter_locations (encounter_id) | fk_encounter_locations_encounter_id |
| desde | id | clinical.placement_incidents (encounter_id) | fk_placement_incidents_encounter_id |
| desde | id | clinical.patient_admission_footprints (encounter_id) | fk_patient_admission_footprints_encounter_id |
| desde | id | clinical.inpatient_census_entries (encounter_id) | fk_inpatient_census_entries_encounter_id |
| desde | id | authz.clinical_access_grants (encounter_id) | fk_clinical_access_grants_encounter_id |
| desde | id | consent.treatment_informed_consents (encounter_id) | fk_treatment_informed_consents_encounter_id |
| desde | id | chart.clinical_note_headers (encounter_id) | fk_clinical_note_headers_encounter_id |
| desde | id | chart.care_plans (encounter_id) | fk_care_plans_encounter_id |
| desde | id | chart.document_records (encounter_id) | fk_document_records_encounter_id |
| desde | id | billing.charge_captures (encounter_id) | fk_charge_captures_encounter_id |
| desde | id | billing.invoices (encounter_id) | fk_invoices_encounter_id |
| desde | id | billing.billing_document_links (encounter_id) | fk_billing_document_links_encounter_id |
| desde | id | clinical_ext.referrals (source_encounter_id) | fk_referrals_source_encounter_id |
| desde | id | clinical_ext.clinical_alerts (encounter_id) | fk_clinical_alerts_encounter_id |
| desde | id | clinical_ext.virtual_encounters (encounter_id) | fk_virtual_encounters_encounter_id |
| desde | id | community.service_reviews (verified_encounter_id) | fk_service_reviews_verified_encounter_id |
| desde | id | community.party_ratings (verified_encounter_id) | fk_party_ratings_verified_encounter_id |
| desde | id | diagnostics.specimens (encounter_id) | fk_specimens_encounter_id |
| desde | id | diagnostics.imaging_studies (encounter_id) | fk_imaging_studies_encounter_id |
| desde | id | diagnostics.clinical_media (encounter_id) | fk_clinical_media_encounter_id |
| desde | id | diagnostics.laboratory_accessions (encounter_id) | fk_laboratory_accessions_encounter_id |
| desde | id | insurance.insurance_claims (encounter_id) | fk_insurance_claims_encounter_id |
| desde | id | delegated_access.delegated_access_grants (encounter_id) | fk_delegated_access_grants_encounter_id |
| desde | id | delegated_access.delegated_access_approval_requests (encounter_id) | fk_delegated_access_approval_requests_encounter_id |
| desde | id | health_data.canonical_health_resources (encounter_id) | fk_canonical_health_resources_encounter_id |
| desde | id | health_data.patient_timeline_entries (encounter_id) | fk_patient_timeline_entries_encounter_id |
| desde | id | procedures_perioperative.procedure_cases (encounter_id) | fk_procedure_cases_encounter_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_encounters_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_encounters_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 3 consulta(s) de repositorio filtran u ordenan por «patient_profile_id», la primera columna del índice _(CONSULTA)_ |
| `ix_encounters_episode_id` | no | episode_id | Soporta la clave foránea fk_encounters_episode_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounters_tenant_id` | no | tenant_id | Soporta la clave foránea fk_encounters_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 2 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_encounters_branch_id` | no | branch_id | Soporta la clave foránea fk_encounters_branch_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounters_primary_practitioner_id` | no | primary_practitioner_id | Soporta la clave foránea fk_encounters_primary_practitioner_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «primary_practitioner_id», la primera columna del índice _(CONSULTA)_ |
| `ix_encounters_class_concept_id` | no | class_concept_id | Soporta la clave foránea fk_encounters_class_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounters_type_concept_id` | no | type_concept_id | Soporta la clave foránea fk_encounters_type_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounters_status_concept_id` | no | status_concept_id | Soporta la clave foránea fk_encounters_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «status_concept_id», la primera columna del índice _(CONSULTA)_ |
| `ix_encounters_appointment_id` | no | appointment_id | Soporta la clave foránea fk_encounters_appointment_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 4 consulta(s) de repositorio filtran u ordenan por «appointment_id», la primera columna del índice _(CONSULTA)_ |
| `ix_encounters_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_encounters_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «created_by_user_id», la primera columna del índice _(CONSULTA)_ |
| `ix_encounters_updated_by_user_id` | no | updated_by_user_id | Soporta la clave foránea fk_encounters_updated_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounters_tenant_id_status_concept_id` | no | tenant_id, status_concept_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_encounters_patient_profile_id_updated_at` | no | tenant_id, patient_profile_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_encounters_level_of_care_concept_id` | no | level_of_care_concept_id | Soporta la clave foránea fk_encounters_level_of_care_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounters_admission_source_concept_id` | no | admission_source_concept_id | Soporta la clave foránea fk_encounters_admission_source_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounters_discharge_disposition_concept_id` | no | discharge_disposition_concept_id | Soporta la clave foránea fk_encounters_discharge_disposition_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_encounters_isolation_precaution_concept_id` | no | isolation_precaution_concept_id | Soporta la clave foránea fk_encounters_isolation_precaution_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ux_encounters_tenant_id_id` | sí | tenant_id, id | Garantiza que no se repita la combinación (tenant_id, id) _(DOCUMENTO)_; Soporta la clave foránea fk_encounters_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 2 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `ux_encounters_tenant_id_id` | UNIQUE INDEX | UNIQUE INDEX ("tenant_id", "id") |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /accounting/practitioner/consultation-income | LEE | DIRECTA |
| GET /accounting/practitioner/paid-consultations | LEE | DIRECTA |
| GET /accounting/practitioner/simple/summary | LEE | DIRECTA |
| POST /authz/patients/{patientProfileId}/break-the-glass | LEE | DIRECTA |
| POST /authz/patients/{patientProfileId}/clinical-access-grants | LEE | DIRECTA |
| GET /billing/bed-day/stays | LEE | POR_SQL |
| POST /billing/encounters/{encounterId}/bed-day-charges/run | LEE | POR_SQL |
| GET /billing/encounters/{encounterId}/pending-charges | LEE | POR_SQL |
| POST /billing/invoices:issue-from-encounter | LEE | DIRECTA |
| GET /billing/simulated/charges | LEE | POR_SQL |
| POST /billing/simulated/charges/{chargeId}/instances/{instanceId}/payments | LEE | POR_SQL |
| POST /billing/simulated/charges/{chargeId}/invoices | LEE | POR_SQL |
| POST /billing/simulated/charges/{chargeId}/payment | LEE | DIRECTA |
| GET /billing/simulated/invoices/{invoiceId} | LEE | POR_SQL |
| POST /billing/simulated/invoices/{invoiceId}/annulment | LEE | POR_SQL |
| POST /billing/simulated/invoices/{invoiceId}/annulment-reversal | LEE | POR_SQL |
| POST /billing/simulated/invoices/{invoiceId}/email | LEE | POR_SQL |
| GET /billing/simulated/my-invoices | LEE | POR_SQL |
| GET /billing/simulated/my-invoices/{invoiceId} | LEE | POR_SQL |
| GET /billing/simulated/outbox | LEE | POR_SQL |
| GET /billing/simulated/status | LEE | POR_SQL |
| POST /internal/billing/bed-day-charges/run | LEE | POR_SQL |
| POST /charts/care-plans | LEE | DIRECTA |
| POST /charts/documents | LEE | DIRECTA |
| GET /charts/encounters/{id}/pdf | LEE | DIRECTA |
| GET /charts/me/encounters/{id}/pdf | LEE | DIRECTA |
| POST /charts/notes | LEE | DIRECTA |
| POST /clinical/admissions | CREA | DIRECTA |
| POST /clinical/admissions | LEE | POR_SQL |
| POST /clinical/allergy-intolerances | LEE | DIRECTA |
| POST /clinical/bed-compatibility | LEE | POR_SQL |
| POST /clinical/bed-swaps | LEE | DIRECTA |
| POST /clinical/conditions | LEE | DIRECTA |
| POST /clinical/encounter-locations/{id}/cancel | LEE | DIRECTA |
| GET /clinical/encounters/{id}/attachments | LEE | DIRECTA |
| POST /clinical/encounters/{id}/attachments | LEE | DIRECTA |
| POST /clinical/encounters/{id}/bed-assignment | LEE | DIRECTA |
| POST /clinical/encounters/{id}/bed-compatibility | LEE | DIRECTA |
| POST /clinical/encounters/{id}/close | ACTUALIZA | POR_TIPO |
| POST /clinical/encounters/{id}/close | LEE | DIRECTA |
| POST /clinical/encounters/{id}/discharge | ACTUALIZA | POR_TIPO |
| POST /clinical/encounters/{id}/discharge | LEE | DIRECTA |
| GET /clinical/encounters/{id}/stay | LEE | DIRECTA |
| POST /clinical/encounters/{id}/transfer | LEE | DIRECTA |
| POST /clinical/encounters/check-in | CREA | DIRECTA |
| POST /clinical/encounters/check-in | LEE | DIRECTA |
| POST /clinical/observations | LEE | DIRECTA |
| GET /clinical/patients/{id}/inpatient-stay | LEE | DIRECTA |
| GET /clinical/patients/{patientProfileId}/summary | LEE | DIRECTA |
| POST /clinical/requisitions | LEE | DIRECTA |
| POST /clinical/service-requests | LEE | DIRECTA |
| POST /clinical/service-requests/duplicate-check | LEE | DIRECTA |
| POST /internal/clinical/census-close-tick | LEE | POR_SQL |
| GET /sites/{siteId}/census | LEE | POR_SQL |
| POST /sites/{siteId}/census/{date}/close | LEE | POR_SQL |
| GET /sites/{siteId}/inpatients | LEE | DIRECTA |
| POST /order-sets/{id}/apply | LEE | DIRECTA |
| POST /referrals | LEE | DIRECTA |
| POST /virtual-encounters | LEE | DIRECTA |
| PATCH /virtual-encounters/{id}/end | LEE | DIRECTA |
| PATCH /virtual-encounters/{id}/join | LEE | DIRECTA |
| GET /community/groups | LEE | DIRECTA |
| POST /community/groups | LEE | DIRECTA |
| GET /community/groups/{groupId} | LEE | DIRECTA |
| GET /community/groups/{groupId}/members | LEE | DIRECTA |
| POST /community/groups/{groupId}/members | LEE | DIRECTA |
| DELETE /community/groups/{groupId}/members/{member} | LEE | DIRECTA |
| PATCH /community/groups/{groupId}/members/{member} | LEE | DIRECTA |
| GET /community/groups/{groupId}/posts | LEE | DIRECTA |
| POST /community/groups/{groupId}/posts | LEE | DIRECTA |
| POST /community/profiles/{profileId}/reviews | LEE | DIRECTA |
| PUT /community/ratings | LEE | DIRECTA |
| GET /patients/me/reviewable-care | LEE | DIRECTA |
| POST /patients/me/reviews | LEE | DIRECTA |
| GET /consent/encounters/{encounterId}/informed-consent | LEE | DIRECTA |
| POST /consent/encounters/{encounterId}/informed-consent | LEE | DIRECTA |
| POST /consent/treatment-informed-consents | LEE | DIRECTA |
| POST /practitioner-delegates/{id}/grants | LEE | DIRECTA |
| POST /diagnostics/clinical-media | LEE | DIRECTA |
| POST /diagnostics/specimens | LEE | DIRECTA |
| POST /dicomweb/studies | LEE | DIRECTA |
| GET /forms/instances | LEE | DIRECTA |
| POST /forms/instances | LEE | DIRECTA |
| GET /forms/instances/{id} | LEE | DIRECTA |
| GET /forms/me/instances | LEE | DIRECTA |
| GET /forms/me/instances/{id} | LEE | DIRECTA |
| GET /insurance/analytics/loss-ratio | LEE | POR_SQL |
| GET /insurance/my-claims | LEE | DIRECTA |
| POST /insurance/portability/export | LEE | POR_SQL |
| GET /insurance/received-claims | LEE | DIRECTA |
| POST /insurance/received-claims/{id}/decision | LEE | DIRECTA |
| POST /care-spaces/{id}/availability | LEE | POR_SQL |
| POST /care-spaces/{id}/hygiene | LEE | POR_SQL |
| POST /care-spaces/{id}/isolation | LEE | POR_SQL |
| GET /care-spaces/{id}/operational-state | LEE | POR_SQL |
| GET /sites/{siteId}/bed-board | LEE | POR_SQL |
| GET /sites/{siteId}/sample-collection-points | LEE | POR_SQL |
| POST /procedure-cases/{id}/diagnoses | LEE | DIRECTA |
| POST /procedure-cases/{id}/preoperative-orders | LEE | DIRECTA |
| GET /profiles/practitioners | LEE | POR_SQL |
| PATCH /profiles/practitioners/{profileId} | LEE | DIRECTA |
| DELETE /profiles/practitioners/{profileId}/photo | LEE | DIRECTA |
| PUT /profiles/practitioners/{profileId}/photo | LEE | DIRECTA |
| GET /profiles/practitioners/{profileId}/summary | LEE | DIRECTA |
| PATCH /profiles/practitioners/me | LEE | DIRECTA |
| GET /profiles/practitioners/me/summary | LEE | DIRECTA |
| POST /scheduling/appointments/direct | LEE | DIRECTA |
| POST /scheduling/appointments/walk-in | CREA | DIRECTA |
| POST /scheduling/appointments/walk-in | LEE | DIRECTA |
| GET /scheduling/bookings | LEE | DIRECTA |
| GET /scheduling/bookings/{id} | LEE | DIRECTA |
| POST /scheduling/bookings/{id}/payment-receipts/{receiptId}/confirm | LEE | DIRECTA |
| PUT /scheduling/bookings/{id}/payment-state | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### family_member_history

#### Vista general

Conserva antecedentes familiares relevantes para la evaluación de riesgo y la historia de salud del paciente.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: family_member_history`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `FamilyMemberHistory` — `src/modules/clinical/entities/family_member_history.entity.ts`
- **Resumen:** 15 columnas · 9 índices · 7 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/family_member_history.entity.ts:12`)_ | coincide |
| 2 | `custodian_tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 3 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 4 | `relationship_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `condition_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 6 | `onset_age_years` | `integer` | Opcional | _sin dato_ | coincide |
| 7 | `deceased` | `boolean` | Opcional | _sin dato_ | coincide |
| 8 | `deceased_age_years` | `integer` | Opcional | _sin dato_ | coincide |
| 9 | `note_text` | `text` | Opcional | _sin dato_ | coincide |
| 10 | `recorded_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 11 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/family_member_history.entity.ts:76`)_ | coincide |
| 12 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/family_member_history.entity.ts:82`)_ | coincide |
| 13 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 14 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 15 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/family_member_history.entity.ts:100`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | custodian_tenant_id | directory.tenants (id) | fk_family_member_history_custodian_tenant_id |
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_family_member_history_patient_profile_id |
| hacia | relationship_concept_id | terminology.catalog_concepts (id) | fk_family_member_history_relationship_concept_id |
| hacia | condition_concept_id | terminology.catalog_concepts (id) | fk_family_member_history_condition_concept_id |
| hacia | recorded_by_user_id | iam.users (id) | fk_family_member_history_recorded_by_user_id |
| hacia | created_by_user_id | iam.users (id) | fk_family_member_history_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_family_member_history_updated_by_user_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_family_member_history_custodian_tenant_id` | no | custodian_tenant_id | Soporta la clave foránea fk_family_member_history_custodian_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_family_member_history_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_family_member_history_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_family_member_history_relationship_concept_id` | no | relationship_concept_id | Soporta la clave foránea fk_family_member_history_relationship_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_family_member_history_condition_concept_id` | no | condition_concept_id | Soporta la clave foránea fk_family_member_history_condition_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_family_member_history_recorded_by_user_id` | no | recorded_by_user_id | Soporta la clave foránea fk_family_member_history_recorded_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_family_member_history_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_family_member_history_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_family_member_history_updated_by_user_id` | no | updated_by_user_id | Soporta la clave foránea fk_family_member_history_updated_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_family_member_history_custodian_tenant_id_updated_at` | no | custodian_tenant_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_family_member_history_patient_profile_id_updated_at` | no | custodian_tenant_id, patient_profile_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### immunizations

#### Vista general

Registra inmunizaciones administradas o documentadas en la historia de salud para sostener seguimiento y continuidad preventiva.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: immunizations`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `Immunizations` — `src/modules/clinical/entities/immunizations.entity.ts`
- **Resumen:** 15 columnas · 10 índices · 8 FK salientes · 1 entrantes · 3 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/immunizations.entity.ts:12`)_ | coincide |
| 2 | `custodian_tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 3 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 4 | `vaccine_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 6 | `dose_number` | `integer` | Opcional | _sin dato_ | coincide |
| 7 | `lot_number` | `varchar` | Opcional | _sin dato_ | coincide |
| 8 | `route_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 9 | `administered_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 10 | `administered_by_profile_id` | `uuid` | Clave foránea → profiles.health_practitioner_profiles.profile_id; Opcional | _sin dato_ | coincide |
| 11 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/immunizations.entity.ts:80`)_ | coincide |
| 12 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/immunizations.entity.ts:86`)_ | coincide |
| 13 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 14 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 15 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/immunizations.entity.ts:104`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | custodian_tenant_id | directory.tenants (id) | fk_immunizations_custodian_tenant_id |
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_immunizations_patient_profile_id |
| hacia | vaccine_concept_id | terminology.catalog_concepts (id) | fk_immunizations_vaccine_concept_id |
| hacia | status_concept_id | terminology.catalog_concepts (id) | fk_immunizations_status_concept_id |
| hacia | route_concept_id | terminology.catalog_concepts (id) | fk_immunizations_route_concept_id |
| hacia | administered_by_profile_id | profiles.health_practitioner_profiles (profile_id) | fk_immunizations_administered_by_profile_id |
| hacia | created_by_user_id | iam.users (id) | fk_immunizations_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_immunizations_updated_by_user_id |
| desde | id | clinical.received_services (source_immunization_id) | fk_received_services_source_immunization_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_immunizations_custodian_tenant_id` | no | custodian_tenant_id | Soporta la clave foránea fk_immunizations_custodian_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «custodian_tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_immunizations_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_immunizations_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «patient_profile_id», la primera columna del índice _(CONSULTA)_ |
| `ix_immunizations_vaccine_concept_id` | no | vaccine_concept_id | Soporta la clave foránea fk_immunizations_vaccine_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «vaccine_concept_id», la primera columna del índice _(CONSULTA)_ |
| `ix_immunizations_status_concept_id` | no | status_concept_id | Soporta la clave foránea fk_immunizations_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_immunizations_route_concept_id` | no | route_concept_id | Soporta la clave foránea fk_immunizations_route_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_immunizations_administered_by_profile_id` | no | administered_by_profile_id | Soporta la clave foránea fk_immunizations_administered_by_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_immunizations_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_immunizations_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_immunizations_updated_by_user_id` | no | updated_by_user_id | Soporta la clave foránea fk_immunizations_updated_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_immunizations_custodian_tenant_id_status_concept_id` | no | custodian_tenant_id, status_concept_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_immunizations_patient_profile_id_updated_at` | no | custodian_tenant_id, patient_profile_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /clinical/immunizations | CREA | DIRECTA |
| POST /clinical/immunizations | LEE | DIRECTA |
| GET /insurance/analytics/loss-ratio | LEE | POR_SQL |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### inpatient_census_adjustments

#### Vista general

Deja constancia inmutable de cada corrección a un contador del censo diario cerrado, con valor previo, nuevo y motivo, para indicadores hospitalarios auditables.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: inpatient_census_adjustments`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `InpatientCensusAdjustments` — `src/modules/clinical/entities/inpatient_census_adjustments.entity.ts`
- **Resumen:** 11 columnas · 3 índices · 3 FK salientes · 0 entrantes · 4 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/inpatient_census_adjustments.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 3 | `census_day_id` | `uuid` | Clave foránea → clinical.inpatient_census_days.id; Obligatoria | _sin dato_ | coincide |
| 4 | `field_code` | `varchar` | Obligatoria | _sin dato_ | coincide |
| 5 | `previous_value` | `integer` | Obligatoria | _sin dato_ | coincide |
| 6 | `new_value` | `integer` | Obligatoria | _sin dato_ | coincide |
| 7 | `reason_text` | `text` | Obligatoria | _sin dato_ | coincide |
| 8 | `entry_ref_id` | `uuid` | Opcional | _sin dato_ | coincide |
| 9 | `adjusted_by_user_id` | `uuid` | Clave foránea → iam.users.id; Obligatoria | _sin dato_ | coincide |
| 10 | `request_id` | `varchar` | Opcional | _sin dato_ | coincide |
| 11 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/inpatient_census_adjustments.entity.ts:72`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | census_day_id | clinical.inpatient_census_days (id) | fk_inpatient_census_adjustments_census_day_id |
| hacia | tenant_id | directory.tenants (id) | fk_inpatient_census_adjustments_tenant_id |
| hacia | adjusted_by_user_id | iam.users (id) | fk_inpatient_census_adjustments_adjusted_by_user_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_inpatient_census_adjustments_tenant_id` | no | tenant_id | Soporta la clave foránea fk_inpatient_census_adjustments_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_inpatient_census_adjustments_census_day_id` | no | census_day_id, created_at | Soporta la clave foránea fk_inpatient_census_adjustments_census_day_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 3 consulta(s) de repositorio filtran u ordenan por «census_day_id», la primera columna del índice _(CONSULTA)_ |
| `ix_inpatient_census_adjustments_adjusted_by_user_id` | no | adjusted_by_user_id | Soporta la clave foránea fk_inpatient_census_adjustments_adjusted_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `ck_inpatient_census_adjustments_field_code` | CHECK | CHECK ("field_code" IN ('beds_censable', 'beds_available', 'beds_blocked', 'patients_at_cutoff', 'admissions', 'discharges', 'deaths', 'transfers_in', 'transfers_out', 'same_day_stays', 'patient_days', 'discharge_stay_days')) |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /census-days/{id}/adjustments | CREA | DIRECTA |
| POST /census-days/{id}/adjustments | LEE | DIRECTA |
| GET /sites/{siteId}/census | LEE | DIRECTA |
| GET /sites/{siteId}/inpatient-indicators | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### inpatient_census_days

#### Vista general

Consolida el censo diario de internación por sede y unidad al corte de medianoche (camas, ocupación, ingresos, egresos, días-paciente) y se congela al cerrarse.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: inpatient_census_days`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `InpatientCensusDays` — `src/modules/clinical/entities/inpatient_census_days.entity.ts`
- **Resumen:** 27 columnas · 9 índices · 7 FK salientes · 2 entrantes · 7 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/inpatient_census_days.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 3 | `practice_site_id` | `uuid` | Clave foránea → practice.practice_sites.id; Obligatoria | _sin dato_ | coincide |
| 4 | `clinical_unit_id` | `uuid` | Clave foránea → practice.clinical_units.id; Obligatoria | _sin dato_ | coincide |
| 5 | `census_date` | `date` | Obligatoria | _sin dato_ | coincide |
| 6 | `cutoff_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 7 | `status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 8 | `closed_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 9 | `closed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 10 | `beds_censable` | `integer` | Obligatoria | _sin dato_ | coincide |
| 11 | `beds_available` | `integer` | Obligatoria | _sin dato_ | coincide |
| 12 | `beds_blocked` | `integer` | Obligatoria | _sin dato_ | coincide |
| 13 | `patients_at_cutoff` | `integer` | Obligatoria | _sin dato_ | coincide |
| 14 | `admissions` | `integer` | Obligatoria | _sin dato_ | coincide |
| 15 | `discharges` | `integer` | Obligatoria | _sin dato_ | coincide |
| 16 | `deaths` | `integer` | Obligatoria | _sin dato_ | coincide |
| 17 | `transfers_in` | `integer` | Obligatoria | _sin dato_ | coincide |
| 18 | `transfers_out` | `integer` | Obligatoria | _sin dato_ | coincide |
| 19 | `same_day_stays` | `integer` | Obligatoria | _sin dato_ | coincide |
| 20 | `patient_days` | `integer` | Obligatoria | _sin dato_ | coincide |
| 21 | `discharge_stay_days` | `integer` | Obligatoria | _sin dato_ | coincide |
| 22 | `content_hash` | `varchar` | Opcional | _sin dato_ | coincide |
| 23 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/inpatient_census_days.entity.ts:152`)_ | coincide |
| 24 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/inpatient_census_days.entity.ts:158`)_ | coincide |
| 25 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 26 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 27 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/inpatient_census_days.entity.ts:176`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | tenant_id | directory.tenants (id) | fk_inpatient_census_days_tenant_id |
| hacia | practice_site_id | practice.practice_sites (id) | fk_inpatient_census_days_practice_site_id |
| hacia | clinical_unit_id | practice.clinical_units (id) | fk_inpatient_census_days_clinical_unit_id |
| hacia | status_concept_id | terminology.catalog_concepts (id) | fk_inpatient_census_days_status_concept_id |
| hacia | closed_by_user_id | iam.users (id) | fk_inpatient_census_days_closed_by_user_id |
| hacia | created_by_user_id | iam.users (id) | fk_inpatient_census_days_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_inpatient_census_days_updated_by_user_id |
| desde | id | clinical.inpatient_census_entries (census_day_id) | fk_inpatient_census_entries_census_day_id |
| desde | id | clinical.inpatient_census_adjustments (census_day_id) | fk_inpatient_census_adjustments_census_day_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ux_inpatient_census_days_site_unit_date` | sí | practice_site_id, clinical_unit_id, census_date | Garantiza que no se repita la combinación (practice_site_id, clinical_unit_id, census_date) _(DOCUMENTO)_; Soporta la clave foránea fk_inpatient_census_days_practice_site_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 3 consulta(s) de repositorio filtran u ordenan por «practice_site_id», la primera columna del índice _(CONSULTA)_ |
| `ix_inpatient_census_days_tenant_id` | no | tenant_id | Soporta la clave foránea fk_inpatient_census_days_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_inpatient_census_days_clinical_unit_id` | no | clinical_unit_id | Soporta la clave foránea fk_inpatient_census_days_clinical_unit_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_inpatient_census_days_status_concept_id` | no | status_concept_id | Soporta la clave foránea fk_inpatient_census_days_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «status_concept_id», la primera columna del índice _(CONSULTA)_ |
| `ix_inpatient_census_days_closed_by_user_id` | no | closed_by_user_id | Soporta la clave foránea fk_inpatient_census_days_closed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_inpatient_census_days_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_inpatient_census_days_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_inpatient_census_days_updated_by_user_id` | no | updated_by_user_id | Soporta la clave foránea fk_inpatient_census_days_updated_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_inpatient_census_days_site_date` | no | practice_site_id, ("census_date" DESC) | _sin uso detectado estáticamente_ |
| `ux_inpatient_census_days_tenant_id_id` | sí | tenant_id, id | Garantiza que no se repita la combinación (tenant_id, id) _(DOCUMENTO)_; Soporta la clave foránea fk_inpatient_census_days_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `ux_inpatient_census_days_site_unit_date` | UNIQUE INDEX | UNIQUE INDEX ("practice_site_id", "clinical_unit_id", "census_date") |
| `ux_inpatient_census_days_tenant_id_id` | UNIQUE INDEX | UNIQUE INDEX ("tenant_id", "id") |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /census-days/{id}/adjustments | LEE | DIRECTA |
| POST /internal/clinical/census-close-tick | CREA | DIRECTA |
| POST /internal/clinical/census-close-tick | LEE | DIRECTA |
| GET /sites/{siteId}/census | LEE | DIRECTA |
| POST /sites/{siteId}/census/{date}/close | CREA | DIRECTA |
| POST /sites/{siteId}/census/{date}/close | LEE | DIRECTA |
| GET /sites/{siteId}/inpatient-indicators | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### inpatient_census_entries

#### Vista general

Fotografía inmutable de cada paciente presente o con movimiento en el censo diario de una unidad, base de los indicadores de ocupación y estancia.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: inpatient_census_entries`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `InpatientCensusEntries` — `src/modules/clinical/entities/inpatient_census_entries.entity.ts`
- **Resumen:** 10 columnas · 7 índices · 7 FK salientes · 0 entrantes · 2 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/inpatient_census_entries.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 3 | `census_day_id` | `uuid` | Clave foránea → clinical.inpatient_census_days.id; Obligatoria | _sin dato_ | coincide |
| 4 | `encounter_id` | `uuid` | Clave foránea → clinical.encounters.id; Obligatoria | _sin dato_ | coincide |
| 5 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 6 | `care_space_id` | `uuid` | Clave foránea → practice.care_spaces.id; Obligatoria | _sin dato_ | coincide |
| 7 | `bed_category_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 8 | `movement_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 9 | `occurred_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 10 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/inpatient_census_entries.entity.ts:70`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | census_day_id | clinical.inpatient_census_days (id) | fk_inpatient_census_entries_census_day_id |
| hacia | encounter_id | clinical.encounters (id) | fk_inpatient_census_entries_encounter_id |
| hacia | tenant_id | directory.tenants (id) | fk_inpatient_census_entries_tenant_id |
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_inpatient_census_entries_patient_profile_id |
| hacia | care_space_id | practice.care_spaces (id) | fk_inpatient_census_entries_care_space_id |
| hacia | bed_category_concept_id | terminology.catalog_concepts (id) | fk_inpatient_census_entries_bed_category_concept_id |
| hacia | movement_concept_id | terminology.catalog_concepts (id) | fk_inpatient_census_entries_movement_concept_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_inpatient_census_entries_tenant_id` | no | tenant_id | Soporta la clave foránea fk_inpatient_census_entries_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_inpatient_census_entries_census_day_id` | no | census_day_id | Soporta la clave foránea fk_inpatient_census_entries_census_day_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_inpatient_census_entries_encounter_id` | no | encounter_id | Soporta la clave foránea fk_inpatient_census_entries_encounter_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_inpatient_census_entries_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_inpatient_census_entries_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_inpatient_census_entries_care_space_id` | no | care_space_id | Soporta la clave foránea fk_inpatient_census_entries_care_space_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_inpatient_census_entries_bed_category_concept_id` | no | bed_category_concept_id | Soporta la clave foránea fk_inpatient_census_entries_bed_category_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_inpatient_census_entries_movement_concept_id` | no | movement_concept_id | Soporta la clave foránea fk_inpatient_census_entries_movement_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /internal/clinical/census-close-tick | CREA | DIRECTA |
| POST /sites/{siteId}/census/{date}/close | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### medication_records

#### Vista general

Conserva el historial clínico de uso o administración de medicación del paciente; no representa el inventario ni la dispensación de farmacia.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: medication_records; MEDICATION note`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `MedicationRecords` — `src/modules/clinical/entities/medication_records.entity.ts`
- **Resumen:** 16 columnas · 12 índices · 10 FK salientes · 2 entrantes · 1 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/medication_records.entity.ts:12`)_ | coincide |
| 2 | `custodian_tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 3 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 4 | `request_id` | `uuid` | Clave foránea → clinical.medication_requests.id; Opcional | _sin dato_ | coincide |
| 5 | `medication_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 6 | `status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 7 | `record_type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 8 | `dose_decimal` | `numeric` | Opcional | _sin dato_ | coincide |
| 9 | `unit_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `administered_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 11 | `recorded_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 12 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/medication_records.entity.ts:90`)_ | coincide |
| 13 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/medication_records.entity.ts:96`)_ | coincide |
| 14 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 15 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 16 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/medication_records.entity.ts:114`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | request_id | clinical.medication_requests (id) | fk_medication_records_request_id |
| hacia | custodian_tenant_id | directory.tenants (id) | fk_medication_records_custodian_tenant_id |
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_medication_records_patient_profile_id |
| hacia | medication_concept_id | terminology.catalog_concepts (id) | fk_medication_records_medication_concept_id |
| hacia | status_concept_id | terminology.catalog_concepts (id) | fk_medication_records_status_concept_id |
| hacia | record_type_concept_id | terminology.catalog_concepts (id) | fk_medication_records_record_type_concept_id |
| hacia | unit_concept_id | terminology.catalog_concepts (id) | fk_medication_records_unit_concept_id |
| hacia | recorded_by_user_id | iam.users (id) | fk_medication_records_recorded_by_user_id |
| hacia | created_by_user_id | iam.users (id) | fk_medication_records_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_medication_records_updated_by_user_id |
| desde | id | procedures_perioperative.anesthesia_events (medication_administration_id) | fk_anesthesia_events_medication_administration_id |
| desde | id | procedures_perioperative.procedure_medication_uses (medication_administration_id) | fk_procedure_medication_uses_medication_administration_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_medication_records_custodian_tenant_id` | no | custodian_tenant_id | Soporta la clave foránea fk_medication_records_custodian_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_records_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_medication_records_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_records_request_id` | no | request_id | Soporta la clave foránea fk_medication_records_request_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_records_medication_concept_id` | no | medication_concept_id | Soporta la clave foránea fk_medication_records_medication_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_records_status_concept_id` | no | status_concept_id | Soporta la clave foránea fk_medication_records_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_records_record_type_concept_id` | no | record_type_concept_id | Soporta la clave foránea fk_medication_records_record_type_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_records_unit_concept_id` | no | unit_concept_id | Soporta la clave foránea fk_medication_records_unit_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_records_recorded_by_user_id` | no | recorded_by_user_id | Soporta la clave foránea fk_medication_records_recorded_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_records_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_medication_records_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_records_updated_by_user_id` | no | updated_by_user_id | Soporta la clave foránea fk_medication_records_updated_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_records_custodian_tenant_id_status_concept_id` | no | custodian_tenant_id, status_concept_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_medication_records_patient_profile_id_updated_at` | no | custodian_tenant_id, patient_profile_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /clinical/medication-records | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### medication_requests

#### Vista general

Registra solicitudes o prescripciones de medicamentos, su indicación y trazabilidad clínica dentro de la atención del paciente.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: medication_requests`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `MedicationRequests` — `src/modules/clinical/entities/medication_requests.entity.ts`
- **Resumen:** 33 columnas · 17 índices · 18 FK salientes · 8 entrantes · 52 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/medication_requests.entity.ts:12`)_ | coincide |
| 2 | `custodian_tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 3 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 4 | `encounter_id` | `uuid` | Clave foránea → clinical.encounters.id; Opcional | _sin dato_ | coincide |
| 5 | `medication_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 6 | `substance_atc_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 7 | `intent_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 8 | `status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 9 | `prescriber_profile_id` | `uuid` | Clave foránea → profiles.health_practitioner_profiles.profile_id; Opcional | _sin dato_ | coincide |
| 10 | `dose_text` | `varchar` | Opcional | _sin dato_ | coincide |
| 11 | `route_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 12 | `frequency_text` | `varchar` | Opcional | _sin dato_ | coincide |
| 13 | `quantity_decimal` | `numeric` | Opcional | _sin dato_ | coincide |
| 14 | `unit_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 15 | `valid_from` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 16 | `valid_to` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 17 | `patient_instructions_text` | `text` | Opcional | + v4.1.3: indicaciones al paciente que se imprimen en la receta. Separadas de dose_text a propósito: la posología la lee farmacia para dispensar y no debe llevar narrativa ("tomar con las comidas") concatenada. _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_08_clinical.puml:455`)_ | coincide |
| 18 | `indication_condition_id` | `uuid` | Clave foránea → clinical.conditions.id; Opcional | + v4.1.6: el diagnóstico que motiva la prescripción — «para qué es» esta receta. Compartir el encuentro con una condición no dice cuál de las condiciones del paciente se está tratando, y esa respuesta la necesitan tres lectores: el papel impreso, la validación farmacológica (dosis y contraindicación dependen de la indicación) y la renovación, que arrastra el motivo del original. Nullable a propósito: hay prescripciones legítimas sin condición registrada (sintomática, profilaxis, receta cargada antes de codificar el diagnóstico), y obligar aquí bloquearía el acto clínico para completar el dato administrativo. La convención por nombre no resuelve el destino (no existe tabla `indication_conditions`): se declara en la nota del vault `SALUD/FK/FK clinical.medication_requests.indication_condition_id.md`. _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_08_clinical.puml:459`)_ | coincide |
| 19 | `indication_text` | `varchar(200)` | Opcional | + v4.2.38: el motivo de la receta en texto libre, para prescribir sin un diagnóstico codificado. Excluyente con indication_condition_id (gana el concepto; lo aplica el servicio). Aditivo y anulable. Estaba en el parche 2026-10-11_v4238 y en la entidad. _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_08_clinical.puml:471`)_ | coincide |
| 20 | `form_instance_id` | `uuid` | Clave foránea → forms.form_instances.id; Opcional | + v4.2.32 (P43): receta emitida desde la respuesta CERRADA del formulario médico. Nullable y sin backfill. FK → forms.form_instances. _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_08_clinical.puml:475`)_ | coincide |
| 21 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/medication_requests.entity.ts:178`)_ | coincide |
| 22 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/medication_requests.entity.ts:184`)_ | coincide |
| 23 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 24 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 25 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/medication_requests.entity.ts:202`)_ | coincide |
| 26 | `signed_at` | `timestamptz` | Opcional | + v4.0.8 (ALOVIDA D-05 / CAN-RX): firma de la receta y máquina de estados. Todas NULLABLE: una receta sin firmar tiene signed_at/signed_by en NULL, y la firma solo se exige cuando una prescription_signature_policies vigente lo pide. _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_08_clinical.puml:483`)_ | coincide |
| 27 | `signed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | Usuario que firmó la receta. FK → iam.users _(JSDOC_ENTIDAD, `src/modules/clinical/entities/medication_requests.entity.ts:214`)_ | coincide |
| 28 | `issued_at` | `timestamptz` | Opcional | Instante en que la receta se selló (DRAFT → ISSUED); a partir de aquí es inmutable. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/medication_requests.entity.ts:218`)_ | coincide |
| 29 | `status_reason_text` | `text` | Opcional | Motivo de INVALIDATED/REPLACED (obligatorio al invalidar/reemplazar). _(JSDOC_ENTIDAD, `src/modules/clinical/entities/medication_requests.entity.ts:226`)_ | coincide |
| 30 | `replaces_request_id` | `uuid` | Clave foránea → clinical.medication_requests.id; Opcional | Autorreferencias (invalidar / reemplazar / renovar). La convención por nombre no resuelve el autoenlace, así que el destino se declara en la nota del vault `SALUD/FK/FK clinical.medication_requests.<col>.md`. _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_08_clinical.puml:490`)_ | coincide |
| 31 | `replaced_by_request_id` | `uuid` | Clave foránea → clinical.medication_requests.id; Opcional | Receta que sustituye a ESTA (esta quedó REPLACED). FK → medication_requests.id _(JSDOC_ENTIDAD, `src/modules/clinical/entities/medication_requests.entity.ts:238`)_ | coincide |
| 32 | `renewed_from_request_id` | `uuid` | Clave foránea → clinical.medication_requests.id; Opcional | Receta de la que ESTA es renovación (copia). FK → medication_requests.id _(JSDOC_ENTIDAD, `src/modules/clinical/entities/medication_requests.entity.ts:246`)_ | coincide |
| 33 | `issue_idempotency_key` | `varchar` | Opcional | + v4.0.9 (ALOVIDA CAN §6, MISSING_IDEMPOTENCY): la emisión de una receta no era idempotente y un reintento del cliente podía re-ejecutar el sellado. Con la clave, el reintento devuelve la receta ya emitida en vez de emitir otra. Nullable: las emisiones históricas no la traen, y por eso su índice único es PARCIAL — no se les exige retroactivamente. _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_08_clinical.puml:496`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | encounter_id | clinical.encounters (id) | fk_medication_requests_encounter_id |
| hacia | indication_condition_id | clinical.conditions (id) | fk_medication_requests_indication_condition_id |
| hacia | replaces_request_id | clinical.medication_requests (id) | fk_medication_requests_replaces_request_id |
| hacia | replaced_by_request_id | clinical.medication_requests (id) | fk_medication_requests_replaced_by_request_id |
| hacia | renewed_from_request_id | clinical.medication_requests (id) | fk_medication_requests_renewed_from_request_id |
| hacia | custodian_tenant_id | directory.tenants (id) | fk_medication_requests_custodian_tenant_id |
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_medication_requests_patient_profile_id |
| hacia | medication_concept_id | terminology.catalog_concepts (id) | fk_medication_requests_medication_concept_id |
| hacia | substance_atc_concept_id | terminology.catalog_concepts (id) | fk_medication_requests_substance_atc_concept_id |
| hacia | intent_concept_id | terminology.catalog_concepts (id) | fk_medication_requests_intent_concept_id |
| hacia | status_concept_id | terminology.catalog_concepts (id) | fk_medication_requests_status_concept_id |
| hacia | prescriber_profile_id | profiles.health_practitioner_profiles (profile_id) | fk_medication_requests_prescriber_profile_id |
| hacia | route_concept_id | terminology.catalog_concepts (id) | fk_medication_requests_route_concept_id |
| hacia | unit_concept_id | terminology.catalog_concepts (id) | fk_medication_requests_unit_concept_id |
| hacia | form_instance_id | forms.form_instances (id) | fk_medication_requests_form_instance_id |
| hacia | created_by_user_id | iam.users (id) | fk_medication_requests_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_medication_requests_updated_by_user_id |
| hacia | signed_by_user_id | iam.users (id) | fk_medication_requests_signed_by_user_id |
| desde | id | clinical.medication_requests (replaces_request_id) | fk_medication_requests_replaces_request_id |
| desde | id | clinical.medication_requests (replaced_by_request_id) | fk_medication_requests_replaced_by_request_id |
| desde | id | clinical.medication_requests (renewed_from_request_id) | fk_medication_requests_renewed_from_request_id |
| desde | id | clinical.medication_records (request_id) | fk_medication_records_request_id |
| desde | id | audit.medication_requests_history (medication_request_id) | fk_medication_requests_history_medication_request_id |
| desde | id | pharmacy_inventory.inventory_reservations (medication_request_id) | fk_inventory_reservations_medication_request_id |
| desde | id | pharmacy_inventory.medication_dispensations (medication_request_id) | fk_medication_dispensations_medication_request_id |
| desde | id | insurance.prior_authorization_requests (medication_request_id) | fk_prior_authorization_requests_medication_request_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_medication_requests_custodian_tenant_id` | no | custodian_tenant_id | Soporta la clave foránea fk_medication_requests_custodian_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 2 consulta(s) de repositorio filtran u ordenan por «custodian_tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_medication_requests_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_medication_requests_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 6 consulta(s) de repositorio filtran u ordenan por «patient_profile_id», la primera columna del índice _(CONSULTA)_ |
| `ix_medication_requests_encounter_id` | no | encounter_id | Soporta la clave foránea fk_medication_requests_encounter_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 2 consulta(s) de repositorio filtran u ordenan por «encounter_id», la primera columna del índice _(CONSULTA)_ |
| `ix_medication_requests_medication_concept_id` | no | medication_concept_id | Soporta la clave foránea fk_medication_requests_medication_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_requests_substance_atc_concept_id` | no | substance_atc_concept_id | Soporta la clave foránea fk_medication_requests_substance_atc_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_requests_intent_concept_id` | no | intent_concept_id | Soporta la clave foránea fk_medication_requests_intent_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_requests_status_concept_id` | no | status_concept_id | Soporta la clave foránea fk_medication_requests_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_requests_prescriber_profile_id` | no | prescriber_profile_id | Soporta la clave foránea fk_medication_requests_prescriber_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_requests_route_concept_id` | no | route_concept_id | Soporta la clave foránea fk_medication_requests_route_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_requests_unit_concept_id` | no | unit_concept_id | Soporta la clave foránea fk_medication_requests_unit_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_requests_indication_condition_id` | no | indication_condition_id | Soporta la clave foránea fk_medication_requests_indication_condition_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_requests_form_instance_id` | no | form_instance_id | Soporta la clave foránea fk_medication_requests_form_instance_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_requests_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_medication_requests_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «created_by_user_id», la primera columna del índice _(CONSULTA)_ |
| `ix_medication_requests_updated_by_user_id` | no | updated_by_user_id | Soporta la clave foránea fk_medication_requests_updated_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_medication_requests_custodian_tenant_id_status_concept_id` | no | custodian_tenant_id, status_concept_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_medication_requests_patient_profile_id_updated_at` | no | custodian_tenant_id, patient_profile_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |
| `uq_medication_requests_issue_idempotency_key` | sí | issue_idempotency_key donde WHERE issue_idempotency_key IS NOT NULL | Garantiza que no se repita la combinación (issue_idempotency_key) _(DOCUMENTO)_; Índice parcial: sólo indexa las filas donde WHERE issue_idempotency_key IS NOT NULL _(ESTRUCTURAL)_; 1 consulta(s) de repositorio filtran u ordenan por «issue_idempotency_key», la primera columna del índice _(CONSULTA)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `uq_medication_requests_issue_idempotency_key` | UNIQUE INDEX | UNIQUE INDEX ("issue_idempotency_key") WHERE issue_idempotency_key IS NOT NULL |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| GET /charts/encounters/{id}/pdf | LEE | DIRECTA |
| GET /charts/me/encounters/{id}/pdf | LEE | DIRECTA |
| POST /clinical/encounters/{id}/close | LEE | DIRECTA |
| POST /clinical/encounters/{id}/discharge | LEE | DIRECTA |
| POST /clinical/internal/prescription-expiry-notices | LEE | POR_SQL |
| POST /clinical/medication-records | ACTUALIZA | POR_TIPO |
| POST /clinical/medication-records | LEE | DIRECTA |
| POST /clinical/medication-requests | CREA | DIRECTA |
| GET /clinical/medication-requests/{id}/attachments | LEE | DIRECTA |
| POST /clinical/medication-requests/{id}/attachments | LEE | DIRECTA |
| POST /clinical/medication-requests/{id}/edit | ACTUALIZA | POR_TIPO |
| POST /clinical/medication-requests/{id}/edit | LEE | DIRECTA |
| POST /clinical/medication-requests/{id}/invalidate | ACTUALIZA | POR_TIPO |
| POST /clinical/medication-requests/{id}/invalidate | LEE | DIRECTA |
| POST /clinical/medication-requests/{id}/issue | ACTUALIZA | POR_TIPO |
| POST /clinical/medication-requests/{id}/issue | LEE | DIRECTA |
| POST /clinical/medication-requests/{id}/renew | CREA | DIRECTA |
| POST /clinical/medication-requests/{id}/renew | LEE | DIRECTA |
| POST /clinical/medication-requests/{id}/replace | ACTUALIZA | POR_TIPO |
| POST /clinical/medication-requests/{id}/replace | CREA | DIRECTA |
| POST /clinical/medication-requests/{id}/replace | LEE | DIRECTA |
| POST /clinical/medication-requests/{id}/sign | ACTUALIZA | POR_TIPO |
| POST /clinical/medication-requests/{id}/sign | LEE | DIRECTA |
| GET /clinical/patients/{patientProfileId}/summary | LEE | DIRECTA |
| GET /clinical/prescriptions/{id}/pdf | LEE | DIRECTA |
| GET /public/prescriptions/{id}/verify | LEE | DIRECTA |
| GET /clinical/prescription-shares | LEE | DIRECTA |
| POST /clinical/prescription-shares | LEE | DIRECTA |
| GET /public/prescription-shares/{token} | LEE | DIRECTA |
| POST /internal/reservations/expire | LEE | DIRECTA |
| POST /pharmacy/{pharmacyId}/dispensations | LEE | DIRECTA |
| POST /pharmacy/{pharmacyId}/reservations | LEE | DIRECTA |
| GET /pharmacy/orders | LEE | DIRECTA |
| POST /pharmacy/orders | LEE | DIRECTA |
| GET /pharmacy/orders/{id} | LEE | DIRECTA |
| POST /pharmacy/orders/{id}/accept-substitutions | LEE | DIRECTA |
| POST /pharmacy/orders/{id}/cancel | LEE | DIRECTA |
| POST /pharmacy/orders/{id}/confirm | LEE | DIRECTA |
| POST /pharmacy/orders/{id}/dispense | LEE | DIRECTA |
| POST /pharmacy/orders/{id}/prefer-original | LEE | DIRECTA |
| POST /pharmacy/orders/{id}/ready | LEE | DIRECTA |
| POST /pharmacy/orders/{id}/reject | LEE | DIRECTA |
| POST /pharmacy/orders/{id}/review | LEE | DIRECTA |
| GET /pharmacy/orders/me | LEE | DIRECTA |
| GET /pharmacy/prescription-shares/{token} | LEE | DIRECTA |
| GET /profiles/practitioners | LEE | POR_SQL |
| PATCH /profiles/practitioners/{profileId} | LEE | DIRECTA |
| DELETE /profiles/practitioners/{profileId}/photo | LEE | DIRECTA |
| PUT /profiles/practitioners/{profileId}/photo | LEE | DIRECTA |
| GET /profiles/practitioners/{profileId}/summary | LEE | DIRECTA |
| PATCH /profiles/practitioners/me | LEE | DIRECTA |
| GET /profiles/practitioners/me/summary | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### observation_components

#### Vista general

Desglosa observaciones compuestas en componentes ordenados para preservar cada resultado y su tipo de valor de manera interpretable.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: observation_components`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `ObservationComponents` — `src/modules/clinical/entities/observation_components.entity.ts`
- **Resumen:** 23 columnas · 10 índices · 10 FK salientes · 1 entrantes · 2 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/observation_components.entity.ts:12`)_ | coincide |
| 2 | `observation_id` | `uuid` | Clave foránea → clinical.observations.id; Obligatoria | _sin dato_ | coincide |
| 3 | `code_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 4 | `value_type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `value_decimal` | `numeric` | Opcional | _sin dato_ | coincide |
| 6 | `value_integer` | `bigint` | Opcional | _sin dato_ | coincide |
| 7 | `value_boolean` | `boolean` | Opcional | _sin dato_ | coincide |
| 8 | `value_text` | `text` | Opcional | _sin dato_ | coincide |
| 9 | `value_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `value_datetime` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 11 | `quantity_value` | `numeric` | Opcional | _sin dato_ | coincide |
| 12 | `quantity_unit_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 13 | `range_low_value` | `numeric` | Opcional | _sin dato_ | coincide |
| 14 | `range_high_value` | `numeric` | Opcional | _sin dato_ | coincide |
| 15 | `range_unit_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 16 | `data_absent_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 17 | `interpretation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 18 | `ordinal` | `integer` | Obligatoria | _sin dato_ | coincide |
| 19 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/observation_components.entity.ts:156`)_ | coincide |
| 20 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/observation_components.entity.ts:162`)_ | coincide |
| 21 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 22 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 23 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/observation_components.entity.ts:180`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | observation_id | clinical.observations (id) | fk_observation_components_observation_id |
| hacia | code_concept_id | terminology.catalog_concepts (id) | fk_observation_components_code_concept_id |
| hacia | value_type_concept_id | terminology.catalog_concepts (id) | fk_observation_components_value_type_concept_id |
| hacia | value_concept_id | terminology.catalog_concepts (id) | fk_observation_components_value_concept_id |
| hacia | quantity_unit_concept_id | terminology.catalog_concepts (id) | fk_observation_components_quantity_unit_concept_id |
| hacia | range_unit_concept_id | terminology.catalog_concepts (id) | fk_observation_components_range_unit_concept_id |
| hacia | data_absent_reason_concept_id | terminology.catalog_concepts (id) | fk_observation_components_data_absent_reason_concept_id |
| hacia | interpretation_concept_id | terminology.catalog_concepts (id) | fk_observation_components_interpretation_concept_id |
| hacia | created_by_user_id | iam.users (id) | fk_observation_components_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_observation_components_updated_by_user_id |
| desde | id | clinical.observation_reference_ranges (observation_component_id) | fk_observation_reference_ranges_observation_component_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_observation_components_observation_id` | no | observation_id | Soporta la clave foránea fk_observation_components_observation_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «observation_id», la primera columna del índice _(CONSULTA)_ |
| `ix_observation_components_code_concept_id` | no | code_concept_id | Soporta la clave foránea fk_observation_components_code_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observation_components_value_type_concept_id` | no | value_type_concept_id | Soporta la clave foránea fk_observation_components_value_type_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observation_components_value_concept_id` | no | value_concept_id | Soporta la clave foránea fk_observation_components_value_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observation_components_quantity_unit_concept_id` | no | quantity_unit_concept_id | Soporta la clave foránea fk_observation_components_quantity_unit_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observation_components_range_unit_concept_id` | no | range_unit_concept_id | Soporta la clave foránea fk_observation_components_range_unit_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observation_components_data_absent_reason_concept_id` | no | data_absent_reason_concept_id | Soporta la clave foránea fk_observation_components_data_absent_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observation_components_interpretation_concept_id` | no | interpretation_concept_id | Soporta la clave foránea fk_observation_components_interpretation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observation_components_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_observation_components_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observation_components_updated_by_user_id` | no | updated_by_user_id | Soporta la clave foránea fk_observation_components_updated_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /clinical/observations | CREA | DIRECTA |
| PATCH /clinical/observations/{id}/amend | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### observation_notes

#### Vista general

Guarda notas narrativas complementarias sobre una observación cuando el dato codificado requiere contexto clínico adicional.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: observation_notes`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `ObservationNotes` — `src/modules/clinical/entities/observation_notes.entity.ts`
- **Resumen:** 5 columnas · 2 índices · 2 FK salientes · 0 entrantes · 2 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/observation_notes.entity.ts:12`)_ | coincide |
| 2 | `observation_id` | `uuid` | Clave foránea → clinical.observations.id; Obligatoria | _sin dato_ | coincide |
| 3 | `author_user_id` | `uuid` | Clave foránea → iam.users.id; Obligatoria | _sin dato_ | coincide |
| 4 | `note_text` | `text` | Obligatoria | _sin dato_ | coincide |
| 5 | `recorded_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | observation_id | clinical.observations (id) | fk_observation_notes_observation_id |
| hacia | author_user_id | iam.users (id) | fk_observation_notes_author_user_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_observation_notes_observation_id` | no | observation_id | Soporta la clave foránea fk_observation_notes_observation_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observation_notes_author_user_id` | no | author_user_id | Soporta la clave foránea fk_observation_notes_author_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /clinical/observations | CREA | DIRECTA |
| PATCH /clinical/observations/{id}/amend | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### observation_performers

#### Vista general

Atribuye quién o qué dispositivo realizó una observación para dar procedencia al resultado clínico.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: observation_performers`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `ObservationPerformers` — `src/modules/clinical/entities/observation_performers.entity.ts`
- **Resumen:** 8 columnas · 4 índices · 4 FK salientes · 0 entrantes · 1 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/observation_performers.entity.ts:12`)_ | coincide |
| 2 | `observation_id` | `uuid` | Clave foránea → clinical.observations.id; Obligatoria | _sin dato_ | coincide |
| 3 | `performer_type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 4 | `performer_id` | `uuid` | Obligatoria | _sin dato_ | coincide |
| 5 | `performer_role_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 6 | `ordinal` | `integer` | Obligatoria | _sin dato_ | coincide |
| 7 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/observation_performers.entity.ts:52`)_ | coincide |
| 8 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | observation_id | clinical.observations (id) | fk_observation_performers_observation_id |
| hacia | performer_type_concept_id | terminology.catalog_concepts (id) | fk_observation_performers_performer_type_concept_id |
| hacia | performer_role_concept_id | terminology.catalog_concepts (id) | fk_observation_performers_performer_role_concept_id |
| hacia | created_by_user_id | iam.users (id) | fk_observation_performers_created_by_user_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_observation_performers_observation_id` | no | observation_id | Soporta la clave foránea fk_observation_performers_observation_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observation_performers_performer_type_concept_id` | no | performer_type_concept_id | Soporta la clave foránea fk_observation_performers_performer_type_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observation_performers_performer_role_concept_id` | no | performer_role_concept_id | Soporta la clave foránea fk_observation_performers_performer_role_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observation_performers_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_observation_performers_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /clinical/observations | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### observation_reference_ranges

#### Vista general

Asocia rangos de referencia a observaciones o componentes para contextualizar la interpretación de resultados medibles.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: observation_reference_ranges`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `ObservationReferenceRanges` — `src/modules/clinical/entities/observation_reference_ranges.entity.ts`
- **Resumen:** 13 columnas · 6 índices · 6 FK salientes · 0 entrantes · 1 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/observation_reference_ranges.entity.ts:12`)_ | coincide |
| 2 | `observation_id` | `uuid` | Clave foránea → clinical.observations.id; Obligatoria | _sin dato_ | coincide |
| 3 | `observation_component_id` | `uuid` | Clave foránea → clinical.observation_components.id; Opcional | _sin dato_ | coincide |
| 4 | `low_value` | `numeric` | Opcional | _sin dato_ | coincide |
| 5 | `high_value` | `numeric` | Opcional | _sin dato_ | coincide |
| 6 | `unit_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 7 | `type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 8 | `applies_to_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 9 | `age_low_years` | `numeric` | Opcional | _sin dato_ | coincide |
| 10 | `age_high_years` | `numeric` | Opcional | _sin dato_ | coincide |
| 11 | `text` | `varchar` | Opcional | _sin dato_ | coincide |
| 12 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/observation_reference_ranges.entity.ts:94`)_ | coincide |
| 13 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | observation_id | clinical.observations (id) | fk_observation_reference_ranges_observation_id |
| hacia | observation_component_id | clinical.observation_components (id) | fk_observation_reference_ranges_observation_component_id |
| hacia | unit_concept_id | terminology.catalog_concepts (id) | fk_observation_reference_ranges_unit_concept_id |
| hacia | type_concept_id | terminology.catalog_concepts (id) | fk_observation_reference_ranges_type_concept_id |
| hacia | applies_to_concept_id | terminology.catalog_concepts (id) | fk_observation_reference_ranges_applies_to_concept_id |
| hacia | created_by_user_id | iam.users (id) | fk_observation_reference_ranges_created_by_user_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_observation_reference_ranges_observation_id` | no | observation_id | Soporta la clave foránea fk_observation_reference_ranges_observation_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observation_reference_ranges_observation_component_id` | no | observation_component_id | Soporta la clave foránea fk_observation_reference_ranges_observation_component_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observation_reference_ranges_unit_concept_id` | no | unit_concept_id | Soporta la clave foránea fk_observation_reference_ranges_unit_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observation_reference_ranges_type_concept_id` | no | type_concept_id | Soporta la clave foránea fk_observation_reference_ranges_type_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observation_reference_ranges_applies_to_concept_id` | no | applies_to_concept_id | Soporta la clave foránea fk_observation_reference_ranges_applies_to_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observation_reference_ranges_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_observation_reference_ranges_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /clinical/observations | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### observations

#### Vista general

Conserva hallazgos y mediciones clínicas codificados, tipados y vinculables al paciente, encuentro, solicitud y método de obtención.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: observations`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `Observations` — `src/modules/clinical/entities/observations.entity.ts`
- **Resumen:** 44 columnas · 28 índices · 24 FK salientes · 13 entrantes · 10 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/observations.entity.ts:12`)_ | coincide |
| 2 | `custodian_tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 3 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 4 | `encounter_id` | `uuid` | Clave foránea → clinical.encounters.id; Opcional | _sin dato_ | coincide |
| 5 | `based_on_service_request_id` | `uuid` | Clave foránea → clinical.service_requests.id; Opcional | _sin dato_ | coincide |
| 6 | `category_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 7 | `code_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 8 | `status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 9 | `value_type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 10 | `value_decimal` | `numeric` | Opcional | _sin dato_ | coincide |
| 11 | `value_integer` | `bigint` | Opcional | _sin dato_ | coincide |
| 12 | `value_boolean` | `boolean` | Opcional | _sin dato_ | coincide |
| 13 | `value_text` | `text` | Opcional | _sin dato_ | coincide |
| 14 | `value_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 15 | `value_datetime` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 16 | `value_date` | `date` | Opcional | _sin dato_ | coincide |
| 17 | `quantity_value` | `numeric` | Opcional | _sin dato_ | coincide |
| 18 | `quantity_unit_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 19 | `range_low_value` | `numeric` | Opcional | _sin dato_ | coincide |
| 20 | `range_high_value` | `numeric` | Opcional | _sin dato_ | coincide |
| 21 | `range_unit_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 22 | `ratio_numerator_value` | `numeric` | Opcional | _sin dato_ | coincide |
| 23 | `ratio_numerator_unit_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 24 | `ratio_denominator_value` | `numeric` | Opcional | _sin dato_ | coincide |
| 25 | `ratio_denominator_unit_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 26 | `sampled_data_json` | `jsonb` | Opcional | _sin dato_ | coincide |
| 27 | `value_file_id` | `uuid` | Clave foránea → common.files.id; Opcional | _sin dato_ | coincide |
| 28 | `value_reference_type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 29 | `value_reference_id` | `uuid` | Opcional | _sin dato_ | coincide |
| 30 | `data_absent_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 31 | `interpretation_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 32 | `method_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 33 | `body_site_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 34 | `specimen_id` | `uuid` | Clave foránea → diagnostics.specimens.id; Opcional | _sin dato_ | coincide |
| 35 | `source_device_id` | `uuid` | Clave foránea → iam.devices.id; Opcional | _sin dato_ | coincide |
| 36 | `effective_start_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 37 | `effective_end_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 38 | `issued_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 39 | `recorded_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 40 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/observations.entity.ts:323`)_ | coincide |
| 41 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/observations.entity.ts:329`)_ | coincide |
| 42 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 43 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 44 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/observations.entity.ts:347`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | encounter_id | clinical.encounters (id) | fk_observations_encounter_id |
| hacia | based_on_service_request_id | clinical.service_requests (id) | fk_observations_based_on_service_request_id |
| hacia | custodian_tenant_id | directory.tenants (id) | fk_observations_custodian_tenant_id |
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_observations_patient_profile_id |
| hacia | category_concept_id | terminology.catalog_concepts (id) | fk_observations_category_concept_id |
| hacia | code_concept_id | terminology.catalog_concepts (id) | fk_observations_code_concept_id |
| hacia | status_concept_id | terminology.catalog_concepts (id) | fk_observations_status_concept_id |
| hacia | value_type_concept_id | terminology.catalog_concepts (id) | fk_observations_value_type_concept_id |
| hacia | value_concept_id | terminology.catalog_concepts (id) | fk_observations_value_concept_id |
| hacia | quantity_unit_concept_id | terminology.catalog_concepts (id) | fk_observations_quantity_unit_concept_id |
| hacia | range_unit_concept_id | terminology.catalog_concepts (id) | fk_observations_range_unit_concept_id |
| hacia | ratio_numerator_unit_concept_id | terminology.catalog_concepts (id) | fk_observations_ratio_numerator_unit_concept_id |
| hacia | ratio_denominator_unit_concept_id | terminology.catalog_concepts (id) | fk_observations_ratio_denominator_unit_concept_id |
| hacia | value_file_id | common.files (id) | fk_observations_value_file_id |
| hacia | value_reference_type_concept_id | terminology.catalog_concepts (id) | fk_observations_value_reference_type_concept_id |
| hacia | data_absent_reason_concept_id | terminology.catalog_concepts (id) | fk_observations_data_absent_reason_concept_id |
| hacia | interpretation_concept_id | terminology.catalog_concepts (id) | fk_observations_interpretation_concept_id |
| hacia | method_concept_id | terminology.catalog_concepts (id) | fk_observations_method_concept_id |
| hacia | body_site_concept_id | terminology.catalog_concepts (id) | fk_observations_body_site_concept_id |
| hacia | specimen_id | diagnostics.specimens (id) | fk_observations_specimen_id |
| hacia | source_device_id | iam.devices (id) | fk_observations_source_device_id |
| hacia | recorded_by_user_id | iam.users (id) | fk_observations_recorded_by_user_id |
| hacia | created_by_user_id | iam.users (id) | fk_observations_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_observations_updated_by_user_id |
| desde | id | clinical.observation_components (observation_id) | fk_observation_components_observation_id |
| desde | id | clinical.observation_performers (observation_id) | fk_observation_performers_observation_id |
| desde | id | clinical.observation_reference_ranges (observation_id) | fk_observation_reference_ranges_observation_id |
| desde | id | clinical.observation_notes (observation_id) | fk_observation_notes_observation_id |
| desde | id | diagnostics.observation_specimens (observation_id) | fk_observation_specimens_observation_id |
| desde | id | diagnostics.diagnostic_report_results (observation_id) | fk_diagnostic_report_results_observation_id |
| desde | id | diagnostics.laboratory_work_order_tests (observation_id) | fk_laboratory_work_order_tests_observation_id |
| desde | id | diagnostics.analyzer_result_messages (mapped_observation_id) | fk_analyzer_result_messages_mapped_observation_id |
| desde | id | diagnostics.critical_result_notifications (observation_id) | fk_critical_result_notifications_observation_id |
| desde | id | health_context.context_fact_evidence (source_observation_id) | fk_context_fact_evidence_source_observation_id |
| desde | id | procedures_perioperative.anesthesia_events (observation_id) | fk_anesthesia_events_observation_id |
| desde | id | procedures_perioperative.operative_findings (observation_id) | fk_operative_findings_observation_id |
| desde | id | procedures_perioperative.procedure_outcomes (observation_id) | fk_procedure_outcomes_observation_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_observations_custodian_tenant_id` | no | custodian_tenant_id | Soporta la clave foránea fk_observations_custodian_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_observations_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «patient_profile_id», la primera columna del índice _(CONSULTA)_ |
| `ix_observations_encounter_id` | no | encounter_id | Soporta la clave foránea fk_observations_encounter_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_based_on_service_request_id` | no | based_on_service_request_id | Soporta la clave foránea fk_observations_based_on_service_request_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_category_concept_id` | no | category_concept_id | Soporta la clave foránea fk_observations_category_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_code_concept_id` | no | code_concept_id | Soporta la clave foránea fk_observations_code_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_status_concept_id` | no | status_concept_id | Soporta la clave foránea fk_observations_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_value_type_concept_id` | no | value_type_concept_id | Soporta la clave foránea fk_observations_value_type_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_value_concept_id` | no | value_concept_id | Soporta la clave foránea fk_observations_value_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_quantity_unit_concept_id` | no | quantity_unit_concept_id | Soporta la clave foránea fk_observations_quantity_unit_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_range_unit_concept_id` | no | range_unit_concept_id | Soporta la clave foránea fk_observations_range_unit_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_ratio_numerator_unit_concept_id` | no | ratio_numerator_unit_concept_id | Soporta la clave foránea fk_observations_ratio_numerator_unit_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_ratio_denominator_unit_concept_id` | no | ratio_denominator_unit_concept_id | Soporta la clave foránea fk_observations_ratio_denominator_unit_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_value_file_id` | no | value_file_id | Soporta la clave foránea fk_observations_value_file_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_value_reference_type_concept_id` | no | value_reference_type_concept_id | Soporta la clave foránea fk_observations_value_reference_type_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_data_absent_reason_concept_id` | no | data_absent_reason_concept_id | Soporta la clave foránea fk_observations_data_absent_reason_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_interpretation_concept_id` | no | interpretation_concept_id | Soporta la clave foránea fk_observations_interpretation_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_method_concept_id` | no | method_concept_id | Soporta la clave foránea fk_observations_method_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_body_site_concept_id` | no | body_site_concept_id | Soporta la clave foránea fk_observations_body_site_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_specimen_id` | no | specimen_id | Soporta la clave foránea fk_observations_specimen_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_source_device_id` | no | source_device_id | Soporta la clave foránea fk_observations_source_device_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_recorded_by_user_id` | no | recorded_by_user_id | Soporta la clave foránea fk_observations_recorded_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_observations_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_updated_by_user_id` | no | updated_by_user_id | Soporta la clave foránea fk_observations_updated_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_observations_custodian_tenant_id_status_concept_id` | no | custodian_tenant_id, status_concept_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_observations_patient_profile_id_updated_at` | no | custodian_tenant_id, patient_profile_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_observations_patient_code_effective` | no | custodian_tenant_id, patient_profile_id, code_concept_id, ("effective_start_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_observations_encounter_code` | no | encounter_id, code_concept_id donde WHERE encounter_id IS NOT NULL | Soporta la clave foránea fk_observations_encounter_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; Índice parcial: sólo indexa las filas donde WHERE encounter_id IS NOT NULL _(ESTRUCTURAL)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /clinical/observations | CREA | DIRECTA |
| PATCH /clinical/observations/{id}/amend | ACTUALIZA | POR_TIPO |
| PATCH /clinical/observations/{id}/amend | LEE | DIRECTA |
| GET /clinical/patients/{patientProfileId}/summary | LEE | DIRECTA |
| POST /diagnostics/analyzer-runs/{id}/messages | LEE | DIRECTA |
| POST /diagnostics/critical-results | LEE | DIRECTA |
| POST /diagnostics/data-quality-events | LEE | DIRECTA |
| POST /diagnostics/reports/{reportId}/versions | LEE | DIRECTA |
| POST /diagnostics/results/{observationId}/verifications | LEE | DIRECTA |
| POST /ts/normalize/run | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### patient_admission_footprints

#### Vista general

_Sin propósito registrado._

- **Estado del propósito:** PENDING_REVIEW
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** **sin entidad** (deriva)
- **Resumen:** 13 columnas · 8 índices · 8 FK salientes · 0 entrantes · 9 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 2 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 3 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 4 | `encounter_id` | `uuid` | Clave foránea → clinical.encounters.id; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 5 | `practice_site_id` | `uuid` | Clave foránea → practice.practice_sites.id; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 6 | `admission_origin_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 7 | `identity_verification_method_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 8 | `identity_document_type` | `varchar(32)` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 9 | `identity_document_last4` | `varchar(4)` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 10 | `identity_document_hmac` | `varchar(64)` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 11 | `referral_id` | `uuid` | Clave foránea → clinical_ext.referrals.id; Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 12 | `recorded_by_user_id` | `uuid` | Clave foránea → iam.users.id; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 13 | `created_at` | `timestamptz` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | encounter_id | clinical.encounters (id) | fk_patient_admission_footprints_encounter_id |
| hacia | tenant_id | directory.tenants (id) | fk_patient_admission_footprints_tenant_id |
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_patient_admission_footprints_patient_profile_id |
| hacia | practice_site_id | practice.practice_sites (id) | fk_patient_admission_footprints_practice_site_id |
| hacia | admission_origin_concept_id | terminology.catalog_concepts (id) | fk_patient_admission_footprints_admission_origin_concept_id |
| hacia | identity_verification_method_concept_id | terminology.catalog_concepts (id) | fk_patient_admission_footprints_identity_verification__4ddbb04f |
| hacia | referral_id | clinical_ext.referrals (id) | fk_patient_admission_footprints_referral_id |
| hacia | recorded_by_user_id | iam.users (id) | fk_patient_admission_footprints_recorded_by_user_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ux_patient_admission_footprints_tenant_patient` | sí | tenant_id, patient_profile_id | Garantiza que no se repita la combinación (tenant_id, patient_profile_id) _(DOCUMENTO)_; Soporta la clave foránea fk_patient_admission_footprints_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_patient_admission_footprints_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_patient_admission_footprints_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_patient_admission_footprints_encounter_id` | no | encounter_id | Soporta la clave foránea fk_patient_admission_footprints_encounter_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_patient_admission_footprints_practice_site_id` | no | practice_site_id | Soporta la clave foránea fk_patient_admission_footprints_practice_site_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_patient_admission_footprints_admission_origin_concept_id` | no | admission_origin_concept_id | Soporta la clave foránea fk_patient_admission_footprints_admission_origin_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_patient_admission_footprints_identity_verification__51230394` | no | identity_verification_method_concept_id | Soporta la clave foránea fk_patient_admission_footprints_identity_verification__4ddbb04f: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_patient_admission_footprints_referral_id` | no | referral_id | Soporta la clave foránea fk_patient_admission_footprints_referral_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_patient_admission_footprints_recorded_by_user_id` | no | recorded_by_user_id | Soporta la clave foránea fk_patient_admission_footprints_recorded_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `ux_patient_admission_footprints_tenant_patient` | UNIQUE INDEX | UNIQUE INDEX ("tenant_id", "patient_profile_id") |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /authz/care-relationships | LEE | POR_SQL |
| POST /authz/legal-representations | LEE | POR_SQL |
| POST /authz/patients/{patientProfileId}/break-the-glass | LEE | POR_SQL |
| POST /authz/patients/{patientProfileId}/clinical-access-grants | LEE | POR_SQL |
| POST /clinical/admissions | CREA | POR_SQL |
| POST /clinical/admissions | LEE | POR_SQL |
| POST /clinical/bed-compatibility | LEE | POR_SQL |
| POST /clinical/encounters/check-in | LEE | POR_SQL |
| GET /clinical/patients/{id}/inpatient-stay | LEE | POR_SQL |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### placement_incidents

#### Vista general

Registra la ubicación de un paciente que viola reglas de compatibilidad de cama (sexo, aislamiento, edad, categoría) con su justificación, autorización y revisión.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: placement_incidents`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `PlacementIncidents` — `src/modules/clinical/entities/placement_incidents.entity.ts`
- **Resumen:** 18 columnas · 11 índices · 10 FK salientes · 2 entrantes · 8 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/placement_incidents.entity.ts:12`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 3 | `encounter_id` | `uuid` | Clave foránea → clinical.encounters.id; Obligatoria | _sin dato_ | coincide |
| 4 | `encounter_location_id` | `uuid` | Clave foránea → clinical.encounter_locations.id; Opcional | _sin dato_ | coincide |
| 5 | `care_space_id` | `uuid` | Clave foránea → practice.care_spaces.id; Obligatoria | _sin dato_ | coincide |
| 6 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 7 | `violations_json` | `jsonb` | Obligatoria | _sin dato_ | coincide |
| 8 | `justification_text` | `text` | Obligatoria | _sin dato_ | coincide |
| 9 | `authorized_by_user_id` | `uuid` | Clave foránea → iam.users.id; Obligatoria | _sin dato_ | coincide |
| 10 | `status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 11 | `reviewed_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 12 | `reviewed_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 13 | `review_note` | `text` | Opcional | _sin dato_ | coincide |
| 14 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/placement_incidents.entity.ts:98`)_ | coincide |
| 15 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/placement_incidents.entity.ts:104`)_ | coincide |
| 16 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 17 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 18 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/placement_incidents.entity.ts:122`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | encounter_id | clinical.encounters (id) | fk_placement_incidents_encounter_id |
| hacia | encounter_location_id | clinical.encounter_locations (id) | fk_placement_incidents_encounter_location_id |
| hacia | tenant_id | directory.tenants (id) | fk_placement_incidents_tenant_id |
| hacia | care_space_id | practice.care_spaces (id) | fk_placement_incidents_care_space_id |
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_placement_incidents_patient_profile_id |
| hacia | authorized_by_user_id | iam.users (id) | fk_placement_incidents_authorized_by_user_id |
| hacia | status_concept_id | terminology.catalog_concepts (id) | fk_placement_incidents_status_concept_id |
| hacia | reviewed_by_user_id | iam.users (id) | fk_placement_incidents_reviewed_by_user_id |
| hacia | created_by_user_id | iam.users (id) | fk_placement_incidents_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_placement_incidents_updated_by_user_id |
| desde | id | clinical.encounter_locations (placement_incident_id) | fk_encounter_locations_placement_incident_id |
| desde | id | audit.placement_incidents_history (placement_incident_id) | fk_placement_incidents_history_placement_incident_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_placement_incidents_tenant_id` | no | tenant_id | Soporta la clave foránea fk_placement_incidents_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_placement_incidents_encounter_id` | no | encounter_id | Soporta la clave foránea fk_placement_incidents_encounter_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «encounter_id», la primera columna del índice _(CONSULTA)_ |
| `ix_placement_incidents_encounter_location_id` | no | encounter_location_id | Soporta la clave foránea fk_placement_incidents_encounter_location_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_placement_incidents_care_space_id` | no | care_space_id | Soporta la clave foránea fk_placement_incidents_care_space_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_placement_incidents_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_placement_incidents_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_placement_incidents_authorized_by_user_id` | no | authorized_by_user_id | Soporta la clave foránea fk_placement_incidents_authorized_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_placement_incidents_status_concept_id` | no | status_concept_id | Soporta la clave foránea fk_placement_incidents_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_placement_incidents_reviewed_by_user_id` | no | reviewed_by_user_id | Soporta la clave foránea fk_placement_incidents_reviewed_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_placement_incidents_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_placement_incidents_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_placement_incidents_updated_by_user_id` | no | updated_by_user_id | Soporta la clave foránea fk_placement_incidents_updated_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ux_placement_incidents_tenant_id_id` | sí | tenant_id, id | Garantiza que no se repita la combinación (tenant_id, id) _(DOCUMENTO)_; Soporta la clave foránea fk_placement_incidents_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `ux_placement_incidents_tenant_id_id` | UNIQUE INDEX | UNIQUE INDEX ("tenant_id", "id") |
| `ck_placement_incidents_justification_length` | CHECK | CHECK ((char_length("justification_text") >= 20)) |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /clinical/admissions | CREA | DIRECTA |
| POST /clinical/bed-swaps | CREA | DIRECTA |
| POST /clinical/encounters/{id}/bed-assignment | CREA | DIRECTA |
| GET /clinical/encounters/{id}/stay | LEE | DIRECTA |
| POST /clinical/encounters/{id}/transfer | CREA | DIRECTA |
| GET /clinical/patients/{id}/inpatient-stay | LEE | DIRECTA |
| PATCH /clinical/placement-incidents/{id} | ACTUALIZA | POR_TIPO |
| PATCH /clinical/placement-incidents/{id} | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### prescription_signature_policies

#### Vista general

Define las reglas de firma aplicables a prescripciones para controlar quién puede validarlas y bajo qué requisitos operativos.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: prescription_signature_policies`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `PrescriptionSignaturePolicies` — `src/modules/clinical/entities/prescription_signature_policies.entity.ts`
- **Resumen:** 13 columnas · 1 índices · 5 FK salientes · 0 entrantes · 5 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/prescription_signature_policies.entity.ts:16`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 3 | `jurisdiction_code` | `varchar(16)` | Opcional | Código de jurisdicción (comodín si nulo). _(JSDOC_ENTIDAD, `src/modules/clinical/entities/prescription_signature_policies.entity.ts:26`)_ | coincide |
| 4 | `medication_type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | Tipo de medicamento (concept id); comodín si nulo. FK → terminology.catalog_concepts _(JSDOC_ENTIDAD, `src/modules/clinical/entities/prescription_signature_policies.entity.ts:34`)_ | coincide |
| 5 | `channel_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | Canal de emisión (concept id); comodín si nulo. FK → terminology.catalog_concepts _(JSDOC_ENTIDAD, `src/modules/clinical/entities/prescription_signature_policies.entity.ts:42`)_ | coincide |
| 6 | `signature_required` | `boolean` | Obligatoria | Si la firma es obligatoria cuando esta política aplica. Default FAIL-SAFE. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/prescription_signature_policies.entity.ts:46`)_ | coincide |
| 7 | `effective_from` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 8 | `effective_to` | `timestamptz` | Opcional | Nulo = vigente indefinidamente. Desactivar = poblar con `now` (sin borrado duro). _(JSDOC_ENTIDAD, `src/modules/clinical/entities/prescription_signature_policies.entity.ts:56`)_ | coincide |
| 9 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/prescription_signature_policies.entity.ts:66`)_ | coincide |
| 10 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/prescription_signature_policies.entity.ts:72`)_ | coincide |
| 11 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 12 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 13 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/prescription_signature_policies.entity.ts:90`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | tenant_id | directory.tenants (id) | fk_prescription_signature_policies_tenant_id |
| hacia | medication_type_concept_id | terminology.catalog_concepts (id) | fk_prescription_signature_policies_medication_type_concept_id |
| hacia | channel_concept_id | terminology.catalog_concepts (id) | fk_prescription_signature_policies_channel_concept_id |
| hacia | created_by_user_id | iam.users (id) | fk_prescription_signature_policies_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_prescription_signature_policies_updated_by_user_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_prescription_signature_policies_tenant_id` | no | tenant_id | Soporta la clave foránea fk_prescription_signature_policies_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 2 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /clinical/medication-requests/{id}/issue | LEE | DIRECTA |
| GET /clinical/prescription-signature-policies | LEE | DIRECTA |
| POST /clinical/prescription-signature-policies | CREA | DIRECTA |
| POST /clinical/prescription-signature-policies/{id}/deactivate | ACTUALIZA | POR_TIPO |
| POST /clinical/prescription-signature-policies/{id}/deactivate | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### procedures

#### Vista general

Documenta procedimientos asociados a la atención y enlaza su contexto con el encuentro, las solicitudes y, cuando corresponde, otros procedimientos.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: procedures`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `Procedures` — `src/modules/clinical/entities/procedures.entity.ts`
- **Resumen:** 28 columnas · 15 índices · 18 FK salientes · 14 entrantes · 8 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/procedures.entity.ts:12`)_ | coincide |
| 2 | `custodian_tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 3 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 4 | `encounter_id` | `uuid` | Clave foránea → clinical.encounters.id; Opcional | _sin dato_ | coincide |
| 5 | `code_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 6 | `status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 7 | `performer_profile_id` | `uuid` | Clave foránea → profiles.health_practitioner_profiles.profile_id; Opcional | _sin dato_ | coincide |
| 8 | `performed_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 9 | `note_text` | `text` | Opcional | _sin dato_ | coincide |
| 10 | `service_request_id` | `uuid` | Clave foránea → clinical.service_requests.id; Opcional | _sin dato_ | coincide |
| 11 | `parent_procedure_id` | `uuid` | Clave foránea → clinical.procedures.id; Opcional | _sin dato_ | coincide |
| 12 | `category_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 13 | `status_reason_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 14 | `practice_site_id` | `uuid` | Clave foránea → practice.practice_sites.id; Opcional | _sin dato_ | coincide |
| 15 | `care_space_id` | `uuid` | Clave foránea → practice.care_spaces.id; Opcional | _sin dato_ | coincide |
| 16 | `recorder_profile_id` | `uuid` | Clave foránea → profiles.health_practitioner_profiles.profile_id; Opcional | _sin dato_ | coincide |
| 17 | `outcome_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 18 | `reported_source_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 19 | `occurrence_start_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 20 | `occurrence_end_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 21 | `recorded_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 22 | `follow_up_text` | `text` | Opcional | _sin dato_ | coincide |
| 23 | `operative_report_file_id` | `uuid` | Clave foránea → common.files.id; Opcional | _sin dato_ | coincide |
| 24 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/procedures.entity.ts:178`)_ | coincide |
| 25 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/procedures.entity.ts:184`)_ | coincide |
| 26 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 27 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 28 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/procedures.entity.ts:202`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | encounter_id | clinical.encounters (id) | fk_procedures_encounter_id |
| hacia | service_request_id | clinical.service_requests (id) | fk_procedures_service_request_id |
| hacia | parent_procedure_id | clinical.procedures (id) | fk_procedures_parent_procedure_id |
| hacia | custodian_tenant_id | directory.tenants (id) | fk_procedures_custodian_tenant_id |
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_procedures_patient_profile_id |
| hacia | code_concept_id | terminology.catalog_concepts (id) | fk_procedures_code_concept_id |
| hacia | status_concept_id | terminology.catalog_concepts (id) | fk_procedures_status_concept_id |
| hacia | performer_profile_id | profiles.health_practitioner_profiles (profile_id) | fk_procedures_performer_profile_id |
| hacia | category_concept_id | terminology.catalog_concepts (id) | fk_procedures_category_concept_id |
| hacia | status_reason_concept_id | terminology.catalog_concepts (id) | fk_procedures_status_reason_concept_id |
| hacia | practice_site_id | practice.practice_sites (id) | fk_procedures_practice_site_id |
| hacia | care_space_id | practice.care_spaces (id) | fk_procedures_care_space_id |
| hacia | recorder_profile_id | profiles.health_practitioner_profiles (profile_id) | fk_procedures_recorder_profile_id |
| hacia | outcome_concept_id | terminology.catalog_concepts (id) | fk_procedures_outcome_concept_id |
| hacia | reported_source_concept_id | terminology.catalog_concepts (id) | fk_procedures_reported_source_concept_id |
| hacia | operative_report_file_id | common.files (id) | fk_procedures_operative_report_file_id |
| hacia | created_by_user_id | iam.users (id) | fk_procedures_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_procedures_updated_by_user_id |
| desde | id | clinical.procedures (parent_procedure_id) | fk_procedures_parent_procedure_id |
| desde | id | clinical.received_services (source_procedure_id) | fk_received_services_source_procedure_id |
| desde | id | diagnostics.imaging_procedure_steps (procedure_id) | fk_imaging_procedure_steps_procedure_id |
| desde | id | procedures_perioperative.procedure_cases (primary_procedure_id) | fk_procedure_cases_primary_procedure_id |
| desde | id | procedures_perioperative.operative_steps (procedure_id) | fk_operative_steps_procedure_id |
| desde | id | procedures_perioperative.procedure_body_sites (procedure_id) | fk_procedure_body_sites_procedure_id |
| desde | id | procedures_perioperative.procedure_performers (procedure_id) | fk_procedure_performers_procedure_id |
| desde | id | procedures_perioperative.procedure_devices (procedure_id) | fk_procedure_devices_procedure_id |
| desde | id | procedures_perioperative.procedure_implants (procedure_id) | fk_procedure_implants_procedure_id |
| desde | id | procedures_perioperative.procedure_medication_uses (procedure_id) | fk_procedure_medication_uses_procedure_id |
| desde | id | procedures_perioperative.procedure_specimens (procedure_id) | fk_procedure_specimens_procedure_id |
| desde | id | procedures_perioperative.procedure_complications (procedure_id) | fk_procedure_complications_procedure_id |
| desde | id | procedures_perioperative.operative_reports (procedure_id) | fk_operative_reports_procedure_id |
| desde | id | procedures_perioperative.procedure_charge_items (procedure_id) | fk_procedure_charge_items_procedure_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_procedures_custodian_tenant_id` | no | custodian_tenant_id | Soporta la clave foránea fk_procedures_custodian_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 4 consulta(s) de repositorio filtran u ordenan por «custodian_tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_procedures_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_procedures_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 4 consulta(s) de repositorio filtran u ordenan por «patient_profile_id», la primera columna del índice _(CONSULTA)_ |
| `ix_procedures_encounter_id` | no | encounter_id | Soporta la clave foránea fk_procedures_encounter_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_procedures_code_concept_id` | no | code_concept_id | Soporta la clave foránea fk_procedures_code_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_procedures_status_concept_id` | no | status_concept_id | Soporta la clave foránea fk_procedures_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_procedures_performer_profile_id` | no | performer_profile_id | Soporta la clave foránea fk_procedures_performer_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_procedures_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_procedures_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_procedures_updated_by_user_id` | no | updated_by_user_id | Soporta la clave foránea fk_procedures_updated_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_procedures_custodian_tenant_id_status_concept_id` | no | custodian_tenant_id, status_concept_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_procedures_patient_profile_id_updated_at` | no | custodian_tenant_id, patient_profile_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_procedures_service_request_id` | no | service_request_id | Soporta la clave foránea fk_procedures_service_request_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_procedures_parent_procedure_id` | no | parent_procedure_id | Soporta la clave foránea fk_procedures_parent_procedure_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_procedures_practice_site_id` | no | practice_site_id | Soporta la clave foránea fk_procedures_practice_site_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_procedures_patient_occurrence` | no | custodian_tenant_id, patient_profile_id, ("occurrence_start_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_procedures_code_status_time` | no | custodian_tenant_id, code_concept_id, status_concept_id, ("occurrence_start_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /clinical/procedures | CREA | DIRECTA |
| POST /clinical/procedures | LEE | DIRECTA |
| POST /clinical/procedures/{id}/attachments | LEE | DIRECTA |
| GET /dental-procedures | LEE | DIRECTA |
| POST /dental-procedures | CREA | DIRECTA |
| POST /procedure-cases/{id}/operative-reports | CREA | DIRECTA |
| POST /procedure-cases/{id}/operative-reports | LEE | DIRECTA |
| POST /procedure-cases/{id}/operative-reports/{reportId}/sign | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### received_services

#### Vista general

_Sin propósito registrado._

- **Estado del propósito:** PENDING_REVIEW
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `ReceivedServices` — `src/modules/clinical/entities/received_services.entity.ts`
- **Resumen:** 23 columnas · 18 índices · 17 FK salientes · 0 entrantes · 11 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `custodian_tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 3 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 4 | `encounter_id` | `uuid` | Clave foránea → clinical.encounters.id; Opcional | _sin dato_ | coincide |
| 5 | `service_type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 6 | `service_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 7 | `status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 8 | `source_procedure_id` | `uuid` | Clave foránea → clinical.procedures.id; Opcional | _sin dato_ | coincide |
| 9 | `source_immunization_id` | `uuid` | Clave foránea → clinical.immunizations.id; Opcional | _sin dato_ | coincide |
| 10 | `procedure_case_id` | `uuid` | Clave foránea → procedures_perioperative.procedure_cases.id; Opcional | _sin dato_ | coincide |
| 11 | `service_catalog_id` | `uuid` | Clave foránea → billing.service_catalog.id; Opcional | _sin dato_ | coincide |
| 12 | `invoice_line_id` | `uuid` | Clave foránea → billing.invoice_lines.id; Opcional | _sin dato_ | coincide |
| 13 | `insurance_claim_line_id` | `uuid` | Clave foránea → insurance.insurance_claim_lines.id; Opcional | _sin dato_ | coincide |
| 14 | `performer_profile_id` | `uuid` | Clave foránea → profiles.health_practitioner_profiles.profile_id; Opcional | _sin dato_ | coincide |
| 15 | `practice_site_id` | `uuid` | Clave foránea → practice.practice_sites.id; Opcional | _sin dato_ | coincide |
| 16 | `performed_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 17 | `outcome_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 18 | `result_text` | `text` | Opcional | _sin dato_ | coincide |
| 19 | `created_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 20 | `updated_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 21 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 22 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 23 | `row_version` | `integer = 1` | Obligatoria | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | encounter_id | clinical.encounters (id) | fk_received_services_encounter_id |
| hacia | source_procedure_id | clinical.procedures (id) | fk_received_services_source_procedure_id |
| hacia | source_immunization_id | clinical.immunizations (id) | fk_received_services_source_immunization_id |
| hacia | custodian_tenant_id | directory.tenants (id) | fk_received_services_custodian_tenant_id |
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_received_services_patient_profile_id |
| hacia | service_type_concept_id | terminology.catalog_concepts (id) | fk_received_services_service_type_concept_id |
| hacia | service_concept_id | terminology.catalog_concepts (id) | fk_received_services_service_concept_id |
| hacia | status_concept_id | terminology.catalog_concepts (id) | fk_received_services_status_concept_id |
| hacia | procedure_case_id | procedures_perioperative.procedure_cases (id) | fk_received_services_procedure_case_id |
| hacia | service_catalog_id | billing.service_catalog (id) | fk_received_services_service_catalog_id |
| hacia | invoice_line_id | billing.invoice_lines (id) | fk_received_services_invoice_line_id |
| hacia | insurance_claim_line_id | insurance.insurance_claim_lines (id) | fk_received_services_insurance_claim_line_id |
| hacia | performer_profile_id | profiles.health_practitioner_profiles (profile_id) | fk_received_services_performer_profile_id |
| hacia | practice_site_id | practice.practice_sites (id) | fk_received_services_practice_site_id |
| hacia | outcome_concept_id | terminology.catalog_concepts (id) | fk_received_services_outcome_concept_id |
| hacia | created_by_user_id | iam.users (id) | fk_received_services_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_received_services_updated_by_user_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_received_services_custodian_tenant_id` | no | custodian_tenant_id | Soporta la clave foránea fk_received_services_custodian_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_received_services_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_received_services_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «patient_profile_id», la primera columna del índice _(CONSULTA)_ |
| `ix_received_services_encounter_id` | no | encounter_id | Soporta la clave foránea fk_received_services_encounter_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_received_services_service_type_concept_id` | no | service_type_concept_id | Soporta la clave foránea fk_received_services_service_type_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_received_services_service_concept_id` | no | service_concept_id | Soporta la clave foránea fk_received_services_service_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_received_services_status_concept_id` | no | status_concept_id | Soporta la clave foránea fk_received_services_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `uq_received_services_source_procedure_id` | sí | source_procedure_id donde WHERE source_procedure_id IS NOT NULL | Garantiza que no se repita la combinación (source_procedure_id) _(DOCUMENTO)_; Soporta la clave foránea fk_received_services_source_procedure_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; Índice parcial: sólo indexa las filas donde WHERE source_procedure_id IS NOT NULL _(ESTRUCTURAL)_; 1 consulta(s) de repositorio filtran u ordenan por «source_procedure_id», la primera columna del índice _(CONSULTA)_ |
| `uq_received_services_source_immunization_id` | sí | source_immunization_id donde WHERE source_immunization_id IS NOT NULL | Garantiza que no se repita la combinación (source_immunization_id) _(DOCUMENTO)_; Soporta la clave foránea fk_received_services_source_immunization_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; Índice parcial: sólo indexa las filas donde WHERE source_immunization_id IS NOT NULL _(ESTRUCTURAL)_; 1 consulta(s) de repositorio filtran u ordenan por «source_immunization_id», la primera columna del índice _(CONSULTA)_ |
| `uq_received_services_procedure_case_id` | sí | procedure_case_id donde WHERE procedure_case_id IS NOT NULL | Garantiza que no se repita la combinación (procedure_case_id) _(DOCUMENTO)_; Soporta la clave foránea fk_received_services_procedure_case_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; Índice parcial: sólo indexa las filas donde WHERE procedure_case_id IS NOT NULL _(ESTRUCTURAL)_; 1 consulta(s) de repositorio filtran u ordenan por «procedure_case_id», la primera columna del índice _(CONSULTA)_ |
| `ix_received_services_service_catalog_id` | no | service_catalog_id | Soporta la clave foránea fk_received_services_service_catalog_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_received_services_invoice_line_id` | no | invoice_line_id | Soporta la clave foránea fk_received_services_invoice_line_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_received_services_insurance_claim_line_id` | no | insurance_claim_line_id | Soporta la clave foránea fk_received_services_insurance_claim_line_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_received_services_performer_profile_id` | no | performer_profile_id | Soporta la clave foránea fk_received_services_performer_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_received_services_practice_site_id` | no | practice_site_id | Soporta la clave foránea fk_received_services_practice_site_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_received_services_outcome_concept_id` | no | outcome_concept_id | Soporta la clave foránea fk_received_services_outcome_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_received_services_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_received_services_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_received_services_updated_by_user_id` | no | updated_by_user_id | Soporta la clave foránea fk_received_services_updated_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_received_services_patient_performed_at` | no | custodian_tenant_id, patient_profile_id, ("performed_at" DESC) | _sin uso detectado estáticamente_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `uq_received_services_source_procedure_id` | UNIQUE INDEX | UNIQUE INDEX ("source_procedure_id") WHERE source_procedure_id IS NOT NULL |
| `uq_received_services_source_immunization_id` | UNIQUE INDEX | UNIQUE INDEX ("source_immunization_id") WHERE source_immunization_id IS NOT NULL |
| `uq_received_services_procedure_case_id` | UNIQUE INDEX | UNIQUE INDEX ("procedure_case_id") WHERE procedure_case_id IS NOT NULL |
| `ck_received_services_has_source` | CHECK | CHECK (("source_procedure_id" IS NOT NULL OR "source_immunization_id" IS NOT NULL OR "procedure_case_id" IS NOT NULL)) |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /clinical/immunizations | CREA | DIRECTA |
| POST /clinical/immunizations | LEE | DIRECTA |
| GET /clinical/patients/{patientProfileId}/received-services | LEE | DIRECTA |
| POST /clinical/procedures | CREA | DIRECTA |
| POST /clinical/procedures | LEE | DIRECTA |
| POST /dental-procedures | CREA | DIRECTA |
| POST /dental-procedures | LEE | DIRECTA |
| POST /procedure-cases/{id}/operative-reports | CREA | DIRECTA |
| POST /procedure-cases/{id}/operative-reports | LEE | DIRECTA |
| POST /procedure-cases/{id}/operative-reports/{reportId}/sign | CREA | DIRECTA |
| POST /procedure-cases/{id}/operative-reports/{reportId}/sign | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### service_request_components

#### Vista general

_Sin propósito registrado._

- **Estado del propósito:** PENDING_REVIEW
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `ServiceRequestComponents` — `src/modules/clinical/entities/service_request_components.entity.ts`
- **Resumen:** 7 columnas · 5 índices · 4 FK salientes · 0 entrantes · 11 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | coincide |
| 2 | `service_request_id` | `uuid` | Clave foránea → clinical.service_requests.id; Obligatoria | _sin dato_ | coincide |
| 3 | `custodian_tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 4 | `component_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `ordinal` | `integer` | Obligatoria | _sin dato_ | coincide |
| 6 | `created_at` | `timestamptz` | Obligatoria | _sin dato_ | coincide |
| 7 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | service_request_id | clinical.service_requests (id) | fk_service_request_components_service_request_id |
| hacia | custodian_tenant_id | directory.tenants (id) | fk_service_request_components_custodian_tenant_id |
| hacia | component_concept_id | terminology.catalog_concepts (id) | fk_service_request_components_component_concept_id |
| hacia | created_by_user_id | iam.users (id) | fk_service_request_components_created_by_user_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ux_service_request_components_request_component` | sí | service_request_id, component_concept_id | Garantiza que no se repita la combinación (service_request_id, component_concept_id) _(DOCUMENTO)_; Soporta la clave foránea fk_service_request_components_service_request_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «service_request_id», la primera columna del índice _(CONSULTA)_ |
| `ix_service_request_components_service_request_id` | no | service_request_id | Soporta la clave foránea fk_service_request_components_service_request_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «service_request_id», la primera columna del índice _(CONSULTA)_ |
| `ix_service_request_components_custodian_tenant_id` | no | custodian_tenant_id | Soporta la clave foránea fk_service_request_components_custodian_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_request_components_component_concept_id` | no | component_concept_id | Soporta la clave foránea fk_service_request_components_component_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_request_components_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_service_request_components_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `ux_service_request_components_request_component` | UNIQUE INDEX | UNIQUE INDEX ("service_request_id", "component_concept_id") |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /clinical/requisitions | CREA | DIRECTA |
| POST /clinical/requisitions | LEE | DIRECTA |
| POST /clinical/service-requests | CREA | DIRECTA |
| POST /clinical/service-requests | LEE | DIRECTA |
| GET /clinical/service-requests/{id} | LEE | DIRECTA |
| GET /diagnostic-results/me/orders | LEE | DIRECTA |
| GET /diagnostics/service-requests/{id} | LEE | DIRECTA |
| POST /diagnostics/service-requests/inbox | LEE | DIRECTA |
| POST /diagnostics/service-requests/worklist | LEE | DIRECTA |
| POST /procedure-cases/{id}/preoperative-orders | CREA | DIRECTA |
| POST /procedure-cases/{id}/preoperative-orders | LEE | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### service_request_notes

#### Vista general

_Sin propósito registrado._

- **Estado del propósito:** PENDING_REVIEW
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `ServiceRequestNotes` — `src/modules/clinical/entities/service_request_notes.entity.ts`
- **Resumen:** 6 columnas · 4 índices · 3 FK salientes · 0 entrantes · 6 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/service_request_notes.entity.ts:13`)_ | coincide |
| 2 | `service_request_id` | `uuid` | Clave foránea → clinical.service_requests.id; Obligatoria | + v4.2.52 (P40, carril C2): las notas medicas que motivan una orden de analisis (FHIR ServiceRequest.basedOn / supportingInfo). Tabla puente append-only, como observation_performers: se escribe con la orden y no se edita. La API valida (422) que cada nota exista y sea del MISMO paciente y, si la orden tiene encuentro, del MISMO encuentro. ordinal conserva el orden en que el medico las cito. _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_08_clinical.puml:378`)_ | coincide |
| 3 | `clinical_note_header_id` | `uuid` | Clave foránea → chart.clinical_note_headers.id; Obligatoria | La nota médica (cabecera) que motiva la orden. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/service_request_notes.entity.ts:25`)_ | coincide |
| 4 | `ordinal` | `integer` | Obligatoria | Posición en que el médico citó la nota (0 = la primera). _(JSDOC_ENTIDAD, `src/modules/clinical/entities/service_request_notes.entity.ts:31`)_ | coincide |
| 5 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/service_request_notes.entity.ts:37`)_ | coincide |
| 6 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | service_request_id | clinical.service_requests (id) | fk_service_request_notes_service_request_id |
| hacia | clinical_note_header_id | chart.clinical_note_headers (id) | fk_service_request_notes_clinical_note_header_id |
| hacia | created_by_user_id | iam.users (id) | fk_service_request_notes_created_by_user_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ux_service_request_notes_request_note` | sí | service_request_id, clinical_note_header_id | Garantiza que no se repita la combinación (service_request_id, clinical_note_header_id) _(DOCUMENTO)_; Soporta la clave foránea fk_service_request_notes_service_request_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «service_request_id», la primera columna del índice _(CONSULTA)_ |
| `ix_service_request_notes_service_request_id` | no | service_request_id | Soporta la clave foránea fk_service_request_notes_service_request_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «service_request_id», la primera columna del índice _(CONSULTA)_ |
| `ix_service_request_notes_clinical_note_header_id` | no | clinical_note_header_id | Soporta la clave foránea fk_service_request_notes_clinical_note_header_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_request_notes_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_service_request_notes_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `ux_service_request_notes_request_note` | UNIQUE INDEX | UNIQUE INDEX ("service_request_id", "clinical_note_header_id") |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /clinical/requisitions | CREA | DIRECTA |
| POST /clinical/requisitions | LEE | DIRECTA |
| POST /clinical/service-requests | CREA | DIRECTA |
| GET /clinical/service-requests/{id} | LEE | DIRECTA |
| GET /diagnostics/patients/{patientProfileId}/orders | LEE | DIRECTA |
| POST /procedure-cases/{id}/preoperative-orders | CREA | DIRECTA |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### service_requests

#### Vista general

Representa solicitudes de servicios clínicos —por ejemplo, estudios o procedimientos— y su estado dentro del proceso asistencial.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: service_requests`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `ServiceRequests` — `src/modules/clinical/entities/service_requests.entity.ts`
- **Resumen:** 29 columnas · 26 índices · 23 FK salientes · 16 entrantes · 40 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/service_requests.entity.ts:12`)_ | coincide |
| 2 | `custodian_tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 3 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 4 | `encounter_id` | `uuid` | Clave foránea → clinical.encounters.id; Opcional | _sin dato_ | coincide |
| 5 | `code_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 6 | `category_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 7 | `intent_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 8 | `priority_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 9 | `status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 10 | `requester_profile_id` | `uuid` | Clave foránea → profiles.health_practitioner_profiles.profile_id; Opcional | _sin dato_ | coincide |
| 11 | `performer_tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Opcional | _sin dato_ | coincide |
| 12 | `performer_selection_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | + centros medicos (M-01..M-03): quien ejecuta la orden es una RECOMENDACION del medico, no un candado ni una custodia. performer_tenant_id sigue siendo la unica columna que concede acceso a la orden; estas tres no. _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_08_clinical.puml:291`)_ | coincide |
| 13 | `performer_practitioner_profile_id` | `uuid` | Clave foránea → profiles.health_practitioner_profiles.profile_id; Opcional | _sin dato_ | coincide |
| 14 | `suggested_practice_site_id` | `uuid` | Clave foránea → practice.practice_sites.id; Opcional | _sin dato_ | coincide |
| 15 | `previous_diagnostic_report_id` | `uuid` | Clave foránea → clinical.diagnostic_reports.id; Opcional | + v4.2.17 (subtarea 3.2): antiduplicacion de estudios. El informe liberado o final del MISMO estudio (code_concept_id) que el motor encontro dentro de la ventana al pedir. Con duplicate_override_reason NULL la orden nace SR_SATISFIED_BY_PRIOR (satisfecha por ese informe, no facturable); con texto, el medico insistio y la aseguradora lo lee. _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_08_clinical.puml:297`)_ | coincide |
| 16 | `duplicate_override_reason` | `text` | Opcional | Justificación clínica del médico para repetir un estudio duplicado (v4.2.17). `null` cuando la orden reutiliza el informe previo (`previous_diagnostic_report_id` sin justificación) o cuando no hubo duplicado. Un CHECK de base impide el estado inverso: justificación sin informe previo enlazado. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/service_requests.entity.ts:116`)_ | coincide |
| 17 | `form_instance_id` | `uuid` | Clave foránea → forms.form_instances.id; Opcional | + v4.2.32 (P43): la orden puede salir de la respuesta CERRADA del formulario médico de una consulta. Nullable y sin backfill: desde la historia del paciente se sigue emitiendo sin formulario. La API valida (422) que la instancia exista, esté cerrada y sea del mismo encuentro. FK → forms.form_instances. _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_08_clinical.puml:304`)_ | coincide |
| 18 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/service_requests.entity.ts:159`)_ | coincide |
| 19 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/service_requests.entity.ts:165`)_ | coincide |
| 20 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 21 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 22 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/service_requests.entity.ts:183`)_ | coincide |
| 23 | `suggested_care_space_id` | `uuid` | Clave foránea → practice.care_spaces.id; Opcional | + infraestructura hospitalaria F5b: punto de toma de muestra sugerido (espacio de función SAMPLE_COLLECTION de suggested_practice_site_id; lo valida la API, 422 COLLECTION_POINT_INVALID). Recomendación, no custodia: no concede acceso. _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_08_clinical.puml:314`)_ | coincide |
| 24 | `requisition_id` | `uuid` | Opcional | + v4.2.82 (detalle de la orden de estudios): lo que el laboratorio o el centro de imagen necesita para ejecutar la orden. Todo NULLABLE y sin backfill: una orden anterior no declaró muestra ni región y reconstruirlas sería fabricar un dato clínico. requisition_id agrupa los renglones pedidos juntos (identificador de grupo, sin FK). Muestra (HL7 v2-0487) sólo en laboratorio; modalidad (DICOM CID 29), parte del cuerpo, lateralidad y contraste sólo en imagen: el cruce con la categoría lo valida la API, los CHECK que no leen conceptos viven en el módulo 33. _(MODELO_PUML, `Mantra Core Health Context/modules/diagram_08_clinical.puml:318`)_ | coincide |
| 25 | `specimen_type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 26 | `modality_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 27 | `body_site_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 28 | `laterality_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 29 | `contrast_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | encounter_id | clinical.encounters (id) | fk_service_requests_encounter_id |
| hacia | previous_diagnostic_report_id | clinical.diagnostic_reports (id) | fk_service_requests_previous_diagnostic_report_id |
| hacia | custodian_tenant_id | directory.tenants (id) | fk_service_requests_custodian_tenant_id |
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_service_requests_patient_profile_id |
| hacia | code_concept_id | terminology.catalog_concepts (id) | fk_service_requests_code_concept_id |
| hacia | category_concept_id | terminology.catalog_concepts (id) | fk_service_requests_category_concept_id |
| hacia | intent_concept_id | terminology.catalog_concepts (id) | fk_service_requests_intent_concept_id |
| hacia | priority_concept_id | terminology.catalog_concepts (id) | fk_service_requests_priority_concept_id |
| hacia | status_concept_id | terminology.catalog_concepts (id) | fk_service_requests_status_concept_id |
| hacia | requester_profile_id | profiles.health_practitioner_profiles (profile_id) | fk_service_requests_requester_profile_id |
| hacia | performer_tenant_id | directory.tenants (id) | fk_service_requests_performer_tenant_id |
| hacia | performer_selection_concept_id | terminology.catalog_concepts (id) | fk_service_requests_performer_selection_concept_id |
| hacia | performer_practitioner_profile_id | profiles.health_practitioner_profiles (profile_id) | fk_service_requests_performer_practitioner_profile_id |
| hacia | suggested_practice_site_id | practice.practice_sites (id) | fk_service_requests_suggested_practice_site_id |
| hacia | form_instance_id | forms.form_instances (id) | fk_service_requests_form_instance_id |
| hacia | created_by_user_id | iam.users (id) | fk_service_requests_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_service_requests_updated_by_user_id |
| hacia | suggested_care_space_id | practice.care_spaces (id) | fk_service_requests_suggested_care_space_id |
| hacia | specimen_type_concept_id | terminology.catalog_concepts (id) | fk_service_requests_specimen_type_concept_id |
| hacia | modality_concept_id | terminology.catalog_concepts (id) | fk_service_requests_modality_concept_id |
| hacia | body_site_concept_id | terminology.catalog_concepts (id) | fk_service_requests_body_site_concept_id |
| hacia | laterality_concept_id | terminology.catalog_concepts (id) | fk_service_requests_laterality_concept_id |
| hacia | contrast_concept_id | terminology.catalog_concepts (id) | fk_service_requests_contrast_concept_id |
| desde | id | clinical.observations (based_on_service_request_id) | fk_observations_based_on_service_request_id |
| desde | id | clinical.diagnostic_reports (service_request_id) | fk_diagnostic_reports_service_request_id |
| desde | id | clinical.service_request_notes (service_request_id) | fk_service_request_notes_service_request_id |
| desde | id | clinical.service_request_components (service_request_id) | fk_service_request_components_service_request_id |
| desde | id | clinical.procedures (service_request_id) | fk_procedures_service_request_id |
| desde | id | clinical_ext.referrals (service_request_id) | fk_referrals_service_request_id |
| desde | id | diagnostics.specimens (service_request_id) | fk_specimens_service_request_id |
| desde | id | diagnostics.imaging_studies (service_request_id) | fk_imaging_studies_service_request_id |
| desde | id | diagnostics.specimen_rejection_events (recollection_service_request_id) | fk_specimen_rejection_events_recollection_service_request_id |
| desde | id | diagnostics.laboratory_accessions (service_request_id) | fk_laboratory_accessions_service_request_id |
| desde | id | diagnostics.laboratory_work_order_tests (service_request_id) | fk_laboratory_work_order_tests_service_request_id |
| desde | id | insurance.prior_authorization_requests (service_request_id) | fk_prior_authorization_requests_service_request_id |
| desde | id | insurance.insurance_claims (service_request_id) | fk_insurance_claims_service_request_id |
| desde | id | procedures_perioperative.procedure_cases (service_request_id) | fk_procedure_cases_service_request_id |
| desde | id | procedures_perioperative.preoperative_orders (service_request_id) | fk_preoperative_orders_service_request_id |
| desde | id | procedures_perioperative.postoperative_orders (service_request_id) | fk_postoperative_orders_service_request_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_service_requests_custodian_tenant_id` | no | custodian_tenant_id | Soporta la clave foránea fk_service_requests_custodian_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 2 consulta(s) de repositorio filtran u ordenan por «custodian_tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_service_requests_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_service_requests_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 6 consulta(s) de repositorio filtran u ordenan por «patient_profile_id», la primera columna del índice _(CONSULTA)_ |
| `ix_service_requests_encounter_id` | no | encounter_id | Soporta la clave foránea fk_service_requests_encounter_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_requests_code_concept_id` | no | code_concept_id | Soporta la clave foránea fk_service_requests_code_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_requests_category_concept_id` | no | category_concept_id | Soporta la clave foránea fk_service_requests_category_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 3 consulta(s) de repositorio filtran u ordenan por «category_concept_id», la primera columna del índice _(CONSULTA)_ |
| `ix_service_requests_intent_concept_id` | no | intent_concept_id | Soporta la clave foránea fk_service_requests_intent_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_requests_priority_concept_id` | no | priority_concept_id | Soporta la clave foránea fk_service_requests_priority_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_requests_status_concept_id` | no | status_concept_id | Soporta la clave foránea fk_service_requests_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «status_concept_id», la primera columna del índice _(CONSULTA)_ |
| `ix_service_requests_requester_profile_id` | no | requester_profile_id | Soporta la clave foránea fk_service_requests_requester_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_requests_performer_tenant_id` | no | performer_tenant_id | Soporta la clave foránea fk_service_requests_performer_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_requests_performer_practitioner_profile_id` | no | performer_practitioner_profile_id | Soporta la clave foránea fk_service_requests_performer_practitioner_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_requests_suggested_practice_site_id` | no | suggested_practice_site_id | Soporta la clave foránea fk_service_requests_suggested_practice_site_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_requests_previous_diagnostic_report_id` | no | previous_diagnostic_report_id | Soporta la clave foránea fk_service_requests_previous_diagnostic_report_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_requests_form_instance_id` | no | form_instance_id | Soporta la clave foránea fk_service_requests_form_instance_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_requests_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_service_requests_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_requests_updated_by_user_id` | no | updated_by_user_id | Soporta la clave foránea fk_service_requests_updated_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_requests_custodian_tenant_id_status_concept_id` | no | custodian_tenant_id, status_concept_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_service_requests_patient_profile_id_updated_at` | no | custodian_tenant_id, patient_profile_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_service_requests_suggested_care_space_id` | no | suggested_care_space_id | Soporta la clave foránea fk_service_requests_suggested_care_space_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_requests_specimen_type_concept_id` | no | specimen_type_concept_id | Soporta la clave foránea fk_service_requests_specimen_type_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_requests_modality_concept_id` | no | modality_concept_id | Soporta la clave foránea fk_service_requests_modality_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_requests_body_site_concept_id` | no | body_site_concept_id | Soporta la clave foránea fk_service_requests_body_site_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_requests_laterality_concept_id` | no | laterality_concept_id | Soporta la clave foránea fk_service_requests_laterality_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_requests_contrast_concept_id` | no | contrast_concept_id | Soporta la clave foránea fk_service_requests_contrast_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_service_requests_requisition_id` | no | custodian_tenant_id, requisition_id | Soporta la clave foránea fk_service_requests_custodian_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 2 consulta(s) de repositorio filtran u ordenan por «custodian_tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_service_requests_performer_inbox` | no | performer_tenant_id, status_concept_id, created_at, id | Soporta la clave foránea fk_service_requests_performer_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `ck_service_requests_override_reason_requires_previous_report` | CHECK | CHECK (("duplicate_override_reason" IS NULL OR "previous_diagnostic_report_id" IS NOT NULL)) |
| `ck_service_requests_specimen_xor_imaging` | CHECK | CHECK (("specimen_type_concept_id" IS NULL OR ("modality_concept_id" IS NULL AND "body_site_concept_id" IS NULL AND "laterality_concept_id" IS NULL AND "contrast_concept_id" IS NULL))) |
| `ck_service_requests_laterality_requires_site` | CHECK | CHECK (("laterality_concept_id" IS NULL OR "body_site_concept_id" IS NOT NULL)) |
| `ck_service_requests_contrast_requires_modality` | CHECK | CHECK (("contrast_concept_id" IS NULL OR "modality_concept_id" IS NOT NULL)) |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /clinical/conditions/{id}/verification | LEE | DIRECTA |
| POST /clinical/diagnostic-reports | ACTUALIZA | POR_TIPO |
| POST /clinical/diagnostic-reports | LEE | DIRECTA |
| GET /clinical/me/procedure-centers | LEE | DIRECTA |
| POST /clinical/observations | LEE | DIRECTA |
| POST /clinical/procedures | ACTUALIZA | POR_TIPO |
| POST /clinical/procedures | LEE | DIRECTA |
| POST /clinical/requisitions | CREA | DIRECTA |
| POST /clinical/requisitions | LEE | DIRECTA |
| POST /clinical/service-requests | CREA | DIRECTA |
| POST /clinical/service-requests | LEE | POR_SQL |
| GET /clinical/service-requests/{id} | LEE | DIRECTA |
| POST /clinical/service-requests/duplicate-check | LEE | POR_SQL |
| POST /order-sets/{id}/apply | CREA | DIRECTA |
| GET /diagnostic-results/me/orders | LEE | DIRECTA |
| POST /diagnostics/accessions | LEE | DIRECTA |
| GET /diagnostics/patients/{patientProfileId}/orders | LEE | DIRECTA |
| GET /diagnostics/service-requests/{id} | LEE | DIRECTA |
| POST /diagnostics/service-requests/inbox | LEE | DIRECTA |
| POST /diagnostics/service-requests/worklist | LEE | DIRECTA |
| POST /diagnostics/specimens | LEE | DIRECTA |
| POST /diagnostics/specimens/{id}/rejection | LEE | DIRECTA |
| GET /diagnostics/work-orders | LEE | POR_SQL |
| POST /diagnostics/work-orders | LEE | DIRECTA |
| POST /dicomweb/studies | LEE | DIRECTA |
| POST /insurance-claims | LEE | DIRECTA |
| GET /insurance-claims/{id} | LEE | DIRECTA |
| POST /insurance-claims/{id}/adjudications | LEE | DIRECTA |
| POST /insurance-claims/{id}/eob | LEE | DIRECTA |
| POST /insurance-claims/{id}/reversals | LEE | DIRECTA |
| POST /insurance/received-claims/{id}/decision | LEE | DIRECTA |
| POST /prior-authorization-requests | LEE | DIRECTA |
| POST /prior-authorization-requests/{id}/determinations | LEE | DIRECTA |
| GET /medical-centers/search/for-my-orders | LEE | DIRECTA |
| GET /pharmacy/orders/{id} | LEE | DIRECTA |
| GET /pharmacy/orders/me | LEE | DIRECTA |
| POST /procedure-cases/{id}/operative-reports | ACTUALIZA | POR_TIPO |
| POST /procedure-cases/{id}/operative-reports | LEE | DIRECTA |
| POST /procedure-cases/{id}/preoperative-orders | CREA | DIRECTA |
| POST /procedure-cases/{id}/preoperative-orders | LEE | POR_SQL |

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

### social_history

#### Vista general

Registra factores y circunstancias sociales o hábitos que aportan contexto a la valoración y continuidad asistencial del paciente.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_08_clinical.puml: social_history`
- **Dominio:** Clínico y Diagnóstico · **Diagrama:** `Mantra Core Health Context/modules/diagram_08_clinical.puml` · **DDL:** `SQL/08_clinical/02_tables.sql`
- **Entidad del ORM:** `SocialHistory` — `src/modules/clinical/entities/social_history.entity.ts`
- **Resumen:** 16 columnas · 11 índices · 9 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/social_history.entity.ts:12`)_ | coincide |
| 2 | `custodian_tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 3 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | _sin dato_ | coincide |
| 4 | `category_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 6 | `value_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 7 | `value_text` | `text` | Opcional | _sin dato_ | coincide |
| 8 | `quantity_decimal` | `numeric` | Opcional | _sin dato_ | coincide |
| 9 | `unit_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | coincide |
| 10 | `effective_at` | `timestamptz` | Opcional | _sin dato_ | coincide |
| 11 | `recorded_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 12 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/social_history.entity.ts:86`)_ | coincide |
| 13 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/clinical/entities/social_history.entity.ts:92`)_ | coincide |
| 14 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 15 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 16 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/clinical/entities/social_history.entity.ts:110`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | custodian_tenant_id | directory.tenants (id) | fk_social_history_custodian_tenant_id |
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_social_history_patient_profile_id |
| hacia | category_concept_id | terminology.catalog_concepts (id) | fk_social_history_category_concept_id |
| hacia | status_concept_id | terminology.catalog_concepts (id) | fk_social_history_status_concept_id |
| hacia | value_concept_id | terminology.catalog_concepts (id) | fk_social_history_value_concept_id |
| hacia | unit_concept_id | terminology.catalog_concepts (id) | fk_social_history_unit_concept_id |
| hacia | recorded_by_user_id | iam.users (id) | fk_social_history_recorded_by_user_id |
| hacia | created_by_user_id | iam.users (id) | fk_social_history_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_social_history_updated_by_user_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_social_history_custodian_tenant_id` | no | custodian_tenant_id | Soporta la clave foránea fk_social_history_custodian_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_social_history_patient_profile_id` | no | patient_profile_id | Soporta la clave foránea fk_social_history_patient_profile_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_social_history_category_concept_id` | no | category_concept_id | Soporta la clave foránea fk_social_history_category_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_social_history_status_concept_id` | no | status_concept_id | Soporta la clave foránea fk_social_history_status_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_social_history_value_concept_id` | no | value_concept_id | Soporta la clave foránea fk_social_history_value_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_social_history_unit_concept_id` | no | unit_concept_id | Soporta la clave foránea fk_social_history_unit_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_social_history_recorded_by_user_id` | no | recorded_by_user_id | Soporta la clave foránea fk_social_history_recorded_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_social_history_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_social_history_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_social_history_updated_by_user_id` | no | updated_by_user_id | Soporta la clave foránea fk_social_history_updated_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_social_history_custodian_tenant_id_status_concept_id` | no | custodian_tenant_id, status_concept_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_social_history_patient_profile_id_updated_at` | no | custodian_tenant_id, patient_profile_id, ("updated_at" DESC) | _sin uso detectado estáticamente_ |

#### Operaciones que la tocan

_Ninguna operación HTTP la toca según el análisis estático (puede usarla un worker, un trigger o una migración)._

#### Gobierno

| Atributo | Valor | Fuente |
|---|---|---|
| Append-only | no declarado | — |
| Datos personales | sin fuente | — |
| Financiera | sin fuente | — |
| Crítica para auditoría | sin fuente | — |
| Retención | sin fuente | — |
| Responsable | sin fuente | — |
| Revisión | AUTO_DETECTADA | — |

---

