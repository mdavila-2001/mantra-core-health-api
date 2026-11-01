# Piezas en ejecución (`/admin/ops/runtime-pieces`)

Extiende la **sonda de vida** (`ops_console`, `GET /admin/ops/instances/liveness`) y el **registro de herramientas**
(`platform_ops.tool_registry`); no los duplica. Descubre en el código todo lo que puede estar corriendo, lo contrasta con
el registro y con los latidos, y registra lo descubierto con su procedencia.

Depende de lo que hoy está en `origin/dev`: `ops_console/domain/instance-liveness*`, `instance-registry`,
`infrastructure/repositories/instance-heartbeat.repository` y `platform_ops/platform_ops.concepts`.

## Qué descubre (`scanner/`)

Escáner estático (sólo lee archivos; no ejecuta nada). Cada pieza lleva un id determinista (`rtp.<tipo>.<…>`), evidencia
`archivo:línea`, cómo se enciende (variables de entorno, compose, script) y qué latido la representa.

| Tipo | Qué es | Cómo se reconoce |
|---|---|---|
| `PROCESO` | API, cada worker, arranques de un solo uso | `src/main.ts`, `src/worker-*.ts` (`bootstrapWorker`), `NestFactory` en `src/*.ts`; compose y `package.json` dicen cómo arranca |
| `JOB_PROGRAMADO` | tick programado | `@Interval/@Cron/@Timeout`, `CronJob.from/new CronJob` |
| `TEMPORIZADOR` | temporizador dentro de un servicio | `setInterval(…)` |
| `CONSUMIDOR_COLA` | consumidor de cola / evento / outbox | `registerQueueJobHandler`, `@Processor`, `new Worker(`, `@OnEvent`, Redis `subscribe`, jobs que llaman `/internal/outbox\|queues` |
| `JOB_NOMBRADO` | `jobType` declarado | `export const *_JOB_TYPE = '…'`, `enum *Job*` |
| `ENDPOINT_INTERNO` | `POST …/internal/…` que dispara trabajo | `@Controller` + `@Post`, con roles |
| `SALUD` | comprobaciones de salud | `/health`, `/liveness`, `/readiness`, sonda de cada worker, `healthcheck` de compose |
| `CONECTOR` | cliente/adaptador/gateway con E/S externa | nombre `*adapter\|client\|provider\|gateway\|connector\|storage` **y** una marca de E/S (`fetch`, S3, ioredis, mongodb, opensearch, websocket…) |

Límites declarados (viajan en `notMeasured`): no ve rutas/jobs armados en tiempo de ejecución sin literal en el código, no
distingue réplicas de un mismo worker, no observa cada tick por separado (sólo el latido del proceso anfitrión) y no lee el
entorno de otros procesos. Los comentarios se descartan antes de buscar, y el propio módulo no se escanea.

## De dónde sale el código leído (`scan-cache.ts`, `scanner/manifest.ts`)

La imagen de producción **sólo trae `dist/`** (ver `Dockerfile`, etapa `runtime`): no hay `src/` ni los compose. Por eso el
escáner tiene dos fuentes y la respuesta dice cuál usó (`scan.source`, `scan.generatedAt`):

1. **`live`**: lee `src/` (raíz: `RUNTIME_PIECES_SOURCE_ROOT` o el directorio de trabajo). Es lo que pasa en desarrollo.
2. **`manifest`**: si no hay `src/`, lee `dist/runtime-pieces.manifest.json` (`RUNTIME_PIECES_MANIFEST` lo cambia), que se
   genera **al compilar** con `runtime-pieces-manifest.cli` y viaja dentro de `dist/`. Un manifiesto roto no se usa a medias.
3. Sin ninguna de las dos: `available:false` con el motivo. Nunca se devuelve una lista vacía como si fuera un resultado, y
   `discover` responde 409 en vez de declarar huérfano todo el registro.

## Estados (`domain/contrast.ts`)

`VIVA` (latido reciente) · `SIN_LATIDO` · `NO_REGISTRADA` (hallazgo) · `HUERFANA` · `DESHABILITADA` · y **`NO_MEDIBLE`**, que
no estaba en el pedido original: las clases de pieza sin mecanismo de latido (job nombrado, conector sin anfitrión) no pueden
ser «viva» ni «sin latido» sin mentir. Los umbrales **no se redefinen**: el latido se evalúa con `evaluateInstance` y
`loadInstanceLivenessEnv` de la sonda (`OPS_LIVENESS_DEGRADED_AFTER_SECONDS`=30, `OPS_LIVENESS_DOWN_AFTER_SECONDS`=60,
`OPS_LIVENESS_REQUIRED_WORKERS`). Una instancia `DEGRADADA` (latido tardío) deja la pieza `VIVA` con su causa a la vista.

## Registro (`runtime-pieces-seed.service.ts`)

Escribe en `platform_ops.tool_registry` filas con `code = rtp.*`, `tenant_id` = tenant de plataforma (`SEED.tenantId`; así
`OpsToolsRepository`, que lista `tenant_id IS NULL`, no se llena de piezas) y estado `TOOL_STATE_ACTIVE`.

- **Idempotente**: id determinista, `INSERT … ON CONFLICT (code) DO NOTHING`, y actualización sólo si cambia la **huella** de
  lo descubierto (que incluye `archivo:línea`). Sin cambios en el código, la segunda corrida no inserta ni modifica nada.
- **Nunca borra**: lo que ya no existe se informa como huérfano. No toca el estado ni la homologación de una fila existente.
- **Procedencia** en `purpose` (el DDL no tiene columnas): fuente `descubrimiento-estatico`, `evidencia archivo:línea`,
  `descubierto` (fecha UTC), `huella`, `latido`.
- Falla con 422 `RUNTIME_PIECES_CONCEPTS_MISSING` si el catálogo no tiene los conceptos (ver «Cableado») y con 409
  `RUNTIME_PIECES_SOURCE_UNAVAILABLE` si el despliegue no trae `src/` (`RUNTIME_PIECES_SOURCE_ROOT` fija la raíz).

## API

| Ruta | Roles | Auditoría |
|---|---|---|
| `GET /admin/ops/runtime-pieces` (filtros `kind, state, host, module, q, withFindings`; `page, pageSize≤100`) | `OPS_READ_ROLES` | — |
| `GET /admin/ops/runtime-pieces/:id` | `OPS_READ_ROLES` | — |
| `POST /admin/ops/runtime-pieces/discover` (`{ dryRun? }`) | `PLATFORM_ADMIN`, `SRE` | `@Audited RUNTIME_PIECES_DISCOVERED` |

## Cableado (ediciones a archivos compartidos, no hechas aquí)

1. `src/app.module.ts`: importar `RuntimePiecesModule`.
2. `src/common/seed/module-concepts.ts`: añadir `...RUNTIME_PIECES_CONCEPT_SEEDS` (de `runtime_pieces.concepts.ts`).
3. `Dockerfile`, etapa `build`, justo después de `RUN … yarn build`:
   `RUN node dist/src/modules/platform_ops/runtime_pieces/runtime-pieces-manifest.cli.js dist/runtime-pieces.manifest.json`
   (sin esto la imagen no puede descubrir nada: ver «De dónde sale el código leído»).
4. Opcional: `SeedBootstrapService` puede llamar `RuntimePiecesSeedService.run` al sembrar; hoy sólo corre desde la ruta.

## DDL propuesto (no aplicado; el modelo manda)

`tool_registry` no tiene columnas de procedencia ni de ciclo de vida del descubrimiento; hoy viajan en `purpose`.
Si se quiere consultarlas con SQL:

```sql
ALTER TABLE platform_ops.tool_registry
  ADD COLUMN discovery_source varchar,
  ADD COLUMN evidence_file    varchar,
  ADD COLUMN evidence_line    integer,
  ADD COLUMN fingerprint      varchar,
  ADD COLUMN discovered_at    timestamptz,
  ADD COLUMN last_seen_at     timestamptz;
CREATE INDEX ix_tool_registry_discovery_source ON platform_ops.tool_registry (discovery_source)
  WHERE discovery_source IS NOT NULL;
```

## Pruebas

```bash
corepack yarn test src/modules/platform_ops/runtime_pieces --runInBand
RUNTIME_PIECES_IT_DB_URL=postgres://… corepack yarn test:integration test/integration/runtime-pieces.int-spec.ts
```
