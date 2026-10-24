# Plan — Procedimientos y tratamientos no farmacológicos, por enfermedad y por parte del cuerpo

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` (rama `justin/seed-procedures-treatments`, PR contra `dev`) · Predecesor: ninguno (sesiones hermanas en paralelo: `justin/seed-diseases`, `justin/seed-medical-dictionaries`, `justin/seed-specialty-services`, `justin/seed-drug-treatments`)
- Resultado observable: quien corre `node tools/terminology-import/procedures-treatments/build.mjs` obtiene, fuera de git, un corpus NDJSON de procedimientos no farmacológicos con dos relaciones publicadas —procedimiento → enfermedad y procedimiento → sitio anatómico—, cada fila con fuente, id de origen, versión, URI, fecha y tipo exacto de la fuente, más un reporte de cobertura. `load.mjs` lo lleva a `terminology.*` sin DDL.
- Kill-test: `grep -c '"relationType"' relations.ndjson` da 0, o una fila sin `provenance.sourceRecordId`/`provenance.uri`, o una relación de ensayo con tipo distinto de «en estudio».

## Alcance
- IN: `tools/terminology-import/procedures-treatments/` (importador, `SOURCES.md`, tests, y desde la orden del propietario del 2026-10-24 también `data/` con el corpus normalizado comprimido), `docs/seed-research/procedures-treatments.md` (bitácora de pasadas y cobertura), este `PLAN.md` y su `REPORTE.md`.
- OUT: DDL, migraciones, `synchronize` (ADR-0021); fármacos (sesión `justin/seed-drug-treatments`); recargar ICHI/ICD-10-PCS/CUPS como conceptos (los carga `justin/seed-specialty-services`; acá solo se referencian por code system + código); anatomía como conceptos (la carga `justin/seed-medical-dictionaries`); enfermedades como conceptos (`justin/seed-diseases`); cualquier archivo compartido fuera de lo declarado.
- Ambigüedades registradas:
  1. **`concept_relationships` no guarda fuente ni evidencia** (solo origen, destino, tipo y ordinal; verificado en `database/SQL/03_terminology/02_tables.sql` y en el modelo canónico `mantra-core-health-model@eceb98f`, SALUD v4.0.10). La consigna dice «pará y reportá la propuesta». Supuesto tomado: se para **la escritura de relaciones en la base** (el cargador se niega a escribirlas mientras la tabla no tenga las columnas propuestas) y se entrega la propuesta para el modelo; el resto de la fase 1 (descubrimiento, descarga, normalización con procedencia completa, cargador listo) sigue, porque no pierde procedencia. Confirmar con Justin.
  2. **Red del entorno**: la política de red de esta sesión rechaza (403 en CONNECT) clinicaltrials.gov, cms.gov, who.int, nlm.nih.gov, ncbi, ebi, minsalud.gov.co, wikidata, nice.org.uk, sanidad.gob.es y nci.nih.gov. Solo llegan GitHub (git, raw, assets de releases), npm y PyPI. Supuesto: se usan únicamente fuentes publicadas por su propio editor en GitHub (MAxO, MONDO, Uberon, NCIt OBO Edition); las demás quedan como hueco documentado con el host que hay que permitir. No se usan espejos de terceros ni WebFetch para datos (WebFetch pasa el contenido por un modelo y no garantiza fidelidad).
  3. MAxO y NCIt no tienen nombres oficiales en castellano: el `display` queda en inglés (etiqueta oficial) y no se agrega traducción propia.

## H1 — Discovery y propuesta de modelo
**CA:** Dado el repo y el modelo canónico, cuando se revisa `concept_relationships`, entonces queda escrito si puede guardar tipo, fuente y evidencia y, si no, la propuesta concreta para el repo del modelo.
**DoD:** sección «Propuesta para el repo del modelo» en `docs/seed-research/procedures-treatments.md` con DDL propuesto; `grep -n concept_relationships database/SQL/03_terminology/02_tables.sql`.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Verificar columnas de `concept_relationships` en API y modelo | columnas listadas | `grep -A12 'concept_relationships" (' database/SQL/03_terminology/02_tables.sql` | HECHO |
| H1.S1.M2 | Escribir propuesta DDL de procedencia | sección presente | `grep -n 'Propuesta para el repo del modelo' docs/seed-research/procedures-treatments.md` | HECHO |
| H1.S1.M3 | Mapear red disponible y fuentes alcanzables | tabla de hosts en la bitácora | `grep -n 'Hosts bloqueados' docs/seed-research/procedures-treatments.md` | HECHO |

## H2 — Normalización con procedencia (fase 1)
**CA:** Dadas las fuentes descargadas en `../glossary-data-build/procedures-treatments/cache`, cuando corre `build.mjs`, entonces escribe `procedures.ndjson`, `relations.ndjson` y `coverage.json`, con ids estables y sin duplicados por código.
**DoD:** `node --test tools/terminology-import/procedures-treatments/test/*.test.mjs` en verde; `node tools/terminology-import/procedures-treatments/build.mjs` dos veces → mismo sha256 de salida.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Parser OBO streaming | test con stanzas reales pasa | `node --test …/test/obo.test.mjs` | HECHO |
| H2.S1.M2 | MAxO POET → procedimiento → enfermedad | tipo de relación = valor literal de la fuente | `node --test …` | HECHO |
| H2.S1.M3 | MAxO `has input` UBERON → sitio | solo `RO:0002233` hacia `UBERON:` | `node --test …` | HECHO |
| H2.S1.M4 | NCIt R163/R165–R171 → sitio | solo procedimientos bajo C25218 | `node --test …` | HECHO |
| H2.S1.M5 | Xrefs publicados MONDO/Uberon para resolver | solo xrefs declarados por la fuente | `node --test …` | HECHO |
| H2.S2.M1 | `build.mjs` + reporte de cobertura | conteos por fuente y huecos | `node …/build.mjs` | HECHO |
| H2.S2.M2 | Idempotencia de la salida | sha256 idéntico en dos corridas | `sha256sum` | HECHO |

## H3 — Cargador idempotente
**CA:** Dado el corpus, cuando corre `load.mjs` sin flags, entonces imprime el plan sin tocar la base; con `--apply` inserta solo conceptos propios y propiedades con `ON CONFLICT DO NOTHING`, y rechaza escribir relaciones si `concept_relationships` no tiene las columnas de procedencia propuestas.
**DoD:** `node …/load.mjs` (dry-run) con conteos; tests del plan de carga; si hay Postgres desechable, dos `--apply` → segunda inserta 0.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Dry-run sin base | imprime conteos y no conecta | `node …/load.mjs` | HECHO |
| H3.S1.M2 | `--apply` idempotente con el DDL canónico | 2.ª corrida inserta 0 | `load.mjs --apply` ×2 en PG desechable | HECHO |
| H3.S1.M3 | Compuerta de relaciones | sin tabla de procedencia → 0 relaciones; con ella → relaciones + procedencia | `load.mjs --apply` en dos bases | HECHO |

## H4 — Saturación
**CA:** Dada la bitácora, cuando se cierran las pasadas, entonces hay dos pasadas seguidas con 0 aportes nuevos (por código) o cada fuente restante figura como hueco con su motivo.
**DoD:** tabla de pasadas en `docs/seed-research/procedures-treatments.md`.
**Estado:** HECHO (saturación relativa a las fuentes alcanzables; ver huecos de red)

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H4.S1.M1 | Pasada 1 (fuentes alcanzables) | fila en la tabla de pasadas | `grep -n '^| 1 |' docs/seed-research/procedures-treatments.md` | HECHO |
| H4.S1.M2 | Pasadas hasta dos seguidas con 0 | dos filas consecutivas con 0 | tabla de pasadas | HECHO |

## H5 — Validación con ramas hermanas y entrega
**CA:** Dadas las ramas hermanas (si existen), cuando se mergean en una rama local de validación, entonces se mide cuántas relaciones resuelven contra sus claves; si no existen, queda marcado pendiente con el script listo.
**DoD:** `node …/validate-siblings.mjs`; `corepack yarn typecheck`; `corepack yarn lint`; tests dirigidos; PR contra `dev`.
**Estado:** EN CURSO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H5.S1.M1 | Typecheck | exit 0 | `corepack yarn typecheck` | HECHO |
| H5.S1.M2 | Lint | exit 0 | `corepack yarn lint` | HECHO |
| H5.S1.M3 | Tests dirigidos | 0 fallos | `node --test tools/terminology-import/procedures-treatments/test/*.test.mjs` | HECHO |
| H5.S1.M4 | Medición con ramas hermanas | reporte `validate-siblings.json` con ramas reales | `node …/validate-siblings.mjs --db` | BLOQUEADO |
| H5.S1.M5 | PR contra `dev` | PR abierto, sin mergear | URL del PR | HECHO |
| H5.S1.M6 | Respaldo del corpus normalizado en git (`data/`, gzip, partes < 45 MB) | `zcat` de cada parte reproduce byte a byte el NDJSON de `build.mjs` | `node …/snapshot.mjs` ×2 → mismos sha256; `zcat data/out/assertions.ndjson.gz \| sha256sum` = sha256 de `out/assertions.ndjson` | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Red bloqueada para las fuentes grandes (ClinicalTrials.gov, ICD-10-PCS, ICHI, CUPS, MeSH) | Corpus chico; procedimientos ICHI/PCS/CUPS sin relaciones | Documentar hosts a permitir; importadores por fuente con caché, listos para correr cuando haya red |
| Modelo sin procedencia por relación | No se pueden cargar relaciones sin perder procedencia | Compuerta en el cargador + propuesta DDL |
| Ramas hermanas inexistentes | No se mide resolución | Script de validación listo; re-chequeo en cada pasada del loop |
| Duplicar code systems con otras sesiones | Conceptos duplicados | Resolver por `code_systems.internal_code` (único) + código; crear solo los code systems propios |
