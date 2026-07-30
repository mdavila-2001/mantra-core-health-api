# Common · Services

Business logic for the Common module. Services inject `EntityManager` (from
`@mikro-orm/postgresql`) and run every write inside `em.transactional(async (tx)
=> …)`, which yields an isolated `EntityManager` per request (there is **no**
global `RequestContext`). Read-only flows use `em.fork()`.

Because FKs are plain uuid columns (not ORM relations), MikroORM does not order
inserts: services `await tx.flush()` a parent before creating a child that
references it (file → version → derivative). Domain rules throw the shared
`DomainException` subclasses. Structured logs use `PinoLogger`.

| Service | Use cases | Rules enforced |
|---|---|---|
| `IdentifiersService` | UC-02-01 | Reject duplicate **ACTIVE** `(type, system, value)` → `ConflictException` |
| `ContactPointsService` | UC-02-02, UC-02-03 | `verify` requires an existing contact point → `ResourceNotFoundException` |
| `AddressesService` | UC-02-04 | Country defaults to `PE`; use=HOME, type=POSTAL |
| `FilesService` | UC-02-05 … UC-02-11 | See below |

## `FilesService` rules

- **createFile (UC-02-05)**: creates `files` (lifecycle=ACTIVE) → flush → version 1
  (scan=PENDING) → flush → promote `currentVersionId` → flush.
- **createVersion (UC-02-06)**: file must exist; `versionNumber = max + 1`; promotes
  the new version.
- **createDerivative (UC-02-07)**: source version must be `SCAN_CLEAN`, else
  `PreconditionFailedException`. The derivative is stored as a new (clean) version
  of the same file plus a `file_derivatives` row.
- **createLink (UC-02-08)**: file must exist.
- **recordScanResult (UC-02-09)**: sets version scan status CLEAN/INFECTED; on
  INFECTED it logs a quarantine warning (file kept active).
- **softDelete (UC-02-10)**: blocked while `legal_hold_until` is in the future
  (`PreconditionFailedException`); otherwise sets lifecycle=DELETED + `deleted_at`.
- **generateDownloadUrl (UC-02-11)**: file must exist and not be deleted; current
  version must be `SCAN_CLEAN`. Returns an HMAC-signed URL (`node:crypto`, 15-min
  expiry) — a real S3 presign would replace this deterministic string.

## Tests

`*.service.spec.ts` are pure unit tests with mocked `EntityManager` and
repositories (`transactional` mocked as `(cb) => cb(txMock)`, `fork` returns a
mock). Each service covers happy path, not-found, and a
precondition/conflict rejection. No real DB access.
