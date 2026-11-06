# src / modules / integrations / services

Casos de uso, reglas de negocio y coordinación transaccional.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `index.ts` | Public export barrel for this folder. |
| `integrations-connections.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `integrations-connections.service.ts` | Use cases and business rules. |
| `integrations-messaging.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `integrations-messaging.service.ts` | Use cases and business rules. |
| `integrations-providers.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `integrations-providers.service.ts` | Use cases and business rules. |
| `integrations-webhooks.service.spec.ts` | Pruebas unitarias del componente homónimo. |
| `integrations-webhooks.service.ts` | Use cases and business rules. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
