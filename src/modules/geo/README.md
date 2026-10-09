# Módulo Geo (13) — Geolocation and Mobile Tracking

Geolocalización y rastreo móvil: sujetos rastreados, sesiones de tracking, pings
de ubicación de alta frecuencia, geofences con sus eventos de cruce, y viajes.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/geo -name '*.controller.ts' | wc -l
  find src/modules/geo -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/geo -name '*.entity.ts' | wc -l
  find src/modules/geo -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **4 controllers, 10 rutas HTTP, 6 entidades y 4 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

Entidades (`tableName`, 6 de 6 archivos `*.entity.ts`): `geofence_events`, `geofences`, `location_pings`, `tracked_subjects`, `tracking_sessions`, `trips`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /geo/geofences` | SECURITY_ADMIN | `geo-geofences` |
| `POST /geo/geofence-events` | SECURITY_ADMIN | `geo-geofences` |
| `POST /geo/tracked-subjects` | SECURITY_ADMIN | `geo-tracked-subjects` |
| `POST /geo/tracked-subjects/:id/pings` | SECURITY_ADMIN | `geo-tracked-subjects` |
| `GET /geo/tracked-subjects/:id/last-position` | SECURITY_ADMIN | `geo-tracked-subjects` |
| `POST /geo/tracked-subjects/:id/revoke-consent` | SECURITY_ADMIN | `geo-tracked-subjects` |
| `POST /geo/tracking-sessions` | SECURITY_ADMIN | `geo-tracking-sessions` |
| `POST /geo/tracking-sessions/:id/close` | SECURITY_ADMIN | `geo-tracking-sessions` |
| `POST /geo/trips` | SECURITY_ADMIN | `geo-trips` |
| `POST /geo/trips/:id/close` | SECURITY_ADMIN | `geo-trips` |

## Endpoints (UC-13-01 .. UC-13-10)

| UC | Método y ruta | Resumen | Rol |
|----|---------------|---------|-----|
| 13-01 | `POST /geo/tracked-subjects` | Alta de sujeto rastreado (state=ACTIVE) | SECURITY_ADMIN |
| 13-02 | `POST /geo/tracking-sessions` | Iniciar sesión de tracking (status=OPEN) | SECURITY_ADMIN |
| 13-03 | `POST /geo/tracked-subjects/{id}/pings` | Ingerir batch de pings de alta frecuencia | SECURITY_ADMIN |
| 13-04 | `POST /geo/geofences` | Definir/activar geofence (circle o polygon) | SECURITY_ADMIN |
| 13-05 | `POST /geo/geofence-events` | Registrar cruce ENTER/EXIT (worker) | SECURITY_ADMIN |
| 13-06 | `POST /geo/trips` | Iniciar viaje (status=IN_PROGRESS) | SECURITY_ADMIN |
| 13-07 | `POST /geo/trips/{id}/close` | Cerrar viaje con distancia/duración | SECURITY_ADMIN |
| 13-08 | `POST /geo/tracking-sessions/{id}/close` | Cerrar sesión de tracking | SECURITY_ADMIN |
| 13-09 | `GET /geo/tracked-subjects/{id}/last-position` | Última posición conocida | SECURITY_ADMIN |
| 13-10 | `POST /geo/tracked-subjects/{id}/revoke-consent` | Revocar consentimiento y pausar rastreo | SECURITY_ADMIN |

## Entidades (`entities/`)

- `tracked_subjects` — sujeto polimórfico (subject_type + subject_id) rastreable.
- `tracking_sessions` — sesión de seguimiento de un sujeto (OPEN/CLOSED).
- `location_pings` — pings append-only (`<<LOG>>`, sin row_version).
- `geofences` — zonas (circle: radius+centro; polygon: geometry_json GeoJSON).
- `geofence_events` — cruces append-only (ENTER/EXIT).
- `trips` — viajes de una sesión (IN_PROGRESS/COMPLETED).

## Reglas de negocio

- **Alta única**: no se permite un segundo sujeto ACTIVE con el mismo
  `(tenant, subject_type, subject_id)` → 409.
- **Sesión única OPEN** por sujeto → 409; solo sobre sujetos ACTIVE.
- **Ingesta** rechazada si el sujeto no está ACTIVE (tras revocación) o no tiene
  sesión OPEN → 422.
- **Geofence**: coherencia forma/geometría (circle ⇒ radio+centro; polygon ⇒
  geometry_json) → 422; nombre único por tenant → 409.
- **Evento de geofence** idempotente: rechaza transición del mismo tipo
  consecutiva (ya dentro/fuera) → 409.
- **Viaje**: uno IN_PROGRESS por sesión → 409; solo sobre sesiones OPEN.
- **Cierre de sesión** rechazado si hay viajes IN_PROGRESS → 422.
- **Revocación de consentimiento**: suspende el sujeto (ACTIVE→SUSPENDED) y cierra
  en cascada sus sesiones OPEN (UC-13-08 embebido). Re-revocar → 422.

## Geometría / PostGIS

Las entidades de este módulo no declaran columnas `geometry` de PostGIS:
`latitude`/`longitude`/`center_lat`/`center_lng`/`radius_m` son `numeric` y
`geometry_json` es `jsonb` (GeoJSON). Los DTOs reciben lat/long como números y se
persisten como `numeric` (string en el ORM). No se requiere transformación WKT/WKB.
La evaluación espacial (ST_Contains/ST_DWithin) y los índices GiST son
proyecciones/worker fuera del alcance de estos endpoints.

## Convenciones (idénticas a IAM/Directory)

- Servicios inyectan `EntityManager` (`@mikro-orm/postgresql`); escrituras en
  `em.transactional`, lecturas en `em.fork()`.
- Repositorios stateless: reciben el `em` activo como primer parámetro.
- FK planas uuid → `flush` del padre antes de crear hijos; `em.create(..., { partial: true })`.
- `row_version` nunca se fija (DEFAULT en BD); `createdBy(actor.id)`/`touch` para auditoría.
  Las tablas append-only (`location_pings`, `geofence_events`) solo llevan
  `recorded_at`/`recorded_by_user_id`.
- Conceptos propios en `geo.concepts.ts` (`GEO`, `GEO_CONCEPT_SEEDS`).

## Permisos y logs

- Guard global de autenticación; todos los endpoints exigen rol `SECURITY_ADMIN`
  (coordinador de flota / worker autorizado). Sin auth → 401.
- Logs Pino estructurados (`operation`, ids); nunca secretos ni PHI/ubicación cruda.

## Tests

- Unit: `services/*.service.spec.ts` (repos/em mockeados) y
  `controllers/*.controller.spec.ts` (servicios mockeados).
- Smoke transversal: `test/smoke/modules/geo.smoke.ts` (`GEO_SMOKE`).
# Geo module

Gestiona sujetos rastreados, sesiones, pings de ubicación, viajes, geocercas y
eventos de entrada/salida. Las rutas se reservan al rol `SECURITY_ADMIN`.

## Verificación

```bash
corepack yarn test src/modules/geo --runInBand --silent
```

La revisión de octubre de 2026 encontró que el rol global no sustituye una
comprobación por tenant, sujeto y consentimiento. El detalle y la matriz de
pruebas están en
[`docs/revision-backend-2026-10-04/modulos/geo.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/geo.md).
