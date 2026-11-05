# src / modules / pharma_lab / services

Casos de uso, reglas de negocio y coordinación transaccional.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `index.ts` | Public export barrel for this folder. |
| `medical-visitors.service.spec.ts` | Pruebas unitarias del componente. |
| `medical-visitors.service.ts` | Use cases and business rules. |
| `pharma-analytics.service.ts` | Use cases and business rules. |
| `pharma-catalog.service.spec.ts` | Pruebas unitarias del componente. |
| `pharma-catalog.service.ts` | Use cases and business rules. |
| `pharma-lab-access.service.spec.ts` | Pruebas unitarias del componente. |
| `pharma-lab-access.service.ts` | Use cases and business rules. |
| `pharma-lab-notifications.service.ts` | Use cases and business rules. |
| `pharma-lab-organization.service.ts` | Use cases and business rules. |
| `pharma-social.service.ts` | Use cases and business rules. |
| `pharmacovigilance.service.spec.ts` | Pruebas unitarias del componente. |
| `pharmacovigilance.service.ts` | Use cases and business rules. |
| `regulatory-documents.service.spec.ts` | Pruebas unitarias del componente. |
| `regulatory-documents.service.ts` | Use cases and business rules. |
| `visit-agenda.service.spec.ts` | Pruebas unitarias del componente. |
| `visit-agenda.service.ts` | Use cases and business rules. |
| `visit-records.service.spec.ts` | Pruebas unitarias del componente. |
| `visit-records.service.ts` | Use cases and business rules. |
| `visit-requests.service.spec.ts` | Pruebas unitarias del componente. |
| `visit-requests.service.ts` | Use cases and business rules. |
| `visit-surveys.service.ts` | Use cases and business rules. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
