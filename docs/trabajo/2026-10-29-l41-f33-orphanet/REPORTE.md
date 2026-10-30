# TAREA-41 F3.3 — Orphanet product4 y cargador HPO/Orphanet

## Qué hay
- `tools/terminology-import/lib/glossary-es/orphanet.mjs` (puro): `parseOrphanetProduct4`, `orphanetToRelationshipRows`.
  Orphanet → SYMPTOM enfermedad → fenotipo, T2 `CURATED_REFERENCE`, frecuencia por los 6 grados del archivo,
  sin `ordinal`, referencia `ORPHA:<n> @orphadata-product4 #<id asociación>` (única por asociación).
- `tools/terminology-import/import-f3-relations.mjs`: arma las filas de HPO (F3.2) y Orphanet y, con `--load`,
  las carga en un lote por fuente con `bulkLoadRelationships` (`--dry-run` = ROLLBACK).
- `test/f3-orphanet.test.mjs` (7 pruebas) con un recorte del XML real (`fixtures/f3/orphanet-product4.cut.xml`).

## Evidencia (rung 5 — carga en base LOCAL observada; no en VPS)
- Sobre el archivo real: 116 664 asociaciones, 4 355 trastornos, ids de asociación únicos, 0 etiquetas de
  frecuencia desconocidas — coincide con `volumes.md` de F3.0.
- Filas armadas con la identidad MONDO real: HPO **151 589** (= filas de evidencia medidas en F3.0),
  Orphanet **115 501** (1 006 sin grupo MONDO: 809 `no-mondo-group` + 197 `group-in-review`; 157 con fenotipo no vigente).
- `node --test "tools/terminology-import/test/**/*.test.mjs"`: 121 pruebas, 120 pasan, 0 fallan, 1 omitida (paridad SQL, necesita Postgres).
- `yarn typecheck` exit 0. `yarn lint`: no corrido (OOM de eslint; no cubre `tools/*.mjs`).

## No hecho / bloqueado
- **VPS test/dev**: no se cargó; solo la base local (`mantra-redesa-postgres-1`).
- **F3.3 product9** (edad de inicio, herencia, prevalencia → `concept_properties`) y **clasificaciones → SPECIALTY**
  (`data/orphanet-classification-specialty.csv` curado a mano): no se hicieron; la tabla de correspondencia
  la revisa una persona, no se infiere.
- **F3.4–F3.7**: sin empezar.
- **Volumen**: F3.0 proyecta 279 012 relaciones contra la meta de 800 000. La ficha manda informar al propietario
  y no rellenar con fuentes de menor calidad. HPO + Orphanet suman 267 090 filas de evidencia.
- Los 21 conflictos de identidad de F3.1 siguen sin decidir.

## Carga en la base local (2026-10-29)
Prerrequisitos que la base local no tenía y se cargaron con sus importadores: MONDO (`diseases/load-catalog.mjs --from-snapshot --systems mondo`, 27 695 conceptos) y HPO (`symptoms/load-symptoms.mjs --apply --systems hpo --no-glossary`, 19 894).
- `--dry-run` PASS, carga real, y **segunda pasada 0 relaciones / 0 evidencias nuevas** (`evidencia/load-pass1.txt`, `load-pass2.txt`).
- Cargado: **HPO 149 252** y **Orphanet 109 861** evidencias (263 873 en total con las 4 760 NNAC); relaciones 360 255.
- Integridad (`evidencia/verificacion-db.txt`): 0 FKs sin validar, 0 evidencias sin relación, 0 relaciones con origen o destino inexistente.
- El cargador, con `--load`, descarta las enfermedades cuya ficha del glosario no existe en la base y las cuenta como `concept-not-in-database` (HPO 2 337 filas, Orphanet 5 646). No se crean conceptos. Primer intento sin ese filtro: violación de `fk_concept_relationships_source_concept_id` (144 grupos «reusados» con ficha ausente).
- **Hallazgo de producto**: «Fiebre» (HP:0001945) ordena arriba enfermedades raras genéticas (fuerza 1,00, T2) y no las comunes. Cumple la letra del criterio (T1/T2) pero no es lo que un médico espera ver primero; hay que decidir si F5 filtra por prevalencia/familiaridad.
- Incidente: la carga llenó el disco de la Mac y Docker se colgó; Postgres recuperó por WAL sin pérdida (81 326 conceptos y 0 FK sin validar al volver).
