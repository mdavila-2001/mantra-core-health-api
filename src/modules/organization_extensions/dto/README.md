# DTOs — Organization Extensions

`class-validator` + `@nestjs/swagger`. Los ids de concepto de tipo son opcionales;
el servicio aplica un valor por defecto de `ORGEXT` cuando el cliente no lo envía.
Las respuestas exponen sólo campos seguros (ids, estado como concepto, fechas).

| DTO | Uso |
|-----|-----|
| `CreateHospitalDto` | `POST /orgext/hospitals` (UC-22-01) |
| `ActivateHospitalDto` | `POST /orgext/hospitals/{id}/activate` (UC-22-02) |
| `CreateServiceLineDto` | `POST /orgext/hospitals/{id}/service-lines` (UC-22-03) |
| `CreateFacilityLicenseDto` | `POST /orgext/facility-licenses` (UC-22-05) |
| `VerifyLicenseDto` | `POST /orgext/facility-licenses/{id}/verify` (UC-22-06) |
| `CreateAffiliationDto` | `POST /orgext/affiliations` (UC-22-07) |
| `CreateDataBoundaryDto` | `POST /orgext/data-boundaries` (UC-22-08) |
| `*ResponseDto`, `StatusResultDto` | Respuestas (`responses.dto.ts`) |
