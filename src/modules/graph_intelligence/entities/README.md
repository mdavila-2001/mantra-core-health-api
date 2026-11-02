# src / modules / graph intelligence / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

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
| `index.ts` | Public export barrel for this folder. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
