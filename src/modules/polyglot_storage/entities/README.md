# src / modules / polyglot storage / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `collection_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `collection_schema_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `consistency_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `data_access_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `data_classifications.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dataset_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dataset_placements.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dataset_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `encryption_profiles.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `key_rotation_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `replication_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `residency_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `retention_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `storage_backend_regions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `storage_backends.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `storage_capabilities.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `storage_cost_snapshots.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `storage_integrity_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `store_health_checks.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tenant_storage_bindings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
