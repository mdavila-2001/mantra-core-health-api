# src / modules / health context / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

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
| `index.ts` | Punto de exportación pública de la carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
