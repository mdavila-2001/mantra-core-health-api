# Plan — Síntomas y signos exhaustivos, relacionados con enfermedades

- Fecha: 2026-10-24 · Repos afectados: `mdavila-2001/mantra-core-health-api` · Predecesor: glosario ES (19 313 términos) e importadores de `tools/terminology-import/`
- Resultado observable: en `terminology.*` existen los síntomas, signos, hallazgos y fenotipos con jerarquía, designaciones ES/EN y procedencia, y cada enfermedad cargada por `seed-diseases` puede consultarse con sus síntomas, frecuencia y evidencia publicadas.
- Kill-test: correr `load-symptoms.mjs --apply` dos veces contra una base con el DDL del módulo 03 y ver que la segunda inserte filas (no idempotente), o buscar `HP:0001250` y no encontrar «Convulsiones» como designación ES.

> **Desvío declarado:** este plan se escribió **después** de implementar. `AGENTS.md`
> estaba en el repo desde el inicio y no se leyó en el discovery (se buscó `CLAUDE.md`
> y `.claude/rules/`, que no existen). Se reconstruye con los mismos hitos que guiaron
> el trabajo; los estados reflejan lo que tiene DoD ejecutado. Ver REPORTE.md § Desvíos.

## Alcance
- IN: `tools/terminology-import/symptoms/` (importadores, pruebas, propuesta de DDL), `docs/seed-research/symptoms.md`, `docs/trabajo/2026-10-24-seed-symptoms/`, una sección aditiva en `tools/terminology-import/README.md`.
- OUT: entidades, DDL y migraciones (ADR-0021); `src/` (no hizo falta nada en `src/common/seed/data/symptoms/`); los importadores del glosario compartidos; el catálogo de enfermedades (`seed-diseases`); CIE-11 y CIE-10 (los carga `seed-diseases`).
- Ambigüedades registradas:
  1. «Pará» si `concept_relationships` no guarda frecuencia/evidencia → supuesto: se para **la carga** de relaciones, no la sesión; el corpus de relaciones y su cargador quedan listos y bloqueados por el modelo. Confirmar con Justin.
  2. Rama: el pedido dice `justin/seed-symptoms`; el entorno asignó `claude/amazing-ptolemy-sin3nw` y prohíbe empujar a otra sin permiso explícito → supuesto: se usa la asignada. Confirmar con Justin.
  3. Entrada al glosario visible → supuesto: opcional (`--glossary`), apagada por defecto por riesgo de duplicado con fichas `wikidata-sintoma`. Confirmar con Justin.
  4. Anotaciones de enfermedades comunes (evidencia `ITM`, minería de texto hecha por la fuente) → supuesto: entran como anotación publicada, con su código de evidencia para poder filtrarlas. Confirmar con Justin.

## H1 — Discovery
**CA:** Dado el repo en `dev`, cuando se revisa el módulo 03 y los importadores, entonces se sabe qué existe, qué falta y si el modelo guarda frecuencia/evidencia.
**DoD:** hallazgos escritos en `docs/seed-research/symptoms.md` § Paso 0. **Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Inventariar importadores y glosario | se listan capas y relaciones existentes | `ls tools/terminology-import tools/terminology-import/lib/glossary-es` | HECHO |
| H1.S1.M2 | Verificar columnas de `concept_relationships` | se sabe si guarda frecuencia/evidencia | `awk '/concept_relationships/,/\);/' database/SQL/03_terminology/02_tables.sql` → sólo origen/destino/tipo/ordinal | HECHO |
| H1.S1.M3 | Leer reglas del repo | `AGENTS.md` leído y aplicado | `cat AGENTS.md` | HECHO (tarde, ver desvíos) |

## H2 — Fuentes con procedencia
**CA:** Dado el entorno de red, cuando se corre el fetch, entonces cada fuente queda fuera de git con URL, SHA-256, versión y licencia declaradas.
**DoD:** `node tools/terminology-import/symptoms/fetch-symptom-sources.mjs` → `manifest.json` con 9 entradas. **Estado:** A MEDIAS

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Fetch reanudable + manifiesto | 9 archivos con sha256 y versión | `fetch-symptom-sources.mjs` → `evidencia/manifest.json` | HECHO |
| H2.S1.M2 | `SOURCES.md` con licencia declarada por archivo | cada fuente con licencia o «no declara» | `cat tools/terminology-import/symptoms/SOURCES.md` | HECHO |
| H2.S1.M3 | Verificar texto vigente de licencias HPO y NCIt | texto leído de la página oficial | abrir `hpo.jax.org/app/license`, `evs.nci.nih.gov` | BLOQUEADO |

## H3 — Términos
**CA:** Dado el corpus, cuando se carga en una base con el DDL del módulo 03, entonces existen los términos de HPO, SYMP y NCIt con jerarquía, designaciones y procedencia, y re-cargar no agrega filas.
**DoD:** `node --test "tools/terminology-import/symptoms/test/*.test.mjs"` + corrida en Postgres desechable. **Estado:** A MEDIAS

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | HPO → filas (ES sólo OFFICIAL) | `HP:0001250` → «Convulsiones», sistema `HP:0000707` | test «HPO: nombre ES sólo…» | HECHO |
| H3.S1.M2 | SYMP → filas | obsoletos fuera, sistema de primer nivel | test «SYMP: términos vigentes…» | HECHO |
| H3.S1.M3 | NCIt subconjunto por criterio de la fuente | 3 694 términos con `scopeRule`, sin descendientes de C2991 | `build-symptoms-corpus.mjs` → `ncit.inScope = 3694`, `excludedAsDisease = 18` | HECHO |
| H3.S2.M1 | Plan de carga en seco | conteos por sistema sin base | `load-symptoms.mjs` → plan escrito | HECHO |
| H3.S2.M2 | Carga en Postgres desechable | 24 483 conceptos | `load-symptoms.mjs --apply --glossary` → `[load]` por sistema | HECHO |
| H3.S2.M3 | Idempotencia | segunda corrida = 0 | idem → todos los contadores en 0 | HECHO |
| H3.S3.M1 | Extensión opcional al glosario | 37 292 membresías con `--glossary` | idem → `glossaryMembers: 37292` | HECHO |
| H3.S3.M2 | Deduplicar contra fichas `wikidata-sintoma` | cruce por P3841 | SPARQL a Wikidata | BLOQUEADO |

## H4 — Relaciones enfermedad → síntoma
**CA:** Dadas las anotaciones publicadas, cuando se planifica la carga, entonces cada relación conserva fuente, frecuencia, evidencia y negación, y no se carga sin un modelo que pueda guardarlas.
**DoD:** pruebas + `load-disease-phenotypes.mjs --apply` (sin y con la tabla propuesta). **Estado:** A MEDIAS

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H4.S1.M1 | Parser HPOA | frecuencia/evidencia/NOT tal como vienen | test «HPOA: …» | HECHO |
| H4.S1.M2 | Axiomas DOID `RO:0002452` | 2 268 = conteo del parser XML | test «DOID OWL…» + build → `doid: 2268` | HECHO |
| H4.S1.M3 | Rasgos de Mondo | sólo destinos HP; aspecto por subontología | test «Mondo…» | HECHO |
| H4.S1.M4 | Enfermedades comunes (+ DOID con ceros) | normaliza sólo si el id existe | test «enfermedades comunes…» | HECHO |
| H4.S2.M1 | Propuesta de tabla de evidencia | DDL aplicable | `psql -f proposal/concept_relationship_evidence.sql` en base desechable | HECHO |
| H4.S2.M2 | Cargador bloqueado sin modelo | sale con 2 sin escribir | `load-disease-phenotypes.mjs --apply` → «BLOQUEADO POR EL MODELO» | HECHO |
| H4.S2.M3 | Carga e idempotencia con la propuesta | 344 981 aristas; 2.ª corrida 0 | idem con la tabla aplicada | HECHO |
| H4.S2.M4 | Carga en un entorno real | tabla en el modelo | — | BLOQUEADO |
| H4.S3.M1 | Formatos de código de `seed-diseases` (#688) | 100 % de HPOA resuelve directo | `--check --sources hpoa` → `diseaseUnresolved: 0` | HECHO |
| H4.S3.M2 | Resolución contra los datos reales de #688 | misma base con ambos cargados | correr ambos cargadores en una base | TODO |

## H5 — Saturación y cobertura
**CA:** Dadas fuentes nuevas e independientes por pasada, cuando dos pasadas seguidas aportan 0, entonces se declara saturado lo accesible y se documentan los huecos.
**DoD:** `build-symptoms-corpus.mjs` → `saturation.json`; doc § Protocolo. **Estado:** A MEDIAS

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H5.S1.M1 | Pasadas 1–6 | aporte por pasada tras deduplicar por código | `evidencia/saturation.json` | HECHO |
| H5.S1.M2 | Pasadas 7–8 en 0 | dos pasadas seguidas en 0 | doc § Protocolo, mediciones de phenopacket/CURE ID | HECHO |
| H5.S1.M3 | Re-pasar con las fuentes bloqueadas | Orphadata, CIE-11 ES, MeSH/DeCS, Wikidata, PubMed | — | BLOQUEADO |
| H5.S2.M1 | Reporte de cobertura | términos por sistema, relaciones por fuente, enfermedades con/sin | `evidencia/coverage-resumen.json` | HECHO |

## H6 — Gates y entrega
**CA:** Dado el cambio, cuando se corren los gates, entonces están en verde y hay un PR contra `dev` sin mergear.
**DoD:** comandos abajo. **Estado:** A MEDIAS

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H6.S1.M1 | Pruebas `node:test` | 0 fallas | `node --test …` → `# fail 0` | HECHO |
| H6.S1.M2 | Typecheck | exit 0 | `corepack yarn typecheck` | HECHO |
| H6.S1.M3 | Lint | exit 0 | `corepack yarn lint` | HECHO |
| H6.S1.M4 | Specs Jest dirigidos | 17/17 | `corepack yarn test <2 specs>` | HECHO |
| H6.S1.M5 | Build | exit 0 | `corepack yarn build` | HECHO |
| H6.S1.M6 | `docs:links` y `docs:build --strict` | sin avisos nuevos | `node tools/docs/check-doc-links.mjs`; `mkdocs build --strict` | A MEDIAS |
| H6.S2.M1 | PR contra `dev` | PR abierto, sin merge | mdavila-2001/mantra-core-health-api#686 | HECHO |
| H6.S2.M2 | Rama `justin/seed-symptoms` | rama con ese nombre | `git ls-remote` | TODO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Red limitada (sólo GitHub, npm/PyPI, bucket de Monarch) | fuentes sin bajar | huecos documentados; re-pasar cuando haya acceso |
| Modelo sin evidencia por arista | relaciones sin cargar | propuesta de DDL; cargador bloqueado |
| Duplicados visibles en el glosario | dos fichas «Fiebre» | `--glossary` apagado por defecto |
| Choque con sesiones paralelas | conflictos en archivos compartidos | sólo una sección aditiva en un README compartido |
