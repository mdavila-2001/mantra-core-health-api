-- SALUD v4.0.1 · módulo 01 · schema iam
-- Generado de diagram_01_iam.puml — NO editar a mano.


DO $$ BEGIN
    ALTER TABLE "iam"."users"
        ADD CONSTRAINT "fk_users_created_by_user_id" FOREIGN KEY ("created_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "iam"."users"
        ADD CONSTRAINT "fk_users_updated_by_user_id" FOREIGN KEY ("updated_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "iam"."authentication_credentials"
        ADD CONSTRAINT "fk_authentication_credentials_user_id" FOREIGN KEY ("user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "iam"."authentication_credentials"
        ADD CONSTRAINT "fk_authentication_credentials_created_by_user_id" FOREIGN KEY ("created_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "iam"."authentication_credentials"
        ADD CONSTRAINT "fk_authentication_credentials_updated_by_user_id" FOREIGN KEY ("updated_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "iam"."mfa_factors"
        ADD CONSTRAINT "fk_mfa_factors_user_id" FOREIGN KEY ("user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "iam"."mfa_factors"
        ADD CONSTRAINT "fk_mfa_factors_created_by_user_id" FOREIGN KEY ("created_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "iam"."mfa_factors"
        ADD CONSTRAINT "fk_mfa_factors_updated_by_user_id" FOREIGN KEY ("updated_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "iam"."devices"
        ADD CONSTRAINT "fk_devices_user_id" FOREIGN KEY ("user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "iam"."devices"
        ADD CONSTRAINT "fk_devices_created_by_user_id" FOREIGN KEY ("created_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "iam"."devices"
        ADD CONSTRAINT "fk_devices_updated_by_user_id" FOREIGN KEY ("updated_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "iam"."sessions"
        ADD CONSTRAINT "fk_sessions_user_id" FOREIGN KEY ("user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "iam"."sessions"
        ADD CONSTRAINT "fk_sessions_device_id" FOREIGN KEY ("device_id")
        REFERENCES "iam"."devices" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "iam"."sessions"
        ADD CONSTRAINT "fk_sessions_created_by_user_id" FOREIGN KEY ("created_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "iam"."sessions"
        ADD CONSTRAINT "fk_sessions_updated_by_user_id" FOREIGN KEY ("updated_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "iam"."refresh_tokens"
        ADD CONSTRAINT "fk_refresh_tokens_session_id" FOREIGN KEY ("session_id")
        REFERENCES "iam"."sessions" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "iam"."refresh_tokens"
        ADD CONSTRAINT "fk_refresh_tokens_created_by_user_id" FOREIGN KEY ("created_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "iam"."refresh_tokens"
        ADD CONSTRAINT "fk_refresh_tokens_updated_by_user_id" FOREIGN KEY ("updated_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "iam"."user_global_roles"
        ADD CONSTRAINT "fk_user_global_roles_user_id" FOREIGN KEY ("user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "iam"."user_global_roles"
        ADD CONSTRAINT "fk_user_global_roles_created_by_user_id" FOREIGN KEY ("created_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "iam"."user_global_roles"
        ADD CONSTRAINT "fk_user_global_roles_updated_by_user_id" FOREIGN KEY ("updated_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "iam"."security_events"
        ADD CONSTRAINT "fk_security_events_user_id" FOREIGN KEY ("user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "iam"."security_events"
        ADD CONSTRAINT "fk_security_events_recorded_by_user_id" FOREIGN KEY ("recorded_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
