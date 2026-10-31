# Plan — Integración de la API: gates de F0+F1 y modelo F2–F5

- Fecha: 2026-10-31 · Repos afectados: `mantra-core-health-api` (rama `claude/trusting-hawking-q3p12v`, PR #1156 a dev y #1157 a test) · Predecesores: [F0](../2026-10-29-f0-api-estructura-practice/PLAN.md), [F1](../2026-10-29-f1-api-infraestructura/PLAN.md)
- Contrato: `SALUD/Arquitectura/infraestructura-hospitalaria/CONTRATO-F0-F1.md` y `CONTRATO-F2-F5.md` «Desvíos» (repo de documentación).
- Resultado observable: la API de la rama instala, compila, pasa lint/tests/gates, refleja el modelo integrado F2–F5 y, corriendo contra la base local, permite a un OWNER/ADMIN crear sede → área → espacio, editarlo con `If-Match`, moverlo e intentar retirarlo con bloqueos, con 404 desde otra organización.
- Kill-test: `yarn typecheck` sale ≠ 0 después de regenerar entidades, o un `check-in` (insert en `clinical.encounter_locations`) da 23502 por `tenant_id`.

## Alcance
- IN: instalación local con el desvío autorizado (xlsx desde `@e965/xlsx@0.20.3`, nunca commiteado); arreglos en código de F0/F1 que los gates marquen; `database/` vendoreado desde el modelo integrado; entidades regeneradas de los módulos que tocó F2–F5; código existente que inserta en tablas con `tenant_id` NOT NULL nuevo; evidencia y reporte.
- OUT: implementar F2–F5 (servicios/rutas nuevas); el enlace roto preexistente de `docs/trabajo/2026-10-24-seed-dx-devices-us-official/PLAN.md` (anotado); `package.json`/`yarn.lock` (no se commitean).
- Ambigüedades registradas:
  1. El pedido nombra el commit `c470e9f` del modelo, pero la rama ya tiene `81fbd16` (patch `…_integracion_b`, sólo funciones de trigger, nombrado en «Desvíos» del CONTRATO-F2-F5 y ya aplicado en `alovida`). Supuesto: vendorear `81fbd16` (descendiente de `c470e9f`). A confirmar con el orquestador.
  2. `NODE_OPTIONS=--max-old-space-size=6144` para `tsc` (sin él, OOM a 2 GB): es lo que usa `.github/workflows/docs.yml`. Es entorno, no código.

## H1 — Instalación y gates de F0+F1
**CA:** Dado `node_modules` instalado, cuando corren los gates sobre F0+F1, entonces todos salen 0 (salvo hallazgos fuera de alcance anotados).
**DoD:** exit codes pegados en REPORTE.
**Estado:** A MEDIAS (sólo por `docs:validate`, enlace roto preexistente fuera de alcance)

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Instalar con el desvío autorizado y revertir package.json/yarn.lock | `node_modules/xlsx` = `@e965/xlsx 0.20.3`, `git status` limpio | `corepack yarn install` exit 0; `git status --short` vacío | HECHO |
| H1.S2.M1 | typecheck | exit 0 | `yarn typecheck` | HECHO |
| H1.S2.M2 | lint | exit 0 | `yarn lint` | HECHO |
| H1.S2.M3 | build | exit 0 | `yarn build` | HECHO |
| H1.S2.M4 | unit practice + audit-trail + module-layering (+ seed/history de F1) | verde | `yarn test src/modules/practice src/common/audit-trail module-layering.spec` | HECHO |
| H1.S2.M5 | OpenAPI + docs | generate 0, validate 0 o hallazgo ajeno | `yarn docs:openapi:generate`, `yarn docs:validate` | A MEDIAS |
| H1.S2.M6 | vendor check + orm:audit | exit 0 | `yarn db:vendor:check`, `orm:audit` | HECHO |

## H2 — Modelo F2–F5 en la API
**CA:** Dado el modelo integrado, cuando se vendorea y se regeneran entidades, entonces `database/` coincide con el snapshot, las entidades tienen las columnas nuevas y el typecheck sigue en 0.
**DoD:** `db:vendor:check` exit 0 contra el snapshot; `yarn typecheck` exit 0; `yarn lint` exit 0.
**Estado:** HECHO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Vendorear `database/` desde `git archive` del modelo | check exit 0 | `MODEL_REPO=<snap> yarn db:vendor:check` | HECHO |
| H2.S2.M1 | `gen_entities.py` de 08, 10, 14, 16, 17, 23, 25, 29, 41, 53 (+ los que toque) + prettier + `docs:tsdoc` | columnas nuevas presentes | `git diff --stat src/**/entities` | HECHO |
| H2.S2.M3 | `care_spaces.ops_version` (NOT NULL DEFAULT 1 sólo en la base) se escribe al crear | int-spec F0 verde | `yarn test:integration … practice-structure-tenancy` | HECHO |
| H2.S2.M2 | Escrituras existentes en tablas con `tenant_id` NOT NULL nuevo escriben `tenant_id` | typecheck 0 y unit verde | `yarn typecheck`; tests de los servicios tocados | HECHO |

## H3 — Punta a punta
**CA:** Dado `seed:boot` y la API arriba, cuando se recorre la cadena con curl, entonces cada mutación se relee igual desde la base y la API, y desde otro tenant responde 404.
**DoD:** salidas de `seed:boot`, `/health`, int-specs de F0/F1 y curl pegadas.
**Estado:** HECHO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | `seed:boot` y API arriba | `/health` 200 | `curl /health` | HECHO |
| H3.S2.M1 | int-spec F0 | verde | `yarn test:integration --runInBand test/integration/practice-structure-tenancy.int-spec.ts` | HECHO |
| H3.S2.M2 | int-spec F1 | verde | `yarn test:integration --runInBand test/integration/practice-infrastructure.int-spec.ts` | HECHO |
| H3.S3.M1 | Cadena curl sede→área→espacio→PATCH If-Match→move→retire bloqueado, con psql | salidas coinciden | curl + psql | HECHO |
| H3.S3.M2 | 404 cruzado entre organizaciones | 404 | curl | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Disco ~7 GB | install/snapshots llenan el disco | un solo `node_modules`, un snapshot a la vez |
| Vault desfasado al regenerar entidades | FKs/comentarios espurios | conservar sólo los cambios de las tablas de F2–F5 (patrón F1) |
| `yarn install` posterior con package.json original | 403 y pérdida de xlsx | no reinstalar; documentado en ENTORNO-LOCAL |
