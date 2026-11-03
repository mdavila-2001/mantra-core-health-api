# src / modules / insurance / services

Casos de uso, reglas de negocio y coordinación transaccional.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `appeals.service.ts` | Use cases and business rules. |
| `broker-commission.service.ts` | Use cases and business rules. |
| `claims.service.ts` | Use cases and business rules. |
| `coverage.service.ts` | Use cases and business rules. |
| `index.ts` | Public export barrel for this folder. |
| `insurance-backbone.service.ts` | Use cases and business rules. |
| `insurance-read.service.ts` | Use cases and business rules. |
| `prior-auth.service.ts` | Use cases and business rules. |
| `reconciliation.service.ts` | Use cases and business rules. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
