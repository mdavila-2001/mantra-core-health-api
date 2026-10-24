# Farmacología clínica — monografías por principio activo

Una monografía por ATC nivel 5 con las secciones literales de cada fuente oficial (ficha técnica de
CIMA en castellano; etiqueta SPL de la FDA en inglés), cada una con su documento, versión, URL,
fecha y cita. Fuentes, licencias y encaje en el modelo: **`SOURCES.md`**. Registro de pasadas:
`docs/seed-research/clinical-pharmacology.md`.

Descargas y salidas fuera de git, en `glossary-data-build/` (`GLOSSARY_BUILD_DIR`); las propias en
`glossary-data-build/clinical-pharmacology/` (`CLINICAL_PHARMACOLOGY_DIR`). El listado y detalle de
CIMA se comparten con `import-cima.mjs` (no se bajan dos veces).

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
node --test $D/test/*.test.mjs
```

Medido en un Postgres 16 desechable (DDL de `database/SQL/00_shared` + `03_terminology`, sin la
API) con la ficha real de bencilpenicilina procaína (nº reg. 15419): 1.ª carga 5 conceptos,
3 designaciones, 4 IS_A, 14 propiedades, 1 `concept_map` a `vademecum`; 2.ª carga 0 filas nuevas y
0 borradas; con la ficha en otra versión, 2 retiradas y 2 nuevas, y el total se mantiene.
