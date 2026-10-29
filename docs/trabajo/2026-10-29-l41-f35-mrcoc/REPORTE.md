# TAREA-41 F3.5 — MRCOC (coocurrencia en MEDLINE) → síntoma de enfermedad, T4

Apilado sobre F3.4 (mantra-core-health-api#1103/#1104) y F3.3 (#1098/#1099).

## Qué hay
- `mrcoc/fetch-mrcoc.mjs`: baja MRCOC 2024 de NLM **en flujo** (~1,6 GB, no se guarda), `MH_freq_counts_2024`, los árboles MeSH (SPARQL) y el cruce MeSH↔HPO de Wikidata; deja el TSV filtrado (4,7 MB) con constancia (SHA-256, filas).
- `lib/glossary-es/mrcoc.mjs` (puro) + `import-f3-mrcoc.mjs` (`--load [--dry-run]`, tabla de umbrales, muestra de 50 pares).
- `test/f3-mrcoc.test.mjs` (10 pruebas) con recortes reales de los archivos descargados.

## Por qué no se «reutilizó el parser del AI Service»
La ficha pide reutilizarlo sin copiarlo. El script (`scripts/fetch-clinical-sources.mjs`, AlovidaAIService commit 1163e62) **no es importable**: al cargarse descarga HPO, MONDO, Orphanet, DO… (cientos de MB, más de lo autorizado) y está en otro repositorio. Se escribió un extractor mínimo con el **mismo filtro y mismo formato de salida**, y se comprobó la equivalencia contra el lock del AI Service en vez de confiar en la copia: **240 685 350 filas leídas → 259 040 pares, SHA-256 `c9bc5938…ba9a288` idéntico** («PARIDAD CON EL AI SERVICE: OK», `evidencia/fetch.log`). Compartir el código sigue pendiente (paquete común entre repos: decisión del propietario).

## Medida y umbrales (documentados)
*lift* = coocurridas observadas / esperadas por azar, esperadas = N(enfermedad)·N(síntoma)/36 555 430 citas; coocurrencia ≥ 20 y **lift ≥ 3** (la ficha proponía 2). Se eligió mirando la muestra de 50 pares con lift ≥ 2 (`mrcoc-sample-50-lift2-revisada.csv`): entre 2 y 3 hay ruido (hirsutismo × carcinoma 2,0; obesidad × hiperhomocisteinemia 2,7), desde 3 se lee coherente (disartria × Parkinson 52,5; gastroparesia × neuropatía diabética 103; amaurosis fugax × enfermedad carotídea 167). Costo: 1 447 filas (12 472 → 11 025). Tabla completa en `mrcoc-thresholds.csv`.

## Evidencia (rung 5 — base LOCAL; no VPS)
- 259 040 pares leídos → 11 025 filas cargables → **10 427** tras filtrar enfermedades/síntomas sin concepto en la base local.
- `--dry-run` PASS; carga real: **10 427 evidencias T4, 10 004 relaciones nuevas** (423 evidencias se sumaron a aristas que ya tenían otra fuente); **segunda pasada 0/0**; 0 FK sin validar; 0 evidencias sin relación (`evidencia/load.txt`, `verificacion-db.txt`).
- La fuerza de las relaciones sólo-T4 llega a 0,25 y no la supera (la literatura nunca iguala a una norma).
- Importador: 139 pruebas, 138 pasan, 0 fallan, 1 omitida (necesita Postgres) (`evidencia/gates.txt`).

## Límites
- Cobertura baja por construcción: 7 047 pares sin HPO declarado por Wikidata y 6 873 enfermedades sin grupo MONDO no se cargan. No se adivina por nombre.
- El cruce Wikidata MeSH↔HPO se usa sólo del lado del síntoma.
- T4 es literatura, no clínica: la UI lo deja apagado por defecto (ficha §2).
- No se cargó en el VPS.

## Corrección en la rama
Las ramas de F3.4 incluyeron por error `tools/terminology-import/docs/progress/STATUS_LOG.md` y `.claude/runtime/progress_state.json` (artefactos del hook ejecutado desde ese directorio). Se quitan del índice; los hooks se deben correr desde la raíz.
