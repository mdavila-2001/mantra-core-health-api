# src / modules / reporting / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo                          | Responsabilidad                                    |
| -------------------------------- | -------------------------------------------------- |
| `dashboard_widgets.entity.ts`    | Mapeo de una entidad persistente y sus relaciones. |
| `dashboards.entity.ts`           | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts`                       | Public export barrel for this folder.        |
| `report_columns.entity.ts`       | Mapeo de una entidad persistente y sus relaciones. |
| `report_data_sources.entity.ts`  | Mapeo de una entidad persistente y sus relaciones. |
| `report_definitions.entity.ts`   | Mapeo de una entidad persistente y sus relaciones. |
| `report_distributions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `report_executions.entity.ts`    | Mapeo de una entidad persistente y sus relaciones. |
| `report_parameters.entity.ts`    | Mapeo de una entidad persistente y sus relaciones. |
| `report_schedules.entity.ts`     | Mapeo de una entidad persistente y sus relaciones. |
| `report_snapshots.entity.ts`     | Mapeo de una entidad persistente y sus relaciones. |
| `report_subscriptions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `report_versions.entity.ts`      | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
