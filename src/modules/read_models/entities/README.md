# src / modules / read models / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `frontend_page_views.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `frontend_routes.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `frontend_view_actions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `frontend_view_fields.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `frontend_view_filters.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `frontend_view_kpis.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `frontend_view_sort_options.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `frontend_view_states.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `portal_surfaces.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `read_model_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `read_model_dependencies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `read_model_refresh_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `user_view_preferences.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
