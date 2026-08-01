-- SALUD v4.0.1 · módulo 54 · schema polyglot_storage
-- Generado de diagram_54_polyglot_storage.puml — NO editar a mano.


-- FK sin destino canónico (no forzadas, temperatura-0):
--   data_classifications.default_encryption_profile_id
--   data_classifications.default_retention_policy_id
--   dataset_definitions.data_classification_id
--   dataset_versions.schema_document_file_id
--   tenant_storage_bindings.primary_placement_id
--   tenant_storage_bindings.secondary_placement_id
--   encryption_profiles.rotation_policy_id


-- destino: directory.tenants (requiere schema directory)
DO $$ BEGIN
    ALTER TABLE "polyglot_storage"."tenant_storage_bindings"
        ADD CONSTRAINT "fk_tenant_storage_bindings_tenant_id" FOREIGN KEY ("tenant_id")
        REFERENCES "directory"."tenants" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;  -- (inferida por convención)

-- destino: directory.tenants (requiere schema directory)
DO $$ BEGIN
    ALTER TABLE "polyglot_storage"."storage_cost_snapshots"
        ADD CONSTRAINT "fk_storage_cost_snapshots_tenant_id" FOREIGN KEY ("tenant_id")
        REFERENCES "directory"."tenants" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;  -- (inferida por convención)
