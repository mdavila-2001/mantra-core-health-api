# src / modules / integrations / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `external_providers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `inbound_messages.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |
| `integration_endpoints.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `integration_field_mappings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `message_responses.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `message_retries.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `outbound_messages.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `provider_connections.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `provider_credentials.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `webhook_subscriptions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
