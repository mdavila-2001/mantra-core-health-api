# Reporte — Nombres en castellano de Wikidata para los diccionarios médicos (pasada 9)

- Fecha: 2026-10-24 · Plan: [PLAN.md](./PLAN.md) · Rama(s): `justin/dictionaries-wikidata-es` (PR #713 → `dev`)
- Peldaño de evidencia alcanzado: `VERIFIED` para la capa ES de Wikidata (importador corrido contra Wikidata
  real, carga `--apply` en Postgres 16 desechable con el DDL real, persistencia consultada, 2.ª corrida 0 filas).
  No `REGRESSION_VERIFIED`: no se corrió la suite completa del repo (sólo los tests de `dictionaries/`).
- Avance: 10 / 12 HECHO (83 %). 1 BLOQUEADO (DeCS) y 1 EN CURSO al escribir esto (commit/push/PR).

## Completado
| ID | Qué se logró | Comando | Resultado |
|---|---|---|---|
| H1.S1.M1 | Corpus restaurado | `pack-dictionaries-data.mjs --unpack` | `88 archivos verificados` |
| H1.S1.M2 | Importador ES de Wikidata corrido, las 7 propiedades | `NODE_USE_ENV_PROXY=1 import-wikidata-es-labels.mjs` | exit 0, 49 615 filas, sin timeouts |
| H1.S1.M3 | Muestra manual ítem ↔ código | `grep` en el ndjson + consulta a la base | UBERON:0000948 → «corazón» (Q1072); HGNC:1100 → BRCA1 (Q227339); NCBITaxon:1313 → *Streptococcus pneumoniae* / «Neumococo» (Q221179); CL:0000738 → «leucocito» (Q42395) |
| H1.S1.M7 | `corpusCode` corrige `CL_0000738` → `CL:0000738` | `node --test …` | antes `CL:CL_0000738` (0 casaban); después 217 conceptos CL en corpus |
| H1.S1.M8 | `--pack` ya no rompe `data/` tras `--unpack` | `pack-dictionaries-data.mjs --pack` | antes: ENOENT `dictionaries-sources/manifest.json` **después** de borrar `data/`; ahora exit 0, 90 archivos, `manifest.json` y los 88 `.gz` previos idénticos byte a byte |
| H1.S1.M4 | `wikidata-es-labels.{ndjson,meta.json}.gz` en `data/` | `--pack` y luego `--unpack` | `90 archivos verificados` |
| H1.S1.M5 | Dry-run del cargador | `load-dictionaries.mjs` | `"wikidataEsLabels": { "concepts": 47342, "designations": 56215 }` |
| H1.S1.M6 | Tests | `node --test "tools/terminology-import/dictionaries/test/*.test.mjs"` | 19/19 |
| H1.S2.M1 | `--apply` ×2 en Postgres 16 desechable | `load-dictionaries.mjs --apply` | 1.ª 46 s: wikidata-es 47 342 conceptos, 56 215 designaciones, 47 342 propiedades; 2.ª 26 s: 0 / 0 en todas las capas |
| H3.S1.M1 | Docs: pasada 9 en `medical-dictionaries.md`, `SOURCES.md`, este reporte | `git diff --stat` | ver commit |

## A medias
ninguna

## Pendiente
| ID | Estado | Qué lo destraba |
|---|---|---|
| H2.S1.M1 — DeCS | BLOQUEADO | `decs.bvsalud.org` y `api.bvsalud.org` cortan la conexión del lado del servidor (el proxy registra el túnel abierto y cerrado con 39 B recibidos); `bvsalud.org` responde 403 de su CDN (BunnyCDN); `api.bvsalud.org/decs/v2/` pide clave. No se leyó la descarga ni la licencia, así que **no se escribió `import-decs.mjs`**. Lo destraba: la descarga oficial de DeCS (o una clave de la API) y su texto de licencia. Confirmar con Justin. |
| H3.S1.M2 — commit, push, PR #713 | EN CURSO | se actualiza tras el push |

## Evidencia
Salidas literales en [`evidencia/`](./evidencia/).

```
$ for u in …; do curl -s -o /dev/null -w '%{http_code}' …; done   (16:31 UTC)
200 https://query.wikidata.org/sparql?query=ASK%7B%7D&format=json
429 https://www.wikidata.org/w/api.php?action=wbgetentities&ids=P1554…   (sin User-Agent; con UA da 200)
403 https://decs.bvsalud.org/
000 https://api.bvsalud.org/
```

Etiquetas inglesas de las propiedades (wbgetentities, con UA): P1554 «UBERON ID», P7963 «Cell Ontology ID»,
P1402 «Foundational Model of Anatomy ID», P354 «HGNC ID», P685 «NCBI taxonomy ID», P686 «Gene Ontology ID»,
P3986 «Sequence Ontology ID»: las 7 coinciden con `ID_PROPERTIES` y `assertEntityLabels` no abortó.

```
[wikidata-es] P1554 (UBERON ID): 2268 nombres ES
[wikidata-es] P7963 (Cell Ontology ID): 230 nombres ES
[wikidata-es] P1402 (Foundational Model of Anatomy ID): 2774 nombres ES
[wikidata-es] P354 (HGNC ID): 42426 nombres ES
[wikidata-es] P685 (NCBI taxonomy ID): 1007 nombres ES
[wikidata-es] P686 (Gene Ontology ID): 837 nombres ES
[wikidata-es] P3986 (Sequence Ontology ID): 73 nombres ES
real 3m22.601s
```

Coincidencia con el corpus (`evidencia/match-corpus.txt`) y conceptos cargados (`evidencia/db-por-sistema.txt`):

```
uberon filas 2268 códigos 2246 en corpus 2113      → cargados 2113
cl filas 230 códigos 229 en corpus 217             → cargados 217
fma filas 2774 códigos 2770 en corpus 2747         → cargados 2331 (FMA se carga parcial por política)
hgnc filas 42426 códigos 42388 en corpus 41605     → cargados 41605
ncbitaxon filas 1007 códigos 1006 en corpus 1006   → cargados 1006
gene-ontology filas 837 códigos 837 en corpus 812  → cargados 0 (GO es opt-in)
sequence-ontology filas 73 códigos 71 en corpus 70 → cargados 70
```

```
$ load-dictionaries.mjs --apply   (1.ª)  exit 0, 46 s
[load] {"source":"wikidata-es-labels","concepts":47342,"designations":56215,"properties":47342}
$ load-dictionaries.mjs --apply   (2.ª)  exit 0, 26 s
[load] {"source":"wikidata-es-labels","concepts":47342,"designations":0,"properties":0}
```

```
$ node --test "tools/terminology-import/dictionaries/test/*.test.mjs"
# tests 19
# pass 19
# fail 0
```

## No cubierto
- Las 812 etiquetas ES de GO no se cargaron: GO es opt-in; `--include go` no se corrió.
- Suite completa del repo (jest, typecheck, lint): no se corrió; el cambio toca sólo `tools/` y docs.
- La base desechable no tenía glosario ni CIE-10/Mondo: `disease-agents` resolvió 0 enfermedades (igual que en pasadas anteriores).
- No se revisó a mano la calidad de los 49 615 nombres (sólo la muestra de 4).

## Desvíos del plan
- Agregadas H1.S1.M7 (formato `CL_` de Wikidata) y H1.S1.M8 (`--pack` tras `--unpack` borraba `data/` y abortaba): las dos bloqueaban el pedido.
- Node 22 no usa `HTTPS_PROXY` en `fetch` sin `NODE_USE_ENV_PROXY=1` (primera corrida: `fetch failed`); documentado en el encabezado del importador.
- Para el cargador se instalaron dependencias con `corepack yarn install --immutable --mode=skip-build` (sin tocar el lockfile).
- La semilla de conceptos internos se hizo con un script fuera del repo (un source/code system/versión `seed-test-internal` y los 13 ids de `CONCEPT` + `RELATION_TYPE`), no arrancando la API.

## Riesgos residuales
- Son nombres de la comunidad de Wikidata, no traducciones oficiales: se cargan como sinónimos ES (nunca preferidos) con su ítem Q en `dictionary-es-labels`.
- UBERON es multiespecie y Wikidata a veces declara el id en el ítem humano (UBERON:0000948 → «corazón» y «corazón humano»).
- Wikidata trae basura puntual (`FMA:Radical Feminism`, `UBERON:nnn`): no se carga porque no casa con ningún concepto del corpus.
- HGNC domina (41 605 de 47 342) y en 37 041 de sus 42 426 filas la etiqueta ES es idéntica al símbolo del corpus: aportan poco castellano real (las designaciones duplican el símbolo como sinónimo ES).

## Decisiones y ambigüedades
- DeCS documentado como hueco: no hubo descarga ni licencia legibles (supuesto del pedido; confirmar con Justin si hay clave de `api.bvsalud.org`).
- Ningún dato clínico de pacientes (PHI) se manejó: sólo terminología pública.
