# Controladores — Diagnostics

Capa fina: `@ApiTags`/`@ApiBearerAuth`/`@ApiOperation`, `@HttpCode` correcto,
`@Param(..., ParseUUIDPipe)`, `@CurrentUser()` y delegación al servicio. Auth por
guard JWT global (401 sin token).

| Controlador | Rutas |
|-------------|-------|
| `DiagnosticsSpecimensController` | /diagnostics/specimens, /accessions, /specimens/{id}/rejection, /specimens/{id}/containers, /containers/{id}/custody-events |
| `DiagnosticsLabController` | /diagnostics/work-orders, /analyzer-runs(/{id}/messages), /results/{observationId}/verifications |
| `DiagnosticsReportsController` | /diagnostics/reports/{reportId}/versions(/{versionId}/release), /critical-results(/{id}/acknowledge) |
| `DiagnosticsImagingController` | /diagnostics/imaging-endpoints, /dicomweb/studies, /diagnostics/imaging-studies/{id}/dose-events, /diagnostics/clinical-media, /diagnostics/data-quality-events |

Tests unitarios `*.controller.spec.ts` verifican la delegación (servicio mockeado).

## Lecturas de colección

`DiagnosticsCollectionsController` (`diagnostics-collections.controller.ts`) expone los `GET` de colección que pedía el catálogo de vistas: `GET /diagnostics/imaging-endpoints` (V20-09). Cada handler declara el mismo `@Roles(...)` que las escrituras del recurso; la página la acota al tenant del contexto el servicio.
