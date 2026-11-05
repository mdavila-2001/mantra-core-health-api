# src / modules / integration contracts / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `contract_webhook_subscriptions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |
| `integration_auth_profiles.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `integration_contract_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `integration_contracts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `integration_exchange_attempts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `integration_exchange_records.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `integration_idempotency_records.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `integration_sync_cursors.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `webhook_delivery_evidence.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
