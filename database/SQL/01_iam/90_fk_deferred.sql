-- SALUD v4.0.1 · módulo 01 · schema iam
-- Generado de diagram_01_iam.puml — NO editar a mano.


-- FK sin destino canónico (no forzadas, temperatura-0):
--   refresh_tokens.replaced_by_id


-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "iam"."users"
        ADD CONSTRAINT "fk_users_status_concept_id" FOREIGN KEY ("status_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "iam"."users"
        ADD CONSTRAINT "fk_users_preferred_language_concept_id" FOREIGN KEY ("preferred_language_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "iam"."users"
        ADD CONSTRAINT "fk_users_residence_country_concept_id" FOREIGN KEY ("residence_country_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "iam"."users"
        ADD CONSTRAINT "fk_users_data_residency_region_concept_id" FOREIGN KEY ("data_residency_region_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "iam"."users"
        ADD CONSTRAINT "fk_users_mfa_status_concept_id" FOREIGN KEY ("mfa_status_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "iam"."users"
        ADD CONSTRAINT "fk_users_legal_basis_concept_id" FOREIGN KEY ("legal_basis_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "iam"."authentication_credentials"
        ADD CONSTRAINT "fk_authentication_credentials_method_concept_id" FOREIGN KEY ("method_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "iam"."authentication_credentials"
        ADD CONSTRAINT "fk_authentication_credentials_hash_algorithm_concept_id" FOREIGN KEY ("hash_algorithm_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "iam"."authentication_credentials"
        ADD CONSTRAINT "fk_authentication_credentials_state_concept_id" FOREIGN KEY ("state_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "iam"."mfa_factors"
        ADD CONSTRAINT "fk_mfa_factors_factor_type_concept_id" FOREIGN KEY ("factor_type_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "iam"."mfa_factors"
        ADD CONSTRAINT "fk_mfa_factors_state_concept_id" FOREIGN KEY ("state_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "iam"."devices"
        ADD CONSTRAINT "fk_devices_platform_concept_id" FOREIGN KEY ("platform_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "iam"."sessions"
        ADD CONSTRAINT "fk_sessions_state_concept_id" FOREIGN KEY ("state_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "iam"."refresh_tokens"
        ADD CONSTRAINT "fk_refresh_tokens_state_concept_id" FOREIGN KEY ("state_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "iam"."user_global_roles"
        ADD CONSTRAINT "fk_user_global_roles_role_concept_id" FOREIGN KEY ("role_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "iam"."user_global_roles"
        ADD CONSTRAINT "fk_user_global_roles_state_concept_id" FOREIGN KEY ("state_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "iam"."security_events"
        ADD CONSTRAINT "fk_security_events_event_type_concept_id" FOREIGN KEY ("event_type_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "iam"."security_events"
        ADD CONSTRAINT "fk_security_events_outcome_concept_id" FOREIGN KEY ("outcome_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
