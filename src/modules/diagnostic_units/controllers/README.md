# Controladores — diagnostic_units

Capa HTTP fina del módulo 23. Validan parámetros (`ParseUUIDPipe`), aplican
autorización (`@Roles('SECURITY_ADMIN')`) y delegan en el servicio de dominio.
Todos requieren bearer token (guard global; `@ApiBearerAuth`).

| Controlador | Rutas | UC |
|---|---|---|
| `DiagnosticUnitsController` | `POST /diagnostic-units`, `/{id}/sites`, `/{id}/verify-and-publish`, `PUT /{id}/specialties`, `POST /{id}/study-offerings`, `/{id}/price-schedules`, `/{id}/practitioner-assignments`, `/{id}/accreditations`, `/{id}/reproject` | 01,02,03,04,05,06,10,11,12 |
| `DiagnosticUnitSitesController` | `PATCH /diagnostic-unit-sites/{siteId}`, `POST /{siteId}/equipment` | 02, 09 |
| `DiagnosticPricingController` | `POST /price-schedules/{scheduleId}/study-prices`, `/study-prices/{priceId}/close`, `DELETE /diagnostic-study-offerings/{id}` | 07, 08 |
| `DiagnosticEquipmentController` | `PATCH /diagnostic-equipment/{id}` | 09 |
| `DiagnosticUnitAccreditationsController` | `POST /diagnostic-unit-accreditations/{id}/renew` | 11 |

Los `*.spec.ts` son pruebas unitarias que mockean el servicio y verifican la
delegación con los argumentos correctos.
