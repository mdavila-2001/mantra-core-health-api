<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/profiles/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `profiles`

**Fuente:** [`src/modules/profiles/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/profiles/README.md)
· 5 controllers · 11 services · 14 repositories · 19 entidades · 30 DTO

---

# Profiles Module (05)

Persons, patients and health workforce for the ALOVIDA Health API: person master
data, patient profiles, portal-account linking, practitioner onboarding
(generalist rule), jurisdiction licences, credential verification, specialties,
external identity linking (MPI), patient merge/reversal, related persons, portal
proxies and decease/anonymization.

Built on the shared foundation in `src/common`: `EntityManager` (MikroORM 7,
PostgreSQL) with service-owned transactions, module concepts in
`profiles.concepts.ts` (`PROF.*`) for every `*_concept_id` FK, domain exceptions
and Pino logging.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/profiles -name '*.controller.ts' | wc -l
  find src/modules/profiles -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/profiles -name '*.entity.ts' | wc -l
  find src/modules/profiles -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **5 controllers, 57 rutas HTTP, 19 entidades y 11 servicios** (incluye los ya documentados más abajo). La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso (propiedad, tenant, vínculo) puede vivir además en el servicio y no se refleja acá.

Importa (`profiles.module.ts`): `AuthzModule`, `CommonModule`, `TerminologyModule`, `DirectoryModule`, `MessagingModule`, `InsuranceModule`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `GET /profiles/practitioners/me/signature-assets` | sesión | `practitioner-signature-assets` |
| `PUT /profiles/practitioners/me/signature-assets` | sesión | `practitioner-signature-assets` |
| `POST /profiles/patients/me/dependent-requests` | sesión | `profiles-dependent-requests` |
| `GET /profiles/patients/me/dependent-candidates` | sesión | `profiles-dependent-requests` |
| `GET /profiles/patients/me/dependent-requests/incoming` | sesión | `profiles-dependent-requests` |
| `POST /profiles/patients/me/dependent-requests/:id/accept` | sesión | `profiles-dependent-requests` |
| `POST /profiles/patients/me/dependent-requests/:id/reject` | sesión | `profiles-dependent-requests` |
| `GET /profiles/patients/me/summary` | sesión | `profiles-patients` |
| `GET /profiles/patients/me` | sesión | `profiles-patients` |
| `PATCH /profiles/patients/me` | sesión | `profiles-patients` |
| `PUT /profiles/patients/me/photo` | sesión | `profiles-patients` |
| `DELETE /profiles/patients/me/photo` | sesión | `profiles-patients` |
| `GET /profiles/patients/me/dependents` | sesión | `profiles-patients` |
| `POST /profiles/patients/me/dependents` | sesión | `profiles-patients` |
| `GET /profiles/patients` | SECURITY_ADMIN, SUPERADMIN, CLINICIAN, PRACTITIONER | `profiles-patients` |
| `POST /profiles/patients/search` | SECURITY_ADMIN, SUPERADMIN, CLINICIAN, PRACTITIONER | `profiles-patients` |
| `GET /profiles/patients/merge-events` | SECURITY_ADMIN | `profiles-patients` |
| `GET /profiles/patients/:profileId` | SECURITY_ADMIN | `profiles-patients` |
| `POST /profiles/patients` | SECURITY_ADMIN | `profiles-patients` |
| `POST /profiles/persons/:personId/account-links` | SECURITY_ADMIN | `profiles-patients` |
| `POST /profiles/patients/:profileId/identity-links` | SECURITY_ADMIN | `profiles-patients` |
| `POST /profiles/patients/merge` | SECURITY_ADMIN | `profiles-patients` |
| `POST /profiles/patients/merge/:eventId/reverse` | SECURITY_ADMIN | `profiles-patients` |
| `POST /profiles/patients/:profileId/related-persons` | sesión | `profiles-patients` |
| `POST /profiles/patients/:profileId/portal-proxies` | SECURITY_ADMIN | `profiles-patients` |
| `POST /profiles/persons/:personId/decease` | SECURITY_ADMIN | `profiles-patients` |
| `GET /profiles/practitioners/me/summary` | sesión | `profiles-practitioners` |
| `GET /profiles/practitioners/me/onboarding` | sesión | `profiles-practitioners` |
| `GET /profiles/practitioners` | sesión | `profiles-practitioners` |
| `GET /profiles/practitioners/specialty-counts` | sesión | `profiles-practitioners` |
| `GET /profiles/practitioners/:profileId/summary` | sesión | `profiles-practitioners` |
| `PATCH /profiles/practitioners/me` | sesión | `profiles-practitioners` |
| `PUT /profiles/practitioners/:profileId/photo` | sesión | `profiles-practitioners` |
| `DELETE /profiles/practitioners/:profileId/photo` | sesión | `profiles-practitioners` |
| `POST /profiles/practitioners` | SECURITY_ADMIN | `profiles-practitioners` |
| `POST /profiles/practitioners/:profileId/jurisdiction-authorizations` | sesión | `profiles-practitioners` |
| `GET /profiles/practitioners/me/linkable-organizations` | sesión | `profiles-practitioners` |
| `GET /profiles/practitioners/me/affiliations` | sesión | `profiles-practitioners` |
| `POST /profiles/practitioners/me/affiliations` | sesión | `profiles-practitioners` |
| `PATCH /profiles/practitioners/me/affiliations/:affiliationId` | sesión | `profiles-practitioners` |
| `DELETE /profiles/practitioners/me/affiliations/:affiliationId` | sesión | `profiles-practitioners` |
| `POST /profiles/practitioners/me/credentials` | sesión | `profiles-practitioners` |
| `PATCH /profiles/practitioners/me/credentials/:credentialId` | sesión | `profiles-practitioners` |
| `DELETE /profiles/practitioners/me/credentials/:credentialId` | sesión | `profiles-practitioners` |
| `POST /profiles/practitioners/:profileId/affiliations` | SECURITY_ADMIN | `profiles-practitioners` |
| `POST /profiles/practitioners/:profileId/specialties` | sesión | `profiles-practitioners` |
| `PATCH /profiles/practitioners/me/specialties/:specialtyId/primary` | sesión | `profiles-practitioners` |
| `PATCH /profiles/practitioners/me/specialties/:specialtyId` | sesión | `profiles-practitioners` |
| `DELETE /profiles/practitioners/me/specialties/:specialtyId` | sesión | `profiles-practitioners` |
| `PATCH /profiles/practitioners/me/jurisdiction-authorizations/:licenseId` | sesión | `profiles-practitioners` |
| `DELETE /profiles/practitioners/me/jurisdiction-authorizations/:licenseId` | sesión | `profiles-practitioners` |
| `GET /profiles/credentials` | SECURITY_ADMIN | `profiles-practitioners` |
| `POST /profiles/credentials/:credentialId/verify` | SECURITY_ADMIN | `profiles-practitioners` |
| `GET /tenants/:tenantId/practitioner-requests` | sesión | `tenant-practitioner-requests` |
| `POST /tenants/:tenantId/practitioner-requests/:affiliationId/approve` | sesión | `tenant-practitioner-requests` |
| `POST /tenants/:tenantId/practitioner-requests/:affiliationId/reject` | sesión | `tenant-practitioner-requests` |
| `POST /tenants/:tenantId/practitioner-requests/:affiliationId/revoke` | sesión | `tenant-practitioner-requests` |

## Endpoints por caso de uso (subconjunto)

UC-05-xx más las adiciones P5/H4 documentadas. No es la lista completa: faltan, entre otras, las rutas `/profiles/practitioners/me/*` (perfil, especialidades y autorizaciones propias), los catálogos y `/tenants/:tenantId/practitioner-requests`; todas están en [Rutas HTTP](#rutas-http-y-alcance-medido).

| UC    | Method + path                                                         | Purpose                                                          | Auth              | Code |
| ----- | --------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------- | ---- |
| 05-01 | `POST /profiles/patients`                                             | Register person + patient profile                                | `SECURITY_ADMIN`  | 201  |
| 05-02 | `POST /profiles/persons/:personId/account-links`                      | Link portal account to a person                                  | `SECURITY_ADMIN`  | 201  |
| 05-03 | `POST /profiles/practitioners`                                        | Onboard health practitioner (+ licence + credential)             | `SECURITY_ADMIN`  | 201  |
| 05-04 | `POST /profiles/practitioners/:profileId/jurisdiction-authorizations` | Register/renew jurisdiction licence                              | `SECURITY_ADMIN`  | 201  |
| 05-05 | `POST /profiles/credentials/:credentialId/verify`                     | Verify/reject a professional credential                          | `SECURITY_ADMIN`  | 200  |
| 05-06 | `POST /profiles/practitioners/:profileId/specialties`                 | Add specialty with supporting credential                         | `SECURITY_ADMIN`  | 201  |
| 05-07 | `POST /profiles/patients/:profileId/identity-links`                   | Link external patient identity (MPI, upsert)                     | `SECURITY_ADMIN`  | 201  |
| 05-08 | `POST /profiles/patients/merge`                                       | Merge duplicate patients                                         | `SECURITY_ADMIN`  | 201  |
| 05-09 | `POST /profiles/patients/merge/:eventId/reverse`                      | Reverse a patient merge                                          | `SECURITY_ADMIN`  | 201  |
| 05-10 | `POST /profiles/patients/:profileId/related-persons`                  | Register related person / emergency contact                      | `SECURITY_ADMIN`  | 201  |
| 05-11 | `POST /profiles/patients/:profileId/portal-proxies`                   | Grant a portal proxy to a representative                         | `SECURITY_ADMIN`  | 201  |
| 05-12 | `POST /profiles/persons/:personId/decease`                            | Record decease and anonymization                                 | `SECURITY_ADMIN`  | 200  |
| P5 §3 | `PUT /profiles/practitioners/:profileId/photo`                        | Set the practitioner profile photo from an already uploaded file | owner or platform | 200  |
| P5 §3 | `DELETE /profiles/practitioners/:profileId/photo`                     | Clear the practitioner profile photo (the file is not deleted)   | owner or platform | 200  |
| H4 §C | `POST /profiles/patients/search`                                      | UC-05-13 search with the filters in the body (name/CI never in the URL) | clinical or admin | 200  |
| H4 §C | `POST /profiles/patients/me/dependent-requests`                       | Ask to represent someone who already has an account (by CI or by chosen profile) | own session       | 201  |
| H4 §C | `GET /profiles/patients/me/dependent-candidates`                      | Search accounts by name to choose whom to ask (≥3 letters, ≤8 rows, CI masked) | own session       | 200  |
| H4 §C | `GET /profiles/patients/me/dependent-requests/incoming`               | Requests waiting for this account's answer                       | own session       | 200  |
| H4 §C | `POST /profiles/patients/me/dependent-requests/:id/accept`            | Accept: the requester becomes the representative                 | own session       | 200  |
| H4 §C | `POST /profiles/patients/me/dependent-requests/:id/reject`            | Reject: no link is created                                       | own session       | 200  |

## Entities (schema `profiles`)

`persons`, `person_profiles` (1:1 subtype: `patient_profiles`,
`health_practitioner_profiles`), `person_account_links`,
`jurisdiction_authorizations`, `professional_credentials`,
`practitioner_specialties`, `practitioner_languages`, `patient_identity_links`,
`patient_merge_events` (append-only: `recorded_at` + `recorded_by`, no
`row_version`), `related_persons`, `patient_portal_proxies`.

El módulo mapea **19 entidades** (`find src/modules/profiles -name '*.entity.ts' | wc -l`); las 6 no listadas arriba son `administrator_profiles`, `emergency_staff_profiles`, `insurance_representative_profiles`, `provider_operator_profiles`, `secretary_profiles` (perfiles por rol) y `practitioner_affiliations`.

`person_profiles.id` is the shared PK of the patient/practitioner subtype
(`profile_id`). FKs are plain uuid columns, so writes flush parent-before-child.

## Key business rules

- **Profile photo** — `health_practitioner_profiles.photo_file_id` is written
  only through the photo endpoints. Two independent checks: the caller owns the
  profile (or is platform), and the file is one the caller uploaded, still
  alive, not flagged infected and of an image type recorded at upload time —
  the same rule the social wall applies to post media
  (`AttachableFileService`). Replacing the photo swaps the reference and leaves
  the previous file untouched: deleting it here would dangle any other use of
  the same file.

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
- **Dependent requests (Hito 4 §C)** — a request is a `patient_portal_proxies` row
  born `PROXY_PENDING`; accepting moves it to `PROXY_ACTIVE` (and writes the
  `related_persons` row, relationship "other", no guardianship), rejecting to
  `PROXY_REJECTED`. Every permission read filters by `PROXY_ACTIVE` and validity,
  so a pending or rejected row opens nothing. The person is pointed at by CI
  **or** by the `patientProfileId` that `dependent-candidates` returned — never
  both (400). Privacy: "no account" is a single 404 for an unknown CI, a CI with
  no account and a CI with no patient profile; the own CI/profile is 422; a
  request that is not yours is 404, same as a missing one; answering twice is
  409. The name search needs ≥3 letters, returns ≤8 accounts with the CI masked
  (`••••123`) and leaves out the caller and whoever already represents or was
  already asked. Both the request and the name search are rate limited.

## Concepts

Declared in `profiles.concepts.ts` via `defineModuleConcepts('profiles', {...})`,
exporting `PROFILES_CONCEPT_SEEDS` (for the central seed aggregator) and `PROF`
(id map used by services). No shared concept files are edited.

## Permissions

The governance operations require the `SECURITY_ADMIN` global role
(`RolesGuard`). The exceptions are the self-service `patients/me/*` routes, which
only need the session (the subject is resolved server-side and no parameter points
at another patient), and the patient search (`GET`/`POST patients/search`), open to
`SECURITY_ADMIN`, `SUPERADMIN`, `CLINICIAN` and `PRACTITIONER`.

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

`corepack yarn test src/modules/profiles --runInBand --silent` aprobó 29 suites y 535 pruebas durante la revisión (tres advertencias JSON preexistentes). La representación propia resuelve el sujeto desde la sesión; las rutas que aún emiten excepciones genéricas necesitan `reason` estable, según la [auditoría backend](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/profiles.md). El smoke intermodular está en `test/smoke/modules/profiles.smoke.ts` (`PROFILES_SMOKE`).
