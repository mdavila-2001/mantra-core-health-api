# Plan C10 — Catálogo mundial de equipos de diagnóstico (cierre de huecos)

- Fecha: 2026-10-27 · Repo: `mantra-core-health-api` (rama `claude/adoring-heisenberg-1rl29k`) · Predecesor: pasadas del 2026-10-24 (`docs/seed-research/diagnostic-devices-{us,eu,row,master}.md`), bloqueadas por 403 de red · Plan padre: [`../../PLAN.md`](../../PLAN.md)
- Resultado observable: cada fuente listada como hueco/bloqueada en los cuatro docs fue re-sondeada hoy; las que responden se descargaron del origen oficial, se leyeron con un parser validado contra el archivo real y quedan en `diagnostic-devices/<región>/out/` (NDJSON gzip, procedencia por fila); `master/` las une (tipo → fabricante → marca → modelo) y la taxonomía se carga en `terminology.*` de un Postgres 16 desechable con 2.ª corrida = 0 filas nuevas.
- Kill-test: algún `manifest.json → gaps` sigue diciendo «403 del proxy» para un host que hoy responde 200 (se compara contra `M1-sondeo-2026-10-27.tsv`).

## Alcance
- IN: `tools/terminology-import/diagnostic-devices/**`, los cuatro `docs/seed-research/diagnostic-devices-*.md`, `docs/trabajo/2026-10-27-terminologia-cierre-huecos/evidencia/C10/`.
- OUT: DDL y repo del modelo (ADR-0021); GMDN (membresía); contenido con licencia no comercial o no verificada; cuentas nuevas; CAPTCHAs; cualquier otra ruta del repo.
- Ambigüedades registradas: ver `REPORTE-C10.md` § Decisiones (cada una con a quién confirmarla).

## H1 — Re-sondeo y carga de las fuentes que hoy responden
**CA:** Dado el registro de huecos de cada región, cuando se re-sondea cada fuente hoy, entonces ningún hueco queda con «403» sin re-sondeo de hoy; las fuentes alcanzables con licencia verificada quedan cargadas con procedencia por fila; las no alcanzables o con licencia/curaduría pendiente tienen motivo exacto.
**DoD:** `node --test` de cada región en verde · builds reproducibles (SHA-256 de `out/` iguales en 2 corridas) · taxonomía cargada en Postgres 16 desechable, 2.ª corrida = 0 filas nuevas · consultas de integridad pegadas · docs y `SOURCES.md` actualizados.
**Estado:** EN CURSO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.C10.M1 | Sondear todas las fuentes (host + endpoint de datos) | tabla hoy en `M1-sondeo-2026-10-27.tsv` | `node probe-sources.mjs` | EN CURSO |
| H1.C10.M2 | EU: EMDN oficial 2026 | `ec-emdn` desde `webgate.ec.europa.eu`, no espejo | build + test | TODO |
| H1.C10.M3 | EU: EUDAMED `/udi` completo en alcance diagnóstico (Data Lake) | filas con procedencia oficial | build + test | TODO |
| H1.C10.M4 | EU: EUDAMED `/actors` y `/reference` | actores con SRN, sin e-mail ni teléfono | build + test | TODO |
| H1.C10.M5 | EU: MHRA PARD (términos y descarga) | cargado o hueco con motivo | evidencia | TODO |
| H1.C10.M6 | EU: swissdamed (términos) | hueco por términos o cargado | evidencia | TODO |
| H1.C10.M7 | EU: Italia BD/RDM y CND | cargado o hueco con motivo | build + test | TODO |
| H1.C10.M8 | ROW: ANVISA oficial | reemplaza el espejo de 2025 | build + test | TODO |
| H1.C10.M9 | ROW: Health Canada MDALL API | reemplaza el espejo de 2020 | build + test | TODO |
| H1.C10.M10 | ROW: TGA, PMDA, NMPA, MFDS, CDSCO, COFEPRIS | cargado o hueco con motivo exacto de hoy | evidencia | TODO |
| H1.C10.M11 | ROW: TFDA, INVIMA, HSA, MDA, OMS PQ, UNICEF y resto | ídem | evidencia | TODO |
| H1.C10.M12 | US: re-sondeo de huecos y fuentes ahora oficiales | `gaps` al día | evidencia | TODO |
| H1.C10.M13 | master: rebuild con todo y reproducibilidad | mismo SHA-256 en 2 builds | salida de ambos | TODO |
| H1.C10.M14 | Postgres 16 desechable: taxonomía + 2.ª corrida + integridad | 2.ª corrida = 0 | salida literal | TODO |
| H1.C10.M15 | Docs, SOURCES.md, REPORTE-C10, limpieza | sin «403» sin re-sondeo | diff | TODO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Peso de lo versionado (> ~300 MB) | PR inmanejable | medir y proponer corte en vez de subir |
| Recursos compartidos con 9 agentes | timeouts espurios | concurrencia ≤ 4, ≤ 2 req/s por host, `--max-old-space-size` ≤ 2500 |
| Licencias de fuentes | contaminar el catálogo | leer términos reales; no cargar NC ni sin verificar |
