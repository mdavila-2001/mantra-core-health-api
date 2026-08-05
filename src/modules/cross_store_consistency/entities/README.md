# src / modules / cross store consistency / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `archive_jobs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `cache_invalidation_jobs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `data_movement_jobs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `deletion_executions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `deletion_requests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `deletion_targets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `deletion_verifications.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
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

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
