# src / modules / identity assurance / controllers

Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `identity-assertions.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `identity-authorities.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `identity-cases.controller.spec.ts` | Pruebas unitarias del componente homónimo. |
| `identity-cases.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `identity-checks.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `identity-endpoints.controller.spec.ts` | Pruebas unitarias del componente homónimo. |
| `identity-manual-review.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `identity-policies.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `index.ts` | Public export barrel for this folder. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
