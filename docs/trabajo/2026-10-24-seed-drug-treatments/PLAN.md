# Plan — Tratamientos farmacológicos por enfermedad (relaciones publicadas)

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` (rama `justin/seed-drug-treatments`, PR contra `dev`) · Predecesor: catálogo de medicamentos (`build-medicine-catalog.mjs`, code system `vademecum`) y, en paralelo, `justin/seed-diseases`.
- Resultado observable: un importador idempotente en `tools/terminology-import/drug-treatments/` que baja fuentes publicadas, normaliza cada relación fármaco → enfermedad **con su tipo exacto y su procedencia** a NDJSON fuera de git y la puede cargar a `terminology.*` sin DDL; un reporte de cobertura y saturación en `docs/seed-research/drug-treatments.md`.
- Kill-test: `node --test tools/terminology-import/drug-treatments/test/*.test.mjs` en rojo, o una fila del NDJSON sin `source.recordId`/`source.uri`/`source.version`/`source.retrievedAt`, o una relación cuyo tipo no sea uno de los que declara la fuente.

## Alcance
- IN: `tools/terminology-import/drug-treatments/**`, `docs/seed-research/drug-treatments.md`, este directorio de trabajo.
- OUT: DDL, migraciones, `synchronize`; archivos compartidos del seed (`src/common/seed/**`), salvo que haga falta un cambio mínimo aditivo (no previsto); procedimientos y terapias no farmacológicas (sesión hermana `justin/seed-procedures-treatments`); dosis, posologías, interacciones.
- Ambigüedades registradas:
  1. **`concept_relationships` no guarda fuente ni evidencia por fila** (sólo origen, destino, tipo y ordinal; `database/SQL/03_terminology/02_tables.sql`). El pedido dice «si no puede, pará y reportá la propuesta». Supuesto tomado: se para la escritura de aristas directas fármaco → enfermedad; la propuesta para el repo del modelo queda en el reporte. Mientras tanto, el cargador guarda cada relación como **concepto-afirmación** en un code system propio (procedencia en `concept_properties`) y sólo enlaza con `concept_relationships` estructurales (afirmación → fármaco, afirmación → enfermedad). La carga real (`--apply`) contra una base compartida queda a decisión del propietario. Confirmar con: Justin.
  2. La red del entorno bloquea las fuentes oficiales (MED-RT, ChEMBL, ClinicalTrials.gov, RxNav, EMA, OMS, Wikidata, openFDA, DailyMed, NCBI, CTD, AEMPS, minsalud.gob.bo…). Supuesto: se usan sólo copias publicadas por los propios autores en GitHub (alcanzable), con commit fijado; lo bloqueado queda como hueco documentado con el host exacto. Confirmar con: Justin (ampliar la lista de dominios del entorno).
  3. Ninguna fuente alcanzable trae ATC; el enlace con `vademecum` (ATC nivel 5) necesita un cruce publicado (ChEMBL, Wikidata, RxNorm-ATC), hoy bloqueado. Supuesto: el resolvedor queda listo y el hueco se mide.

## H1 — Fuentes y procedencia
**CA:** Dado el entorno, cuando corro `fetch-sources.mjs`, entonces cada fuente queda clonada en el commit fijado fuera de git con el SHA-256 de cada archivo usado.
**DoD:** `node tools/terminology-import/drug-treatments/fetch-sources.mjs` → manifiesto con commit y hashes. **Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Registro de fuentes con licencia y commit | cada fuente tiene repo, commit, licencia, archivos | test `sources` | HECHO |
| H1.S1.M2 | Clonado reproducible y manifiesto | el commit clonado = el fijado | corrida de `fetch-sources.mjs` | HECHO |

## H2 — Normalización
**CA:** Dadas las fuentes, cuando corro `build-drug-treatments.mjs`, entonces cada relación sale con tipo exacto, códigos estándar de fármaco y enfermedad, y procedencia completa; los duplicados se agrupan por código.
**DoD:** `node --test tools/terminology-import/drug-treatments/test/*.test.mjs` en verde; corrida del build con conteos. **Estado:** HECHO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Parser LabeledIn (experto y crowd) | filas reales de fixture → afirmaciones esperadas | test | HECHO |
| H2.S1.M2 | Parser PharmacotherapyDB | DM/SYM/NOT conservados | test | HECHO |
| H2.S1.M3 | Parser DrugCentral 2016 | sin SNOMED; CUI y DOID conservados | test | HECHO |
| H2.S1.M4 | Parser DrugMechDB | par MeSH–MeSH con ids de camino | test | HECHO |
| H2.S1.M5 | Parser MAxO (sólo extensión CHEBI) | relación literal de la fuente | test | HECHO |
| H2.S2.M1 | Cruces publicados (MONDO SSSOM, DO, DrugCentral ids) | cada salto registra fuente y predicado | test | HECHO |
| H2.S3.M1 | Dedupe por código y estadística de pasadas | pares nuevos por pasada | corrida del build | HECHO |

## H3 — Carga y enlace
**CA:** Dada una base desechable con el DDL vendorizado, cuando cargo dos veces, entonces la segunda inserta 0 filas; el validador mide cuántas afirmaciones resuelven contra enfermedades y medicamentos cargados.
**DoD:** Postgres 16 local + `database/SQL` + `load-drug-treatments.mjs --apply` ×2 + `validate-links.mjs`. **Estado:** A MEDIAS (carga e idempotencia HECHO; enlace real pendiente de `justin/seed-diseases`)

## H4 — Gates y entrega
**DoD:** `corepack yarn typecheck`, `corepack yarn lint`, tests dirigidos; `docs/seed-research/drug-treatments.md` con pasadas; PR contra `dev`. **Estado:** HECHO

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Red bloqueada para fuentes oficiales | corpus mucho menor que el pedido | hueco documentado por host; `/loop` re-sondea los hosts en cada pasada |
| `justin/seed-diseases` no existe aún | no se mide enlace | `validate-links.mjs` listo; se re-mira en cada pasada |
| Tipos negativos (no indicación) mal leídos por un consumidor | riesgo clínico | propiedad `polarity` y tipo propio; nunca un genérico «trata» |
