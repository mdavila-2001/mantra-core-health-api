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
| 9 | `POST /internal/files/versions/:vid/scan-result` | Antivirus callback | 200 | JWT + `SYSTEM`/`SECURITY_ADMIN` |
| 9b | `GET /internal/files/versions/pending-scan` | Batch awaiting the scanner | 200 | JWT + `SYSTEM`/`SECURITY_ADMIN` |
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
  warning. It accepts `SYSTEM` as well as `SECURITY_ADMIN` — the worker signs as
  `SYSTEM`, and with only `SECURITY_ADMIN` the callback was unreachable for the
  one process that can emit it.
- **Who emits it**: `worker-files` (`src/worker/jobs/files/malware-scan.job.ts`).
  It reads the pending batch, fetches the bytes through the same storage adapter
  the API uses, streams them to ClamAV (`clamd`, INSTREAM) and posts the verdict.
  A failed scan, an unreachable engine or a file above the size ceiling leave the
  version **pending** — never `CLEAN`. Disabled by default
  (`MALWARE_SCAN_ENABLED`), see `malware-scan.env.ts`.
- **Legal hold**: a file with a future `legal_hold_until` cannot be soft-deleted
  → `422 PreconditionFailedException`.
- **Download URL**: requires a non-deleted file whose current version is
  `SCAN_CLEAN`; returns an HMAC-signed URL (`node:crypto`, 15-min expiry). A real
  S3 presign would replace the deterministic string.

## Cómo descarga cada contexto (BR-05)

`GET /common/files/:id/content` es **«lo tuyo o revisor»** (`canActorReadOwnFile`):
quien subió el archivo, `SECURITY_ADMIN` o `SUPERADMIN`. No se afloja. La lectura
clínica va por la ruta del contexto, que autoriza y recién entonces pide los bytes
con `FileUploadService.downloadForAuthorizedContext`:

| Contexto | Ruta | Autoriza |
| --- | --- | --- |
| Resultado del paciente | `GET /diagnostic-results/me/:reportId/files/:fileId/content` | Titular + versión liberada y visible + `fileId` del informe. Todo lo demás, 404 |
| Documento del expediente | `GET /charts/documents/:documentId/files/:fileId/content` | Lectura de la historia del paciente |
| Adjunto de mensaje | `community-messaging-read` | Participación activa |

**URL firmada (TX-09).** `POST /common/files/:id/download-url` sigue emitiendo
`?versionId&expires&signature`, y ahora `GET :id/content` **valida** la firma cuando
viene: HMAC inválido, 403; vencida, 410 `details.reason = URL_EXPIRED`. Sigue
exigiendo sesión (no hay enlaces sueltos y cada lectura queda con su actor), así
que la URL firmada **no** habilita al paciente a leer lo que no subió: para eso
está la ruta del contexto.

**Escaneo (TX-33).** La emisión de la URL firmada exige `SCAN_CLEAN`; si no, 422
con `details.reason = SCAN_PENDING` (o `SCAN_INFECTED`). La lectura por contexto
sirve versiones `SCAN_PENDING` y deja un aviso en el log. En Coolify el escaneo
está apagado de forma explícita (`MALWARE_SCAN_ENABLED=false`, sin `worker-files`
ni clamd): la UI debe decir «sin análisis antimalware». Encenderlo requiere
`clamav` + `worker-files` como en `docker-compose.yml`.

**Almacenamiento (TX-34).** El prefijo S3 por defecto es `uploads` (antes
`audio-assets`, del módulo de audio). Con el adaptador `local`, `api_storage` es un
volumen del contenedor: sobrevive al redespliegue pero **no tiene respaldo** hasta
que operaciones lo declare; el endpoint interno `http://minio:9000` nunca se entrega
al navegador.

## Concepts & defaults

Type/status fields are `*_concept_id` FKs resolved from `CONCEPTS` (see
`src/common/constants/concepts.ts`). `files.tenant_id` uses the seeded default
tenant `SEED.tenantId`. Addresses default to `COUNTRY_PE`, `ADDR_USE_HOME`,
`ADDR_TYPE_POSTAL`. File versions default to S3 storage, SHA-256 checksum and
encryption-at-rest.

## Permissions & logging

Everything requires a valid JWT (global `JwtAuthGuard`). The internal endpoints
additionally require `SYSTEM` or `SECURITY_ADMIN` (global `RolesGuard`). Services
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
