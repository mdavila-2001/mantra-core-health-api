# Reporte — Catálogo de análisis: pasadas con la red abierta (LOINC, GTR, cotejos)

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama: `claude/ecstatic-gates-jifuy0` (ver Desvíos)
- Peldaño de evidencia alcanzado: **VERIFIED: carga completa e idempotencia en Postgres 16 desechable**
  (camino real: `data/` → `load-lab-tests.mjs --apply` → filas contadas con `psql`). No es
  `REGRESSION_VERIFIED`: ver «No cubierto».
- Avance: **22 / 22 microtareas HECHO (100 %)**. Mergeado en `dev` por
  mdavila-2001/mantra-core-health-api#729.
- **Cierre (2026-10-24): el propietario ordenó cerrar el trabajo.** La búsqueda termina acá por esa
  decisión, no porque el protocolo de saturación se haya cumplido: la pasada 14 dio 0, y la 15 dejó
  CDISC, que queda **DESCARTADO** por esa misma orden. No se cargó nada más.

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H5.S1.M1–M3 | LOINC 2.82 desde tx.fhir.org: 435 clases, términos con CLASSTYPE, STATUS, ORDER_OBS y nombres es-MX/es-AR | `fetch-loinc-txfhir.mjs` | `"classes": 435, "terms": 109325, "partitions": 24` (`evidencia/fetch-loinc-txfhir.log`) |
| H5.S2.M1 | NLM CTSS: componente, propiedad, método, unidades, tipo de dato | `fetch-loinc-ctss.mjs` | `"items": 112405, "leaves": 109, "sumOfTotals": 112405`. 112 405 − 109 325 = 3 080 términos que tx.fhir.org no conoce (posteriores a 2.82): la enumeración por clase no dejó términos de 2.82 afuera |
| H5.S2.M2 | Definiciones de panel | `fetch-loinc-ctss.mjs --panels` | `"panelCodes": 1979, "withDefinition": 1747, "missing": 232` |
| H5.S3.M1 | Adaptador tx.fhir.org + NLM → `loincRecords` | `node --test` | ok (recortes reales) |
| H5.S3.M2, H8.S4.M2 | Carga completa desde `data/`, base nueva, 2 corridas | `load-lab-tests.mjs --apply` ×2 | corrida 1 = plan; corrida 2 = 0 (ver Evidencia) |
| H6.S1.M1–M3 | NCBI GTR: 63 919 tests vigentes, categoría = categoría mayor de método | `fetch-gtr.mjs` + `node --test` | ok |
| H7.S1.M1–M2 | Push por pasada | `git push` | rama remota = local en cada pasada (commits de las pasadas 10–13) |
| H7.S1.M3 | PR contra `dev`, no draft, sin mergear | `create_pull_request` | https://github.com/mdavila-2001/mantra-core-health-api/pull/729 |
| H8.S1.M1–M2 | CUPS (2 158) y designaciones CIE-10-ES (4 397) | build + `node --test` | ok |
| H8.S2.M1–M3 | TUSS cotejado (0 diferencias); PAMI y ICD-10-PCS FY2027 desde los archivos oficiales | build + `node --test` | ok |
| H8.S3.M1 | Pasadas 14 y 15 registradas | lectura | `docs/seed-research/lab-tests.md` |
| H8.S4.M1 | Miembro repetido en el mismo panel conserva sus dos posiciones | `node --test` | test nuevo; falló antes del arreglo y pasa después |
| H8.S5.M1 | Merge de `origin/dev` (`c3d08ca5`) sin regresiones | typecheck, lint, `node --test` | exit 0, exit 0, 54/54 |

## A medias

ninguna

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| Saturación | DESCARTADO | Cerrada por orden del propietario (2026-10-24), sin dos pasadas seguidas en 0. CDISC «Laboratory Test Code» (2 513 términos) queda fuera; se puede retomar como capa nueva si alguien lo pide y verifica la licencia de CDISC. |
| LOINC, lo que sólo trae el zip | BLOQUEADO | Cuenta en loinc.org (TIME/SYSTEM/SCALE en inglés, partes LP, Universal Lab Orders, Top 2000, Playbook, 3 080 términos posteriores a 2.82). El parser del zip existe. |
| RSNA Playbook, DICOM CID 29 | BLOQUEADO | Licencia: aceptar RadLex (propietario) y ubicar el aviso de NEMA. |
| Cotejo SIGTAP y FONASA | BLOQUEADO | FTP saliente (DATASUS) y acceso a fonasa.cl (403). |
| México, SUS Bolivia, INLASA | BLOQUEADO | datos.gob.mx 403 (Akamai), minsalud.gob.bo e inlasa.gob.bo sin respuesta. |
| Subgrupos mixtos de aranceles (≈ 1 000) | TODO | Curaduría humana ítem por ítem. |

## Evidencia

`evidencia/carga-completa-desde-data-postgres16.txt` (salida literal, recortada):

```
$ psql conteos antes de cargar
catalog_concepts (incluye 6 prerrequisitos)|6
concept_properties|0
…
$ node tools/terminology-import/lab-tests/load-lab-tests.mjs --apply   # corrida 1
    "concepts": 158309, "properties": 3864840, "designations": 114065,
    "relationships": 18236, "valueSets": 313, "valueSetMembers": 511404, "batches": 15
  "segundos": 218
exit=0
$ node tools/terminology-import/lab-tests/load-lab-tests.mjs --apply   # corrida 2
    "concepts": 0, "properties": 0, "designations": 0, "relationships": 0,
    "valueSets": 0, "valueSetMembers": 0, "batches": 15
  "segundos": 138
exit=0
$ psql conteos después
catalog_concepts (incluye 6 prerrequisitos)|158315
concept_properties|3864840
concept_designations|114065
concept_relationships|18236
value_sets|313
value_set_members|511404
catalog_import_batches|30
schema terminology (tablas+índices)|1193 MB
```

`evidencia/carga-completa-antes-del-arreglo-de-relaciones.txt`: la misma carga con el código anterior
insertó **18 178** relaciones contra 18 236 del plan. Así se encontró el defecto de H8.S4.M1: el id
de la relación no incluía la posición, y NLM repite 58 miembros en dos posiciones del mismo panel.

`evidencia/tests-tras-merge-dev.txt`, `typecheck-tras-merge-dev.txt`, `lint-tras-merge-dev.txt`:

```
$ node --test "tools/terminology-import/test/*.test.mjs"
# tests 54
# pass 54
# fail 0
exit=0
$ corepack yarn typecheck
exit=0
$ corepack yarn lint
exit=0
```

Además: `evidencia/dry-run-plan.txt` (plan sin base), `fetch-loinc-txfhir.log`, `fetch-loinc-ctss.log`,
`fetch-loinc-ctss-panels.log`.

## No cubierto

- **Lectura por la API**: no se levantó la API ni se llamó a `GET /terminology/value-sets…` sobre la base
  cargada. Ningún flujo de producto consume el catálogo todavía.
- **Lint de los `.mjs`**: `corepack yarn lint` sólo cubre `{src,apps,libs,test}/**/*.ts`; los scripts del
  importador no pasan por ESLint.
- **Suite Jest y `build` de Nest**: no se corrieron; este trabajo no toca `src/`.
- **Carga sobre una base con la versión anterior del catálogo**: los ids de relaciones con orden cambiaron
  (H8.S4.M1). Sobre una base que ya tuviera el catálogo cargado con el código anterior, quedarían las
  relaciones viejas y se sumarían las nuevas. El catálogo no está desplegado en ningún ambiente que yo
  conozca; si lo estuviera, hace falta limpiar `concept_relationships` de `mantra:lab-tests:rel:part-of:*`
  antes de recargar.
- **`GAPS` en `lib/sources.mjs`** (y el `lab-tests-coverage.json` de `data/`) no lista CDISC; está en
  `docs/seed-research/lab-tests.md` y en este reporte.

## Desvíos del plan

- **Rama**: la sesión exige desarrollar y empujar en `claude/ecstatic-gates-jifuy0`, no en `justin/<tema>`.
- **H5 DoD**: no hizo falta el flag `--loinc-txfhir`; el build usa tx.fhir.org + NLM cuando no hay zip.
- **H8** entero no estaba previsto (pasadas 11, 12, 14 y 15, el arreglo de relaciones y el merge de `dev`):
  se agregó al plan como microtareas.

## Riesgos residuales

- tx.fhir.org es un servidor comunitario: una reconstrucción futura puede dar otro conteo si cambia su
  versión de LOINC. `data/` fija la de esta corrida (2.82) con SHA-256.
- Los ejes TIME/SYSTEM/SCALE vienen del nombre corto es-AR: son oficiales, pero en castellano. Si se
  necesitan en inglés, hace falta el zip.
- 1 193 MB en el schema `terminology` por este catálogo: dimensionar el disco antes de cargarlo en un
  ambiente compartido.
- El cargador arma el plan en memoria: usa ≈ 3,5 GB de RSS y necesita `NODE_OPTIONS=--max-old-space-size=12288`.

## Decisiones y ambigüedades

1. **LOINC sin el zip oficial** (tx.fhir.org + NLM, con la licencia y el aviso de Regenstrief).
   Supuesto: válido. El propietario no lo objetó y aceptó el merge; no lo confirmó de forma explícita.
2. **GTR** registra ofertas de laboratorio (un test por laboratorio). Supuesto: se cargan los vigentes
   como su propio code system, dominio genética. Igual que el punto 1: aceptado con el merge, sin
   confirmación explícita.
3. **CDISC «Laboratory Test Code»**: descartado al cerrar, por orden del propietario. No se verificó su
   licencia.
4. **Miembros de panel sin dominio** (899 de LOINC) entran para que el panel esté completo, sin value set
   de dominio.
5. **RSNA Playbook**: no se acepta la licencia RadLex en nombre del propietario.
