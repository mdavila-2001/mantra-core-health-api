# Reporte — Equipos de diagnóstico y sus marcas: registros de Europa

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `claude/adoring-curie-xdkt83` (desde `dev`) · PR: https://github.com/mdavila-2001/mantra-core-health-api/pull/691 (sin mergear)
- Peldaño de evidencia alcanzado: `TESTED` para el pipeline (tests dirigidos, typecheck y lint en
  verde, corrida real pegada). El corpus **no** se obtuvo: fuentes bloqueadas por la red del entorno.
- Avance: 10 / 13 microtareas HECHO (76,9 %), 2 A MEDIAS, 1 BLOQUEADO.

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Discovery del modelo | `grep -rliE "gmdn\|emdn\|udi_di\|manufacturer" src/` | Solo `diagnostic_equipment` (instancia con `manufacturer`/`model` libres); sin catálogo. Detalle en `docs/seed-research/diagnostic-devices-eu.md` |
| H1.S1.M2 | Salida conforme al formato común de `master` (manifest, claves de fuente, `srn:`, `extra`, clases con esquema) | test `makeDeviceRecord: aplica las reglas del formato común` | verde; README propio retirado para no pisar el de `master` |
| H2.S1.M1 | `probe.mjs` | `node …/eu/probe.mjs` | pasadas 1 y 2: `out/probe/probe-20261024T0311.json` y `probe-20261024T0330.json`, 0/11 alcanzables en ambas |
| H2.S1.M2 | Adaptador EUDAMED Data Lake | test `Data Lake: …` (3 casos) | verde |
| H2.S1.M3 | Adaptador EMDN | test `EMDN: …` (4 casos) | verde |
| H2.S1.M4 | Adaptador swissdamed | test `swissdamed: …` | verde (fuente desactivada por términos) |
| H2.S1.M5 | Adaptador BD/RDM | test `BD/RDM: …` | verde: sin mapeo verificado falla mostrando el encabezado real |
| H2.S1.M6 | Alcance EMDN | test `alcance: …` | verde |
| H2.S2.M1 | `fetch.mjs` | `node …/eu/fetch.mjs` | 0 archivos, 11 huecos registrados; nada rellenado |
| H4 (gates) | typecheck, lint, tests | ver Evidencia | exit 0 / exit 0 / 21 de 21 |

## A medias
### H2.S2.M2 — `build.mjs`
- Qué anda: corre de punta a punta, escribe `out/coverage.json` y `out/coverage.md` con huecos;
  la partición `.gz` < 50 MB, el orden determinista y el borrado de partes viejas están probados.
- Qué no anda: no hay NDJSON de equipos porque no hay crudos.
- Qué falta exactamente: habilitar los hosts y correr `fetch.mjs` + `build.mjs`.
- Dónde quedó: `tools/terminology-import/diagnostic-devices/eu/build.mjs`.

### H2.S2.M3 — `load.mjs`
- Qué anda: dry-run corre; ids estables y propiedades probados (`plan de carga: …`).
- Qué no anda: `--apply` nunca se ejecutó contra una base (no hay EMDN que cargar ni base en el
  contenedor).
- Qué falta exactamente: EMDN en `out/` y una base con `terminology.*`; correr `--apply` dos
  veces y comprobar que la segunda inserta 0.
- Dónde quedó: `tools/terminology-import/diagnostic-devices/eu/load.mjs`.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H3 (saturación) | BLOQUEADO | Política de red del entorno: habilitar `api.datalake.sante.service.ec.europa.eu`, `health.ec.europa.eu`, `webgate.ec.europa.eu`, `ec.europa.eu`, `www.dati.salute.gov.it`, `pard.mhra.gov.uk`, `swissdamed.ch`. Evidencia: `out/probe/*.json` |
| Alcance fuera de W | TODO | EMDN descargada → revisar `out/emdn-scope-review.md` y llenar `INCLUDED_TYPE_PREFIXES` |
| BD/RDM | TODO | Ver el encabezado real del CSV y completar `it-bdrdm.columns.json` |
| swissdamed | BLOQUEADO | Confirmación de términos de Swissmedic para reutilizar datos de swissdamed |
| Catálogo de equipos en la base | BLOQUEADO | Tablas en `mantra-core-health-model` (propuesta en `docs/seed-research/diagnostic-devices-eu.md`) |

## Evidencia
Salidas completas en [`evidencia/`](./evidencia/).

```
$ node tools/terminology-import/diagnostic-devices/eu/probe.mjs
EMDN               BLOQUEADO (política de red)
EUDAMED_DATALAKE   BLOQUEADO (política de red)
…
0/11 fuentes alcanzables; 11 bloqueadas por la política de red.

$ node --test "tools/terminology-import/diagnostic-devices/eu/test/*.test.mjs"
# tests 21
# pass 21
# fail 0

$ NODE_OPTIONS=--max-old-space-size=8192 corepack yarn typecheck
exit 0
$ NODE_OPTIONS=--max-old-space-size=8192 corepack yarn lint
exit 0
```

## No cubierto
- Ningún adaptador se probó contra una respuesta real de su fuente: los contratos salen de la
  documentación citada en `SOURCES.md`; los tests usan datos sintéticos con esa forma.
- `readFirstSheet` (lectura del Excel de la EMDN) no se probó con un archivo real.

## Desvíos del plan
- Se agregó `lib/load-plan.mjs` para poder probar el plan de carga sin base.
- La sesión `master` publicó el formato común antes que esta: se retiró el README propio y la salida se adaptó al suyo (pasada 2). Las categorías EMDN en revisión ahora se exportan marcadas en `extra.dxScope` para que `master` decida.

## Riesgos residuales
- Cuando se habilite la red, el formato real del Excel de la EMDN o del CSV italiano puede diferir:
  los parsers fallan con los encabezados reales a la vista, no cargan datos dudosos.
- El Data Lake puede exigir clave de suscripción (`EUDAMED_SUBSCRIPTION_KEY`): un cliente
  reporta 200 sin clave y otro documenta la clave.
- `typecheck` necesita `NODE_OPTIONS=--max-old-space-size=8192` en este contenedor (OOM con el
  límite por defecto); no es un cambio de este trabajo.

## Decisiones y ambigüedades
- Rama del arnés (`claude/adoring-curie-xdkt83`) en vez de `justin/seed-dx-devices-eu`; confirmar
  con Justin.
- NDJSON comprimido en git (orden posterior del propietario) en vez de fuera de git.
- Datos de swissdamed descartados por las condiciones de Swissmedic, aunque eran reales.
- Alcance fuera de W vacío hasta tener la EMDN: decidir tipos de memoria sería inventar.
