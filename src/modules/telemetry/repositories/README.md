# src / modules / telemetry / repositories

Consultas y operaciones de persistencia aisladas de la lógica de negocio.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `activity-event-schema-definitions.repository.ts` | Consultas y operaciones de persistencia. |
| `analytics-subjects.repository.ts` | Consultas y operaciones de persistencia. |
| `client-contexts.repository.ts` | Consultas y operaciones de persistencia. |
| `conversion-events.repository.ts` | Consultas y operaciones de persistencia. |
| `funnel-definitions.repository.ts` | Consultas y operaciones de persistencia. |
| `funnel-steps.repository.ts` | Consultas y operaciones de persistencia. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `session-journeys.repository.ts` | Consultas y operaciones de persistencia. |
| `tracking-consents.repository.ts` | Consultas y operaciones de persistencia. |
| `tracking-disclosure-acceptances.repository.ts` | Consultas y operaciones de persistencia. |
| `tracking-disclosure-versions.repository.ts` | Consultas y operaciones de persistencia. |
| `tracking-purpose-definitions.repository.ts` | Consultas y operaciones de persistencia. |
| `user-activity-event-properties.repository.ts` | Consultas y operaciones de persistencia. |
| `user-activity-events.repository.ts` | Consultas y operaciones de persistencia. |
| `web-vitals.repository.ts` | Consultas y operaciones de persistencia. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
