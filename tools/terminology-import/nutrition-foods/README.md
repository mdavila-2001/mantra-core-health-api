# Importador de nutrición y alimentos

Carga a `terminology.*` los vocabularios y catálogos de alimentos que las fuentes **abiertas** publican, con procedencia
por fila: USDA FoodData Central (CC0), FoodOn (CC BY 4.0), CDNO (CC BY 3.0), FOBI y ONS (CC BY 4.0), Ciqual 2025 de ANSES
(CC BY 4.0) y Canadian Nutrient File 2026 (OGL-Canadá). Las fuentes, versiones, SHA-256 y licencias, con lo que NO se cargó y por qué, están en
[`SOURCES.md`](SOURCES.md). La investigación, el antes/después y la cobertura, en
[`docs/seed-research/nutrition-foods.md`](../../../docs/seed-research/nutrition-foods.md).

Mismo esquema de tres etapas que el resto de los importadores:

| Etapa | Script | Red | Salida |
|---|---|---|---|
| 0 | `fetch-sources.mjs [--only k1,k2] [--skip-heavy]` | sí | crudos en `SOURCES_DIR` (fuera de git) + `data/nutrition-foods.manifest.json` (URL, versión, SHA-256, bytes, fecha) |
| 1 | `build-nutrition-foods.mjs [--out DIR] [--no-branded]` | no | `data/nutrition-foods-*.ndjson.gz`, `nutrition-foods.meta.json`, `SHA256SUMS` |
| 2 | `load-nutrition-foods.mjs [--dry-run] [--no-branded] [--data DIR]` | base | filas nuevas por tabla; la 2.ª corrida inserta 0 |

Comandos (los crudos van a `GLOSSARY_BUILD_DIR`; en este sandbox Node necesita `NODE_USE_ENV_PROXY=1` para usar el proxy):

```bash
export GLOSSARY_BUILD_DIR=/ruta/fuera/de/git NODE_USE_ENV_PROXY=1
node --max-old-space-size=2500 tools/terminology-import/nutrition-foods/fetch-sources.mjs
node --max-old-space-size=2500 tools/terminology-import/nutrition-foods/build-nutrition-foods.mjs
DB_HOST=127.0.0.1 DB_PORT=55443 DB_USER=mantra DB_NAME=c13 \
  node --max-old-space-size=2500 tools/terminology-import/nutrition-foods/load-nutrition-foods.mjs
node --test tools/terminology-import/nutrition-foods/test/nutrition-foods.test.mjs
```

## Seguridad del cargador

`load-nutrition-foods.mjs` **no lee `.env`**: exige `DB_HOST`, `DB_PORT`, `DB_USER` y `DB_NAME` explícitos, acepta solo
`127.0.0.1`/`localhost` y se niega si el puerto es 5433 o el nombre de la base parece la del stack
(`mantra_*health`, `redesa`). Para una base desechable, `seed-disposable-db.mjs` siembra los 9 conceptos internos que en el
producto siembra la API (estados, idiomas, tipos de designación, is-a). `verify-load.sql` son las consultas de integridad.

## Datos versionados (`data/`)

| Archivo | Contenido |
|---|---|
| `nutrition-foods-codesystems.ndjson.gz` | un registro por code system (28): versión, fuente, jerarquía, conteo y artefactos con SHA-256 y licencia |
| `nutrition-foods-concepts.part-NN.ndjson.gz` | conceptos de todo menos FDC Branded |
| `nutrition-foods-branded.part-NN.ndjson.gz` | FDC Branded (~2 M alimentos; opcional al cargar con `--no-branded`) |
| `nutrition-foods.meta.json` | conteos, descartes y conflictos entre ediciones (sin fechas: el build es reproducible) |
| `nutrition-foods.manifest.json` | resultado de la descarga: URL, versión, SHA-256, bytes, `retrievedAt`, licencia |
| `SHA256SUMS` | suma de cada archivo; `cd data && sha256sum -c SHA256SUMS` |

Las partes pesan < 45 MB cada una. Dos builds seguidos dan los mismos SHA-256 (gzip nivel 9 determinista, sin fechas en el corpus;
la fecha de descarga vive solo en el manifiesto).

## Code systems (28)

FDC: `usda-fdc-foundation`, `usda-fdc-sr-legacy`, `usda-fdc-survey`, `usda-fdc-branded`, `usda-fdc-nutrient`,
`usda-fdc-food-category`, `usda-fdc-wweia-category`, `usda-fdc-branded-category`, `usda-fdc-measure-unit`,
`usda-fdc-attribute-type`, `usda-fdc-fndds-derivation`, `usda-fdc-nutrient-derivation`, `usda-fdc-nutrient-source`.
Ontologías OBO: `foodon`, `cdno`, `fobi`, `ons`. Ciqual: `ciqual-food`, `ciqual-food-group`, `ciqual-constituent`, `ciqual-source`.
CNF: `cnf-food`, `cnf-food-group`, `cnf-nutrient`, `cnf-food-source`, `cnf-nutrient-source`, `cnf-measure`, `cnf-measure-type`.
Cada uno tiene su propia fuente en `terminology_sources` (`NUTRITION_USDA_FDC`, `NUTRITION_FOODON`, `NUTRITION_CDNO`, `NUTRITION_FOBI`, `NUTRITION_ONS`, `NUTRITION_CIQUAL`, `NUTRITION_CNF`).

## Reglas

- **Nada se redacta, se traduce ni se infiere.** El francés de Ciqual y CNF y el inglés de FDC/FoodOn son los de la fuente. Los
  números (`amount`, `teneur`, `Nutrient_Amount`) se guardan como el texto de la fuente (Ciqual usa coma decimal: `59,7`).
  Las celdas vacías no generan clave. Idiomas que la API no siembra (francés) van íntegros en la propiedad
  `names_other_languages`; EN/ES van a `concept_designations`.
- **Ids estables**: `md5('mantra:nutrition-foods:concept:<code system>:<versión>:<código>')`; carga con `ON CONFLICT DO NOTHING`,
  sin actualizar filas ni escribir DDL. El lote de importación tiene id determinista por (code system, versión, corpus): la 2.ª
  corrida no agrega ni siquiera ese registro.
- **Procedencia por concepto**: `nutrition_provenance` (json: artefacto, tabla, URL, versión/commit, SHA-256 del archivo,
  fecha de descarga e identificador de licencia) y `source_license` (el identificador: `CC0-1.0`, `CC-BY-4.0`, `CC-BY-3.0`,
  `OGL-Canada`). El **texto completo** de cada licencia leído hoy vive en el manifiesto, en
  `nutrition-foods-codesystems.ndjson.gz` y en [`SOURCES.md`](SOURCES.md) (`terminology_sources.license` lleva la licencia con su URL); no se repite en cada fila para no cargar ~2 M de
  conceptos con 400 bytes de licencia cada uno.
- **Branded** guarda sus campos en **una** propiedad `fdc_branded` (json) en vez de una fila por campo, porque son ~2 M de conceptos.
- **Un concepto sin etiqueta** (en Branded hay uno: `fdc_id` 776874, descripción vacía en la fuente) lleva `display` = código y la
  propiedad `display_source` que lo aclara.
- **Los nutrientes se unen entre ediciones** (cada zip trae su `nutrient.csv`): gana la edición más nueva y las diferencias quedan
  en `nutrition-foods.meta.json → conflicts` (13: `rank` de 7 y `name` de 6 nutrientes).
- **Cruce FDC ↔ CNF** solo por igualdad exacta de `NDB_number` / `USDA_NDB_Code` (propiedad `fdc_ndb_exact_matches`); nunca por nombre.
