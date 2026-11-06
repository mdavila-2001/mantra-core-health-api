# src / modules / telemetry / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `activity_event_schema_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `analytics_subjects.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `client_contexts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `conversion_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `funnel_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `funnel_steps.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |
| `session_journeys.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tracking_consents.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tracking_disclosure_acceptances.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tracking_disclosure_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tracking_purpose_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `user_activity_event_properties.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `user_activity_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `web_vitals.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
