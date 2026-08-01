-- SALUD v4.0.1 · módulo 37 · schema tracking
-- Generado de diagram_37_tracking.puml — NO editar a mano.


DO $$ BEGIN
    ALTER TABLE "tracking"."tracking_events"
        ADD CONSTRAINT "fk_tracking_events_trackable_subject_id" FOREIGN KEY ("trackable_subject_id")
        REFERENCES "tracking"."trackable_subjects" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "tracking"."tracking_events"
        ADD CONSTRAINT "fk_tracking_events_milestone_definition_id" FOREIGN KEY ("milestone_definition_id")
        REFERENCES "tracking"."milestone_definitions" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "tracking"."shipments"
        ADD CONSTRAINT "fk_shipments_trackable_subject_id" FOREIGN KEY ("trackable_subject_id")
        REFERENCES "tracking"."trackable_subjects" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "tracking"."shipment_handoffs"
        ADD CONSTRAINT "fk_shipment_handoffs_shipment_id" FOREIGN KEY ("shipment_id")
        REFERENCES "tracking"."shipments" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "tracking"."eta_estimates"
        ADD CONSTRAINT "fk_eta_estimates_trackable_subject_id" FOREIGN KEY ("trackable_subject_id")
        REFERENCES "tracking"."trackable_subjects" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "tracking"."eta_estimates"
        ADD CONSTRAINT "fk_eta_estimates_shipment_id" FOREIGN KEY ("shipment_id")
        REFERENCES "tracking"."shipments" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "tracking"."delivery_proofs"
        ADD CONSTRAINT "fk_delivery_proofs_shipment_id" FOREIGN KEY ("shipment_id")
        REFERENCES "tracking"."shipments" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
