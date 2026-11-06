# src / modules / polyglot storage / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

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
| `index.ts` | Public export barrel for this folder. |
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

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
