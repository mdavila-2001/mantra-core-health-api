# src / modules / geo / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `geofence_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `geofences.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |
| `location_pings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tracked_subjects.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tracking_sessions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `trips.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
