# Síntomas, signos y fenotipos, con su relación a enfermedades (2026-10-24; huecos cerrados el 2026-10-27)

Fuentes y licencias en [`SOURCES.md`](SOURCES.md); investigación, pasadas de
saturación, cobertura y huecos en
[`docs/seed-research/symptoms.md`](../../../docs/seed-research/symptoms.md).
Cuatro sistemas de códigos (el cuarto, **MeSH C23**, 966 descriptores, es del 2026-10-27): **HPO** (19 894 términos, 19 345 con nombre oficial en
castellano), **Symptom Ontology** (895) y **NCIt** signos, síntomas y hallazgos
clínicos (3 988, NCIt 26.02d), con su jerarquía is-a. Relaciones enfermedad → síntoma **sólo de
anotaciones publicadas** (HPOA con OMIM/Orphanet/DECIPHER, Mondo, Disease
Ontology, anotaciones de enfermedades comunes de HPO, **Orphadata producto 4**), con frecuencia y evidencia.

| Etapa | Script | Qué hace |
|---|---|---|
| 0 | `fetch-symptom-sources.mjs` | Baja las fuentes a `glossary-data-build/symptoms-sources/` + `manifest.json` (SHA-256, versión) |
| 1 | `build-symptoms-corpus.mjs` | NDJSON normalizado + `coverage.json` + `saturation.json`. Sin red ni base |
| 2 | `load-symptoms.mjs` | Términos a `terminology.*` (dry-run por defecto; `--apply`; `--glossary` opcional) |
| — | `pack-data.mjs` / `unpack-data.mjs` | Corpus normalizado comprimido y versionado en `data/` (27,8 MB) ↔ `glossary-data-build/symptoms/` |
| 1b | `build-gap-sources.mjs` | Orphadata producto 4, MeSH C23, Wikidata P3841 y cruces de MedGen → NDJSON + `gap-coverage.json` + `saturation-gaps.json` (2026-10-27) |
| 2b/2c | `load-wikidata-crosswalk.mjs`, `load-medgen-crosswalk.mjs` | Cruces HPO↔Wikidata y por CUI (idempotentes) |
| 3 | `load-disease-phenotypes.mjs` | Relaciones enfermedad → síntoma contra `terminology.concept_relationship_evidence` del modelo v4.2.50 (patch v4250, e8bd453). Aborta sin escribir si falta la tabla o los value sets |

Pruebas: `node --test "tools/terminology-import/symptoms/test/*.test.mjs"` (27, con recortes reales). Base desechable para probar los cargadores: `test/disposable-db/` (`fresh-db.sh` aplica el DDL de `database/SQL` y el patch v4250 del repo del modelo, sin tocarlo).
