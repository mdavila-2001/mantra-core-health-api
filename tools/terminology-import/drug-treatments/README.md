# Tratamientos farmacológicos por enfermedad

Relaciones **publicadas** fármaco → enfermedad, cada una con el tipo exacto que da su
fuente y su procedencia (fuente, id de origen, versión, URI, fecha, commit, SHA-256 del
archivo). No es un recomendador: no se cargan dosis, posologías ni interacciones, y nada
se deduce por nombre ni por sentido clínico. Fuentes y licencias: [`SOURCES.md`](SOURCES.md).
Investigación, pasadas de saturación y cobertura: `docs/seed-research/drug-treatments.md`.

```sh
node tools/terminology-import/drug-treatments/fetch-sources.mjs          # clona en el commit fijado (~10 s)
node tools/terminology-import/drug-treatments/build-drug-treatments.mjs  # NDJSON + cobertura, sin red (~5 s)
node tools/terminology-import/drug-treatments/export-data.mjs            # NDJSON → data/*.ndjson.gz (versionado)
node tools/terminology-import/drug-treatments/load-drug-treatments.mjs   # dry-run: plan y conteos, sin base
node tools/terminology-import/drug-treatments/load-drug-treatments.mjs --apply [--targets targets.json]
node tools/terminology-import/drug-treatments/validate-links.mjs [--targets targets.json]   # fase 2, sólo lectura
node --test tools/terminology-import/drug-treatments/test/*.test.mjs
```

| Etapa | Salida (en `glossary-data-build/`, fuera de git) |
|---|---|
| fetch | `cache/drug-treatments/<repo>@<sha12>/`, `cache/drug-treatments/manifest.json` |
| build | `ndjson/drug-treatments.ndjson`, `ndjson/drug-treatments.meta.json`, `drug-treatments-coverage.json` |
| load (dry-run) | `drug-treatments-load-plan.dry-run.json` |
| validate-links | `drug-treatments-links.json` |
| export (**en git**) | `drug-treatments/data/`: `drug-treatments-NNN.ndjson.gz` (< 45 MB c/u), `drug-treatments.meta.json`, `drug-treatments-coverage.json`, `manifest.json` (commit y SHA-256 de cada crudo), `SHA256SUMS` |

Los datos normalizados se versionan en `data/` porque el contenedor de trabajo es efímero; el cargador los lee de ahí si no hay build local. Los crudos no se suben: `fetch-sources.mjs` los re-baja en el mismo commit y `manifest.json` permite comprobar sus SHA-256. El export es determinista (gzip con mtime 0).

## Cómo se guarda (sin DDL)

`terminology.concept_relationships` no tiene columnas de fuente ni de evidencia. Para no
crear aristas sin procedencia, cada afirmación es un **concepto** de
`drug-treatment-assertions-<fuente>` (code = id de origen; procedencia y evidencia en
`concept_properties`) y se enlaza con dos relaciones estructurales hacia conceptos que ya
existan en la base por código exacto: `assertion:drug` y `assertion:condition`. Los tipos
de relación son conceptos de `drug-treatment-relation-types` (etiqueta en castellano propia,
`relation_type_label_es_official = false`; definición en inglés literal de la fuente).
Una combinación de ingredientes no se enlaza a cada ingrediente por separado.

`--targets` agrega code systems de destino: `{ "MONDO": ["<internal_code>"], "MESH": [...] }`.
Por defecto: `RXCUI → rxnorm_full, rxterms`, `ICD10CM → icd10cm`, `ATC → vademecum`.
