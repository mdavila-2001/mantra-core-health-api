-- SALUD v4.0.1 · módulo 06 · schema authz
-- Generado de diagram_06_authz.puml — NO editar a mano.


-- FK sin destino canónico (no forzadas, temperatura-0):
--   permissions.category_id


-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."permission_categories"
        ADD CONSTRAINT "fk_permission_categories_created_by_user_id" FOREIGN KEY ("created_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."permission_categories"
        ADD CONSTRAINT "fk_permission_categories_updated_by_user_id" FOREIGN KEY ("updated_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."permissions"
        ADD CONSTRAINT "fk_permissions_action_concept_id" FOREIGN KEY ("action_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."permissions"
        ADD CONSTRAINT "fk_permissions_default_scope_concept_id" FOREIGN KEY ("default_scope_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."permissions"
        ADD CONSTRAINT "fk_permissions_state_concept_id" FOREIGN KEY ("state_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."permissions"
        ADD CONSTRAINT "fk_permissions_created_by_user_id" FOREIGN KEY ("created_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."permissions"
        ADD CONSTRAINT "fk_permissions_updated_by_user_id" FOREIGN KEY ("updated_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: directory.tenants (requiere schema directory)
DO $$ BEGIN
    ALTER TABLE "authz"."roles"
        ADD CONSTRAINT "fk_roles_tenant_id" FOREIGN KEY ("tenant_id")
        REFERENCES "directory"."tenants" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."roles"
        ADD CONSTRAINT "fk_roles_base_role_concept_id" FOREIGN KEY ("base_role_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."roles"
        ADD CONSTRAINT "fk_roles_scope_concept_id" FOREIGN KEY ("scope_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."roles"
        ADD CONSTRAINT "fk_roles_state_concept_id" FOREIGN KEY ("state_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."roles"
        ADD CONSTRAINT "fk_roles_created_by_user_id" FOREIGN KEY ("created_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."roles"
        ADD CONSTRAINT "fk_roles_updated_by_user_id" FOREIGN KEY ("updated_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."role_permissions"
        ADD CONSTRAINT "fk_role_permissions_effect_concept_id" FOREIGN KEY ("effect_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."role_permissions"
        ADD CONSTRAINT "fk_role_permissions_scope_concept_id" FOREIGN KEY ("scope_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.value_sets (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."role_permissions"
        ADD CONSTRAINT "fk_role_permissions_field_value_set_id" FOREIGN KEY ("field_value_set_id")
        REFERENCES "terminology"."value_sets" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."role_permissions"
        ADD CONSTRAINT "fk_role_permissions_state_concept_id" FOREIGN KEY ("state_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."role_permissions"
        ADD CONSTRAINT "fk_role_permissions_created_by_user_id" FOREIGN KEY ("created_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."role_permissions"
        ADD CONSTRAINT "fk_role_permissions_updated_by_user_id" FOREIGN KEY ("updated_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."user_role_assignments"
        ADD CONSTRAINT "fk_user_role_assignments_user_id" FOREIGN KEY ("user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: directory.tenants (requiere schema directory)
DO $$ BEGIN
    ALTER TABLE "authz"."user_role_assignments"
        ADD CONSTRAINT "fk_user_role_assignments_tenant_id" FOREIGN KEY ("tenant_id")
        REFERENCES "directory"."tenants" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: directory.branches (requiere schema directory)
DO $$ BEGIN
    ALTER TABLE "authz"."user_role_assignments"
        ADD CONSTRAINT "fk_user_role_assignments_branch_id" FOREIGN KEY ("branch_id")
        REFERENCES "directory"."branches" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: practice.practices (requiere schema practice)
DO $$ BEGIN
    ALTER TABLE "authz"."user_role_assignments"
        ADD CONSTRAINT "fk_user_role_assignments_practice_id" FOREIGN KEY ("practice_id")
        REFERENCES "practice"."practices" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."user_role_assignments"
        ADD CONSTRAINT "fk_user_role_assignments_assigned_by_user_id" FOREIGN KEY ("assigned_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."user_role_assignments"
        ADD CONSTRAINT "fk_user_role_assignments_status_concept_id" FOREIGN KEY ("status_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."user_role_assignments"
        ADD CONSTRAINT "fk_user_role_assignments_created_by_user_id" FOREIGN KEY ("created_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."user_role_assignments"
        ADD CONSTRAINT "fk_user_role_assignments_updated_by_user_id" FOREIGN KEY ("updated_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."user_permission_grants"
        ADD CONSTRAINT "fk_user_permission_grants_user_id" FOREIGN KEY ("user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."user_permission_grants"
        ADD CONSTRAINT "fk_user_permission_grants_effect_concept_id" FOREIGN KEY ("effect_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."user_permission_grants"
        ADD CONSTRAINT "fk_user_permission_grants_scope_concept_id" FOREIGN KEY ("scope_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: directory.tenants (requiere schema directory)
DO $$ BEGIN
    ALTER TABLE "authz"."user_permission_grants"
        ADD CONSTRAINT "fk_user_permission_grants_tenant_id" FOREIGN KEY ("tenant_id")
        REFERENCES "directory"."tenants" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."user_permission_grants"
        ADD CONSTRAINT "fk_user_permission_grants_state_concept_id" FOREIGN KEY ("state_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."user_permission_grants"
        ADD CONSTRAINT "fk_user_permission_grants_created_by_user_id" FOREIGN KEY ("created_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."user_permission_grants"
        ADD CONSTRAINT "fk_user_permission_grants_updated_by_user_id" FOREIGN KEY ("updated_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."field_permissions"
        ADD CONSTRAINT "fk_field_permissions_mask_strategy_concept_id" FOREIGN KEY ("mask_strategy_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."field_permissions"
        ADD CONSTRAINT "fk_field_permissions_created_by_user_id" FOREIGN KEY ("created_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."field_permissions"
        ADD CONSTRAINT "fk_field_permissions_updated_by_user_id" FOREIGN KEY ("updated_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."resource_scope_grants"
        ADD CONSTRAINT "fk_resource_scope_grants_subject_type_concept_id" FOREIGN KEY ("subject_type_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."resource_scope_grants"
        ADD CONSTRAINT "fk_resource_scope_grants_resource_type_concept_id" FOREIGN KEY ("resource_type_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."resource_scope_grants"
        ADD CONSTRAINT "fk_resource_scope_grants_effect_concept_id" FOREIGN KEY ("effect_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: directory.tenants (requiere schema directory)
DO $$ BEGIN
    ALTER TABLE "authz"."resource_scope_grants"
        ADD CONSTRAINT "fk_resource_scope_grants_tenant_id" FOREIGN KEY ("tenant_id")
        REFERENCES "directory"."tenants" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."resource_scope_grants"
        ADD CONSTRAINT "fk_resource_scope_grants_created_by_user_id" FOREIGN KEY ("created_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."resource_scope_grants"
        ADD CONSTRAINT "fk_resource_scope_grants_updated_by_user_id" FOREIGN KEY ("updated_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: directory.tenants (requiere schema directory)
DO $$ BEGIN
    ALTER TABLE "authz"."access_policies"
        ADD CONSTRAINT "fk_access_policies_tenant_id" FOREIGN KEY ("tenant_id")
        REFERENCES "directory"."tenants" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."access_policies"
        ADD CONSTRAINT "fk_access_policies_effect_concept_id" FOREIGN KEY ("effect_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."access_policies"
        ADD CONSTRAINT "fk_access_policies_state_concept_id" FOREIGN KEY ("state_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."access_policies"
        ADD CONSTRAINT "fk_access_policies_created_by_user_id" FOREIGN KEY ("created_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."access_policies"
        ADD CONSTRAINT "fk_access_policies_updated_by_user_id" FOREIGN KEY ("updated_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: profiles.patient_profiles (requiere schema profiles)
DO $$ BEGIN
    ALTER TABLE "authz"."clinical_access_grants"
        ADD CONSTRAINT "fk_clinical_access_grants_patient_profile_id" FOREIGN KEY ("patient_profile_id")
        REFERENCES "profiles"."patient_profiles" ("profile_id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."clinical_access_grants"
        ADD CONSTRAINT "fk_clinical_access_grants_granted_user_id" FOREIGN KEY ("granted_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: directory.tenants (requiere schema directory)
DO $$ BEGIN
    ALTER TABLE "authz"."clinical_access_grants"
        ADD CONSTRAINT "fk_clinical_access_grants_tenant_id" FOREIGN KEY ("tenant_id")
        REFERENCES "directory"."tenants" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: directory.branches (requiere schema directory)
DO $$ BEGIN
    ALTER TABLE "authz"."clinical_access_grants"
        ADD CONSTRAINT "fk_clinical_access_grants_branch_id" FOREIGN KEY ("branch_id")
        REFERENCES "directory"."branches" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: clinical.encounters (requiere schema clinical)
DO $$ BEGIN
    ALTER TABLE "authz"."clinical_access_grants"
        ADD CONSTRAINT "fk_clinical_access_grants_encounter_id" FOREIGN KEY ("encounter_id")
        REFERENCES "clinical"."encounters" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: consent.consents (requiere schema consent)
DO $$ BEGIN
    ALTER TABLE "authz"."clinical_access_grants"
        ADD CONSTRAINT "fk_clinical_access_grants_consent_id" FOREIGN KEY ("consent_id")
        REFERENCES "consent"."consents" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."clinical_access_grants"
        ADD CONSTRAINT "fk_clinical_access_grants_reason_concept_id" FOREIGN KEY ("reason_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."clinical_access_grants"
        ADD CONSTRAINT "fk_clinical_access_grants_access_level_concept_id" FOREIGN KEY ("access_level_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: terminology.catalog_concepts (requiere schema terminology)
DO $$ BEGIN
    ALTER TABLE "authz"."clinical_access_grants"
        ADD CONSTRAINT "fk_clinical_access_grants_state_concept_id" FOREIGN KEY ("state_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."clinical_access_grants"
        ADD CONSTRAINT "fk_clinical_access_grants_created_by_user_id" FOREIGN KEY ("created_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- destino: iam.users (requiere schema iam)
DO $$ BEGIN
    ALTER TABLE "authz"."clinical_access_grants"
        ADD CONSTRAINT "fk_clinical_access_grants_updated_by_user_id" FOREIGN KEY ("updated_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
