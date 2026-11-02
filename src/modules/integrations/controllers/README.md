# src / modules / integrations / controllers

Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `index.ts` | Public export barrel for this folder. |
| `integrations-connections.controller.spec.ts` | Pruebas unitarias del componente homónimo. |
| `integrations-connections.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `integrations-messages.controller.spec.ts` | Pruebas unitarias del componente homónimo. |
| `integrations-messages.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `integrations-providers.controller.spec.ts` | Pruebas unitarias del componente homónimo. |
| `integrations-providers.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `integrations-webhooks.controller.ts` | Endpoints HTTP y adaptación del transporte. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
