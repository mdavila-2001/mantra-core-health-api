# Plan — Catálogo de análisis: pasadas con la red abierta (LOINC, GTR)

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` · Predecesor: PR mdavila-2001/mantra-core-health-api#681 (cerrado sin mergear; su contenido está en `dev` por los commits `500400eb` y `8a6165c3`),
  `tools/terminology-import/lab-tests/`, `docs/seed-research/lab-tests.md`
- Resultado observable: el catálogo `lab-catalog-*` incluye LOINC (clase como categoría,
  CLASSTYPE, estado, pedible/observación, nombres en castellano oficiales, miembros de paneles,
  unidades) y los tests del NCBI Genetic Testing Registry, cargables con el mismo
  `load-lab-tests.mjs` y versionados en `data/`.
- Kill-test: `load-lab-tests.mjs` (dry-run) no muestra capa `loinc` con más de 50 000 conceptos,
  o una segunda carga contra Postgres inserta más de 0 filas de catálogo.

## Alcance

- IN: `tools/terminology-import/lab-tests/` (nuevos `fetch-loinc-txfhir.mjs`, `fetch-loinc-ctss.mjs`,
  `fetch-gtr.mjs`, `lib/gtr.mjs`, adaptadores en `build-lab-tests.mjs`, `data/`, `SOURCES.md`, `README.md`),
  `tools/terminology-import/test/lab-tests.test.mjs` + fixtures, `docs/seed-research/lab-tests.md`, este directorio.
- OUT: DDL; `src/` (binding `service-request-code`); importadores ajenos (`import-loinc.mjs` queda como está).
- Ambigüedades registradas:
  1. LOINC sale de **tx.fhir.org** (servidor de terminología de HL7, LOINC 2.82) y de **NLM Clinical
     Tables**, no del zip oficial (loinc.org sigue en 403 y exige cuenta). Supuesto: válido con la
     licencia LOINC y su aviso; se declara la vía en `source_name`. Confirmar con el propietario.
  2. tx.fhir.org es un servidor comunitario: se consulta a ≤ 2 pedidos/s, con caché en disco y
     particionando por filtros oficiales (`CLASS`, `COMPONENT`), sin `$lookup` masivo.
  3. GTR registra **ofertas de laboratorios** (un test por laboratorio), no análisis abstractos.
     Supuesto: se cargan los vigentes como su propio code system, dominio genética. Confirmar con el propietario.

## H5 — LOINC con la red abierta
**CA:** Dado tx.fhir.org y NLM accesibles, cuando corre el build, entonces la capa `loinc` tiene
cada término con clase, CLASSTYPE, estado, ORDER_OBS, nombres es-MX / es-AR cuando existen, y los
paneles tienen sus miembros.
**DoD:** `build-lab-tests.mjs` (usa tx.fhir.org + NLM si no hay zip; el flag `--loinc-txfhir` no hizo falta) → capa `lab-tests-loinc` con su conteo; tests verdes.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H5.S1.M1 | Descubrir todas las clases LOINC (regex por inicial + exclusión de las halladas) | Ninguna inicial devuelve códigos fuera de las clases halladas | `fetch-loinc-txfhir.mjs` → «clases: N, residuo 0» | HECHO |
| H5.S1.M2 | Enumerar los términos de cada clase con designaciones | Clase > 3 000 se parte por `COMPONENT` sin perder códigos | log por clase: «códigos = suma de particiones» | HECHO |
| H5.S1.M3 | Estado y ORDER_OBS por clase | Cada término lleva STATUS y ORDER_OBS o queda en el valor por omisión documentado | conteos por valor en el meta | HECHO |
| H5.S2.M1 | NLM: COMPONENT, PROPERTY, METHOD_TYP, unidades (con rango si la fuente lo trae) | Prefijos con total ≤ 7 500 | `fetch-loinc-ctss.mjs` → total = suma de hojas | HECHO |
| H5.S2.M2 | NLM: miembros de paneles (`loinc_form_definitions`) | Cada panel incluido tiene su definición o queda registrado sin ella | conteo en el meta | HECHO |
| H5.S3.M1 | Adaptador tx.fhir.org + NLM → filas de `loincRecords` | Test con recorte real | `node --test …` → ok | HECHO |
| H5.S3.M2 | Carga en Postgres desechable, 2 corridas | 2.ª = 0 | `evidencia/` | HECHO |

## H6 — NCBI Genetic Testing Registry
**CA:** Dado `test_version.gz` del FTP de GTR, cuando corre el build, entonces cada test vigente
es un concepto con laboratorio, país, métodos, categorías de método, genes y condiciones.
**DoD:** capa `lab-tests-gtr` con su conteo; test con filas reales; carga idempotente.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H6.S1.M1 | Descargar GTR con SHA-256 | Archivo y hash en el manifiesto | `fetch-gtr.mjs` | HECHO |
| H6.S1.M2 | Parser por cabecera; sólo la versión vigente de cada test | Un test aparece una vez | test con filas reales | HECHO |
| H6.S1.M3 | Categoría = categoría mayor de método (archivo oficial `tests_by_method_category.txt`) | Sin categorías inventadas | test | HECHO |

## H7 — Entrega por pasada
**CA:** Dada cada pasada, cuando termina, entonces está commiteada y empujada, y `data/` y el
registro de pasadas están al día.
**DoD:** `git push` por pasada; PR contra `dev` (no draft, sin mergear); REPORTE.md.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H7.S1.M1 | Push tras H5 | rama remota = local | `git rev-parse HEAD origin/<rama>` | HECHO |
| H7.S1.M2 | Push tras H6 | idem | idem | HECHO |
| H7.S1.M3 | PR y REPORTE | PR abierto, no draft | link | HECHO: https://github.com/mdavila-2001/mantra-core-health-api/pull/729 |

## H8 — Trabajo no previsto, agregado al plan (§1.3)
**CA:** Dado el catálogo con la red abierta, cuando se cotejan las redistribuciones y se agregan las
fuentes oficiales alcanzables, entonces cada fuente es la oficial o está cotejada, o el no-cotejo queda
declarado; y una carga completa desde `data/` es idempotente con el conteo exacto del plan.
**DoD:** tests verdes; dos cargas completas en Postgres 16 desechable (2.ª = 0) con relaciones = plan.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H8.S1.M1 | Pasada 11: CUPS (datos.gov.co) como capa | Capa `cups-co` con conteo | `build-lab-tests.mjs` → `cups-co: 2158` | HECHO |
| H8.S1.M2 | Pasada 11: designaciones CIE-10-ES para ICD-10-PCS | Cada código PCS con traducción oficial la lleva | test `addCie10esDesignations` | HECHO |
| H8.S2.M1 | Pasada 12: TUSS cotejado con el ZIP de la ANS | 0 diferencias | registro de la pasada 12 | HECHO |
| H8.S2.M2 | Pasada 12: PAMI desde el CSV oficial | Nombres verbatim | test `pamiOfficialItems` | HECHO |
| H8.S2.M3 | Pasada 12: ICD-10-PCS FY2027 desde CMS | 4 402 incluidos | test `pcsOrderFile` + build | HECHO |
| H8.S3.M1 | Pasadas 14 y 15 registradas | Filas en `docs/seed-research/lab-tests.md` | lectura del doc | HECHO |
| H8.S4.M1 | Relación de panel con miembro repetido conserva cada posición | 2 ids distintos para 2 posiciones | `node --test` → test «miembro repetido» ok | HECHO |
| H8.S4.M2 | Carga completa desde `data/`, 2 corridas, base nueva | corrida 1 = plan (18 236 relaciones); corrida 2 = 0 | `evidencia/carga-completa-desde-data-postgres16.txt` | HECHO |
| H8.S5.M1 | Merge de `dev` sin regresiones | typecheck, lint y tests verdes tras el merge | `corepack yarn typecheck`, `corepack yarn lint`, `node --test` | HECHO |

## H9 — Terminar la saturación (pedido del propietario: «que de una vez se termine»)
**CA:** Dado que la pasada 15 dejó CDISC pendiente, cuando se cargan las fuentes alcanzables con
licencia verificada y se sigue buscando, entonces hay dos pasadas seguidas sin conceptos nuevos y cada
fuente no cargada tiene su motivo escrito.
**DoD:** capas `cdisc-sdtm` y `npu-ifcc` con test sobre recorte real; pasadas 17 y 18 en 0 registradas;
carga completa desde `data/` en base nueva, corrida 1 = dry-run y corrida 2 = 0; tests, typecheck y lint verdes.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H9.S1.M1 | Licencia de CDISC verificada en la fuente | Texto de cdisc.org + términos de NCIt citados | lectura de las dos páginas | HECHO |
| H9.S1.M2 | Capa `cdisc-sdtm` (10 codelists diagnósticas) | 4 721 = suma de las 10 codelists | test «CDISC SDTM» + `build-lab-tests.mjs` → `cdisc-sdtm: 4721` | HECHO |
| H9.S2.M1 | Licencia de NPU verificada en la fuente | PDF «NPU License & Terms of Use» leído | lectura del PDF | HECHO |
| H9.S2.M2 | Capa `npu-ifcc` | 25 699 activos de la versión vigente | test «NPU» + `build-lab-tests.mjs` → `npu-ifcc: 25699` | HECHO |
| H9.S3.M1 | Pasadas 16–18 registradas con motivo por fuente | 17 y 18 en 0 | lectura de `docs/seed-research/lab-tests.md` | HECHO |
| H9.S4.M1 | Carga completa final, 2 corridas, base nueva | corrida 1 = dry-run (188 729 conceptos); corrida 2 = 0 | `evidencia/carga-completa-final-postgres16.txt` | HECHO |
| H9.S4.M2 | Regresión | tests, typecheck y lint verdes | `node --test`, `corepack yarn typecheck`, `corepack yarn lint` | HECHO |

## Riesgos y bloqueos previstos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| tx.fhir.org limita o cae | LOINC incompleto | Caché en disco y reanudación; el residuo se reporta |
| Una partición por `COMPONENT` sigue > 3 000 | Códigos sin enumerar | Partición recursiva por segundo carácter; los que queden se reportan |
| `$lookup` de la clase hecho sobre un término sin clase | Bucle de descubrimiento | Se registra y se excluye |
| GTR trae datos de laboratorios (no de pacientes) | — | Sin PHI: datos organizacionales públicos |
