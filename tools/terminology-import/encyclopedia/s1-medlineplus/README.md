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
| 2 · Sección sin fuente = sección ausente | Un encabezado sin regla en `lib/kinds.mjs` no se fuerza a un `kind` cercano: va a `rejected.ndjson` (`unmapped-heading`). |
| 3 · Seis campos de procedencia | Toda sección sale con `source`, `sourceUrl`, `license`, `retrievedAt`, `sourceVersion`, `locator`. |
| 4/6 · Sin traducción automática | Solo castellano de la fuente. Los pies de imagen que Commons no da en castellano no se usan como texto alternativo. |
| 5 · Cero dosis | `lib/guards.mjs#doseCheck` rechaza la sección (no el término) ante cantidad+unidad, la palabra «dosis» o una frecuencia de administración de un producto. Una prueba revisa el resultado completo. |
| A.D.A.M. fuera | Cada página se descarga y se revisa; si nombra a A.D.A.M. el término no se publica. |
| 7 · Imágenes | Ver `lib/images.mjs`: lista blanca de licencias, solo hosts de la CSP, autor obligatorio, y MeSH ↔ título (`name-match`). |
| 8 · Sin CC BY-SA como texto | No se usa Wikipedia. Wikidata solo aporta el vínculo MeSH → imagen. |

## Piezas

```text
fetch-pages.mjs     baja y cachea la página pública de cada tema (1 petición/s, User-Agent propio)
build-articles.mjs  orquestador: articles.ndjson, rejected.ndjson, manifest.json,
                    pages-verification.ndjson, images-trace.ndjson
lib/config.mjs      rutas por defecto (todas redefinibles por variable de entorno)
lib/sections.mjs    troceo del HTML de la NLM en bloques literales
lib/kinds.mjs       catálogo cerrado de §12.3 y reglas encabezado → kind
lib/guards.mjs      dosis y A.D.A.M.
lib/pages.mjs       lectura de la página cacheada (verificación de literalidad)
lib/article.mjs     ensamblado del artículo (temas y guías)
lib/images.mjs      selección y validación de imágenes (Wikidata → Commons)
lib/contract.mjs    validador del contrato de §12.3: la corrida falla si un artículo lo rompe
lib/coverage.mjs    cifras de cobertura medidas sobre la salida
render-evidence.mjs tablas de COVERAGE.md (cuenta, no interpreta)
render-gaps.mjs     tablas de GAPS.md
test/               31 pruebas con fixtures reales y chicos (node --test)
```

## Correr

```bash
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
- `images[].licenseFamily` (`public-domain` · `cc0` · `cc-by` · `cc-by-sa`),
  `images[].captionLang` y `images[].wikidataId`.
- `images[].kind` es `image` (ráster) o `diagram` (SVG). **No** se afirma «foto»:
  Commons no dice si un JPG es fotografía o dibujo.
- `images[].licenseUrl` es `null` en dominio público (no hay licencia que enlazar).

`rejected.ndjson` registra, con `scope` (`article` · `section` · `image`) y
`reason`, todo lo que no se publicó. No se descarta nada en silencio.
