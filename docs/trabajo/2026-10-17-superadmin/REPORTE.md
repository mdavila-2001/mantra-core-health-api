# Reporte — Superadministración de AloVida (lado API)

> **AVANCE: 25 / 28 — 89,3 %.** (`microtareas HECHO / total` del PLAN.md de este repo; `DESCARTADO`, `BLOQUEADO` y `A MEDIAS` no suman. Hecho: H0.1.1, H0.1.3, H1.1.1–H1.1.5, H1.2.1–H1.2.4, H2.1.1–H2.1.4, H2.2.1–H2.2.3, H3.1.1–H3.1.2, H3.2.1–H3.2.2, H3.3.1–2, H4.1.1–H4.1.2. Pendientes: H5.1.1, H5.1.2; descartada: H0.1.2.)

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
| H2.1.1 | Origen `IMPORTED_VAULT` en la API: queda en borrador, no se envía a revisión (422), no pisa una ficha escrita a mano ni una que ya entró a revisión (422 `MANUAL_REVISION_EXISTS`); la evidencia repetida no se duplica | `originViolations` + `data-catalog.int-spec` contra PostgreSQL real | 28/28 (las 21 previas + 7 nuevas) · `evidencia/H2.1.1-data-catalog-int-spec.txt` |
| H2.1.2 | Lector de la bóveda y criterio de plantilla (repetición ≥3 o esqueleto generado conocido) | `yarn catalog:import-vault:test` | 27/27 · `evidencia/H2.1.2-tests-importador.txt` |
| H2.1.3 | Importador `import-vault-annotations.mjs`: dry-run sobre la bóveda (2 601 notas, 1 245 conjuntos de índices, 1 356 tablas/vistas, 6 783 FK) y `--apply --schema iam` real ×2: 14 fichas + 62 evidencias de FK, 2.ª corrida sin cambios; en la base 14 fichas `IMPORTED_VAULT` en `DRAFT`, 0 aprobadas, 76 evidencias distintas | `node tools/catalog/import-vault-annotations.mjs --apply --schema iam` ×2 + `psql` | `evidencia/H2.1.3-*.txt` |
| H2.1.4 | Casos de integración de la importación (6) | `data-catalog.int-spec` | ver H2.1.1 |
| H2.2.1 | Notas de módulo M67 `data_catalog` y M68 `qa_execution` en la bóveda (repo de docs), que no existían, y alta en el dominio «Operaciones de Plataforma» | `node tools/catalog/generate-schema-descriptions.mjs` | 67 schemas con descripción · `evidencia/H2.2-schemas-real.txt` |
| H2.2.2 | Generador de la explicación por schema desde `SALUD/Módulos/M*.md` (módulos sin propósito → `business: null`; M65/M66 sin formato estándar se declaran) | `yarn catalog:schemas --check`, `module-notes.test.mjs` 8/8 | al día · 69 notas leídas |
| H2.2.3 | `GET /admin/catalog/schemas` trae `description`; contrato con `origin` en `UpsertAnnotationDto` (+19 líneas, 0 incompatibles) | `schema-description.spec.ts` 6/6 (encontró un defecto: `describeSchema('constructor')`) + petición real | 61 schemas, 59 con descripción, 2 sin ella (`medical_groups`, `surveys`) · `evidencia/H2.2-schemas-real.txt` |
| H1.2.1 | Índice de rutas en proceso (`RouteIndexService`); sus operationId coinciden con los del contrato publicado | `yarn test src/observability/route-index` | 20 pruebas, incluida la comparación contra `openapi.json` · `evidencia/H1.2.1-route-index.txt` |
| H1.2.2 | Percentiles desde histograma acumulado (`latency-buckets.ts`) | `yarn test src/modules/ops_console/domain` | verde · `evidencia/H1.2.2-latency-buckets.txt` |
| H1.2.3 | Lecturas de tráfico y usuarios activos (`ops-traffic.repository.ts`) contra Postgres real: suma exacta de lo que escribe `http-sli`, ventana sin filas, dimensiones corruptas, filtro por serie/tenant/ventana, sesiones, RLS con rol sin privilegios | `OPS_TRAFFIC_IT_DB_URL=… yarn test:integration test/integration/ops-traffic.int-spec.ts` | 7/7 · `evidencia/H1.2.3-ops-traffic-int-spec.txt`. Encontró un bug real (un `?` en una regex lo leía MikroORM como parámetro) |
| H1.2.4 | `GET /admin/ops/traffic` y `GET /admin/ops/traffic/endpoints` (servicio, DTOs, `OPS_READ_ROLES`, ventana inválida → 422) y contrato publicado | `yarn test src/modules/ops_console src/observability`; ESLint; `tsc`; `check-breaking` | 192/192 · ESLint exit 0 · `tsc` 0 fuera de `xlsx` · «Sin cambios incompatibles» · `evidencia/H1.2.4-*.txt` |

| H3.1.1 | Formato del flujo, validador (`flow-catalog.ts`), JSON Schema y orden de recorrido | `yarn test src/modules/qa_lab/domain` | 51 pruebas · `evidencia/H3.1.1-spec-flow-catalog.txt` |
| H3.1.2 | Tres flujos (`1.3` Agendar hora, `2.6` Consulta y ficha, `2.7` Facturación) con 27 casos de estado HTTP **observado** | `python3 verify.py` contra la API real (login + cada caso) | 27 casos, 0 discrepancias · `evidencia/H3.1.2-casos-contra-api-real.txt` |
| H3.2.1 | Seed opt-in `SEED_QA_FLOWS` de las suites `FLOW-<id>` (idempotente, sin DELETE, se niega en producción) | `SEED_QA_FLOWS=true node dist/src/seed-cli.js` ×2 | 1.ª: 3 suites, 27 casos, 27 aserciones, 0 casos sin aserción, 0 conceptos huérfanos; 2.ª: `inserted:0`, `row_version` sin cambio · `evidencia/H3.2.1-*.txt` |
| H3.2.2 | El runner M68 ejecuta el flujo sembrado y la lectura ve el veredicto por rama | `DATA_CATALOG_IT_DB_URL=… test/integration/qa-flows.int-spec.ts` | 7/7 contra Postgres real; destino = doble que hace de la API · `evidencia/H3.2.2-qa-flows-int-spec.txt` |
| H3.3.1–2 | `GET /admin/qa/flows` y `/:flowId` (contrato `DECLARED/MISSING`, cobertura, deriva, último veredicto por rama) | `yarn test src/modules/qa_lab src/observability/route-index`; `check-breaking`; petición real | 215/215; «Sin cambios incompatibles» (+118 líneas, 0 borradas); API real: 22/22 endpoints `DECLARED`, 404 flujo inexistente, 400 filtro inválido, 401 sin token · `evidencia/H3.3-*.txt` |

| H4.1.1 | ADR-0027 «Métricas HTTP en proceso sobre `service_sli_series`, sin datos de personas» (el 0026 ya era «molde de módulo DDD») | `node tools/docs/check-doc-links.mjs` | «1070 enlaces internos verificados… Sin enlaces rotos» · `evidencia/H4.1-docs-links.txt` |
| H4.1.2 | `implementation-status.md` con los incrementos 6–8, la importación de la bóveda marcada como hecha y lo que sigue pendiente | `git diff --numstat docs/admin-portal` | +14 −2 (las 2 líneas modificadas son los pendientes #3 y #5) |

Conjunto final sobre el código ya formateado: **ESLint exit 0, Jest 53/53** (incluye `app.module.wiring.spec.ts`), `tsc` sin errores en mis archivos → `evidencia/H1.1-*.txt`.

## A medias

Ninguna.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H0.1.2 | `DESCARTADO` | El spec ya cubre producción sin autorización (`bootstrap-admin-seed.service.spec.ts:92-100`); 11/11 verdes |
| H5.1.1, H5.1.2 | `TODO` | Segunda entrega: seed por endpoint y `endpoints-coverage`; depende del índice de rutas (hecho) |

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

- **H3 · El runner M68 no se ejercitó contra la API real.** El int-spec usa un destino que hace de la API (doble declarado, regla 65). La API real se ejerció aparte con los 27 casos (H3.1.2), y la lectura (`/admin/qa/flows`) contra la API real y Postgres real; pero «Ejecutar» un plan sobre `FLOW-1.3` apuntando a la propia API (con credencial del destino y aprobación por otra identidad) queda para H5.
- **H3 · 39 de las 66 ramas no tienen caso** (27 sí) y todas lo dicen (`reason`): las `HAPPY_PATH` de los POST necesitan un identificador producido por el paso anterior y el runner aún no encadena respuestas (pendiente #5 del portal); los `gap` no tienen endpoint. Ningún caso «sin token»: el runner siempre envía la credencial del destino.
- **H3 · Un destino de QA para flujos debe permitir mutaciones.** Los casos incluyen `POST` con cuerpos inválidos o ids inexistentes (la API los rechaza), pero el guard no puede saberlo: sin `allowMutations`, el preflight los marca `MUTATION_NOT_ALLOWED` (probado) y el plan exige aprobación.
- **H3 · Autorización de `GET /admin/qa/flows*`** cubierta por metadatos `@Roles` (spec), 401 sin token (petición real); **no** se probó un 403 con un rol ajeno por petición.

## Desvíos del plan
- **H3.1 · No hizo falta tocar `nest-cli.json`.** El plan preveía copiar `flows/catalog/*.json` como *assets*; los JSON se importan de forma estática desde `flows/index.ts` (mismo patrón que los *datasets* de los seeds) y `tsc` los emite a `dist` (comprobado: `dist/src/modules/qa_lab/flows/catalog/*.json`).
- **H3.3 · Sin repositorio nuevo.** El plan decía ampliar `qa-catalog.repository.ts`; `QaFlowsService` lee con `EntityManager` como `QaLabReadService`, que es el patrón del resto de las lecturas del portal, y sólo lee.
- **H3.2 · El `ordinal` de los casos sigue el recorrido en profundidad del árbol** (no el orden del archivo): es el orden en que la pantalla dibuja las ramas.
- **ADR renumerado.** El plan decía ADR-0026, pero ese número ya lo usa «molde de módulo DDD»; el ADR de métricas HTTP será **ADR-0027**.
- **H2.1.3 · FK como evidencia, no como ficha de columna.** El plan decía «FK → ficha de la columna con `valueDomain:'FK → …'`». Escribir ~6 800 fichas de columna en borrador sólo para repetir lo que `pg_catalog` ya da (la FK) ensuciaba el inventario; cada nota de FK se importa como **evidencia `VAULT_NOTE` de su columna** con el destino y el criterio (`puml`, convención, inferido…), que es lo único que la bóveda añade.
- **H2.1.1 · `REVIEW_ALREADY_STARTED` es defensa en profundidad.** Una ficha enviada por una persona siempre tiene su última revisión `MANUAL`, así que en la práctica gana `MANUAL_REVISION_EXISTS`; la regla extra queda probada en el unitario.
- **`SeriesIngestRepository` se provee en `HttpSliModule`** en vez de importar `TimeSeriesModule`: ese módulo no lo exporta y no hacía falta tocarlo. El repositorio no tiene dependencias.
- **`H0.1.2` descartada** (ya cubierta).
- **Entorno de pruebas:** `cdn.sheetjs.com` (de donde viene `xlsx`) está denegado por el proxy de la sesión, así que `yarn install` del repo falla. Se trabajó en una **copia fuera del repo** (`scratchpad/api-work`) sin `xlsx`, con un *stub* vacío, instalada con Yarn 4.14.1 obtenido de `@yarnpkg/cli-dist` (registro npm permitido). `package.json` y `yarn.lock` del repo **no se tocaron**.
- El valor por defecto del código es **apagado**; sólo el `.env.example` de desarrollo lo enciende.

- **Contrato OpenAPI parcial a propósito.** Regenerado con el generador oficial (en la copia, contra un Postgres 16 descartable), `openapi.json` traía además deriva ajena a este trabajo: la operación `GET /identity/verification-cases/{id}`, `PUT /practitioners/me/sites/{siteId}/contact-phone`, el esquema `SetSiteContactPhoneDto` y cambios en 3 esquemas (`CreateOwnSiteDto`, `IdentityAssuranceRequest*Dto`). Se insertaron **sólo** `GET /admin/ops/traffic` y `GET /admin/ops/traffic/endpoints` (+257 líneas, 0 borradas; la serialización reproduce el archivo commiteado byte a byte). Quien posea esos otros cambios debe regenerar el contrato.
- **Para poder generar el contrato** hubo que parchear **sólo el `dist` de la copia** (no el repo): `InsurancePatientSettlementModule` no provee `LinkedOrderDataRepository` ni `InsurancePatientAccountRepository`, y sin eso la aplicación no arranca (`UnknownDependenciesException`). Es un defecto del código ya commiteado, fuera de este alcance: se anota, no se arregla.

## Hallazgos de H3
- **Pasos que la fuente pide y el contrato no tiene** (marcados `gap`, no inventados): datos de facturación del paciente (NIT / razón social) y autocompletar por NIT; aviso al paciente en espera cuando se libera un horario (la promoción existe, el envío no); enlace único con receta + laboratorios + análisis; cronograma de tomas con alarmas por medicamento (los recordatorios existentes son de citas); QR por monto de consulta (lo más cercano: `/payments/checkout-sessions`, `PUT /practitioners/me/sites/{siteId}/bank-qr`); comprobante de pago al paciente; periodicidad de la facturación a la aseguradora.
- **Teleconsulta ya tiene endpoint** (`POST /virtual-encounters`) aunque «si entra en esta etapa» sea una decisión que no es del equipo; el flujo 2.6 lo modela como rama límite y lo deja en `openQuestions`.
- `GET /practitioners/{profileId}/sites` sin cabecera de organización responde **422** (no 400/401): se registró como caso inválido observado.
- Las búsquedas toleran parámetros inválidos (`limit=0`, `cursor=zzz`, `insuranceCarrierId=abc` → 200): se registró como caso límite observado, no como defecto.
- El int-spec encontró un defecto del seed propio: `isDeepStrictEqual` sobre el `jsonb` leído marcaba 16 casos como cambiados en cada pasada (prototipo distinto); se comparó por valor JSON (`sameJson`).

## Hallazgos de H2.2
- 10 de los 69 módulos de la bóveda no traen «Propósito de negocio» (M00, M08, M16, M17, M18, M21, M33, M34 y los resúmenes M65/M66, que ni siquiera tienen el formato estándar): su explicación de negocio queda en `null` y la pantalla lo dice. Entre ellos están `clinical`, `accounting` y `billing`.
- Los módulos 67 y 68 no tenían nota en la bóveda; se escribieron con lo medido en la base. Queda **supuesto** que ambos pertenecen a «Operaciones de Plataforma» (el `qa_lab`, del que depende el 68, está en «Clínico y Diagnóstico»): confirmar con quien gobierna el modelo. Las notas `E data_catalog.*` y `E qa_execution.*` siguen sin existir.
- La propia nota M46 `platform_ops` tiene su propósito cortado a media frase («…their»): es un defecto de la bóveda, mostrado tal cual.

## Hallazgos de H2.1
- **El texto de «Negocio / Ejemplo / Por qué / Sistema» de la bóveda es casi todo plantilla generada:** 111 variantes de «Negocio» cubren 2 580 textos; sólo 26 de las 1 356 tablas/vistas tienen texto propio completo (p. ej. `audio_assets`). Se importa igualmente, pero marcado como plantilla y como borrador; la explicación real de cada tabla sigue sin escribirse. Decisión del dueño de negocio: quién redacta.
- 1 245 de las 2 601 «entidades» son conjuntos de índices (`tipo/index_set`), no tablas.
- 22 notas de FK no declaran destino y 172 son «inferido»: son la parte menos confiable de las «relaciones».

## Riesgos residuales
- Las métricas se guardan bajo `SEED.tenantId` (el tenant por defecto): `tenant_id` es obligatorio en la tabla y no existe un tenant de plataforma. Es la deuda TS-07 del backlog de superadmin.
- `service_sli_series` no tiene clave única: dos volcados del mismo minuto dan dos filas **disjuntas** y la lectura debe **sumar**. Si alguien lee por fila, contará de menos.
- Lo agregado en memoria y no volcado se pierde si el proceso cae (a lo sumo `FLUSH_SECONDS`).
- El importe de los cortes de latencia es una estimación por histograma, no un percentil exacto.

## Decisiones y ambigüedades
- «Usuarios activos» se mide desde `iam.sessions` (`sessionsActiveNow`, `usersActiveNow`, `usersActiveInWindow`): no se guarda `user_id` en el middleware por ser dato personal. Confirmar con el usuario y con el DPO.
- «Hoy» = 00:00 UTC por defecto (implementado en H1.2; la respuesta declara `timezone: 'UTC'`). Confirmar con el usuario si se quiere `America/La_Paz`.
