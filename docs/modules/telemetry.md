<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/telemetry/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `telemetry`

**Fuente:** [`src/modules/telemetry/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/telemetry/README.md)
· 3 controllers · 4 services · 14 repositories · 14 entidades · 12 DTO

---

# src / modules / telemetry

Agrupa los componentes relacionados con **telemetry** y mantiene cohesionada esta responsabilidad del sistema.

## Contenido

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

