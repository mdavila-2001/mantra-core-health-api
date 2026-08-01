-- =============================================================================
-- 2026-08-01 · Recuperación de contraseña
--
-- Añade:
--   1. iam.password_resets — token de restablecimiento de un solo uso (solo su
--      hash SHA-256), con el sujeto al que se emitió y su caducidad.
--
-- Por qué hace falta una tabla y no se reutiliza `iam.email_verifications`:
-- comparten forma pero no significado. Consumir un token de verificación marca
-- un correo como probado; consumir uno de restablecimiento cambia una credencial
-- y mata todas las sesiones. Mezclarlos en una tabla dejaría que un token
-- emitido para lo primero sirviera para lo segundo, que es una escalada de
-- privilegio con la forma de un ahorro de tabla.
--
-- Sigue el mismo patrón aditivo que 2026-07-30_patient_self_registration.sql.
-- Se aplica con el rol propietario (mantra). No borra ni reescribe nada.
-- =============================================================================

CREATE TABLE IF NOT EXISTS "iam"."password_resets" (
    "id"                 uuid        NOT NULL DEFAULT gen_random_uuid(),
    "user_id"            uuid        NOT NULL,               -- FK → iam.users
    "external_subject"   varchar     NOT NULL,               -- identificador con el que se pidió (email o documento)
    "token_hash"         varchar     NOT NULL,               -- SHA-256 (hex); el token en claro nunca se guarda
    "state_concept_id"   uuid        NOT NULL,               -- FK → terminology.catalog_concepts (state:active|verified|expired|revoked)
    "expires_at"         timestamptz NOT NULL,               -- caducidad del token de un solo uso
    "consumed_at"        timestamptz,                        -- instante en que se consumió (un solo uso)
    "requested_ip"       varchar,                            -- origen de la solicitud, para auditar abuso
    "created_at"         timestamptz NOT NULL DEFAULT now(),
    "updated_at"         timestamptz NOT NULL DEFAULT now(),
    "created_by_user_id" uuid,                               -- FK → iam.users
    "updated_by_user_id" uuid,                               -- FK → iam.users
    "row_version"        integer     NOT NULL DEFAULT 1,
    CONSTRAINT "pk_password_resets" PRIMARY KEY ("id")
);

-- Consumo del token por hash. Único: un hash no se reutiliza jamás.
CREATE UNIQUE INDEX IF NOT EXISTS "ux_password_resets_token_hash"
  ON "iam"."password_resets" ("token_hash");

-- Solicitudes vivas por usuario: pedir una nueva revoca las anteriores, y esta
-- es la consulta que lo resuelve.
CREATE INDEX IF NOT EXISTS "ix_password_resets_user_state"
  ON "iam"."password_resets" ("user_id", "state_concept_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_password_resets_user'
  ) THEN
    ALTER TABLE "iam"."password_resets"
      ADD CONSTRAINT "fk_password_resets_user"
      FOREIGN KEY ("user_id") REFERENCES "iam"."users" ("id");
  END IF;
END $$;
