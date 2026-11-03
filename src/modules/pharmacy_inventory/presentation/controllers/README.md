# src / modules / pharmacy inventory / controllers

Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `index.ts` | Public export barrel for this folder. |
| `pharmacy-dispensing.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `pharmacy-inventory-internal.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `pharmacy-inventory.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `pharmacy-procurement.controller.ts` | Endpoints HTTP y adaptación del transporte. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
