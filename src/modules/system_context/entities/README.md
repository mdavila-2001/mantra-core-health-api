# src / modules / system context / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `dynamic_enum_bindings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dynamic_enum_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dynamic_enum_options.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dynamic_enum_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |
| `system_context_bindings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `system_context_inputs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `system_context_refresh_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `system_context_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `system_contexts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
