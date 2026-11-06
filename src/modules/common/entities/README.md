# src / modules / common / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `addresses.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `contact_points.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `file_derivatives.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `file_links.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `file_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `files.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `identifiers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
