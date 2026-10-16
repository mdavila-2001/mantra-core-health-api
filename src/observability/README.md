# `src/observability` — trazas distribuidas

Inicializa OpenTelemetry antes de Nest, crea spans de dominio y workers, propaga
contexto en mensajería y publica `x-trace-id` cuando la configuración lo permite.
La instrumentación excluye cabeceras HTTP y parámetros SQL para no exportar
credenciales ni datos clínicos.

| Archivo | Responsabilidad |
|---|---|
| `telemetry.bootstrap.ts` | Inicializa o apaga el SDK. |
| `telemetry.config.ts` | Valida exportador, muestreo y servicio. |
| `instrumentations.ts` | HTTP, Nest, PostgreSQL, Redis, Mongo y Undici. |
| `tracing.service.ts` | API de spans, eventos y errores. |

Ejecutar `corepack yarn test --runInBand --silent src/observability`. Los spans
usan atributos técnicos, nunca contenido clínico o payloads. El informe de
bootstrap, readiness y persistencia está
[aquí](../../docs/revision-backend-2026-10-04/nucleo/app-persistencia-observabilidad.md).
