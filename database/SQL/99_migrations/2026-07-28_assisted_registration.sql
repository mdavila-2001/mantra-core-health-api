-- =============================================================================
-- Migración REDESA — Registro asistido de pacientes (C-18 / CAN-IDENT)
-- =============================================================================
-- Un clínico u organización crea la cuenta de un paciente que no puede hacerlo por
-- sí mismo. El creador NUNCA conoce ni conserva la contraseña definitiva: se emite
-- una activación de un solo uso (se persiste solo el HASH del token con expiración)
-- y se exige que el titular fije su contraseña en el primer ingreso (activación).
--
-- Cambios ADITIVOS e IDEMPOTENTES (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS):
--   1. iam.users.must_change_password — la cuenta creada exige cambio de credencial
--      (queda en estado PENDING, reutilizando el concepto state:pending).
--   2. iam.account_activations — token de activación de un solo uso (solo su hash),
--      con creador, motivo y representación legal para trazabilidad completa.
--
-- Se aplica con el rol propietario (mantra). No borra ni reescribe nada existente.
-- =============================================================================

-- 1) Bandera de cambio de contraseña obligatorio en el primer ingreso ----------
ALTER TABLE "iam"."users"
  ADD COLUMN IF NOT EXISTS "must_change_password" boolean;

-- 2) Tabla de activaciones de cuenta (registro asistido) -----------------------
CREATE TABLE IF NOT EXISTS "iam"."account_activations" (
    "id"                           uuid        NOT NULL DEFAULT gen_random_uuid(),
    "user_id"                      uuid        NOT NULL,               -- FK → iam.users (cuenta creada)
    "token_hash"                   varchar     NOT NULL,               -- SHA-256 (hex) del token de activación; el token en claro nunca se guarda
    "state_concept_id"             uuid        NOT NULL,               -- FK → terminology.catalog_concepts (state:active|verified|expired)
    "reason"                       varchar,                            -- motivo del registro asistido (C-18)
    "legal_representation_id"      uuid,                               -- FK → authz.patient_legal_representations (si aplica)
    "legal_representative_user_id" uuid,                               -- FK → iam.users (dato mínimo de representación si no hay fila formal)
    "expires_at"                   timestamptz NOT NULL,               -- caducidad del token de un solo uso
    "consumed_at"                  timestamptz,                        -- instante en que se consumió (un solo uso)
    "created_at"                   timestamptz NOT NULL DEFAULT now(),
    "updated_at"                   timestamptz NOT NULL DEFAULT now(),
    "created_by_user_id"           uuid,                               -- FK → iam.users (el CLÍNICO/ADMIN que creó la cuenta)
    "updated_by_user_id"           uuid,                               -- FK → iam.users
    "row_version"                  integer     NOT NULL DEFAULT 1,
    CONSTRAINT "pk_account_activations" PRIMARY KEY ("id")
);

-- Búsqueda/consumo del token por hash (un solo uso). Único: un hash no se reutiliza.
CREATE UNIQUE INDEX IF NOT EXISTS "ux_account_activations_token_hash"
  ON "iam"."account_activations" ("token_hash");

-- Activaciones pendientes por usuario (para reemitir / auditar).
CREATE INDEX IF NOT EXISTS "ix_account_activations_user"
  ON "iam"."account_activations" ("user_id", "state_concept_id");
