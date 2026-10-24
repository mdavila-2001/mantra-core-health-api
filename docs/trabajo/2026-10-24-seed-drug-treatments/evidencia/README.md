# Evidencia — tratamientos farmacológicos

| Archivo | Qué es |
|---|---|
| `typecheck.txt`, `lint.txt` | Salida de `corepack yarn typecheck` / `lint` (exit 0, con `NODE_OPTIONS=--max-old-space-size=8192`). |
| `medir-pasada-3.mjs` | Medición de la pasada 3 (`dhimmel/drugcentral` → pares nuevos por código). No carga nada. |
| `semilla-base-desechable.mjs` | Semilla mínima de la base Postgres desechable: concepto «estado activo» y 300 RxCUI + 300 ICD-10-CM tomados del propio NDJSON. |
| `enlace-base-desechable-SINTETICA.json` | `validate-links.mjs` contra esa base **sintética**: prueba el mecanismo de enlace, **no** mide cobertura real. |
