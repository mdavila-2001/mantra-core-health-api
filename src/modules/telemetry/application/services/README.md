# src / modules / telemetry / application / services

Casos de uso, reglas de negocio y coordinación transaccional.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `index.ts` | Public export barrel for this folder. |
| `telemetry-consent.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `telemetry-consent.service.ts` | Use cases and business rules. |
| `telemetry-events.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `telemetry-events.service.ts` | Use cases and business rules. |
| `telemetry-governance.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `telemetry-governance.service.ts` | Use cases and business rules. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
