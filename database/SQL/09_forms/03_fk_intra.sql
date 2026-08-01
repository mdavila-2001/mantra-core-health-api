-- SALUD v4.0.1 · módulo 09 · schema forms
-- Generado de diagram_09_forms.puml — NO editar a mano.


DO $$ BEGIN
    ALTER TABLE "forms"."field_values"
        ADD CONSTRAINT "fk_field_values_form_instance_id" FOREIGN KEY ("form_instance_id")
        REFERENCES "forms"."form_instances" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "forms"."field_value_audit"
        ADD CONSTRAINT "fk_field_value_audit_field_value_id" FOREIGN KEY ("field_value_id")
        REFERENCES "forms"."field_values" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "forms"."field_value_provenance"
        ADD CONSTRAINT "fk_field_value_provenance_field_value_id" FOREIGN KEY ("field_value_id")
        REFERENCES "forms"."field_values" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
