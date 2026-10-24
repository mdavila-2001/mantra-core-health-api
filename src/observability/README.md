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
| `http-sli/` | Medición de peticiones HTTP para el portal de superadministración (ver abajo). |

Ejecutar `corepack yarn test --runInBand --silent src/observability`. Los spans
usan atributos técnicos, nunca contenido clínico o payloads.

## Medición de peticiones HTTP (`http-sli/`)

Cuenta, **por minuto y por plantilla de ruta**, cuántas peticiones recibió la API,
cómo terminaron (2xx/3xx/4xx/5xx) y cuánto tardaron, y lo vuelca a
`time_series.service_sli_series` (una fila por minuto × método × plantilla, con el
histograma de latencia —los once cortes del collector del VPS— en `dimensions`).
La lectura es `GET /admin/ops/traffic*` (`ops_console`).

- **Apagada por defecto**: `OBSERVABILITY_HTTP_SLI_ENABLED=true` la enciende y
  `OBSERVABILITY_HTTP_SLI_FLUSH_SECONDS` (10–3600, por defecto 60) fija el volcado.
  Un valor inválido hace fallar el arranque.
- **Privacidad**: sólo lee verbo, plantilla de ruta, estado y duración. Nunca la
  URL real, el query, el cuerpo, las cabeceras ni el usuario. Lo que no coincide
  con ninguna ruta se agrupa como `UNMATCHED`; el desborde de cardinalidad
  (2000 claves por minuto), como `__overflow__`.
- **No mide** `EXCLUDED_HTTP_PATHS` (salud, documentación), `OPTIONS`, ni las
  peticiones que el cliente aborta. Tampoco lo que Traefik/nginx contestan antes
  de llegar a la API.
- **Si la base falla** se reintenta una vez; después se descarta con un aviso.
  Perder un minuto de métricas es aceptable, tumbar la API no.

Pruebas: `corepack yarn test src/observability/http-sli`.
