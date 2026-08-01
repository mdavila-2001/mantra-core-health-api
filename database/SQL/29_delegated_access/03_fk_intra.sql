-- SALUD v4.0.1 · módulo 29 · schema delegated_access
-- Generado de diagram_29_delegated_access.puml — NO editar a mano.


DO $$ BEGIN
    ALTER TABLE "delegated_access"."delegated_permission_set_items"
        ADD CONSTRAINT "fk_delegated_permission_set_items_delegated_permission_set_id" FOREIGN KEY ("delegated_permission_set_id")
        REFERENCES "delegated_access"."delegated_permission_sets" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "delegated_access"."practitioner_delegate_assignments"
        ADD CONSTRAINT "fk_practitioner_delegate_assignments_delegated_permission_set_id" FOREIGN KEY ("delegated_permission_set_id")
        REFERENCES "delegated_access"."delegated_permission_sets" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "delegated_access"."delegated_access_grants"
        ADD CONSTRAINT "fk_delegated_access_grants_practitioner_delegate_assignment_id" FOREIGN KEY ("practitioner_delegate_assignment_id")
        REFERENCES "delegated_access"."practitioner_delegate_assignments" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "delegated_access"."delegated_access_approval_requests"
        ADD CONSTRAINT "fk_delegated_access_approval_requests_practitioner_delegate_assignment_id" FOREIGN KEY ("practitioner_delegate_assignment_id")
        REFERENCES "delegated_access"."practitioner_delegate_assignments" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "delegated_access"."delegation_events"
        ADD CONSTRAINT "fk_delegation_events_practitioner_delegate_assignment_id" FOREIGN KEY ("practitioner_delegate_assignment_id")
        REFERENCES "delegated_access"."practitioner_delegate_assignments" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
