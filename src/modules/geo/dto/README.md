# DTOs — Geo

`class-validator` + `class-transformer` + `@nestjs/swagger`. Los DTOs de respuesta
exponen solo campos seguros (concept ids y marcas temporales; nunca ubicación cruda
más allá de lo pedido).

| DTO | Uso |
|-----|-----|
| `CreateTrackedSubjectDto` / `TrackedSubjectResponseDto` | UC-13-01 |
| `StartTrackingSessionDto` / `TrackingSessionResponseDto` | UC-13-02 / UC-13-08 |
| `LocationPingDto` + `IngestPingsDto` / `IngestPingsResultDto` | UC-13-03 (batch 1..1000) |
| `CreateGeofenceDto` / `GeofenceResponseDto` | UC-13-04 (circle/polygon) |
| `RecordGeofenceEventDto` / `GeofenceEventResponseDto` | UC-13-05 |
| `StartTripDto` / `TripResponseDto` | UC-13-06 |
| `CloseTripDto` / `TripResponseDto` | UC-13-07 |
| `LastPositionResponseDto` | UC-13-09 |
| `StatusResultDto` | UC-13-10 (`{ ok: true }`) |

Notas:
- `latitude`/`longitude` se validan con `@IsLatitude`/`@IsLongitude` (grados
  decimales) y se persisten como `numeric`.
- La coherencia forma/geometría del geofence (circle ⇒ radio+centro; polygon ⇒
  geometry_json) se valida en el servicio (422), no en el DTO, por ser condicional.
- Los códigos de enum (`PERSON`/`VEHICLE`, `CIRCLE`/`POLYGON`, `ENTER`/`EXIT`,
  `CELLULAR`/`WIFI`) se mapean a concept ids en `geo.concepts.ts`.
