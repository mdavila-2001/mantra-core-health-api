# Plan (API) — H7: dependencia XLSX, fixtures y parseador

- Enlaza al plan completo del carril en el repo front: `../../../../mantra-core-health/docs/trabajo/2026-09-25-marcelo-calidad/PLAN.md` (98 microtareas, 7 hitos). Este archivo cubre sólo H7, que vive en este repo.
- Rama: `marcelo/feat-carga-masiva-xlsx-2026-09-25` desde `origin/dev` @ `343795cc`.
- Rama de Itzan a traer (cherry-pick de 8 archivos, Q-M6/Q-M17): `origin/itzan/carga-masiva-motor-2026-09-25` @ `d99ff9e7`.
- Ambigüedades relevantes: Q-M6 (SheetJS por tarball, confirmado) · Q-M8 (conteo de fixtures) · Q-M17 (test 3/6 con excepciones en [API real]).

### H7 — Dependencia XLSX, fixtures de la API y parseador XLSX (heredado del carril de Ender)

**Prioridad:** `ALTA` — **H7.S1 y H7.S2 van justo después de H1**, porque Itzan y Justin usan los fixtures.

**CA:** Dado el repo de la API, cuando Itzan hace `git fetch` dos horas después de tu arranque, entonces
encuentra los 14 fixtures de §4 (CSV y XLSX) con `README.md` de procedencia sintética; y al cerrar el hito,
`xlsx-parser.ts` produce **exactamente** el mismo `ResultadoDeParseo` que el `CsvParser` de Itzan sobre los
gemelos, con la dependencia decidida con evidencia.
**DoD:** push de fixtures en la hora 2; `decision-dependencia.md` con audit pegado; `xlsx-parser.spec.ts` en verde; PR API a `dev` `MERGEABLE`.
**Estado:** TODO

#### H7.S1 — Dependencia XLSX decidida con evidencia (tope: 45 minutos)

**CA:** Dado que el servicio existente rechazó CSV/XLSX para no sumar dependencia, cuando se revierte para
XLSX, entonces queda escrito qué se agrega, qué pesa, qué licencia tiene, qué dice el audit y por qué; y si a
los 45 minutos no decidiste, la decisión es «XLSX `A MEDIAS`, el detector de Itzan devuelve 422 para xlsx».
**DoD:** `docs/trabajo/2026-09-25-marcelo-calidad/decision-dependencia.md`; `yarn.lock` commiteado solo.
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Si se traba | Estado |
|---|---|---|---|---|---|
| H7.S1.M1 | Worktree de la API desde `origin/dev` y rama `marcelo/carga-masiva-xlsx-2026-09-25`; `yarn install`; baseline `lint`/`typecheck`/`build` | SHA + 3 exit codes | `git worktree add ../mch-api-marcelo origin/dev && … && git rev-parse HEAD`; → `evidencia/antes/api-baseline.txt` | `worktree` ocupado → otro nombre | TODO |
| H7.S1.M2 | Confirmar que nada CSV/XLSX está instalado transitivamente | Lista o vacío | `yarn why xlsx; yarn why exceljs; yarn why csv-parse; yarn why papaparse; yarn why fast-csv` → pegado | — | TODO |
| H7.S1.M3 | ¿Qué usa el equipo en repos hermanos? | Lista | `grep -l "exceljs\|\"xlsx\"" ../*/package.json ../*/*/package.json 2>/dev/null` → pegado | Ninguno → candidata por omisión `exceljs` | TODO |
| H7.S1.M4 | Evaluar **una** candidata: qué resuelve, tamaño instalado (`du -sh node_modules/<lib>`), licencia, última publicación (`yarn npm info <lib> --fields time --json`), audit | Tabla con 5 datos | `yarn add <lib> && yarn npm audit; echo "exit=$?"` → pegado | Audit `high`/`critical` sin fix → **no se agrega**, H7.S3 `A MEDIAS`; audit sin red → `--environment production` una vez; si no, decidí por fecha y **anotá que el audit no corrió** | TODO |
| H7.S1.M5 | ¿Lee desde `Buffer`? ¿Permite acotar filas/hojas? Verificado **en `node_modules/<lib>`**, no de memoria | Rutas citadas | `grep -n "Buffer\|load(" node_modules/<lib>/index.d.ts \| head` → pegado | — | TODO |
| H7.S1.M6 | `decision-dependencia.md` (Contexto / Decisión / Consecuencias / Reversa; cita la cabecera del servicio que descartó la dependencia) | Archivo | `ls docs/trabajo/2026-09-25-marcelo-calidad/` | — | TODO |
| H7.S1.M7 | Commit de `package.json` + `yarn.lock` **solos** + push | Sólo esos 2 archivos | `git show --stat HEAD` | — | TODO |

#### H7.S2 — Fixtures sintéticos de la API publicados en la hora 2

**CA:** Dado `generar-fixtures.mjs`, cuando se corre dos veces, entonces produce los 14 CSV de §4 byte-idénticos
(sin fechas ni aleatoriedad) más sus gemelos XLSX, `grande-10k.xlsx`, `celda-numerica.xlsx` y `no-es-nada.pdf`,
con `README.md` de procedencia sintética; y los tuyos de E2E (H1.S3) son **copia** de estos.
**DoD:** `ls test/fixtures/terminology-import | wc -l` ≥ 31; `sha256sum` iguales en dos corridas; push con hora.
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Si se traba | Estado |
|---|---|---|---|---|---|
| H7.S2.M1 | Leer 2 `README.md` de `test/fixtures/**` de la API para copiar forma | Rutas en `PLAN.md` | — | — | TODO |
| H7.S2.M2 | `generar-fixtures.mjs` que escribe los 14 CSV de §4 con contenidos **exactos** (posiciones de error 5/9/14/20/33 en `con-errores`) + `no-es-nada.pdf` | 15 archivos | `node test/fixtures/terminology-import/generar-fixtures.mjs && ls *.csv \| wc -l` → 13 (+ pdf + README) | — | TODO |
| H7.S2.M3 | Determinismo | Hashes iguales | `sha256sum *.csv > a; node generar-fixtures.mjs; sha256sum *.csv > b; diff a b` → vacío | — | TODO |
| H7.S2.M4 | Gemelos `.xlsx` + `grande-10k.xlsx` + `celda-numerica.xlsx` (celda `10` numérica, fórmula `=1+1` con valor cacheado y otra sin) con la lib; hoja `conceptos`; fechas de creación fijas si la lib las escribe | 16 `.xlsx` | `ls *.xlsx \| wc -l` → 16 | XLSX descartado en H7.S1 → sólo CSV; anotá | TODO |
| H7.S2.M5 | `README.md`: tabla de §4 + «sintético, generado el 2026-09-25 por `generar-fixtures.mjs`, sin procedencia externa» | Existe | `grep -n "sintético" README.md` | — | TODO |
| H7.S2.M6 | Commit + **push dentro de la hora 2** + línea en tu daily con hora; reemplazar tus copias de E2E por estas (`sha256sum` iguales) | Visible | `git log origin/marcelo/carga-masiva-xlsx-2026-09-25 -1 --format=%ci` | — | TODO |

#### H7.S3 — Parseador XLSX contra el contrato de Itzan

**CA:** Dado cada fixture XLSX, cuando se parsea con `XlsxParser`, entonces el resultado es **idéntico** al de
`CsvParser` sobre su gemelo; `celda-numerica` convierte `10` a `"10"`, la fórmula con valor cacheado a su
valor y la sin valor a problema; `grande-10k` parsea en < 5 s.
**DoD:** `xlsx-parser.spec.ts` en verde (spec cruzado parametrizado + 3 casos + límite); PR API `MERGEABLE`.
**Estado:** TODO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Si se traba | Estado |
|---|---|---|---|---|---|
| H7.S3.M1 | Traer `row-contract.ts` de Itzan: `git fetch && git cherry-pick <SHA de su commit del contrato>` (un archivo) | Compila | `yarn typecheck` | Itzan no publicó a la hora 1 → escribí `row-contract.ts` vos con §1 **literal** (contenido idéntico por contrato) y anotalo: Pablo conserva el de Itzan al integrar | TODO |
| H7.S3.M2 | `src/modules/terminology/import/xlsx-parser.ts`: `class XlsxParser implements ParseadorDeArchivo { formato = 'xlsx' }`, lee desde `Buffer`, hoja `conceptos` o la primera, celdas a texto, columnas por nombre y alias del perfil (si `import-profiles.ts` de Itzan aún no está, copiá el perfil `conceptos` de §1 en el spec y anotalo) | Compila | `yarn typecheck` | XLSX descartado → `DESCARTADO` con referencia a H7.S1.M4 | TODO |
| H7.S3.M3 | Spec cruzado: para cada fixture gemelo, `deepEqual(csv.parsear(csvBuf, perfil), xlsx.parsear(xlsxBuf, perfil))` con el `CsvParser` de Itzan si está (`cherry-pick` de su commit) o, si no, contra la tabla de §4 escrita a mano en el spec | 12 PASS | `yarn test src/modules/terminology/import/xlsx-parser` | — | TODO |
| H7.S3.M4 | Spec: `celda-numerica` (3 casos) | 3 PASS | idem | — | TODO |
| H7.S3.M5 | Spec de límite: `grande-10k.xlsx` < 5 s; `heapUsed` antes/después pegado | PASS con tiempo | idem | Tarda más → meta «parsea», tiempo como riesgo; **no subas `testTimeout`** | TODO |
| H7.S3.M6 | Acotar lectura: `MAX_FILAS_XLSX` nombrada y documentada (zip bomb) si la lib lo permite; si no, riesgo anotado | Constante o riesgo | `grep -n "MAX_FILAS" xlsx-parser.ts` | — | TODO |
| H7.S3.M7 | **No tocás `index.ts`** (es de Itzan): Pablo agrega el export al integrar. `xlsx-parser.ts` queda autocontenido y exporta la clase | `grep` vacío | `git diff origin/dev --stat \| grep -E "index.ts|csv-parser|format-detector|import-profiles|services/|controllers/|dto/"` → vacío (salvo el cherry-pick del contrato) | — | TODO |
| H7.S3.M8 | Sin contenido de filas en logs | `grep` vacío | `grep -n "console\.\|logger\." xlsx-parser.ts` → vacío | — | TODO |
| H7.S3.M9 | Rebase sobre `origin/dev`, PR API con plantilla (`gh pr create --base dev …`), `gh pr view` + `gh pr checks` pegados | `MERGEABLE` | `evidencia/pr/api-view.json`, `api-checks.txt` | `gh` sin auth → push + cuerpo en `evidencia/pr/api-body.md`; `UNKNOWN` → bucle `until` | TODO |

