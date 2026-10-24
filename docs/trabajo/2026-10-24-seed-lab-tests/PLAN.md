# Plan — Seeder exhaustivo de análisis médicos

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` · Predecesor: importadores de
  `tools/terminology-import/` (glosario ES, catálogo de medicamentos, `import-loinc.mjs`, `import-inlasa.mjs`)
- Resultado observable: quien opere la base puede cargar con un comando un catálogo de análisis
  médicos con procedencia por concepto, clasificado por dominio y por la categoría de cada fuente,
  y leerlo por `GET /terminology/value-sets?code=lab-catalog-…` + `/:id/$expand`.
- Kill-test: correr `load-lab-tests.mjs --apply` dos veces contra una base nueva con el DDL del
  módulo 03. Si la segunda corrida inserta más de 0 filas de catálogo, o algún concepto no tiene
  `source_*`, el trabajo no está hecho.

> **Desvío declarado.** Este plan se escribió **al cierre**, no antes de la primera línea de
> código como exige `AGENTS.md` §2.1. Al empezar sólo busqué `CLAUDE.md` y `.claude/rules/`, y no
> vi el `AGENTS.md` versionado. El contenido refleja el alcance que se siguió de hecho (el del
> pedido) y no se reescribió para que el resultado parezca mejor. Ver REPORTE.md › Desvíos.

## Alcance

- IN: `tools/terminology-import/lab-tests/` (código, `SOURCES.md`, `README.md`, `data/`),
  `tools/terminology-import/test/lab-tests.test.mjs` + `fixtures/lab-tests/`,
  `docs/seed-research/lab-tests.md`, `src/common/seed/data/lab-tests/README.md`, una sección
  aditiva en `tools/terminology-import/README.md`, este directorio `docs/trabajo/…`.
- OUT: DDL y migraciones (ADR-0021); `dynamic-enum-catalog.ts`, `clinical.concepts.ts` y el binding
  `service-request-code` (decisión clínica); `concepts.ts`; `package.json`/`yarn.lock` (el reemplazo
  temporal de `xlsx` para instalar dependencias se revirtió y no se commitea); las otras tres
  sesiones (alergias, fichas, servicios).
- Ambigüedades registradas:
  1. ¿«Features» de un análisis que no viene de LOINC? → Supuesto: lo que declara cada fuente
     (categoría oficial, precios, edad, sexo, vigencia), sin derivar nada. Confirmar con el propietario.
  2. Las fuentes primarias responden 403 desde la sesión. → Supuesto: usar redistribuciones en npm
     que declaran origen y licencia, marcadas como no cotejadas. Confirmar con el propietario.
  3. Subgrupos de arancel que mezclan diagnóstico y tratamiento. → Supuesto: quedan fuera hasta
     una curaduría humana. Confirmar con quien gobierne el nomenclador.
  4. Datos fuera de git (pedido original) vs. «todo a la nube» (orden posterior, recibida de otra
     sesión). → Supuesto: los crudos (≈255 MB) siguen fuera de git y se reproducen con
     `fetch-lab-tests-sources.mjs`; los normalizados van comprimidos a `data/` (1,4 MB).

## H1 — Discovery: modelo actual y fuentes alcanzables
**CA:** Dado el repo en `dev`, cuando se busca cómo se modelan análisis, órdenes y catálogos
grandes, entonces quedan identificados las tablas destino, el patrón de importador y las fuentes
alcanzables desde la sesión.
**DoD:** hallazgos escritos en `docs/seed-research/lab-tests.md` › «Cómo se modela hoy» y pasada 0.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Localizar tablas del módulo 03 y sus índices únicos | Las 15 tablas `terminology.*` y sus `UNIQUE` están identificadas | `grep -n UNIQUE database/SQL/03_terminology/04_indexes.sql` | HECHO |
| H1.S1.M2 | Localizar cómo se piden estudios hoy | Se conoce el binding `service-request-code` y su decisión de no usar LOINC | `grep -n "Por qué códigos locales y no LOINC" src/modules/clinical/clinical.concepts.ts` | HECHO |
| H1.S1.M3 | Localizar el patrón de importador e ids de LOINC existentes | Se conocen las claves `md5('mantra:loinc:…')` de `import-loinc.mjs` | `grep -n "mantra:loinc:" tools/terminology-import/import-loinc.mjs` | HECHO |
| H1.S2.M1 | Sondear la red hacia las fuentes candidatas | Cada host tiene su código HTTP registrado | `curl -o /dev/null -w '%{http_code}' <host>` (pasadas 0 y 9) | HECHO |

## H2 — Importador (fetch → NDJSON → carga)
**CA:** Dadas las fuentes descargadas, cuando se corren build y carga, entonces cada concepto
llega a `terminology.*` con id determinista y procedencia, y una segunda corrida no inserta nada.
**DoD:** `node --test "tools/terminology-import/test/*.test.mjs"` → 0 fallos; carga en Postgres
desechable → 2.ª corrida 0 filas nuevas.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Registro común + validación (`records.mjs`) | Un registro sin procedencia o con id no determinista falla | test «LOINC: ids y property_code idénticos a import-loinc.mjs» → ok | HECHO |
| H2.S1.M2 | Parser HL7 THO | La tabla 0487 se copia verbatim; deprecados con `selectable=false` | test «HL7 THO v2-0487 (recorte real)» → ok | HECHO |
| H2.S1.M3 | Parser UCUM | ucum-lhc y ucum-common se unen por código | test «UCUM (recortes reales)» → ok | HECHO |
| H2.S1.M4 | Parser LOINC (tabla + anexos), por cabecera | Dominios, paneles, variante ES; cabeceras ausentes abortan | tests «LOINC (CSV SINTÉTICO)» y «cabeceras ausentes» → ok | HECHO |
| H2.S1.M5 | Reglas de dominio LOINC | Lo no reconocido queda sin dominio | test «dominios: reglas por CLASS/CLASSTYPE» → ok | HECHO |
| H2.S1.M6 | Parser de aranceles (prefijos + exclusiones) | Sólo entran prefijos homogéneos; terapéuticos excluidos con motivo | tests FONASA, SIGTAP, TUSS, PAMI, ICD-10-PCS → ok | HECHO |
| H2.S2.M1 | `fetch-lab-tests-sources.mjs` | Cada fuente npm queda con SHA-256 e integridad en el manifiesto | `node …/fetch-lab-tests-sources.mjs` → 7 fuentes en `manifest.json` | HECHO |
| H2.S2.M2 | `build-lab-tests.mjs` | Escribe NDJSON + meta + cobertura; una fuente ausente es hueco, no error | `node …/build-lab-tests.mjs` → 7 capas, `loinc: SIN DATOS` | HECHO |
| H2.S3.M1 | Plan de carga puro | Re-generar el plan da los mismos ids | test «plan de carga: … deterministas» → ok | HECHO |
| H2.S3.M2 | `load-lab-tests.mjs` (dry-run / `--apply`) | 2.ª corrida = 0 filas de catálogo | `evidencia/carga-desde-data-postgres16.txt` | HECHO |
| H2.S3.M3 | Value sets en versión estable `1` | Cargar una capa parcial y después todas no crea versiones duplicadas | carga `--layers hl7-tho,ucum` y luego total → `value_set_versions = value_sets` | HECHO |

## H3 — Pasadas de saturación
**CA:** Dadas fuentes nuevas e independientes por pasada, cuando dos pasadas seguidas aportan 0
conceptos tras deduplicar, entonces se corta y se registra cada pasada con fuentes, nuevos y descartes.
**DoD:** tabla de pasadas en `docs/seed-research/lab-tests.md`.
**Estado:** HECHO (dentro de lo alcanzable; ver H3.S2)

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Pasadas 1–6 (HL7, UCUM, value sets HL7, FONASA, SIGTAP/TUSS/PAMI, ICD-10-PCS) | Cada pasada tiene nuevos y descartes con motivo | `grep -c "^| [0-9] |" docs/seed-research/lab-tests.md` → 10 filas (0–9) | HECHO |
| H3.S1.M2 | Pasadas 7–8 en 0 | Dos pasadas seguidas sin conceptos nuevos | filas 7 y 8 de la tabla → «0» | HECHO |
| H3.S2.M1 | Cargar LOINC (datos reales) | `lab-tests-loinc.ndjson` con datos de `Loinc.csv` | `build-lab-tests.mjs --loinc-release …` | BLOQUEADO |
| H3.S2.M2 | Cargar NCBI GTR | Capa de genética desde GTR | — | BLOQUEADO |
| H3.S2.M3 | Clasificar subgrupos mixtos ítem por ítem | ≈1 000 prestaciones con dominio | — | DESCARTADO (curaduría humana, fuera de alcance de un ETL) |

## H4 — Verificación y entrega
**CA:** Dado el cambio, cuando se corren los gates del repo, entonces typecheck, lint, tests,
mkdocs estricto y enlaces quedan en verde, y el PR contra `dev` queda abierto sin mergear.
**DoD:** salidas en `evidencia/`; PR abierto.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H4.S1.M1 | Tests dirigidos | 0 fallos | `evidencia/node-test.txt` → `# fail 0` | HECHO |
| H4.S1.M2 | Ruta LOINC en Postgres (sintético) | Designaciones, part-of y value sets; 2.ª corrida 0 | `evidencia/loinc-sintetico-postgres16.txt` | HECHO |
| H4.S1.M3 | Typecheck | exit 0 | `evidencia/typecheck-lint.txt` | HECHO |
| H4.S1.M4 | Lint | exit 0 | `evidencia/typecheck-lint.txt` | HECHO |
| H4.S1.M5 | MkDocs estricto + enlaces | exit 0, sin enlaces rotos | `evidencia/docs.txt` | HECHO |
| H4.S2.M1 | Datos normalizados en `data/` (gz, <50 MB) | El cargador funciona sin build local | `evidencia/carga-desde-data-postgres16.txt` (capas «← data/…») | HECHO |
| H4.S2.M2 | Commit, push y PR contra `dev` | PR abierto, sin mergear | https://github.com/mdavila-2001/mantra-core-health-api/pull/681 | HECHO |

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Fuentes primarias bloqueadas (403) | Sin LOINC ni GTR; aranceles sin cotejar con su original | Redistribuciones con procedencia declarada; hueco documentado con el host a habilitar |
| Parser LOINC escrito sin archivo real | Puede no leer la distribución real | Lectura por cabecera que aborta mostrando las cabeceras reales; tests sintéticos marcados |
| Prefijos de arancel heterogéneos | Procedimientos terapéuticos en un catálogo de análisis | Barrido de palabras terapéuticas y exclusiones explícitas con motivo |
| Plan en memoria + una transacción con LOINC completo | OOM o transacción larga | `NODE_OPTIONS=--max-old-space-size=8192` documentado |
