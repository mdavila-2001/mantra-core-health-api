# Repositorios — Diagnostics

Acceso a datos stateless: cada método recibe el `EntityManager` activo como primer
parámetro para que el servicio controle la transacción y el orden de `flush`. Sin
reglas de negocio; solo `create`/`find`/`nativeUpdate`. Cada `em.create` usa
`{ partial: true }` y auditoría con `createdBy` (o `created_at`/`recorded_at` en
tablas append-only).

| Repositorio | Tablas |
|-------------|--------|
| `SpecimensRepository` | specimens, laboratory_accessions, accession_specimens, specimen_chain_of_custody_events, specimen_rejection_events, specimen_containers, specimen_container_events |
| `LabWorkRepository` | laboratory_work_orders, laboratory_work_order_tests, analyzer_runs, analyzer_result_messages, result_verifications |
| `ReportsRepository` | diagnostic_report_versions, diagnostic_report_results, diagnostic_report_files, diagnostic_release_events, critical_result_notifications |
| `ImagingRepository` | imaging_endpoints, imaging_studies, imaging_series, imaging_instances, dicom_object_locations, radiation_dose_events |
| `MediaQualityRepository` | clinical_media, media_annotations, diagnostic_data_quality_events, diagnostic_provenance_links |
