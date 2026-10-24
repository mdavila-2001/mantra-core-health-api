# Reporte — Terminología médica completa: diccionarios médicos generales

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `claude/vigilant-ramanujan-ms3xcw` (PR contra `dev`)
- Peldaño de evidencia alcanzado: `VERIFIED` para el ETL (camino real fetch → build → load ejercitado contra Postgres 16 con el DDL del módulo 03, persistencia contada, re-run 0). No `REGRESSION_VERIFIED`: no se corrió contra el stack completo con el glosario cargado, y la suite completa de Jest no se corrió (sólo los specs dirigidos).
- Avance: 15 / 17 microtareas HECHO (88 %). 2 BLOQUEADO. PR: https://github.com/mdavila-2001/mantra-core-health-api/pull/687

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1–M2 | 45 archivos de 43 fuentes, versión fija y SHA-256 | `node tools/terminology-import/dictionaries/fetch-dictionaries.mjs` | `"failures": []`; manifiesto en `glossary-data-build/dictionaries-sources/manifest.json` |
| H1.S2–S4 | Corpus normalizado | `node tools/terminology-import/dictionaries/build-dictionaries.mjs` | 496 272 conceptos, 386 969 relaciones tipadas, 1 367 aristas enfermedad→organismo, `missingSources: []` (`evidencia/coverage.json`) |
| H1 (tests) | Parseo y normalización con recortes reales | `node --test "tools/terminology-import/dictionaries/test/*.test.mjs"` | `# pass 18 # fail 0` (`evidencia/node-test-dictionaries.txt`) |
| H2.S1.M1 | `LANG_LA` + `REL_DEVELOPS_FROM`, `REL_LOCATED_IN`, `REL_INFECTIOUS_AGENT`, `REL_TRANSMITTED_BY` | `jest src/common/seed/concept-codes.spec.ts …` | verde (ver Evidencia) |
| H2.S1.M3 | Enlace por código a una enfermedad ya cargada | concepto de prueba `J13` en `icd10cm` de la base desechable + `load --only ncbitaxon-medical` | 1 relación `infectious-agent` J13 → *Streptococcus pneumoniae* (declarada por Mondo y DOID, deduplicada); concepto de prueba borrado |
| H2.S2.M1 | Carga e idempotencia | `load-dictionaries.mjs --apply` ×4 | 1.ª: 46 s, 111 389 conceptos, 7 601 maps; 2.ª: 0; 3.ª: +13 maps (defecto corregido, ver Desvíos); 4.ª: 0 (`evidencia/load-corrida-*.json`) |
| H3.S1 | Pasadas 1-8, 7 y 8 en 0; registro OBO 191/191 | — | `docs/seed-research/medical-dictionaries.md` |
| H3.S3.M1 | PR contra `dev`, sin merge | `create_pull_request` | https://github.com/mdavila-2001/mantra-core-health-api/pull/687 |

## A medias
ninguna

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H2.S2.M2 | BLOQUEADO | Correr `load-dictionaries.mjs --apply` contra el stack con el glosario cargado (la sesión no tenía el stack ni el corpus del glosario, que vive en la Mac del equipo). Es lo que mide los enlaces reales por MeSH/TA98/CIE-10. |
| H3.S2.M1 | BLOQUEADO | Habilitar `query.wikidata.org` y `www.wikidata.org` en la red del entorno y correr `import-wikidata-es-labels.mjs`. |

## Evidencia
```
$ node --test "tools/terminology-import/dictionaries/test/*.test.mjs"
# tests 18
# pass 18
# fail 0

$ NODE_OPTIONS=--max-old-space-size=12000 node_modules/.bin/tsc --noEmit --incremental false -p tsconfig.json
tsc exit 0

$ node_modules/.bin/eslint src/common/constants/concepts.ts ; prettier --check …
eslint exit 0
All matched files use Prettier code style!

$ jest src/common/seed/{concept-codes,glossary-seed.service,glossary-terms.catalog,dynamic-enum-catalog}.spec.ts src/modules/terminology
FAIL src/modules/terminology/import/xlsx-parser.spec.ts
Test Suites: 1 failed, 31 passed, 32 total
Tests:       1 failed, 396 passed, 397 total
# el mismo spec falla igual con los cambios guardados en stash (git stash): 1 failed, 17 passed, 18 total

$ load-dictionaries.mjs --apply   (Postgres 16 desechable, 4 corridas)
load-corrida-1.json  46 s  concepts 111389  conceptMaps 7601
load-corrida-2.json  28 s  concepts 0       conceptMaps 0
load-corrida-3       29 s  concepts 0       conceptMaps 13
load-corrida-4.json  73 s  concepts 0       conceptMaps 0
```

## No cubierto
- Enlaces reales con las fichas del glosario y con las sesiones hermanas (MeSH, TA98, CIE-10-ES, Mondo/DOID): el código está y el mecanismo se probó con un concepto de prueba; los números reales no se midieron.
- La API arrancada sembrando los conceptos nuevos de `concepts.ts`: en la base desechable se sembraron a mano con los mismos ids deterministas.
- `yarn lint` completo y la suite completa de Jest (sólo dirigidos).
- `import-wikidata-es-labels.mjs`: escrito, nunca corrido.
- Las fuentes opt-in (GO, OBA, PATO, ECTO, ENVO, BTO, CLO, OccO, PW, …) se construyeron pero no se cargaron.

## Desvíos del plan
- El plan se escribió al final (ver PLAN.md): `AGENTS.md` se vio recién al reiniciarse el proceso.
- La rama es la fijada por la sesión (`claude/vigilant-ramanujan-ms3xcw`), no `justin/seed-medical-dictionaries`.
- `yarn install` no pudo bajar `xlsx-0.20.3` (`cdn.sheetjs.com` bloqueado) ni Yarn (`repo.yarnpkg.com`): se instaló en una carpeta temporal con `COREPACK_NPM_REGISTRY` y `xlsx@0.18.5` sólo para verificar. Nada de eso se commitea.
- Defecto encontrado en el repaso del diff y corregido: el cargador tenía su propio mapa prefijo → code system, desactualizado; se unificó con `PREFIX_CODE_SYSTEM` de `sources.mjs` (la 3.ª corrida sumó los 13 concept_maps que faltaban) y se agregó un test de consistencia.
- Enfermería pasó a otra sesión (`justin/seed-nursing-care`) a mitad de trabajo: se sacó del alcance.

- Por orden del propietario transmitida por la sesión coordinadora («que todo quede en la nube»), el corpus normalizado **sí** se subió a git, al revés de lo que decía el brief original («fuentes fuera de git»): `tools/terminology-import/dictionaries/data/` (88 archivos gzip, 31,7 MB, el mayor de 12 MB, `INDEX.json` con SHA-256). Restauración verificada con `pack-dictionaries-data.mjs --unpack` (SHA-256 iguales; el plan de carga da los mismos 111 389 conceptos). Los crudos (500 MB, `fma.owl` 200 MB) no se suben: `data/manifest.json` y `fetch-dictionaries.mjs` los reproducen.

## Riesgos residuales
- Corpus en inglés: no aparece en `/glossary` hasta tener nombres ES.
- `concept_properties` ocupa 195 MB de los 335 MB de la carga por defecto.
- Si otra sesión carga la misma ontología con otra URL canónica, se crea un segundo code system (la deduplicación es por URL canónica o `internal_code`).

## Decisiones y ambigüedades
- Licencia de FMA: confirmada por el propietario el 2026-10-24 (corpus derivado de FMA en git y cargado por defecto).
- Sólo sinónimos EXACT son designaciones; castellano y latín sólo con idioma declarado por la fuente (FMA).
- Xrefs SNOMED/UMLS/MedGen/MedDRA no se copian (licencias; Bolivia no es miembro de SNOMED).
- Carga por defecto sólo de lo que sirve a una consulta del producto; el resto opt-in con motivo y tamaño.
- Predicado ambiguo (BTO «derives from/develops from») no se carga tipado.
- Saturación declarada sobre el universo alcanzable; las fuentes bloqueadas quedan como huecos, no como «imposibles».
