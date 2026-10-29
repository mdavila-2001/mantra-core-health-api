# TAREA-41 F3.3 — Orphanet product4 y cargador HPO/Orphanet

## Qué hay
- `tools/terminology-import/lib/glossary-es/orphanet.mjs` (puro): `parseOrphanetProduct4`, `orphanetToRelationshipRows`.
  Orphanet → SYMPTOM enfermedad → fenotipo, T2 `CURATED_REFERENCE`, frecuencia por los 6 grados del archivo,
  sin `ordinal`, referencia `ORPHA:<n> @orphadata-product4 #<id asociación>` (única por asociación).
- `tools/terminology-import/import-f3-relations.mjs`: arma las filas de HPO (F3.2) y Orphanet y, con `--load`,
  las carga en un lote por fuente con `bulkLoadRelationships` (`--dry-run` = ROLLBACK).
- `test/f3-orphanet.test.mjs` (7 pruebas) con un recorte del XML real (`fixtures/f3/orphanet-product4.cut.xml`).

## Evidencia (rung 4 — TESTED; NO hay carga en base)
- Sobre el archivo real: 116 664 asociaciones, 4 355 trastornos, ids de asociación únicos, 0 etiquetas de
  frecuencia desconocidas — coincide con `volumes.md` de F3.0.
- Filas armadas con la identidad MONDO real: HPO **151 589** (= filas de evidencia medidas en F3.0),
  Orphanet **115 501** (1 006 sin grupo MONDO: 809 `no-mondo-group` + 197 `group-in-review`; 157 con fenotipo no vigente).
- `node --test "tools/terminology-import/test/**/*.test.mjs"`: 121 pruebas, 120 pasan, 0 fallan, 1 omitida (paridad SQL, necesita Postgres).
- `yarn typecheck` exit 0. `yarn lint`: no corrido (OOM de eslint; no cubre `tools/*.mjs`).

## No hecho / bloqueado
- **Carga en base**: Docker estaba apagado y el disco tiene 3 GB libres; `--load` y la paridad SQL no se ejercitaron.
- **F3.3 product9** (edad de inicio, herencia, prevalencia → `concept_properties`) y **clasificaciones → SPECIALTY**
  (`data/orphanet-classification-specialty.csv` curado a mano): no se hicieron; la tabla de correspondencia
  la revisa una persona, no se infiere.
- **F3.4–F3.7**: sin empezar.
- **Volumen**: F3.0 proyecta 279 012 relaciones contra la meta de 800 000. La ficha manda informar al propietario
  y no rellenar con fuentes de menor calidad. HPO + Orphanet suman 267 090 filas de evidencia.
- Los 21 conflictos de identidad de F3.1 siguen sin decidir.
