# F9 · S2 — artículos de las enfermedades de la CIE-10-ES

Corte **S2** de la fase F9 de `tareas/TAREA-41` (§12): arma, **sin redactar nada**, el artículo
enciclopédico de las 11 586 enfermedades y categorías que el glosario trae de la CIE-10-ES
(`sanidad-cie10es-2026`). Cada `text` es una cadena literal de una fuente con su cita; un término sin
fuente queda **sin artículo**, y eso es un resultado válido.

> **No carga nada a ninguna base ni escribe en el VPS.** Produce `articles.ndjson` y `rejected.ndjson`
> para el cargador `COPY` de F1.3, que corre con aprobación del propietario.

## Uso

```bash
# 1. Descarga solo lo que este corte necesita (8 archivos, ~250 MB, sin MRCOC). Idempotente,
#    1 descarga a la vez, ≥1 s entre pedidos. Deja sources-manifest.json con sha256 y fecha.
node tools/terminology-import/encyclopedia/s2-cie10/fetch-sources.mjs --cache-dir <cache>

# 2. Artículos (≈3 min en línea la primera vez; con la caché llena, --offline no toca la red).
node --max-old-space-size=4096 tools/terminology-import/encyclopedia/s2-cie10/build-articles.mjs \
     --cache-dir <cache> --out-dir <salida> [--offline] [--hpo-license-ack] [--include-wikipedia-cited]

# 3. Verificación de 25 muestras contra la página/API viva de cada fuente (≈1 min).
node tools/terminology-import/encyclopedia/s2-cie10/check-samples.mjs \
     --articles <salida>/articles.ndjson --hpo-articles <salida-con-hpo>/articles.ndjson \
     --cache-dir <cache> --out SAMPLES.md

# 4. Pruebas (fixtures reales y chicos; sin red).
node --test tools/terminology-import/encyclopedia/s2-cie10/test/s2-cie10.test.mjs
```

Por defecto la caché y la salida van a `glossary-data-build/` (fuera de git, convención de los demás
importadores); se redefinen con `--cache-dir`/`--out-dir` o `S2_CACHE_DIR`/`S2_OUT_DIR`.

## Qué escribe `--out-dir`

| Archivo | Contenido |
|---|---|
| `articles.ndjson` | un artículo por término con contenido; contrato de §12.3 |
| `rejected.ndjson` | una fila por término sin artículo, sección o imagen descartada, con `reason` cerrado |
| `sources.json` | licencia, estado de verificación y fecha de cada fuente (para resolver `source` de `facts`) |
| `stats.json`, `COVERAGE.md` | cobertura medida (no estimada) |
| `identity-review.tsv` | ayuda de revisión humana: nombre del término vs. nombre en Orphanet. **No decide uniones** |

La salida es determinista: con la misma caché produce los mismos bytes (la prueba de extremo a extremo lo
comprueba).

## Reglas que aplica

1. **Identidad por código CIE-10 exacto que la fuente declara** (Orphanet «E» validada; MONDO
   `skos:exactMatch`). Nunca por etiqueta ni similitud. Un lado se usa solo si es inequívoco (un solo
   concepto declara el código y ese concepto no corresponde a otro término del glosario); si Orphanet y
   MONDO declaran enfermedades distintas, se descartan los dos.
2. **Sección sin fuente = sección ausente.** Seis campos de procedencia obligatorios; `kind` del catálogo
   cerrado de §12.3.
3. **Cero dosis** (`lib/guards.mjs`, conservadora: ante la duda se rechaza y se registra).
4. **Sin traducción automática**: texto en inglés queda `lang: "en"`; HPO usa solo su traducción OFICIAL.
5. **Imágenes**: Wikidata (P18) → Commons; solo dominio público, CC0, CC BY y CC BY-SA, solo
   `upload.wikimedia.org`/`thumb.wikimedia.org`/`cima.aemps.es`, con autor y página de origen. Un Q-id
   solo se usa si es el único que declara el código y no declara otro término.
6. **Retenciones a decisión del propietario** (`LICENSES.md`): síntomas de HPO sin `--hpo-license-ack`
   (la página primaria de la licencia HPO no se pudo leer) y definiciones de MONDO/DOID que citan a
   Wikipedia sin `--include-wikipedia-cited` (§12.2.8).

## Estructura

```text
fetch-sources.mjs   descarga + manifiesto
build-articles.mjs  canalización (buildAll)
check-samples.mjs   verificación de muestra contra la fuente viva
lib/                orphanet · mondo · doid · hpo · remote (MeSH/WDQS/Commons) · identity · wikidata
                    · article · guards · coverage · review · seed · config · cli
test/               s2-cie10.test.mjs + fixtures/ (recortes reales de las fuentes)
```
