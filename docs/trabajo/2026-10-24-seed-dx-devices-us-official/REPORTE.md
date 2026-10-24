# Reporte — Equipos de diagnóstico US: fuentes oficiales FDA/NLM

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `justin/seed-dx-devices-us-official`
- Peldaño de evidencia alcanzado: `TESTED` en los normalizadores oficiales (tests dirigidos con filas reales en verde) y `RUNS` del build completo sobre los crudos oficiales (exit 0). **No** hay `VERIFIED` ni `REGRESSION_VERIFIED`: typecheck, lint, `docs:links` y el dry-run del cargador **no se corrieron** (ver Pendiente).
- Avance: 13 microtareas HECHO / 15 en total = **86,7 %** (BLOQUEADO: H3.S1.M4 y H3.S2.M1).

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | openFDA classification, 510k, pma, registrationlisting (2 partes) y udi (52 partes), export 2026-10-21 | `NODE_USE_ENV_PROXY=1 node …/fetch-official.mjs --only <ep>` | exit 0 por endpoint; 58 entradas con sha256 (`evidencia/official-manifest.tsv`) |
| H1.S1.M2 | AccessGUDID Delimited Full Release 20261001 (424 163 444 bytes) | `… --only device/udi --gudid-delimited` | exit 0; en el manifiesto |
| H1.S2.M1 | Espejos (MAUDE, retiros, LIVD, CLIA, NAAT, IA, fdadata…) | `DX_PYTHON=<venv>/bin/python node …/fetch-mirrors.mjs` | 15/15 `OK <commit>`, `exit=0` (`evidencia/fetch-mirrors.txt`) |
| H2.S1.M1 | `fromOpenFda510k`: los campos reales coinciden (sin cambios) | `node --test …` | test «openFDA device/510k real» ok |
| H2.S1.M2 | `fromOpenFdaPma`: `sourceRecordId` alineado con el espejo (`P…[/S…]`; antes `…\|NOMBRE` duplicaba cada PMA); herencia del product code del PMA original (753 suplementos sin código en el export) | `node --test …` | ok |
| H2.S1.M3 | `fromOpenFdaRegistrationListing`: `proprietary_name`, `k_number`, `pma_number` están a nivel del listado (el código los leía en `products[]` → filas sin marca ni autorización); el export no trae `key_val` → `sourceUrl` = consulta a la API oficial (verificada con curl); respaldo FEI / owner-operator (207 listados sin número de registro) | `node --test …` | ok |
| H2.S1.M4 | `fromOpenFdaUdi`: campos reales coinciden | `node --test …` | ok |
| H2.S1.M5 | `fromAccessGudidDelimited`: cabeceras reales coinciden; 5 238 573 filas de `device.txt` con el número de columnas correcto | `awk -F'\|'` + `node --test …` | ok; el mismo UDI-DI por las dos vías da la misma fila |
| H2.S1.M6 | La clasificación sale de openFDA `device/classification` | `build.mjs` | `inputs` del manifiesto: `openfda device/classification` 7 096 |
| H3.S1.M1 | Build completo; partes < 50 MB (máx. 12,7 MB); `gaps: []`; 0 filas sin procedencia | `node --max-old-space-size=8192 …/build.mjs` | `exit=0`, 15:01:46 → 15:13:06 (`evidencia/build.txt`, `evidencia/provenance.txt`) |
| H3.S1.M2 | Cobertura y pasada 11 en `docs/seed-research/diagnostic-devices-us.md` | `node …/coverage-report.mjs` | `exit=0` (`evidencia/coverage-report.txt`) |
| H3.S1.M3 | `SOURCES.md`: las fuentes oficiales pasan a «usado (oficial)» | diff | ver commit |
| H3.S2.M2 | PR contra `dev` (listo, sin merge), con los gates declarados como no corridos por decisión de Justin | MCP GitHub | ver link en el PR |

## A medias
Ninguna.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H3.S1.M4 — dry-run de `load-dx-device-types-us.mjs` (y el test «cargador», en rojo por lo mismo) | BLOQUEADO | Sin `node_modules` (`dotenv`): `corepack yarn install` falla (`repo.yarnpkg.com` fetch failed; `cdn.sheetjs.com` 403). Los dos rodeos del pedido (`COREPACK_NPM_REGISTRY`; cambio local de `xlsx`) los denegó el clasificador de permisos de la sesión. Justin decidió abrir el PR con los gates marcados como no corridos. |
| H3.S2.M1 — `corepack yarn typecheck`, `lint`, `docs:links` | BLOQUEADO | Lo mismo. |

## Evidencia
```
# Red (sondeo): api.fda.gov 404 (raíz) · download.open.fda.gov 200 · accessgudid.nlm.nih.gov 200 · www.accessdata.fda.gov 302 · www.fda.gov 200
# node --test "tools/terminology-import/diagnostic-devices/us/test/*.test.mjs"
# tests 24 · # pass 23 · # fail 1 · exit=1   (fail: «cargador» → Cannot find package 'dotenv')
# build.mjs → exit=0
rows 1 098 516 · fda-gudid 635 097 · fda-rl 361 369 · fda-510k 71 955 · fda-recall 13 692 · fda-maude 12 930 · fda-pma 2 750 · cdc-livd 483 · fda-denovo 240
fabricantes 20 148 · marcas 293 608 · product codes vistos 7 118 / incluidos 3 270 / excluidos 3 848 · gaps []
deltaVsPrevious: records 993 440 (fda-gudid 631 967, fda-rl 361 369, fda-pma 104) · fabricantes 3 578 · marcas 212 071 · UDI-DI 631 961
ids de la pasada 10 que ya no están: fda-rl 110 614 (y ninguno de otra fuente)
procedencia: 0 filas sin source/sourceRecordId/sourceUrl/retrievedAt; vía oficial en 510k 71 935, denovo 240, pma 2 743, rl 361 369, gudid 635 097
partes: la mayor fda-gudid-0002 12,7 MB
```
Literal completo en `evidencia/`.

## No cubierto
- No se corrieron typecheck, lint, `docs:links` ni el dry-run del cargador (Pendiente). El cambio no toca TypeScript, pero el lint cubre los `.mjs`: no está demostrado que pase.
- No se probó la determinación byte a byte con `sha256sum -c`; las dos corridas dieron los mismos conteos y tamaños de parte.
- No se cargó nada a una base (ni desechable).

## Desvíos del plan
- `build.mjs`: `fda-rl` se anotaba como hueco («403 del proxy») aunque se usara el R&L oficial (`rlDone` sólo lo ponía la vía espejo). Corregido en una línea; hubo que volver a correr el build.
- Se agregaron a `extra` del R&L oficial `manufacturerIds`, `registrationExpiryYear` y `regStatusCode`, para no perder lo que daba la vía espejo que esta reemplaza.

## Riesgos residuales
- **El delta de R&L no es «nuevo» 1 a 1:** las 110 614 filas del espejo 2024 (`registro|KEY_VAL|product code`) se reemplazan por 361 369 oficiales (`registro|product code|nombre propietario`). Un consumidor que guardó ids de R&L de la pasada 10 no los va a encontrar.
- R&L oficial usa `owner_operator.firm_name` como fabricante; el espejo usaba el nombre del establecimiento. Cambia el fabricante de esas filas.
- `streamOpenFdaResults` decodifica cada trozo por separado (`chunk.toString('utf8')`): un carácter multibyte partido entre trozos se corrompería. Hoy no pasa: los JSON de openFDA son ASCII (0 líneas no ASCII en 510k, R&L y UDI 1–2; 0 U+FFFD en las salidas revisadas). No se tocó (fuera de alcance).
- El repo crece ~90 MB en `out/` (6 partes de GUDID y 3 de R&L, cada una < 13 MB).
- En `fda-rl`, 26 321 filas tienen en `extra.alsoIn` la misma vía oficial: el mismo registro + product code + nombre aparece en más de un listado y `mergeRows` (sin cambios) anota la otra copia.

## Decisiones y ambigüedades
- GUDID: una sola vía para no duplicar por UDI-DI. `build.mjs` ya prefería openFDA `device/udi` (export 2026-10-21, más nuevo que el Full Release 20261001); AccessGUDID queda bajado, probado y como respaldo. Confirmar con Justin.
- La tarea llegó como notificación automática. Justin confirmó después, en la sesión, abrir el PR con los gates marcados como no corridos.
