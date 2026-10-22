# F9 · Corte S1 — artículos enciclopédicos de MedlinePlus en español

Canalización que arma, **sin redactar nada**, el artículo de los términos del
glosario cuya fuente es MedlinePlus en español (NLM): 1 016 temas de salud
(`nlm-medlineplus-es`) y 302 guías de pruebas médicas (`nlm-medlineplus-es-pruebas`).
Especificación: `tareas/TAREA-41-red-de-conocimiento-y-auditoria-clinica.md`
§12 (en la raíz del workspace `Mantra Core Health/`, fuera de git).

> **No carga nada a ninguna base ni escribe en el VPS.** Produce archivos.

## Reglas que la canalización hace cumplir

| Regla (§12.2) | Cómo se cumple |
|---|---|
| 1 · Se ensambla, no se redacta | El texto de cada sección es un trozo del resumen de la NLM, cortado por sus propios `<h3>`. Hay una prueba que exige que sea subcadena de la fuente. |
| 2 · Sección sin fuente = sección ausente | Cada bloque de la NLM es UNA sección (nunca se fusionan). Un encabezado sin regla no se fuerza a un `kind` cercano: sale como `additional_information` con su pregunta exacta en `locator`. |
| 3 · Seis campos de procedencia | Toda sección sale con `source`, `sourceUrl`, `license`, `retrievedAt`, `sourceVersion`, `locator`. |
| 4/6 · Sin traducción automática | Solo castellano de la fuente. Los pies de imagen que Commons no da en castellano no se usan como texto alternativo. |
| 5 · Cero dosis | `lib/guards.mjs#redactDose` omite los PÁRRAFOS con cantidad+unidad, «dosis» o frecuencia de administración de un producto; la sección sale como extracto (`excerpt`, `omitted`). Si no queda ningún párrafo, se rechaza. Una prueba revisa el resultado completo. |
| A.D.A.M. fuera | Cada página se descarga y se revisa; si nombra a A.D.A.M. el término no se publica. |
| 7 · Imágenes | Ver `lib/images.mjs`: lista blanca de licencias, solo hosts de la CSP, autor obligatorio, y MeSH ↔ título (`name-match`). |
| 8 · Sin CC BY-SA como texto | No se usa Wikipedia. Wikidata solo aporta el vínculo MeSH → imagen. |

## Piezas

```text
fetch-xml.mjs       baja el XML de temas más reciente (una descarga) con su sidecar .meta.json
fetch-pages.mjs     baja y cachea la página pública de cada tema (1 petición/s, User-Agent propio)
build-articles.mjs  orquestador: articles.ndjson, rejected.ndjson, manifest.json,
                    pages-verification.ndjson, images-trace.ndjson
lib/config.mjs      rutas por defecto (todas redefinibles por variable de entorno)
lib/sections.mjs    troceo del HTML de la NLM en bloques literales
lib/kinds.mjs       catálogo de §12.3 (+ 11 kinds transversales) y reglas encabezado → kind
lib/guards.mjs      dosis y A.D.A.M.
lib/pages.mjs       lectura de la página cacheada (verificación de literalidad)
lib/article.mjs     ensamblado del artículo (temas y guías)
lib/images.mjs      selección y validación de imágenes (Wikidata → Commons)
lib/contract.mjs    validador del contrato de §12.3: la corrida falla si un artículo lo rompe
lib/coverage.mjs    cifras de cobertura medidas sobre la salida
render-evidence.mjs tablas de COVERAGE.md (cuenta, no interpreta)
render-gaps.mjs     tablas de GAPS.md
test/               39 pruebas con fixtures reales y chicos (node --test)
```

## Correr

```bash
# 0. XML de temas más reciente (una descarga de ~30 MB)
node tools/terminology-import/encyclopedia/s1-medlineplus/fetch-xml.mjs

# 1. páginas públicas de los temas (≈ 17–25 min; reanudable; caché en glossary-data-build/cache/encyclopedia-s1/)
node tools/terminology-import/encyclopedia/s1-medlineplus/fetch-pages.mjs

# 2. artículos. --fetch-commons consulta la API de Commons (1 petición/s) solo para lo que falte en caché
node tools/terminology-import/encyclopedia/s1-medlineplus/build-articles.mjs --fetch-commons

# 3. pruebas
node --test "tools/terminology-import/encyclopedia/s1-medlineplus/test/*.test.mjs"
```

Insumos (fuera de git, raíz del workspace): `glossary-data-build-catalogos/ndjson/medlineplus-es*.ndjson`,
`glossary-data-build/cache/medlineplus/` (XML del 2026-09-30 y guías), la semilla
`mantra-core-health/public/glossary-seed/shards/` y `wikidata-images.ndjson`.
Salida por defecto: `docs/progress/evidence/lane-41/F9/s1-medlineplus/output/`.

> Las pruebas de este corte no están enganchadas al script `test:terminology-import` del
> `package.json` (su glob es `tools/terminology-import/test/*.test.mjs`); correrlas con el
> comando de arriba o ampliar el glob en otra tarjeta.

Idempotente: con las mismas entradas y la misma caché, `articles.ndjson` sale
byte a byte igual (la fecha de consulta a Commons se guarda dentro de su caché).

## Contrato de salida

`articles.ndjson` sigue §12.3 de la ficha. Extensiones sobre el ejemplo de la
ficha, todas opcionales para el consumidor:

- `sections[].items` — las viñetas literales de la sección, cuando las hay.
- `sections[].excerpt` + `omitted[{reason, paragraphs}]` — la sección sale sin los párrafos con dosis (o sin los elementos de lista que apuntan a A.D.A.M.).
- `sections[].table` — la sección trae una tabla: una fila por línea, celdas unidas por « | ».
- Varias secciones pueden tener el mismo `kind` (se distinguen por `locator`); 11 `kind` transversales nuevos, registrados en la ficha §12.3.
- `images[].match` (`name-match` | `label-match`) y `images[].enabled`: **`label-match` sale apagada por defecto** (decisión del propietario, 2026-10-09); el front muestra solo `enabled === true`. Hasta 3 imágenes por término.
- `images[].licenseFamily` (`public-domain` · `cc0` · `cc-by` · `cc-by-sa`),
  `images[].captionLang` y `images[].wikidataId`.
- `images[].kind` es `image` (ráster) o `diagram` (SVG). **No** se afirma «foto»:
  Commons no dice si un JPG es fotografía o dibujo.
- `images[].licenseUrl` es `null` en dominio público (no hay licencia que enlazar).

`rejected.ndjson` registra, con `scope` (`article` · `section` · `image`) y
`reason`, todo lo que no se publicó. No se descarta nada en silencio.
