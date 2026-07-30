# Servicios — Geo

Poseen la unidad de trabajo: escrituras en `em.transactional`, lecturas en
`em.fork()`. Hacen `flush` del padre antes de crear hijos (FK planas uuid),
validan precondiciones y lanzan excepciones de dominio
(`ResourceNotFoundException` 404, `ConflictException` 409,
`PreconditionFailedException` 422).

| Servicio | Casos de uso |
|----------|--------------|
| `GeoTrackedSubjectsService` | UC-13-01 (enroll), UC-13-03 (ingestPings), UC-13-09 (lastPosition), UC-13-10 (revokeConsent) |
| `GeoTrackingSessionsService` | UC-13-02 (start), UC-13-08 (close) |
| `GeoGeofencesService` | UC-13-04 (define), UC-13-05 (recordEvent) |
| `GeoTripsService` | UC-13-06 (start), UC-13-07 (close) |

`revokeConsent` cierra en cascada las sesiones OPEN del sujeto (embebe UC-13-08).
`close` de sesión rechaza el cierre si hay viajes IN_PROGRESS. `recordEvent` es
idempotente contra el último evento del par (geofence, sujeto).

Tests unitarios en `*.service.spec.ts`: happy path (delegación + flush + valor de
retorno), not-found, conflict y al menos una precondición por método. Mockean
repos y `EntityManager` (sin BD real).
