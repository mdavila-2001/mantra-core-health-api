# Reporte — Superadministración de AloVida (lado API)

> **AVANCE: 11 / 23 — 47,8 %.** (`microtareas HECHO / total` del PLAN.md de este repo; `DESCARTADO`, `BLOQUEADO` y `A MEDIAS` no suman. Hecho: H0.1.1, H0.1.3, H1.1.1–H1.1.5, H1.2.1–H1.2.4.)

- Fecha: 2026-10-17 · Plan: [PLAN.md](./PLAN.md) · Rama: `claude-marcelo/serene-planck-1q7zje`
- Peldaño de evidencia alcanzado: **`VERIFIED` local** para el acceso del superadmin (H0.1.3), la medición HTTP (H1.1) y las lecturas de tráfico (H1.2): la API se arrancó de verdad contra un PostgreSQL 16 descartable, con tráfico HTTP real. **No** `REGRESSION_VERIFIED`. Límites de ese entorno: la serie fue una tabla común (no hipertabla Timescale), `xlsx` fue un *stub*, y la API sólo arranca con un parche de DI aplicado **al `dist` de la copia** (ver Desvíos).

## Completado
| ID | Qué se logró | Comando de verificación | Resultado |
|---|---|---|---|
| H0.1.1 | `.env.example` propone `admin@alovidasalud.com` (comentado) con aviso «sólo local y dev» | `grep -n 'BOOTSTRAP_ADMIN_EMAIL=admin@alovidasalud.com' .env.example` | `289:# BOOTSTRAP_ADMIN_EMAIL=admin@alovidasalud.com` |
| H1.1.1 | Agregador puro por minuto × método × plantilla (histograma acumulado de 11 cortes, tope de cardinalidad, pliegue a `UNMATCHED` de lo que parece una URL real) | `yarn test src/observability/http-sli` | 12 pruebas · `evidencia/H1.1.1-aggregator.txt` |
| H1.1.2 | Configuración validada (falla al arrancar con valores inválidos) y middleware que sólo lee verbo, plantilla, estado y duración | ídem + `grep -c 'originalUrl\|req.url\|req.query\|req.body\|req.headers' http-sli.middleware.ts` | 40 pruebas acumuladas · grep → `0` · `evidencia/H1.1.2-middleware-env.txt` |
| H1.1.3 | Volcado periódico a `time_series.service_sli_series` con una transacción por lote, reintento único, RLS y cierre ordenado | ídem | 51 pruebas acumuladas · `evidencia/H1.1.3-flush.txt` |
| H0.1.3 | Siembra ×2 idempotente (misma cuenta, 0 inserciones la 2.ª) y login real del superadmin: 200 con `SECURITY_ADMIN`+`SUPERADMIN`; contraseña errónea 401; `/admin/ops/readiness`, `/admin/catalog/schemas`, `/admin/qa/suites`, `/admin/analytics/overview` y `/admin/ops/traffic` → 200; sin token 401 | `node dist/src/seed-cli.js` ×2; `curl` | `evidencia/H0.1.3-login-y-lecturas.txt`, `H0.1.3-seed-segunda-corrida.txt` |
| H1.1.4 | La medición en la API arrancada: 21 peticiones reales (14+3 a 200, 2 sin token 401, 1 ruta inexistente 404, 1 login) → `requests: 21`, `client4xx: 3`, `/health` excluido, ningún UUID en las series ni en la respuesta, p95 estimado | `curl` ×21, espera del volcado, `psql`, `GET /admin/ops/traffic*` | `evidencia/H1.1.4-trafico-real.txt` |
| H1.1.5 | Defecto hallado por esa corrida: la ruta inexistente se medía como `GET /{*all}` (comodín del middleware) y ahora como `UNMATCHED`; sin ninguna URL real | spec (138 pruebas de `src/observability`) + petición real a ruta inexistente | `evidencia/H1.1.4-unmatched-real.txt` |
| H1.2.1 | Índice de rutas en proceso (`RouteIndexService`); sus operationId coinciden con los del contrato publicado | `yarn test src/observability/route-index` | 20 pruebas, incluida la comparación contra `openapi.json` · `evidencia/H1.2.1-route-index.txt` |
| H1.2.2 | Percentiles desde histograma acumulado (`latency-buckets.ts`) | `yarn test src/modules/ops_console/domain` | verde · `evidencia/H1.2.2-latency-buckets.txt` |
| H1.2.3 | Lecturas de tráfico y usuarios activos (`ops-traffic.repository.ts`) contra Postgres real: suma exacta de lo que escribe `http-sli`, ventana sin filas, dimensiones corruptas, filtro por serie/tenant/ventana, sesiones, RLS con rol sin privilegios | `OPS_TRAFFIC_IT_DB_URL=… yarn test:integration test/integration/ops-traffic.int-spec.ts` | 7/7 · `evidencia/H1.2.3-ops-traffic-int-spec.txt`. Encontró un bug real (un `?` en una regex lo leía MikroORM como parámetro) |
| H1.2.4 | `GET /admin/ops/traffic` y `GET /admin/ops/traffic/endpoints` (servicio, DTOs, `OPS_READ_ROLES`, ventana inválida → 422) y contrato publicado | `yarn test src/modules/ops_console src/observability`; ESLint; `tsc`; `check-breaking` | 192/192 · ESLint exit 0 · `tsc` 0 fuera de `xlsx` · «Sin cambios incompatibles» · `evidencia/H1.2.4-*.txt` |

Conjunto final sobre el código ya formateado: **ESLint exit 0, Jest 53/53** (incluye `app.module.wiring.spec.ts`), `tsc` sin errores en mis archivos → `evidencia/H1.1-*.txt`.

## A medias

Ninguna.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H0.1.2 | `DESCARTADO` | El spec ya cubre producción sin autorización (`bootstrap-admin-seed.service.spec.ts:92-100`); 11/11 verdes |
| H2.x, H3.x, H5.1 | `TODO` | Dependen de H1.2 (el índice de rutas) y, para las `int-spec`, de una base real |

## Evidencia
`docs/trabajo/2026-10-17-superadmin/evidencia/`: `H1.1.1-aggregator.txt`, `H1.1.2-middleware-env.txt`, `H1.1.3-flush.txt`, `H1.1-jest-http-sli-y-wiring.txt`, `H1.1-tsc.txt`, `H1.1-eslint.txt`, `ENTORNO.txt`.

## No cubierto
- `tools/…`/`docker compose`: el stack de Docker no se usó; la API corrió como proceso suelto (`node dist/src/main.js`) con `PORT=3000`.
- Con `RLS_ENFORCE=false` y el superusuario `postgres` el RLS no se ejerce en la corrida real; sí en `ops-traffic.int-spec` con un rol sin privilegios.
- Ningún `test:integration` ni consulta SQL real: sin Postgres no se ejercitó `insertPoints` contra `service_sli_series`, ni el RLS, ni el rendimiento del volcado.
- `tsc` completo no se pudo dejar en 0: **19 líneas de error** son del importador de terminología porque `xlsx` falta en el entorno (ver Desvíos). En el repo real, con `xlsx` instalado, no deberían aparecer; no se verificó.
- No se corrió la suite unitaria completa de la API, sólo `src/observability/http-sli` y el spec de cableado.
- `openapi/openapi.json`/`.yaml`: sólo se insertaron las 2 rutas nuevas (ver Desvíos); el resto del contrato no se revisó.
- El int-spec no corre sobre una hipertabla Timescale ni con la política de retención; `iam.sessions` se sembró con las FK desactivadas (`session_replication_role = replica`) porque sólo se lee su conteo.
- `GET /admin/ops/traffic*` no se llamó por HTTP (ni con token ni sin él): la autorización se cubre por el spec de metadatos `@Roles` del controlador, no por una petición real.

## Desvíos del plan
- **`SeriesIngestRepository` se provee en `HttpSliModule`** en vez de importar `TimeSeriesModule`: ese módulo no lo exporta y no hacía falta tocarlo. El repositorio no tiene dependencias.
- **`H0.1.2` descartada** (ya cubierta).
- **Entorno de pruebas:** `cdn.sheetjs.com` (de donde viene `xlsx`) está denegado por el proxy de la sesión, así que `yarn install` del repo falla. Se trabajó en una **copia fuera del repo** (`scratchpad/api-work`) sin `xlsx`, con un *stub* vacío, instalada con Yarn 4.14.1 obtenido de `@yarnpkg/cli-dist` (registro npm permitido). `package.json` y `yarn.lock` del repo **no se tocaron**.
- El valor por defecto del código es **apagado**; sólo el `.env.example` de desarrollo lo enciende.

- **Contrato OpenAPI parcial a propósito.** Regenerado con el generador oficial (en la copia, contra un Postgres 16 descartable), `openapi.json` traía además deriva ajena a este trabajo: la operación `GET /identity/verification-cases/{id}`, `PUT /practitioners/me/sites/{siteId}/contact-phone`, el esquema `SetSiteContactPhoneDto` y cambios en 3 esquemas (`CreateOwnSiteDto`, `IdentityAssuranceRequest*Dto`). Se insertaron **sólo** `GET /admin/ops/traffic` y `GET /admin/ops/traffic/endpoints` (+257 líneas, 0 borradas; la serialización reproduce el archivo commiteado byte a byte). Quien posea esos otros cambios debe regenerar el contrato.
- **Para poder generar el contrato** hubo que parchear **sólo el `dist` de la copia** (no el repo): `InsurancePatientSettlementModule` no provee `LinkedOrderDataRepository` ni `InsurancePatientAccountRepository`, y sin eso la aplicación no arranca (`UnknownDependenciesException`). Es un defecto del código ya commiteado, fuera de este alcance: se anota, no se arregla.

## Riesgos residuales
- Las métricas se guardan bajo `SEED.tenantId` (el tenant por defecto): `tenant_id` es obligatorio en la tabla y no existe un tenant de plataforma. Es la deuda TS-07 del backlog de superadmin.
- `service_sli_series` no tiene clave única: dos volcados del mismo minuto dan dos filas **disjuntas** y la lectura debe **sumar**. Si alguien lee por fila, contará de menos.
- Lo agregado en memoria y no volcado se pierde si el proceso cae (a lo sumo `FLUSH_SECONDS`).
- El importe de los cortes de latencia es una estimación por histograma, no un percentil exacto.

## Decisiones y ambigüedades
- «Usuarios activos» se mide desde `iam.sessions` (`sessionsActiveNow`, `usersActiveNow`, `usersActiveInWindow`): no se guarda `user_id` en el middleware por ser dato personal. Confirmar con el usuario y con el DPO.
- «Hoy» = 00:00 UTC por defecto (implementado en H1.2; la respuesta declara `timezone: 'UTC'`). Confirmar con el usuario si se quiere `America/La_Paz`.
