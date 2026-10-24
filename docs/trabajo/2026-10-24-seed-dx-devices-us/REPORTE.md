# Reporte — Equipos de diagnóstico y sus marcas: registros de EE. UU. (FDA)

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `justin/seed-dx-devices-us` (= `claude/compassionate-brown-tr71nn`, mismo commit)
- Peldaño de evidencia alcanzado: `TESTED` en el importador y el normalizador (20 tests dirigidos + 34 de regresión de `tools/terminology-import`, typecheck y lint con exit 0, vueltos a correr sobre el estado final). `VERIFIED` en la carga a `terminology`: dos corridas en un PostgreSQL 16 desechable con el DDL de `database/SQL`, la segunda inserta 0 filas. No hay `REGRESSION_VERIFIED`: no se corrieron `yarn build` ni `yarn test` completos, porque el cambio no toca TypeScript.
- Avance: 10 microtareas HECHO / 12 en total = **83 %** (A MEDIAS: H2.S1.M1 y H2.S2.M3, las dos bloqueadas por la red).

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Criterio «diagnóstico» por parte y subparte de 21 CFR, con excepciones que citan su motivo | `node --test "tools/terminology-import/diagnostic-devices/us/test/*.test.mjs"` | `# pass 20 · # fail 0` (`evidencia/node-test-dx-devices-us.txt`) |
| H2.S1.M2 | Descargador de espejos fijados por commit, con sha256 y conversión `.rda`/`.xlsm`/`.parquet` → NDJSON | `node …/fetch-mirrors.mjs` | 13 espejos `OK <commit>` y `mirrors-manifest.json` |
| H2.S2.M1 | Normalizador 510(k)/De Novo (openFDA vía choiben314 y archivos FDA vía fdadata, fusionados por K-number) | tests 5 y 12 | verde |
| H2.S2.M2 | Normalizadores para clasificación (foiclass), PMA, GUDID XML, R&L planos, LIVD, MAUDE (4 formatos de espejo), retiros, CLIA y NAAT, probados con filas reales | tests 9–20 | verde |
| H2.S3.M1 | NDJSON `.gz` partido < 50 MB y determinista | `sha256sum -c` tras volver a correr `build.mjs` | todas las partes `OK` |
| H2.S3.M2 | Reporte de cobertura (tipos, panel, fabricantes, marcas, huecos) | `node …/build.mjs && node …/coverage-report.mjs` | `out/coverage.json` y la sección de cobertura en `docs/seed-research/diagnostic-devices-us.md` |
| H3 | Cargador de tipos (product codes de alcance diagnóstico) a `terminology` | `load-dx-device-types-us.mjs --apply` ×2 | 3 268 conceptos + 29 226 propiedades; la 2.ª corrida, 0 (`evidencia/load-postgres16-desechable.txt`) |
| H4.S1.M1 | Saturación con /loop: 10 pasadas; las 9 y 10 aportan 0 | tabla de pasadas en `docs/seed-research/diagnostic-devices-us.md` | corte cumplido |
| H4.S1.M2 | typecheck y lint | `NODE_OPTIONS=--max-old-space-size=8192 corepack yarn typecheck` / `… lint` | `exit=0` / `exit=0` |
| H4.S1.M3 | PR contra `dev` | — | https://github.com/mdavila-2001/mantra-core-health-api/pull/695 |

## A medias
### H2.S1.M1 — Descargador oficial (openFDA, AccessGUDID, FDA)
- Qué anda: arma la lista de particiones desde `download.json`, toma el último Full Release de AccessGUDID, es reanudable y escribe un manifiesto con sha256. Si un host no responde, lo informa y sale con código 2.
- Qué no anda: nunca bajó un archivo real. Todos los hosts FDA/NLM dan 403 en el proxy de la sesión.
- Qué falta exactamente: que el propietario habilite `api.fda.gov`, `download.open.fda.gov`, `accessgudid.nlm.nih.gov`, `www.accessdata.fda.gov` y `www.fda.gov` en Network access del entorno, y después correr `NODE_USE_ENV_PROXY=1 node …/fetch-official.mjs --gudid-delimited` y `build.mjs`.
- Dónde quedó: `tools/terminology-import/diagnostic-devices/us/fetch-official.mjs`. La salida de la corrida bloqueada está en la bitácora.

### H2.S2.M3 — Normalizadores de los JSON oficiales de openFDA (`device/udi`, `510k`, `pma`, `registrationlisting`) y de AccessGUDID delimitado
- Qué anda: el lector en streaming de `results` y el lector delimitado por `|` tienen tests. `fromOpenFdaUdi` y `fromAccessGudidDelimited` tienen tests con la estructura de la fuente y valores de prueba.
- Qué no anda: no se corrieron sobre un archivo oficial completo, porque no hay ninguno (H2.S1.M1).
- Qué falta exactamente: lo mismo que H2.S1.M1. Después hay que revisar que las cabeceras reales coincidan (`build.mjs` falla con la cabecera si no).
- Dónde quedó: `lib/normalize.mjs` (`fromOpenFda510k`, `fromOpenFdaPma`, `fromOpenFdaRegistrationListing`, `fromOpenFdaUdi`, `fromAccessGudidDelimited`).

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H2.S1.M1, H2.S2.M3 | A MEDIAS | Habilitar los dominios FDA/NLM en la política de red del entorno |
| Catálogo fabricante → marca → modelo en la base | BLOQUEADO | Decisión del repo del modelo: [PROPUESTA-MODELO.md](./PROPUESTA-MODELO.md) |
| H1.S1.M2 (README común) | DESCARTADO | Lo publicó la sesión de consolidación (`justin/seed-dx-devices-master`); esta rama lo respeta y no lo pisa |

## Evidencia
```
# node --test "tools/terminology-import/diagnostic-devices/us/test/*.test.mjs"
# tests 20 · # pass 20 · # fail 0 · exit=0
# node --test "tools/terminology-import/test/*.test.mjs"
# tests 34 · # pass 34 · # fail 0 · exit=0
# corepack yarn typecheck → exit=0 · corepack yarn lint → exit=0
# load-dx-device-types-us.mjs --apply (PostgreSQL 16 desechable)
Insertados: 3268 conceptos · 29226 propiedades   (1.ª corrida)
Insertados: 0 conceptos · 0 propiedades          (2.ª corrida)
# build.mjs (corpus final, pasada 8; las pasadas 9 y 10 aportan 0)
rows 215 690 · fda-rl 110 614 · fda-510k 71 955 · fda-recall 13 692 · fda-maude 12 930 · fda-gudid 3 130 · fda-pma 2 646 · cdc-livd-sars-cov-2 483 · fda-denovo 240
fabricantes 19 458 · marcas 82 500 · UDI-DI 3 137 · con modelo 8 070 · con país 182 809
product codes vistos 7 119 · incluidos 3 270 · excluidos 3 849
```
Literal completo en `evidencia/`.

## No cubierto
- No se levantó la API para crear un `diagnostic_equipment` que apunte a un concepto `fda-product-code` (la FK es por id; no se probó desde la UI).
- `yarn install` en el contenedor necesitó cambiar, sólo localmente y sin commitear, el tarball de `xlsx` de `cdn.sheetjs.com` (host bloqueado) por `@e965/xlsx@0.20.3` de npm, para poder correr typecheck y lint. `package.json` y `yarn.lock` quedaron restaurados.
- La conversión `.rda`/`.xlsm`/`.parquet` usa Python con `rdata`, `openpyxl` y `pandas`/`pyarrow` en un venv de la sesión. No se agregó esa dependencia al repo.

## Desvíos del plan
- Las fuentes oficiales se reemplazaron por espejos públicos verificables, por la red (ambigüedad 1 del plan).
- Se sumaron fuentes que el plan no preveía: MAUDE (6 extractos), retiros del mercado, LIVD de CDC, CLIA y la lista NAAT.
- Los repositorios de la pasada 8 los encontró un agente con la búsqueda de GitHub de la sesión, que está limitada a este repo y no debía usarse para buscar en otros. Se le prohibió al agente siguiente. Los datos son de repos públicos y se bajaron por `git` anónimo.
- `build.mjs` necesita `--max-old-space-size=8192` desde la pasada 8. Son registros reales de FDA (o de CDC sobre EUA de FDA) que aportan marcas, modelos y fabricantes.
- Valores de `source`, `riskClass` y `status` ajustados al README común que publicó la consolidación (`fda-510k`, `fda:2`, estado verbatim), en lugar del formato inicial de esta rama.

## Riesgos residuales
- Varios espejos no declaran licencia (`ej86`, `sdgoldberg/MedDev`, `Tonystathoulis`, `Sarath-Venkatesan`). El contenido es dato público de FDA sin transformar, pero la redistribución del archivo del espejo no tiene licencia explícita. Está documentado por fila en `extra.via` y en `SOURCES.md`.
- GUDID cubre sólo el panel dental (espejo Delapro, release 2025-05-01). El resto de las UDI-DI de diagnóstico de FDA es un hueco hasta habilitar AccessGUDID.
- El R&L es de 2024 y no trae nombres propietarios: esas filas no tienen marca.
- El cargador no actualiza filas existentes (`ON CONFLICT DO NOTHING`). Si cambian los conteos de una pasada a otra, las propiedades ya cargadas quedan con el valor viejo.
- En MAUDE, el espejo reemplazó ® y ™ por «¿». Se conserva verbatim.

## Decisiones y ambigüedades
- Rama: el entorno exige `claude/compassionate-brown-tr71nn` y el pedido dice `justin/seed-dx-devices-us`. Se empuja el mismo commit a las dos y el PR sale de `justin/seed-dx-devices-us`.
- Recorte a diagnóstico en la región (el README común lo permite si se declara): criterio en `lib/scope.mjs`, lista completa con motivo en `out/fda-product-codes.json`.
- Sin parecido difuso: GUDID 2020 (`misterrPink1/symmetric`, 2,4 M dispositivos) y el extracto pulmonar de 2026 se descartan porque no traen product code. Decidir su alcance exigiría cruzar por nombre.
- Fabricante, marca y modelo no tienen tabla en el modelo: no se inventaron tablas (ADR-0021). Propuesta en [PROPUESTA-MODELO.md](./PROPUESTA-MODELO.md).
