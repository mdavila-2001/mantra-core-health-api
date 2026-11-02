# src / modules / chart / services

Casos de uso, reglas de negocio y coordinación transaccional.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `chart-care-plans.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `chart-care-plans.service.ts` | Use cases and business rules. |
| `chart-documents.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `chart-documents.service.ts` | Use cases and business rules. |
| `chart-notes.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `chart-notes.service.ts` | Use cases and business rules. |
| `chart-templates.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `chart-templates.service.ts` | Use cases and business rules. |
| `index.ts` | Public export barrel for this folder. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
