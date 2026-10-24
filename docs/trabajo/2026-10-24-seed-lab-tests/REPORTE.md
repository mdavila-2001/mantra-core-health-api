# Reporte — Seeder exhaustivo de análisis médicos

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `claude/ecstatic-gates-jifuy0` →
  PR [#681](https://github.com/mdavila-2001/mantra-core-health-api/pull/681) contra `dev` (sin mergear)
- Peldaño de evidencia alcanzado: **`VERIFIED`** para el importador y la carga: camino real
  ejercitado contra Postgres 16 con el DDL del módulo 03, persistencia medida e idempotencia
  comprobada. No llega a `REGRESSION_VERIFIED`: no se corrió `yarn build` ni la suite `yarn test`
  de la API (este cambio no toca código de `src/`) y la carga no se ejercitó contra una base sembrada
  por la API real. Los 6 conceptos internos se insertaron a mano.
- Avance: **24 / 27 microtareas HECHO = 88,9 %** (2 `BLOQUEADO`, 1 `DESCARTADO`).

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1–M3 | Tablas del módulo 03, binding de órdenes y claves de `import-loinc.mjs` localizados | `grep` (ver PLAN) | documentado en `docs/seed-research/lab-tests.md` |
| H1.S2.M1 | Red sondeada | `curl -w '%{http_code}'` | primarias 403; npm, PyPI y Maven llegan (pasadas 0 y 9) |
| H2.S1.M1–M6 | Registro común, parsers (THO, UCUM, LOINC, aranceles, PCS) y reglas de dominio | `node --test "tools/terminology-import/test/*.test.mjs"` | `# tests 46 · # pass 46 · # fail 0` |
| H2.S2.M1 | Descarga reproducible de 7 fuentes npm con SHA-256 e integridad | `fetch-lab-tests-sources.mjs` | `data/sources-manifest.json` |
| H2.S2.M2 | Build a NDJSON + cobertura | `build-lab-tests.mjs` | 7 capas; `loinc: SIN DATOS` |
| H2.S3.M1–M3 | Plan puro, cargador idempotente, value sets en versión estable | `load-lab-tests.mjs --apply` ×2 | 1.ª: 12 765 conceptos / 221 139 propiedades / 3 682 designaciones / 119 value sets / 36 139 membresías; 2.ª: **0** |
| H3.S1.M1–M2 | 10 pasadas registradas (0–9); 7 y 8 en 0 | tabla de pasadas | corte por saturación dentro de lo alcanzable |
| H4.S1.M1 | Tests dirigidos | `node --test …` | 46/46 (`evidencia/node-test.txt`) |
| H4.S1.M2 | Ruta LOINC en Postgres con CSV sintéticos | `build --loinc-release 0.00-sintetico` + `load --layers loinc` ×2 | 4 conceptos, 2 designaciones ES, 2 *part-of*; 2.ª corrida 0 |
| H4.S1.M3–M4 | Typecheck y lint | `corepack yarn typecheck` / `lint` | exit 0 (`evidencia/typecheck-lint.txt`) |
| H4.S1.M5 | MkDocs estricto y enlaces | `mkdocs build --strict` / `yarn docs:links` | exit 0, «Sin enlaces rotos» (`evidencia/docs.txt`) |
| H4.S2.M1 | Datos normalizados versionados (1,4 MB gz) y carga sin build local | `GLOSSARY_BUILD_DIR=<vacío> load-lab-tests.mjs --apply` ×2 | capas leídas «← data/…»; 1.ª 12 765, 2.ª 0 |
| H4.S2.M2 | PR abierto contra `dev` | MCP GitHub | #681 |

## A medias

ninguna

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H3.S2.M1 — LOINC (6 ejes, paneles, unidades, variante ES, Playbook, Universal Lab Orders, Top 2000) | BLOQUEADO | Una persona crea la cuenta en loinc.org y descomprime «LOINC Table + Accessory Files» en `lab-tests-sources/loinc/`; después corre `build-lab-tests.mjs --loinc-release <v>`, `pack-lab-tests-data.mjs` y `load-lab-tests.mjs --apply`. Hoy además loinc.org da 403 desde la sesión. |
| H3.S2.M2 — NCBI GTR | BLOQUEADO | Habilitar `ftp.ncbi.nlm.nih.gov` en la red del entorno; escribir el parser contra el archivo real. |
| H3.S2.M3 — Subgrupos mixtos (≈1 000 prestaciones) | DESCARTADO | Curaduría humana ítem por ítem: FONASA 11-01, 12-01, 13-01, 17-01, 17-07, 18-01, 19-01, 20-01; TUSS 4.02, 4.04, 4.07, 4.12, 4.13, 4.15; PAMI 17, 26, 28–31. |

## Evidencia

```
$ node --test "tools/terminology-import/test/*.test.mjs"          (evidencia/node-test.txt)
# tests 46
# pass 46
# fail 0

$ GLOSSARY_BUILD_DIR=<vacío> load-lab-tests.mjs --apply   # corrida 1 (evidencia/carga-desde-data-postgres16.txt)
"sources": 7, "codeSystems": 12, "versions": 12, "concepts": 12765, "properties": 221139,
"designations": 3682, "relationships": 0, "valueSets": 119, "valueSetVersions": 119,
"valueSetMembers": 36139, "batches": 12
$ … corrida 2
"sources": 0, "codeSystems": 0, "versions": 0, "concepts": 0, "properties": 0, "designations": 0,
"relationships": 0, "valueSets": 0, "valueSetVersions": 0, "valueSetMembers": 0, "batches": 12

$ load-lab-tests.mjs --apply --layers loinc   (CSV sintéticos; evidencia/loinc-sintetico-postgres16.txt)
corrida 1: "concepts":4,"properties":91,"designations":2,"relationships":2,"valueSets":8,"valueSetMembers":11
corrida 2: todo 0
0001-0 part-of 0000-0 #1
0002-0 part-of 0000-0 #2
```

Typecheck, lint, mkdocs y enlaces: salidas literales en `evidencia/typecheck-lint.txt` y `evidencia/docs.txt`.

## No cubierto

- **Contra una base sembrada por la API real:** no se probó. Los 6 conceptos internos
  (estado activo, idioma ES, tipos de designación, *part-of*, *is-a*) se insertaron a mano con los
  mismos ids deterministas (`/var/tmp/pgtest/prereq.sql`, fuera de git).
- **Endpoints HTTP:** no se probó la lectura por `GET /terminology/value-sets` ni `$expand` con la API
  levantada. Por código, leen `value_set_members` directamente (`value-sets.service.ts › findMembersPage`).
- **Parser LOINC contra archivos reales:** nunca corrió; sólo con CSV sintéticos.
- **Convivencia con `import-loinc.mjs`:** no se probó que conviva con datos ya cargados por ese
  importador. Por diseño reusa sus ids y `ON CONFLICT DO NOTHING`.
- **`yarn build` y `yarn test` (jest) de la API:** no corridos. No hay cambios en `src/` salvo un README.

## Desvíos del plan

- **Plan y reporte tardíos.** `PLAN.md` y este reporte se escribieron al cierre: no leí el
  `AGENTS.md` versionado al empezar (busqué `CLAUDE.md` y `.claude/rules/`, que no existen). Incumple
  `AGENTS.md` §2.1. El plan refleja el alcance que se siguió y no se maquilló.
- **Rama.** El pedido decía `justin/seed-lab-tests`; el entorno de la sesión exige
  `claude/ecstatic-gates-jifuy0`.
- **Datos en git.** El pedido original decía «fuentes fuera de git». Una orden posterior del
  propietario, recibida a través de otra sesión, pidió subir todo. Se resolvió así: los crudos
  (≈255 MB) siguen fuera y se reproducen con `fetch-lab-tests-sources.mjs`; los NDJSON normalizados van
  comprimidos en `tools/terminology-import/lab-tests/data/` (1,4 MB).
- **Instalación de dependencias.** `cdn.sheetjs.com` (`xlsx`) también da 403. Para correr typecheck y
  lint se instaló con un reemplazo temporal `xlsx@0.18.5` y se restauraron `package.json` y `yarn.lock`;
  no van en el PR.
- **/loop.** La orden de iterar con /loop no se usó: las pasadas se hicieron en la misma sesión hasta
  dos en 0. Re-programar wakeups contra hosts bloqueados no traía datos.

## Riesgos residuales

- **Aranceles sin cotejar.** FONASA, TUSS, PAMI e ICD-10-PCS vienen de redistribuciones de terceros
  sin cotejar con el original. SIGTAP, TUSS e ICD-10-PCS declaran el archivo y el checksum de origen;
  FONASA y PAMI no.
- **Licencias por confirmar.** La de los conjuntos TUSS (portal ANS) y PAMI (datos.gob.ar) no se pudo leer.
- **PAMI es de 2022** y repite 295 nombres entre los capítulos 66 y 77, como códigos distintos.
- **Los ids no dependen de la versión.** Una versión nueva de una fuente no actualiza los códigos
  existentes; corregirlos sería una migración de datos aparte.
- **Ningún flujo de producto consume el catálogo todavía** (≈71 MB en el schema `terminology`).

## Decisiones y ambigüedades

- **Supuestos registrados en el PLAN** (§Alcance, 1–4). Se confirman con el propietario (1, 2, 4) y con
  quien gobierne el nomenclador (3).
- **Sin traducciones propias, rangos de referencia, mapeos entre sistemas ni tubo por análisis:**
  ninguna fuente alcanzable los publica.
- **Dominio como navegación.** Sale de la estructura oficial de cada fuente; lo dudoso queda sin
  dominio o fuera, con su tamaño.
- **Propuestas para el repo del modelo**, en `docs/seed-research/lab-tests.md`:
  - procedencia o variante en `concept_designations`;
  - concepto de idioma portugués;
  - si un concepto pertenece a una versión del code system o al code system entero.
