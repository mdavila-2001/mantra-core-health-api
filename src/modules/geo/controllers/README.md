# Controladores — Geo

Capa fina: `@ApiTags` + `@ApiBearerAuth()`, `@HttpCode` correcto, validan `@Param`
con `ParseUUIDPipe`, toman el actor con `@CurrentUser()` y delegan en el servicio.
Todos los endpoints exigen `@Roles('SECURITY_ADMIN')`.

| Controlador | Base path | Endpoints |
|-------------|-----------|-----------|
| `GeoTrackedSubjectsController` | `/geo/tracked-subjects` | POST `/` (13-01), POST `/:id/pings` (13-03), GET `/:id/last-position` (13-09), POST `/:id/revoke-consent` (13-10) |
| `GeoTrackingSessionsController` | `/geo/tracking-sessions` | POST `/` (13-02), POST `/:id/close` (13-08) |
| `GeoGeofencesController` | `/geo` | POST `/geofences` (13-04), POST `/geofence-events` (13-05) |
| `GeoTripsController` | `/geo/trips` | POST `/` (13-06), POST `/:id/close` (13-07) |

Tests en `*.controller.spec.ts`: verifican la delegación al servicio con los
argumentos correctos y el valor devuelto (servicio mockeado).
