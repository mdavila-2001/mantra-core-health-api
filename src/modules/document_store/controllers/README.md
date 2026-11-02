# src / modules / document store / controllers

Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `collection-name.guard.ts` | Support implementation or resource for this folder. |
| `document-store.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `index.ts` | Public export barrel for this folder. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
