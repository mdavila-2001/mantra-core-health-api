# Controladores — Organization Extensions

Capa fina: `@ApiTags` + `@ApiBearerAuth`, `@HttpCode` correcto, validación de
parámetros con `ParseUUIDPipe`, actor con `@CurrentUser()`, `@Roles('SECURITY_ADMIN')`.
Delegan en el servicio de dominio y devuelven un DTO de respuesta.

| Controlador | Ruta base | UCs |
|-------------|-----------|-----|
| `OrgextHospitalsController` | `/orgext/hospitals` | 01, 02, 03, 04 |
| `OrgextFacilityLicensesController` | `/orgext/facility-licenses` | 05, 06 |
| `OrgextAffiliationsController` | `/orgext/affiliations` | 07, 09 |
| `OrgextDataBoundariesController` | `/orgext/data-boundaries` | 08 |

Tests unitarios en `*.controller.spec.ts` (mockean los servicios).
