# Plan — Superadministración de AloVida (lado API)

- Fecha: 2026-10-17 · Repos afectados: mantra-core-health-api (este), mantra-core-health, mantra_core_technologies_health_docs · Predecesor: `docs/admin-portal/implementation-status.md`
- Plan completo y decisiones: ver el plan aprobado (sesión 01BZAD7AhJktetTdBRayMtZ5); este archivo recoge las microtareas de la API.
- Resultado observable: el superadmin `admin@alovidasalud.com` (sólo local/dev) lee desde `GET /admin/ops/traffic*` solicitudes/éxitos/fallos/latencia/usuarios activos/endpoints de hoy, y desde `GET /admin/qa/flows*` el árbol de flujos ligado a QA Lab; el catálogo de datos admite fichas importadas de la bóveda.
- Kill-test: `curl /admin/ops/traffic` con el token del superadmin tras 20 peticiones devuelve `requests<20` o contiene un UUID → no está hecho.

## Alcance
- IN: H0.1 credencial, H1 (middleware + lecturas de tráfico), H2.1–H2.2 (origen `IMPORTED_VAULT`, importador, esquemas), H3 (flujos), H4.1.3 (ADR-0026), H5.1.
- OUT: cualquier cambio de modelo/DDL (`check_ddl_sources.py` debe seguir en PASS), sembrar roles operativos (TS-10), cross-tenant (TS-05), producción.
- Ambigüedades: ver el plan aprobado §Decisiones y ambigüedades.

## H0 — Acceso del superadmin
| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H0.1.1 | `.env.example:287-288` → `admin@alovidasalud.com` con aviso «sólo local y dev» | grep encuentra la línea comentada y el aviso | `grep -n 'BOOTSTRAP_ADMIN_EMAIL=admin@alovidasalud.com' .env.example` → `289:# BOOTSTRAP_ADMIN_EMAIL=admin@alovidasalud.com` | HECHO |
| H0.1.2 | ~~Caso nuevo en `bootstrap-admin-seed.service.spec.ts`~~ | — | — | DESCARTADO: ya existe `se niega en producción sin autorización explícita` (spec `:92-100`) con las mismas aserciones; duplicarlo no aporta. Decidido al leer el spec (2026-10-17) |
| H0.1.3 | Sembrar y verificar login + 4 lecturas 200 | `POST /iam/auth/login` 200 con `SUPERADMIN`; 4 GET → 200 | curl + salida literal | HECHO (VERIFIED local) · `evidencia/H0.1.3-*.txt` |

## H1 — Observabilidad HTTP
| ID | Microtarea | DoD | Estado |
|---|---|---|---|
| H1.1.1 | `http-sli.aggregator.ts` puro | `yarn test src/observability/http-sli/http-sli.aggregator.spec.ts` | HECHO (TESTED) |
| H1.1.2 | `http-sli.middleware.ts` + env | spec + `grep -c 'originalUrl\|req.url\|req.query\|req.body\|req.headers' …middleware.ts` → 0 | HECHO (TESTED) |
| H1.1.3 | `http-sli-flush.service.ts` + módulo | spec | HECHO (TESTED) |
| H1.1.4 | Registro en `main.ts`/`app.module.ts`, variables | `yarn typecheck && yarn lint` | HECHO (VERIFIED local): 21 peticiones reales → 21 solicitudes medidas, 3 de 4xx, sin `/health` y sin UUID en ninguna serie · `evidencia/H1.1.4-trafico-real.txt` |
| H1.1.5 | Un 404 llega como `UNMATCHED` y no como `/{*all}` (hallado por la corrida real) | spec del agregador; petición real a ruta inexistente | HECHO (VERIFIED local) · `evidencia/H1.1.4-unmatched-real.txt` |
| H1.2.1 | `route-index.service.ts` | spec; `lookup('GET','/admin/catalog/schemas')` = `DataCatalogController_listSchemas` | HECHO (TESTED) · `evidencia/H1.2.1-route-index.txt` |
| H1.2.2 | `latency-buckets.ts` | spec | HECHO (TESTED) · `evidencia/H1.2.2-latency-buckets.txt` |
| H1.2.3 | Repositorio de tráfico + int-spec | `yarn test:integration test/integration/ops-traffic.int-spec.ts` | HECHO (TESTED contra Postgres real, 7/7) · `evidencia/H1.2.3-ops-traffic-int-spec.txt` |
| H1.2.4 | Servicio + controlador + openapi | `yarn test src/modules/ops_console`; `docs:openapi:check-breaking` 0 | HECHO (TESTED) · `evidencia/H1.2.4-*.txt` |

## H2 — Catálogo de datos
| ID | Microtarea | DoD | Estado |
|---|---|---|---|
| H2.1.1 | `origin` en `UpsertAnnotationDto` y servicio | spec del servicio | TODO |
| H2.1.2 | Parser `tools/catalog/lib/vault-notes.mjs` | `node --test tools/catalog/test/vault-notes.test.mjs` | TODO |
| H2.1.3 | CLI `import-vault-annotations.mjs` | `--dry-run` reporta 2601 E y 6783 FK | TODO |
| H2.1.4 | Caso de integración | `yarn test:integration … -t vault` | TODO |
| H2.2.2 | Generador de descripciones de esquema | `node tools/catalog/generate-schema-descriptions.mjs && yarn typecheck` | TODO |
| H2.2.3 | `listSchemas()` anexa `description` | spec + `check-breaking` 0 | TODO |

## H3 — Catálogo de flujos
| ID | Microtarea | DoD | Estado |
|---|---|---|---|
| H3.1.1 | `flow-catalog.ts` + schema + spec | `yarn test src/modules/qa_lab/domain/flow-catalog.spec.ts` | TODO |
| H3.1.2 | `1.3`, `2.6`, `2.7` `.flow.json` | spec 'catálogo real' | TODO |
| H3.2.1 | `qa-flows-seed.service.ts` | spec; `SEED_QA_FLOWS=true yarn seed:boot` | TODO |
| H3.2.2 | `qa-flows.int-spec.ts` | `yarn test:integration test/integration/qa-flows.int-spec.ts` | TODO |
| H3.3.1–2 | Repositorio + `qa-flows.service.ts` + 2 `@Get` | spec; `check-breaking` 0 | TODO |

## H4 / H5
ADR-0026, `implementation-status.md`, `REPORTE.md` (H4.1.3); seed de endpoints y `endpoints-coverage` (H5.1).

## Riesgos
Ver plan aprobado §Riesgos. Entorno: sin `node_modules` ni Postgres en esta sesión → todo DoD que los requiera se declara `NOT_RUN`/`BLOQUEADO`, nunca `PASS`.
