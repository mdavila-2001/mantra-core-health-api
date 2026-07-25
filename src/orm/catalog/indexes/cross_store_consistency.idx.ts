import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `cross_store_consistency`.
 * 43 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const crossStoreConsistencyIndexes: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['archive_jobs', 'uq_archive_job_cutoff', ['tenant_id', 'dataset_id', 'retention_cutoff'], false, 'btree'],
  ['archive_jobs', 'ix_archive_job_status', ['status', 'started_at asc'], false, 'btree'],
  ['cache_invalidation_jobs', 'uq_cache_invalidation_version', ['tenant_id', 'dataset_id', 'entity_id', 'entity_version', 'cache_scope'], false, 'btree'],
  ['cache_invalidation_jobs', 'ix_cache_invalidation_status', ['status', 'created_at asc'], false, 'btree'],
  ['data_movement_jobs', 'uq_data_movement_manifest', ['tenant_id', 'dataset_id', 'manifest_hash'], false, 'btree'],
  ['data_movement_jobs', 'ix_data_movement_status', ['tenant_id', 'status', 'started_at asc'], false, 'btree'],
  ['deletion_executions', 'uq_deletion_execution_attempt', ['deletion_target_id', 'attempt_number'], false, 'btree'],
  ['deletion_executions', 'uq_deletion_execution_idem', ['idempotency_key'], false, 'btree'],
  ['deletion_executions', 'ix_deletion_execution_status', ['status', 'started_at asc'], false, 'btree'],
  ['deletion_requests', 'ix_deletion_request_state_due', ['tenant_id', 'state', 'due_at asc'], false, 'btree'],
  ['deletion_requests', 'ix_deletion_request_subject', ['tenant_id', 'subject_type', 'subject_id', 'requested_at desc'], false, 'btree'],
  ['deletion_targets', 'uq_deletion_target_dataset_backend', ['deletion_request_id', 'dataset_id', 'backend_code', 'target_locator'], false, 'btree'],
  ['deletion_targets', 'ix_deletion_target_state', ['state', 'blocked_by_legal_hold'], false, 'btree'],
  ['deletion_verifications', 'ix_deletion_verification_target', ['deletion_target_id', 'verified_at desc'], false, 'btree'],
  ['deletion_verifications', 'ix_deletion_verification_residual', ['verified_absent', 'residual_reference_count'], false, 'btree'],
  ['projection_checkpoints', 'uq_projection_checkpoint_partition', ['projection_subscription_id', 'tenant_id', 'partition_key'], false, 'btree'],
  ['projection_checkpoints', 'ix_projection_checkpoint_event', ['source_event_id'], false, 'btree'],
  ['projection_checkpoints', 'ix_projection_checkpoint_time', ['checkpointed_at desc'], false, 'btree'],
  ['projection_consumers', 'uq_projection_consumer_code_region', ['code', 'deployment_region'], false, 'btree'],
  ['projection_consumers', 'ix_projection_consumer_heartbeat', ['state', 'heartbeat_at asc'], false, 'btree'],
  ['projection_dead_letters', 'uq_projection_dead_letter_attempt', ['projection_delivery_attempt_id'], false, 'btree'],
  ['projection_dead_letters', 'ix_projection_dead_letter_state', ['tenant_id', 'state', 'created_at asc'], false, 'btree'],
  ['projection_definitions', 'uq_projection_definition_version', ['code', 'projection_version'], false, 'btree'],
  ['projection_definitions', 'ix_projection_definition_datasets', ['source_dataset_id', 'target_dataset_id', 'state'], false, 'btree'],
  ['projection_delivery_attempts', 'uq_projection_delivery_attempt', ['projection_subscription_id', 'outbox_event_id', 'attempt_number'], false, 'btree'],
  ['projection_delivery_attempts', 'uq_projection_delivery_idem', ['projection_subscription_id', 'idempotency_key'], false, 'btree'],
  ['projection_delivery_attempts', 'ix_projection_delivery_status', ['tenant_id', 'status', 'started_at asc'], false, 'btree'],
  ['projection_drift_events', 'uq_projection_drift_active', ['tenant_id', 'dataset_id', 'canonical_entity_id', 'drift_type', 'status'], false, 'btree'],
  ['projection_drift_events', 'ix_projection_drift_severity', ['tenant_id', 'status', 'severity', 'detected_at asc'], false, 'btree'],
  ['projection_repair_jobs', 'uq_projection_repair_idem', ['idempotency_key'], false, 'btree'],
  ['projection_repair_jobs', 'ix_projection_repair_status', ['tenant_id', 'status', 'requested_at asc'], false, 'btree'],
  ['projection_subscriptions', 'uq_projection_subscription_consumer_event', ['projection_definition_id', 'source_event_type', 'consumer_code'], false, 'btree'],
  ['projection_subscriptions', 'ix_projection_subscription_state', ['state', 'target_backend_code'], false, 'btree'],
  ['reconciliation_items', 'uq_reconciliation_item_entity', ['reconciliation_run_id', 'canonical_entity_id'], false, 'btree'],
  ['reconciliation_items', 'ix_reconciliation_item_result', ['reconciliation_run_id', 'result'], false, 'btree'],
  ['reconciliation_runs', 'ix_reconciliation_run_status', ['tenant_id', 'status', 'started_at asc'], false, 'btree'],
  ['reconciliation_runs', 'ix_reconciliation_run_dataset', ['dataset_id', 'started_at desc'], false, 'btree'],
  ['reindex_jobs', 'ix_reindex_job_status', ['tenant_id', 'status', 'started_at asc'], false, 'btree'],
  ['reindex_jobs', 'uq_reindex_target_index', ['target_index'], false, 'btree'],
  ['schema_migration_jobs', 'uq_schema_migration_versions', ['collection_definition_id', 'from_schema_version', 'to_schema_version'], false, 'btree'],
  ['schema_migration_jobs', 'ix_schema_migration_status', ['status', 'started_at asc'], false, 'btree'],
  ['store_consistency_slos', 'uq_store_consistency_slo', ['dataset_id', 'target_backend_code'], false, 'btree'],
  ['store_consistency_slos', 'ix_store_consistency_state', ['state', 'target_backend_code'], false, 'btree'],
];
