# src / modules / lakehouse / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `cohort_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `data_lake_zones.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `data_product_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `data_products.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dataset_release_manifests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dataset_release_requests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `lakehouse_catalogs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lakehouse_datasets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lakehouse_files.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lakehouse_lineage_edges.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lakehouse_partitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lakehouse_quality_issues.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lakehouse_quality_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lakehouse_quality_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `lakehouse_schema_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `research_projects.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `transformation_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `transformation_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
