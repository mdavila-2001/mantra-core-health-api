# src / modules / organization extensions / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `data_use_agreements.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `facility_licenses.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `hospital_service_lines.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `hospitals.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |
| `organization_affiliations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `organization_data_boundaries.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
