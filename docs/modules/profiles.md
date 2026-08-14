<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/profiles/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `profiles`

**Fuente:** [`src/modules/profiles/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/profiles/README.md)
· 2 controllers · 3 services · 14 repositories · 19 entidades · 15 DTO

---

# Profiles Module (05)

Persons, patients and health workforce for the REDESA Health API: person master
data, patient profiles, portal-account linking, practitioner onboarding
(generalist rule), jurisdiction licences, credential verification, specialties,
external identity linking (MPI), patient merge/reversal, related persons, portal
proxies and decease/anonymization.

Built on the shared foundation in `src/common`: `EntityManager` (MikroORM 7,
PostgreSQL) with service-owned transactions, module concepts in
`profiles.concepts.ts` (`PROF.*`) for every `*_concept_id` FK, domain exceptions
and Pino logging.

## Endpoints

| UC | Method + path | Purpose | Auth | Code |
| --- | --- | --- | --- | --- |
| 05-01 | `POST /profiles/patients` | Register person + patient profile | `SECURITY_ADMIN` | 201 |
| 05-02 | `POST /profiles/persons/:personId/account-links` | Link portal account to a person | `SECURITY_ADMIN` | 201 |
| 05-03 | `POST /profiles/practitioners` | Onboard health practitioner (+ licence + credential) | `SECURITY_ADMIN` | 201 |
| 05-04 | `POST /profiles/practitioners/:profileId/jurisdiction-authorizations` | Register/renew jurisdiction licence | `SECURITY_ADMIN` | 201 |
| 05-05 | `POST /profiles/credentials/:credentialId/verify` | Verify/reject a professional credential | `SECURITY_ADMIN` | 200 |
| 05-06 | `POST /profiles/practitioners/:profileId/specialties` | Add specialty with supporting credential | `SECURITY_ADMIN` | 201 |
| 05-07 | `POST /profiles/patients/:profileId/identity-links` | Link external patient identity (MPI, upsert) | `SECURITY_ADMIN` | 201 |
| 05-08 | `POST /profiles/patients/merge` | Merge duplicate patients | `SECURITY_ADMIN` | 201 |
| 05-09 | `POST /profiles/patients/merge/:eventId/reverse` | Reverse a patient merge | `SECURITY_ADMIN` | 201 |
| 05-10 | `POST /profiles/patients/:profileId/related-persons` | Register related person / emergency contact | `SECURITY_ADMIN` | 201 |
| 05-11 | `POST /profiles/patients/:profileId/portal-proxies` | Grant a portal proxy to a representative | `SECURITY_ADMIN` | 201 |
| 05-12 | `POST /profiles/persons/:personId/decease` | Record decease and anonymization | `SECURITY_ADMIN` | 200 |

## Entities (schema `profiles`)

`persons`, `person_profiles` (1:1 subtype: `patient_profiles`,
`health_practitioner_profiles`), `person_account_links`,
`jurisdiction_authorizations`, `professional_credentials`,
`practitioner_specialties`, `practitioner_languages`, `patient_identity_links`,
`patient_merge_events` (append-only: `recorded_at` + `recorded_by`, no
`row_version`), `related_persons`, `patient_portal_proxies`.

`person_profiles.id` is the shared PK of the patient/practitioner subtype
(`profile_id`). FKs are plain uuid columns, so writes flush parent-before-child.

## Key business rules

- **Patient / practitioner uniqueness** — reject duplicate `patient_code` /
  `practitioner_code` (409).
- **Generalist rule (UC-05-03)** — no nurse/doctor subtypes; every clinician is a
  `health_practitioner_profile` created `verification=pending`,
  `practice=onboarding`, `accepts_new_patients=false`.
- **Account link (UC-05-02)** — supersede the previous active link of the same
  user before inserting (one active link per user).
- **Credential verification (UC-05-05)** — only a `pending` credential can be
  verified/rejected (422 otherwise); when no credential remains pending the
  practitioner becomes `verified` / `active` and may accept patients.
- **Specialty (UC-05-06)** — supporting credential must belong to the practitioner
  and be verified (422); reject a duplicate active specialty (409); demote the
  previous primary when a new primary is added.
- **Identity link (UC-05-07)** — upsert by `(source_tenant, source_system,
  source_identifier)`; marks the patient `linked`.
- **Merge (UC-05-08)** — immutable event; loser patient → `merged`, loser person →
  `merged` pointing at the survivor person; identity links, related persons and
  proxies are reassigned to the survivor. Cannot merge with itself (422) or
  re-merge an already merged patient (409).
- **Reverse merge (UC-05-09)** — only an `approved` event can be reversed (422),
  and only once (409); restores loser patient/person status.
- **Related person (UC-05-10)** — a single active legal guardian per patient (409).
- **Decease (UC-05-12)** — set `deceased`/`inactive`, revoke active account links
  and portal proxies; optional PII anonymization. Reject a second decease (409).

## Concepts

Declared in `profiles.concepts.ts` via `defineModuleConcepts('profiles', {...})`,
exporting `PROFILES_CONCEPT_SEEDS` (for the central seed aggregator) and `PROF`
(id map used by services). No shared concept files are edited.

## Permissions

All operations require the `SECURITY_ADMIN` global role (`RolesGuard`).

## Logging

Pino structured logs (`operation`, ids, reason) for start/success/rejection of
each operation. PHI (names, identifiers) is not logged.

## Layout

- `entities/` — MikroORM entities (pre-existing).
- `repositories/` — stateless data access (take the active `em`).
- `dto/` — request/response contracts (`class-validator` + Swagger).
- `services/` — business logic, transaction owners.
- `controllers/` — thin HTTP layer.

## Tests

Unit tests (`*.spec.ts`) mock `EntityManager` and repositories:
`NODE_OPTIONS=--experimental-vm-modules npx jest src/modules/profiles`. Each
service covers happy path, not-found, conflict and business-rule rejections;
controllers verify delegation. Cross-module integration is exercised by
`test/smoke/modules/profiles.smoke.ts` (`PROFILES_SMOKE`).

