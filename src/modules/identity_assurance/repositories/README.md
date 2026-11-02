# src / modules / identity assurance / repositories

Consultas y operaciones de persistencia aisladas de la lógica de negocio.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `identity-assertions.repository.ts` | Consultas y operaciones de persistencia. |
| `identity-authorities.repository.ts` | Consultas y operaciones de persistencia. |
| `identity-cases.repository.ts` | Consultas y operaciones de persistencia. |
| `identity-checks.repository.ts` | Consultas y operaciones de persistencia. |
| `identity-evidence.repository.ts` | Consultas y operaciones de persistencia. |
| `identity-fraud-signals.repository.ts` | Consultas y operaciones de persistencia. |
| `identity-manual-review.repository.ts` | Consultas y operaciones de persistencia. |
| `identity-policies.repository.ts` | Consultas y operaciones de persistencia. |
| `index.ts` | Public export barrel for this folder. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
