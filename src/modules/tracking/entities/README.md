# src / modules / tracking / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `delivery_proofs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `eta_estimates.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |
| `milestone_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `shipment_handoffs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `shipments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `trackable_subjects.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tracking_carriers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tracking_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
