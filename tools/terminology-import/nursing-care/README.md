# Importador de cuidados de enfermería

Carga a `terminology.*` (módulo 03) las valoraciones, escalas, procedimientos y la
estructura del informe de cuidados de enfermería que publican fuentes con licencia
verificada, con procedencia por fila. **No escribe DDL** (ADR-0021): usa las tablas que ya
existen. Fuentes, versiones y licencias: [`SOURCES.md`](./SOURCES.md). Bitácora de pasadas y
cobertura: [`docs/seed-research/nursing-care.md`](../../../docs/seed-research/nursing-care.md).

## Etapas

```sh
# 1. red: clones fijados por commit + tarball npm verificado (fuera de git, en glossary-data-build/cache/nursing-care)
node tools/terminology-import/nursing-care/fetch-sources.mjs \
  --ckm-commit c3fdc43dcf0eb7ef0cfe60f548fcdebc24c70094 \
  --adl-archetypes-commit 093c77ea003742b9540e3dd377d615e2b26f2996 \
  --tho-version 7.0.1
# 2. sin red: NDJSON + coverage.json en glossary-data-build/nursing-care/
node tools/terminology-import/nursing-care/build-nursing-care.mjs
# 2b. copia versionada (gzip + MANIFEST) en tools/terminology-import/nursing-care/data/
node tools/terminology-import/nursing-care/link-check.mjs
node tools/terminology-import/nursing-care/pack-data.mjs
# 3. base: dry-run por defecto; --apply carga (.env DB_*). Requiere que la API haya arrancado una vez.
node tools/terminology-import/nursing-care/load-nursing-care.mjs
node tools/terminology-import/nursing-care/load-nursing-care.mjs --apply
# sin build local (p. ej. en otra máquina): usa los datos versionados de data/
node tools/terminology-import/nursing-care/load-nursing-care.mjs --apply --from-repo-data
# validación con las ramas hermanas (y con la base si se pasa --db)
node tools/terminology-import/nursing-care/link-check.mjs [--db]
# pruebas con archivos reales
node --test "tools/terminology-import/nursing-care/test/*.test.mjs"
```

## Qué se carga

| Code system | Conceptos | Jerarquía (relaciones) |
|---|---|---|
| `openehr-ckm` | arquetipo → nodo (CLUSTER/ELEMENT/paso de ACTION) → respuesta (con valor ordinal si lo tiene) | `PART_OF` hijo → padre; `IS_A` especialización → arquetipo padre |
| `es-msssi-cmdic-13606` | informe (COMPOSITION) → sección → entrada → cluster → elemento; ranuras con los arquetipos que admiten | `PART_OF` |
| `nursing-terminology-registry` | una fila por terminología de enfermería reconocida por la ANA (OID y URI de HL7 THO, licencia) | — |

- `display`: el castellano que publica la fuente (original del Ministerio, o traducción
  publicada en CKM con su autor en `translation`); si no hay, el original (inglés casi siempre)
  con `display_language`. **Nunca una traducción propia.**
- Propiedades por concepto: `source`, `source_id`, `source_version`, `source_url` (archivo en
  el commit exacto), `source_retrieved_at`, `source_license`, `nursing-provenance`,
  `content_license`, `nursing_rules`, `openehr_kind`, `openehr_rm_type`, `ordinal_value`,
  `loinc_bindings`, `slot_archetypes`, `license_verification`…
- `concept_maps`: enlaces a LOINC declarados por el arquetipo, sólo si el código LOINC existe en
  la base (se buscan por código en `loinc`/`loinc-es`); los que faltan se cuentan.
- `value_sets`: `nursing-care-clinical-models` (subconjunto de enfermería, reglas N1–N11 y
  M1–M3) y membresías en el glosario (`glossary-all-terms` + `glossary-category-care`) para
  los arquetipos de enfermería con nombre en castellano.

## Reglas que no se negocian

- **Licencia del contenido**: una escala con aviso de copyright de terceros, con aviso
  dudoso o con puntajes sin licencia verificada se carga sólo con su fila raíz (nombre,
  propósito, uso, aviso, referencias, enlace LOINC). Ítems y respuestas, no.
- **SNOMED CT**: los enlaces de los arquetipos a SNOMED no se guardan (Bolivia no es miembro).
- **Relaciones con enfermedades y síntomas**: ninguna fuente cargada las publica, y no se
  infieren. El script `link-check.mjs` deja medido el estado cuando las ramas hermanas existan.
- **Dosis**: no se cargan.

## Limitación conocida

Los ids de concepto no incluyen la versión del code system (son estables entre corridas).
Una corrida con un commit nuevo crea otra versión y agrega sólo los conceptos nuevos; para
reemplazar textos hay que cargar contra una base limpia o retirar la versión anterior.
