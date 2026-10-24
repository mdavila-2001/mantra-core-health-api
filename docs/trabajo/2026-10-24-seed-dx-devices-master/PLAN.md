# Plan — Equipos de diagnóstico: consolidación mundial de fabricantes, marcas y modelos

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` (rama `justin/seed-dx-devices-master`, espejo `claude/intelligent-heisenberg-0idr17`) · Predecesor: ninguno (sesiones hermanas `us`, `eu`, `row` en paralelo)
- Resultado observable: en `tools/terminology-import/diagnostic-devices/master/out/` hay un catálogo **tipo de equipo → fabricante → marca → modelo** con todos los registros de cada modelo y su procedencia; la taxonomía de tipos de diagnóstico se carga en `terminology.*` con un importador idempotente; `out/coverage.md` dice qué regiones están consolidadas y cuáles pendientes.
- Kill-test: `node tools/terminology-import/diagnostic-devices/master/build.mjs` falla, o `load-taxonomy.mjs` inserta filas en una segunda corrida, o una fila del catálogo no tiene `source`/`sourceRecordId`/`sourceUrl`/`sourceVersion`/`retrievedAt`.

> Desvío registrado: este plan se escribió **después** de empezar (pasada 2), porque
> `AGENTS.md` no se leyó al arrancar (se buscó solo `CLAUDE.md` y `.claude/rules/`, que no
> existen en el repo). Ver REPORTE.md, «Desvíos del plan».

## Alcance
- IN: `tools/terminology-import/diagnostic-devices/README.md` (formato común), `tools/terminology-import/diagnostic-devices/master/**`, `docs/seed-research/diagnostic-devices-master.md`, `docs/trabajo/2026-10-24-seed-dx-devices-master/**`.
- OUT: `us/`, `eu/`, `row/` (de las sesiones hermanas, solo se leen); `src/**` (sin cambios de código de la API); DDL, migraciones y `synchronize` (ADR-0021); `package.json` y `yarn.lock` (la instalación local con `xlsx@0.18.5` no se versiona).
- Ambigüedades registradas:
  1. «Diagnóstico» no tiene una definición única entre nomenclaturas. Supuesto: solo criterios publicados (títulos de subparte del 21 CFR, partes IVD 862/864/866, categoría W de la EMDN y títulos de grupo EMDN que declaran solo diagnóstico o monitoreo). Lo demás queda `null`. A confirmar con Justin.
  2. Rama: el entorno exige `claude/intelligent-heisenberg-0idr17` y el brief pide `justin/seed-dx-devices-master`. Supuesto: se empuja el mismo commit a las dos y el PR sale de `justin/seed-dx-devices-master`. A confirmar con Justin.
  3. Las regiones hermanas empujan a ramas `claude/*` (`eu`: `claude/adoring-curie-xdkt83`, `row`: `claude/inspiring-planck-xhpf4w`). Supuesto: `regions.mjs` toma la rama acordada si existe y, si no, la rama remota más reciente que tenga `out/manifest.json`.

## H1 — Formato común y taxonomía de tipos de equipo
**CA:** Dado el PCD de la FDA y la EMDN V2, cuando corre `build.mjs`, entonces cada tipo tiene `diagnostic` (`true`/`false`/`null`) con el criterio publicado que lo decidió, y solo hay mapeos que publica una fuente.
**DoD:** `node --test "tools/terminology-import/diagnostic-devices/master/test/*.test.mjs"` → 0 fallos; `out/coverage.md` lista los nodos por criterio.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Formato de intercambio común | El README define los 18 campos, `extra`, el manifest y los archivos de menos de 50 MB | `git show origin/justin/seed-dx-devices-master:tools/terminology-import/diagnostic-devices/README.md` → existe | HECHO |
| H1.S1.M2 | Validador del formato | Una fila sin un campo obligatorio o con una fecha inválida se rechaza | test `validateRow` → pass | HECHO |
| H1.S2.M1 | Tabla del 21 CFR verificada | Cada subparte trae su rango y su URL; una sección fuera de rango da `null` | tests `classifyRegulation` → pass | HECHO |
| H1.S2.M2 | Parser del PCD de la FDA | El recorte real da 21 nodos con la decisión esperada | test `parsePcd + pcdNode` → pass | HECHO |
| H1.S3.M1 | EMDN V2 desde dos copias | Las copias coinciden en código, término y nivel; el faltante se toma de la otra | test `EMDN: las dos copias…` → pass; build imprime `solo en B: V020303` | HECHO |
| H1.S3.M2 | Criterio EMDN | W es IVD; un título de grupo diagnóstico decide; uno mixto no | test `EMDN: W es IVD…` → pass | HECHO |
| H1.S4.M1 | Mapeos publicados | Una fila con dos tipos crea un mapeo y la decisión se propaga solo si es unánime | test `Taxonomy: un mapeo publicado…` → pass | HECHO |

## H2 — Resolución de fabricantes
**CA:** Dadas razones sociales verbatim de varias fuentes, cuando se resuelven, entonces se fusionan solo por id publicado o por nombre normalizado y país compatible, y lo dudoso va a revisión con su evidencia.
**DoD:** tests `normalizeManufacturerName`, `resolveManufacturers` → pass; `out/review-manufacturers.ndjson.gz` existe.
**Estado:** EN CURSO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Normalización y sufijos | Los casos del test dan la clave esperada | test → pass | HECHO |
| H2.S1.M2 | Fusiones y revisión | Dos LEI distintos no se fusionan; el mismo nombre en otro país va a revisión | test → pass | HECHO |
| H2.S1.M3 | Grupos publicados | Una relación publicada enlaza sin fusionar | test → pass | HECHO |
| H2.S2.M1 | Actores EUDAMED (SRN) de `eu` como identidad | Las entidades con SRN toman el nombre y el país publicados por EUDAMED | build: `identidades de fabricantes publicadas (actores): 26583`; fusiones `same-registry-id` > 0 | HECHO |
| H2.S2.M2 | GLEIF / Wikidata para grupos | Hay relaciones padre/hija publicadas | — | BLOQUEADO (403 del proxy) |

## H3 — Consolidación de regiones y catálogo
**CA:** Dadas las salidas de `us`, `eu` y `row` en git, cuando corre `build.mjs`, entonces cada fila válida de diagnóstico queda en un modelo con todos sus registros, y la región sin salida figura como pendiente.
**DoD:** `node --max-old-space-size=8000 …/build.mjs` → código 0; `out/coverage.md` con la tabla de regiones.
**Estado:** EN CURSO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Lector de regiones por git | Encuentra la rama acordada u otra rama con `out/manifest.json` y verifica el sha256 | test `regions` → pass | HECHO |
| H3.S1.M2 | Consolidar `us` | Filas leídas y validadas; las inválidas, informadas | salida de build: `región us: 189072 filas` (4 inválidas de LIVD informadas) | HECHO |
| H3.S1.M3 | Consolidar `eu` | Filas de `eudamed-udi` leídas y válidas | salida de build: `región eu: 716 filas` | HECHO |
| H3.S1.M4 | Consolidar `row` | Filas de `row` leídas y válidas | salida de build | TODO |
| H3.S2.M1 | Agrupación en modelos | Marca y modelo, más UDI-DI, agrupan registros de fuentes distintas | test `consolidate` → pass | HECHO |
| H3.S3.M1 | Listados del sector | Las menciones con URL se cruzan con los fabricantes sin fusionar | build imprime menciones y cruces | HECHO |

## H4 — Importador de la taxonomía (sin DDL)
**CA:** Dada una base con el módulo 03, cuando corre `load-taxonomy.mjs` dos veces, entonces la segunda inserta 0 filas.
**DoD:** salida literal de las dos corridas en `evidencia/load-postgres16-pasada*.txt`.
**Estado:** HECHO (pasadas 1 y 2; se repite si cambia la taxonomía)

## H5 — Saturación con /loop
**CA:** Dadas pasadas sucesivas, cuando dos seguidas aportan 0 tras deduplicar, entonces el loop se detiene y cada pasada queda registrada.
**DoD:** `docs/seed-research/diagnostic-devices-master.md` con una sección por pasada.
**Estado:** EN CURSO

## H6 — Cierre
**CA:** Dado el trabajo, cuando se cierra, entonces hay propuesta para el repo del modelo, `SOURCES.md`, reporte de cobertura, REPORTE.md y un PR contra `dev` sin mergear.
**DoD:** `corepack yarn typecheck` y `corepack yarn lint` → exit 0; tests → 0 fallos; PR abierto.
**Estado:** EN CURSO

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H6.S1.M1 | Propuesta `device_catalog` | Entidades, columnas, FK e índices escritos | sección en `docs/seed-research/…` | HECHO |
| H6.S1.M2 | typecheck | exit 0 | `evidencia/typecheck.txt` | HECHO |
| H6.S1.M3 | lint | exit 0 | `evidencia/lint.txt` | HECHO |
| H6.S1.M4 | REPORTE.md | Escrito con las tres secciones | archivo existe | TODO |
| H6.S1.M5 | PR contra `dev` | Abierto, sin mergear | URL del PR | TODO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Red del entorno: 403 en FDA, NLM, CE, GLEIF, Wikidata | Sin fuentes oficiales directas ni grupos/filiales | Copias públicas en git fijadas por commit y sha256; huecos en SOURCES.md |
| Copias de terceros con errores de extracción | Datos incompletos | Verificación cruzada entre dos copias (EMDN) |
| Criterios de alcance distintos en `us` y en master | Filas de `us` que master no considera de diagnóstico | Se informan en coverage.json; no se fuerzan |
| GMDN con licencia de la GMDN Agency | No se puede redistribuir la nomenclatura completa | Solo lo que GUDID publica por dispositivo |
