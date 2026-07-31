-- =============================================================================
-- Migración REDESA — Relación asistencial y representación legal del paciente
-- =============================================================================
-- Materializa a nivel BASE dos vínculos que las reglas REDESA exigen y que hoy
-- NO existen (CAN-AUTH-001, C-06, C-07, A-03):
--   * authz.care_relationships          — relación asistencial practicante↔paciente
--   * authz.patient_legal_representations — representación legal del paciente
-- Ambas alimentan al PDP (además de authz.clinical_access_grants). Fail-closed.
-- Idempotente (CREATE TABLE IF NOT EXISTS). Se aplican con el rol propietario.
-- =============================================================================

-- --- Relación asistencial: vínculo tratante/consultor/emergencia ------------
CREATE TABLE IF NOT EXISTS authz.care_relationships (
  id                            uuid PRIMARY KEY,
  tenant_id                     uuid NOT NULL,          -- FK → directory.tenants
  patient_profile_id            uuid NOT NULL,          -- FK → profiles.patient_profiles
  practitioner_profile_id       uuid NOT NULL,          -- FK → profiles.practitioner_profiles
  relationship_type_concept_id  uuid NOT NULL,          -- FK → terminology.catalog_concepts
  status_concept_id             uuid NOT NULL,          -- FK → terminology.catalog_concepts
  purpose_concept_id            uuid,                   -- FK → terminology.catalog_concepts
  valid_from                    timestamptz NOT NULL,
  valid_to                      timestamptz,
  established_by_user_id         uuid,                  -- FK → iam.users
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now(),
  created_by_user_id            uuid,                   -- FK → iam.users
  updated_by_user_id            uuid,                   -- FK → iam.users
  row_version                   integer NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS ix_care_relationships_tenant
  ON authz.care_relationships (tenant_id);
CREATE INDEX IF NOT EXISTS ix_care_relationships_patient
  ON authz.care_relationships (patient_profile_id);
CREATE INDEX IF NOT EXISTS ix_care_relationships_practitioner
  ON authz.care_relationships (practitioner_profile_id);

-- --- Representación legal del paciente --------------------------------------
CREATE TABLE IF NOT EXISTS authz.patient_legal_representations (
  id                             uuid PRIMARY KEY,
  tenant_id                      uuid NOT NULL,         -- FK → directory.tenants
  patient_profile_id             uuid NOT NULL,         -- FK → profiles.patient_profiles
  representative_user_id         uuid NOT NULL,         -- FK → iam.users
  representation_type_concept_id uuid NOT NULL,         -- FK → terminology.catalog_concepts
  status_concept_id              uuid NOT NULL,         -- FK → terminology.catalog_concepts
  valid_from                     timestamptz NOT NULL,
  valid_to                       timestamptz,
  document_ref                   varchar(200),
  created_at                     timestamptz NOT NULL DEFAULT now(),
  updated_at                     timestamptz NOT NULL DEFAULT now(),
  created_by_user_id             uuid,                  -- FK → iam.users
  updated_by_user_id             uuid,                  -- FK → iam.users
  row_version                    integer NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS ix_patient_legal_representations_tenant
  ON authz.patient_legal_representations (tenant_id);
CREATE INDEX IF NOT EXISTS ix_patient_legal_representations_patient
  ON authz.patient_legal_representations (patient_profile_id);
