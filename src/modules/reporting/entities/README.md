# src / modules / reporting / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `dashboard_widgets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dashboards.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `report_columns.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `report_data_sources.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `report_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `report_distributions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `report_executions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `report_parameters.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `report_schedules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `report_snapshots.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `report_subscriptions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `report_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
