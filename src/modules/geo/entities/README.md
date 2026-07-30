# src / modules / geo / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `geofence_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `geofences.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `location_pings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tracked_subjects.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tracking_sessions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `trips.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
