# Reporte — Equipos de diagnóstico de Europa: descarga oficial con la red abierta

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `claude/adoring-curie-xdkt83` (PR a `dev`) y su cherry-pick sobre `test` (PR a `test`)
- Peldaño de evidencia alcanzado: **VERIFIED** para la salida del importador (`out/`), generada desde las fuentes oficiales y verificada (conteos, datos personales, determinismo). La carga a la base (`load.mjs --apply`) **no se ejercitó**: solo dry-run. No llega a `REGRESSION_VERIFIED` porque el typecheck del repo está en rojo por un error ajeno (ver Pendiente).
- Avance: 13 / 14 microtareas HECHO (92,9 %) · 1 BLOQUEADO (H1.S2.M2, gates del repo).

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Contrato del Data Lake verificado con respuestas reales (espacio inicial en `NOMENCLATURE_CODE`, `nextLink` con `$after`) | curl (ver `evidencia/datalake-verificacion-en-vivo.txt`) | `{value,nextLink}`; sin espacio 0 filas, con espacio filas |
| H1.S1.M2 | Descarga de `/udi` por los 3 142 códigos EMDN en alcance, `/reference` y `/actors` | `node …/eu/fetch.mjs --only=EMDN,EUDAMED_DATALAKE,IT_BDRDM,IT_CND --concurrency=10` | 3 142/3 142 `_complete.json`, 0 huecos, `exit 0` |
| H1.S1.M3 | EMDN oficial v2026 reemplaza a la réplica | `node …/eu/build.mjs` | `emdnOrigin: official`, 8 516 conceptos |
| H1.S1.M4 | BD/RDM con columnas verificadas contra el CSV real y el diccionario v2.0 | `node --test …` + `build.mjs` | `2435599 filas leídas · 216848 en alcance`, 0 rechazadas |
| H1.S1.M5 | Términos leídos en vivo: EMDN (CC BY 4.0), IODL 2.0, swissdamed (prohíbe extracción automatizada), PARD (solo Crown Copyright) | lectura de las páginas oficiales | escrito en `SOURCES.md` y `lib/sources.mjs` |
| H1.S1.M6 | La deduplicación ya no colapsa UDI-DI distintos con el mismo modelo | test `dedupe: dos UDI-DI distintos…` | ok |
| H1.S1.M7 | Actores oficiales sin PRRC, correo ni teléfono | test + `grep` en `out/actors/` | 0 correos; la única coincidencia con «phone» es la razón social «vitaphone GmbH» |
| H1.S1.M8 | BD/RDM leída en streaming y bajada solo como ZIP CSV | `build.mjs` | 525 MB leídos sin agotar memoria |
| H1.S1.M9 | Un correo dentro de un campo descriptivo no se publica | test + `grep` sobre `out/` | 0 correos; 32 filas con `extra.redactedFields` |
| H1.S1.M10 | Build determinista, sin fechas inventadas | dos `build.mjs` + `sha256sum … \| diff` | «salida idéntica byte a byte» |
| H1.S2.M1 | Tests dirigidos | `node --test tools/terminology-import/diagnostic-devices/eu/test/*.test.mjs` | `# tests 37 · # pass 37 · # fail 0` |
| H1.S2.M3 | Documentación: `SOURCES.md`, investigación (pasadas 7 y 8), este reporte | archivos en disco | escritos |
| H1.S2.M4 | PR a `dev` y a `test`, sin draft y sin mergear | MCP de GitHub | https://github.com/mdavila-2001/mantra-core-health-api/pull/724 (`dev`) · https://github.com/mdavila-2001/mantra-core-health-api/pull/725 (`test`) |

## A medias
ninguna

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H1.S2.M2 | BLOQUEADO | `yarn typecheck` sale con exit 2 por imports duplicados en `src/modules/insurance/insurance-patient-settlement.module.ts`, que ya están en `origin/dev` (9337e964). Esta rama no toca `src/`. Lo tiene que arreglar quien hizo ese cambio; sobre `dev`, `yarn lint` y prettier están en verde. Sobre la base `test` pasa al revés: typecheck exit 0 y `yarn lint` exit 1 por prettier en `src/modules/iam/…` y `src/modules/telemetry/…`, también ajenos. |

## Evidencia
Salidas literales en `evidencia/`:
- `fetch-oficial.txt`: corridas de `fetch.mjs`, carpetas completas y control de códigos múltiples.
- `build-load.txt`: `build.mjs` (`exit 0`), sha256 de dos corridas idénticas y `load.mjs` en dry-run.
- `pii-y-tests.txt`: controles de datos personales sobre `out/` y salida de `node --test`.
- `gates.txt`: typecheck (exit 2, errores ajenos), lint (exit 0) y prettier.

Recorte de `build-load.txt`:
```
[it-salute-bdrdm] 2435599 filas leídas · 216848 en alcance
{ "actors": 32753, "devicesExported": 503648, "devicesInScope": 503648,
  "distinctManufacturers": 11414, "distinctBrands": 267471, "rejectedRows": 0,
  "emdnConcepts": 8516, "gaps": 0, "files": 3 }
salida idéntica byte a byte
{ "mode": "DRY-RUN", "emdnConcepts": 8516, "emdnVersions": ["v2026;sha256:a973dcdd8ae2"],
  "emdnProperties": 68105, "devicesNotLoaded": 503648, … }
```
(`gaps: 0` son los huecos de descarga; `out/manifest.json` lista 7 huecos de fuentes sin descarga automática.)

## No cubierto
- `load.mjs --apply` contra una base real (solo se corrió el dry-run).
- Que `master` consuma la salida nueva: el formato es el del README común, pero `master` no corrió acá.
- La CND italiana se descargó pero no se carga (la EMDN es la clasificación); su licencia no se leyó en vivo.
- El aviso legal propio de EUDAMED: es una aplicación JavaScript y no devuelve texto sin navegador; se usó el aviso general de la Comisión.

## Desvíos del plan
- Se agregaron H1.S1.M9 (correos en campos descriptivos) y H1.S1.M10 (build determinista). Ninguno estaba previsto: aparecieron al revisar la salida real.
- 21 páginas del caché no tenían URL ni fecha en el manifiesto porque venían de corridas cortadas. Se borraron esas 20 carpetas y se volvieron a pedir. `build.mjs` ahora salta como hueco cualquier carpeta sin metadatos, en vez de poner la fecha de ahora.

## Riesgos residuales
- Hay 248 tipos EMDN terminales en alcance sin ningún equipo en EUDAMED ni en la BD/RDM. Es lo que publican las fuentes, no un error de descarga.
- La BD/RDM no trae UDI-DI. Sus filas solo se deduplican contra EUDAMED por fabricante + modelo + marca exactos, así que el mismo producto puede aparecer en las dos fuentes con nombres de fabricante distintos.
- Las 32 filas con `redactedFields` quedan sin modelo: el fabricante no cargó uno en EUDAMED.

## Decisiones y ambigüedades
- Rama: el entorno obliga a usar `claude/adoring-curie-xdkt83`; los mensajes de otras sesiones pedían `justin/<tema>`. Supuesto tomado: se usa la rama del entorno. A confirmar con Justin.
- BD/RDM: modelo = `cod_catalogo_fabbr_ass` (identificador de catálogo del fabricante) y marca = `denominazione_commerciale`. El diccionario define esta última como «denominación asignada por el fabricante», que a veces incluye el modelo. A confirmar con `master`.
- BD/RDM: `status` y `riskClass` quedan en null porque la fuente no los publica. No se deducen de `data_fine_validita` ni de `data_fine_commercio`; esas fechas van en `extra`.
- Identificadores del fabricante en la BD/RDM: `it-cf:` solo para códigos fiscales de 11 dígitos (empresa) y `vat:` para la Partita IVA tal cual. El código fiscal de 16 caracteres es de una persona física y se descarta (minimización).
