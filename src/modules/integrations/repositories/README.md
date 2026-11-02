# src / modules / integrations / repositories

Consultas y operaciones de persistencia aisladas de la lógica de negocio.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `external-providers.repository.ts` | Consultas y operaciones de persistencia. |
| `inbound-messages.repository.ts` | Consultas y operaciones de persistencia. |
| `index.ts` | Public export barrel for this folder. |
| `integration-endpoints.repository.ts` | Consultas y operaciones de persistencia. |
| `message-responses.repository.ts` | Consultas y operaciones de persistencia. |
| `message-retries.repository.ts` | Consultas y operaciones de persistencia. |
| `outbound-messages.repository.ts` | Consultas y operaciones de persistencia. |
| `provider-connections.repository.ts` | Consultas y operaciones de persistencia. |
| `provider-credentials.repository.ts` | Consultas y operaciones de persistencia. |
| `webhook-subscriptions.repository.ts` | Consultas y operaciones de persistencia. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
