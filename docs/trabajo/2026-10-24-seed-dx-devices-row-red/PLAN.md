# Plan — Equipos de diagnóstico ROW: huecos con red completa

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` · Predecesor: primera corrida desde espejos, [PR mdavila-2001/mantra-core-health-api#693](https://github.com/mdavila-2001/mantra-core-health-api/pull/693) (mergeado; no dejó carpeta en `docs/trabajo/`)
- Resultado observable: `tools/terminology-import/diagnostic-devices/row/out/` trae las fuentes oficiales en lugar de los espejos de terceros, los países que eran hueco y, para ANVISA y PMDA, la marca de diagnóstico que publica la propia autoridad. La sesión master lo lee del manifiesto.
- Kill-test: `node --max-old-space-size=8192 tools/terminology-import/diagnostic-devices/row/check-out.mjs` sale 1 ante cualquier fila inválida, sha256 distinto o archivo ≥ 50 MB.

## Alcance
- IN: `tools/terminology-import/diagnostic-devices/row/**`, `docs/seed-research/diagnostic-devices-row.md`, esta carpeta.
- OUT: `src/**`, `us/`, `eu/`, `master/` y el README común.
- Ambigüedades registradas:
  1. Rama: el entorno obliga a `claude/inspiring-planck-xhpf4w` (reiniciada desde `dev`, porque el PR anterior ya se mergeó). Confirmar con Justin.
  2. Una fuente oficial reemplaza a su espejo con el mismo `source` (`anvisa-produtos`, `anvisa-produtos-modelos`, `hc-mdall`). El espejo deja de cargarse. Supuesto: el dato oficial es más nuevo y es la fuente primaria.
  3. Marca de IVD en ANVISA: se toma del área de interés y del asunto de las peticiones (`CICLO_ANALISE_PETICOES_*`), unidas por número de proceso exacto. Es un dato publicado por ANVISA, no una inferencia; si el proceso no cruza, no se marca.

## H1 — ANVISA oficial
**CA:** Dado `TA_PRODUTO_SAUDE_SITE.csv` y `TA_PRODUTO_SAUDE_MODELO.csv` oficiales, cuando corre el build, entonces `anvisa-produtos` y `anvisa-produtos-modelos` salen de esos archivos, con `sourceUrl` oficial y, cuando el proceso cruza, `extra.anvisaPetitionAreas`.
**DoD:** `check-out.mjs` → OK; `node --test` → pass. **Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | `fetch-official.mjs` baja los CSV con URL, `Last-Modified` y sha256 | `official/retrieved.json` lista cada archivo con su sha256 | `node …/row/fetch-official.mjs --only anvisa` → sha256 por archivo | HECHO |
| H1.S1.M2 | El build usa los archivos oficiales para las dos fuentes ANVISA | `sourceUrl` = `https://dados.anvisa.gov.br/dados/TA_PRODUTO_SAUDE_*.csv` | `zcat …/anvisa-produtos.ndjson.gz \| head -1` | HECHO |
| H1.S1.M3 | Áreas de interés y asuntos de las peticiones, unidos por proceso | test con extracto real | `node --test` → pass | HECHO |

## H2 — Health Canada MDALL por API oficial
| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Descarga de licencias activas y archivadas, compañías e identificadores | archivos con fecha y sha256 | `fetch-official.mjs --only hc-mdall` | BLOQUEADO |
| H2.S1.M2 | `hc-mdall` sale de la API (mismo normalizador) | `sourceVersion` con la fecha de la descarga | `check-out.mjs` → OK | BLOQUEADO |

## H3 — Taiwán TFDA
| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Licencias de dispositivos (data.gov.tw 9576) → `tfda-devices` | test con extracto real | `node --test` → pass | HECHO |
| H3.S1.M2 | TUDID (data.gov.tw 151955), si se puede bajar | idem o hueco documentado | idem | HECHO |

## H4 — Japón: maestro JMDN
| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H4.S1.M1 | Código JMDN, clase y 類別 por 一般的名称 en `pmda-approvals` (`extra.deviceTypes`, unión por nombre exacto) | test con extracto real | `node --test` → pass | HECHO |

## H5 — Resto de los huecos
| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H5.S1.M1 | INVIMA (datos.gov.co) | fuente nueva o hueco con motivo | `check-out.mjs` → OK | HECHO |
| H5.S1.M2 | OMS precalificación IVD | idem | idem | HECHO |
| H5.S1.M3 | Demás autoridades de `GAPS` (una por una) | cada una cargada o con motivo | `docs/seed-research/…` registra la pasada | HECHO |
| H5.S1.M4 | (agregada) Singapur HSA: SMDR y clase A (data.gov.sg) | test con extracto real | `node --test` → pass; `check-out.mjs` → OK | HECHO |
| H5.S1.M5 | (agregada) China NMPA UDID: release completo, MD5 verificado | test con extracto real; 6 294 994 filas | `node --test` → pass; `check-out.mjs` → OK | HECHO |
| H5.S1.M6 | (agregada) India CDSCO oficial reemplaza al espejo | test con extracto real; sin correos en direcciones | `node --test` → pass; `check-out.mjs` → OK | HECHO |
| H5.S1.M7 | (agregada) Sudáfrica SAHPRA, listas de kits COVID-19 | test con extracto real | `node --test` → pass | HECHO |
| H5.S1.M8 | (agregada) Malasia MDA: buscador sin fabricante en el listado | cargada o hueco con motivo | `manifest.gaps` | HECHO |

## H6 — Cierre
| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H6.S1.M1 | `corepack yarn typecheck` y `corepack yarn lint` | salen 0 | salida pegada en `evidencia/` | HECHO |
| H6.S1.M2 | `COVERAGE.md`, `SOURCES.md` y registro de pasadas al día | totales = manifiesto | `coverage.mjs` | HECHO |
| H6.S1.M3 | PR contra `dev`, listo para revisión, sin mergear | PR abierto | URL | HECHO |
| H6.S1.M4 | `REPORTE.md` | existe con las secciones obligatorias | `ls` | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| `TA_PRODUTO_SAUDE_MODELO.csv` pesa 975 MB | memoria y tamaño de salida | lectura por streaming; salida partida en `.gz` < 50 MB |
| Portales con CAPTCHA, login o API key | hueco | se documenta; no se elude |
| La API de Health Canada responde 503 | sin datos nuevos de Canadá | reintentos espaciados; si persiste, queda el espejo de 2020 con nota |
