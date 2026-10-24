# Andamio de la base desechable

Scripts **sólo de prueba** con los que se midió la carga en un Postgres 16
desechable (puerto 5544, base `symptoms_scratch`). No son parte de ningún
cargador ni se ejecutan contra una base real. Tienen rutas absolutas del
contenedor de la sesión (`/home/user/...`, `/tmp/claude-0/...`); para reusarlos
hay que ajustarlas.

| Script | Qué hace |
|---|---|
| `full-run.sh` | Recrea la base con el DDL de `database/SQL/00_shared` + `03_terminology`, siembra el andamio y corre los cargadores dos veces (términos y relaciones), con y sin la tabla propuesta |
| `seed-scratch.mjs` | Siembra los conceptos internos (estado activo, idiomas, tipos de designación, is-a, `REL_SYMPTOM`, `REL_SYMPTOM_EXCLUDED`) y los dos value sets del glosario que en un entorno real siembra la API |
| `seed-scratch-mondo.mjs` | Carga los MONDO reales de `mondo.obo` como code system `mondo`, sustituto de `seed-diseases` |
| `integration-run.sh` | Base de integración reproducible: `fresh-db.sh` y `load-catalog.mjs --from-snapshot` de #688 (worktree en `/var/tmp/wt-diseases`), `seed-missing-internal.mjs`, términos ×2, relaciones bloqueadas sin la tabla, tabla propuesta, `--check` por fuente y relaciones ×2 |
| `seed-missing-internal.mjs` | Base de integración con el catálogo real de #688: agrega sólo `REL_SYMPTOM` y `REL_SYMPTOM_EXCLUDED` a lo que ya sembró `seed-internal.mjs` de `seed-diseases` |
| `seed-scratch-diseases.mjs` | Carga `omim`/`orphanet`/`decipher` con los códigos de HPOA en el formato que confirmó `seed-diseases` (#688), sin títulos |

Salidas en `../postgres-desechable-*.txt`.
