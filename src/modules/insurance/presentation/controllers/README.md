# src / modules / insurance / controllers

Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `appeals.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `broker-commission.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `claims.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `coverage.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `index.ts` | Public export barrel for this folder. |
| `insurance-backbone.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `insurance-read.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `prior-auth.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `reconciliation.controller.ts` | Endpoints HTTP y adaptación del transporte. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
