-- Columnas declaradas NOT NULL que describen datos legítimamente ausentes.
--
-- Todas comparten el mismo síntoma: el repositorio las declara opcionales, sus
-- llamadores no las aportan —porque el dato puede no existir— y la escritura
-- fallaba con 500 contra la base real. Ejemplos claros: una serie DICOM sin
-- miniatura, una instancia sin número de fotogramas, un objeto almacenado que
-- no pertenece a ningún paciente, una política de residencia sin países
-- prohibidos.
--
-- La alternativa —rellenarlas con un valor inventado— habría escrito datos
-- falsos en el registro clínico y de gobierno. Migración aditiva y reversible:
-- sólo relaja la restricción, no toca datos existentes.

ALTER TABLE object_storage.dicom_study_manifests
  ALTER COLUMN study_date DROP NOT NULL,
  ALTER COLUMN modality_codes DROP NOT NULL;

ALTER TABLE object_storage.dicom_series_manifests
  ALTER COLUMN modality DROP NOT NULL,
  ALTER COLUMN body_part_examined DROP NOT NULL,
  ALTER COLUMN thumbnail_object_manifest_id DROP NOT NULL;

ALTER TABLE object_storage.dicom_instance_manifests
  ALTER COLUMN sop_class_uid DROP NOT NULL,
  ALTER COLUMN instance_number DROP NOT NULL,
  ALTER COLUMN transfer_syntax_uid DROP NOT NULL,
  ALTER COLUMN frame_count DROP NOT NULL,
  ALTER COLUMN metadata_json DROP NOT NULL;

ALTER TABLE object_storage.object_manifests
  ALTER COLUMN patient_profile_id DROP NOT NULL,
  ALTER COLUMN retention_policy_code DROP NOT NULL;

ALTER TABLE polyglot_storage.collection_definitions
  ALTER COLUMN routing_key_expression DROP NOT NULL,
  ALTER COLUMN shard_key_expression DROP NOT NULL;

ALTER TABLE polyglot_storage.residency_policies
  ALTER COLUMN forbidden_country_codes DROP NOT NULL,
  ALTER COLUMN allowed_region_codes DROP NOT NULL,
  ALTER COLUMN cross_border_transfer_basis DROP NOT NULL;
