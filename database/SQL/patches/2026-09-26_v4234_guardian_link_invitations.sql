-- ============================================================================
-- SALUD · patch v4.2.34 (profiles · invitación al tutor del paciente de mostrador)
-- Fecha: 2026-09-26
-- Idempotente (CREATE TABLE IF NOT EXISTS / CREATE [UNIQUE] INDEX IF NOT EXISTS /
-- ADD CONSTRAINT bajo EXCEPTION duplicate_object / DROP CONSTRAINT IF EXISTS
-- antes de cada CHECK). UNA sola pasada. Sin backfill: no hay invitaciones previas.
--
-- PARCHE PROPIO DE LA API. Todavía no lo declara `diagram_05_profiles.puml`, así
-- que `gen_ddl.py 05` no lo emite y NO se tocó `SQL/05_profiles/` (archivos
-- generados, «NO editar a mano»). Pedido al modelo: declarar la tabla en el
-- diagrama del módulo 05 para que un rebuild desde cero la traiga sin este patch.
-- Mientras tanto `postgres-init` aplica `patches/` en toda base, nueva o viva.
--
-- QUÉ CIERRA. El alta de mostrador (walk-in) guarda al tutor como persona
-- relacionada (`profiles.related_persons`) y no avisaba a nadie. Ahora publica
-- `GuardianLinkRequested` en el outbox y el worker de mensajería le manda al
-- teléfono del tutor un enlace de un solo uso para confirmar el vínculo. Esta
-- tabla es el registro de esa invitación:
--
--   profiles.guardian_link_invitations   una por evento de dominio; guarda el
--                                        SHA-256 del token (nunca el token ni el
--                                        teléfono), el estado, el canal y el
--                                        resultado del último envío.
--
-- Por qué no `messaging.notification_requests`: su `recipient_user_id` es NOT
-- NULL con FK a `iam.users`, y el tutor de un walk-in no tiene cuenta.
--
-- Confirmar el enlace prueba que el teléfono es de quien lo atendió; NO otorga
-- la tutela legal (`related_persons.is_legal_guardian` no se toca).
-- ============================================================================

BEGIN;

-- 1. Tabla
CREATE TABLE IF NOT EXISTS "profiles"."guardian_link_invitations" (
    "id" uuid NOT NULL,
    "tenant_id" uuid,
    "patient_profile_id" uuid NOT NULL,
    "related_person_id" uuid NOT NULL,
    "guardian_person_id" uuid NOT NULL,
    "domain_event_id" uuid NOT NULL,
    "token_hash" varchar,
    "status_concept_id" uuid NOT NULL,
    "channel_code" varchar,
    "provider_message_ref" varchar,
    "attempt_count" integer NOT NULL DEFAULT 0,
    "last_error_code" varchar,
    "expires_at" timestamptz,
    "sent_at" timestamptz,
    "confirmed_at" timestamptz,
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_by_user_id" uuid,
    "updated_by_user_id" uuid,
    "row_version" integer NOT NULL DEFAULT 1,
    CONSTRAINT "pk_guardian_link_invitations" PRIMARY KEY ("id")
);

-- 2. Índices
-- Una invitación por evento: la cola entrega al menos una vez.
CREATE UNIQUE INDEX IF NOT EXISTS "uq_guardian_link_invitations_domain_event_id" ON "profiles"."guardian_link_invitations" ("domain_event_id");

-- El token vigente identifica una sola invitación (nulo tras confirmar).
CREATE UNIQUE INDEX IF NOT EXISTS "uq_guardian_link_invitations_token_hash" ON "profiles"."guardian_link_invitations" ("token_hash") WHERE "token_hash" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "ix_guardian_link_invitations_tenant_id" ON "profiles"."guardian_link_invitations" ("tenant_id");

CREATE INDEX IF NOT EXISTS "ix_guardian_link_invitations_patient_profile_id" ON "profiles"."guardian_link_invitations" ("patient_profile_id");

CREATE INDEX IF NOT EXISTS "ix_guardian_link_invitations_related_person_id" ON "profiles"."guardian_link_invitations" ("related_person_id");

CREATE INDEX IF NOT EXISTS "ix_guardian_link_invitations_guardian_person_id" ON "profiles"."guardian_link_invitations" ("guardian_person_id");

CREATE INDEX IF NOT EXISTS "ix_guardian_link_invitations_status_concept_id" ON "profiles"."guardian_link_invitations" ("status_concept_id");

CREATE INDEX IF NOT EXISTS "ix_guardian_link_invitations_created_by_user_id" ON "profiles"."guardian_link_invitations" ("created_by_user_id");

CREATE INDEX IF NOT EXISTS "ix_guardian_link_invitations_updated_by_user_id" ON "profiles"."guardian_link_invitations" ("updated_by_user_id");

-- 3. FK intra-schema
DO $$ BEGIN
    ALTER TABLE "profiles"."guardian_link_invitations"
        ADD CONSTRAINT "fk_guardian_link_invitations_patient_profile_id" FOREIGN KEY ("patient_profile_id")
        REFERENCES "profiles"."patient_profiles" ("profile_id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "profiles"."guardian_link_invitations"
        ADD CONSTRAINT "fk_guardian_link_invitations_related_person_id" FOREIGN KEY ("related_person_id")
        REFERENCES "profiles"."related_persons" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "profiles"."guardian_link_invitations"
        ADD CONSTRAINT "fk_guardian_link_invitations_guardian_person_id" FOREIGN KEY ("guardian_person_id")
        REFERENCES "profiles"."persons" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. FK cross-schema (los destinos ya existen: patches/ corre después de todo el DDL)
DO $$ BEGIN
    ALTER TABLE "profiles"."guardian_link_invitations"
        ADD CONSTRAINT "fk_guardian_link_invitations_tenant_id" FOREIGN KEY ("tenant_id")
        REFERENCES "directory"."tenants" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "profiles"."guardian_link_invitations"
        ADD CONSTRAINT "fk_guardian_link_invitations_domain_event_id" FOREIGN KEY ("domain_event_id")
        REFERENCES "messaging"."domain_events" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "profiles"."guardian_link_invitations"
        ADD CONSTRAINT "fk_guardian_link_invitations_status_concept_id" FOREIGN KEY ("status_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "profiles"."guardian_link_invitations"
        ADD CONSTRAINT "fk_guardian_link_invitations_created_by_user_id" FOREIGN KEY ("created_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "profiles"."guardian_link_invitations"
        ADD CONSTRAINT "fk_guardian_link_invitations_updated_by_user_id" FOREIGN KEY ("updated_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. CHECK
ALTER TABLE "profiles"."guardian_link_invitations" DROP CONSTRAINT IF EXISTS "ck_guardian_link_invitations_channel_code";
ALTER TABLE "profiles"."guardian_link_invitations"
    ADD CONSTRAINT "ck_guardian_link_invitations_channel_code"
    CHECK ("channel_code" IS NULL OR "channel_code" IN ('SMS', 'WHATSAPP'));

ALTER TABLE "profiles"."guardian_link_invitations" DROP CONSTRAINT IF EXISTS "ck_guardian_link_invitations_attempt_count";
ALTER TABLE "profiles"."guardian_link_invitations"
    ADD CONSTRAINT "ck_guardian_link_invitations_attempt_count"
    CHECK ("attempt_count" >= 0);

-- SHA-256 en hex: 64 caracteres, o nada.
ALTER TABLE "profiles"."guardian_link_invitations" DROP CONSTRAINT IF EXISTS "ck_guardian_link_invitations_token_hash";
ALTER TABLE "profiles"."guardian_link_invitations"
    ADD CONSTRAINT "ck_guardian_link_invitations_token_hash"
    CHECK ("token_hash" IS NULL OR "token_hash" ~ '^[0-9a-f]{64}$');

COMMIT;
