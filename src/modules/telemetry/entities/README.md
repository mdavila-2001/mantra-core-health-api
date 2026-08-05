# src / modules / telemetry / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `activity_event_schema_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `analytics_subjects.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `client_contexts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `conversion_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `funnel_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `funnel_steps.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `session_journeys.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tracking_consents.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tracking_disclosure_acceptances.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tracking_disclosure_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tracking_purpose_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `user_activity_event_properties.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `user_activity_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `web_vitals.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
