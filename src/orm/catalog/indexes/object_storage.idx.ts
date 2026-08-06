import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `object_storage`.
 * 41 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const objectStorageIndexes: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['archive_manifests', 'uq_archive_manifest_hash', ['tenant_id', 'manifest_hash'], false, 'btree'],
  ['archive_manifests', 'ix_archive_manifest_created', ['tenant_id', 'archive_type', 'created_at desc'], false, 'btree'],
  ['dicomweb_access_logs', 'ix_dicomweb_principal_time', ['tenant_id', 'principal_id', 'occurred_at desc'], false, 'btree'],
  ['dicomweb_access_logs', 'ix_dicomweb_study_time', ['tenant_id', 'study_instance_uid', 'occurred_at desc'], false, 'btree'],
  ['dicomweb_access_logs', 'brin_dicomweb_occurred', ['occurred_at'], false, 'btree'],
  ['dicom_instance_manifests', 'uq_dicom_instance_uid', ['dicom_series_manifest_id', 'sop_instance_uid'], false, 'btree'],
  ['dicom_instance_manifests', 'ix_dicom_instance_number', ['dicom_series_manifest_id', 'instance_number'], false, 'btree'],
  ['dicom_instance_manifests', 'gin_dicom_instance_metadata', ['metadata_json'], false, 'btree'],
  ['dicom_series_manifests', 'uq_dicom_series_uid', ['dicom_study_manifest_id', 'series_instance_uid'], false, 'btree'],
  ['dicom_series_manifests', 'ix_dicom_series_modality', ['modality', 'body_part_examined'], false, 'btree'],
  ['dicom_study_manifests', 'uq_dicom_study_uid', ['tenant_id', 'study_instance_uid'], false, 'btree'],
  ['dicom_study_manifests', 'ix_dicom_study_patient_date', ['tenant_id', 'patient_profile_id', 'study_date desc'], false, 'btree'],
  ['dicom_study_manifests', 'ix_dicom_study_accession', ['tenant_id', 'accession_number'], false, 'btree'],
  ['large_payload_manifests', 'uq_large_payload_source', ['tenant_id', 'source_entity_type', 'source_entity_id', 'payload_type'], false, 'btree'],
  ['large_payload_manifests', 'ix_large_payload_object', ['object_manifest_id'], false, 'btree'],
  ['multipart_uploads', 'uq_multipart_provider_upload', ['namespace_id', 'provider_upload_id'], false, 'btree'],
  ['multipart_uploads', 'ix_multipart_expiry', ['status', 'expires_at'], false, 'btree'],
  ['multipart_uploads', 'ix_multipart_tenant_created', ['tenant_id', 'created_at desc'], false, 'btree'],
  ['object_checksums', 'uq_object_checksum_algorithm_source', ['object_version_id', 'algorithm', 'source'], false, 'btree'],
  ['object_checksums', 'ix_object_checksum_status', ['verification_status', 'verified_at asc'], false, 'btree'],
  ['object_deletion_markers', 'ix_object_delete_manifest', ['object_manifest_id', 'requested_at desc'], false, 'btree'],
  ['object_deletion_markers', 'ix_object_delete_verification', ['verification_status', 'requested_at asc'], false, 'btree'],
  ['object_encryption_envelopes', 'uq_object_encryption_version', ['object_version_id'], false, 'btree'],
  ['object_encryption_envelopes', 'ix_object_encryption_key_version', ['key_management_provider', 'key_version'], false, 'btree'],
  ['object_integrity_checks', 'ix_object_integrity_version_time', ['object_version_id', 'checked_at desc'], false, 'btree'],
  ['object_integrity_checks', 'ix_object_integrity_status', ['status', 'checked_at asc'], false, 'btree'],
  ['object_legal_holds', 'ix_object_hold_active', ['object_version_id', 'hold_state'], false, 'btree'],
  ['object_legal_holds', 'ix_object_hold_case', ['legal_case_reference', 'hold_state'], false, 'btree'],
  ['object_locations', 'uq_object_location_role', ['object_version_id', 'namespace_id', 'placement_role'], false, 'btree'],
  ['object_locations', 'ix_object_location_replication', ['namespace_id', 'replication_state', 'verified_at asc'], false, 'btree'],
  ['object_manifests', 'uq_object_manifest_logical', ['tenant_id', 'logical_object_id'], false, 'btree'],
  ['object_manifests', 'ix_object_manifest_patient', ['tenant_id', 'patient_profile_id', 'updated_at desc'], false, 'btree'],
  ['object_manifests', 'ix_object_manifest_state', ['tenant_id', 'lifecycle_state', 'updated_at desc'], false, 'btree'],
  ['object_namespaces', 'uq_object_namespace_code', ['code'], false, 'btree'],
  ['object_namespaces', 'uq_object_namespace_location', ['backend_code', 'region_code', 'bucket_or_container', 'object_key_prefix'], false, 'btree'],
  ['object_retention_locks', 'uq_object_retention_active', ['object_version_id'], false, 'btree'],
  ['object_retention_locks', 'ix_object_retention_until', ['retain_until'], false, 'btree'],
  ['object_versions', 'uq_object_version_number', ['object_manifest_id', 'version_number'], false, 'btree'],
  ['object_versions', 'uq_object_version_provider', ['object_manifest_id', 'provider_version_id'], false, 'btree'],
  ['object_versions', 'uq_object_version_sha', ['object_manifest_id', 'sha256'], false, 'btree'],
  ['object_versions', 'ix_object_version_created', ['object_manifest_id', 'created_at desc'], false, 'btree'],
];
