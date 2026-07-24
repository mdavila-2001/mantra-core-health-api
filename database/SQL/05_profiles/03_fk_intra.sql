-- SALUD v4.0.1 · módulo 05 · schema profiles
-- Generado de diagram_05_profiles.puml — NO editar a mano.


DO $$ BEGIN
    ALTER TABLE "profiles"."persons"
        ADD CONSTRAINT "fk_persons_merge_survivor_person_id" FOREIGN KEY ("merge_survivor_person_id")
        REFERENCES "profiles"."persons" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "profiles"."person_account_links"
        ADD CONSTRAINT "fk_person_account_links_person_id" FOREIGN KEY ("person_id")
        REFERENCES "profiles"."persons" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "profiles"."person_profiles"
        ADD CONSTRAINT "fk_person_profiles_person_id" FOREIGN KEY ("person_id")
        REFERENCES "profiles"."persons" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "profiles"."patient_identity_links"
        ADD CONSTRAINT "fk_patient_identity_links_patient_profile_id" FOREIGN KEY ("patient_profile_id")
        REFERENCES "profiles"."patient_profiles" ("profile_id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "profiles"."patient_merge_events"
        ADD CONSTRAINT "fk_patient_merge_events_surviving_patient_profile_id" FOREIGN KEY ("surviving_patient_profile_id")
        REFERENCES "profiles"."patient_profiles" ("profile_id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "profiles"."patient_merge_events"
        ADD CONSTRAINT "fk_patient_merge_events_merged_patient_profile_id" FOREIGN KEY ("merged_patient_profile_id")
        REFERENCES "profiles"."patient_profiles" ("profile_id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "profiles"."related_persons"
        ADD CONSTRAINT "fk_related_persons_patient_profile_id" FOREIGN KEY ("patient_profile_id")
        REFERENCES "profiles"."patient_profiles" ("profile_id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "profiles"."related_persons"
        ADD CONSTRAINT "fk_related_persons_person_id" FOREIGN KEY ("person_id")
        REFERENCES "profiles"."persons" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "profiles"."patient_portal_proxies"
        ADD CONSTRAINT "fk_patient_portal_proxies_patient_profile_id" FOREIGN KEY ("patient_profile_id")
        REFERENCES "profiles"."patient_profiles" ("profile_id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "profiles"."patient_portal_proxies"
        ADD CONSTRAINT "fk_patient_portal_proxies_related_person_id" FOREIGN KEY ("related_person_id")
        REFERENCES "profiles"."related_persons" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
