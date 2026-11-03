# Catálogo de enfermedades → `terminology.*`

Importador del catálogo exhaustivo de enfermedades, trastornos, síndromes y
lesiones (módulo 03). Fuentes, versiones, hashes y licencias en
[`SOURCES.md`](SOURCES.md); investigación, pasadas de saturación, cobertura y
claves para otras sesiones en
[`docs/seed-research/diseases.md`](../../../docs/seed-research/diseases.md).

Sin DDL (ADR-0021): todo entra en las tablas existentes del módulo 03.

## Etapas

| Etapa | Script | Red | Qué hace |
|---|---|---|---|
| 0 | `fetch-sources.mjs` | sí | Baja los archivos de `lib/sources.mjs` a `<GLOSSARY_BUILD_DIR>/diseases-sources/`, verifica los hashes esperados, descomprime y escribe `manifest.json`. Reanudable (`--force`, `--only <clave>`). |
| 1 | `build-catalog.mjs` | no | Fuentes → `ndjson/diseases/<codeSystem>.ndjson` (un registro común por concepto), `_systems.json`, `diseases-build-stats.json`, `diseases-citations.json`. ~40 s; necesita más heap que el de Node por defecto (se corrió con `--max-old-space-size=8000`). |
| 2 | `load-catalog.mjs` | no (base) | NDJSON → `terminology.*`. `--dry-run` no toca la base; `--systems a,b` acota (los mapeos hacia sistemas todavía no cargados se saltean; se completan al volver a correr con esos sistemas); `--from-snapshot` lee `diseases/data/` (verificando cada SHA-256), y es lo que usa si no hay build local. Idempotente. |
| 1b | (dentro de `build-catalog.mjs`) | no | Escribe la **instantánea versionada** `diseases/data/`: un `<codeSystem>.part-NN.ndjson.gz` por sistema (gzip determinista, partes < 45 MB), `_systems.json`, estadísticas, citas, manifiesto de fuentes sin rutas locales y `MANIFEST.json` con el SHA-256 de cada archivo. Se sube a git: otras sesiones enlazan contra la rama y se puede cargar sin red ni fuentes. |
| — | `coverage-report.mjs` | no | Pasadas de saturación, conceptos por sistema y por capítulo, cruces y cobertura contra MONDO → `diseases-coverage.{json,md}`. |

```sh
node tools/terminology-import/diseases/fetch-sources.mjs
node --max-old-space-size=8000 tools/terminology-import/diseases/build-catalog.mjs
node --max-old-space-size=8000 tools/terminology-import/diseases/load-catalog.mjs --dry-run
node --max-old-space-size=8000 tools/terminology-import/diseases/load-catalog.mjs   # .env DB_*; la API tiene que haber sembrado terminology
node --max-old-space-size=8000 tools/terminology-import/diseases/load-catalog.mjs --from-snapshot   # sin red ni fuentes: desde diseases/data/
node --max-old-space-size=8000 tools/terminology-import/diseases/coverage-report.mjs
node --test "tools/terminology-import/diseases/test/*.test.mjs"
```

## Qué carga

Un `terminology_sources` + `code_systems` + `code_system_versions` por sistema
(URL canónica interna `https://mantracore.health/fhir/CodeSystem/<codeSystem>`;
`code_system_versions.checksum` = SHA-256 de los archivos de origen) y:

- `catalog_concepts`: `code` = código de la fuente, `display` = nombre de la
  fuente (castellano en Orphanet), `definition` verbatim, `selectable=false` y
  estado `TERM_DEPRECATED` para lo obsoleto; `replaced_by_concept_id` cuando el
  reemplazo está vigente en el mismo sistema.
- `concept_designations`: preferido y sinónimos, con idioma ES/EN.
- `concept_relationships` (`REL_IS_A`): la jerarquía de cada fuente.
- `concept_maps`: sólo los alineamientos que **publica** una fuente, con la
  equivalencia que ella declara (`EQUIV_*`; nula si la fuente no la declara) y
  `context` = quién y cómo (`mondo:skos:exactMatch`, `orphanet:NTBT …`,
  `who:10To11MapToOneCategory 2025-Jan-24`). Los «no validados» de Orphanet
  quedan con estado `TERM_DRAFT`. Hacia `icd10cm` (import-icd10cm.mjs) y
  CIE-10-ES del glosario se insertan **sólo si** esos conceptos ya existen.
- `concept_properties`: `disease_provenance` (fuente, id de origen, versión,
  URI, fecha), clasificación propia de cada fuente (`orphanet_classification`,
  `icd11_classification`, `disease_subsets`…), `disease_external_xrefs`
  (referencias que no tienen sistema: MedDRA, ICD-O, GARD, EFO, MedGen…),
  `disease_unresolved_xrefs`, `disease_xref_key` en las claves cruzadas.
- `catalog_import_batches`: un lote por sistema y corrida (es el único registro
  que se agrega en cada corrida; los datos quedan en 0 nuevas).
