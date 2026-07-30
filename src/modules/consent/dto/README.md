# DTOs — Consent

Contratos de entrada/salida validados con `class-validator` + `class-transformer`
y documentados con `@nestjs/swagger`. Los estados/tipos que el cliente no controla
se resuelven en el servicio a `*_concept_id` (ver `consent.concepts.ts`); el DTO
solo expone abstracciones legibles (p. ej. `action: 'PERMIT' | 'DENY'`).

## Entrada

| DTO | Endpoint |
|-----|----------|
| `CreateConsentDto` (+ `ConsentProvisionInputDto`) | UC-07-01 |
| `WithdrawConsentDto` | UC-07-02 |
| `CreatePatientObjectionDto` | UC-07-03 |
| `CreateHipaaAuthorizationDto` | UC-07-04 |
| `CreateProcessingLegalBasisDto` | UC-07-06 |
| `CreatePrivacyRestrictionDto` | UC-07-07 |
| `CreateTreatmentInformedConsentDto` | UC-07-08 |
| `AmendProvisionsDto` | UC-07-09 |
| `CreateConsentEvidenceDto` | UC-07-10 |
| `ResolvePatientObjectionDto` | UC-07-12 |

## Salida

`ConsentResponseDto`, `HipaaAuthorizationResponseDto`,
`PatientObjectionResponseDto`, `PrivacyRestrictionResponseDto`,
`ProcessingLegalBasisResponseDto`, `TreatmentInformedConsentResponseDto`,
`ConsentEvidenceResponseDto`, `StatusResultDto`, `ExpirationSweepResultDto`.

Las respuestas exponen solo campos seguros (ids y estados); nunca hashes de
credenciales ni PHI en claro más allá de lo aportado por el cliente.
