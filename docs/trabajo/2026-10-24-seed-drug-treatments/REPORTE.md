# Reporte — Tratamientos farmacológicos por enfermedad (relaciones publicadas)

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `justin/seed-drug-treatments`
- Peldaño de evidencia alcanzado: `TESTED` en general; `VERIFIED` para la carga en una base **desechable** (no en un stack real); enlace contra enfermedades: pendiente (la rama de la que depende no existe aún).
- Avance: 13 HECHO / 15 microtareas (86,7 %). A MEDIAS: H3 enlace contra enfermedades (1). BLOQUEADO: corpus de fuentes oficiales (1).

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Registro de fuentes con repo, commit, versión y licencia | `node --test tools/terminology-import/drug-treatments/test/*.test.mjs` | test 1 ok |
| H1.S1.M2 | Clonado en commit fijado + manifiesto SHA-256 | `node tools/terminology-import/drug-treatments/fetch-sources.mjs` | 5 clones, manifiesto escrito |
| H2.S1.M1–M5 | Parsers LabeledIn (experto/crowd), PharmacotherapyDB, DrugCentral 2016, DrugMechDB, MAxO | tests 4–9 | ok con filas reales |
| H2.S2.M1 | Cruces MONDO SSSOM y DrugCentral con `via`/`predicate` | test 10 | ok |
| H2.S3.M1 | Dedupe por código y pasadas | `build-drug-treatments.mjs` | 18 032 afirmaciones; pasada 1: 13 939 pares nuevos; pasada 2: 33 |
| H3 (carga) | Carga sin DDL e idempotencia en Postgres 16 desechable | `load-drug-treatments.mjs --apply` ×2 | 1ª: 18 047 / 318 971 / 11 320; 2ª: 0 / 0 / 0 |
| H3 (validador) | `validate-links.mjs` corre (sólo lectura) | contra la base desechable | ok |
| H4 gates | typecheck y lint | `NODE_OPTIONS=--max-old-space-size=8192 corepack yarn typecheck` / `… lint` | exit 0 / exit 0 |
| H4 tests | tests dirigidos + los del resto de importadores | `node --test tools/terminology-import/test/*.test.mjs tools/terminology-import/drug-treatments/test/*.test.mjs` | 46 pass, 0 fail |
| H4 docs | `docs/seed-research/drug-treatments.md`, `SOURCES.md`, `README.md` | — | escritos |

## A medias
### H3 — Enlace contra enfermedades cargadas
- Qué anda: resolvedor por código exacto, configurable con `--targets`; probado contra RxCUI/ICD-10-CM de prueba.
- Qué no anda: no hay medida real: `origin/justin/seed-diseases` no existe (fetch del 2026-10-24).
- Qué falta exactamente: cuando exista, mergearla en una rama local de validación, cargar sus enfermedades y correr `validate-links.mjs --targets` con los `internal_code` de `docs/seed-research/diseases.md`.
- Dónde quedó: `tools/terminology-import/drug-treatments/validate-links.mjs`.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| Fuentes oficiales (MED-RT, ChEMBL, ClinicalTrials.gov, OMS, EMA, Wikidata, RxNav…) | BLOQUEADO | Habilitar los dominios en la red del entorno (lista en `docs/seed-research/drug-treatments.md` §2) |
| Enlace con `vademecum` (ATC 5) | BLOQUEADO | Un cruce publicado → ATC (RxNav, ChEMBL, Wikidata o DrugCentral actual), hoy detrás de hosts bloqueados |
| `--apply` contra una base compartida | TODO | Decisión del propietario sobre el almacenamiento interino (afirmación-concepto) o cambio del modelo (§6 del doc) |

## Evidencia
```
$ node tools/terminology-import/drug-treatments/build-drug-treatments.mjs
[build] pasada 1 · pharmacotherapydb: 1388 afirmaciones
[build] pasada 1 · drugcentral-2016: 9094 afirmaciones
[build] pasada 1 · drugmechdb: 4662 afirmaciones
[build] pasada 2 · maxo: 38 afirmaciones
  "assertions": 18032 … pasada 1 "newPairs": 13939 … pasada 2 "newPairs": 33

$ load-drug-treatments.mjs --apply   (2ª corrida)
[('drug-treatment-relation-types', 0, 0, 0), ('drug-treatment-assertions-labeledin', 0, 0, 0), ('drug-treatment-assertions-pharmacotherapydb', 0, 0, 0), ('drug-treatment-assertions-drugcentral-2016', 0, 0, 0), ('drug-treatment-assertions-drugmechdb', 0, 0, 0), ('drug-treatment-assertions-maxo', 0, 0, 0)]

$ node --test tools/terminology-import/test/*.test.mjs tools/terminology-import/drug-treatments/test/*.test.mjs
# tests 46
# pass 46
# fail 0
```

## No cubierto
- No se corrió contra el stack Docker real ni con la API arrancada (la semilla de la base desechable inserta a mano el concepto «estado activo»).
- La instalación local de dependencias reemplazó **temporalmente** `xlsx` (tarball de `cdn.sheetjs.com`, bloqueado) por `xlsx@0.18.5` de npm para poder correr typecheck/lint; `package.json` y `yarn.lock` se restauraron y no forman parte del diff.
- typecheck y lint necesitaron `--max-old-space-size=8192` (con el heap por defecto, OOM).

## Desvíos del plan
- La rama es `justin/seed-drug-treatments` (la que pide la tarea), no la rama automática de la sesión.
- Se agregaron pasadas 3 y 4 sólo de medición (no cargan nada) para cumplir el protocolo de saturación.

## Riesgos residuales
Ver `docs/seed-research/drug-treatments.md` §8 (UMLS CUI, origen FDB de DrugCentral 2016, tipos negativos, corpus pequeño frente a internet).

## Decisiones y ambigüedades
- `concept_relationships` sin procedencia → no se escriben aristas directas; afirmación-concepto interina + propuesta al modelo (doc §1 y §6). Confirmar con Justin.
- Pares «nuevos» de `dhimmel/drugcentral` (82) no se cargan: son una recodificación de terceros de filas ya cargadas.
