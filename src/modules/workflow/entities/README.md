# src / modules / workflow / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `index.ts` | Public export barrel for this folder. |
| `state_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `state_machine_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `state_transition_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `state_transition_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `transition_guards.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `transition_side_effects.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `workflow_instances.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `workflow_tasks.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
