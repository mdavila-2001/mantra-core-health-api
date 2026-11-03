# src / modules / telemetry / infrastructure / repositories

Consultas y operaciones de persistencia aisladas de la lógica de negocio.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `activity-event-schema-definitions.repository.ts` | Consultas y operaciones de persistencia. |
| `analytics-subjects.repository.ts` | Consultas y operaciones de persistencia. |
| `client-contexts.repository.ts` | Consultas y operaciones de persistencia. |
| `conversion-events.repository.ts` | Consultas y operaciones de persistencia. |
| `funnel-definitions.repository.ts` | Consultas y operaciones de persistencia. |
| `funnel-steps.repository.ts` | Consultas y operaciones de persistencia. |
| `index.ts` | Public export barrel for this folder. |
| `session-journeys.repository.ts` | Consultas y operaciones de persistencia. |
| `tracking-consents.repository.ts` | Consultas y operaciones de persistencia. |
| `tracking-disclosure-acceptances.repository.ts` | Consultas y operaciones de persistencia. |
| `tracking-disclosure-versions.repository.ts` | Consultas y operaciones de persistencia. |
| `tracking-purpose-definitions.repository.ts` | Consultas y operaciones de persistencia. |
| `user-activity-event-properties.repository.ts` | Consultas y operaciones de persistencia. |
| `user-activity-events.repository.ts` | Consultas y operaciones de persistencia. |
| `web-vitals.repository.ts` | Consultas y operaciones de persistencia. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
