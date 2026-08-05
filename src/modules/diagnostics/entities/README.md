# src / modules / diagnostics / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `accession_specimens.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `analyzer_result_messages.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `analyzer_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `clinical_media.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `critical_result_notifications.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_data_quality_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_provenance_links.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_release_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_report_files.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_report_results.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_report_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dicom_object_locations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dicom_structured_reports.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `imaging_endpoints.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `imaging_instances.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `imaging_procedure_steps.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `imaging_selection_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `imaging_selections.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `imaging_series.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `imaging_studies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `laboratory_accessions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `laboratory_work_order_tests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `laboratory_work_orders.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `media_annotations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `observation_specimens.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `radiation_dose_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `result_verifications.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `specimen_chain_of_custody_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `specimen_collection_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `specimen_container_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `specimen_containers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `specimen_identifiers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `specimen_parent_links.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `specimen_processing_steps.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `specimen_rejection_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `specimens.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
