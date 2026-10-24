# Plan — Equipos de diagnóstico y sus marcas: registros de Europa (EUDAMED, MHRA, Swissmedic)

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` (solo `tools/` y `docs/`) · Predecesor: ninguno (sesión hermana de `-us`, `-row`, `-master`)
- Resultado observable: la sesión de consolidación (`-master`) lee de esta rama un NDJSON
  normalizado (formato común) con equipos de diagnóstico registrados en Europa, un archivo de
  fabricantes con su SRN y la EMDN completa; cada fila con fuente, id de origen, versión, URL y fecha.
- Kill-test: `node --test tools/terminology-import/diagnostic-devices/eu/test/` en rojo, o una fila
  del NDJSON sin `source`/`sourceRecordId`/`sourceUrl`/`retrievedAt`.

## Alcance
- IN: (formato común: lo escribe la sesión `master`; si no existiera, esta sesión lo propondría),
  `tools/terminology-import/diagnostic-devices/eu/**`, `docs/seed-research/diagnostic-devices-eu.md`,
  esta carpeta de trabajo.
- OUT: entidades, migraciones, DDL, `src/**` (ADR-0021), carpetas de las sesiones hermanas,
  `package.json`/`yarn.lock`.
- Ambigüedades registradas:
  1. Rama: el brief pide `justin/seed-dx-devices-eu`; el arnés de la sesión obliga a
     `claude/adoring-curie-xdkt83`. Supuesto: se trabaja y se publica el PR desde la rama del
     arnés, basada en `dev`. Confirmar con Justin si quiere renombrarla.
  2. Datos en git: el brief decía «crudos y NDJSON grandes fuera de git»; una orden posterior del
     propietario (mensaje de la sesión coordinadora) pide subir el NDJSON comprimido (`.gz`,
     partes < 50 MB) y dejar fuera solo los crudos enormes. Se aplica la orden posterior.
  3. Alcance «diagnóstico» fuera de la categoría W: se decide a nivel de tipo EMDN, no de grupo
     (el grupo Z12 mezcla exploración funcional con instrumental quirúrgico, verificado con un
     código real Z12130580). Hasta tener la EMDN descargada, solo W entra completa.

## H1 — Discovery y formato común
**CA:** Dado el repo en `dev`, cuando se busca dónde guardar tipo/fabricante/marca/modelo,
entonces queda escrito qué existe y qué falta, y el formato común está documentado.
**DoD:** `grep` de discovery pegado en el reporte; salida conforme al README común de `master`. **Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Discovery del modelo | Entidades y tablas citadas con ruta | `grep -rliE "gmdn\|emdn\|manufacturer" src/` | HECHO |
| H1.S1.M2 | Salida conforme al formato común de `master` | Filas validan las reglas del README común (no nulos, `srn:`, esquemas) | test `makeDeviceRecord: aplica las reglas del formato común` | HECHO |

## H2 — Pipeline EU (sondeo, descarga, normalización, carga)
**CA:** Dado el pipeline, cuando una fuente es alcanzable se descarga con manifiesto (URL, versión,
sha256) y se normaliza al formato común; cuando no, queda registrada como hueco con el motivo.
**DoD:** tests dirigidos en verde + `probe.mjs` y `build.mjs` corridos con salida pegada. **Estado:** A MEDIAS

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | `probe.mjs` | Escribe un JSON con el estado HTTP por host | `node …/eu/probe.mjs` → `out/probe/*.json` | HECHO |
| H2.S1.M2 | Adaptador EUDAMED Data Lake | Fila oficial de muestra → registro común válido | test `eudamed` | HECHO |
| H2.S1.M3 | Adaptador EMDN | Filas → jerarquía con padre y nivel | test `emdn` | HECHO |
| H2.S1.M4 | Adaptador swissdamed (dispositivos y actores) | Registro común válido | test `swissdamed` | HECHO |
| H2.S1.M5 | Adaptador BD/RDM Italia | Encabezados faltantes → error explícito | test `it-bdrdm` | HECHO |
| H2.S1.M6 | Alcance EMDN | W entra, resto solo por lista explícita | test `scope` | HECHO |
| H2.S2.M1 | `fetch.mjs` | Fuente bloqueada → hueco registrado, sin datos inventados | corrida pegada | HECHO |
| H2.S2.M2 | `build.mjs` | NDJSON `.gz` partido < 50 MB + cobertura | corrida pegada | A MEDIAS |
| H2.S2.M3 | `load.mjs` (dry-run por defecto) | EMDN → `terminology.*` idempotente, sin DDL | dry-run pegado | A MEDIAS |

## H3 — Saturación con /loop
**CA:** Dadas las pasadas, cuando dos seguidas aportan 0 filas nuevas con las fuentes alcanzables,
entonces se cierra; si las fuentes siguen bloqueadas, se cierra como BLOQUEADO, nunca como saturado.
**DoD:** bitácora de pasadas en `docs/seed-research/diagnostic-devices-eu.md`; push tras cada pasada. **Estado:** BLOQUEADO

## H4 — Cierre
**CA:** typecheck, lint y tests dirigidos en verde; PR contra `dev` sin mergear; REPORTE escrito.
**DoD:** `corepack yarn typecheck`, `corepack yarn lint`, `node --test …/eu/test/` con salida pegada. **Estado:** EN CURSO

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Política de red bloquea EUDAMED, EMDN, MHRA, swissdamed, Italia | Sin datos oficiales | Hueco documentado + hosts a habilitar; el pipeline queda listo para correr |
| Esquema de los archivos no visto (EMDN xlsx, CSV Italia) | Parser incorrecto | Detección de encabezados con falla explícita; nada se rellena por defecto |
| Sin tablas de fabricante/marca/modelo en el modelo | No se puede cargar el catálogo de equipos | Propuesta para `mantra-core-health-model`; se carga solo la EMDN |
