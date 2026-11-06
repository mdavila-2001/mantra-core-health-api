# src / modules / practice / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo                                      | Responsabilidad                                    |
| -------------------------------------------- | -------------------------------------------------- |
| `care_spaces.entity.ts`                      | Mapeo de una entidad persistente y sus relaciones. |
| `clinical_units.entity.ts`                   | Mapeo de una entidad persistente y sus relaciones. |
| `healthcare_services.entity.ts`              | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts`                                   | Public export barrel for this folder.        |
| `inventory_items.entity.ts`                  | Mapeo de una entidad persistente y sus relaciones. |
| `inventory_movements.entity.ts`              | Mapeo de una entidad persistente y sus relaciones. |
| `practice_accreditations.entity.ts`          | Mapeo de una entidad persistente y sus relaciones. |
| `practice_settings.entity.ts`                | Mapeo de una entidad persistente y sus relaciones. |
| `practice_sites.entity.ts`                   | Mapeo de una entidad persistente y sus relaciones. |
| `practices.entity.ts`                        | Mapeo de una entidad persistente y sus relaciones. |
| `practitioner_role_assignments.entity.ts`    | Mapeo de una entidad persistente y sus relaciones. |
| `practitioner_support_assignments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
