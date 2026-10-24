# Plan — Equipos de diagnóstico de Europa: descarga oficial con la red abierta

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` (solo `tools/terminology-import/diagnostic-devices/eu/` y `docs/`) · Predecesor: PRs #691 (`dev`) y #692 (`test`), mergeados, con 716 equipos sacados de réplicas en git porque la red bloqueaba las fuentes oficiales.
- Resultado observable: `tools/terminology-import/diagnostic-devices/eu/out/` trae los equipos de diagnóstico de EUDAMED bajados de la API oficial (Data Lake) por cada código EMDN en alcance, la EMDN oficial y, si se puede, la BD/RDM italiana; cada fila con procedencia oficial.
- Kill-test: `out/manifest.json` sin filas `eudamed-udi` con `sourceVersion` del Data Lake, o tests dirigidos en rojo.

## Alcance
- IN: `tools/terminology-import/diagnostic-devices/eu/**`, `docs/seed-research/diagnostic-devices-eu.md`, esta carpeta.
- OUT: `src/**`, DDL, carpetas de otras regiones, `package.json`/`yarn.lock`.
- Ambigüedades registradas: rama `claude/adoring-curie-xdkt83` reiniciada desde `dev` (la anterior ya se mergeó); los mensajes de otras sesiones piden `justin/<tema>`, el entorno exige esta rama. Usuario pidió PR a `dev` y a `test`.

## H1 — Descarga oficial (red abierta desde 2026-10-24 16:29 UTC)
**CA:** Dados los hosts oficiales alcanzables, cuando se corre el pipeline, entonces EUDAMED se baja por código EMDN y reemplaza a las réplicas como fuente principal, sin perder procedencia.
**DoD:** corridas pegadas en `evidencia/`, tests dirigidos en verde, typecheck y lint en exit 0. **Estado:** A MEDIAS (todo HECHO salvo H1.S2.M2, BLOQUEADO por errores ajenos en `src/`; ver REPORTE.md)

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Verificar el Data Lake contra respuestas reales | `/reference` y `/udi` devuelven `{value,nextLink}`; NOMENCLATURE_CODE se guarda con espacio inicial | curl pegado en `evidencia/` | HECHO |
| H1.S1.M2 | Descarga paralela, reanudable, con reintentos y páginas gzip | todos los códigos en alcance con `_complete.json` o hueco registrado | corrida de `fetch.mjs` pegada | HECHO |
| H1.S1.M3 | EMDN oficial (Excel de la Comisión) | reemplaza a la réplica | corrida de `build.mjs` (`coverage.emdnOrigin = official`) | HECHO |
| H1.S1.M4 | BD/RDM Italia: columnas mapeadas con el encabezado real | `assertColumnMap` pasa contra el CSV oficial | `node --test` + sonda sobre el CSV real | HECHO |
| H1.S1.M5 | MHRA PARD, swissdamed y NANDO: términos y formato reales | decisión escrita con la fuente leída | `SOURCES.md` | HECHO |
| H1.S1.M6 | Deduplicar sin colapsar UDI-DI distintos con el mismo modelo | dos UDI-DI distintos con igual fabricante+modelo se conservan | test `dedupe: dos UDI-DI distintos…` | HECHO |
| H1.S1.M7 | Actores oficiales del Data Lake sin datos personales | ningún PRRC, correo ni teléfono en `out/actors/` | test + `zgrep` sobre la salida | HECHO |
| H1.S1.M8 | BD/RDM leída en streaming y descargada solo como ZIP CSV | lee las ~2,4 M filas sin agotar memoria | sonda sobre el CSV real | HECHO |
| H1.S1.M9 | Correo dentro de un campo descriptivo no se publica | 0 correos en `out/` | test + `grep` sobre la salida | HECHO |
| H1.S1.M10 | Build determinista y sin fechas inventadas | dos corridas dan sha256 idénticos | `sha256sum … \| diff` | HECHO |
| H1.S2.M1 | Tests dirigidos actualizados | verde | `node --test …/eu/test/*.test.mjs` | HECHO |
| H1.S2.M2 | Gates del repo | typecheck y lint exit 0 | `yarn typecheck`, `yarn lint` | BLOQUEADO |
| H1.S2.M3 | Documentación: `SOURCES.md`, investigación (pasada 7) y `REPORTE.md` | escritos | archivos en disco | HECHO |
| H1.S2.M4 | PR a `dev` y a `test` | abiertos, sin draft, sin mergear | links | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Límite de pedidos del Data Lake | descarga lenta o 429 | concurrencia acotada (10), reintento con espera exponencial ante 429/5xx, reanudable por `_complete.json` |
| Volumen de IVD (W) | cientos de miles de filas | NDJSON gzip partido < 45 MB |
| Términos de swissdamed/PARD | no se puede reutilizar | se lee el aviso legal real y se decide; si prohíbe, queda hueco |
| BD/RDM: 525 MB de CSV | un string de ese tamaño roza el límite de V8 | lectura en streaming por lotes |
| Datos personales en registros públicos | publicar PRRC o códigos fiscales de personas físicas | se descartan en el normalizador y lo prueba un test |
