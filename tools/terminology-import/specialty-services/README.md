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
node tools/terminology-import/specialty-services/propose-model-specialties.mjs --markdown   # especialidades que las fuentes nombran y el modelo no tiene (data/model-proposal.json)
node --test "tools/terminology-import/specialty-services/test/*.test.mjs"
```

Desde el 2026-10-27 el armado también baja la **CUPS 2025** (Resolución 2706 de 2025, PDF oficial del Ministerio de
Salud de Colombia, SHA-256 fijo) y la lee con `pdftotext -raw` (poppler): `lib/cups2025.mjs`. El armado es reproducible:
`retrievedAt` es la fecha de descarga del archivo en la caché, no la hora del armado, así que dos armados con la misma caché
dan los mismos bytes. Base desechable para medir la carga: `test/disposable-db/fresh-db.sh`.
