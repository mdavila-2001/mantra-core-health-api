import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `system_ops` (parte 2/2).
 * 21 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const systemOpsIndexes2: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['tenant_residency_bindings', 'ix_tenant_residency_bindings_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['tenant_residency_bindings', 'ix_tenant_residency_bindings_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['tenant_residency_bindings', 'ix_tenant_residency_bindings_tenant_id_status_concept_id', ['tenant_id', 'status_concept_id', 'updated_at desc'], false, 'btree'],
  ['workload_assessments', 'ix_workload_assessments_tenant_id', ['tenant_id'], false, 'btree'],
  ['workload_assessments', 'ix_workload_assessments_operational_framework_id', ['operational_framework_id'], false, 'btree'],
  ['workload_assessments', 'ix_workload_assessments_service_component_id', ['service_component_id'], false, 'btree'],
  ['workload_assessments', 'ix_workload_assessments_assessment_type_concept_id', ['assessment_type_concept_id'], false, 'btree'],
  ['workload_assessments', 'ix_workload_assessments_status_concept_id', ['status_concept_id'], false, 'btree'],
  ['workload_assessments', 'ix_workload_assessments_facilitator_user_id', ['facilitator_user_id'], false, 'btree'],
  ['workload_assessments', 'ix_workload_assessments_approved_by_user_id', ['approved_by_user_id'], false, 'btree'],
  ['workload_assessments', 'ix_workload_assessments_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['workload_assessments', 'ix_workload_assessments_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['workload_assessments', 'ix_workload_assessments_tenant_status', ['tenant_id', 'status_concept_id', 'updated_at desc'], false, 'btree'],
  ['workload_assessments', 'ix_workload_assessments_tenant_workload', ['tenant_id', 'workload_code', 'created_at desc'], false, 'btree'],
  ['write_policies', 'uq_write_policies_code', ['code'], true, 'btree'],
  ['write_policies', 'ix_write_policies_insert_mode_concept_id', ['insert_mode_concept_id'], false, 'btree'],
  ['write_policies', 'ix_write_policies_update_mode_concept_id', ['update_mode_concept_id'], false, 'btree'],
  ['write_policies', 'ix_write_policies_delete_mode_concept_id', ['delete_mode_concept_id'], false, 'btree'],
  ['write_policies', 'ix_write_policies_state_concept_id', ['state_concept_id'], false, 'btree'],
  ['write_policies', 'ix_write_policies_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['write_policies', 'ix_write_policies_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
];
