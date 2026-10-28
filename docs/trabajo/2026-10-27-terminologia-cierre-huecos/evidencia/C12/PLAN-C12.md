# Plan C12 — genética (solo vocabulario)

- Fecha: 2026-10-27 · Repo: `mantra-core-health-api` · Predecesor: `../../PLAN.md` y `../../BRIEF-COMUN.md` (carril nuevo, no estaba en el plan de 8)
- Resultado observable: `terminology.*` de un Postgres 16 desechable trae los vocabularios de genética que las fuentes abiertas permiten (genes HGNC y NCBI Gene humano, familias de genes, condiciones MedGen, Sequence Ontology, vocabularios controlados de ClinVar, clasificaciones de ClinGen, sintaxis HGVS, términos de GA4GH VRS), con procedencia por fila y enlaces por código exacto a lo que ya cargaron C2 (HPO), C3 (GTR) y el catálogo de enfermedades.
- Kill-test: `docs/seed-research/genetics.md` dice «hueco» de una fuente que hoy responde 200 y tiene licencia abierta.

## Alcance
- IN: `tools/terminology-import/genetics/**`, `docs/seed-research/genetics.md`, `docs/trabajo/2026-10-27-terminologia-cierre-huecos/evidencia/C12/**`.
- OUT: variantes individuales de ClinVar (millones, no es vocabulario), datos de pacientes, `lab-tests/` y `symptoms/` (se leen, no se tocan), SNOMED CT, MedDRA, OMIM (texto), GeneReviews (texto), NOC, DDL.
- Ambigüedades: ver `REPORTE-C12.md` § Decisiones.

## H1 — Vocabularios de genética cargados y probados
**CA:** Dado el corpus normalizado de `data/`, cuando se carga dos veces en un Postgres 16 desechable, entonces la 2.ª corrida inserta 0 filas y las consultas de integridad dan 0 huérfanos, 0 duplicados por (code system, code) y 0 nulos indebidos.
**DoD:** `node --test "tools/terminology-import/genetics/test/*.test.mjs"` verde · 2 builds con mismo SHA-256 · carga 1 y 2 pegadas · `integrity.sql` pegado.
**Estado:** A MEDIAS (todo hecho salvo `REPORTE-C12.md`: la herramienta de escritura lo rechazó y el contenido va en el mensaje final del carril; reservas: base desechable, no la del stack; `hgnc` y `sequence-ontology` comparten code system con `dictionaries/`)

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.C12.M1 | Sondear fuentes y leer licencias hoy | cada fuente con código HTTP y licencia citada | `evidencia/C12/sondeo-2026-10-27.tsv`, `licencias-2026-10-27.txt` | HECHO |
| H1.C12.M2 | Fetch + parsers contra los archivos reales, con fixtures recortados | `node --test` verde | salida en `evidencia/C12/node-test-genetics.txt` (41 de 41) | HECHO |
| H1.C12.M3 | Build reproducible, empaque en `data/` (partes < 45 MB, SHA256SUMS) | mismo SHA-256 en 2 builds | `build-reproducible-sha256.txt`, `pack-1/2.txt`, `sha256-gzip-check.txt`, `unpack.txt` | HECHO |
| H1.C12.M4 | Carga en Postgres 16 desechable, 2.ª corrida = 0 | 0 filas nuevas + integridad | `carga-genetica-1.txt`, `carga-genetica-2.txt`, `integridad-final.txt`, `idempotencia.txt` | HECHO |
| H1.C12.M5 | `docs/seed-research/genetics.md`, `SOURCES.md`, `REPORTE-C12.md` | huecos con motivo exacto | diff + conteos antes/después | A MEDIAS: doc y `SOURCES.md` escritos; `REPORTE-C12.md` rechazado por la herramienta (no se eludió), va en el mensaje final |
| H1.C12.M6 | (agregada) Alinear `hgnc` y `sequence-ontology` con `dictionaries/` (C7) y probar la convivencia | un solo code system, dos versiones, sin quitar `is_default` | `coexistencia.txt`, `carga-dictionaries-hgnc-so.txt` | HECHO |
| H1.C12.M7 | (agregada) Pasada de saturación después de cargar | 0 archivos nuevos sin clasificar | `saturacion-2026-10-28.txt` | HECHO |
| H1.C12.M8 | (agregada) Cruces contra destinos reales (MONDO, MeSH, Orphanet, NCIt, OMIM) | cruces cargados en la misma base | `carga-destinos-diseases.txt`, `integridad-final.txt` §9-10 | HECHO |

## Desvíos del plan
- Se agregaron M6-M8 (no previstas): al leer el repo apareció que `dictionaries/` ya carga `hgnc` y `sequence-ontology`.
- El plan listaba «HGVS» y «VRS» como términos y «MedGen» como condiciones; se sumaron además las 4 plantillas de ClinVar (no sólo la principal), los TSV de accionabilidad de ClinGen, `MERGED`/historiales de MedGen y ClinVar y `withdrawn.txt` de HGNC porque la saturación los encontró.
- Los textos de HPO dentro de MedGen quedaron fuera (decisión pendiente del propietario).
