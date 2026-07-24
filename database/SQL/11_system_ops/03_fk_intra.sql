-- SALUD v4.0.1 · módulo 11 · schema system_ops
-- Generado de diagram_11_system_ops.puml — NO editar a mano.


DO $$ BEGIN
    ALTER TABLE "system_ops"."entity_registry"
        ADD CONSTRAINT "fk_entity_registry_retention_policy_id" FOREIGN KEY ("retention_policy_id")
        REFERENCES "system_ops"."retention_policies" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "system_ops"."entity_registry"
        ADD CONSTRAINT "fk_entity_registry_write_policy_id" FOREIGN KEY ("write_policy_id")
        REFERENCES "system_ops"."write_policies" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "system_ops"."field_registry"
        ADD CONSTRAINT "fk_field_registry_entity_registry_id" FOREIGN KEY ("entity_registry_id")
        REFERENCES "system_ops"."entity_registry" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "system_ops"."field_registry"
        ADD CONSTRAINT "fk_field_registry_anonymization_rule_id" FOREIGN KEY ("anonymization_rule_id")
        REFERENCES "system_ops"."anonymization_rules" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "system_ops"."retention_executions"
        ADD CONSTRAINT "fk_retention_executions_retention_policy_id" FOREIGN KEY ("retention_policy_id")
        REFERENCES "system_ops"."retention_policies" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "system_ops"."retention_executions"
        ADD CONSTRAINT "fk_retention_executions_entity_registry_id" FOREIGN KEY ("entity_registry_id")
        REFERENCES "system_ops"."entity_registry" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "system_ops"."data_residency_policies"
        ADD CONSTRAINT "fk_data_residency_policies_data_classification_id" FOREIGN KEY ("data_classification_id")
        REFERENCES "system_ops"."data_classifications" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "system_ops"."restore_test_runs"
        ADD CONSTRAINT "fk_restore_test_runs_backup_policy_id" FOREIGN KEY ("backup_policy_id")
        REFERENCES "system_ops"."backup_policies" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "system_ops"."operational_framework_controls"
        ADD CONSTRAINT "fk_operational_framework_controls_operational_framework_id" FOREIGN KEY ("operational_framework_id")
        REFERENCES "system_ops"."operational_frameworks" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "system_ops"."workload_assessments"
        ADD CONSTRAINT "fk_workload_assessments_operational_framework_id" FOREIGN KEY ("operational_framework_id")
        REFERENCES "system_ops"."operational_frameworks" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "system_ops"."assessment_control_results"
        ADD CONSTRAINT "fk_assessment_control_results_workload_assessment_id" FOREIGN KEY ("workload_assessment_id")
        REFERENCES "system_ops"."workload_assessments" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "system_ops"."assessment_control_results"
        ADD CONSTRAINT "fk_assessment_control_results_operational_framework_control_id" FOREIGN KEY ("operational_framework_control_id")
        REFERENCES "system_ops"."operational_framework_controls" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "system_ops"."assessment_findings"
        ADD CONSTRAINT "fk_assessment_findings_workload_assessment_id" FOREIGN KEY ("workload_assessment_id")
        REFERENCES "system_ops"."workload_assessments" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "system_ops"."assessment_findings"
        ADD CONSTRAINT "fk_assessment_findings_assessment_control_result_id" FOREIGN KEY ("assessment_control_result_id")
        REFERENCES "system_ops"."assessment_control_results" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "system_ops"."remediation_plans"
        ADD CONSTRAINT "fk_remediation_plans_workload_assessment_id" FOREIGN KEY ("workload_assessment_id")
        REFERENCES "system_ops"."workload_assessments" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "system_ops"."remediation_actions"
        ADD CONSTRAINT "fk_remediation_actions_remediation_plan_id" FOREIGN KEY ("remediation_plan_id")
        REFERENCES "system_ops"."remediation_plans" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "system_ops"."remediation_actions"
        ADD CONSTRAINT "fk_remediation_actions_assessment_finding_id" FOREIGN KEY ("assessment_finding_id")
        REFERENCES "system_ops"."assessment_findings" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
