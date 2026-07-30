# Common · Repositories

Data-access layer for the `common` schema. Every repository is **stateless**: each
method takes the active `EntityManager` as its first argument so the calling
service owns the transaction and several repositories can share one atomic
`flush()`. No business rules live here — only query construction and
materialization.

| Repository | Table | Key methods |
|---|---|---|
| `IdentifiersRepository` | `common.identifiers` | `findActiveDuplicate`, `create` |
| `ContactPointsRepository` | `common.contact_points` | `findById`, `create` |
| `AddressesRepository` | `common.addresses` | `create` |
| `FilesRepository` | `common.files` | `findById`, `create` |
| `FileVersionsRepository` | `common.file_versions` | `findById`, `findByFileAndId`, `maxVersionNumber`, `create` |
| `FileDerivativesRepository` | `common.file_derivatives` | `create` |
| `FileLinksRepository` | `common.file_links` | `create` |

## Conventions

- **Audit fields** come from `createdBy(actorUserId)` (`created_at`, `updated_at`,
  `created_by_user_id`, `updated_by_user_id`). `file_versions` and
  `file_derivatives` are append-style rows: they only carry `recorded_at` /
  `created_at` plus the author, no `updated_at`/`row_version`.
- **`row_version` is never set**: the column has a DB `DEFAULT 1` and MikroORM
  manages it. On entities that have it, `em.create(..., { partial: true })` relaxes
  the strict typing that would otherwise demand the version column.
- **All type/status/method fields are `*_concept_id` FKs** resolved from
  `CONCEPTS` by the service; repositories receive already-resolved uuids.
- `size_bytes` is a `bigint` → materialized as a `string`.
- `addresses.lines` is a single `varchar`; the service serializes the string[]
  with `\n`.
