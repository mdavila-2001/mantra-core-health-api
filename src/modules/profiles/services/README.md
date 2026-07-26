# Profiles — Services

Business logic and transaction owners. Each service injects `EntityManager`
(`@mikro-orm/postgresql`) and its repositories, wraps writes in
`em.transactional(async (tx) => {...})`, and flushes the parent before creating
children (FKs are plain uuid columns). Preconditions raise domain exceptions
(`ResourceNotFoundException` → 404, `ConflictException` → 409,
`PreconditionFailedException` → 422). Concept ids come from `PROF.*`.

## `ProfilesPatientsService`

| Method | UC | Behaviour |
| --- | --- | --- |
| `registerPatient` | 05-01 | Person → person_profile (patient) → patient_profile (unlinked); rejects duplicate `patientCode`. |
| `linkAccount` | 05-02 | Person must be active; supersede prior active link of the same user; create verified/active link. |
| `addIdentityLink` | 05-07 | Upsert by source keys; mark patient `linked`. |
| `mergePatients` | 05-08 | Immutable event; loser patient/person → merged; reassign identity links, related persons, proxies. |
| `reverseMerge` | 05-09 | Only an approved event, only once; restore loser patient/person status. |
| `addRelatedPerson` | 05-10 | One active legal guardian per patient; reuse or create the related person. |
| `grantPortalProxy` | 05-11 | Validate related person ownership; revoke prior active proxy of the same user; create active proxy. |
| `decease` | 05-12 | Set deceased/inactive; revoke active account links and proxies; optional anonymization. |

## `ProfilesPractitionersService`

| Method | UC | Behaviour |
| --- | --- | --- |
| `onboardPractitioner` | 05-03 | Reuse or create person; practitioner (`pending`/`onboarding`) + first licence + support credential + language. |
| `addJurisdictionAuthorization` | 05-04 | Add an active licence to an existing practitioner. |
| `verifyCredential` | 05-05 | Verify/reject a pending credential; activate the practitioner when none remain pending. |
| `addSpecialty` | 05-06 | Require a verified supporting credential; reject duplicate active specialty; demote previous primary. |

## Tests

`*.spec.ts` mock `EntityManager` (`transactional: (cb) => cb(txMock)`) and the
repositories. They cover happy paths, not-found, conflicts and business-rule
rejections without touching a real database.
