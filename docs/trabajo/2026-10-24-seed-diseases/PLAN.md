# Plan — Catálogo exhaustivo de enfermedades (seed-diseases)

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` · Predecesor: glosario ES (`load-glossary-es.mjs`), `import-icd10cm.mjs`
- Resultado observable: en `terminology.*` quedan cargadas las enfermedades de MONDO, Orphanet (castellano), DOID, NCIt, CIE-11 MMS y EFO con jerarquía, cruces publicados y claves por código (OMIM, CIE-10, CIE-11 Fundación, MeSH, UMLS, DECIPHER), consultables por `$lookup`, `$translate` y búsqueda; la sesión `seed-symptoms` enlaza por código.
- Kill-test: cargar dos veces en un Postgres limpio y contar filas nuevas en la segunda corrida (≠ 0 ⇒ no idempotente); resolver por código los 12 880 ids de enfermedad de `phenotype.hpoa` (alguno sin resolver ⇒ el contrato no sirve).

> **Plan escrito después de la implementación** (desvío: `AGENTS.md` no se leyó en el discovery; ver REPORTE.md, «Desvíos del plan»). Refleja el alcance que se ejecutó, no se usó para ocultar cambios de alcance.

## Alcance
- IN: `tools/terminology-import/diseases/**`, `docs/seed-research/diseases.md`, `docs/trabajo/2026-10-24-seed-diseases/**`, una sección aditiva en `tools/terminology-import/README.md`.
- OUT: DDL, migraciones, `synchronize`; `src/**`; value sets del glosario; archivos de otras sesiones paralelas; la carga en una base que no sea desechable.
- Ambigüedades registradas:
  - Rama `justin/seed-diseases` pedida vs. `claude/eager-pasteur-hxks7i` permitida por la sesión → se usa la segunda; confirmar con Justin.
  - ¿Sumar Orphanet ES a `/glossary`? → no (curación y rendimiento del `IN`); confirmar con el propietario.
  - Copias de terceros de archivos oficiales de la OMS (bloqueados en la red) → sólo con hash verificado; confirmar con el propietario que es aceptable.
  - Títulos CIE-10 de la OMS dentro de las tablas de la CIE-11 → no se cargan hasta confirmar la licencia comercial de la CIE-10.

## H1 — Fuentes con procedencia y licencia verificadas
**CA:** Dado el registro de fuentes, cuando se corre la descarga, entonces cada archivo cargado queda con URL, versión, SHA-256, fecha y licencia, y las copias de terceros coinciden con el hash publicado.
**DoD:** `node tools/terminology-import/diseases/fetch-sources.mjs` → `Manifiesto: … (52 archivos)` sin error de hash; `SOURCES.md` con todas las fuentes.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Inventario de lo existente (importadores, módulo 03, conceptos internos) | Se listan los equivalentes existentes antes de crear nada | `grep -n "terminology:relationship:is-a\|terminology:equivalence" src/common/constants/concepts.ts` → REL_IS_A y EQUIV_* existen | HECHO |
| H1.S1.M2 | Diagnóstico de red | Cada host candidato tiene código HTTP | `curl -s -o /dev/null -w '%{http_code}' <host>` por host → tabla en SOURCES.md | HECHO |
| H1.S2.M1 | Registro de fuentes `lib/sources.mjs` | 47 archivos cargables (12 + 35 clasificaciones de Orphanet) y 5 medidos | `node -e "import('./tools/terminology-import/diseases/lib/sources.mjs').then(m=>console.log(m.SOURCE_FILES.length, m.MEASURE_FILES.length))"` → `47 5` | HECHO |
| H1.S2.M2 | Descarga con manifiesto y verificación de hash | Hash esperado de CIE-11 y tablas OMS coincide | `fetch-sources.mjs` → `[ok] icd11-mms … sha256=f1356588f409…` | HECHO |
| H1.S3.M1 | `SOURCES.md` con licencias y descartes | Toda fuente cargada tiene licencia; toda descartada tiene motivo | lectura de `SOURCES.md` | HECHO |

## H2 — Importador idempotente sin DDL
**CA:** Dado el NDJSON construido, cuando se carga dos veces en una base limpia con el esquema del repo, entonces la segunda corrida inserta 0 filas de datos y no se ejecuta DDL.
**DoD:** `load-catalog.mjs` ×2 → `[load] … {"concepts":0,…}` en todos los sistemas; tests dirigidos en verde.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Lector OBO (MONDO/DOID/NCIt/EFO) | Conserva nombre, definición, sinónimos, xrefs anotados, is_a | `node --test …/diseases.test.mjs` → test «readObo …» ok | HECHO |
| H2.S1.M2 | Lector Orphanet (product1/3/7) | ES verbatim; equivalencias por id de lista | test «Orphanet: …» ok | HECHO |
| H2.S1.M3 | Lector CIE-11 MMS + tablas OMS | 37 052 filas = manifiesto oficial; residuales y notas multilínea | test «tabulación simple CIE-11 …» ok | HECHO |
| H2.S1.M4 | Citas (HPO, phenopacket-store, OMS 10→11) | Sólo ids; destinos poscoordinados no se reducen | test «citas: …» y «OMS 10→11 …» ok | HECHO |
| H2.S2.M1 | Constructor de registros + reglas por fuente | SNOMED fuera; animales no humanos fuera; sólo C2991 de NCIt | tests «MONDO: …», «DOID: …», «NCIt: …» ok | HECHO |
| H2.S2.M2 | Resolución de cruces y claves | Destino ausente = no resuelto (no se fabrica) | test «claves cruzadas …» y «resolveXrefs …» ok | HECHO |
| H2.S3.M1 | Plan de carga (ids deterministas, orden por FK) | Ids únicos; vigentes antes que obsoletos | test «plan: …» ok | HECHO |
| H2.S3.M2 | Cargador con mapeos condicionales | `icd10cm`/CIE-10-ES sólo si existe el destino | corrida con 2 conceptos de prueba → `externalMaps:2`, segunda → `0` | HECHO |

## H3 — Saturación y cobertura
**CA:** Dado el catálogo, cuando se corre el reporte, entonces cada pasada registra fuente, conceptos nuevos tras deduplicar por código y cruce publicado, y descartes; y hay dos pasadas seguidas con 0.
**DoD:** `coverage-report.mjs` → tabla de pasadas en `diseases-coverage.md`; las dos últimas con `newConcepts = 0`.
**Estado:** A MEDIAS

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Regla de deduplicación (union-find por equivalencia / xref sin semántica) | «más amplio/estrecho» no deduplica | test «saturación: …» ok | HECHO |
| H3.S1.M2 | 19 pasadas registradas | Tabla con 19 filas | `coverage-report.mjs` → 19 filas | HECHO |
| H3.S1.M3 | Dos pasadas seguidas con 0 | Las dos últimas en 0 | ídem → pasadas 16–19 en 0 | HECHO |
| H3.S1.M4 | Pasada 15 (enfermedades comunes de HPO, Groza 2015) | DOID resuelto por código/alt_id; MeSH como claves | test «enfermedades comunes de HPO …» ok; `coverage-report.mjs` → fila 15 | HECHO |
| H3.S1.M5 | Pasadas 16–19: ClinGen, ClinVar, Alliance, CURE ID (Monarch KG 2026-10-07) | Ids de enfermedad citados; obsoletos por `replaced_by` | tests «Monarch KG …» y «… replaced_by …» ok; `coverage-report.mjs` → filas 16–19 en 0 | HECHO |
| H3.S1.M6 | Corrección del filtro de MONDO (raíces «disease susceptibility» e «injury») | Las susceptibilidades de OMIM e «injury» entran; animales no humanos siguen fuera | test «MONDO: …» ok; build → `[mondo] 27695 (excluidos 8360)`; ClinGen/ClinVar 0 MONDO vigentes faltantes | HECHO |
| H3.S2.M1 | Cobertura contra MONDO | % por sistema | `coverage-report.mjs` → bloque `vsMondo` | HECHO |
| H3.S2.M2 | Cobertura contra UMLS | % contra conceptos de enfermedad de UMLS | — (cuenta UTS) | BLOQUEADO |

## H4 — Carga medida en Postgres desechable
**CA:** Dado un Postgres 16 limpio con el esquema `database/SQL/03_terminology`, cuando se carga, entonces se miden filas, tiempo, tamaño e idempotencia, y responden las consultas del contrato.
**DoD:** dos corridas de `load-catalog.mjs` + consultas SQL de §3 de `docs/seed-research/diseases.md`.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H4.S1.M1 | Primera carga | Sin errores; filas contadas | `load-catalog.mjs` → `"segundos": 72` | HECHO |
| H4.S1.M2 | Segunda carga | 0 filas nuevas de datos | `load-catalog.mjs` → todos los `[load]` en 0, `"segundos": 43` | HECHO |
| H4.S1.M3 | Consultas del contrato | OMIM 219700 → MONDO/ORPHA/DOID; ancestros CIE-11 de 1A00; búsqueda ES | `psql … -c "<consultas>"` → filas esperadas | HECHO |

## H5 — Documentación, gates y PR
**CA:** Dado el trabajo, cuando se abre el PR contra `dev`, entonces trae `SOURCES.md`, `docs/seed-research/diseases.md`, PLAN/REPORTE y los gates en verde.
**DoD:** `corepack yarn typecheck` y `corepack yarn lint` → exit 0; `node tools/docs/check-doc-links.mjs` → «Sin enlaces rotos»; PR creado.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H5.S1.M1 | `docs/seed-research/diseases.md` | Contiene contrato, pasadas, cobertura, licencias, huecos | `node tools/docs/check-doc-links.mjs` → «Sin enlaces rotos» | HECHO |
| H5.S1.M2 | typecheck | exit 0 | `corepack yarn typecheck` → exit 0 | HECHO |
| H5.S1.M3 | lint | exit 0 | `corepack yarn lint` → exit 0 | HECHO |
| H5.S1.M4 | PR contra `dev` | PR abierto, sin mergear | `mcp github create_pull_request` → #688 | HECHO |
| H5.S1.M5 | PLAN.md + REPORTE.md | Existen con evidencia | `ls docs/trabajo/2026-10-24-seed-diseases/` | HECHO |

## H6 — Datos normalizados versionados en la rama
Orden del propietario recibida a mitad del trabajo por la sesión coordinadora («que terminen su trabajo y lo lleven todo a la nube»). Reemplaza la regla del brief de dejar los datos fuera de git, sólo para el resultado normalizado.

**CA:** Dado un clon limpio de la rama sin fuentes ni build, cuando se carga desde `diseases/data/`, entonces se obtienen los mismos conceptos que desde el build, ningún archivo pasa de 50 MB y cada parte coincide con su SHA-256.
**DoD:** `load-catalog.mjs --from-snapshot` ×2 en base limpia → mismos conteos que el build y 0 nuevas en la 2.ª; `ls -la diseases/data` → partes < 50 MB.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H6.S1.M1 | `lib/snapshot.mjs` + escritura en el build | Partes gzip < 45 MB con SHA-256 en `MANIFEST.json` | test «instantánea versionada …» ok; `ls -la tools/terminology-import/diseases/data` → mayor 4,2 MB | HECHO |
| H6.S1.M2 | Gzip determinista | Rebuild = mismos bytes | `sha256sum -c` de `mondo.part-01.ndjson.gz` tras rebuild → `OK` | HECHO |
| H6.S1.M4 | Carga parcial con `--systems` | Sin violación de FK; al completar converge a los mismos conteos | `--systems orphanet,omim`, `--systems mondo`, completo ×2 → `183325\|190313` y 0 nuevas | HECHO |
| H6.S1.M3 | Carga `--from-snapshot` | Mismos conteos que desde el build; 2.ª corrida = 0 | `load-catalog.mjs --from-snapshot` ×2 → `183325\|309745\|491228\|147251\|190313`, 2.ª corrida en 0 | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Hosts oficiales bloqueados en la red | Fuentes inaccesibles | Espejos oficiales del editor o copias con hash verificado; el resto, documentado como hueco |
| Licencias (OMIM, CIE-10, UMLS, SNOMED, MedDRA) | Contenido no cargable | Sólo códigos citados; SNOMED excluido entero |
| Volumen (precedente MeSH 1,44 M filas sin uso) | Peso inútil | Cargar sólo enfermedades; peso por sistema documentado |
| Sesiones paralelas que crean los mismos code systems | Choques de id | Contrato publicado y acordado con `seed-symptoms` |
