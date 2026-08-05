# src / modules / authz / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `access_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `break_glass_sessions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `care_relationships.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `clinical_access_grants.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `field_permissions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `ip_access_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `patient_legal_representations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `permission_categories.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `permissions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `resource_scope_grants.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `role_permissions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `roles.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `service_principals.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `user_permission_grants.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `user_role_assignments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
