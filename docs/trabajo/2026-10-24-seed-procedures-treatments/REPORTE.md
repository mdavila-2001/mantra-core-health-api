# Reporte — Procedimientos y tratamientos no farmacológicos, por enfermedad y por parte del cuerpo

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama: `justin/seed-procedures-treatments`
- Peldaño de evidencia alcanzado: `TESTED` en el importador (tests dirigidos en verde, carga real en
  PostgreSQL 16 desechable con idempotencia medida). No `VERIFIED` de punta a punta: las relaciones no se
  cargan en el modelo vigente (falta procedencia) y la fase 2 no pudo correr (ramas hermanas ausentes).
- Avance: 20 / 21 microtareas HECHO (95,2 %). Lo único abierto es la medición con las ramas hermanas (BLOQUEADO).

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Verificado que `concept_relationships` no guarda fuente ni evidencia (API y modelo `eceb98f`) | `grep -A12 'concept_relationships" (' database/SQL/03_terminology/02_tables.sql` | 4 columnas de negocio: origen, destino, tipo, ordinal |
| H1.S1.M2 | Propuesta DDL para el repo del modelo | `grep -n 'Propuesta para el repo del modelo' docs/seed-research/procedures-treatments.md` | sección presente, probada en base desechable |
| H1.S1.M3 | Mapa de red: hosts bloqueados | `node …/fetch.mjs --probe` | 18 hosts con 403 al CONNECT (`cache/_network.json`) |
| H2.S1.M1 | Parser OBO streaming | `node --test …/test/*.test.mjs` | 11/11 pass |
| H2.S1.M2 | POET → procedimiento → enfermedad con tipo literal | ídem | 293 afirmaciones |
| H2.S1.M3 | MAxO `has input` → UBERON | ídem | 15 afirmaciones |
| H2.S1.M4 | NCIt R163/R165–R171 | ídem | 438 afirmaciones |
| H2.S1.M5 | Equivalencias publicadas MONDO/Uberon | ídem | 1 145 mapeos |
| H2.S2.M1 | `build.mjs` + cobertura | `node …/build.mjs` | `coverage.json` |
| H2.S2.M2 | Salida determinista | `sha256sum -c` tras segunda corrida | 3 × OK |
| H3 (dry-run) | Plan de carga sin base | `node …/load.mjs` | 2 004 conceptos, 13 964 propiedades, 703 relaciones, 746 procedencias (tras pasada 2) |
| H3 (apply, modelo vigente) | Carga real e idempotencia | `load.mjs --apply` ×2 en PG 16 con DDL canónico del módulo 03 | 1.ª: 1 921 + 13 391, relaciones bloqueadas; 2.ª: 0 |
| H3 (apply, con propuesta) | Camino de relaciones | ídem + tabla propuesta + MONDO/UBERON simulados | 689 relaciones, 732 procedencias, 424 por mapeo publicado; 2.ª: 0 |
| Gate | `corepack yarn typecheck` | con `NODE_OPTIONS=--max-old-space-size=8192` | exit 0 |
| H5.S1.M2 | `corepack yarn lint` | ídem | exit 0, sin hallazgos (el script cubre `{src,apps,libs,test}/**/*.ts`; los `.mjs` del importador además pasan `prettier --check`) |
| H5.S1.M6 | Corpus normalizado respaldado en git | `node …/snapshot.mjs` ×2 + `zcat … \| sha256sum` | 8 archivos `.gz` (1,3 MB), deterministas; `assertions` descomprimido = `5661281f…` igual al de `build.mjs` |
| H5.S1.M5 | PR borrador contra `dev`, sin mergear | `mcp__github__create_pull_request` | https://github.com/mdavila-2001/mantra-core-health-api/pull/689 |
| Docs | `mkdocs build --strict` | venv con `docs/requirements.txt` | 0 avisos nuevos; aborta por 2 avisos que ya estaban en `dev` (mermaid sin internet, enlace de `architecture/module-layout.md`) |
| H4.S1.M2 | Saturación: pasadas 3 y 4 con 0 | barrido del registro OBO Foundry (OGMS, ONS, ONE) y DOID/HPO/MONDO; diff por código | 0 procedimientos y 0 relaciones nuevas en ambas |
| H4 pasada 2 | OHD + evaluación de CIDO, EFO, SCDO, WHO SMART | `build.mjs` y diff por código contra la pasada 1 | +81 procedimientos, +0 relaciones; carga incremental 83 conceptos + 573 propiedades, 2.ª corrida 0 |

## A medias
ninguna

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H5 fase 2 | BLOQUEADO | Que existan `justin/seed-diseases`, `justin/seed-medical-dictionaries`, `justin/seed-specialty-services` en `origin` |
| Relaciones en la base | BLOQUEADO | Que el repo del modelo agregue `concept_relationship_assertions` (o equivalente) |

## Evidencia
Ver la sección de cobertura y pruebas de carga en `docs/seed-research/procedures-treatments.md`.

## No cubierto
- Las relaciones con MONDO/UBERON reales: la prueba de carga usó conceptos simulados con los códigos
  referenciados (no los importadores hermanos).
- `node_modules` se instaló con `xlsx@0.18.5` del registro npm en lugar del tarball de `cdn.sheetjs.com`
  (host bloqueado); `package.json` y `yarn.lock` se restauraron sin cambios. Afecta solo al entorno local de gates.

## Desvíos del plan
- **Datos en git.** El brief decía «fuentes fuera de git». El 2026-10-24 la sesión coordinadora transmitió una orden del propietario («que terminen su trabajo y lo lleven todo a la nube»): el corpus normalizado y los crudos chicos (MAxO, POET, OHD; todos CC BY 4.0) van comprimidos en `tools/terminology-import/procedures-treatments/data/`; los crudos grandes (NCIt 283 MB, MONDO 53 MB, Uberon 23 MB) no se suben y se reproducen con `fetch.mjs` (URL por tag + sha256 en `data/sources/*.meta.json`). A confirmar con Justin que la orden aplica a esta rama.
- Se agregó la alternativa de sitio por xref publicado de Uberon (uno a uno) para los sitios NCIt: lo
  permite la consigna («mapeos entre ejes anatómicos solo si están publicados»).

## Riesgos residuales
- La saturación vale solo para lo que este entorno alcanza (GitHub, npm, PyPI). ClinicalTrials.gov, ICD-10-PCS, ICHI, CUPS, MeSH y NCIt oficial siguen bloqueados por la red: el corpus de procedimiento → enfermedad para enfermedades comunes depende de ellos.
- Las sesiones hermanas pueden elegir otro `internal_code` o grafía; `validate-siblings.mjs` admite `--alias`
  y prueba ambas grafías.
- Corpus procedimiento → enfermedad sesgado a enfermedades raras (foco de POET).

## Decisiones y ambigüedades
- «Pará y reportá»: se paró la escritura de relaciones, no la fase 1. A confirmar con Justin.
- MAxO/NCIt sin nombres oficiales en castellano: `display` en inglés, sin traducción propia.
- Clasificación farmacológica por la jerarquía de MAxO (pharmacotherapy, vías de administración,
  inmunización); suplementos dietarios que MAxO no cuelga de pharmacotherapy quedan como no farmacológicos.
- La rama de trabajo es `justin/seed-procedures-treatments` por pedido explícito de la tarea.
