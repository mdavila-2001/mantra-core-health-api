# src / modules / marketing / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `attribution_touches.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `campaign_dispatch_recipients.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `campaign_dispatches.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `campaign_members.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `campaign_schedules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `content_templates.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `journey_enrollments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `journey_steps.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `journeys.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `marketing_campaigns.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `marketing_touchpoints.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `segment_members.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `segments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tracked_links.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
