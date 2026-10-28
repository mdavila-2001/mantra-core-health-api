# interop-vocab — vocabularios de interoperabilidad abiertos

Carga a `terminology.*` los code systems, value sets y equivalencias de interoperabilidad que publican fuentes
**abiertas con licencia leída** (ver [SOURCES.md](./SOURCES.md)): HL7 Terminology (THO) y FHIR core R4/R4B/R5 más tres IG
oficiales de HL7, UCUM, CVX/MVX del CDC (con las marcas comerciales), el registro de subtags de IANA (identificadores de
ISO 639, ISO 15924, ISO 3166-1 y UN M.49), CLDR (códigos y nombres en inglés y español de territorios, idiomas, escrituras
y monedas ISO 4217) y Wikidata (códigos ISO 3166-2). **Nada se inventa, redacta ni traduce**: todo es verbatim de la
fuente, con procedencia por fila (fuente, versión, URL, fecha, SHA-256 y licencia). El texto de las normas ISO no se carga.

Hueco de cobertura, estado hoy y conteos antes/después: [docs/seed-research/interop-vocab.md](../../../docs/seed-research/interop-vocab.md).

## Etapas

```bash
export GLOSSARY_BUILD_DIR=<carpeta de trabajo, fuera de git>          # crudos en $GLOSSARY_BUILD_DIR/raw/
node --max-old-space-size=2000 tools/terminology-import/interop-vocab/fetch-sources.mjs      # 0  · paquetes, archivos y licencias (≤ 2 pedidos/s por host, reanudable)
node --max-old-space-size=2000 tools/terminology-import/interop-vocab/fetch-wikidata.mjs     # 0b · ISO 3166-2 desde Wikidata (≈ 1 pedido/s)
node --max-old-space-size=2000 tools/terminology-import/interop-vocab/build-interop-vocab.mjs --clean   # 1  · raw/ → data/ (gzip determinista) y borra los crudos
DB_HOST=127.0.0.1 DB_PORT=… DB_USER=… DB_NAME=… \
  node --max-old-space-size=2500 tools/terminology-import/interop-vocab/load-interop-vocab.mjs           # 2  · data/ → terminology.*
node --test "tools/terminology-import/interop-vocab/test/*.test.mjs"                          # pruebas con recortes reales
```

`load-interop-vocab.mjs` apunta por defecto a `localhost:5433/mantra_redesa_health`: **pasá siempre `DB_*` explícito**.
`--dry-run` muestra el plan sin tocar ninguna base. Es idempotente (ids `md5` deterministas + `ON CONFLICT DO NOTHING`):
la segunda corrida inserta 0 filas. No escribe DDL ni actualiza filas existentes.

Para una base **desechable** (nunca la del stack real): aplicá `database/SQL/00_shared` y `03_terminology/01..04`,
corré `seed-disposable-db.mjs` (siembra los 16 conceptos internos que en el producto siembra la API) y después el cargador.
`verify-load.sql` pega las consultas de integridad (huérfanos, duplicados, nulos, procedencia).

## Qué hay en `data/`

| Archivo | Contenido |
|---|---|
| `interop-vocab-codesystems.ndjson.gz` | una línea por (code system, versión): URL canónica, OID, metadatos del recurso, procedencia |
| `interop-vocab-concepts.part-NN.ndjson.gz` | una línea por concepto, con procedencia propia |
| `interop-vocab-valuesets.ndjson.gz` | una línea por (value set, versión) con su membresía `[code system, versión, código]` |
| `interop-vocab-conceptmaps.ndjson.gz` | pares de ConceptMap con ambos extremos cargados |
| `interop-vocab-coverage.json` | **todo lo que no se cargó y por qué** (code systems, value sets, mapas) |
| `interop-vocab.meta.json`, `SHA256SUMS` | conteos, SHA-256 y URL de cada archivo de origen; sumas de los archivos de `data/` |

## Reglas de diseño que conviene no romper

- **Licencia por lista cerrada**: un recurso FHIR entra solo si es de HL7 (o declara dominio público/CC0) y no nombra contenido
  de terceros ni tiene un editor externo (`lib/fhir.mjs → classifyLicense`). Un value set con un solo miembro de un sistema no
  cargado no se carga a medias.
- **Jerarquía**: se crea `is-a` / `part-of` solo si el code system declara `hierarchyMeaning` (o, en CLDR, la contención geográfica);
  si no, el padre queda como propiedad `fhir_parent`.
- **Ediciones**: cada paquete (R4, R4B, R5, THO…) es una versión distinta del mismo code system; la más nueva es la por defecto.
- **Lo que otro carril ya carga con la misma URL y versión** (6 code systems de HL7 en `lab-tests/`) se omite; `ucum` se agrega
  como otra versión del mismo code system, resuelto por `internal_code`.
- Sin display en la fuente → `display = código`, con la propiedad `display_source` que lo dice.
