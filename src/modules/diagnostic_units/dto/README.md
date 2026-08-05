# DTOs — diagnostic_units

Contratos de entrada/salida de los endpoints del módulo 23, con `class-validator`
+ `class-transformer` + `@nestjs/swagger`. Las respuestas exponen solo campos
seguros (nunca importes internos, reglas de aseguradora ni seriales al público).

| DTO | Endpoint / UC |
|---|---|
| `CreateDiagnosticUnitDto` (+ `CreateUnitSiteDto`, `CreateUnitAccreditationDto`) | POST /diagnostic-units — UC-23-01 |
| `AddSiteDto` / `UpdateSiteDto` | POST /{id}/sites, PATCH /diagnostic-unit-sites/{siteId} — UC-23-02 |
| `SetSpecialtiesDto` (+ `SpecialtyItemDto`) | PUT /{id}/specialties — UC-23-04 |
| `CreateStudyOfferingDto` (+ `StudyComponentDto`) | POST /{id}/study-offerings — UC-23-05 |
| `CreatePriceScheduleDto` | POST /{id}/price-schedules — UC-23-06 |
| `CreateStudyPriceDto` | POST /price-schedules/{scheduleId}/study-prices — UC-23-07 |
| `CreateEquipmentDto` / `UpdateEquipmentDto` | POST /diagnostic-unit-sites/{siteId}/equipment, PATCH /diagnostic-equipment/{id} — UC-23-09 |
| `CreateAccreditationDto` / `RenewAccreditationDto` | POST /{id}/accreditations, POST /diagnostic-unit-accreditations/{id}/renew — UC-23-11 |
| `CreatePractitionerAssignmentDto` | POST /{id}/practitioner-assignments — UC-23-10 |
| `responses.dto.ts` | DTOs de respuesta (unit, site, offering, schedule, price, equipment, accreditation, assignment, specialties, reproject, status) |

Los ids `*ConceptId` opcionales toman por defecto un concepto sembrado por el
módulo (`DUNIT.*`) cuando el cliente no los envía; ver `diagnostic_units.concepts.ts`.
