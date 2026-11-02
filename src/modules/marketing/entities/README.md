# src / modules / marketing / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `attribution_touches.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `campaign_dispatch_recipients.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `campaign_dispatches.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `campaign_members.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `campaign_schedules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `content_templates.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |
| `journey_enrollments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `journey_steps.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `journeys.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `marketing_campaigns.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `marketing_touchpoints.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `segment_members.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `segments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tracked_links.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
