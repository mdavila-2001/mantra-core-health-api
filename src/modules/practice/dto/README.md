# Practice · dto

DTOs de entrada/salida con `class-validator` + `@nestjs/swagger`. Los campos de
concepto (`*ConceptId`) son **opcionales**: cuando el cliente no los envía, el
servicio aplica un concepto por defecto sembrado por el módulo
(`practice.concepts.ts`), de modo que toda columna `*_concept_id` NOT NULL queda
poblada. Los estados de ciclo de vida los fija siempre el servidor (nunca el
cliente). Fechas viajan como ISO string y el servicio las convierte a `Date`;
los `numeric` de BD viajan como string (`revenueSharePercent`, `reorderLevel`) o
como número positivo (`quantity`) y se serializan a string al persistir.

| DTO | UC | Endpoint |
|---|---|---|
| `CreatePracticeDto` | bootstrap | `POST /practices` |
| `CreateSiteDto` | UC-14-01 | `POST /practices/:id/sites` |
| `CreateAccreditationDto` | UC-14-02 | `POST /practices/:id/accreditations` |
| `VerifyAccreditationDto` | UC-14-03 | `POST /accreditations/:id/verify` |
| `CreateClinicalUnitDto` | UC-14-04 | `POST /sites/:id/clinical-units` |
| `CreateCareSpaceDto` | UC-14-05 | `POST /sites/:id/care-spaces` |
| `CreateHealthcareServiceDto` | UC-14-06 | `POST /practices/:id/healthcare-services` |
| `UpsertSettingDto` | UC-14-07 | `PUT /practices/:id/settings/:key` |
| `CreateRoleAssignmentDto` | UC-14-08 | `POST /practices/:id/role-assignments` |
| `CreateSupportAssignmentDto` | UC-14-09 | `POST /role-assignments/:id/support-assignments` |
| `CreateInventoryItemDto` | UC-14-10 | `POST /practices/:id/inventory-items` |
| `CreateMovementDto` | UC-14-11 | `POST /inventory-items/:id/movements` |

`responses.dto.ts` reúne las respuestas (exponen solo campos seguros) y
`StatusResultDto` para operaciones de estado (verify UC-14-03, decommission
UC-14-12).
