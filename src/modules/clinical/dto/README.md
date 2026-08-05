# Clinical — DTOs

DTOs de entrada (validados con `class-validator` + `class-transformer`) y de
respuesta (documentados con `@nestjs/swagger`). Las respuestas exponen solo campos
seguros y devuelven los `*_concept_id` como estado opaco (uuid).

Los valores numéricos (decimales, cantidades, dosis) se reciben como `number` y el
servicio los convierte a `string` para las columnas `numeric`. Las fechas se
reciben como ISO string (`@IsDateString`) y se convierten a `Date`.

| Archivo | DTOs |
|---------|------|
| `care-episode.dto.ts` | `CreateCareEpisodeDto`, `CareEpisodeResponseDto` |
| `encounter.dto.ts` | `CheckInEncounterDto` (+ `EncounterParticipantInput`, `EncounterLocationInput`), `CloseEncounterDto`, `EncounterResponseDto` |
| `observation.dto.ts` | `CreateObservationDto` (+ `ObservationComponentInput`, `ObservationPerformerInput`, `ObservationReferenceRangeInput`), `AmendObservationDto`, `ObservationResponseDto` |
| `service-request.dto.ts` | `CreateServiceRequestDto`, `ServiceRequestResponseDto` |
| `diagnostic-report.dto.ts` | `CreateDiagnosticReportDto`, `ReleaseDiagnosticReportDto`, `DiagnosticReportResponseDto` |
| `condition.dto.ts` | `CreateConditionDto`, `ConditionResponseDto` |
| `allergy.dto.ts` | `CreateAllergyIntoleranceDto` (+ `AllergyReactionInput`), `AllergyIntoleranceResponseDto` |
| `medication.dto.ts` | `CreateMedicationRequestDto`, `CreateMedicationRecordDto`, `MedicationRequestResponseDto`, `MedicationRecordResponseDto` |
| `procedure.dto.ts` | `CreateProcedureDto`, `ProcedureResponseDto` |
| `immunization.dto.ts` | `CreateImmunizationDto`, `ImmunizationResponseDto` |

Referencias cross-módulo (paciente, tenant, profesional, sede, encuentro) se
reciben como uuid del cliente; no se resuelven aquí.
