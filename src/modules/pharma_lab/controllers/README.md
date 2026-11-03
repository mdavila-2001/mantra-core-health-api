# src / modules / pharma_lab / controllers

Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `index.ts` | Public export barrel for this folder. |
| `medical-visitors.controller.ts` | Adaptador HTTP del dominio. |
| `pharma-catalog.controller.ts` | Adaptador HTTP del dominio. |
| `pharma-lab-social.controller.ts` | Adaptador HTTP del dominio. |
| `pharma-labs.controller.ts` | Adaptador HTTP del dominio. |
| `pharmacovigilance.controller.ts` | Adaptador HTTP del dominio. |
| `regulatory-documents.controller.ts` | Adaptador HTTP del dominio. |
| `visit-agenda.controller.ts` | Adaptador HTTP del dominio. |
| `visit-records.controller.ts` | Adaptador HTTP del dominio. |
| `visit-requests.controller.ts` | Adaptador HTTP del dominio. |
| `visit-surveys.controller.ts` | Adaptador HTTP del dominio. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
