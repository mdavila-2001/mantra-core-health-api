# Profiles — DTOs

Request/response contracts. Requests use `class-validator` + `class-transformer`
(the global `ValidationPipe` runs `whitelist` + `forbidNonWhitelisted` +
`transform`, so every accepted field must be declared) plus `@nestjs/swagger`.
Concept ids provided by the client are validated as UUIDs; when a sensible module
default exists (`PROF.*`) the field is optional. Response DTOs expose only safe
fields.

| DTO                                                                           | Used by  | Notes                                                                     |
| ----------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| `CreatePatientDto` / `PatientProfileResponseDto`                              | UC-05-01 | `patientCode` unique; person data optional.                               |
| `LinkAccountDto` / `AccountLinkResponseDto`                                   | UC-05-02 | `userId` (IAM) + optional link type.                                      |
| `CreatePractitionerDto` / `PractitionerResponseDto`                           | UC-05-03 | Flattened: practitioner + first licence + support credential + language.  |
| `CreateJurisdictionAuthorizationDto` / `JurisdictionAuthorizationResponseDto` | UC-05-04 | Licence number + optional jurisdiction/scope/validity.                    |
| `VerifyCredentialDto` / `CredentialResponseDto`                               | UC-05-05 | `decision = VERIFIED \| REJECTED`; response flags `practitionerVerified`. |
| `AddSpecialtyDto` / `SpecialtyResponseDto`                                    | UC-05-06 | Optional supporting credential + `isPrimary`.                             |
| `AddIdentityLinkDto` / `IdentityLinkResponseDto`                              | UC-05-07 | Source keys + `confidenceScore` (0..1); `created` flags upsert.           |
| `MergePatientsDto` / `MergeEventResponseDto`                                  | UC-05-08 | Surviving + merged profile ids.                                           |
| `ReverseMergeDto` / `MergeEventResponseDto`                                   | UC-05-09 | Optional reversal reason.                                                 |
| `AddRelatedPersonDto` / `RelatedPersonResponseDto`                            | UC-05-10 | Reuse `personId` or create from `displayName`; guardian/emergency flags.  |
| `GrantPortalProxyDto` / `PortalProxyResponseDto`                              | UC-05-11 | Proxy user + scope value set + legal basis.                               |
| `DeceasePersonDto` / `DeceaseResponseDto`                                     | UC-05-12 | Optional `deceasedAt` + `anonymize`.                                      |
