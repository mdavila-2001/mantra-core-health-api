# Plan — Equipos de diagnóstico FDA: pasada 12 (export oficial de noviembre)

- Fecha: 2026-11-06 · Repos afectados: `mantra-core-health-api` (sólo `tools/terminology-import/diagnostic-devices/us/out/**` y `docs/`) · Predecesor: `2026-10-24-seed-dx-devices-us-official` (pasada 11, PR #709 y #712)
- Resultado observable: el NDJSON de la región US en `dev` refleja el export oficial de openFDA del 2026-11-02/03 en lugar del del 2026-10-21; la bitácora registra la pasada 12 con lo nuevo tras deduplicar.
- Kill-test: `node -e "…out/manifest.json → official[].exportDate"` sigue diciendo 2026-10-21.

## Alcance
- IN: volver a bajar openFDA (`device/udi`, `510k`, `pma`, `classification`, `registrationlisting`) con `fetch-official.mjs`, reconstruir con `build.mjs`, regenerar la cobertura, registrar la pasada 12.
- OUT: cambios de código de normalizadores o criterio de alcance (salvo que el export nuevo rompa algo, que se agrega como microtarea); AccessGUDID delimitado (openFDA `device/udi` es el mismo GUDID y tiene prioridad en `build.mjs`); espejos (se reusan los ya fijados por commit).
- Ambigüedades registradas: ninguna.

## H1 — Pasada 12
**CA:** Dado el export oficial de noviembre, cuando corre `build.mjs`, entonces `out/manifest.json` lo cita y la bitácora tiene la pasada 12 con su delta.
**DoD:** comandos de la tabla. **Estado:** A MEDIAS (ver REPORTE.md)

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Descarga oficial | 57 archivos con sha256 en el manifiesto oficial | `NODE_USE_ENV_PROXY=1 node …/fetch-official.mjs` → `exit=0` | HECHO |
| H1.S1.M2 | Reconstrucción | `deltaVsPrevious` calculado contra el `out/` de la pasada 11; partes < 50 MB | `node --max-old-space-size=8192 …/build.mjs` → `exit=0` | HECHO |
| H1.S1.M3 | Bitácora y cobertura | fila 12 en la tabla de pasadas | `node …/coverage-report.mjs` → `exit=0` | HECHO |
| H1.S1.M4 | Gates | tests dirigidos, typecheck, lint, `docs:links` y dry-run del cargador en verde | ver REPORTE | A MEDIAS |
| H1.S1.M5 | PR contra `dev` | PR listo (no draft), mergeable | estado leído de GitHub | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Disco (22 GB libres; el export pesa unos 2–3 GB) | build sin crudos | revisar `df` antes de construir |
| El export cambió algún campo | normalizador roto | tests con filas reales y comparar conteos por fuente con la pasada 11 |
