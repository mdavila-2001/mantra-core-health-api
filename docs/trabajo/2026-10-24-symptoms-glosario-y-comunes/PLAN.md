# Plan — Glosario de síntomas por defecto y anotaciones comunes confirmadas

- Fecha: 2026-10-24 · Repos afectados: `mdavila-2001/mantra-core-health-api` · Predecesor: seed-symptoms (mdavila-2001/mantra-core-health-api#686, mergeado; su plan y reporte se borraron en la limpieza 268f43c7 y quedan en el historial de git)
- Resultado observable: al correr `load-symptoms.mjs --apply` sin flags, los 18 646 fenotipos de HPO con nombre oficial en castellano quedan como miembros de `glossary-all-terms` y `glossary-category-signs-symptoms`; las anotaciones de enfermedades comunes de HPO siguen en la carga de relaciones por defecto, ya no como decisión pendiente.
- Kill-test: `load-symptoms.mjs --apply` sin flags contra la base desechable y ver `glossaryMembers: 0`.

## Alcance
- IN: `tools/terminology-import/symptoms/load-symptoms.mjs` (default del glosario), su prueba, `tools/terminology-import/symptoms/README.md`, `docs/seed-research/symptoms.md`, este directorio.
- OUT: `src/` (la API ya lee el glosario por membresía), los importadores compartidos del glosario, el modelo (la tabla de evidencia sigue pendiente en el repo del modelo).
- Ambigüedades registradas:
  1. «Cargá las anotaciones comunes»: la carga de relaciones está bloqueada por el modelo (falta `concept_relationship_evidence`). Supuesto: se confirman como parte de la carga por defecto (ya lo eran) y se cargan donde la tabla existe (base desechable); en una base real entran cuando el modelo la agregue. Confirmar con Justin.
  2. Duplicados visibles en el glosario con fichas `wikidata-sintoma-*` (sin id HPO): el propietario activó el glosario sabiendo el riesgo. Supuesto: se activa igual y se deja documentado.

## H1 — Glosario activado por defecto
**CA:** Dado el corpus, cuando se corre `load-symptoms.mjs --apply` sin flags, entonces los fenotipos HPO con nombre ES oficial quedan en el glosario; con `--no-glossary`, no.
**DoD:** prueba + corrida en base desechable. **Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Default del flag | `glossaryEnabled([])` = true, `glossaryEnabled(['--no-glossary'])` = false | `node --test "tools/terminology-import/symptoms/test/*.test.mjs"` → `# fail 0` | HECHO |
| H1.S1.M2 | Carga sin flags | `glossaryMembers: 37292` | `load-symptoms.mjs --apply` en base desechable | HECHO |
| H1.S1.M3 | Idempotencia | segunda corrida 0 | idem ×2 | HECHO |

## H2 — Anotaciones comunes en la carga por defecto
**CA:** Dada la tabla de evidencia, cuando se corre `load-disease-phenotypes.mjs --apply` sin `--sources`, entonces se cargan también las anotaciones de enfermedades comunes.
**DoD:** corrida en base desechable con el catálogo real de #688. **Estado:** HECHO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Sin `--sources` incluye `hpo-common-disease` | evidencia con `source = hpo-common-disease` > 0 | `psql … count(*) where qualifiers->>'source'='hpo-common-disease'` | HECHO |

## H3 — Documentación y entrega
| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Docs: decisiones resueltas | README e investigación sin «pendiente» para estas dos decisiones | `grep` | HECHO |
| H3.S1.M2 | PR contra `dev` | PR abierto, listo (no draft), sin merge | mdavila-2001/mantra-core-health-api#726 | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Fichas duplicadas en el glosario («Fiebre» de Wikidata y de HPO) | dos resultados para un síntoma | documentado; se resuelve con el cruce P3841 de Wikidata cuando haya acceso |
| Tabla de evidencia ausente en el modelo | relaciones sin cargar en bases reales | sin cambio: el cargador aborta sin escribir |
