# src / modules / system context / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `dynamic_enum_bindings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dynamic_enum_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dynamic_enum_options.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `dynamic_enum_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `system_context_bindings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `system_context_inputs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `system_context_refresh_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `system_context_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `system_contexts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
