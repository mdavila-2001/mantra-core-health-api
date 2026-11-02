# src / modules / health context / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `context_agents.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `context_collection_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `context_fact_evidence.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `context_quality_reviews.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `context_source_observations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `country_context_schedules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `country_health_context_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `country_health_contexts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `health_context_facts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `health_context_sources.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
