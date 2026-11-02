# src / modules / insurance / repositories

Consultas y operaciones de persistencia aisladas de la lógica de negocio.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `catalog.repository.ts` | Consultas y operaciones de persistencia. |
| `claim.repository.ts` | Consultas y operaciones de persistencia. |
| `coverage.repository.ts` | Consultas y operaciones de persistencia. |
| `dispute.repository.ts` | Consultas y operaciones de persistencia. |
| `index.ts` | Public export barrel for this folder. |
| `prior-auth.repository.ts` | Consultas y operaciones de persistencia. |
| `read.repository.ts` | Consultas y operaciones de persistencia. |
| `settlement.repository.ts` | Consultas y operaciones de persistencia. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
