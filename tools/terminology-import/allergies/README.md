# Importador del catálogo de alergias

Carga a `terminology.*` todo lo que se puede registrar en una alergia: las
sustancias (ingredientes y clases de medicamentos, vacunas, alérgenos y aditivos
alimentarios, químicos de contacto), los tipos de alergia, los eventos adversos
alérgicos y las manifestaciones de la reacción. La investigación, el registro de
pasadas y la cobertura están en
[`docs/seed-research/allergies.md`](../../../docs/seed-research/allergies.md).
Las fuentes y sus licencias, en [`SOURCES.md`](SOURCES.md).

Se hace en tres etapas, como el glosario y el catálogo de medicamentos. Los datos
quedan **fuera de git**, en `glossary-data-build/` (se redefine con
`GLOSSARY_BUILD_DIR` o `ALLERGY_SOURCES_DIR`).

| Etapa | Script | Red | Salida |
|---|---|---|---|
| 0 | `fetch-allergy-sources.mjs [--only k1,k2]` | sí (npm, GitHub) | `allergy-sources/` + `manifest.json` (URL, commit o versión, SHA-256, licencia) |
| 1 | `build-allergy-catalog.mjs` | no | `ndjson/allergy-catalog.ndjson` + `allergy-catalog.meta.json` (pasadas, descartes, totales) |
| 2 | `load-allergy-catalog.mjs [--dry-run]` | base (`.env` DB_*) | filas nuevas por tabla; la segunda corrida inserta 0 |

**Datos versionados** (`data/`, para que nada dependa del contenedor): el NDJSON
normalizado va comprimido (`allergy-catalog.ndjson.gz`, 4,3 MB; 67 MB sin
comprimir), con su informe (`allergy-catalog.meta.json`), el manifiesto de la
descarga (`allergy-sources.manifest.json`) y `SHA256SUMS`. El cargador lo usa
cuando no existe `glossary-data-build/ndjson/allergy-catalog.ndjson`, o con
`--from-repo`. Los crudos (~1 GB) **no** se suben: se vuelven a bajar con
`fetch-allergy-sources.mjs`, que guarda URL, versión o commit y SHA-256 de cada
uno. Reconstruir con `build-allergy-catalog.mjs` da el mismo SHA-256 del NDJSON
(`d0124219…c0da8ee`).

## Reglas

- **Nada se redacta, se traduce ni se infiere.** El castellano sólo aparece
  cuando la fuente lo publica: las traducciones `OFFICIAL` de la HPO (siempre
  que traduzcan la etiqueta vigente) y los nombres `es:` de Open Food Facts. Lo
  demás conserva el nombre de su fuente y lo declara en `display_language`.
- **Deduplicación sólo por identidad o por equivalencia declarada**: mismo
  (code system, código), o Mondo `equivalentTo` un DOID. Nunca por parecido de
  nombre.
- **Sin SNOMED CT**: los value sets SNOMED de VSAC y PHIN VADS no se leen, y los
  xrefs `SCTID`/`SNOMEDCT_*`/MedDRA de las ontologías no se guardan.
- **Procedencia por concepto** (`concept_properties.allergy_provenance`):
  artefacto, versión o commit, URL, SHA-256, fecha de descarga, licencia,
  titular, y sistema y código de origen. Además: `source_license`,
  `source_url`, `source_retrieved_at`, `display_language`, `definition-en` y
  `definition-es`, `external_ids` (xrefs de la fuente), `ndfrt_kind`,
  `e_number`, `chebi_allergen_roles`, `vsac_allergy_value_sets` y
  `category_rule` (sólo en los grupos léxicos).
- **Ids estables**: concepto = `md5('mantra:allergy-catalog:concept:<codeSystem>:<código>')`;
  value sets = `deterministicId('seed:value-set:<código>')`, el mismo esquema
  que las enumeraciones de la API. Carga con `ON CONFLICT DO NOTHING`, sin
  actualizar filas ni escribir DDL.
- **Enumeraciones de la API**: los `concept_maps` unen los 20 conceptos
  internos de `src/common/seed/data/allergies/` con su código HL7 (según
  `fhir-allergy-enum-codes.json`). Sólo se cargan si la API ya los sembró.

## Tanda 2 (2026-10-27): las fuentes que el 2026-10-24 daban 403

Hoy responden allergen.org, UniProt, openFDA, DailyMed, GSRS, RxNav/RxClass, ChEBI (FTP de EMBL-EBI),
EVS (NCIt), Cellar/EUR-Lex, GovInfo, CDC, Wikidata y MeSH. La tanda 2 los carga **encima** de la tanda 1 sin tocarla:
los ids de los conceptos de la tanda 1 no cambian, y lo que ya estaba no se vuelve a emitir.

| Etapa | Script | Red | Salida |
|---|---|---|---|
| 0 | `fetch-allergy-open-sources.mjs [--only k1,k2]` | sí | `allergy-sources/open/<fuente>/` + `manifest-open.json` (URL, versión, SHA-256, licencia y su evidencia) |
| 0b | `fetch-allergy-wikidata.mjs` | sí (WDQS) | `allergy-sources/open/wikidata/` (consultas por identificador exacto) |
| 1 | `build-allergy-open.mjs [--pack]` | no | `ndjson/allergy-catalog-open.ndjson` (conceptos nuevos y **parches**) + informe de pasadas 21–38; con `--pack`, `data/allergy-catalog-open.part-NN.ndjson.gz`, meta, manifiesto y `SHA256SUMS-open` |
| 2 | `load-allergy-catalog.mjs` | base | carga la tanda 1 y la 2; `--base-only` carga sólo la 1 |

- Un **parche** agrega designaciones (p. ej. el castellano de Wikidata), propiedades (p. ej. el estado oficial del CDC
  para un CVX) o pertenencia a value sets a un concepto que ya existe. El cargador los inserta con ids
  deterministas y `ON CONFLICT DO NOTHING`; no actualiza filas.
- La tanda 2 de un code system es **otra `code_system_version`** del mismo code system (la de la tanda 1 conserva su id).
- Los crudos no se versionan. Las etiquetas SPL de DailyMed (0,3–3 MB cada una, cientos) se reducen en la descarga
  a la identificación de sus ingredientes (NDC de producto, rol, UNII, nombre) con el SHA-256 del XML original.
- Cortesía: User-Agent identificable, ≤ 2 pedidos/s por host (allergen.org: uno cada 3,5 s por su `robots.txt`),
  reintentos con backoff, caché en disco (reanudable).
- Pruebas: `node --test "tools/terminology-import/allergies/test/*.test.mjs"` (la tanda 2 usa recortes reales en
  `test/fixtures-open/`).

## Pruebas

```sh
node --test "tools/terminology-import/allergies/test/*.test.mjs"
```

Usan extractos reales de cada fuente (`test/fixtures/`), copiados de los
artefactos descargados el 2026-10-24.
