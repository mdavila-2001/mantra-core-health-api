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

## Pruebas

```sh
node --test "tools/terminology-import/allergies/test/*.test.mjs"
```

Usan extractos reales de cada fuente (`test/fixtures/`), copiados de los
artefactos descargados el 2026-10-24.
