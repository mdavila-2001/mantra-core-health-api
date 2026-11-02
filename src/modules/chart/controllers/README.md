# src / modules / chart / controllers

Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `chart-care-plans.controller.spec.ts` | Pruebas unitarias del componente homónimo. |
| `chart-care-plans.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `chart-documents.controller.spec.ts` | Pruebas unitarias del componente homónimo. |
| `chart-documents.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `chart-notes.controller.spec.ts` | Pruebas unitarias del componente homónimo. |
| `chart-notes.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `chart-templates.controller.spec.ts` | Pruebas unitarias del componente homónimo. |
| `chart-templates.controller.ts` | Endpoints HTTP y adaptación del transporte. |
| `index.ts` | Public export barrel for this folder. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
