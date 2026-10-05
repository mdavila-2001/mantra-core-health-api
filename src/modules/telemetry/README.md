# Módulo Telemetry (28)

Telemetría de producto: consentimiento de tracking, esquemas de eventos, actividad,
contexto de cliente, Core Web Vitals, journeys, conversiones y analítica administrativa.
Persiste en el esquema PostgreSQL `telemetry`. Puede reenviar, después del commit y por
mejor esfuerzo, eventos minimizados a un proveedor externo.

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
[revisión del módulo](../../../docs/revision-backend-2026-10-04/modulos/telemetry.md).
