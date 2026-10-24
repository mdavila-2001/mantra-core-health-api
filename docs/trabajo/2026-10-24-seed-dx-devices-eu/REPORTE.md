# Reporte — Equipos de diagnóstico y sus marcas: registros de Europa

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `claude/adoring-curie-xdkt83` (desde `dev`) · PRs: https://github.com/mdavila-2001/mantra-core-health-api/pull/691 (→ `dev`) y https://github.com/mdavila-2001/mantra-core-health-api/pull/692 (→ `test`, rama `claude/adoring-curie-xdkt83-test`), sin mergear
- Peldaño de evidencia alcanzado: `TESTED` (tests dirigidos, typecheck y lint en verde; corrida
  real de `fetch-mirrors → build → load` pegada). La carga a base (`--apply`) no se ejecutó.
- Avance: 16 / 18 microtareas HECHO (88,9 %), 1 A MEDIAS (H2.S2.M3), 1 EN CURSO (H3).

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Discovery del modelo | `grep -rliE "gmdn\|emdn\|udi_di\|manufacturer" src/` | Solo `diagnostic_equipment` (instancia con `manufacturer`/`model` libres); sin catálogo |
| H1.S1.M2 | Salida conforme al formato común de `master` | test `makeDeviceRecord: aplica las reglas del formato común` | verde; README propio retirado para no pisar el de `master` |
| H2.S1.M1 | `probe.mjs` | `node …/eu/probe.mjs` | pasadas 1–3: 0/11 fuentes oficiales alcanzables (`out/probe/*.json`) |
| H2.S1.M2–M6 | Adaptadores Data Lake, EMDN, swissdamed, BD/RDM y alcance | tests dirigidos | verde |
| H2.S2.M1 | `fetch.mjs` | `node …/eu/fetch.mjs` | 11 huecos registrados (403 del proxy); nada rellenado |
| H2.S2.M2 | `build.mjs` | `node …/eu/build.mjs` | 716 equipos en `out/eudamed-udi-0001.ndjson.gz`, 8 453 EMDN en `out/emdn/`, 26 583 actores en `out/actors/`, `manifest.json` y `coverage.*` |
| H2.S3.M1 | `fetch-mirrors.mjs` | `node …/eu/fetch-mirrors.mjs` | 4 réplicas en su commit, sha256 anotados |
| H2.S3.M2–M4 | Adaptadores eudamed2firstbase, DLinRT y actores | tests `firstbase: …`, `DLinRT: …`, `actores: …` | verde |
| H2.S3.M5 | Alcance tipo por tipo fuera de W | build (`assertTypePrefixesExist`) + test `alcance: …` | 79 prefijos con motivo, todos existen en la EMDN V2 |
| H4 (gates) | typecheck, lint, tests | ver Evidencia | exit 0 / exit 0 / 27 de 27 |

## A medias
### H2.S2.M3 — `load.mjs`
- Qué anda: el dry-run planifica 8 453 conceptos EMDN y 67 601 propiedades; ids estables y
  propiedades probados (`plan de carga: …`).
- Qué no anda: `--apply` nunca se ejecutó contra una base (no hay base en el contenedor).
- Qué falta exactamente: una base con `terminology.*`; correr `--apply` dos veces y comprobar que
  la segunda inserta 0.
- Dónde quedó: `tools/terminology-import/diagnostic-devices/eu/load.mjs`.

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H3 (saturación) | EN CURSO | Las réplicas cubren solo una parte de EUDAMED. Saturar exige los hosts oficiales: `api.datalake.sante.service.ec.europa.eu`, `health.ec.europa.eu`, `webgate.ec.europa.eu`, `ec.europa.eu`, `www.dati.salute.gov.it`, `pard.mhra.gov.uk`, `swissdamed.ch` |
| BD/RDM | TODO | Ver el encabezado real del CSV y completar `it-bdrdm.columns.json` |
| swissdamed | BLOQUEADO | Confirmación de términos de Swissmedic para reutilizar datos de swissdamed |
| MHRA PARD, NANDO, BfArM, AEMPS, ANSM | BLOQUEADO | Sin descarga masiva documentada y hosts bloqueados |
| Catálogo de equipos en la base | BLOQUEADO | Tablas en `mantra-core-health-model` (propuesta en `docs/seed-research/diagnostic-devices-eu.md`) |

## Evidencia
Salidas completas en [`evidencia/`](./evidencia/).

```
$ node tools/terminology-import/diagnostic-devices/eu/fetch-mirrors.mjs
batirmedical-emdn: 1 archivos @ e0131762 (sha256 7972865360a3)
zdavatz-eudamed2firstbase: 22865 archivos @ 48f93836 (sha256 ebc22a2dc938)
dlinrt-eudamed-emdn-discovery: 1 archivos @ f096a477 (sha256 69d6e067a99d)
longtran-eudamed-manufacturers: 1 archivos @ 44ff9f90 (sha256 a4137691826e)

$ node tools/terminology-import/diagnostic-devices/eu/build.mjs
{ "actors": 26583, "devicesExported": 716, "devicesInScope": 716,
  "distinctManufacturers": 114, "distinctBrands": 391, "rejectedRows": 0,
  "emdnConcepts": 8453, "gaps": 12, "files": 1 }

$ node --test "tools/terminology-import/diagnostic-devices/eu/test/*.test.mjs"
# tests 27
# pass 27
# fail 0

$ NODE_OPTIONS=--max-old-space-size=8192 corepack yarn typecheck   → exit 0
$ NODE_OPTIONS=--max-old-space-size=8192 corepack yarn lint        → exit 0
```

## No cubierto
- Los adaptadores del Data Lake, el portal, swissdamed y la BD/RDM no se probaron contra una
  respuesta real (hosts bloqueados); los de las réplicas sí corrieron sobre los archivos reales.
- `readFirstSheet` (Excel oficial de la EMDN) no se probó con el archivo oficial: la EMDN salió
  del CSV de la réplica.

## Desvíos del plan
- Se agregó `lib/load-plan.mjs` para probar el plan de carga sin base.
- `master` publicó el formato común antes que esta sesión: se retiró el README propio y la salida
  se adaptó al suyo (pasada 2).
- Pasada 4 (no prevista): réplicas públicas en git como fuente mientras los hosts oficiales están
  bloqueados (subtarea H2.S3), y alcance fuera de W decidido tipo por tipo con la EMDN V2.

## Riesgos residuales
- Las réplicas son terceros: la EMDN de BatirMedical declara no ser oficial; `eudamed2firstbase`
  convierte a GS1 y tiene dos rellenos conocidos (referencia = GTIN, se descarta; clase I por
  defecto, se marca). Cuando se habilite la red, conviene contrastar contra EUDAMED.
- El Data Lake puede exigir clave de suscripción (`EUDAMED_SUBSCRIPTION_KEY`).
- `typecheck` necesita `NODE_OPTIONS=--max-old-space-size=8192` en este contenedor.

## Decisiones y ambigüedades
- Rama del arnés (`claude/adoring-curie-xdkt83`) en vez de `justin/seed-dx-devices-eu`; `master`
  la encuentra igual (busca ramas `claude/*`). Confirmar con Justin.
- NDJSON comprimido en git (orden posterior del propietario).
- Datos de swissdamed descartados por los términos de Swissmedic, aunque eran reales.
- Réplicas en git aceptadas solo con licencia leída, procedencia oficial comprobada y commit
  fijado; mapeos GMDN↔EMDN automáticos descartados.
