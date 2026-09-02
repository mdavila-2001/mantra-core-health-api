-- SALUD v4.0.1 · módulo 44 · schema health_context
-- Generado de diagram_44_health_context.puml — NO editar a mano.


DO $$ BEGIN
    ALTER TABLE "health_context"."country_health_context_versions"
        ADD CONSTRAINT "fk_country_health_context_versions_country_health_context_id" FOREIGN KEY ("country_health_context_id")
        REFERENCES "health_context"."country_health_contexts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "health_context"."context_fact_evidence"
        ADD CONSTRAINT "fk_context_fact_evidence_health_context_fact_id" FOREIGN KEY ("health_context_fact_id")
        REFERENCES "health_context"."health_context_facts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
