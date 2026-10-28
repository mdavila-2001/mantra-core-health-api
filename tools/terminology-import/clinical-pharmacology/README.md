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

```sh
D=tools/terminology-import/clinical-pharmacology
node $D/fetch-cima.mjs --plan                 # cuántos pedidos faltan
node $D/fetch-cima.mjs                        # listado, detalle, maestra ATC, fichas completas, notas (reanudable)
node $D/fetch-cima.mjs --granularity product  # pasada exhaustiva: todas las fichas segmentadas
node $D/fetch-rxnorm.mjs                      # ATC 5 → RxCUI → UNII (por código)
node $D/fetch-openfda.mjs                     # particiones de drug/label (descarga masiva)
node $D/build-monographs.mjs                  # sin red → out/monographs.ndjson
node $D/coverage-report.mjs                   # out/coverage.json + coverage.md
node $D/load-clinical-pharmacology.mjs --dry-run
node $D/load-clinical-pharmacology.mjs        # .env DB_*; idempotente; --no-prune para no retirar filas superadas
node $D/validate-links.mjs                    # enlaces por código con vademecum, productos y relaciones de otras sesiones
node $D/pack-data.mjs                         # lo normalizado → data/*.gz (< 45 MB por parte) + data/MANIFEST.json
node --test $D/test/*.test.mjs
```

Verificar lo versionado: `cd data && sha256sum -c SHA256SUMS`.

Medido el 2026-10-28 en un Postgres 16 desechable (DDL de `database/SQL/00_shared` + `03_terminology`, sin la API;
`test/disposable-db/seed-vademecum.mjs` siembra `vademecum` y los conceptos internos, y sólo corre si `DB_NAME` termina en `_test`)
con el corpus exhaustivo `product` (2 963 monografías, 381 904 secciones): 1.ª carga 4 052 conceptos, 4 044 designaciones,
4 038 IS_A, 405 290 propiedades, 425 `concept_maps` a `vademecum`; 2.ª carga 0 filas nuevas y 0 borradas. El cargador corta los
lotes por tamaño (una monografía llega a 85 MB). Detalle y huecos: `docs/seed-research/clinical-pharmacology.md`.
Cuidado: cargar el corpus `route` sobre una base con el `product` ya cargado **retiraría** (`--prune`, según el código; no probado) las secciones que `route` no trae; usar `--no-prune`.
