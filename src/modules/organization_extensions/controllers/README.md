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

## Lecturas de colección

`OrganizationExtensionsCollectionsController` (`organization-extensions-collections.controller.ts`) expone los `GET` de colección que pedía el catálogo de vistas: `GET /orgext/facility-licenses` (V22-02), `GET /orgext/hospitals` (V22-03), `GET /orgext/data-boundaries` (V22-05). Cada handler declara el mismo `@Roles(...)` que las escrituras del recurso; la página la acota al tenant del contexto el servicio.
