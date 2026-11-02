# src / modules / auth providers / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `account_link_requests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `federated_identities.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `federated_login_attempts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `identity_providers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |
| `provider_attribute_mappings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `provider_protocol_configs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `provider_signing_keys.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `provider_tenant_bindings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `provisioning_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
