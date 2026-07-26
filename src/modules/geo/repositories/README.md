# Repositorios — Geo

Acceso a datos de `geo.*`. Stateless: cada método recibe el `EntityManager`
activo como primer parámetro para que el servicio controle la transacción y los
repos sean triviales de mockear. Sin reglas de negocio; solo consultas y
`em.create(..., { partial: true })` (sin flush).

| Repositorio | Tabla | Notas |
|-------------|-------|-------|
| `TrackedSubjectsRepository` | `tracked_subjects` | `findActiveBySubject` sustenta la unicidad lógica del alta |
| `TrackingSessionsRepository` | `tracking_sessions` | `findOpenBySubject` / `findAllOpenBySubject` para la sesión OPEN |
| `LocationPingsRepository` | `location_pings` | Append-only (sin row_version); `findLastBySubject` (última posición) |
| `GeofencesRepository` | `geofences` | `findByTenantAndName` sustenta la unicidad del nombre |
| `GeofenceEventsRepository` | `geofence_events` | Append-only; `findLast` para idempotencia de transición |
| `TripsRepository` | `trips` | `findInProgressBySession` y `countBySessionAndStatus` (guards de estado) |
