# src / modules / workflow / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `state_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `state_machine_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `state_transition_definitions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `state_transition_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `transition_guards.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `transition_side_effects.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `workflow_instances.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `workflow_tasks.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
