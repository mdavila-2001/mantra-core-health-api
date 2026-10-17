# Reporte — Superadministración de AloVida (lado API)

> **AVANCE: 4 / 22 — 18,2 %.** (`microtareas HECHO / total` del PLAN.md de este repo; `DESCARTADO`, `BLOQUEADO` y `A MEDIAS` no suman. Hecho: H0.1.1, H1.1.1, H1.1.2, H1.1.3.)

- Fecha: 2026-10-17 · Plan: [PLAN.md](./PLAN.md) · Rama: `claude-marcelo/serene-planck-1q7zje`
- Peldaño de evidencia alcanzado: **`TESTED`** (pruebas unitarias dirigidas con dobles). **No** `VERIFIED`: nada se ejercitó contra Postgres/Timescale ni con la API arrancada.

## Completado
| ID | Qué se logró | Comando de verificación | Resultado |
|---|---|---|---|
| H0.1.1 | `.env.example` propone `admin@alovidasalud.com` (comentado) con aviso «sólo local y dev» | `grep -n 'BOOTSTRAP_ADMIN_EMAIL=admin@alovidasalud.com' .env.example` | `289:# BOOTSTRAP_ADMIN_EMAIL=admin@alovidasalud.com` |
| H1.1.1 | Agregador puro por minuto × método × plantilla (histograma acumulado de 11 cortes, tope de cardinalidad, pliegue a `UNMATCHED` de lo que parece una URL real) | `yarn test src/observability/http-sli` | 12 pruebas · `evidencia/H1.1.1-aggregator.txt` |
| H1.1.2 | Configuración validada (falla al arrancar con valores inválidos) y middleware que sólo lee verbo, plantilla, estado y duración | ídem + `grep -c 'originalUrl\|req.url\|req.query\|req.body\|req.headers' http-sli.middleware.ts` | 40 pruebas acumuladas · grep → `0` · `evidencia/H1.1.2-middleware-env.txt` |
| H1.1.3 | Volcado periódico a `time_series.service_sli_series` con una transacción por lote, reintento único, RLS y cierre ordenado | ídem | 51 pruebas acumuladas · `evidencia/H1.1.3-flush.txt` |

Conjunto final sobre el código ya formateado: **ESLint exit 0, Jest 53/53** (incluye `app.module.wiring.spec.ts`), `tsc` sin errores en mis archivos → `evidencia/H1.1-*.txt`.

## A medias
### H1.1.4 — Registro en la aplicación
- **Qué anda:** `main.ts` instala el middleware tras `helmet()` sólo si `OBSERVABILITY_HTTP_SLI_ENABLED=true`; `AppModule` importa `HttpSliModule`; variables en `.env.example` y `docker-compose.yml`; README de `src/observability`. Typecheck, lint y el spec de cableado pasan.
- **Qué no anda / no se probó:** nunca se arrancó la API ni se escribió una fila real.
- **Qué falta exactamente:** con el stack levantado, hacer peticiones, esperar 65 s y comprobar `select series_id, numerator, denominator, dimensions->'codes' from time_series.service_sli_series where series_id like 'http|%' order by time desc limit 5` → filas, sin `/health` ni UUIDs.
- **Dónde quedó:** `src/main.ts`, `src/app.module.ts`, `docker-compose.yml`, `.env.example`; compila (en la copia de trabajo) y los tests pasan.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H0.1.2 | `DESCARTADO` | El spec ya cubre producción sin autorización (`bootstrap-admin-seed.service.spec.ts:92-100`); 11/11 verdes |
| H0.1.3 | `BLOQUEADO` | Login real + 4 lecturas 200: no hay daemon de Docker ni Postgres en el entorno. Se destraba con un Postgres/Timescale local o el stack de dev |
| H1.2.x (índice de rutas, lecturas `GET /admin/ops/traffic*`) | `TODO` | Siguiente en el orden del plan |
| H2.x, H3.x, H5.1 | `TODO` | Dependen de H1.2 (el índice de rutas) y, para las `int-spec`, de una base real |

## Evidencia
`docs/trabajo/2026-10-17-superadmin/evidencia/`: `H1.1.1-aggregator.txt`, `H1.1.2-middleware-env.txt`, `H1.1.3-flush.txt`, `H1.1-jest-http-sli-y-wiring.txt`, `H1.1-tsc.txt`, `H1.1-eslint.txt`, `ENTORNO.txt`.

## No cubierto
- Ningún `test:integration` ni consulta SQL real: sin Postgres no se ejercitó `insertPoints` contra `service_sli_series`, ni el RLS, ni el rendimiento del volcado.
- `tsc` completo no se pudo dejar en 0: **19 líneas de error** son del importador de terminología porque `xlsx` falta en el entorno (ver Desvíos). En el repo real, con `xlsx` instalado, no deberían aparecer; no se verificó.
- No se corrió la suite unitaria completa de la API, sólo `src/observability/http-sli` y el spec de cableado.
- `openapi/openapi.json` no se regeneró (todavía no hay rutas nuevas).

## Desvíos del plan
- **`SeriesIngestRepository` se provee en `HttpSliModule`** en vez de importar `TimeSeriesModule`: ese módulo no lo exporta y no hacía falta tocarlo. El repositorio no tiene dependencias.
- **`H0.1.2` descartada** (ya cubierta).
- **Entorno de pruebas:** `cdn.sheetjs.com` (de donde viene `xlsx`) está denegado por el proxy de la sesión, así que `yarn install` del repo falla. Se trabajó en una **copia fuera del repo** (`scratchpad/api-work`) sin `xlsx`, con un *stub* vacío, instalada con Yarn 4.14.1 obtenido de `@yarnpkg/cli-dist` (registro npm permitido). `package.json` y `yarn.lock` del repo **no se tocaron**.
- El valor por defecto del código es **apagado**; sólo el `.env.example` de desarrollo lo enciende.

## Riesgos residuales
- Las métricas se guardan bajo `SEED.tenantId` (el tenant por defecto): `tenant_id` es obligatorio en la tabla y no existe un tenant de plataforma. Es la deuda TS-07 del backlog de superadmin.
- `service_sli_series` no tiene clave única: dos volcados del mismo minuto dan dos filas **disjuntas** y la lectura debe **sumar**. Si alguien lee por fila, contará de menos.
- Lo agregado en memoria y no volcado se pierde si el proceso cae (a lo sumo `FLUSH_SECONDS`).
- El importe de los cortes de latencia es una estimación por histograma, no un percentil exacto.

## Decisiones y ambigüedades
- «Usuarios activos» se medirá desde `iam.sessions` (H1.2): no se guarda `user_id` en el middleware por ser dato personal. Confirmar con el usuario y con el DPO.
- «Hoy» = 00:00 UTC por defecto (H1.2). Confirmar con el usuario si se quiere `America/La_Paz`.
