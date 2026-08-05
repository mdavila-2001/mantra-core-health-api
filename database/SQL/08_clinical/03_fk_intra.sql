-- SALUD v4.0.1 · módulo 08 · schema clinical
-- Generado de diagram_08_clinical.puml — NO editar a mano.


DO $$ BEGIN
    ALTER TABLE "clinical"."encounters"
        ADD CONSTRAINT "fk_encounters_appointment_id" FOREIGN KEY ("appointment_id")
        REFERENCES "clinical"."appointments" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "clinical"."observations"
        ADD CONSTRAINT "fk_observations_encounter_id" FOREIGN KEY ("encounter_id")
        REFERENCES "clinical"."encounters" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "clinical"."observations"
        ADD CONSTRAINT "fk_observations_based_on_service_request_id" FOREIGN KEY ("based_on_service_request_id")
        REFERENCES "clinical"."service_requests" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "clinical"."observation_components"
        ADD CONSTRAINT "fk_observation_components_observation_id" FOREIGN KEY ("observation_id")
        REFERENCES "clinical"."observations" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "clinical"."conditions"
        ADD CONSTRAINT "fk_conditions_encounter_id" FOREIGN KEY ("encounter_id")
        REFERENCES "clinical"."encounters" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "clinical"."service_requests"
        ADD CONSTRAINT "fk_service_requests_encounter_id" FOREIGN KEY ("encounter_id")
        REFERENCES "clinical"."encounters" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "clinical"."diagnostic_reports"
        ADD CONSTRAINT "fk_diagnostic_reports_service_request_id" FOREIGN KEY ("service_request_id")
        REFERENCES "clinical"."service_requests" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "clinical"."diagnostic_reports"
        ADD CONSTRAINT "fk_diagnostic_reports_encounter_id" FOREIGN KEY ("encounter_id")
        REFERENCES "clinical"."encounters" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "clinical"."medication_requests"
        ADD CONSTRAINT "fk_medication_requests_encounter_id" FOREIGN KEY ("encounter_id")
        REFERENCES "clinical"."encounters" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "clinical"."procedures"
        ADD CONSTRAINT "fk_procedures_encounter_id" FOREIGN KEY ("encounter_id")
        REFERENCES "clinical"."encounters" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "clinical"."procedures"
        ADD CONSTRAINT "fk_procedures_service_request_id" FOREIGN KEY ("service_request_id")
        REFERENCES "clinical"."service_requests" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "clinical"."procedures"
        ADD CONSTRAINT "fk_procedures_parent_procedure_id" FOREIGN KEY ("parent_procedure_id")
        REFERENCES "clinical"."procedures" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "clinical"."encounter_participants"
        ADD CONSTRAINT "fk_encounter_participants_encounter_id" FOREIGN KEY ("encounter_id")
        REFERENCES "clinical"."encounters" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "clinical"."encounter_locations"
        ADD CONSTRAINT "fk_encounter_locations_encounter_id" FOREIGN KEY ("encounter_id")
        REFERENCES "clinical"."encounters" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "clinical"."observation_performers"
        ADD CONSTRAINT "fk_observation_performers_observation_id" FOREIGN KEY ("observation_id")
        REFERENCES "clinical"."observations" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "clinical"."observation_reference_ranges"
        ADD CONSTRAINT "fk_observation_reference_ranges_observation_id" FOREIGN KEY ("observation_id")
        REFERENCES "clinical"."observations" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "clinical"."observation_reference_ranges"
        ADD CONSTRAINT "fk_observation_reference_ranges_observation_component_id" FOREIGN KEY ("observation_component_id")
        REFERENCES "clinical"."observation_components" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "clinical"."observation_notes"
        ADD CONSTRAINT "fk_observation_notes_observation_id" FOREIGN KEY ("observation_id")
        REFERENCES "clinical"."observations" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
