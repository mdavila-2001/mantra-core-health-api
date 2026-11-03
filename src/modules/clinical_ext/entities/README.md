# src / modules / clinical ext / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `care_gaps.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `care_team_members.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `care_teams.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `cds_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `clinical_alerts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `drug_interactions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `immunization_schedules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |
| `order_set_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `order_sets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `reference_ranges.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `referrals.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `virtual_encounters.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
