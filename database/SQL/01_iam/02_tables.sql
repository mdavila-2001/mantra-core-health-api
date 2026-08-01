-- SALUD v4.0.1 · módulo 01 · schema iam
-- Generado de diagram_01_iam.puml — NO editar a mano.


CREATE TABLE IF NOT EXISTS "iam"."users" (
    "id" uuid NOT NULL,
    "status_concept_id" uuid NOT NULL,
    "display_name" varchar NOT NULL,
    "preferred_language_concept_id" uuid,
    "time_zone" varchar,
    "residence_country_concept_id" uuid,
    "data_residency_region_concept_id" uuid,
    "email_verified" boolean,
    "phone_verified" boolean,
    "mfa_status_concept_id" uuid,
    "legal_basis_concept_id" uuid,
    "privacy_accepted_at" timestamptz,
    "privacy_policy_version" varchar,
    "anonymized_at" timestamptz,
    "last_login_at" timestamptz,
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_by_user_id" uuid,
    "updated_by_user_id" uuid,
    "row_version" integer NOT NULL,
    CONSTRAINT "pk_users" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "iam"."authentication_credentials" (
    "id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "method_concept_id" uuid NOT NULL,
    "external_subject" varchar,
    "secret_hash" varchar,
    "hash_algorithm_concept_id" uuid,
    "public_key" text,
    "identity_provider" varchar,
    "state_concept_id" uuid NOT NULL,
    "last_used_at" timestamptz,
    "expires_at" timestamptz,
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_by_user_id" uuid,
    "updated_by_user_id" uuid,
    "row_version" integer NOT NULL,
    CONSTRAINT "pk_authentication_credentials" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "iam"."mfa_factors" (
    "id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "factor_type_concept_id" uuid NOT NULL,
    "label" varchar,
    "secret_encrypted" text,
    "state_concept_id" uuid NOT NULL,
    "verified_at" timestamptz,
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_by_user_id" uuid,
    "updated_by_user_id" uuid,
    "row_version" integer NOT NULL,
    CONSTRAINT "pk_mfa_factors" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "iam"."devices" (
    "id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "device_fingerprint" varchar,
    "platform_concept_id" uuid,
    "name" varchar,
    "push_token_encrypted" text,
    "trusted" boolean,
    "last_seen_at" timestamptz,
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_by_user_id" uuid,
    "updated_by_user_id" uuid,
    "row_version" integer NOT NULL,
    CONSTRAINT "pk_devices" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "iam"."sessions" (
    "id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "device_id" uuid,
    "token_id" varchar NOT NULL,
    "ip" inet,
    "geo_location" varchar,
    "state_concept_id" uuid NOT NULL,
    "expires_at" timestamptz NOT NULL,
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_by_user_id" uuid,
    "updated_by_user_id" uuid,
    "row_version" integer NOT NULL,
    CONSTRAINT "pk_sessions" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "iam"."refresh_tokens" (
    "id" uuid NOT NULL,
    "session_id" uuid NOT NULL,
    "token_hash" varchar NOT NULL,
    "state_concept_id" uuid NOT NULL,
    "replaced_by_id" uuid,
    "expires_at" timestamptz NOT NULL,
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_by_user_id" uuid,
    "updated_by_user_id" uuid,
    "row_version" integer NOT NULL,
    CONSTRAINT "pk_refresh_tokens" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "iam"."user_global_roles" (
    "id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "role_concept_id" uuid NOT NULL,
    "state_concept_id" uuid NOT NULL,
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_by_user_id" uuid,
    "updated_by_user_id" uuid,
    "row_version" integer NOT NULL,
    CONSTRAINT "pk_user_global_roles" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "iam"."security_events" (
    "id" uuid NOT NULL,
    "user_id" uuid,
    "event_type_concept_id" uuid NOT NULL,
    "outcome_concept_id" uuid NOT NULL,
    "ip" inet,
    "detail_json" jsonb,
    "recorded_at" timestamptz NOT NULL,
    "recorded_by_user_id" uuid,
    CONSTRAINT "pk_security_events" PRIMARY KEY ("id")
);
