# src / modules / identity assurance / services

Casos de uso, reglas de negocio y coordinación transaccional.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `identity-assertions.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `identity-assertions.service.ts` | Use cases and business rules. |
| `identity-authorities.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `identity-authorities.service.ts` | Use cases and business rules. |
| `identity-cases.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `identity-cases.service.ts` | Use cases and business rules. |
| `identity-checks.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `identity-checks.service.ts` | Use cases and business rules. |
| `identity-manual-review.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `identity-manual-review.service.ts` | Use cases and business rules. |
| `identity-policies.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `identity-policies.service.ts` | Use cases and business rules. |
| `index.ts` | Public export barrel for this folder. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
