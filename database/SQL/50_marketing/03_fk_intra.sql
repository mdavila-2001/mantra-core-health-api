-- SALUD v4.0.1 · módulo 50 · schema marketing
-- Generado de diagram_50_marketing.puml — NO editar a mano.


DO $$ BEGIN
    ALTER TABLE "marketing"."segment_members"
        ADD CONSTRAINT "fk_segment_members_segment_id" FOREIGN KEY ("segment_id")
        REFERENCES "marketing"."segments" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "marketing"."marketing_campaigns"
        ADD CONSTRAINT "fk_marketing_campaigns_segment_id" FOREIGN KEY ("segment_id")
        REFERENCES "marketing"."segments" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "marketing"."campaign_members"
        ADD CONSTRAINT "fk_campaign_members_source_segment_member_id" FOREIGN KEY ("source_segment_member_id")
        REFERENCES "marketing"."segment_members" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "marketing"."journeys"
        ADD CONSTRAINT "fk_journeys_entry_segment_id" FOREIGN KEY ("entry_segment_id")
        REFERENCES "marketing"."segments" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "marketing"."journey_steps"
        ADD CONSTRAINT "fk_journey_steps_journey_id" FOREIGN KEY ("journey_id")
        REFERENCES "marketing"."journeys" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "marketing"."journey_steps"
        ADD CONSTRAINT "fk_journey_steps_content_template_id" FOREIGN KEY ("content_template_id")
        REFERENCES "marketing"."content_templates" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "marketing"."journey_enrollments"
        ADD CONSTRAINT "fk_journey_enrollments_journey_id" FOREIGN KEY ("journey_id")
        REFERENCES "marketing"."journeys" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "marketing"."marketing_touchpoints"
        ADD CONSTRAINT "fk_marketing_touchpoints_journey_id" FOREIGN KEY ("journey_id")
        REFERENCES "marketing"."journeys" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "marketing"."marketing_touchpoints"
        ADD CONSTRAINT "fk_marketing_touchpoints_tracked_link_id" FOREIGN KEY ("tracked_link_id")
        REFERENCES "marketing"."tracked_links" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "marketing"."marketing_touchpoints"
        ADD CONSTRAINT "fk_marketing_touchpoints_content_template_id" FOREIGN KEY ("content_template_id")
        REFERENCES "marketing"."content_templates" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "marketing"."attribution_touches"
        ADD CONSTRAINT "fk_attribution_touches_marketing_touchpoint_id" FOREIGN KEY ("marketing_touchpoint_id")
        REFERENCES "marketing"."marketing_touchpoints" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "marketing"."campaign_dispatches"
        ADD CONSTRAINT "fk_campaign_dispatches_journey_id" FOREIGN KEY ("journey_id")
        REFERENCES "marketing"."journeys" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "marketing"."campaign_dispatches"
        ADD CONSTRAINT "fk_campaign_dispatches_journey_step_id" FOREIGN KEY ("journey_step_id")
        REFERENCES "marketing"."journey_steps" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "marketing"."campaign_dispatches"
        ADD CONSTRAINT "fk_campaign_dispatches_content_template_id" FOREIGN KEY ("content_template_id")
        REFERENCES "marketing"."content_templates" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "marketing"."campaign_schedules"
        ADD CONSTRAINT "fk_campaign_schedules_journey_id" FOREIGN KEY ("journey_id")
        REFERENCES "marketing"."journeys" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
