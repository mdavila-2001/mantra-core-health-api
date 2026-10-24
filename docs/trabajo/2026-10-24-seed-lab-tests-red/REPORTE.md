# Reporte — Catálogo de análisis: pasadas con la red abierta hasta la saturación

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama: `claude/ecstatic-gates-jifuy0` (ver Desvíos)
- Peldaño de evidencia alcanzado: **VERIFIED: carga completa e idempotencia en Postgres 16 desechable**
  (camino real: `data/` → `load-lab-tests.mjs --apply` → filas contadas con `psql`). No es
  `REGRESSION_VERIFIED`: ver «No cubierto».
- Avance: **29 / 29 microtareas HECHO (100 %)**. H5–H8 mergeados en `dev` por
  mdavila-2001/mantra-core-health-api#729; H9 va en mdavila-2001/mantra-core-health-api#731.
- **Saturación alcanzada por protocolo**: las pasadas 17 y 18 dieron 0 seguidas, con CDISC (4 721) y NPU
  (25 699) cargados y cada fuente restante descartada con motivo. Catálogo final: 188 729 conceptos.

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
| H9.S1.M1–M2 | CDISC SDTM: licencia verificada (CC BY 4.0 vía NCIt) y capa de 10 codelists | test «CDISC SDTM» + build | `[build] lab-tests-cdisc-sdtm: 4721 registros` |
| H9.S2.M1–M2 | NPU (IFCC-IUPAC): licencia leída y capa con todos los activos | test «NPU» + build | `[build] lab-tests-npu-ifcc: 25699 registros` |
| H9.S3.M1 | Pasadas 16–18 registradas; 17 y 18 en 0 | lectura | `docs/seed-research/lab-tests.md` |
| H9.S4.M1 | Carga completa final desde `data/`, base nueva, 2 corridas | `load-lab-tests.mjs --apply` ×2 | corrida 1 = dry-run (188 729); corrida 2 = 0 |
| H9.S4.M2 | Regresión | `node --test`, typecheck, lint | 56/56, exit 0, exit 0 |

## A medias

ninguna

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| LOINC, lo que sólo trae el zip | BLOQUEADO | Cuenta en loinc.org (TIME/SYSTEM/SCALE en inglés, partes LP, Universal Lab Orders, Top 2000, Playbook, 3 080 términos posteriores a 2.82). El parser del zip existe. |
| RSNA Playbook, DICOM CID 29 | BLOQUEADO | Licencia: aceptar RadLex (propietario) y ubicar el aviso de NEMA. |
| Cotejo SIGTAP y FONASA | BLOQUEADO | FTP saliente (DATASUS) y acceso a fonasa.cl (403). |
| México, SUS Bolivia, INLASA | BLOQUEADO | datos.gob.mx 403 (Akamai), minsalud.gob.bo e inlasa.gob.bo sin respuesta. |
| Subgrupos mixtos de aranceles (≈ 1 000) | TODO | Curaduría humana ítem por ítem. |
| MBS (Australia), JLAC10/11 (Japón) | BLOQUEADO | Licencia: permiso escrito del gobierno australiano y de la JSLM. |
| INAMI (Bélgica), NABM/CCAM (Francia) | BLOQUEADO | Formato estructurado abierto o acceso (NomenSoft 403, ameli.fr 403). |

## Evidencia

`evidencia/carga-completa-final-postgres16.txt` (salida literal, recortada):

```
$ psql conteos antes de cargar
catalog_concepts (incluye 6 prerrequisitos)|6
concept_properties|0
…
$ node tools/terminology-import/lab-tests/load-lab-tests.mjs --apply   # corrida 1
    "concepts": 188729, "properties": 4585753, "designations": 114065,
    "relationships": 18236, "valueSets": 335, "valueSetMembers": 602664, "batches": 17
  "segundos": 293
exit=0
$ node tools/terminology-import/lab-tests/load-lab-tests.mjs --apply   # corrida 2
    "concepts": 0, "properties": 0, "designations": 0, "relationships": 0,
    "valueSets": 0, "valueSetMembers": 0, "batches": 17
  "segundos": 169
exit=0
$ psql conteos después
catalog_concepts (incluye 6 prerrequisitos)|188735
concept_properties|4585753
concept_designations|114065
concept_relationships|18236
value_sets|335
value_set_members|602664
catalog_import_batches|34
schema terminology (tablas+índices)|1394 MB
```

`evidencia/regresion-final.txt`:

```
$ node --test "tools/terminology-import/test/*.test.mjs"
# tests 56
# pass 56
# fail 0
exit=0
$ corepack yarn typecheck
exit=0
$ corepack yarn lint
exit=0
```

Cargas anteriores, como control: `carga-completa-desde-data-postgres16.txt` (158 309, antes de CDISC y
NPU) y `carga-completa-con-cdisc-postgres16.txt` (163 030, sin NPU); las dos con corrida 2 = 0.
`dry-run-plan-final.txt`: plan sin base, igual a la corrida 1.

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

## Desvíos del plan

- **Rama**: la sesión exige desarrollar y empujar en `claude/ecstatic-gates-jifuy0`, no en `justin/<tema>`.
- **H5 DoD**: no hizo falta el flag `--loinc-txfhir`; el build usa tx.fhir.org + NLM cuando no hay zip.
- **H8** entero no estaba previsto (pasadas 11, 12, 14 y 15, el arreglo de relaciones y el merge de `dev`):
  se agregó al plan como microtareas.
- **H9** se agregó cuando el propietario pidió terminar: CDISC, NPU y las pasadas 16–18.

## Riesgos residuales

- tx.fhir.org es un servidor comunitario: una reconstrucción futura puede dar otro conteo si cambia su
  versión de LOINC. `data/` fija la de esta corrida (2.82) con SHA-256.
- Los ejes TIME/SYSTEM/SCALE vienen del nombre corto es-AR: son oficiales, pero en castellano. Si se
  necesitan en inglés, hace falta el zip.
- 1 394 MB en el schema `terminology` por este catálogo: dimensionar el disco antes de cargarlo en un
  ambiente compartido.
- El cargador arma el plan en memoria: usa ≈ 3,5 GB de RSS y necesita `NODE_OPTIONS=--max-old-space-size=12288`.

## Decisiones y ambigüedades

1. **LOINC sin el zip oficial** (tx.fhir.org + NLM, con la licencia y el aviso de Regenstrief).
   Supuesto: válido. El propietario no lo objetó y aceptó el merge; no lo confirmó de forma explícita.
2. **GTR** registra ofertas de laboratorio (un test por laboratorio). Supuesto: se cargan los vigentes
   como su propio code system, dominio genética. Igual que el punto 1: aceptado con el merge, sin
   confirmación explícita.
3. **CDISC**: cargado. cdisc.org declara que su terminología se distribuye como parte del NCI Thesaurus,
   que es CC BY 4.0. Entran 10 codelists «Test Code» diagnósticas; el concepto es `<codelist>.<C-code>`
   porque 126 C-codes están en más de una codelist con dominios distintos.
6. **NPU**: todo va a laboratorio, porque NPU se define como terminología de resultados de laboratorio
   clínico. La especialidad va con su sigla, sin nombre: el archivo no lo trae y no se deduce. No se
   traduce: la licencia lo prohíbe.
7. **MBS**: se descargó para evaluarlo y se borró al leer su copyright, que no permite redistribuir.
4. **Miembros de panel sin dominio** (899 de LOINC) entran para que el panel esté completo, sin value set
   de dominio.
5. **RSNA Playbook**: no se acepta la licencia RadLex en nombre del propietario.
