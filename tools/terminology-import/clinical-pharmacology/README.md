# Farmacología clínica — monografías por principio activo

Una monografía por ATC nivel 5 con las secciones literales de cada fuente oficial (ficha técnica de
CIMA en castellano; etiqueta SPL de la FDA en inglés), cada una con su documento, versión, URL,
fecha y cita. Fuentes, licencias y encaje en el modelo: **`SOURCES.md`**. Registro de pasadas:
`docs/seed-research/clinical-pharmacology.md`.

Descargas crudas fuera de git, en `glossary-data-build/` (`GLOSSARY_BUILD_DIR`); las propias en
`glossary-data-build/clinical-pharmacology/` (`CLINICAL_PHARMACOLOGY_DIR`). El listado y detalle de
CIMA se comparten con `import-cima.mjs` (no se bajan dos veces). Los crudos se reproducen con los
fetchers, que dejan URL, fecha y (openFDA) sha256 en su `fetch.meta.json`.

**Lo normalizado sí se versiona** (orden del propietario, 2026-10-24: el contenedor de la nube se
pierde al cerrar la sesión): `pack-data.mjs` lo copia comprimido a `data/`, en partes de menos de
45 MB, con `data/MANIFEST.json` (sha256, bytes y filas por archivo). Hacer push después de cada
pasada. Reconstruir: `zcat data/monographs.part-*.ndjson.gz > monographs.ndjson`.

Solo se versiona el corpus **por principio activo** (decisión del propietario, 2026-10-26): el corpus por
producto (`--granularity product`, ~2,2 GB) se arma en `out/product/`, nunca entra en `data/` y no lo carga el
cargador. De la eEML solo se guardan referencias (ids y enlaces), no su texto. Toda sección es
`audience: 'professional'`.

```sh
# Con proxy de salida, anteponer NODE_USE_ENV_PROXY=1 a los fetch-*.mjs (el fetch de Node no lee HTTPS_PROXY).
D=tools/terminology-import/clinical-pharmacology
node $D/fetch-cima.mjs --plan                 # cuántos pedidos faltan
node $D/fetch-cima.mjs                        # listado, detalle, maestra ATC, fichas completas, notas (reanudable)
node $D/fetch-cima.mjs --granularity product  # pasada exhaustiva: todas las fichas segmentadas (a la caché, fuera de git)
node $D/fetch-rxnorm.mjs                      # ATC 5 → RxCUI → UNII (por código)
node $D/fetch-openfda.mjs                     # particiones de drug/label (descarga masiva, ~1,8 GB)
node $D/fetch-gsrs.mjs                        # sustancias FDA GSRS → out/gsrs-entries.ndjson (puente UNII ↔ WHO-ATC)
node $D/fetch-ema-pi.mjs                      # PDF de información de producto de la EMA (castellano), texto pdftotext y tabla de Adobe → caché
EMA_PI_WORKERS=4 python3 -I $D/py/ema_pi_extract.py <cache>/ema-pi/adobe-symbol.txt <cache>/ema-pi/rows <cache>/ema-pi/*_es.pdf
                                              # extracción verificada (pdfminer.six de py/requirements.txt)
python3 -I -m unittest discover -s $D/py -p 'test_*.py'
node $D/build-monographs.mjs                  # sin red → out/monographs.ndjson (por principio activo y vías: lo que se versiona)
node $D/build-monographs.mjs --granularity product  # sin red → out/product/monographs.product.ndjson (~2,2 GB; no se versiona ni se carga)
node $D/coverage-report.mjs                   # out/coverage.json + coverage.md
node $D/load-clinical-pharmacology.mjs --dry-run
node $D/load-clinical-pharmacology.mjs        # .env DB_*; idempotente; --no-prune para no retirar filas superadas
node $D/validate-links.mjs                    # enlaces por código con vademecum, productos y relaciones de otras sesiones
node $D/pack-data.mjs                         # lo normalizado → data/*.gz (< 45 MB por parte) + data/MANIFEST.json
node --test $D/test/*.test.mjs
```

Medido en un Postgres 16 desechable (DDL de `database/SQL/00_shared` + `03_terminology`, sin la
API), con el corpus de la pasada 1 (openFDA + GSRS, 1 033 monografías):
- 1.ª carga: 1 696 conceptos, 969 designaciones, 1 682 IS_A, 24 137 propiedades y 199
  `concept_maps` a `vademecum`, en 9 s. `concept_properties` ocupa 71 MB.
- 2.ª carga: 0 filas nuevas y 0 borradas.
- Con el valor de las secciones cambiado (se agregó el aviso de openFDA): 18 853 filas retiradas
  y 18 853 nuevas; la corrida siguiente vuelve a 0/0.

`build-monographs` y `load-clinical-pharmacology` se corren con `node --max-old-space-size=8192`,
porque el armado recorre las 263 000 etiquetas dos veces y la carga lee ~108 MB de NDJSON.
