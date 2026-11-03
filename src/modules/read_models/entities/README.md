# src / modules / read models / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo                                | Responsabilidad                                    |
| -------------------------------------- | -------------------------------------------------- |
| `frontend_page_views.entity.ts`        | Mapeo de una entidad persistente y sus relaciones. |
| `frontend_routes.entity.ts`            | Mapeo de una entidad persistente y sus relaciones. |
| `frontend_view_actions.entity.ts`      | Mapeo de una entidad persistente y sus relaciones. |
| `frontend_view_fields.entity.ts`       | Mapeo de una entidad persistente y sus relaciones. |
| `frontend_view_filters.entity.ts`      | Mapeo de una entidad persistente y sus relaciones. |
| `frontend_view_kpis.entity.ts`         | Mapeo de una entidad persistente y sus relaciones. |
| `frontend_view_sort_options.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `frontend_view_states.entity.ts`       | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts`                             | Public export barrel for this folder.        |
| `portal_surfaces.entity.ts`            | Mapeo de una entidad persistente y sus relaciones. |
| `read_model_definitions.entity.ts`     | Mapeo de una entidad persistente y sus relaciones. |
| `read_model_dependencies.entity.ts`    | Mapeo de una entidad persistente y sus relaciones. |
| `read_model_refresh_runs.entity.ts`    | Mapeo de una entidad persistente y sus relaciones. |
| `user_view_preferences.entity.ts`      | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
