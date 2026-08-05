-- SALUD v4.0.1 · módulo 41 · schema scheduling
-- Generado de diagram_41_scheduling.puml — NO editar a mano.


DO $$ BEGIN
    ALTER TABLE "scheduling"."schedule_templates"
        ADD CONSTRAINT "fk_schedule_templates_practitioner_schedule_id" FOREIGN KEY ("practitioner_schedule_id")
        REFERENCES "scheduling"."practitioner_schedules" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "scheduling"."schedule_templates"
        ADD CONSTRAINT "fk_schedule_templates_booking_policy_id" FOREIGN KEY ("booking_policy_id")
        REFERENCES "scheduling"."booking_policies" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "scheduling"."schedule_rules"
        ADD CONSTRAINT "fk_schedule_rules_schedule_template_id" FOREIGN KEY ("schedule_template_id")
        REFERENCES "scheduling"."schedule_templates" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "scheduling"."bookable_slots"
        ADD CONSTRAINT "fk_bookable_slots_schedule_template_id" FOREIGN KEY ("schedule_template_id")
        REFERENCES "scheduling"."schedule_templates" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "scheduling"."slot_holds"
        ADD CONSTRAINT "fk_slot_holds_bookable_slot_id" FOREIGN KEY ("bookable_slot_id")
        REFERENCES "scheduling"."bookable_slots" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "scheduling"."appointment_bookings"
        ADD CONSTRAINT "fk_appointment_bookings_bookable_slot_id" FOREIGN KEY ("bookable_slot_id")
        REFERENCES "scheduling"."bookable_slots" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "scheduling"."appointment_bookings"
        ADD CONSTRAINT "fk_appointment_bookings_booking_policy_id" FOREIGN KEY ("booking_policy_id")
        REFERENCES "scheduling"."booking_policies" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
