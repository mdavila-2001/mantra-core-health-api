# Equipos de diagnóstico — región `us/` (FDA)

Descarga, normaliza y publica los equipos de diagnóstico registrados ante FDA en el formato
común de `../README.md` (lo define la sesión de consolidación, rama
`justin/seed-dx-devices-master`). Fuentes y licencias: [`SOURCES.md`](SOURCES.md). Bitácora de
pasadas y cobertura: `docs/seed-research/diagnostic-devices-us.md`.

```
fetch-official.mjs    baja openFDA (udi, 510k, pma, classification, registrationlisting) y AccessGUDID
fetch-mirrors.mjs     baja los espejos públicos fijados por commit (cuando el host oficial está bloqueado)
build.mjs             crudos → out/<source>-NNNN.ndjson.gz + fda-product-codes.json + coverage.json + manifest.json
load-dx-device-types-us.mjs   product codes de alcance diagnóstico → terminology.* (dry-run por defecto)
lib/scope.mjs         criterio «diagnóstico» por parte/subparte de 21 CFR y excepciones con motivo
lib/normalize.mjs     un normalizador por fuente
test/                 node --test
```

## Uso

```bash
# Crudos fuera de git (por defecto ../dx-devices-data/us, hermano del repo; redefinible)
export DX_DEVICES_US_RAW_DIR=…            # opcional
NODE_USE_ENV_PROXY=1 node tools/terminology-import/diagnostic-devices/us/fetch-official.mjs   # hosts FDA/NLM
node tools/terminology-import/diagnostic-devices/us/fetch-mirrors.mjs
node --max-old-space-size=8192 tools/terminology-import/diagnostic-devices/us/build.mjs   # ~3 min; con 2 GB de heap no alcanza
node --max-old-space-size=8192 tools/terminology-import/diagnostic-devices/us/load-dx-device-types-us.mjs [--apply]   # lee todo el NDJSON
node --test "tools/terminology-import/diagnostic-devices/us/test/*.test.mjs"
```

`build.mjs` usa cada fuente cuyo crudo exista y anota en `manifest.json → gaps` las que faltan.
Si un registro llega por la vía oficial y por un espejo, gana la oficial. Dos corridas sobre los
mismos crudos producen los mismos `.ndjson.gz` (byte a byte).

## Salida (`out/`, versionada)

| Archivo | Qué es |
|---|---|
| `fda-510k-NNNN.ndjson.gz`, `fda-denovo-…`, `fda-pma-…`, `fda-rl-…`, `fda-gudid-…` | Una línea por registro (formato común), partes < 50 MB |
| `fda-product-codes.json` | Todos los product codes vistos, con `include`, `rule` y `reason` |
| `coverage.json` | Registros por fuente, tipo, panel, clase, año; fabricantes y marcas distintos; huecos |
| `manifest.json` | El del README común (`region`, `files` con sha256, `gaps`) más entradas y espejos usados |

`extra` (opcional en el formato común) lleva `recordLevel` (`authorization`, `udi_di` o
`listing`), `panel`, `regulationNumber`, `scopeRule` y `via` (oficial o espejo, con repo, commit
y sha256 del archivo).
