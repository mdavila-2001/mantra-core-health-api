# src / modules / authz / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `access_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `break_glass_sessions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `care_relationships.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `clinical_access_grants.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `field_permissions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |
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

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
