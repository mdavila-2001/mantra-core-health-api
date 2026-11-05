# src / modules / document store / services

Casos de uso, reglas de negocio y coordinación transaccional.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `document-store.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `document-store.service.ts` | Use cases and business rules. |
| `index.ts` | Public export barrel for this folder. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
