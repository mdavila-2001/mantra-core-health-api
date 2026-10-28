# Genética: vocabularios abiertos (HGNC, NCBI Gene, MedGen, Sequence Ontology, ClinVar, ClinGen, HGVS, GA4GH VRS)

Cierre de huecos de terminología, carril C12 (2026-10-28). **Sólo vocabulario**: genes, familias de genes,
condiciones genéticas, tipos de variante y listas controladas. No hay variantes individuales de ClinVar ni datos de pacientes.
Cada fila trae fuente, versión, URL, fecha, SHA-256 de los archivos de entrada y licencia; nada se tradujo ni se redactó.
Fuentes, versiones y licencias leídas: [`SOURCES.md`](./SOURCES.md). Resultado y huecos:
[`docs/seed-research/genetics.md`](../../../docs/seed-research/genetics.md).

| Code system | Qué es | Filas |
|---|---|---:|
| `hgnc` | genes humanos aprobados (HGNC, CC0); mismo code system que `dictionaries/` | 45 289 |
| `hgnc-gene-group` | grupos (familias) de genes de HGNC, con jerarquía | 2 572 |
| `ncbi-gene-hs` | NCBI Gene, Homo sapiens, todos los tipos de gen | 194 025 |
| `medgen` | condiciones y fenotipos genéticos de MedGen con nombre de fuente abierta | 101 277 |
| `sequence-ontology` | Sequence Ontology (CC BY 4.0); mismo code system que `dictionaries/` | 2 409 |
| `clinvar-terms` | listas controladas de las 4 plantillas de envío, del XSD y categorías de condición | 349 |
| `clinvar-functional` | consecuencias funcionales (SO) y tipos de ensayo (EFO/OBI/FBbi) de ClinVar | 56 |
| `clingen-terms` | valores controlados de validez, dosis y accionabilidad (ClinGen, CC0) | 103 |
| `hgvs-syntax` | elementos y tipos de variante de la sintaxis HGVS | 43 |
| `ga4gh-vrs` | clases y enumeraciones del esquema VRS 2.0.1 (Apache-2.0) | 48 |

## Flujo

```
GLOSSARY_BUILD_DIR=<dir> node --max-old-space-size=2500 tools/terminology-import/genetics/fetch-genetics-sources.mjs   # crudos + manifest.json (URL, SHA-256, versión)
GLOSSARY_BUILD_DIR=<dir> node --max-old-space-size=2500 tools/terminology-import/genetics/build-genetics-corpus.mjs    # NDJSON normalizado (--delete-raw borra cada crudo al normalizarlo)
GLOSSARY_BUILD_DIR=<dir> node tools/terminology-import/genetics/pack-data.mjs                                           # → data/ (gzip determinista, partes < 45 MB, SHA256SUMS)
GLOSSARY_BUILD_DIR=<dir> node tools/terminology-import/genetics/unpack-data.mjs                                         # data/ → NDJSON, verificando SHA-256 (sin red)
node tools/terminology-import/genetics/load-genetics.mjs                                                                # dry-run: plan sin tocar ninguna base
DB_HOST=… DB_PORT=… DB_USER=… DB_NAME=… node tools/terminology-import/genetics/load-genetics.mjs --apply               # carga idempotente
node --test "tools/terminology-import/genetics/test/*.test.mjs"                                                         # pruebas contra extractos reales
```

`--apply` **no tiene valores por defecto** de conexión (exige `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_NAME`): los otros cargadores
apuntan por defecto a `5433/mantra_redesa_health`, la base del stack. La base desechable de prueba se arma con
`test/disposable-db/fresh-db.sh` (exige `DISPOSABLE_DB=1` y un nombre terminado en `_test`) y se mide con
`test/disposable-db/integrity.sql`.

## Decisiones de diseño

- **Sin DDL.** Todo entra en las tablas existentes de `terminology.*`. `catalog_concepts.definition` queda nula (la definición de la
  fuente está en inglés y la API muestra esa columna en castellano): va en la propiedad `source_definition` con su idioma.
- **Relaciones.** `is-a` (SO, grupos HGNC, NCI `isa` vía MedGen) y `part-of` (gen → grupo). Las jerarquías de MeSH, Orphanet y GTR
  de MedGen no afirman `is-a`: quedan en `source_hierarchy_parents` con su fuente. `concept_relationships` no guarda evidencia por
  relación (el parche del modelo no está en esta máquina): la procedencia de cada arista es la del concepto de origen.
- **Cruces por código exacto** que la fuente publica (HGNC `entrez_id` ↔ NCBI `dbXrefs`, MedGen → MONDO/MeSH/Orphanet/NCIt/OMIM, ClinVar
  funcional → SO). Sólo se escribe si el destino ya existe en la base; la equivalencia queda nula (un xref no afirma equivalencia exacta).
- **`hgnc` y `sequence-ontology` ya los carga `dictionaries/`.** Se usan el mismo `internal_code` y la misma URL canónica: es un solo code system con una versión por importador, y esta carga no le quita el `is_default` a la otra
  (`test/disposable-db/coexistence.sql`). Cuál es la versión por defecto lo decide el propietario.
- **HPO queda fuera de los textos de MedGen** (nombres y definiciones) hasta que el propietario resuelva su cláusula de uso no comercial
  (`symptoms/lib/approvals.mjs`); sólo se conserva el identificador HPO como xref. Tampoco hay textos de SNOMED CT, OMIM ni GeneReviews.
