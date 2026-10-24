# IAM — Services

Business logic. Services own the unit of work: they inject `EntityManager` from
`@mikro-orm/postgresql` and wrap every write in `em.transactional(...)`, using
`em.fork()` for isolated reads. There is no `RequestContext` middleware, so the
injected `em` is never used directly for a unit of work.

## Golden rules applied here

- **Parent before child**: FKs are plain uuid columns, so MikroORM does not order
  inserts. Create the parent, `await tx.flush()`, then the child (users→credential,
  session→refresh token).
- **Never set `rowVersion`** (DB `DEFAULT 1`). Audit fields via `createdBy()` /
  `touch()`.
- **Concepts only**: every `*_concept_id` value comes from `CONCEPTS.*`.
- **Failure side-effects commit before throwing**: failed logins record their
  security event / lockout in a dedicated transaction, then the service throws
  `UnauthorizedException` — otherwise the `throw` would roll them back.

## Services → use cases

| Service | Use cases |
| --- | --- |
| `IamUsersService` | UC-01-01 create user, UC-01-07 lock, UC-01-10 global roles, UC-01-12 anonymize (DSAR). |
| `IamCredentialsService` | UC-01-02 link federated credential, UC-01-09 revoke credential. |
| `IamMfaService` | UC-01-03 enroll / verify MFA factor. |
| `IamDevicesService` | UC-01-05 register device (optionally trusted). |
| `IamAuthService` | UC-01-04 login, UC-01-06 refresh (reuse detection), UC-01-08 logout-all, UC-01-11 purge sessions. |

`role-mapping.ts` translates role codes (`SECURITY_ADMIN`, …) to/from
`role_concept_id` values for grants and for the `roles` claim in issued JWTs.
