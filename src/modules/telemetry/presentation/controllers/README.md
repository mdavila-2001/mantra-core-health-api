# src / modules / telemetry / presentation / controllers

Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `index.ts` | Public export barrel for this folder. |
| `telemetry-consent.controller.spec.ts` | Pruebas unitarias del componente homónimo. |
| `telemetry-consent.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `telemetry-events.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `telemetry-governance.controller.spec.ts` | Pruebas unitarias del componente homónimo. |
| `telemetry-governance.controller.ts` | Endpoints HTTP y adaptación del transporte. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
