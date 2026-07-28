# src / modules / delegated access / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `delegated_access_approval_requests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `delegated_access_grants.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `delegated_permission_set_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `delegated_permission_sets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `delegation_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `organization_user_assignments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `practitioner_delegate_assignments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
