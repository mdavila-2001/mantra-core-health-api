# Plan — Equipos de diagnóstico US: fuentes oficiales FDA/NLM

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` (sólo `tools/terminology-import/diagnostic-devices/us/**` y `docs/`) · Predecesor: `2026-10-24-seed-dx-devices-us`, PR #695 y #706 (A MEDIAS: H2.S1.M1, H2.S2.M3; su plan y reporte se retiraron de `docs/trabajo/` en la limpieza `268f43c7`)
- Rama: `justin/seed-dx-devices-us-official` desde `dev` (`ab5fb64c`).
- Resultado observable: `out/*.ndjson.gz` de la región US se construye con prioridad sobre las descargas oficiales de openFDA y AccessGUDID (no espejos) donde existen, con procedencia oficial por fila, y la pasada 11 queda en la bitácora.
- Kill-test: `zcat out/fda-510k-*.ndjson.gz | head -1` muestra `extra.via` de espejo en vez de oficial, o `manifest.json → gaps` sigue listando openFDA/AccessGUDID.

## Alcance
- IN: `tools/terminology-import/diagnostic-devices/us/**` (normalizadores, build, tests, `out/`, `SOURCES.md`), `docs/seed-research/diagnostic-devices-us.md`, este plan, su reporte y `evidencia/`.
- OUT: `src/**`, DDL, `package.json`/`yarn.lock` (cambio local de `xlsx` sólo si hace falta, sin commitear), regiones `eu/`, `row/`, `master/`. Crudos nunca en git.
- Ambigüedades registradas:
  1. GUDID oficial y openFDA `device/udi` son el mismo GUDID. Supuesto: se usa uno solo para las filas UDI-DI (el delimitado de AccessGUDID si bajó completo; si no, openFDA udi) para no duplicar por UDI-DI. Confirmar con Justin.
  2. Red: los 5 hosts responden (`api.fda.gov` 404 en la raíz = sin endpoint, `download.open.fda.gov` 200, `accessgudid.nlm.nih.gov` 200, `www.accessdata.fda.gov` 302, `www.fda.gov` 200).

## H1 — Descarga oficial
**CA:** Dado acceso a los hosts, cuando corre el descargador, entonces quedan los zips oficiales con su sha256 en `official/manifest.json`.
**DoD:** `fetch-official.mjs --gudid-delimited` exit 0 + manifiesto. **Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Bajar openFDA classification, 510k, pma, registrationlisting, udi | 57 archivos en el manifiesto | `jq '.files|length' official/manifest.json` | HECHO |
| H1.S1.M2 | Bajar AccessGUDID Delimited Full Release | zip en `official/accessgudid/` con sha256 | `jq` del manifiesto | HECHO |
| H1.S2.M1 | Bajar espejos (MAUDE, retiros, LIVD, CLIA, NAAT…) | `mirrors-manifest.json` con todos OK | `fetch-mirrors.mjs` exit 0 | HECHO |

## H2 — Normalizadores contra archivos reales
**CA:** Dado cada archivo oficial real, cuando lo procesa su normalizador, entonces produce filas válidas del formato común sin campos inventados.
**DoD:** `node --test "tools/terminology-import/diagnostic-devices/us/test/*.test.mjs"` en verde con fixtures de filas reales. **Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | `fromOpenFda510k` coincide con los campos reales | test con fila real | `node --test` | HECHO |
| H2.S1.M2 | `fromOpenFdaPma` coincide con los campos reales | test con fila real | `node --test` | HECHO |
| H2.S1.M3 | `fromOpenFdaRegistrationListing` coincide | test con fila real | `node --test` | HECHO |
| H2.S1.M4 | `fromOpenFdaUdi` coincide | test con fila real | `node --test` | HECHO |
| H2.S1.M5 | `fromAccessGudidDelimited` coincide con las cabeceras reales | test con filas reales | `node --test` | HECHO |
| H2.S1.M6 | Clasificación oficial de openFDA usada por `build.mjs` | product codes desde oficial | `manifest.json` de `out/` | HECHO |

## H3 — Build, cobertura, carga y entrega
**CA:** Dado los crudos, cuando corre `build.mjs`, entonces cada parte `.ndjson.gz` < 50 MB, las oficiales ganan sobre espejos y la pasada 11 queda documentada.
**DoD:** comandos abajo. **Estado:** A MEDIAS (gates bloqueados)

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Build completo | exit 0, partes < 50 MB | `build.mjs` + `ls -l out` | HECHO |
| H3.S1.M2 | Cobertura y pasada 11 en la bitácora | fila 11 en la tabla | `coverage-report.mjs` | HECHO |
| H3.S1.M3 | `SOURCES.md` actualizado | fuentes oficiales «usado» | lectura del diff | HECHO |
| H3.S1.M4 | Cargador dry-run | exit 0 con conteos | `load-dx-device-types-us.mjs` | BLOQUEADO |
| H3.S2.M1 | Gates: typecheck, lint, docs:links | exit 0 | `corepack yarn …` | BLOQUEADO |
| H3.S2.M2 | Commit, push y PR contra `dev` (listo, sin merge) | URL del PR | MCP GitHub | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Disco (30 GB libres) no alcanza para UDI completo | sin UDI-DI oficial | priorizar classification/510k/pma/RL; medir antes de UDI |
| Heap de Node con openFDA udi (millones de registros) | build cae | streaming + filtro por alcance antes de acumular |
| Partes > 50 MB con GUDID completo | GitHub rechaza | bajar `maxBytes` del escritor |

## Seguimiento (después del merge de #709)

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H9.S1.M1 | La versión del code system `fda-product-code` sale de la clasificación oficial, no de la primera `sourceVersion` del manifiesto (hoy elige un espejo de MAUDE) | dry-run imprime `versión: openFDA device/classification export 2026-10-21` | `node --max-old-space-size=8192 …/load-dx-device-types-us.mjs` | HECHO |
| H9.S1.M2 | Enlace roto del predecesor (su carpeta se borró en la limpieza `268f43c7`) | `yarn docs:links` sin enlaces rotos | `corepack yarn docs:links` → `exit=0` | HECHO |
| H9.S1.M3 | Gates que #709 no pudo correr: tests con `node_modules`, typecheck, lint y dry-run del cargador | todos con exit 0 | ver la descripción del PR de seguimiento | HECHO |
