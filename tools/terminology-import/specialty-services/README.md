# Servicios por especialidad (2026-10-24)

Relaciona servicios (FONASA MLE 2026, CUPS y los aranceles bolivianos ya
sembrados) con las especialidades de `VS_MEDICAL_SPECIALTY`, sólo con evidencia
de la fuente. Fuentes, hashes y licencias en [`SOURCES.md`](SOURCES.md); pasadas
y cobertura en
[`docs/seed-research/specialty-services.md`](../../../docs/seed-research/specialty-services.md).

```sh
node tools/terminology-import/specialty-services/build-specialty-services.mjs --report   # fuentes → NDJSON (fuera de git)
node tools/terminology-import/specialty-services/load-specialty-services.mjs              # dry-run (sin armado local, usa specialty-services/data/)
node tools/terminology-import/specialty-services/load-specialty-services.mjs --apply      # carga (.env DB_*)
node --test "tools/terminology-import/specialty-services/test/*.test.mjs"
```
