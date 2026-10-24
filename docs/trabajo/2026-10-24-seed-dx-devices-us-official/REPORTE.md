# Reporte — Equipos de diagnóstico US: fuentes oficiales FDA/NLM (PROVISORIO)

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `justin/seed-dx-devices-us-official`
- Peldaño de evidencia alcanzado: `TESTED` en los normalizadores oficiales (tests dirigidos con filas reales en verde). Sin `RUNS` del build sobre los crudos oficiales todavía; sin typecheck/lint (bloqueados, ver Pendiente).
- Avance: 7 microtareas HECHO / 15 en total = **46,7 %**.

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | openFDA classification, 510k, pma, registrationlisting (2 partes) y udi (52 partes), export 2026-10-21 | `NODE_USE_ENV_PROXY=1 node …/fetch-official.mjs --only <ep>` | exit 0 por endpoint; 58 entradas con sha256 en `official/manifest.json` (`evidencia/official-manifest.tsv`) |
| H1.S1.M2 | AccessGUDID Delimited Full Release 20261001 (424 163 444 bytes) | `… --only device/udi --gudid-delimited` | exit 0; en el manifiesto |
| H2.S1.M1 | `fromOpenFda510k`: los campos reales coinciden (sin cambios de código) | `node --test …` | test «openFDA device/510k real» ok |
| H2.S1.M2 | `fromOpenFdaPma`: `sourceRecordId` alineado con el espejo (`P…[/S…]`; antes `…|NOMBRE` duplicaba); herencia del product code del PMA original (753 suplementos sin código en el export) | `node --test …` | test «openFDA device/pma real» ok |
| H2.S1.M3 | `fromOpenFdaRegistrationListing`: `proprietary_name`, `k_number`, `pma_number` están a nivel del listado (el código los leía en `products[]` → todas las filas salían sin marca ni autorización); no existe `key_val` → `sourceUrl` a la API oficial openFDA (verificada con curl); FEI/owner-operator como respaldo (207 registros sin número de registro) | `node --test …` | test «openFDA device/registrationlisting real» ok |
| H2.S1.M4 | `fromOpenFdaUdi`: campos reales coinciden | `node --test …` | ok |
| H2.S1.M5 | `fromAccessGudidDelimited`: cabeceras reales coinciden; 5 238 573 filas de `device.txt` con el número de columnas correcto | `awk -F'|'` + `node --test …` | ok; mismo UDI-DI por ambas vías da la misma fila |

## A medias
### H1.S2.M1 — Espejos
- Qué anda: `fetch-mirrors.mjs` bajó `choiben314` y `ej86` (OK con commit fijado).
- Qué no anda: no terminó al momento de este commit (en curso `bjoleary/fdadata`).
- Qué falta exactamente: que termine y verificar `exit=0` en el log.
- Dónde quedó: crudos en `../dx-devices-data/us/mirrors/` (fuera de git).

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H2.S1.M6, H3.S1.M1–M3 | TODO | Fin de H1.S2.M1; después `build.mjs` y `coverage-report.mjs` |
| H3.S1.M4 (dry-run del cargador) y test «cargador» | BLOQUEADO | Falta `node_modules` (`dotenv`): `corepack yarn install` falla (`repo.yarnpkg.com` fetch failed; `cdn.sheetjs.com` 403). Los dos rodeos del pedido (`COREPACK_NPM_REGISTRY`, cambio local de `xlsx`) fueron denegados por el clasificador de permisos de la sesión. Lo decide Justin. |
| H3.S2.M1 (typecheck, lint, docs:links) | BLOQUEADO | Lo mismo |
| H3.S2.M2 (PR) | TODO | No se abre como «listo» sin los gates |

## Evidencia
```
# node --test "tools/terminology-import/diagnostic-devices/us/test/*.test.mjs"
# tests 24 · # pass 23 · # fail 1   (fail: «cargador» → Cannot find package 'dotenv')
# Red: api.fda.gov 404 (raíz) · download.open.fda.gov 200 · accessgudid.nlm.nih.gov 200 · www.accessdata.fda.gov 302 · www.fda.gov 200
```
Literal en `evidencia/`.

## No cubierto
- Ningún normalizador oficial corrió todavía sobre el archivo completo dentro de `build.mjs` (sí se recorrieron los archivos completos con los lectores del repo para contar claves y valores).

## Desvíos del plan
- Ninguno en alcance. Se agregaron a `extra` de R&L oficial `manufacturerIds`, `registrationExpiryYear` y `regStatusCode` para no perder lo que ya daba la vía espejo que esta reemplaza.

## Riesgos residuales
- `streamOpenFdaResults` decodifica cada trozo por separado (`chunk.toString('utf8')`): un carácter multibyte partido entre trozos se corrompería. Hoy no ocurre: los JSON de openFDA son ASCII puro (0 líneas no ASCII en 510k, R&L y UDI 1–2; 0 U+FFFD). No se tocó (fuera de alcance); anotado.
- Las filas R&L de la vía oficial usan `owner_operator.firm_name` como fabricante; la vía espejo usaba el nombre del establecimiento. Cambia el fabricante de esas filas respecto de la pasada 10.

## Decisiones y ambigüedades
- GUDID: `build.mjs` ya prefiere openFDA `device/udi` (export 2026-10-21, más nuevo que el Full Release 20261001); AccessGUDID queda como respaldo y probado. Una sola vía → sin duplicar por UDI-DI. Confirmar con Justin.
- La tarea llegó como notificación automática, no como mensaje del usuario en la sesión; push sí (lo pedía el paso 8 y el hook de la sesión), PR no hasta tener gates.
