# src / modules / health data / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `canonical_health_resource_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `canonical_health_resources.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `canonical_resource_bindings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `canonical_resource_identifiers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `canonical_resource_relationships.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `fhir_profile_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `fhir_profile_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `fhir_validation_issues.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `fhir_validation_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `health_data_quality_issues.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `health_data_quality_rule_sets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `health_data_quality_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `health_data_quality_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `health_deidentification_profiles.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `health_deidentification_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `health_export_jobs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `health_export_manifests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `health_ingestion_batches.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `health_ingestion_records.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `health_lineage_edges.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `health_provenance_records.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `health_provenance_targets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `health_source_connections.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `health_source_systems.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `health_terminology_mapping_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `health_terminology_mapping_sets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `omop_mapping_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `omop_mapping_sets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `omop_transformation_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `patient_identity_clusters.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `patient_identity_members.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `patient_match_candidates.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `patient_match_decisions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `patient_timeline_entries.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
