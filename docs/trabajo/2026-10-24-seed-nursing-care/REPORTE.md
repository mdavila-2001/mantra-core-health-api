# Reporte — Cuidados de enfermería: importador de terminología con procedencia

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `justin/seed-nursing-care` (desde `origin/dev` 08a7ff8a)
- Peldaño de evidencia alcanzado: `VERIFIED` para el importador (carga real en PostgreSQL 16 desechable con el DDL del módulo 03, dos corridas, conteos y consultas de contenido); `TESTED` para parsers y plan (11 pruebas dirigidas). No `REGRESSION_VERIFIED`: no se corrió contra el stack completo ni con la API arrancada (prerrequisitos emulados).
- Avance: 14 / 15 microtareas HECHO (93 %). Pendiente: H3.S2.M2 (PR) — se abre al cerrar este reporte.

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Parser ADL 1.4 (ODIN + cADL) | `node --test "tools/terminology-import/nursing-care/test/*.test.mjs"` | 11/11 pass; además 689/689 arquetipos reales del espejo parsean y todo nodo y respuesta tiene texto en su idioma original |
| H1.S1.M2 | Licencia del contenido por arquetipo | ídem | Braden → `third-party-copyright`; ECOG → `declared-free`; balance de fluidos → `openehr-model` |
| H1.S1.M3 | Filas CKM con jerarquía ES/EN | ídem | ECOG: 6 respuestas con ordinales 0–5 bajo su elemento |
| H1.S2.M1 | Registro ANA desde HL7 THO 7.0.1 | ídem | 12 terminologías con OID/URI verbatim (Omaha `2.16.840.1.113883.6.98`) |
| H1.S3.M1 | `fetch-sources.mjs` | `node tools/terminology-import/nursing-care/fetch-sources.mjs --ckm-commit c3fdc43d… --adl-archetypes-commit 093c77ea…` | exit 0; tarball verificado contra sha512 del registro |
| H1.S3.M2 | `build-nursing-care.mjs` + `coverage.json` | `node tools/terminology-import/nursing-care/build-nursing-care.mjs` | 8 015 + 617 + 12 filas |
| H2.S1.M1 | Plan de carga puro | `node tools/terminology-import/nursing-care/load-nursing-care.mjs` | dry-run exit 0; ids únicos verificados |
| H2.S1.M2 | Enlaces LOINC por código | `load-nursing-care.mjs --apply` | 3 mapas con 3 códigos de prueba; 98 códigos ausentes contados |
| H2.S1.M3 | Glosario «care» | consulta SQL | 36 miembros en `glossary-category-care` |
| H2.S2.M1 | Carga real + idempotencia | ver Evidencia | 1.ª corrida 8 644 conceptos; 2.ª corrida 0 filas |
| H3.S1.M1 | Bitácora de pasadas | `docs/seed-research/nursing-care.md` | 8 pasadas; 5–8 con 0 aportes |
| H3.S1.M2 | `link-check.mjs` | `node tools/terminology-import/nursing-care/link-check.mjs --db` | 3 ramas hermanas ausentes (pendiente); `seed-procedures-treatments`: 0 menciones de enfermería en sus 23 archivos |
| H3.S1.M3 | Fuente CMDIC (Ministerio de Sanidad) | tests + carga | 58 arquetipos, 617 conceptos, informe de enfermería con 16 ranuras |
| H3.S2.M1 | typecheck y lint | `NODE_OPTIONS=--max-old-space-size=8192 corepack yarn typecheck` / `… lint` | exit 0 / exit 0 |

## A medias
ninguna

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H3.S2.M2 | EN CURSO | abrir el PR contra `dev` (sin mergear; lo mergea Justin) |
| Validación con ramas hermanas | BLOQUEADO | que existan `justin/seed-diseases`, `justin/seed-symptoms`, `justin/seed-medical-dictionaries`; correr `link-check.mjs --db` con todo cargado |
| Omaha System | BLOQUEADO | habilitar `www.omahasystem.org` en la red del entorno |
| Licencias CCC, ICNP, NANDA-I/NIC/NOC, escalas | BLOQUEADO | decisión y contratos del propietario |

## Evidencia
- `evidencia/load-postgres16-desechable.txt` — dos corridas `--apply`, conteos por code system y value set, `link-check --db`:
  ```
  [load] {"codeSystem":"openehr-ckm","concepts":8015,"designations":9017,"properties":114110,"relationships":7481,"memberships":134,…,"loincMaps":3,"loincCodesNotInDb":98}
  [load] {"codeSystem":"es-msssi-cmdic-13606","concepts":617,"designations":617,"properties":6725,"relationships":559,"memberships":39,…}
  [load] {"codeSystem":"nursing-terminology-registry","concepts":12,"designations":12,"properties":156,…}
  ## Segunda corrida (idempotencia)
  [load] {"codeSystem":"openehr-ckm","concepts":0,"designations":0,"properties":0,"relationships":0,"memberships":0,…}
  [load] {"codeSystem":"es-msssi-cmdic-13606","concepts":0,…}
  [load] {"codeSystem":"nursing-terminology-registry","concepts":0,…}
  ```
- `evidencia/node-test-nursing-care.txt` — `# tests 11 · # pass 11 · # fail 0 · exit=0`.
- `evidencia/typecheck.txt` — `exit=0` (con `NODE_OPTIONS=--max-old-space-size=8192`; con el heap por defecto de 2 GB `tsc` aborta por memoria en este contenedor).
- `evidencia/lint.txt` — `exit=0` (mismo `NODE_OPTIONS`).
- Regresión de las librerías compartidas: `node --test "tools/terminology-import/test/*.test.mjs"` → `# tests 34 · # pass 34 · # fail 0`.
- `evidencia/docs.txt` — `docs:links`: «Sin enlaces rotos» (2 967 enlaces, 722 páginas); `docs:coverage` OK; `mkdocs build --strict`: 2 avisos ajenos a esta rama (unpkg.com bloqueado por la red; enlace preexistente en `architecture/module-layout.md`).

## No cubierto
- La carga no se probó con la API arrancada: los 7 conceptos internos y los dos value sets del glosario se **emularon** en la base desechable con los mismos ids deterministas (`deterministicId`); los 3 códigos LOINC de la prueba de `concept_maps` son de prueba, no datos reales.
- No se verificó cómo muestra la pantalla del glosario los 36 términos nuevos (no se levantó el front ni la API).
- No se corrieron `yarn build` ni `yarn test` (jest completo): el cambio no toca TypeScript; se corrieron typecheck, lint, los tests dirigidos y los de `tools/terminology-import`.
- `yarn install` en el contenedor necesitó sustituir, sólo localmente y sin commitear, el tarball de `xlsx` de `cdn.sheetjs.com` (host bloqueado) por `@e965/xlsx@0.20.3` de npm para poder correr typecheck y lint.

## Desvíos del plan
- Se agregó la fuente CMDIC del Ministerio de Sanidad (H3.S1.M3), hallada en la pasada 4.
- El value set propio pasó de `nursing-care-openehr` a `nursing-care-clinical-models` (cubre las dos fuentes de arquetipos).
- No se agregó script a `package.json` (los tests corren con `node --test`; se evitó tocar un archivo compartido).

## Riesgos residuales
- Licencia del CMDIC no declarada (A7) y *share-alike* de CC-BY-SA en CKM: decisión legal pendiente.
- Las reglas N1–N11 son de texto: N1 («menciona enfermería») trae algún arquetipo poco específico (p. ej. resumen de vivienda). Es navegación, documentada; no afecta la carga del catálogo completo.
- Clasificación conservadora: algunos modelos sin copyright real quedan sin ítems por tener ordinales (p. ej. uroanálisis). Se corrige con un *override* con evidencia.
- La ficha clínica de geriatría del repo afirma «Barthel (dominio público)»; la evidencia encontrada dice uso libre sólo no comercial. Anotado para su dueño.

## Decisiones y ambigüedades
- A1: se usó la rama del pedido (`justin/seed-nursing-care`), no la que asignó el arnés de la sesión.
- A2: `PLAN.md`/`REPORTE.md` en `docs/trabajo/` por `AGENTS.md`, además de las tres rutas propias del pedido.
- A3–A7: ver PLAN. Ninguna traducción propia; ningún dato generado por modelo; SNOMED no se guarda; dosis no se cargan.
- Relaciones: estructurales de una sola fuente (PART_OF, IS_A); las relaciones entre fuentes quedan para cuando exista la tabla de procedencia propuesta por `justin/seed-procedures-treatments`.
