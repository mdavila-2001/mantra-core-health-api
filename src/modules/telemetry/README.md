# Módulo Telemetry (28)

Telemetría de producto: consentimiento de tracking, esquemas de eventos, actividad,
contexto de cliente, Core Web Vitals, journeys, conversiones y analítica administrativa.
Persiste en el esquema PostgreSQL `telemetry`. Puede reenviar, después del commit y por
mejor esfuerzo, eventos minimizados a un proveedor externo.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/telemetry -name '*.controller.ts' | wc -l
  find src/modules/telemetry -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/telemetry -name '*.entity.ts' | wc -l
  find src/modules/telemetry -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **4 controllers, 21 rutas HTTP, 14 entidades y 5 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

Entidades (`tableName`, 14 de 14 archivos `*.entity.ts`): `activity_event_schema_definitions`, `analytics_subjects`, `client_contexts`, `conversion_events`, `funnel_definitions`, `funnel_steps`, `session_journeys`, `tracking_consents`, `tracking_disclosure_acceptances`, `tracking_disclosure_versions`, `tracking_purpose_definitions`, `user_activity_event_properties`, `user_activity_events`, `web_vitals`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `GET /admin/analytics/overview` | ...ANALYTICS_READ_ROLES | `telemetry-analytics` |
| `GET /admin/analytics/timeseries` | ...ANALYTICS_READ_ROLES | `telemetry-analytics` |
| `GET /admin/analytics/web-vitals` | ...ANALYTICS_READ_ROLES | `telemetry-analytics` |
| `GET /admin/analytics/funnels` | ...ANALYTICS_READ_ROLES | `telemetry-analytics` |
| `GET /admin/analytics/funnels/:funnelId/report` | ...ANALYTICS_READ_ROLES | `telemetry-analytics` |
| `GET /admin/analytics/pipeline-health` | ...ANALYTICS_READ_ROLES | `telemetry-analytics` |
| `GET /admin/analytics/sessions` | ...ANALYTICS_RAW_ROLES | `telemetry-analytics` |
| `GET /admin/analytics/sessions/:id` | ...ANALYTICS_RAW_ROLES | `telemetry-analytics` |
| `POST /telemetry/disclosure-acceptances` | sesión | `telemetry-consent` |
| `POST /telemetry/tracking-consents` | sesión | `telemetry-consent` |
| `POST /telemetry/analytics-subjects` | SECURITY_ADMIN | `telemetry-consent` |
| `POST /telemetry/tracking-consents/:id/withdraw` | sesión | `telemetry-consent` |
| `POST /telemetry/activity-events` | sesión | `telemetry-events` |
| `POST /telemetry/client-contexts` | sesión | `telemetry-events` |
| `POST /telemetry/web-vitals` | sesión | `telemetry-events` |
| `POST /telemetry/conversion-events` | sesión | `telemetry-events` |
| `POST /telemetry/session-journeys/:id/close` | sesión | `telemetry-events` |
| `POST /telemetry/tracking-purposes` | SECURITY_ADMIN | `telemetry-governance` |
| `POST /telemetry/event-schemas` | SECURITY_ADMIN | `telemetry-governance` |
| `POST /telemetry/disclosure-versions` | SECURITY_ADMIN | `telemetry-governance` |
| `POST /telemetry/funnels` | SECURITY_ADMIN | `telemetry-governance` |

## Estructura

- `controllers/`: rutas HTTP de gobernanza, consentimiento, ingesta y analítica.
- `services/`: transacciones de dominio, gate de consentimiento y composición de lectura.
- `repositories/`: persistencia MikroORM y consultas SQL agregadas.
- `entities/`: tablas del esquema `telemetry`.
- `domain/` e `infrastructure/`: puerto y adaptadores de analítica web.
- `dto/`: contratos validados para cuerpos y consultas.

## Rutas

| Grupo | Método y ruta | Acceso declarado |
| --- | --- | --- |
| Gobernanza | `POST /telemetry/tracking-purposes`, `event-schemas`, `disclosure-versions`, `funnels` | `SECURITY_ADMIN` |
| Consentimiento | `POST /telemetry/disclosure-acceptances`, `tracking-consents`; `POST /telemetry/tracking-consents/:id/withdraw` | JWT global |
| Ingesta | `POST /telemetry/activity-events`, `client-contexts`, `web-vitals`, `conversion-events`; `POST /telemetry/session-journeys/:id/close` | JWT global |
| Analítica | `GET /admin/analytics/{overview,timeseries,web-vitals,funnels,funnels/:id/report,pipeline-health}` | `PLATFORM_ADMIN`, `SECURITY_ADMIN`, `DATA_PLATFORM_ADMIN`, `MARKETING_MANAGER` o `DPO` |
| Analítica de sesiones | `GET /admin/analytics/sessions`, `sessions/:id` | `PLATFORM_ADMIN`, `SECURITY_ADMIN` o `DPO` |

## Persistencia y reglas actuales

Las tablas principales son `tracking_purpose_definitions`,
`activity_event_schema_definitions`, `tracking_consents`,
`tracking_disclosure_acceptances`, `analytics_subjects`, `user_activity_events`,
`session_journeys`, `client_contexts`, `web_vitals`, `funnel_definitions` y
`conversion_events`.

Los lotes de actividad (máximo 500) y de vitals (máximo 200) se procesan en
transacción. La actividad usa clave de idempotencia cuando el cliente la aporta.
La analítica administrativa limita las ventanas a 92 días y las sesiones a 100
por página; el timeline se corta en 500 eventos y no devuelve valores de propiedades.

## Reenvío a analítica web externa

La telemetría que se persiste aquí puede reenviarse a una herramienta de
analítica externa. El reenvío es **server-side**: el portal no habla con el
proveedor, habla con esta API, y esta API decide qué sale.

```
POST /telemetry/activity-events ─┐
POST /telemetry/web-vitals ──────┤─► TelemetryEventsService ─► COMMIT
POST /telemetry/conversion-events┘            │
                                              └─► TelemetryWebAnalyticsService
                                                        │  (mejor esfuerzo)
                                                        └─► WEB_ANALYTICS_PORT
                                                              ├─ disabled  (por defecto)
                                                              └─ google_analytics (GA4 MP)
```

Reglas que no se negocian:

- **La ingesta manda.** El reenvío ocurre después de confirmar la transacción y
  ningún fallo del proveedor cambia lo persistido ni la respuesta al portal.
- **Sólo sale lo que se persistió.** Lo que el gate de consentimiento descarta no
  se reenvía; una conversión ya registrada no se reenvía dos veces, porque GA4 no
  deduplica eventos clave.
- **Nada identificable cruza.** Al proveedor sólo llegan claves derivadas con
  SHA-256 y la sal del despliegue, plantillas de ruta y propiedades ya minimizadas.
- **Apagado por defecto.** Un despliegue que no configure nada se comporta como
  antes de que existiera el adaptador.

Variables (ver `.env.example`): `TELEMETRY_WEB_ANALYTICS_ENABLED`,
`TELEMETRY_WEB_ANALYTICS_PROVIDER`, `TELEMETRY_WEB_ANALYTICS_SUBJECT_SALT`,
`TELEMETRY_WEB_ANALYTICS_SITE_URL`, `GA4_MEASUREMENT_ID`, `GA4_API_SECRET`,
`GA4_DEBUG_VALIDATION`.

## Pruebas

`corepack yarn test src/modules/telemetry --runInBand --silent` aprobó 14 suites y
121 pruebas durante la revisión. Hay cobertura unitaria de controladores, servicios,
ventanas, configuración y mapeo de GA4. Falta cobertura de integración para propiedad
de consentimiento, referencias de ingesta y aislamiento de tenant.

## Limitaciones conocidas

La revisión ALOVIDA documenta problemas críticos de propiedad de consentimiento,
referencias de ingesta, validación de propiedades y aislamiento de tenant en la
[revisión del módulo](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/telemetry.md).
