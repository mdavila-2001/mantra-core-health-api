# src / modules / diagnostic units / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `diagnostic_equipment.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_price_schedules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_study_components.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_study_offerings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_study_prices.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_unit_accreditations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_unit_practitioner_assignments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_unit_sites.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_unit_specialties.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `diagnostic_units.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
