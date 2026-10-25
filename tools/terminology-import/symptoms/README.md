# Síntomas, signos y fenotipos, con su relación a enfermedades (2026-10-24)

Fuentes y licencias en [`SOURCES.md`](SOURCES.md); investigación, pasadas de
saturación, cobertura y huecos en
[`docs/seed-research/symptoms.md`](../../../docs/seed-research/symptoms.md).
Tres sistemas de códigos: **HPO** (19 894 términos, 19 345 con nombre oficial en
castellano), **Symptom Ontology** (895) y **NCIt** signos, síntomas y hallazgos
clínicos (3 988, NCIt 26.02d), con su jerarquía is-a. Relaciones enfermedad → síntoma **sólo de
anotaciones publicadas** (HPOA con OMIM/Orphanet/DECIPHER, Mondo, Disease
Ontology, anotaciones de enfermedades comunes de HPO), con frecuencia y evidencia.

| Etapa | Script | Qué hace |
|---|---|---|
| 0 | `fetch-symptom-sources.mjs` | Baja las fuentes a `glossary-data-build/symptoms-sources/` + `manifest.json` (SHA-256, versión) |
| 1 | `build-symptoms-corpus.mjs` | NDJSON normalizado + `coverage.json` + `saturation.json`. Sin red ni base |
| 2 | `load-symptoms.mjs` | Términos a `terminology.*` (dry-run por defecto; `--apply`). Con `--apply` también suma al glosario los 18 646 fenotipos HPO con nombre ES oficial (por defecto desde 2026-10-24; `--no-glossary` lo apaga), menos los que una ficha `wikidata-sintoma-*` ya del glosario representa según Wikidata P3841 (`--no-dedupe` lo apaga; `--prune-duplicates` quita las membresías duplicadas ya cargadas) |
| — | `fetch-hpo-wikidata-crosswalk.mjs` | Baja de Wikidata el cruce HPO ↔ ítem (P3841) a `crosswalk/` (versionado, ~30 KB); lo lee la etapa 2 |
| — | `pack-data.mjs` / `unpack-data.mjs` | Corpus normalizado comprimido y versionado en `data/` (20,9 MB) ↔ `glossary-data-build/symptoms/` |
| 3 | `load-disease-phenotypes.mjs` | Relaciones de las cuatro fuentes, incluidas las anotaciones de enfermedades comunes (decisión del propietario, 2026-10-24). **Bloqueado por el modelo**: exige `terminology.concept_relationship_evidence` (propuesta en `proposal/`) |

Pruebas: `node --test "tools/terminology-import/symptoms/test/*.test.mjs"` (22, con recortes reales).
