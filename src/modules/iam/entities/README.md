# src / modules / iam / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `account_activations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `account_lockouts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `api_key_scopes.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `api_keys.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `authentication_credentials.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `devices.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |
| `mfa_factors.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `refresh_tokens.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `security_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `sessions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `user_global_roles.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `users.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
