-- =============================================================================
-- Migración REDESA — Auto-registro de pacientes por documento de identidad
-- =============================================================================
-- El paciente se registra por sí mismo con su CI y una contraseña que él elige,
-- así que la cuenta nace ACTIVA (no hay token de activación como en el registro
-- asistido C-18). El correo es OPCIONAL: si lo aporta se emite un token de
-- verificación de un solo uso, pero verificarlo NO condiciona el acceso — desde
-- el registro el titular ya puede navegar la aplicación.
--
-- El documento de identidad se guarda en la MISMA columna que ya usa el login
-- por correo (`iam.authentication_credentials.external_subject`), así que no
-- hace falta ninguna columna nueva para autenticar por CI.
--
-- Cambios ADITIVOS e IDEMPOTENTES (IF NOT EXISTS):
--   1. iam.email_verifications — token de verificación de correo de un solo uso
--      (solo su hash), con la dirección verificada y su caducidad.
--
-- Se aplica con el rol propietario (mantra). No borra ni reescribe nada existente.
-- =============================================================================

CREATE TABLE IF NOT EXISTS "iam"."email_verifications" (
    "id"                 uuid        NOT NULL DEFAULT gen_random_uuid(),
    "user_id"            uuid        NOT NULL,               -- FK → iam.users
    "email"              varchar     NOT NULL,               -- dirección que se está verificando
    "token_hash"         varchar     NOT NULL,               -- SHA-256 (hex); el token en claro nunca se guarda
    "state_concept_id"   uuid        NOT NULL,               -- FK → terminology.catalog_concepts (state:active|verified|expired)
    "expires_at"         timestamptz NOT NULL,               -- caducidad del token de un solo uso
    "consumed_at"        timestamptz,                        -- instante en que se consumió (un solo uso)
    "created_at"         timestamptz NOT NULL DEFAULT now(),
    "updated_at"         timestamptz NOT NULL DEFAULT now(),
    "created_by_user_id" uuid,                               -- FK → iam.users
    "updated_by_user_id" uuid,                               -- FK → iam.users
    "row_version"        integer     NOT NULL DEFAULT 1,
    CONSTRAINT "pk_email_verifications" PRIMARY KEY ("id")
);

-- Consumo del token por hash. Único: un hash no se reutiliza.
CREATE UNIQUE INDEX IF NOT EXISTS "ux_email_verifications_token_hash"
  ON "iam"."email_verifications" ("token_hash");

-- Verificaciones vivas por usuario (para reemitir / auditar).
CREATE INDEX IF NOT EXISTS "ix_email_verifications_user"
  ON "iam"."email_verifications" ("user_id", "state_concept_id");
