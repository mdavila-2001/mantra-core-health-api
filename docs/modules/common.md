<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/common/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `common`

**Fuente:** [`src/modules/common/README.md`](https://github.com/mdavila-2001/mantra-core-health-redesa-api/blob/master/src/modules/common/README.md)
· 5 controllers · 4 services · 7 repositories · 7 entidades · 4 DTO

---

# Common module

Cross-cutting reference data shared by every clinical/business domain: official
**identifiers**, **contact points**, **addresses**, and the **file** subsystem
(versioning, derivatives, links, antimalware scanning, soft-delete and signed
download URLs). Owners are polymorphic (`owner_type_concept_id` + `owner_id`) and,
except for `files.tenant_id`, are **not** FK-enforced.

## Endpoints

| # | Method & path | Use case | Code | Auth |
|---|---|---|---|---|
| 1 | `POST /common/identifiers` | Register an identifier | 201 | JWT |
| 2 | `POST /common/contact-points` | Register a contact point | 201 | JWT |
| 3 | `POST /common/contact-points/:id/verify` | Verify a contact point | 200 | JWT |
| 4 | `POST /common/addresses` | Register an address | 201 | JWT |
| 5 | `POST /common/files` | Create file + version 1 | 201 | JWT |
| 6 | `POST /common/files/:id/versions` | Add a version | 201 | JWT |
| 7 | `POST /common/files/:id/versions/:vid/derivatives` | Generate a derivative | 201 | JWT |
| 8 | `POST /common/files/:id/links` | Link a file to an owner | 201 | JWT |
| 9 | `POST /internal/files/versions/:vid/scan-result` | Antivirus callback | 200 | JWT + `SECURITY_ADMIN` |
| 10 | `DELETE /common/files/:id` | Soft-delete a file | 200 | JWT |
| 11 | `POST /common/files/:id/download-url` | Issue a signed download URL | 201 | JWT |

## Entities (schema `common`)

`identifiers`, `contact_points`, `addresses`, `files`, `file_versions`,
`file_derivatives`, `file_links`.

## Business rules

- **Identifier uniqueness**: no two **ACTIVE** identifiers may share
  `(type, system, value)` → `409 ConflictException`.
- **Contact verification**: `verify` accepts any `code` in this implementation; a
  real OTP challenge/confirm flow (challenge store, expiry, attempt limits) is
  noted in `ContactPointsService`.
- **File lifecycle**: version 1 is created `SCAN_PENDING`; a new version is always
  promoted to `currentVersionId`.
- **Derivatives only from clean sources**: source version must be `SCAN_CLEAN`,
  else `422 PreconditionFailedException`.
- **Scan callback**: sets the version scan status; INFECTED logs a quarantine
  warning.
- **Legal hold**: a file with a future `legal_hold_until` cannot be soft-deleted
  → `422 PreconditionFailedException`.
- **Download URL**: requires a non-deleted file whose current version is
  `SCAN_CLEAN`; returns an HMAC-signed URL (`node:crypto`, 15-min expiry). A real
  S3 presign would replace the deterministic string.

## Concepts & defaults

Type/status fields are `*_concept_id` FKs resolved from `CONCEPTS` (see
`src/common/constants/concepts.ts`). `files.tenant_id` uses the seeded default
tenant `SEED.tenantId`. Addresses default to `COUNTRY_PE`, `ADDR_USE_HOME`,
`ADDR_TYPE_POSTAL`. File versions default to S3 storage, SHA-256 checksum and
encryption-at-rest.

## Permissions & logging

Everything requires a valid JWT (global `JwtAuthGuard`). The scan-result callback
additionally requires the `SECURITY_ADMIN` role (global `RolesGuard`). Services
emit structured Pino logs (`operation`, ids) for operation start, success,
business-rule rejections and quarantine events. No secrets, tokens or full PHI are
logged.

## Structure

```
common/
├── controllers/   5 controllers (+ unit specs) — thin HTTP layer
├── dto/           request/response DTOs + enums
├── entities/      MikroORM entities (schema `common`)
├── repositories/  7 stateless repositories (em passed in)
├── services/      4 services (+ unit specs) — business logic & transactions
└── common.module.ts
```

## Tests

Unit tests only (`*.spec.ts`, mocked `EntityManager` + repos/service), collected
by the root Jest config. Run:

```
NODE_OPTIONS=--experimental-vm-modules npx jest src/modules/common
```

