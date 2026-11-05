# src / modules / directory / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo                                  | Responsabilidad                                    |
| ---------------------------------------- | -------------------------------------------------- |
| `branch_memberships.entity.ts`           | Mapeo de una entidad persistente y sus relaciones. |
| `branches.entity.ts`                     | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts`                               | Public export barrel for this folder.        |
| `tenant_affiliation_documents.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tenant_legal_representatives.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tenant_medical_facilities.entity.ts`    | Mapeo de una entidad persistente y sus relaciones. |
| `tenant_medical_facility_sites.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tenant_memberships.entity.ts`           | Mapeo de una entidad persistente y sus relaciones. |
| `tenant_web_configs.entity.ts`           | Mapeo de una entidad persistente y sus relaciones. |
| `tenants.entity.ts`                      | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
