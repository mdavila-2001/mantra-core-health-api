# Reporte — Equipos de diagnóstico ROW: huecos con red completa

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `claude/inspiring-planck-xhpf4w`
- Peldaño de evidencia alcanzado: `VERIFIED` para el pipeline de datos: build real sobre los archivos oficiales completos, salida en `out/` validada por `check-out.mjs` (filas, sha256, tamaño). No es `REGRESSION_VERIFIED`: no se corrió `yarn test` (jest) ni `yarn build`, porque el cambio no toca `src/` ni ningún `.ts`.
- Avance: 18 / 20 microtareas HECHO (90 %). 2 BLOQUEADO (H2, Health Canada).

## Completado

| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1–M3 | ANVISA desde `dados.anvisa.gov.br`, con la marca IVD de las peticiones | `check-out.mjs` | OK (ver Evidencia) |
| H3.S1.M1–M2 | TFDA licencias (93 430) y TUDID (688 258) | `node --test …/row/test/*.test.mjs` | 24 pass |
| H4.S1.M1 | Maestro JMDN en `pmda-approvals` y `out/nomenclature-jmdn.json.gz` | idem | pass |
| H5.S1.M1 | INVIMA (71 434) | idem | pass |
| H5.S1.M2 | OMS PQ IVD (435) | idem | pass |
| H5.S1.M3 | Huecos revisados uno por uno, motivo al día en `manifest.gaps` (14) | `node -e "…manifest.gaps…"` | 14 huecos con motivo observado el 2026-10-24 |
| H5.S1.M4 | HSA Singapur: SMDR (20 857) y clase A (1 127 525) | `node --test` | pass |
| H5.S1.M5 | NMPA China UDID: 6 294 994 UDI-DI, MD5 del portal verificado | `fetch-official.mjs --only nmpa-udi` + build | `md5: ED0CD3AFA9E6BC687322710381626497` |
| H5.S1.M6 | CDSCO oficial (180 124), reemplaza al espejo (25 792) | build + revisión de correos | ver Evidencia |
| H5.S1.M7 | SAHPRA kits COVID-19 (283) | `node --test` | pass |
| H5.S1.M8 | MDA Malasia: hueco con motivo (listado sin fabricante) | `manifest.gaps` | `mda-mdar` |
| H6.S1.M1 | `typecheck` y `lint` | `corepack yarn typecheck` / `lint` | exit 0 (con `NODE_OPTIONS=--max-old-space-size=8192`, ver Riesgos) |
| H6.S1.M2 | `COVERAGE.md`, `SOURCES.md`, registro de pasadas | `coverage.mjs` | 14 239 561 filas |
| H6.S1.M3 | PR contra `dev`, listo para revisión, sin mergear | `create_pull_request` | [mdavila-2001/mantra-core-health-api#821](https://github.com/mdavila-2001/mantra-core-health-api/pull/821) |
| H6.S1.M4 | Este reporte | `ls` | existe |

## A medias

ninguna

## Pendiente

| ID | Estado | Qué lo destraba |
|---|---|---|
| H2.S1.M1 | BLOQUEADO | La API de MDALL (`health-products.canada.ca/api/medical-devices/…`) responde 503 en todos los endpoints, también a las 18:30 UTC del 2026-10-24. Reintentar; el normalizador ya existe (`lib/hc-mdall.mjs`). |
| H2.S1.M2 | BLOQUEADO | idem; mientras tanto `hc-mdall` sigue saliendo del espejo de 2020-02-07. |

## Evidencia

Archivos completos en [evidencia/](./evidencia/typecheck.txt) (`typecheck.txt`, `lint.txt`, `row-tests.txt`, `check-out.txt`, `yarn-install.txt`).

```
$ node --test "tools/terminology-import/diagnostic-devices/row/test/*.test.mjs"
# tests 24
# pass 24
# fail 0

$ node --max-old-space-size=8192 tools/terminology-import/diagnostic-devices/row/check-out.mjs
OK: 14239561 filas en 26 archivos, 0 errores

$ NODE_OPTIONS=--max-old-space-size=8192 corepack yarn typecheck   → exit 0
$ NODE_OPTIONS=--max-old-space-size=8192 corepack yarn lint        → exit 0

$ build --only nmpa-udi
nmpa-udi: {"xmlParts":1259,"declaredRecords":6293777,"inputDevices":6295000,
"rows":6294994,"withoutDi":0,"withoutRegistrant":6,"duplicates":0} (760.1 s)

$ build --only cdsco-approved-devices,sahpra-covid-ivd
cdsco-approved-devices: {"rows":180124,"inputRecords":182122,"duplicates":1998,
"badLicence":0,"withoutManufacturer":0}
sahpra-covid-ivd: {"lists":{"antigen-self-test":10,"antigen-professional":85,
"molecular":132,"serological":56},"rows":283}
```

Revisión de datos personales en la salida de CDSCO (después de quitar correos
dentro de las direcciones): las únicas coincidencias de «Telephone» en
direcciones son el nombre de una calle («Telephone Exchange», 23 filas) y un
número gratuito de empresa (2 filas). NMPA: 0 filas con etiquetas de
`contactList`.

`corepack yarn docs:links` sale 1 por 3 enlaces a carpetas `./evidencia/` en
reportes de otras tareas que llegaron con `dev`; el enlace roto de este plan
(predecesor inexistente) se corrigió.

## No cubierto

- `yarn test` (jest), `yarn build`, `yarn docs:validate` y `yarn docs:build`
  no se corrieron: el cambio no toca `src/`, `.ts` ni la navegación de MkDocs, y
  `mkdocs` no está instalado en el contenedor.
- NMPA: las actualizaciones diarias, semanales y mensuales posteriores al
  2026-10-01 no se aplican (solo el release completo).
- Las licencias y términos de uso de NMPA, CDSCO y SAHPRA quedan **por
  verificar** en `SOURCES.md`.

## Desvíos del plan

- Se agregaron H5.S1.M4–M8 (HSA, NMPA, CDSCO, SAHPRA, MDA): aparecieron al
  recorrer los huecos con la red completa.
- `cdsco-import-licences` (espejo) se reemplaza por `cdsco-approved-devices`
  (oficial) con **otro** `source`: el oficial incluye fabricación y no solo
  importación. `master/` tiene que leer el nombre nuevo.
- `lib/cdsco.mjs` (`cdscoRows`) queda sin uso en el build pero con su test, que
  no se borra; su tabla de países la usa el normalizador oficial.

## Riesgos residuales

- `out/` pasa a ~711 MB (NMPA suma ~287 MB en 7 partes de < 47 MB).
- `tsc` y `eslint` se quedan sin memoria con el heap por defecto (2 GB) en este
  contenedor; con 8 GB salen 0. El cambio no agrega `.ts`, así que no lo causa.
- El enlace de descarga del release de NMPA está firmado y cambia cada mes:
  `sources.mjs` fija el del release 2026-10-01.
- En CDSCO un teléfono tecleado a mano dentro de una dirección queda verbatim.

## Decisiones y ambigüedades

- Sin recorte «diagnóstico»: como en el resto de `row/`, `out/` lleva todos los
  dispositivos y cada fuente aporta su marca IVD propia (`extra.qxlb` en NMPA,
  `extra.cdscoCategory` en CDSCO). Confirmar con la sesión master.
- NMPA: clase y país del fabricante quedan en null (no se deducen del número de
  registro); `tyshxydm` no se usa como id del fabricante (en importaciones es el
  de una empresa china).
- CDSCO fabricación: país `IN` solo si la dirección trae el «Pincode» de seis
  dígitos. Supuesto a confirmar con master.
- La diferencia entre registros declarados (6 293 777) y presentes (6 295 000)
  en el release de NMPA se anota en `manifest.stats`, sin corregir.
