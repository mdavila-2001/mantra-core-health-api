# src / modules / chart / repositories

Consultas y operaciones de persistencia aisladas de la lógica de negocio.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `care-plans.repository.ts` | Consultas y operaciones de persistencia. |
| `chart-templates.repository.ts` | Consultas y operaciones de persistencia. |
| `clinical-notes.repository.ts` | Consultas y operaciones de persistencia. |
| `documents.repository.ts` | Consultas y operaciones de persistencia. |
| `index.ts` | Public export barrel for this folder. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
