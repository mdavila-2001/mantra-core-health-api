# src / modules / cross store consistency / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `archive_jobs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `cache_invalidation_jobs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `data_movement_jobs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `deletion_executions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `deletion_requests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `deletion_targets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `deletion_verifications.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |
| `projection_checkpoints.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `projection_consumers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `projection_dead_letters.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `projection_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `projection_delivery_attempts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `projection_drift_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `projection_repair_jobs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `projection_subscriptions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `reconciliation_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `reconciliation_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `reindex_jobs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `schema_migration_jobs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `store_consistency_slos.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
