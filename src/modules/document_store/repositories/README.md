# src / modules / document store / repositories

Consultas y operaciones de persistencia aisladas de la lógica de negocio.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `document-store.repository.ts` | Consultas y operaciones de persistencia. |
| `index.ts` | Public export barrel for this folder. |
| `mongo-connection.provider.ts` | Support implementation or resource for this folder. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
