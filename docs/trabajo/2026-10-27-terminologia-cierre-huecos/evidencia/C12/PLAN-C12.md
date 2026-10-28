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
**Estado:** EN CURSO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.C12.M1 | Sondear fuentes y leer licencias hoy | cada fuente con código HTTP y licencia citada | `evidencia/C12/sondeo-2026-10-27.tsv`, `licencias-2026-10-27.txt` | HECHO |
| H1.C12.M2 | Fetch + parsers contra los archivos reales, con fixtures recortados | `node --test` verde | salida en `evidencia/C12/node-test-genetics.txt` | TODO |
| H1.C12.M3 | Build reproducible, empaque en `data/` (partes < 45 MB, SHA256SUMS) | mismo SHA-256 en 2 builds | `build-reproducible-sha256.txt` | TODO |
| H1.C12.M4 | Carga en Postgres 16 desechable, 2.ª corrida = 0 | 0 filas nuevas + integridad | `carga-*-1.txt`, `carga-*-2.txt`, `integridad-1.txt` | TODO |
| H1.C12.M5 | `docs/seed-research/genetics.md`, `SOURCES.md`, `REPORTE-C12.md` | huecos con motivo exacto | diff + conteos antes/después | TODO |
