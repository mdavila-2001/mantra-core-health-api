# src / modules / graph intelligence / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `graph_access_scopes.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `graph_communities.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `graph_deletion_jobs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `graph_edge_evidence.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `graph_edges.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `graph_node_identifiers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `graph_nodes.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `graph_path_cache.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `graph_projection_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `graph_projection_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `graph_risk_scores.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `graph_rule_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `graph_rule_hits.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
