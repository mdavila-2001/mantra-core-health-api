# IAM — Repositories

Data-access layer for the `iam` schema. Repositories are **stateless**: every
method takes the active `EntityManager` as its first argument so the calling
service owns the unit of work and the transaction, and repositories stay trivially
mockable in unit tests.

## Rules

- No business rules here — only query construction and materialization.
- Writes never `flush`; the service decides when (parent-before-child ordering).
- Audit fields come from `createdBy(actorUserId)`; `rowVersion` is never set (DB
  `DEFAULT 1`, managed by MikroORM).
- All status/type/method columns are `*_concept_id` FKs → values come from
  `CONCEPTS.*`.
- Bulk state transitions (revoke/expire many rows) use `em.nativeUpdate` to avoid
  materializing rows that are only being flipped.

## Repositories

| Repository | Table | Responsibility |
| --- | --- | --- |
| `UsersRepository` | `users` | Find/create users, active count. |
| `CredentialsRepository` | `authentication_credentials` | Password + federated credentials, uniqueness lookups, bulk revoke. |
| `SessionsRepository` | `sessions` | Create sessions, list active ids, bulk revoke, expire. |
| `RefreshTokensRepository` | `refresh_tokens` | Create/rotate, find-by-hash (reuse detection), bulk revoke/expire. |
| `MfaFactorsRepository` | `mfa_factors` | Enroll factor, find-by-id+user for verification. |
| `DevicesRepository` | `devices` | Register device (optionally trusted). |
| `UserGlobalRolesRepository` | `user_global_roles` | Grant/revoke roles, list active roles for token issuance. |
| `AccountLockoutsRepository` | `account_lockouts` | Create/find active lockout. |
| `SecurityEventsRepository` | `security_events` | Append-only audit trail; failed-login counter. |
