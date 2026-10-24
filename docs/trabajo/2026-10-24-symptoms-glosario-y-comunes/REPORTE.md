# Reporte — Glosario de síntomas por defecto y anotaciones comunes confirmadas

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama: `claude/amazing-ptolemy-sin3nw` (rehecha desde `dev` tras el merge de #686)
- Peldaño de evidencia alcanzado:
  - **VERIFIED** en una base desechable: el glosario por defecto y la carga de relaciones con las anotaciones comunes, con el catálogo real de `seed-diseases` (ya en `dev`).
  - No es REGRESSION_VERIFIED: no se arrancó la API, así que no se vio el glosario en pantalla.
- Avance: 7 HECHO / 7 microtareas = **100 %** (PR mdavila-2001/mantra-core-health-api#726, listo para revisión, sin mergear)

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | El glosario está activado por defecto; `--no-glossary` lo apaga y `--glossary` se sigue aceptando | `node --test "tools/terminology-import/symptoms/test/*.test.mjs" "tools/terminology-import/test/*.test.mjs"` | `# tests 63 · # pass 63 · # fail 0` |
| H1.S1.M2 | Una carga sin flags suma los fenotipos HPO con nombre ES oficial al glosario | `load-symptoms.mjs --apply` | `"glossaryMembers":37292`; `glossary-all-terms` 18 646 y `glossary-category-signs-symptoms` 18 646 |
| H1.S1.M3 | Idempotencia | idem, segunda corrida | todos los contadores en 0 |
| H2.S1.M1 | Las anotaciones comunes entran en la carga por defecto | `load-disease-phenotypes.mjs --apply` (sin `--sources`) + `psql` | `hpo-common-disease`: 132 008 evidencias en 131 251 aristas; total 402 633 aristas y 403 959 evidencias; segunda corrida 0/0 |
| H3.S1.M2 | PR contra `dev`, listo (no draft) | — | mdavila-2001/mantra-core-health-api#726 |
| H3.S1.M1 | Decisiones documentadas como resueltas | `tools/terminology-import/symptoms/README.md`, `docs/seed-research/symptoms.md` | ya no figuran como pendientes |

## A medias
ninguna

## Gates sobre el head con `dev` mergeado (36c212bb)
| Gate | Resultado | Evidencia |
|---|---|---|
| `corepack yarn typecheck` | exit 0 | `evidencia/typecheck.txt` |
| `corepack yarn lint` | exit 0 | `evidencia/lint.txt` |
| `corepack yarn build` | exit 0 | `evidencia/build.txt` |
| `node --test` (síntomas + importadores) | 63/63 | `evidencia/node-test.txt` |
| `corepack yarn test src/modules/terminology src/common/seed --runInBand` | 657/658; falla `xlsx-parser.spec.ts` por el entorno (xlsx 0.18.5 local en vez de 0.20.3, CDN bloqueado); el PR no toca `src/` | `evidencia/jest-terminologia.txt` |
| CI de GitHub | sin corridas: el workflow «Documentación» no corre en el repo desde el 2026-10-22 (última corrida #805); el PR figura `blocked` | — |

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| — | — | ninguna microtarea pendiente en este plan; fuera de él siguen la tabla de evidencia en el modelo y las licencias de HPO/NCIt |

## Evidencia
Salidas completas en `evidencia/` de este directorio: `integracion.txt`, `glosario-fiebre.txt` y `node-test.txt`. El andamio de la base desechable está en `evidencia/andamio/`. Recortes literales de `integracion.txt`:

```
$ load-symptoms.mjs --apply   (corrida 1)
[load] {"codeSystem":"hpo",...,"concepts":19894,"designations":61927,"properties":309294,"isA":24436,"maps":0,"glossaryMembers":37292,"remappedIds":0}
(26 s)
$ load-symptoms.mjs --apply   (corrida 2)
[load] {"codeSystem":"hpo",...,"concepts":0,"designations":0,"properties":0,"isA":0,"maps":0,"glossaryMembers":0,"remappedIds":0}
$ load-disease-phenotypes.mjs --apply   (corrida 1)
    "relationships": 402633,
    "evidence": 403959
(75 s)
$ load-disease-phenotypes.mjs --apply   (corrida 2)
    "relationships": 0,
    "evidence": 0
 glossary-all-terms               | 18646
 glossary-category-signs-symptoms | 18646
 hpo-common-disease |     132008 |  131251
```

Recorte literal de `glosario-fiebre.txt`:

```
 HP:0001945 | Fiebre  | glossary-all-terms, glossary-category-signs-symptoms | hpo-hp-0001945 | Fever | Fiebre | Hyperthermia | Pyrexia
```

## No cubierto
- No se arrancó la API: no se observó `/glossary` ni `GET /terminology/concepts` con los 18 646 términos nuevos. Se comprobó por SQL que cada término tiene membresía, estado activo, designación ES y `glossary-slug`, que es lo que lee `ConceptsService`.
- La base desechable no tiene las fichas `wikidata-sintoma-*` del glosario existente, así que no se midió cuántos duplicados visibles aparecen.
- Carga en una base real: las relaciones (incluidas las comunes) siguen sin poder escribirse fuera de la base desechable, porque el modelo no tiene `concept_relationship_evidence`.

## Desvíos del plan
- El plan del trabajo anterior (`docs/trabajo/2026-10-24-seed-symptoms/`) ya no existe en `dev`: lo borró la limpieza 268f43c7. El enlace al predecesor se reemplazó por la referencia al PR #686.
- La siembra de la base de integración ahora también crea los value sets del glosario, porque `load-symptoms.mjs` los exige con el glosario activado.

## Riesgos residuales
- **Duplicados visibles en el glosario.** Un mismo síntoma puede aparecer como ficha `wikidata-sintoma-*` y como término HPO (p. ej. «Fiebre»). Lo aceptó el propietario; se resuelve trayendo P3841 de Wikidata.
- **Anotaciones comunes sobre DOID obsoletos.** 10 059 evidencias caen en 309 DOID que DO ya marcó como obsoletos; sólo 2 tienen `replaced_by`. Se cargan como vienen.
- **Duplicados exactos en HPOA.** 31 líneas de `phenotype.hpoa` son copias exactas de otras: generan la misma clave y quedan como una sola evidencia (268 875 evidencias de 268 906 filas).

## Decisiones y ambigüedades
| Ambigüedad | Supuesto tomado | A confirmar con |
|---|---|---|
| «Cargá las anotaciones comunes» con el modelo sin tabla de evidencia | Quedan en la carga por defecto y se probaron en la base desechable; en una base real entran cuando el modelo agregue la tabla | Justin |
| Glosario con riesgo de duplicados | Activado por decisión del propietario | resuelto |
