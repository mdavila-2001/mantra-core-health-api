# Corte S4 — artículos de anatomía, signos y síntomas, especialidades, pruebas, laboratorio y tratamientos

Canalización de la fase **F9** del carril 41 (ficha `tareas/TAREA-41-…md`, §12). Produce
`articles.ndjson` y `rejected.ndjson` con el contrato de §12.3. **No carga nada a ninguna base.**

## Regla central

Se **ensambla**, no se redacta. El texto de una sección es literal de una fuente, con sus seis
campos de procedencia (`source`, `sourceUrl`, `license`, `retrievedAt`, `sourceVersion`,
`locator`). Sin fuente no hay sección. Cero dosis (guarda en `lib/contract.mjs`), cero
traducción automática (lo que solo está en inglés queda `lang: "en"`).

## Qué cubre

Filas de la semilla `mantra-core-health/public/glossary-seed/shards/<categoría>/page-N.json`
de las categorías `anatomy`, `signs-symptoms`, `specialty`, `lab`, `diagnostic-test`,
`treatment`, `procedure`, `imaging`, `care`, **menos** las de `codeSystem` `medlineplus-es` y
`medlineplus-es-lab` (las hace S1). No se crean términos: `conceptRef` = `codeSystem` + `code`
+ `slug` de la fila existente.

| Fuente | Qué aporta | Licencia |
|---|---|---|
| Wikidata | descripción, afirmaciones (partes, irrigación, inervación…), identificadores abiertos, archivo de imagen | CC0 |
| HPO (`hp.json`) | definición de signos y síntomas (inglés, literal) | HPO License (cita, versión, sin alterar) |
| MeSH (SPARQL de NLM) | nota de alcance (inglés, literal) | NLM T&C («Courtesy of the U.S. National Library of Medicine») |
| Wikimedia Commons | imagen, autor, licencia, descripción | `public domain`, CC0, CC BY, CC BY-SA |
| INLASA | **solo** código y nombre oficial (nunca el arancel) | Información pública del Estado |
| Semilla del glosario | relaciones inversas de Wikidata ya cargadas (enfermedades que declaran la propiedad) | CC0 |

Fuera a propósito: Wikipedia (CC BY-SA, decide el propietario), LOINC, SNOMED CT, ATC, DeCS.
Los textos curados internos (`source: alovida-curated`) **no tienen procedencia externa** y
van a `rejected.ndjson`.

## Uso

```bash
# Red (1 petición/s, caché en disco, reanudable). Una descarga a la vez.
node fetch-wikidata.mjs        # ~2 833 ítems + etiquetas de lo que referencian
node fetch-sources.mjs         # HPO (24 MB), MeSH (SPARQL) y Commons (imageinfo)

# Armado (sin red, determinista)
node build-articles.mjs        # → out/articles.ndjson, out/rejected.ndjson, out/stats.json

# Pruebas (fixtures reales y chicos)
node --test "test/*.test.mjs"
```

Rutas por entorno: `S4_EVIDENCE_DIR`, `S4_CACHE_DIR`, `S4_OUT_DIR`, `S4_SEED_DIR`,
`S4_RETRIEVED_AT`. Por defecto la caché y la salida viven en
`docs/progress/evidence/lane-41/F9/s4-anatomia/{cache,out}` del workspace (fuera de git).

## Garantías que fija el código

- **Idempotente:** la fecha de la corrida (`retrievedAt`) se fija una vez en
  `cache/retrieved-at.txt`; con la misma caché, `build-articles.mjs` produce el mismo NDJSON byte
  a byte (se comprobó reconstruyendo desde la caché en un directorio aparte: los sha256 de `articles`, `rejected` y `held` coinciden con los del corte).
- **Identidad:** HPO y MeSH solo se usan si Wikidata **declara** la equivalencia (P3841, P486) y
  además la etiqueta inglesa del ítem es la del término/descriptor o un sinónimo exacto; si no
  concuerda, la sección se rechaza (`hpo-etiqueta-no-concuerda`, `mesh-etiqueta-no-concuerda`).
- **Imágenes:** licencia por `LicenseShortName` de Commons (NC/ND/GFDL/«No restrictions» se
  rechazan), solo hosts `upload.wikimedia.org`, `thumb.wikimedia.org`, `cima.aemps.es`; CC BY y
  CC BY-SA exigen autor y URL de licencia. El `kind` sale de metadatos (propiedad de Wikidata,
  categorías y descripción de Commons, tipo MIME), no de mirar la imagen.
- **Una línea de `rejected.ndjson` por cada cosa descartada**, con `level` (`article`,
  `section`, `fact`, `image`) y `reason`.
