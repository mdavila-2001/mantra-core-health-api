# Profiles — Repositories

Stateless data access for the `profiles` schema. Every method takes the active
`EntityManager` as its first parameter, so the service owns the transaction and
the order of `flush` (FKs are plain uuid columns; MikroORM does not order inserts
between unrelated entities). `em.create(...)` uses `{ partial: true }` and audit
fields come from `createdBy(actorUserId)`; `rowVersion` is never set. No business
logic lives here.

| Repository                             | Table                          | Notable methods                                                                          |
| -------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------- |
| `PersonsRepository`                    | `persons`                      | `findById`, `create`                                                                     |
| `PersonProfilesRepository`             | `person_profiles`              | `findById`, `findByPersonAndType`, `create`                                              |
| `PatientProfilesRepository`            | `patient_profiles`             | `findById`, `findByPatientCode`, `create`                                                |
| `PersonAccountLinksRepository`         | `person_account_links`         | `create`, `supersedeActiveForUser`, `revokeActiveForPerson`                              |
| `HealthPractitionerProfilesRepository` | `health_practitioner_profiles` | `findById`, `findByCode`, `create`                                                       |
| `JurisdictionAuthorizationsRepository` | `jurisdiction_authorizations`  | `create`                                                                                 |
| `ProfessionalCredentialsRepository`    | `professional_credentials`     | `findById`, `create`, `countInStateExcept`                                               |
| `PractitionerSpecialtiesRepository`    | `practitioner_specialties`     | `create`, `findActive`, `demotePrimary`                                                  |
| `PractitionerLanguagesRepository`      | `practitioner_languages`       | `create`                                                                                 |
| `PatientIdentityLinksRepository`       | `patient_identity_links`       | `findBySource`, `create`, `reassignPatientProfile`                                       |
| `PatientMergeEventsRepository`         | `patient_merge_events`         | `findById`, `findByReversalOf`, `create` (append-only)                                   |
| `RelatedPersonsRepository`             | `related_persons`              | `findById`, `create`, `findActiveGuardian`, `reassignPatientProfile`                     |
| `PatientPortalProxiesRepository`       | `patient_portal_proxies`       | `create`, `revokeActiveForProxyUser`, `revokeActiveForPatient`, `reassignPatientProfile` |

Bulk state transitions (supersede/revoke/reassign/demote) use `nativeUpdate` to
avoid materializing rows. `patient_merge_events` is immutable: it has no
`row_version`/`updated_at`, only `recorded_at` + `recorded_by`.
