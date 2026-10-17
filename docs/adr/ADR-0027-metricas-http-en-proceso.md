# ADR-0027: Métricas HTTP en proceso sobre `service_sli_series`, sin datos de personas

## Estado
Aceptado (2026-10-17). Portal de Superadministración, H1. No cambia el modelo de datos: no hay tablas
nuevas ni DDL (no hace falta desvío de [ADR-0021](ADR-0021-fuente-unica-de-ddl.md)).

## Contexto

El portal necesita responder cuántas solicitudes recibió la API, cuántas salieron bien o mal, qué tan rápido
respondió y qué endpoints se tocaron hoy. **La API no tenía ninguna lectura de eso.** Lo único cercano era la
exportación de trazas del `otel-collector` hacia Prometheus (`infra/monitoring`), que está apagada por defecto
(`OTEL_ENABLED=false`), no existe en local y no se puede leer desde la API.

Dos restricciones mandan:

- **No se guarda quién consultó qué.** Un registro de peticiones con la URL real o el usuario es, en un sistema de
  salud, un registro de qué paciente miró quién: dato personal sensible (regla 90.2 de la casa).
- **No se toca el modelo para esto.** `time_series.service_sli_series` ya existe: `(time, tenant_id, series_id)`,
  `sli_code`, `numerator`, `denominator`, `value` y `dimensions jsonb`.

## Decisiones

1. **Se mide en proceso**, con un middleware Express (`src/observability/http-sli`) que agrega en memoria por
   **minuto × método × plantilla de ruta** y vuelca cada `OBSERVABILITY_HTTP_SLI_FLUSH_SECONDS` (60 por defecto) **una
   fila por serie** a `service_sli_series` con `sli_code = 'http_requests'`. Apagado por defecto
   (`OBSERVABILITY_HTTP_SLI_ENABLED`); sólo el `.env.example` de desarrollo lo enciende.
2. **Lo único que entra es la plantilla que Express declaró** (`/patients/:id`) y números. Ni la URL real, ni el
   query, ni el cuerpo, ni las cabeceras, ni el usuario. Defensa en profundidad: una «ruta» que parezca una URL real
   (lleva un UUID o seis dígitos seguidos) o un comodín se pliega a `UNMATCHED`. Una verificación con `grep` sobre el
   middleware (`originalUrl|req.url|req.query|req.body|req.headers` → 0) y una prueba contra la API real (21
   peticiones, ningún UUID en ninguna serie) lo sostienen.
3. **La latencia es un histograma acumulado de 11 cortes** (5 ms … 10 s, los mismos del collector del VPS, para que lo
   medido acá y lo medido allá se puedan comparar) más `sumMs` y `maxMs`. Los percentiles se **estiman por
   interpolación** y se declaran como tal (`method: 'histogram-estimate'`); si caen en el último corte se devuelven
   como cota inferior (`approximate: true`).
4. **Cardinalidad acotada**: a lo sumo 2 000 claves distintas por minuto; la 2 001 cae en `__overflow__`.
5. **Dos volcados del mismo minuto dan filas disjuntas** (el agregador se vacía al drenar) y la lectura **suma**; la
   tabla no tiene clave única por esa razón. Leer fila por fila contaría de menos.
6. **«Usuarios activos» sale de `iam.sessions`**, no de las peticiones: sesiones vigentes ahora, usuarios con sesión
   vigente y usuarios que abrieron sesión en la ventana. Son conteos; el middleware no guarda `user_id`.
7. **La lectura es del módulo `ops_console`** (sin tablas), `GET /admin/ops/traffic` y `/traffic/endpoints`, con
   `OPS_READ_ROLES`. Lo que la medición **no** cubre se devuelve en `notMeasured` y la pantalla lo muestra como
   «no medido», nunca como cero. El nombre de cada operación sale de un **índice de rutas en proceso**
   (`RouteIndexService`, `DiscoveryService` + `MetadataScanner`), no de `openapi.json`: ese archivo no viaja en la
   imagen de producción.
8. **Las filas se escriben bajo `SEED.tenantId`**: `tenant_id` es obligatorio y no existe un tenant de plataforma. Es la
   deuda `TS-07`; con `RLS_ENFORCE=true` la lectura y la escritura fijan ese mismo tenant en su transacción.

## Alternativas descartadas

- **Leer de Prometheus.** Apagado por defecto y ausente en local; deja la portada vacía donde más falta hace. Queda
  como fuente futura, no como única.
- **Una tabla propia de peticiones.** Cambio de esquema por algo que ya cabe en `service_sli_series`; y la tentación
  de guardar de más.
- **Guardar `user_id` para «usuarios activos».** Convierte una métrica en un registro de actividad de personas.

## Consecuencias

- Lo agregado y aún no volcado se pierde si el proceso cae (a lo sumo un ciclo de volcado) y lo que contestan
  Traefik o nginx **antes** de la API no se ve: ambos están declarados en `notMeasured`.
- Los workers y los jobs no son peticiones HTTP: sólo se mide la API. Las sondas de salud, la documentación y los
  `OPTIONS` se excluyen a propósito.
- Con más réplicas de la API cada una vuelca sus propias filas y la lectura las suma: no hace falta coordinación.
- Retención: las filas viven según la política de `POST /ts/admin/retention/policies`; no hay una propia.

## Verificación

Evidencia en `docs/trabajo/2026-10-17-superadmin/` (`REPORTE.md`, `evidencia/H1.*`): pruebas unitarias del agregador,
del middleware y del volcado; integración contra PostgreSQL real (`ops-traffic.int-spec.ts`, incluido RLS con un rol
sin privilegios); y una corrida con la API real y tráfico HTTP real. Límites: la serie fue una tabla común, no una
hipertabla Timescale; no se probó en Docker.
