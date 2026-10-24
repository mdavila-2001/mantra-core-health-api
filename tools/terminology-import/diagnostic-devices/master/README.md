# Equipos de diagnóstico · consolidación mundial (`master/`)

Une las salidas de las regiones hermanas (`us/`, `eu/`, `row/`, formato común
en [`../README.md`](../README.md)) y las fuentes propias de esta carpeta en un
catálogo único **tipo de equipo → fabricante → marca → modelo**, con todos los
registros de cada modelo en el mundo. Fuentes, versiones, hashes, licencias y
huecos en [`SOURCES.md`](SOURCES.md); pasadas de saturación, criterios y la
propuesta para el repo del modelo en
[`docs/seed-research/diagnostic-devices-master.md`](../../../../docs/seed-research/diagnostic-devices-master.md).

Sin DDL (ADR-0021). La taxonomía entra en las tablas existentes de
`terminology.*`; fabricantes, marcas y modelos quedan en `out/` hasta que el
modelo tenga dónde guardarlos.

## Etapas

| Etapa | Script | Red | Qué hace |
|---|---|---|---|
| 0 | `fetch-sources.mjs` | sí (git) | Baja los archivos fijados en `lib/sources.mjs` (repo + commit + sha256) a `<GLOSSARY_BUILD_DIR>/diagnostic-devices-master/cache/`. Rechaza un archivo cuyo hash no coincide. |
| — | `git fetch origin` | sí (git) | Trae las ramas de las regiones. `build.mjs` las lee con `git show`, sin checkout. |
| 1 | `build.mjs` | no | Taxonomía + filas propias + filas de las regiones → `out/` (NDJSON gzip < 50 MB por archivo), `out/coverage.{json,md}`, `out/manifest.json`. |
| 2 | `load-taxonomy.mjs` | no (base) | `out/taxonomy-*` → `terminology.*`. `--dry-run` no toca la base. Idempotente. |
| — | `node --test "tools/terminology-import/diagnostic-devices/master/test/*.test.mjs"` | no | Tests con recortes reales (`test/fixtures/`). |

```sh
node tools/terminology-import/diagnostic-devices/master/fetch-sources.mjs
git fetch origin
node --max-old-space-size=8000 tools/terminology-import/diagnostic-devices/master/build.mjs
node tools/terminology-import/diagnostic-devices/master/load-taxonomy.mjs --dry-run
node tools/terminology-import/diagnostic-devices/master/load-taxonomy.mjs   # .env DB_*; la API tiene que haber sembrado terminology
```

Opciones de `build.mjs`: `--us-dir <carpeta>` / `--eu-dir` / `--row-dir` leen
una carpeta `out/` local en vez de git; `--skip-regions` usa solo las fuentes
propias.

## Cómo encuentra cada región

`lib/regions.mjs` busca `tools/terminology-import/diagnostic-devices/<región>/out/manifest.json`
en `origin/justin/seed-dx-devices-<región>`; si esa rama no existe, en
cualquier rama remota (las sesiones en la nube a veces empujan a
`claude/<nombre>`), y se queda con la de commit más reciente. Verifica el
sha256 de cada archivo contra el manifest: un archivo que no coincide se
descarta y queda en el reporte. Una región sin salida queda **pendiente** en
`out/coverage.md`; el script ya está listo para consolidarla en cuanto empuje.

## Qué sale en `out/`

| Archivo | Una línea es |
|---|---|
| `taxonomy-nodes.ndjson.gz` | Un tipo de dispositivo: `system`, `code`, `name` y `definition` verbatim de la fuente; `diagnostic` (`true`/`false`/`null`), `branch` (`ivd`, `diagnostic`, `monitoring`), `basis` (el criterio publicado que decidió) y `provenance`. |
| `taxonomy-crosswalks.ndjson.gz` | Un mapeo publicado entre nomenclaturas: misma fila de un registro que declara dos tipos (GUDID: product code + GMDN). Con cuántos registros lo declaran y ejemplos. |
| `manufacturers.ndjson.gz` | Un fabricante resuelto: nombre más usado, todas las razones sociales verbatim, ids publicados, países, cada fusión con su regla y su evidencia, grupos publicados, tipos, marcas y jurisdicciones. |
| `models.ndjson.gz` | Un modelo: fabricante, marca y modelo (con sus variantes verbatim), UDI-DI, tipos y **todos sus registros** (fuente, id, URL, versión, fecha de descarga, jurisdicción, autorización, clase, estado). |
| `review-manufacturers.ndjson.gz` | Fusiones que no se hicieron por dudosas: mismo nombre en otro país, ids únicos en conflicto, posible grupo por primera palabra. |
| `coverage.json` / `coverage.md` | Reporte de cobertura (lo genera `build.mjs`; no se edita a mano). |

## Criterio de «diagnóstico»

Solo criterios publicados, nunca palabras clave del nombre:

1. **FDA**: subpartes del 21 CFR tituladas «Diagnostic Devices» o
   «Monitoring Devices», y las partes IVD 862, 864 y 866 (21 CFR 809.3), salvo
   las subpartes J y K de la 864 (establecimientos de sangre y HCT/P). Tabla de
   rangos con la URL de cada subparte en `lib/cfr.mjs`.
2. **FDA sin regulación** (no clasificados, PMA, De Novo sin sección): el panel
   de revisión, solo si en el mismo archivo **todos** los códigos con
   regulación de ese panel caen en 862/864/866 (hoy IM, MG, PA y TX).
3. **EMDN**: categoría W («In vitro diagnostic medical devices»). La Z
   («Medical equipment…») mezcla diagnóstico y terapia en sus grupos Z11 y Z12:
   queda sin decisión salvo por mapeo publicado.
4. **GMDN y nacionales**: solo por mapeo publicado, y solo si todos los
   destinos coinciden.

Lo que no se puede decidir (`diagnostic: null`) queda en la taxonomía y en el
reporte, fuera del catálogo, para revisión.
