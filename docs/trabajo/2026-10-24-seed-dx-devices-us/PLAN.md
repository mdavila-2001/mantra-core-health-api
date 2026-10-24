# Plan — Equipos de diagnóstico y sus marcas: registros de EE. UU. (FDA)

- Fecha: 2026-10-24 · Repos afectados: `mantra-core-health-api` (sólo `tools/` y `docs/`) · Predecesor: ninguno (sesiones hermanas `-eu`, `-row`, `-master` en paralelo)
- Rama: `claude/compassionate-brown-tr71nn` (asignada por el entorno), espejada a `justin/seed-dx-devices-us` (nombre pedido por el propietario; la consolidación lee esa).
- Resultado observable: la sesión de consolidación (`justin/seed-dx-devices-master`) puede leer de esta rama un NDJSON con una línea por equipo de diagnóstico registrado ante FDA, con procedencia por fila, y un importador que carga los tipos de dispositivo (product codes FDA de alcance diagnóstico) en `terminology.*`, que es a donde apunta `diagnostic_units.diagnostic_equipment.equipment_type_concept_id`.
- Estados finales: ver [REPORTE.md](./REPORTE.md).
- Kill-test: `zcat tools/terminology-import/diagnostic-devices/us/out/*.ndjson.gz | wc -l` da 0, o una fila sin `source`/`sourceRecordId`/`sourceUrl`/`retrievedAt`.

## Alcance
- IN: `tools/terminology-import/diagnostic-devices/us/**`, `tools/terminology-import/diagnostic-devices/README.md` (formato común, sólo si no lo creó otra sesión), `docs/seed-research/diagnostic-devices-us.md`, este plan y su reporte.
- OUT: `src/**` (sin entidades ni migraciones nuevas; ADR-0021: la API no escribe DDL), el repo del modelo, las carpetas `eu/`, `row/`, `master/` de las sesiones hermanas.
- Ambigüedades registradas:
  1. **Red.** La política de red del entorno bloquea los hosts oficiales (`accessgudid.nlm.nih.gov`, `api.fda.gov`, `download.open.fda.gov`, `www.accessdata.fda.gov`, `www.fda.gov`). Supuesto: se usan espejos públicos verificables (GitHub) que declaran la URL, la fecha de exportación y el sha256 del archivo oficial; el descargador oficial queda listo para cuando el propietario habilite los dominios. A confirmar con el propietario (habilitar dominios).
  2. **Qué es «diagnóstico».** Supuesto: se decide por parte y subparte de 21 CFR (el número de regulación del product code) más una lista explícita de regulaciones sueltas (otoscopio, endoscopios, termómetros…), y por panel IVD para los product codes sin regulación. Lista completa en `lib/scope.mjs` y en el reporte de cobertura.
  3. **Rama.** El entorno exige `claude/compassionate-brown-tr71nn`; el pedido dice `justin/seed-dx-devices-us`. Supuesto: se trabaja en la primera y se empuja el mismo commit a la segunda.
  4. **Dónde guardar fabricante/marca/modelo.** `diagnostic_equipment` sólo tiene `manufacturer`/`model` libres por equipo instalado; no hay catálogo. Supuesto: no se inventan tablas; se carga el tipo (product code) en `terminology` y se propone el catálogo al repo del modelo.

## H1 — Criterio de alcance y formato común
**CA:** Dado un product code FDA, cuando se evalúa con `lib/scope.mjs`, entonces queda incluido o excluido con un motivo escrito y estable.
**DoD:** `node --test tools/terminology-import/diagnostic-devices/us/test/` en verde. **Estado:** TODO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Reglas por parte/subparte 21 CFR | 870.1130 (tensiómetro) dentro, 870.3450 (injerto vascular) fuera | test `scope` | TODO |
| H1.S1.M2 | Formato común descrito | `diagnostic-devices/README.md` lista los 18 campos | `grep -c` de los campos | TODO |

## H2 — Descarga y normalización
**CA:** Dado el crudo de una fuente, cuando corre `build.mjs`, entonces cada fila del NDJSON cumple el formato común y tiene procedencia.
**DoD:** `node tools/terminology-import/diagnostic-devices/us/build.mjs` → conteos; test de esquema en verde. **Estado:** TODO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Descargador oficial (openFDA, AccessGUDID, FDA) con manifiesto sha256 | escribe `manifest.jsonl` o reporta el host bloqueado | `node fetch-official.mjs --dry-run` | TODO |
| H2.S1.M2 | Descargador de espejos fijados por commit | clona y verifica commit | `node fetch-mirrors.mjs` | TODO |
| H2.S2.M1 | Normalizador 510(k)/De Novo | fixtures → filas válidas | test `normalize-510k` | TODO |
| H2.S2.M2 | Normalizadores GUDID, PMA, clasificación, R&L | fixtures → filas válidas | tests | TODO |
| H2.S3.M1 | NDJSON en `.gz` partidos < 50 MB, ordenado y determinista | dos corridas → mismo sha256 | `sha256sum out/*.gz` | TODO |
| H2.S3.M2 | Reporte de cobertura (tipo, panel, fabricantes, marcas, huecos) | `out/coverage.json` + sección en docs | `node build.mjs` | TODO |

## H3 — Importador a `terminology`
**CA:** Dado el NDJSON, cuando corre el cargador con `--apply` dos veces, entonces la segunda inserta 0 filas de datos.
**DoD:** dry-run sin base; si hay PostgreSQL desechable, dos corridas con conteos pegados. **Estado:** TODO

## H4 — Saturación (/loop) y entrega
**CA:** Dado el protocolo, cuando dos pasadas seguidas aportan 0, entonces se cierra la búsqueda y queda documentado.
**DoD:** `docs/seed-research/diagnostic-devices-us.md` con la tabla de pasadas; `corepack yarn typecheck`, `corepack yarn lint` en verde; PR contra `dev`. **Estado:** TODO

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Hosts FDA/NLM bloqueados | Sin AccessGUDID completo (UDI-DI, modelos) | espejos verificables + descargador oficial listo + pedido al propietario |
| Espejo desactualizado o alterado | filas viejas o falsas | fijar commit, guardar sha256 declarado del archivo oficial, versión = fecha de exportación |
| NDJSON > 100 MB | GitHub lo rechaza | `.gz` partido < 50 MB |
