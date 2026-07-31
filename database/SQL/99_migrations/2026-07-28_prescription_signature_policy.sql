-- =============================================================================
-- Migración REDESA D-05 / CAN-RX — Política PARAMETRIZABLE de firma de receta
-- =============================================================================
-- La obligatoriedad de firma de una receta depende de la jurisdicción, el tipo
-- de medicamento y el canal de emisión. Hoy no es configurable. Esta migración
-- materializa la política a nivel BASE y añade, de forma ADITIVA, las columnas de
-- firma a la receta.
--
-- Diseño FAIL-SAFE: si un tenant no tiene política vigente que aplique, NO se
-- exige firma (el flujo actual de emisión sigue intacto). La exigencia solo
-- aparece cuando existe una política vigente y específica con
-- signature_required = true.
--
-- Idempotente (CREATE TABLE / ADD COLUMN IF NOT EXISTS). Se aplica con el rol
-- propietario del esquema clinical.
-- =============================================================================

-- --- Política parametrizable de firma --------------------------------------
-- Dimensiones NULLABLE = comodín ("aplica a todos"). La política más específica
-- vigente (más dimensiones no nulas coincidentes; desempate por effective_from
-- más reciente) es la que decide. La resolución la hace el servicio en memoria.
CREATE TABLE IF NOT EXISTS clinical.prescription_signature_policies (
  id                          uuid PRIMARY KEY,
  tenant_id                   uuid NOT NULL,          -- FK → directory.tenants
  jurisdiction_code           varchar(16),            -- comodín si NULL
  medication_type_concept_id  uuid,                   -- FK → terminology.catalog_concepts; comodín si NULL
  channel_concept_id          uuid,                   -- FK → terminology.catalog_concepts; comodín si NULL
  signature_required          boolean NOT NULL DEFAULT false,
  effective_from              timestamptz NOT NULL,
  effective_to                timestamptz,            -- NULL = vigente indefinidamente
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),
  created_by_user_id          uuid,                   -- FK → iam.users
  updated_by_user_id          uuid,                   -- FK → iam.users
  row_version                 integer NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS ix_prescription_signature_policies_tenant
  ON clinical.prescription_signature_policies (tenant_id);

-- --- Firma de la receta (aditivo) ------------------------------------------
-- La receta no tenía estado/columna de firma. Se añaden columnas NULLABLE para
-- registrar quién firmó y cuándo, sin romper filas existentes ni el flujo actual
-- (una receta sin firma tiene ambas en NULL). La emisión (`issue`) solo exige que
-- estén pobladas cuando una política vigente lo requiere.
ALTER TABLE clinical.medication_requests
  ADD COLUMN IF NOT EXISTS signed_at         timestamptz;
ALTER TABLE clinical.medication_requests
  ADD COLUMN IF NOT EXISTS signed_by_user_id uuid;          -- FK → iam.users
