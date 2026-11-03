<!-- AUTOGENERADO por tools/inventario/catalogo.mjs. No editar manualmente. -->

# Catálogo del schema `surveys`

- **Tablas:** 8 · **Columnas:** 100 (61 con descripción: 61.0 %) · **Índices:** 26
- **Dominio:** sin dato
- Método y límites del catálogo: [README del inventario](../README.md)

## Tablas

| Tabla | Propósito | Columnas | Índices | Operaciones | ORM |
|---|---|---|---|---|---|
| [survey_answers](#survey_answers) | Conserva respuestas por pregunta para permitir análisis de experiencia sin mezclar resultados con reseñas públicas. | 12 | 3 | 3 | COINCIDE |
| [survey_assignments](#survey_assignments) | Asocia versiones de encuestas a profesionales o tipos de atención que deben utilizarlas. | 11 | 3 | 8 | COINCIDE |
| [survey_invitation_reminders](#survey_invitation_reminders) | sin propósito | 7 | 3 | 0 | SIN_ENTIDAD |
| [survey_invitations](#survey_invitations) | Emite invitaciones para responder una encuesta a un paciente después de una atención y controla su vigencia. | 18 | 8 | 10 | COINCIDE |
| [survey_questions](#survey_questions) | Define preguntas que componen cada versión de un cuestionario post-visita. | 14 | 1 | 18 | COINCIDE |
| [survey_responses](#survey_responses) | Registra respuestas privadas de pacientes a encuestas post-visita sin alimentar la calificación pública de prestadores. | 11 | 4 | 3 | COINCIDE |
| [survey_templates](#survey_templates) | Define cuestionarios post-atención que profesionales pueden usar para consultar la experiencia del paciente. | 13 | 3 | 25 | COINCIDE |
| [survey_versions](#survey_versions) | Preserva versiones inmutables de cuestionarios para conocer qué preguntas se presentaron en cada atención. | 14 | 1 | 24 | COINCIDE |

## Diagrama entidad-relación

Las tablas se agrupan en familias por sus claves foráneas dentro del schema (máximo 40 por diagrama). Las FK hacia otros schemas se listan en la ficha de cada tabla.

### Familia 1 de 1 — 8 tablas

```mermaid
erDiagram
  surveys_survey_answers["surveys.survey_answers"] {
    uuid id PK
    uuid survey_response_id FK
    uuid survey_question_id FK
    uuid created_by_user_id FK
    uuid updated_by_user_id FK
  }
  surveys_survey_questions["surveys.survey_questions"] {
    uuid id PK
    uuid survey_version_id FK
    uuid answer_type_concept_id FK
    uuid created_by_user_id FK
    uuid updated_by_user_id FK
  }
  surveys_survey_responses["surveys.survey_responses"] {
    uuid id PK
    uuid survey_invitation_id FK
    uuid survey_version_id FK
    uuid tenant_id FK
    uuid patient_profile_id FK
    uuid created_by_user_id FK
    uuid updated_by_user_id FK
  }
  surveys_survey_versions["surveys.survey_versions"] {
    uuid id PK
    uuid survey_template_id FK
    uuid publication_status_concept_id FK
    uuid created_by_user_id FK
    uuid updated_by_user_id FK
  }
  surveys_survey_invitations["surveys.survey_invitations"] {
    uuid id PK
    uuid survey_version_id FK
    uuid extension_survey_version_id FK
    uuid survey_assignment_id FK
    uuid tenant_id FK
    uuid patient_profile_id FK
    uuid appointment_booking_id FK
    uuid subject_type_concept_id FK
  }
  surveys_survey_assignments["surveys.survey_assignments"] {
    uuid id PK
    uuid survey_version_id FK
    uuid tenant_id FK
    uuid target_type_concept_id FK
    uuid created_by_user_id FK
    uuid updated_by_user_id FK
  }
  surveys_survey_templates["surveys.survey_templates"] {
    uuid id PK
    uuid tenant_id FK
    uuid owner_practitioner_id FK
    uuid owner_type_concept_id FK
    uuid status_concept_id FK
    uuid created_by_user_id FK
    uuid updated_by_user_id FK
  }
  surveys_survey_invitation_reminders["surveys.survey_invitation_reminders"] {
    uuid id PK
    uuid survey_invitation_id FK
    uuid channel_concept_id FK
    uuid created_by_user_id FK
  }
  surveys_survey_answers }o--|| surveys_survey_responses : "survey_response_id"
  surveys_survey_answers }o--|| surveys_survey_questions : "survey_question_id"
  surveys_survey_questions }o--|| surveys_survey_versions : "survey_version_id"
  surveys_survey_responses }o--|| surveys_survey_invitations : "survey_invitation_id"
  surveys_survey_responses }o--|| surveys_survey_versions : "survey_version_id"
  surveys_survey_versions }o--|| surveys_survey_templates : "survey_template_id"
  surveys_survey_invitations }o--|| surveys_survey_versions : "survey_version_id"
  surveys_survey_invitations }o--o| surveys_survey_versions : "extension_survey_version_id"
  surveys_survey_invitations }o--|| surveys_survey_assignments : "survey_assignment_id"
  surveys_survey_assignments }o--|| surveys_survey_versions : "survey_version_id"
  surveys_survey_invitation_reminders }o--|| surveys_survey_invitations : "survey_invitation_id"
```

## Fichas

### survey_answers

#### Vista general

Conserva respuestas por pregunta para permitir análisis de experiencia sin mezclar resultados con reseñas públicas.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_65_surveys.puml: survey_answers; BIZ note`
- **Dominio:** sin dato · **Diagrama:** `Mantra Core Health Context/modules/diagram_65_surveys.puml` · **DDL:** `SQL/65_surveys/02_tables.sql`
- **Entidad del ORM:** `SurveyAnswers` — `src/modules/surveys/entities/survey_answers.entity.ts`
- **Resumen:** 12 columnas · 3 índices · 4 FK salientes · 0 entrantes · 3 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/surveys/entities/survey_answers.entity.ts:18`)_ | coincide |
| 2 | `survey_response_id` | `uuid` | Clave foránea → surveys.survey_responses.id; Obligatoria | _sin dato_ | coincide |
| 3 | `survey_question_id` | `uuid` | Clave foránea → surveys.survey_questions.id; Obligatoria | _sin dato_ | coincide |
| 4 | `value_text` | `text` | Opcional | Respuesta de texto libre. Poblada solo para preguntas de tipo TEXT. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_answers.entity.ts:36`)_ | coincide |
| 5 | `value_number` | `integer` | Opcional | Respuesta numérica. Poblada solo para preguntas de tipo SCALE. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_answers.entity.ts:42`)_ | coincide |
| 6 | `value_boolean` | `boolean` | Opcional | Respuesta sí/no. Poblada solo para preguntas de tipo BOOLEAN. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_answers.entity.ts:48`)_ | coincide |
| 7 | `value_choices` | `jsonb` | Opcional | Opciones elegidas. Poblada solo para los dos tipos de elección; la de elección simple guarda un único elemento para no necesitar otra columna. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_answers.entity.ts:59`)_ | coincide |
| 8 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/surveys/entities/survey_answers.entity.ts:70`)_ | coincide |
| 9 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/surveys/entities/survey_answers.entity.ts:76`)_ | coincide |
| 10 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 11 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 12 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_answers.entity.ts:94`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | survey_response_id | surveys.survey_responses (id) | fk_survey_answers_survey_response_id |
| hacia | survey_question_id | surveys.survey_questions (id) | fk_survey_answers_survey_question_id |
| hacia | created_by_user_id | iam.users (id) | fk_survey_answers_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_survey_answers_updated_by_user_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_survey_answers_response` | no | survey_response_id | Soporta la clave foránea fk_survey_answers_survey_response_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «survey_response_id», la primera columna del índice _(CONSULTA)_ |
| `ix_survey_answers_question` | no | survey_question_id | Soporta la clave foránea fk_survey_answers_survey_question_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `uq_survey_answers_response_question` | sí | survey_response_id, survey_question_id | Garantiza que no se repita la combinación (survey_response_id, survey_question_id) _(DOCUMENTO)_; Soporta la clave foránea fk_survey_answers_survey_response_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «survey_response_id», la primera columna del índice _(CONSULTA)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `uq_survey_answers_response_question` | UNIQUE INDEX | UNIQUE INDEX ("survey_response_id", "survey_question_id") |
| `ck_survey_answers_single_value` | CHECK | CHECK (num_nonnulls("value_text", "value_number", "value_boolean", "value_choices") = 1) |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| GET /surveys/insights | LEE | POR_SQL |
| POST /surveys/me/invitations/{id}/responses | CREA | DIRECTA |
| GET /surveys/templates/{id}/responses | LEE | DIRECTA |

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

### survey_assignments

#### Vista general

Asocia versiones de encuestas a profesionales o tipos de atención que deben utilizarlas.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_65_surveys.puml: survey_assignments`
- **Dominio:** sin dato · **Diagrama:** `Mantra Core Health Context/modules/diagram_65_surveys.puml` · **DDL:** `SQL/65_surveys/02_tables.sql`
- **Entidad del ORM:** `SurveyAssignments` — `src/modules/surveys/entities/survey_assignments.entity.ts`
- **Resumen:** 11 columnas · 3 índices · 5 FK salientes · 1 entrantes · 8 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/surveys/entities/survey_assignments.entity.ts:18`)_ | coincide |
| 2 | `survey_version_id` | `uuid` | Clave foránea → surveys.survey_versions.id; Obligatoria | _sin dato_ | coincide |
| 3 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 4 | `target_type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `target_id` | `uuid` | Obligatoria | Identificador de la cosa evaluada, interpretado según `targetTypeConceptId`: la reserva concreta, el servicio de salud o el tipo de atención. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_assignments.entity.ts:43`)_ | coincide |
| 6 | `active` | `boolean` | Obligatoria | Si la asignación sigue vigente. Desactivarla frena las emisiones nuevas sin borrar el histórico de lo ya emitido. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_assignments.entity.ts:50`)_ | coincide |
| 7 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/surveys/entities/survey_assignments.entity.ts:56`)_ | coincide |
| 8 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/surveys/entities/survey_assignments.entity.ts:62`)_ | coincide |
| 9 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 10 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 11 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_assignments.entity.ts:80`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | survey_version_id | surveys.survey_versions (id) | fk_survey_assignments_survey_version_id |
| hacia | tenant_id | directory.tenants (id) | fk_survey_assignments_tenant_id |
| hacia | target_type_concept_id | terminology.catalog_concepts (id) | fk_survey_assignments_target_type_concept_id |
| hacia | created_by_user_id | iam.users (id) | fk_survey_assignments_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_survey_assignments_updated_by_user_id |
| desde | id | surveys.survey_invitations (survey_assignment_id) | fk_survey_invitations_survey_assignment_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_survey_assignments_tenant_target` | no | tenant_id, target_id, active | Soporta la clave foránea fk_survey_assignments_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_survey_assignments_version` | no | survey_version_id | Soporta la clave foránea fk_survey_assignments_survey_version_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 3 consulta(s) de repositorio filtran u ordenan por «survey_version_id», la primera columna del índice _(CONSULTA)_ |
| `uq_survey_assignments_active_target` | sí | survey_version_id, target_type_concept_id, target_id donde WHERE active = true | Garantiza que no se repita la combinación (survey_version_id, target_type_concept_id, target_id) _(DOCUMENTO)_; Soporta la clave foránea fk_survey_assignments_survey_version_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; Índice parcial: sólo indexa las filas donde WHERE active = true _(ESTRUCTURAL)_; 3 consulta(s) de repositorio filtran u ordenan por «survey_version_id», la primera columna del índice _(CONSULTA)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `uq_survey_assignments_active_target` | UNIQUE INDEX | UNIQUE INDEX ("survey_version_id", "target_type_concept_id", "target_id") WHERE active = true |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /scheduling/bookings/{id}/complete | CREA | DIRECTA |
| POST /scheduling/bookings/{id}/complete | LEE | DIRECTA |
| POST /surveys/assignments | CREA | DIRECTA |
| POST /surveys/assignments | LEE | DIRECTA |
| GET /surveys/insights | LEE | POR_SQL |
| POST /surveys/invitations | CREA | DIRECTA |
| POST /surveys/invitations | LEE | DIRECTA |
| GET /surveys/templates/{id} | LEE | DIRECTA |

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

### survey_invitation_reminders

#### Vista general

_Sin propósito registrado._

- **Estado del propósito:** PENDING_REVIEW
- **Dominio:** sin dato · **Diagrama:** `Mantra Core Health Context/modules/diagram_65_surveys.puml` · **DDL:** `SQL/65_surveys/02_tables.sql`
- **Entidad del ORM:** **sin entidad** (deriva)
- **Resumen:** 7 columnas · 3 índices · 3 FK salientes · 0 entrantes · 0 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 2 | `survey_invitation_id` | `uuid` | Clave foránea → surveys.survey_invitations.id; Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 3 | `reminder_number` | `integer` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 4 | `sent_at` | `timestamptz` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 5 | `channel_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | _sin dato_ | **SIN_ENTIDAD** |
| 6 | `created_at` | `timestamptz` | Obligatoria | _sin dato_ | **SIN_ENTIDAD** |
| 7 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | **SIN_ENTIDAD** |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | survey_invitation_id | surveys.survey_invitations (id) | fk_survey_invitation_reminders_survey_invitation_id |
| hacia | channel_concept_id | terminology.catalog_concepts (id) | fk_survey_invitation_reminders_channel_concept_id |
| hacia | created_by_user_id | iam.users (id) | fk_survey_invitation_reminders_created_by_user_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_survey_invitation_reminders_number` | sí | survey_invitation_id, reminder_number | Garantiza que no se repita la combinación (survey_invitation_id, reminder_number) _(DOCUMENTO)_; Soporta la clave foránea fk_survey_invitation_reminders_survey_invitation_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_survey_invitation_reminders_channel_concept_id` | no | channel_concept_id | Soporta la clave foránea fk_survey_invitation_reminders_channel_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_survey_invitation_reminders_created_by_user_id` | no | created_by_user_id | Soporta la clave foránea fk_survey_invitation_reminders_created_by_user_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `uq_survey_invitation_reminders_number` | UNIQUE INDEX | UNIQUE INDEX ("survey_invitation_id", "reminder_number") |
| `ck_survey_invitation_reminders_number` | CHECK | CHECK ("reminder_number" >= 1) |

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

### survey_invitations

#### Vista general

Emite invitaciones para responder una encuesta a un paciente después de una atención y controla su vigencia.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_65_surveys.puml: survey_invitations; BIZ note`
- **Dominio:** sin dato · **Diagrama:** `Mantra Core Health Context/modules/diagram_65_surveys.puml` · **DDL:** `SQL/65_surveys/02_tables.sql`
- **Entidad del ORM:** `SurveyInvitations` — `src/modules/surveys/entities/survey_invitations.entity.ts`
- **Resumen:** 18 columnas · 8 índices · 10 FK salientes · 2 entrantes · 10 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/surveys/entities/survey_invitations.entity.ts:22`)_ | coincide |
| 2 | `survey_version_id` | `uuid` | Clave foránea → surveys.survey_versions.id; Obligatoria | _sin dato_ | coincide |
| 3 | `extension_survey_version_id` | `uuid` | Clave foránea → surveys.survey_versions.id; Opcional | Versión del profesional que atendió, cuando la hay. La invitación se responde sobre la unión de `surveyVersionId` (la base del sistema, primero) y esta (después). Nulo en las invitaciones sin encuesta del profesional. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_invitations.entity.ts:36`)_ | coincide |
| 4 | `survey_assignment_id` | `uuid` | Clave foránea → surveys.survey_assignments.id; Obligatoria | _sin dato_ | coincide |
| 5 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 6 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | Destinatario. Es la única persona que puede responder esta invitación. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_invitations.entity.ts:58`)_ | coincide |
| 7 | `appointment_booking_id` | `uuid` | Clave foránea → scheduling.appointment_bookings.id; Opcional | La atención completada que habilita la invitación. Nulo cuando la invitación cuelga de otro sujeto (`subjectTypeConceptId` + `subjectId`). _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_invitations.entity.ts:65`)_ | coincide |
| 8 | `subject_type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | Tipo del sujeto alterno (incidente, autorización, reembolso...). Va junto con `subjectId`; la invitación necesita al menos un ancla. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_invitations.entity.ts:76`)_ | coincide |
| 9 | `subject_id` | `uuid` | Opcional | Identificador del sujeto alterno, interpretado según `subjectTypeConceptId`. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_invitations.entity.ts:86`)_ | coincide |
| 10 | `status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 11 | `issued_at` | `timestamptz` | Obligatoria | Desde cuándo se puede responder. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_invitations.entity.ts:98`)_ | coincide |
| 12 | `expires_at` | `timestamptz` | Obligatoria | Hasta cuándo se puede responder. Derivado de `responseWindowDays` de la versión en el momento de emitir, no calculado al vuelo: si alguien cambia el plazo después, la ventana ya prometida al paciente no se mueve. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_invitations.entity.ts:106`)_ | coincide |
| 13 | `answered_at` | `timestamptz` | Opcional | Momento en que se envió la respuesta. Nulo mientras sigue pendiente. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_invitations.entity.ts:112`)_ | coincide |
| 14 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/surveys/entities/survey_invitations.entity.ts:122`)_ | coincide |
| 15 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/surveys/entities/survey_invitations.entity.ts:128`)_ | coincide |
| 16 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 17 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 18 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_invitations.entity.ts:146`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | survey_version_id | surveys.survey_versions (id) | fk_survey_invitations_survey_version_id |
| hacia | extension_survey_version_id | surveys.survey_versions (id) | fk_survey_invitations_extension_survey_version_id |
| hacia | survey_assignment_id | surveys.survey_assignments (id) | fk_survey_invitations_survey_assignment_id |
| hacia | tenant_id | directory.tenants (id) | fk_survey_invitations_tenant_id |
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_survey_invitations_patient_profile_id |
| hacia | appointment_booking_id | scheduling.appointment_bookings (id) | fk_survey_invitations_appointment_booking_id |
| hacia | subject_type_concept_id | terminology.catalog_concepts (id) | fk_survey_invitations_subject_type_concept_id |
| hacia | status_concept_id | terminology.catalog_concepts (id) | fk_survey_invitations_status_concept_id |
| hacia | created_by_user_id | iam.users (id) | fk_survey_invitations_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_survey_invitations_updated_by_user_id |
| desde | id | surveys.survey_invitation_reminders (survey_invitation_id) | fk_survey_invitation_reminders_survey_invitation_id |
| desde | id | surveys.survey_responses (survey_invitation_id) | fk_survey_responses_survey_invitation_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_survey_invitations_patient_issued` | no | patient_profile_id, ("issued_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_survey_invitations_booking` | no | appointment_booking_id | Soporta la clave foránea fk_survey_invitations_appointment_booking_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «appointment_booking_id», la primera columna del índice _(CONSULTA)_ |
| `ix_survey_invitations_version` | no | survey_version_id | Soporta la clave foránea fk_survey_invitations_survey_version_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «survey_version_id», la primera columna del índice _(CONSULTA)_ |
| `ix_survey_invitations_assignment` | no | survey_assignment_id | Soporta la clave foránea fk_survey_invitations_survey_assignment_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_survey_invitations_tenant_id` | no | tenant_id | Soporta la clave foránea fk_survey_invitations_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_survey_invitations_subject` | no | subject_type_concept_id, subject_id | Soporta la clave foránea fk_survey_invitations_subject_type_concept_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_survey_invitations_extension_version` | no | extension_survey_version_id | Soporta la clave foránea fk_survey_invitations_extension_survey_version_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «extension_survey_version_id», la primera columna del índice _(CONSULTA)_ |
| `uq_survey_invitations_booking_version` | sí | appointment_booking_id, survey_version_id | Garantiza que no se repita la combinación (appointment_booking_id, survey_version_id) _(DOCUMENTO)_; Soporta la clave foránea fk_survey_invitations_appointment_booking_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «appointment_booking_id», la primera columna del índice _(CONSULTA)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `uq_survey_invitations_booking_version` | UNIQUE INDEX | UNIQUE INDEX ("appointment_booking_id", "survey_version_id") |
| `ck_survey_invitations_anchor` | CHECK | CHECK (("appointment_booking_id" IS NOT NULL OR "subject_id" IS NOT NULL) AND (("subject_type_concept_id" IS NULL) = ("subject_id" IS NULL))) |
| `ck_survey_invitations_extension_distinct` | CHECK | CHECK ("extension_survey_version_id" IS NULL OR "extension_survey_version_id" <> "survey_version_id") |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /scheduling/bookings/{id}/complete | CREA | DIRECTA |
| POST /scheduling/bookings/{id}/complete | LEE | DIRECTA |
| GET /surveys/insights | LEE | POR_SQL |
| POST /surveys/invitations | CREA | DIRECTA |
| POST /surveys/invitations | LEE | DIRECTA |
| GET /surveys/me/invitations | LEE | DIRECTA |
| GET /surveys/me/invitations/{id} | LEE | DIRECTA |
| POST /surveys/me/invitations/{id}/responses | ACTUALIZA | POR_TIPO |
| POST /surveys/me/invitations/{id}/responses | LEE | DIRECTA |
| GET /surveys/templates/{id}/responses | LEE | DIRECTA |

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

### survey_questions

#### Vista general

Define preguntas que componen cada versión de un cuestionario post-visita.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_65_surveys.puml: survey_questions`
- **Dominio:** sin dato · **Diagrama:** `Mantra Core Health Context/modules/diagram_65_surveys.puml` · **DDL:** `SQL/65_surveys/02_tables.sql`
- **Entidad del ORM:** `SurveyQuestions` — `src/modules/surveys/entities/survey_questions.entity.ts`
- **Resumen:** 14 columnas · 1 índices · 4 FK salientes · 1 entrantes · 18 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/surveys/entities/survey_questions.entity.ts:16`)_ | coincide |
| 2 | `survey_version_id` | `uuid` | Clave foránea → surveys.survey_versions.id; Obligatoria | _sin dato_ | coincide |
| 3 | `position` | `integer` | Obligatoria | Posición de la pregunta dentro del cuestionario, arrancando en 1. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_questions.entity.ts:28`)_ | coincide |
| 4 | `question_text` | `text` | Obligatoria | Enunciado que lee el paciente. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_questions.entity.ts:34`)_ | coincide |
| 5 | `answer_type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 6 | `required` | `boolean` | Obligatoria | Si responderla es obligatorio para poder enviar el cuestionario. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_questions.entity.ts:46`)_ | coincide |
| 7 | `options` | `jsonb` | Opcional | Opciones de las preguntas de elección, en orden de presentación. Nulo para los tipos que no las admiten (texto, escala, sí/no). _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_questions.entity.ts:53`)_ | coincide |
| 8 | `scale_min` | `integer` | Opcional | Mínimo admitido en las preguntas de escala. Nulo en el resto. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_questions.entity.ts:64`)_ | coincide |
| 9 | `scale_max` | `integer` | Opcional | Máximo admitido en las preguntas de escala. Nulo en el resto. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_questions.entity.ts:70`)_ | coincide |
| 10 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/surveys/entities/survey_questions.entity.ts:76`)_ | coincide |
| 11 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/surveys/entities/survey_questions.entity.ts:82`)_ | coincide |
| 12 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 13 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 14 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_questions.entity.ts:100`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | survey_version_id | surveys.survey_versions (id) | fk_survey_questions_survey_version_id |
| hacia | answer_type_concept_id | terminology.catalog_concepts (id) | fk_survey_questions_answer_type_concept_id |
| hacia | created_by_user_id | iam.users (id) | fk_survey_questions_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_survey_questions_updated_by_user_id |
| desde | id | surveys.survey_answers (survey_question_id) | fk_survey_answers_survey_question_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_survey_questions_version_position` | no | survey_version_id, position | Soporta la clave foránea fk_survey_questions_survey_version_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 2 consulta(s) de repositorio filtran u ordenan por «survey_version_id», la primera columna del índice _(CONSULTA)_ |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /scheduling/bookings/{id}/complete | CREA | DIRECTA |
| POST /scheduling/bookings/{id}/complete | LEE | DIRECTA |
| GET /surveys/insights | LEE | POR_SQL |
| POST /surveys/invitations | CREA | DIRECTA |
| POST /surveys/invitations | LEE | DIRECTA |
| GET /surveys/me/invitations/{id} | LEE | DIRECTA |
| POST /surveys/me/invitations/{id}/responses | LEE | DIRECTA |
| GET /surveys/templates | LEE | DIRECTA |
| GET /surveys/templates/{id} | LEE | DIRECTA |
| POST /surveys/templates/{id}/questions | CREA | DIRECTA |
| POST /surveys/templates/{id}/questions | LEE | DIRECTA |
| DELETE /surveys/templates/{id}/questions/{questionId} | BORRA | POR_TIPO |
| DELETE /surveys/templates/{id}/questions/{questionId} | LEE | DIRECTA |
| PATCH /surveys/templates/{id}/questions/{questionId} | ACTUALIZA | POR_TIPO |
| PATCH /surveys/templates/{id}/questions/{questionId} | LEE | DIRECTA |
| PUT /surveys/templates/{id}/questions/order | LEE | DIRECTA |
| GET /surveys/templates/{id}/responses | LEE | DIRECTA |
| POST /surveys/templates/{id}/versions/{versionNumber}/publish | LEE | DIRECTA |

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

### survey_responses

#### Vista general

Registra respuestas privadas de pacientes a encuestas post-visita sin alimentar la calificación pública de prestadores.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_65_surveys.puml: survey_responses; BIZ note`
- **Dominio:** sin dato · **Diagrama:** `Mantra Core Health Context/modules/diagram_65_surveys.puml` · **DDL:** `SQL/65_surveys/02_tables.sql`
- **Entidad del ORM:** `SurveyResponses` — `src/modules/surveys/entities/survey_responses.entity.ts`
- **Resumen:** 11 columnas · 4 índices · 6 FK salientes · 1 entrantes · 3 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/surveys/entities/survey_responses.entity.ts:19`)_ | coincide |
| 2 | `survey_invitation_id` | `uuid` | Clave foránea → surveys.survey_invitations.id; Obligatoria | _sin dato_ | coincide |
| 3 | `survey_version_id` | `uuid` | Clave foránea → surveys.survey_versions.id; Obligatoria | _sin dato_ | coincide |
| 4 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 5 | `patient_profile_id` | `uuid` | Clave foránea → profiles.patient_profiles.profile_id; Obligatoria | Quién respondió. Redundante con la invitación a propósito: las lecturas del profesional filtran por paciente sin tener que unir la invitación. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_responses.entity.ts:44`)_ | coincide |
| 6 | `submitted_at` | `timestamptz` | Obligatoria | Momento del envío. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_responses.entity.ts:50`)_ | coincide |
| 7 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/surveys/entities/survey_responses.entity.ts:56`)_ | coincide |
| 8 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/surveys/entities/survey_responses.entity.ts:62`)_ | coincide |
| 9 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 10 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 11 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_responses.entity.ts:80`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | survey_invitation_id | surveys.survey_invitations (id) | fk_survey_responses_survey_invitation_id |
| hacia | survey_version_id | surveys.survey_versions (id) | fk_survey_responses_survey_version_id |
| hacia | tenant_id | directory.tenants (id) | fk_survey_responses_tenant_id |
| hacia | patient_profile_id | profiles.patient_profiles (profile_id) | fk_survey_responses_patient_profile_id |
| hacia | created_by_user_id | iam.users (id) | fk_survey_responses_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_survey_responses_updated_by_user_id |
| desde | id | surveys.survey_answers (survey_response_id) | fk_survey_answers_survey_response_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_survey_responses_invitation` | sí | survey_invitation_id | Garantiza que no se repita la combinación (survey_invitation_id) _(DOCUMENTO)_; Soporta la clave foránea fk_survey_responses_survey_invitation_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 2 consulta(s) de repositorio filtran u ordenan por «survey_invitation_id», la primera columna del índice _(CONSULTA)_ |
| `ix_survey_responses_patient_submitted` | no | patient_profile_id, ("submitted_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_survey_responses_version` | no | survey_version_id | Soporta la clave foránea fk_survey_responses_survey_version_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |
| `ix_survey_responses_tenant_id` | no | tenant_id | Soporta la clave foránea fk_survey_responses_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `uq_survey_responses_invitation` | UNIQUE INDEX | UNIQUE INDEX ("survey_invitation_id") |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| GET /surveys/insights | LEE | POR_SQL |
| POST /surveys/me/invitations/{id}/responses | CREA | DIRECTA |
| GET /surveys/templates/{id}/responses | LEE | DIRECTA |

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

### survey_templates

#### Vista general

Define cuestionarios post-atención que profesionales pueden usar para consultar la experiencia del paciente.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_65_surveys.puml: survey_templates; BIZ note`
- **Dominio:** sin dato · **Diagrama:** `Mantra Core Health Context/modules/diagram_65_surveys.puml` · **DDL:** `SQL/65_surveys/02_tables.sql`
- **Entidad del ORM:** `SurveyTemplates` — `src/modules/surveys/entities/survey_templates.entity.ts`
- **Resumen:** 13 columnas · 3 índices · 6 FK salientes · 1 entrantes · 25 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/surveys/entities/survey_templates.entity.ts:17`)_ | coincide |
| 2 | `tenant_id` | `uuid` | Clave foránea → directory.tenants.id; Obligatoria | _sin dato_ | coincide |
| 3 | `owner_practitioner_id` | `uuid` | Clave foránea → profiles.health_practitioner_profiles.profile_id; Opcional | Profesional dueño del instrumento. Es quien puede editarlo y quien puede leer las respuestas: la autorización de lectura sale de acá, no de un rol. Nulo cuando el dueño es el par tipado (`ownerTypeConceptId` + `ownerId`), como en la encuesta base del sistema. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_templates.entity.ts:32`)_ | coincide |
| 4 | `owner_type_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Opcional | Tipo del dueño alterno (CAN-SURVEY-001). Va junto con `ownerId` y sólo cuando `ownerPractitionerId` es nulo. Para la encuesta base del sistema es `SURVEYS.SYSTEM_BASE_CONSULTATION` o `SURVEYS.SYSTEM_BASE_SERVICE`. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_templates.entity.ts:44`)_ | coincide |
| 5 | `owner_id` | `uuid` | Opcional | Identificador del dueño alterno, interpretado según `ownerTypeConceptId`. Para la encuesta base del sistema es el tenant al que pertenece. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_templates.entity.ts:55`)_ | coincide |
| 6 | `title` | `text` | Obligatoria | Título visible del instrumento. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_templates.entity.ts:61`)_ | coincide |
| 7 | `description` | `text` | Opcional | Descripción o consigna que se muestra al paciente antes de responder. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_templates.entity.ts:67`)_ | coincide |
| 8 | `status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 9 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/surveys/entities/survey_templates.entity.ts:79`)_ | coincide |
| 10 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/surveys/entities/survey_templates.entity.ts:85`)_ | coincide |
| 11 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 12 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 13 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_templates.entity.ts:103`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | tenant_id | directory.tenants (id) | fk_survey_templates_tenant_id |
| hacia | owner_practitioner_id | profiles.health_practitioner_profiles (profile_id) | fk_survey_templates_owner_practitioner_id |
| hacia | owner_type_concept_id | terminology.catalog_concepts (id) | fk_survey_templates_owner_type_concept_id |
| hacia | status_concept_id | terminology.catalog_concepts (id) | fk_survey_templates_status_concept_id |
| hacia | created_by_user_id | iam.users (id) | fk_survey_templates_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_survey_templates_updated_by_user_id |
| desde | id | surveys.survey_versions (survey_template_id) | fk_survey_versions_survey_template_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `ix_survey_templates_owner` | no | owner_practitioner_id, ("created_at" DESC) | _sin uso detectado estáticamente_ |
| `ix_survey_templates_tenant_id` | no | tenant_id | Soporta la clave foránea fk_survey_templates_tenant_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 1 consulta(s) de repositorio filtran u ordenan por «tenant_id», la primera columna del índice _(CONSULTA)_ |
| `ix_survey_templates_owner_party` | no | owner_type_concept_id, owner_id, ("created_at" DESC) | _sin uso detectado estáticamente_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `ck_survey_templates_single_owner` | CHECK | CHECK (("owner_practitioner_id" IS NOT NULL AND "owner_type_concept_id" IS NULL AND "owner_id" IS NULL) OR ("owner_practitioner_id" IS NULL AND "owner_type_concept_id" IS NOT NULL AND "owner_id" IS NOT NULL)) |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /scheduling/bookings/{id}/complete | ACTUALIZA | POR_TIPO |
| POST /scheduling/bookings/{id}/complete | CREA | DIRECTA |
| POST /scheduling/bookings/{id}/complete | LEE | DIRECTA |
| POST /surveys/assignments | LEE | DIRECTA |
| GET /surveys/insights | LEE | POR_SQL |
| POST /surveys/invitations | ACTUALIZA | POR_TIPO |
| POST /surveys/invitations | CREA | DIRECTA |
| POST /surveys/invitations | LEE | DIRECTA |
| GET /surveys/me/invitations | LEE | POR_SQL |
| GET /surveys/me/invitations/{id} | LEE | DIRECTA |
| GET /surveys/templates | LEE | DIRECTA |
| POST /surveys/templates | CREA | DIRECTA |
| GET /surveys/templates/{id} | LEE | DIRECTA |
| PATCH /surveys/templates/{id} | ACTUALIZA | POR_TIPO |
| PATCH /surveys/templates/{id} | LEE | DIRECTA |
| POST /surveys/templates/{id}/deactivate | ACTUALIZA | POR_TIPO |
| POST /surveys/templates/{id}/deactivate | LEE | DIRECTA |
| POST /surveys/templates/{id}/questions | LEE | DIRECTA |
| DELETE /surveys/templates/{id}/questions/{questionId} | LEE | DIRECTA |
| PATCH /surveys/templates/{id}/questions/{questionId} | LEE | DIRECTA |
| PUT /surveys/templates/{id}/questions/order | LEE | DIRECTA |
| GET /surveys/templates/{id}/responses | LEE | DIRECTA |
| POST /surveys/templates/{id}/versions | LEE | DIRECTA |
| POST /surveys/templates/{id}/versions/{versionNumber}/publish | ACTUALIZA | POR_TIPO |
| POST /surveys/templates/{id}/versions/{versionNumber}/publish | LEE | DIRECTA |

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

### survey_versions

#### Vista general

Preserva versiones inmutables de cuestionarios para conocer qué preguntas se presentaron en cada atención.

- **Estado del propósito:** DOMAIN_CURATED_DRAFT · fuente: `Mantra Core Health Context/modules/diagram_65_surveys.puml: survey_versions; BIZ note`
- **Dominio:** sin dato · **Diagrama:** `Mantra Core Health Context/modules/diagram_65_surveys.puml` · **DDL:** `SQL/65_surveys/02_tables.sql`
- **Entidad del ORM:** `SurveyVersions` — `src/modules/surveys/entities/survey_versions.entity.ts`
- **Resumen:** 14 columnas · 1 índices · 4 FK salientes · 5 entrantes · 24 operaciones

#### Columnas

| # | Columna | Tipo | Rol estructural | Descripción | ORM |
|---|---|---|---|---|---|
| 1 | `id` | `uuid` | Clave primaria; Obligatoria | Identificador único de la instancia. _(JSDOC_ESTANDAR, `src/modules/surveys/entities/survey_versions.entity.ts:22`)_ | coincide |
| 2 | `survey_template_id` | `uuid` | Clave foránea → surveys.survey_templates.id; Obligatoria | _sin dato_ | coincide |
| 3 | `version_number` | `integer` | Obligatoria | Número de versión, correlativo dentro de la plantilla y arrancando en 1. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_versions.entity.ts:34`)_ | coincide |
| 4 | `publication_status_concept_id` | `uuid` | Clave foránea → terminology.catalog_concepts.id; Obligatoria | _sin dato_ | coincide |
| 5 | `effective_from` | `timestamptz` | Opcional | Inicio de vigencia. Nulo mientras la versión sigue en borrador. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_versions.entity.ts:46`)_ | coincide |
| 6 | `effective_to` | `timestamptz` | Opcional | Fin de vigencia. Nulo significa vigencia abierta. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_versions.entity.ts:56`)_ | coincide |
| 7 | `response_window_days` | `integer` | Obligatoria | Plazo, en días, que tiene el paciente para responder desde que se le emite la invitación. Es distinto de la vigencia de la versión: la vigencia dice hasta cuándo se reparte el instrumento; esto, cuánto dura cada reparto. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_versions.entity.ts:68`)_ | coincide |
| 8 | `max_reminders` | `integer` | Opcional | Tope de recordatorios por invitación. Nulo significa que no se envían. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_versions.entity.ts:74`)_ | coincide |
| 9 | `published_at` | `timestamptz` | Opcional | Momento de publicación. Nulo mientras es borrador. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_versions.entity.ts:80`)_ | coincide |
| 10 | `created_at` | `timestamptz` | Obligatoria | Fecha y hora en que se creó el registro. _(JSDOC_ESTANDAR, `src/modules/surveys/entities/survey_versions.entity.ts:90`)_ | coincide |
| 11 | `updated_at` | `timestamptz` | Obligatoria | Fecha y hora de la última actualización. _(JSDOC_ESTANDAR, `src/modules/surveys/entities/survey_versions.entity.ts:96`)_ | coincide |
| 12 | `created_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 13 | `updated_by_user_id` | `uuid` | Clave foránea → iam.users.id; Opcional | _sin dato_ | coincide |
| 14 | `row_version` | `integer = 1` | Obligatoria | Versión usada para controlar actualizaciones concurrentes. _(JSDOC_ENTIDAD, `src/modules/surveys/entities/survey_versions.entity.ts:114`)_ | coincide |

#### Relaciones

| Sentido | Columnas | Tabla | Restricción |
|---|---|---|---|
| hacia | survey_template_id | surveys.survey_templates (id) | fk_survey_versions_survey_template_id |
| hacia | publication_status_concept_id | terminology.catalog_concepts (id) | fk_survey_versions_publication_status_concept_id |
| hacia | created_by_user_id | iam.users (id) | fk_survey_versions_created_by_user_id |
| hacia | updated_by_user_id | iam.users (id) | fk_survey_versions_updated_by_user_id |
| desde | id | surveys.survey_questions (survey_version_id) | fk_survey_questions_survey_version_id |
| desde | id | surveys.survey_assignments (survey_version_id) | fk_survey_assignments_survey_version_id |
| desde | id | surveys.survey_invitations (survey_version_id) | fk_survey_invitations_survey_version_id |
| desde | id | surveys.survey_invitations (extension_survey_version_id) | fk_survey_invitations_extension_survey_version_id |
| desde | id | surveys.survey_responses (survey_version_id) | fk_survey_responses_survey_version_id |

#### Índices

| Índice | Único | Columnas | Para qué |
|---|---|---|---|
| `uq_survey_versions_template_number` | sí | survey_template_id, version_number | Garantiza que no se repita la combinación (survey_template_id, version_number) _(DOCUMENTO)_; Soporta la clave foránea fk_survey_versions_survey_template_id: PostgreSQL no indexa las FK por sí mismo _(DOCUMENTO)_; 3 consulta(s) de repositorio filtran u ordenan por «survey_template_id», la primera columna del índice _(CONSULTA)_ |

#### Restricciones

| Restricción | Tipo | Definición |
|---|---|---|
| `uq_survey_versions_template_number` | UNIQUE INDEX | UNIQUE INDEX ("survey_template_id", "version_number") |
| `ck_survey_versions_max_reminders` | CHECK | CHECK (("max_reminders" IS NULL OR "max_reminders" >= 0)) |

#### Operaciones que la tocan

| Operación | Efecto | Confianza |
|---|---|---|
| POST /scheduling/bookings/{id}/complete | ACTUALIZA | POR_TIPO |
| POST /scheduling/bookings/{id}/complete | CREA | DIRECTA |
| POST /scheduling/bookings/{id}/complete | LEE | DIRECTA |
| POST /surveys/assignments | LEE | DIRECTA |
| GET /surveys/insights | LEE | POR_SQL |
| POST /surveys/invitations | ACTUALIZA | POR_TIPO |
| POST /surveys/invitations | CREA | DIRECTA |
| POST /surveys/invitations | LEE | DIRECTA |
| GET /surveys/me/invitations | LEE | POR_SQL |
| GET /surveys/me/invitations/{id} | LEE | DIRECTA |
| GET /surveys/templates | LEE | DIRECTA |
| POST /surveys/templates | CREA | DIRECTA |
| GET /surveys/templates/{id} | LEE | DIRECTA |
| PATCH /surveys/templates/{id} | ACTUALIZA | POR_TIPO |
| PATCH /surveys/templates/{id} | LEE | DIRECTA |
| POST /surveys/templates/{id}/questions | LEE | DIRECTA |
| DELETE /surveys/templates/{id}/questions/{questionId} | LEE | DIRECTA |
| PATCH /surveys/templates/{id}/questions/{questionId} | LEE | DIRECTA |
| PUT /surveys/templates/{id}/questions/order | LEE | DIRECTA |
| GET /surveys/templates/{id}/responses | LEE | DIRECTA |
| POST /surveys/templates/{id}/versions | CREA | DIRECTA |
| POST /surveys/templates/{id}/versions | LEE | DIRECTA |
| POST /surveys/templates/{id}/versions/{versionNumber}/publish | ACTUALIZA | POR_TIPO |
| POST /surveys/templates/{id}/versions/{versionNumber}/publish | LEE | DIRECTA |

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

