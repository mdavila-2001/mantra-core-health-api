# src / modules / delegated access / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo                                        | Responsabilidad                                    |
| ---------------------------------------------- | -------------------------------------------------- |
| `delegated_access_approval_requests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `delegated_access_grants.entity.ts`            | Mapeo de una entidad persistente y sus relaciones. |
| `delegated_permission_set_items.entity.ts`     | Mapeo de una entidad persistente y sus relaciones. |
| `delegated_permission_sets.entity.ts`          | Mapeo de una entidad persistente y sus relaciones. |
| `delegation_events.entity.ts`                  | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts`                                     | Public export barrel for this folder.        |
| `organization_user_assignments.entity.ts`      | Mapeo de una entidad persistente y sus relaciones. |
| `practitioner_delegate_assignments.entity.ts`  | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
