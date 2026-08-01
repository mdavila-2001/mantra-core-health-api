-- SALUD v4.0.1 · módulo 12 · schema integrations
-- Generado de diagram_12_integrations.puml — NO editar a mano.


DO $$ BEGIN
    ALTER TABLE "integrations"."message_responses"
        ADD CONSTRAINT "fk_message_responses_outbound_message_id" FOREIGN KEY ("outbound_message_id")
        REFERENCES "integrations"."outbound_messages" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "integrations"."message_retries"
        ADD CONSTRAINT "fk_message_retries_outbound_message_id" FOREIGN KEY ("outbound_message_id")
        REFERENCES "integrations"."outbound_messages" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
