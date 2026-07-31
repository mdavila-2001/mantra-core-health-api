# Inventario del sistema

> Fase 2 del Plan Maestro de Documentación. Inventario estructural completo por módulo, contrastado
> entre el árbol real del repositorio, el analizador REDESA (`tools/redesa/coverage-report.mjs`) y
> el grafo de Graphify (`docs/reports/graphify-audit.md`). Fecha: 2026-07-29, commit `15c132d3`.

## 1. Método

Conteo por `find` sobre `src/modules/*/` (convención de nombres de archivo NestJS/MikroORM
estándar del proyecto), contrastado contra:

- `tools/redesa/coverage-report.mjs` (fuente de verdad para endpoints y entidades — parsea
  decoradores HTTP y mapeo ORM real, no solo nombres de archivo);
- `graphify-out/graph.json` (fuente de verdad para topología de dependencias, no para conteo de
  endpoints).

## 2. Reconciliación de conteo de módulos: 60 directorios, 57 "módulos de negocio"

`src/modules/` contiene **60 directorios**, cada uno con su propio `*.module.ts`. El analizador
REDESA reporta **57 módulos** porque cuenta módulos que poseen al menos una entidad ORM
(`Set` de `module` sobre las 1184 entidades). Los 3 directorios sin entidad propia son módulos de
infraestructura de datos que envuelven un almacén distinto a PostgreSQL, no dominios de negocio:

| Directorio | Por qué no tiene entidades propias |
|---|---|
| `document_store` | Persiste en MongoDB (`MONGODB_URI`), no en Postgres/MikroORM |
| `redis_runtime` | Envuelve el cliente Redis (`ioredis`), estado efímero, no entidades |
| `search_platform` | Envuelve el cliente OpenSearch, índices, no entidades relacionales |

**No es una inconsistencia** — es una diferencia de criterio de conteo entre "directorio de
módulo NestJS" (60) y "dominio de negocio con entidades propias" (57). Ambas cifras se usan en
este plan según el contexto: 60 para inventario estructural completo (este documento), 57 cuando
se habla de "módulos de negocio" con catálogo de datos propio.

## 3. Inventario completo por módulo

Columnas: Controllers · Services · Repositories · Entities · DTOs · Unit specs · README propio.

| Módulo | Ctrl | Svc | Repo | Ent | DTO | Spec | README |
|---|---:|---:|---:|---:|---:|---:|:---:|
| `system_ops` | 8 | 7 | 8 | 30 | 10 | 9 | ✅ |
| `consent` | 8 | 8 | 9 | 10 | 12 | 9 | ✅ |
| `insurance` | 7 | 7 | 6 | 29 | 8 | 0 | ✅ |
| `community` | 7 | 7 | 15 | 38 | 16 | 14 | ✅ |
| `clinical_ext` | 7 | 7 | 11 | 12 | 8 | 14 | ✅ |
| `authz` | 7 | 7 | 14 | 15 | 17 | 13 | ✅ |
| `accounting` | 7 | 7 | 9 | 42 | 8 | 9 | ✅ |
| `terminology` | 6 | 6 | 9 | 15 | 11 | 12 | ✅ |
| `identity_assurance` | 6 | 6 | 8 | 11 | 14 | 8 | ✅ |
| `practice` | 5 | 6 | 11 | 11 | 13 | 7 | ✅ |
| `forms` | 5 | 5 | 6 | 16 | 13 | 6 | ✅ |
| `diagnostic_units` | 5 | 4 | 10 | 10 | 10 | 6 | ✅ |
| `delegated_access` | 5 | 5 | 7 | 7 | 12 | 10 | ✅ |
| `common` | 5 | 4 | 7 | 7 | 4 | 9 | ✅ |
| `clinical` | 5 | 11 | 12 | 22 | 11 | 15 | ✅ |
| `scheduling` | 4 | 4 | 4 | 16 | 3 | 6 | ✅ |
| `pharmacy_inventory` | 4 | 8 | 13 | 20 | 14 | 3 | ✅ |
| `organization_extensions` | 4 | 4 | 5 | 6 | 8 | 8 | ✅ |
| `integrations` | 4 | 4 | 9 | 10 | 9 | 7 | ✅ |
| `geo` | 4 | 4 | 6 | 6 | 14 | 8 | ✅ |
| `diagnostics` | 4 | 5 | 5 | 36 | 6 | 9 | ✅ |
| `chart` | 4 | 4 | 4 | 11 | 4 | 8 | ✅ |
| `audit` | 4 | 6 | 7 | 123 | 9 | 8 | ✅ |
| `workflow` | 3 | 3 | 3 | 8 | 1 | 5 | ✅ |
| `telemetry` | 3 | 3 | 14 | 14 | 12 | 5 | ✅ |
| `read_models` | 3 | 3 | 8 | 13 | 5 | 6 | ✅ |
| `polyglot_storage` | 3 | 3 | 4 | 20 | 1 | 6 | ✅ |
| `payments` | 3 | 5 | 6 | 53 | 4 | 4 | ✅ |
| `messaging` | 3 | 3 | 4 | 22 | 1 | 6 | ✅ |
| `billing` | 3 | 10 | 10 | 20 | 11 | 13 | ✅ |
| `vector_rag` | 2 | 4 | 3 | 14 | 1 | 5 | ✅ |
| `time_series` | 2 | 4 | 2 | 12 | 1 | 6 | ✅ |
| `qa_lab` | 2 | 2 | 2 | 13 | 1 | 4 | ✅ |
| `promotions` | 2 | 2 | 2 | 11 | 1 | 3 | ✅ |
| `profiles` | 2 | 2 | 13 | 18 | 11 | 4 | ✅ |
| `object_storage` | 2 | 3 | 3 | 17 | 1 | 5 | ✅ |
| `marketing` | 2 | 2 | 2 | 14 | 1 | 3 | ✅ |
| `lakehouse` | 2 | 3 | 3 | 18 | 1 | 4 | ✅ |
| `integration_contracts` | 2 | 4 | 9 | 9 | 13 | 6 | ✅ |
| `iam` | 2 | 6 | 11 | 12 | 16 | 8 | ✅ |
| `health_data` | 2 | 5 | 7 | 34 | 1 | 7 | ✅ |
| `graph_intelligence` | 2 | 3 | 2 | 13 | 1 | 4 | ✅ |
| `directory` | 2 | 3 | 5 | 7 | 14 | 5 | ✅ |
| `cross_store_consistency` | 2 | 4 | 3 | 20 | 1 | 5 | ✅ |
| `automation` | 2 | 4 | 4 | 16 | 1 | 6 | ✅ |
| `tracking` | 1 | 1 | 1 | 8 | 1 | 2 | ✅ |
| `system_context` | 1 | 2 | 1 | 9 | 1 | 3 | ✅ |
| `search_platform` | 1 | 1 | 0 | 0 | 1 | 1 | ✅ |
| `reporting` | 1 | 2 | 2 | 12 | 1 | 3 | ✅ |
| `redis_runtime` | 1 | 1 | 0 | 0 | 3 | 1 | ✅ |
| `procedures_perioperative` | 1 | 3 | 4 | 37 | 1 | 4 | ✅ |
| `platform_ops` | 1 | 4 | 5 | 38 | 1 | 5 | ✅ |
| `pharmacy` | 1 | 6 | 9 | 9 | 9 | 7 | ✅ |
| `health_context` | 1 | 2 | 1 | 10 | 1 | 3 | ✅ |
| `erp` | 1 | 2 | 3 | 51 | 1 | 3 | ✅ |
| `education` | 1 | 2 | 2 | 15 | 1 | 3 | ✅ |
| `document_store` | 1 | 1 | 1 | 0 | 5 | 1 | ✅ |
| `crm` | 1 | 2 | 2 | 32 | 1 | 3 | ✅ |
| `auth_providers` | 1 | 2 | 1 | 9 | 1 | 3 | ✅ |
| `ads` | 1 | 4 | 5 | 73 | 1 | 5 | ✅ |
| **Total** | **191** | **252** | **352** | **1184** | **363** | **365** | 60/60 |

**Cobertura documental de partida:** los **60/60 módulos ya tienen `README.md` propio**
(`src/modules/<módulo>/README.md`), confirmando la política ya vigente descrita en
`ESTADO-Y-PENDIENTES.md` ("Contrato por dominio"). Esto es una base real para Fase 9
(documentación de negocio por módulo): no se parte de cero, se **valida y enriquece** cada README
existente hacia la estructura `docs/modules/<nombre>/{overview,use-cases,endpoints,domain-rules,...}.md`
del plan maestro, en vez de reescribirlo.

## 4. Totales verificados cruzando ambas fuentes

| Métrica | `find` sobre árbol | `tools/redesa/coverage-report.mjs` | Diferencia explicada |
|---|---:|---:|---|
| Controllers | 191 | 191 (191 controllers, 850 endpoints) | Coincide exacto |
| Entities | 1184 | 1184 | Coincide exacto |
| Services | 252 | — (no reportado por el script) | — |
| Repositories | 352 | — | El grafo de Graphify cuenta 335 archivos de repositorio *referenciados* (con al menos una arista); la diferencia (17) son repositorios sin uso detectado por AST o con muy baja conectividad — no se interpreta como huérfano sin revisión manual (Fase 10). |
| Endpoints HTTP | — (no derivable de nombre de archivo) | **850** | Único endpoint mutante sin política `@Roles`/`@Public`: 0 (`ORPHAN_ENDPOINT`) |

## 5. Procesos worker (complementa `docs/architecture/integration-map.md`)

**20 workers**, cada uno mapeado 1:1 a un directorio `src/worker/jobs/<dominio>/` y a un dominio
de `src/modules/`: `automation`, `billing`, `consent`, `cross_store_consistency`,
`delegated_access`, `health_context`, `identity_assurance`, `integrations`, `messaging`,
`pharmacy_inventory`, `promotions`, `qa_lab`, `read_models`, `reporting`, `scheduling`,
`tracking`, `workflow`.

**40 módulos de negocio sin worker propio** (60 directorios − 17 con worker − 3 de infraestructura
sin entidades): operan exclusivamente request/response síncrono vía la API, sin procesamiento
periódico propio. Confirmado contra `ESTADO-Y-PENDIENTES.md` §"P0 · Terminar y operar los
workers", que ya identifica expiraciones/barridos pendientes en varios de los 20 dominios con
worker — el detalle de qué jobs concretos corren en cada uno se documenta en Fase 13
(`docs/operations/runbooks/`).

## 6. Almacenes y componentes de infraestructura

Ver `docs/architecture/integration-map.md` §2-3 (PostgreSQL, MongoDB, Redis, OpenSearch, MinIO;
sin broker de mensajería externo, outbox propio sobre Postgres).

## 7. Brechas de inventario detectadas

- Ninguna: la reconciliación entre árbol de código, analizador REDESA y grafo de Graphify no
  arrojó discrepancias sin explicar (ver §2 y §4).
- Pendiente para Fase 10: revisar los 17 repositorios con baja/nula conectividad en el grafo
  (§4) uno por uno, clasificándolos como catálogo cargado indirectamente, reservado para fase
  futura, o candidato real a eliminación — mismo criterio que `ESTADO-Y-PENDIENTES.md` aplica a
  las 195 entidades candidatas a revisión.
