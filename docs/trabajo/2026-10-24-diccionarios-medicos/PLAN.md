# Plan — Nombres en castellano de Wikidata para los diccionarios médicos (pasada 9)

- Fecha: 2026-10-24 · Repos afectados: mantra-core-health-api · Predecesor: commit 9febedd6 (importador escrito, nunca corrido)
- Resultado observable: `wikidata-es-labels.ndjson` empaquetado en `data/` y contado por `load-dictionaries.mjs` (dry-run) como `wikidataEsLabels`.
- Kill-test: `load-dictionaries.mjs` (dry-run) no informa `wikidataEsLabels` o lo informa en 0.

## Alcance
- IN: correr `import-wikidata-es-labels.mjs`; empaquetar; dry-run del loader; revisar muestra; corregir `corpusCode` con test si arma mal un id; DeCS sólo si hay descarga oficial con licencia; docs (medical-dictionaries.md pasada 9, SOURCES.md, este REPORTE.md).
- OUT: cambios de esquema SQL, otros importadores, el glosario ES.
- Ambigüedades registradas: DeCS — la sesión madre informa que decs.bvsalud.org corta la conexión y api.bvsalud.org pide clave; supuesto: si no hay descarga oficial con licencia legible, se documenta como hueco (confirmar con Justin).

## H1 — Etiquetas ES de Wikidata en el corpus
**CA:** Dado el corpus restaurado, cuando se corre el importador, entonces existen filas ES por propiedad con su ítem Q y el loader las cuenta.
**DoD:** comandos de abajo con salida 0 + tests en verde.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Restaurar corpus | SHA-256 verificado | `pack-dictionaries-data.mjs --unpack` → exit 0 | HECHO |
| H1.S1.M2 | Correr importador | conteo por propiedad impreso | `import-wikidata-es-labels.mjs` → exit 0 | HECHO |
| H1.S1.M3 | Muestra manual | UBERON:0000948, HGNC:1100, NCBITaxon:1313 coinciden ítem↔código | `grep` en el ndjson | HECHO |
| H1.S1.M4 | Empaquetar | `data/` incluye wikidata-es-labels | `pack-dictionaries-data.mjs --pack` → exit 0 | HECHO |
| H1.S1.M5 | Dry-run loader | `wikidataEsLabels` > 0 | `load-dictionaries.mjs` | HECHO |
| H1.S1.M6 | Tests | todos en verde | `node --test "tools/terminology-import/dictionaries/test/*.test.mjs"` | HECHO |
| H1.S1.M7 | (agregada) `corpusCode` lleva `CL_0000738` → `CL:0000738` | test con el valor real en verde; CL casa con el corpus | `node --test …` → 19/19 | HECHO |
| H1.S1.M8 | (agregada) `--pack` tras `--unpack` no rompe `data/` | `--pack` exit 0 sin el manifiesto de descargas local | `pack-dictionaries-data.mjs --pack` → exit 0 | HECHO |
| H1.S2.M1 | `--apply` en Postgres desechable (opcional) | 2.ª corrida 0 cambios | `load-dictionaries.mjs --apply` ×2 | HECHO |

## H2 — DeCS
| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Localizar descarga oficial + licencia | URL y texto de licencia leídos | `curl` con código HTTP | BLOQUEADO |

## H3 — Cierre
| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Docs pasada 9 + SOURCES + REPORTE | secciones escritas | `git diff --stat` | HECHO |
| H3.S1.M2 | Commit + push + PR (#713 ya estaba mergeado → PR nuevo #719) | rama remota actualizada | `git push` exit 0 | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Timeout SPARQL (60 s) en propiedades grandes | sin datos de esa propiedad | `--props` por separado y reportar |
| 429 de Wikidata | corrida lenta | el HttpClient reintenta con Retry-After |
