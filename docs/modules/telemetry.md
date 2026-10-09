<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/telemetry/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver docs/progress/ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `telemetry`

**Fuente:** [`src/modules/telemetry/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/telemetry/README.md)
· 4 controllers · 5 services · 15 repositories · 14 entidades · 12 DTO

---

# src / modules / telemetry

Agrupa los componentes relacionados con **telemetry** y mantiene cohesionada esta responsabilidad del sistema.

<<<<<<< HEAD
## Contenido
=======
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
>>>>>>> 8a44a3cc (docs(modules): rutas HTTP, entidades e imports medidos en los 62 READMEs restantes)

### Subcarpetas

- [`controllers/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/telemetry/controllers/README.md): Adaptadores HTTP que validan solicitudes, aplican autorización y delegan la lógica en servicios.
- [`domain/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/telemetry/domain/README.md): Contratos del dominio que no dependen de ningún proveedor concreto.
- [`dto/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/telemetry/dto/README.md): Contratos de entrada y salida, validación y documentación de la API.
- [`entities/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/telemetry/entities/README.md): Entidades y relaciones que representan el modelo persistente.
- [`infrastructure/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/telemetry/infrastructure/README.md): Adaptadores que implementan los puertos del dominio y su selección por entorno.
- [`repositories/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/telemetry/repositories/README.md): Consultas y operaciones de persistencia aisladas de la lógica de negocio.
- [`services/`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/telemetry/services/README.md): Casos de uso, reglas de negocio y coordinación transaccional.

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `telemetry.concepts.ts` | Implementación o recurso de soporte de esta carpeta. |
| `telemetry.module.ts` | Composición de dependencias del módulo NestJS. |
| `web-analytics.env.ts` | Configuración del reenvío a una analítica web externa (esquema Joi + lectura del entorno). |
| `web-analytics.env.spec.ts` | Pruebas unitarias de la configuración y de sus validaciones de arranque. |

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

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.

## Lectura para el portal administrativo (`/admin/analytics`)

Consultas de sólo lectura sobre lo que persiste la ingesta. Toda consulta tiene ventana
(`from`/`to`, por defecto 7 días, máximo 92; por hora sólo hasta 7 días) y los agregados se
calculan en la base: el portal no suma ni promedia.

| Ruta | Qué devuelve |
| --- | --- |
| `GET overview` | Eventos, sesiones, sujetos seudónimos, vistas; top rutas y eventos; definición de cada conteo |
| `GET timeseries` | Eventos y sesiones por cubo UTC, con cubos vacíos en 0 |
| `GET web-vitals` | p50/p75/p95 por métrica con `percentile_cont` sobre las muestras (nunca promedio de percentiles), tamaño de muestra, ratings; `?metric=` añade p75 por ruta |
| `GET funnels` · `funnels/:id/report` | Embudo por **sesión**, orden estricto, denominador explícito, 0/0 = null; conversiones confirmadas por servidor aparte |
| `GET pipeline-health` | Aceptados, frescura, latencia de ingesta p50/p95, desfase de reloj, bots. Duplicados, descartes por consentimiento y rechazos se declaran **no medidos**: la ingesta no los persiste |
| `GET sessions` · `sessions/:id` | Sesiones y su timeline, sin `session_id` ni sujeto, con nombres de propiedad pero **nunca sus valores**. Roles más restringidos que los agregados |

Pruebas: `domain/analytics-window.spec.ts` y `test/integration/telemetry-analytics.int-spec.ts`
(DDL canónico del módulo 28 y datos con resultado calculable a mano).

