# Diccionarios médicos generales → `terminology.*`

Importadores de todo lo que **no** cargan las sesiones de enfermedades, síntomas, alergias, análisis,
servicios, medicamentos, fichas y enfermería: anatomía (Uberon, FMA, AEO, CARO), embriología (EHDAA2,
HsapDv), histología (CL, BTO, CLO), genética (HGNC, SO, GENO), microbiología y parasitología (NCBI
Taxonomy de interés médico, ARO, OPL, OMP, OHPI, OHMI, TAXRANK), farmacología general (PBPKO),
salud pública y epidemiología (IDO, TRANS, Apollo-SV, HANCESTRO, HSO), estadística (STATO, OBCS),
profesiones y roles (OMRSE, OccO), exposiciones (ExO, ECTO, ENVO, RBO), fisiología (GO, OBA, NBO, MF,
MFOEM, PW), bioquímica (PSI-MOD), cualidades (PATO), conceptos generales (OGMS) y abreviaturas clínicas
(Metainventario). Fuentes, versiones, hashes y licencias: [`SOURCES.md`](SOURCES.md). Investigación,
pasadas de saturación y huecos: [`docs/seed-research/medical-dictionaries.md`](../../../docs/seed-research/medical-dictionaries.md).

Extiende lo que ya existía en `tools/terminology-import/` sin duplicarlo: reusa `lib/glossary-es/common.mjs`
(HTTP con caché, NDJSON, `deterministicId`), el `md5uuid` del glosario y la carpeta de build fuera de git
(`GLOSSARY_BUILD_DIR`, por defecto `../glossary-data-build`).

## Etapas

| Etapa | Script | Qué hace | Red |
|---|---|---|---|
| 1 | `fetch-dictionaries.mjs [ids…]` | Baja cada archivo a `dictionaries-sources/<id>/` y deja `manifest.json` (URL, SHA-256, bytes, fecha). Reanudable. | sí |
| 2 | `build-dictionaries.mjs` | Normaliza a `dictionaries/ndjson/<id>.ndjson` (+ `.meta.json`), `disease-agents.ndjson` y `coverage.json`. Determinista. ~40 s; ~650 MB de NDJSON. | no |
| 2b | `import-wikidata-es-labels.mjs` | Nombres ES de Wikidata (CC0) por id declarado (P1554 UBERON, P7963 CL, P1402 FMA, P354 HGNC, P685 NCBITaxon…). **No corrido**: query.wikidata.org bloqueado en la sesión que lo escribió. | sí |
| 2c | `pack-dictionaries-data.mjs --pack` / `--unpack` | Guarda el corpus normalizado en git (`data/`, gzip determinista, partes ≤ 45 MB, `INDEX.json` con SHA-256) y lo restaura verificado, para cargar sin volver a bajar ni construir. Los crudos no se suben: `data/manifest.json` trae URL y SHA-256 para re-bajarlos con `fetch`. | no |
| 3 | `load-dictionaries.mjs` | Dry-run por defecto; `--apply` carga a `terminology.*`. `--include go,pato,fma-full,abbreviations-literature,…` suma lo opt-in; `--only uberon,cl` limita. | base |

```sh
node tools/terminology-import/dictionaries/fetch-dictionaries.mjs          # ~2 min, ~500 MB
node tools/terminology-import/dictionaries/build-dictionaries.mjs          # ~40 s, sin red
node tools/terminology-import/dictionaries/pack-dictionaries-data.mjs --unpack   # alternativa a fetch+build: restaura el corpus de data/ (31,7 MB)
node tools/terminology-import/dictionaries/load-dictionaries.mjs           # plan y conteos, sin base
node tools/terminology-import/dictionaries/load-dictionaries.mjs --apply   # .env DB_*; exige la API arrancada una vez
node --test "tools/terminology-import/dictionaries/test/*.test.mjs"        # 18 pruebas con recortes reales
```

La carga exige que la API haya sembrado los conceptos internos que usa (idiomas EN/ES/LA, tipos de
designación, equivalencia, y los tipos de relación `is-a`, `part-of`, `develops-from`, `located-in`,
`infectious-agent`, `transmitted-by`; los cuatro últimos y `LANG_LA` se agregan en
`src/common/constants/concepts.ts` con este importador). Si falta alguno, aborta y lo nombra.

## Modelo de carga (módulo 03, sin DDL)

| Tabla | Qué va |
|---|---|
| `terminology_sources` / `code_systems` / `code_system_versions` | Uno por fuente. URL canónica = el PURL oficial de la ontología (`http://purl.obolibrary.org/obo/uberon.owl`, HGNC `http://www.genenames.org/geneId`); versión = etiqueta o commit fijado. |
| `catalog_concepts` | `code` = id de la fuente (`UBERON:0000948`, `HGNC:1100`, `FMA:7088`), `display` = nombre de la fuente (inglés), `definition` = definición de la fuente, verbatim. |
| `concept_designations` | Preferida EN + sinónimos **EXACT** EN. ES y latín **sólo** cuando la fuente declara el idioma (FMA: axioma `language: Spanish/Latin`). NARROW/BROAD/RELATED no son sinónimos: quedan como dato. |
| `concept_properties` | `dictionary-provenance` (fuente, id de origen, versión, URI del término, archivo, SHA-256, fecha, licencia) y `dictionary-entry` (dominio, xrefs, sinónimos no exactos, subsets, relaciones no tipadas, procedencia de cada relación tipada, extras de la fuente). |
| `concept_relationships` | `is_a`, `part_of` (BFO:0000050 y las subpropiedades que el archivo declara), `develops_from` (RO:0002202), `located_in` (RO:0001025) entre conceptos cargados; enfermedad → organismo (`infectious-agent`, `transmitted-by`) hacia las enfermedades **ya presentes** en la base. |
| `concept_maps` | Xrefs publicados que resuelven por **código idéntico** a un concepto existente: otra fuente del corpus (Uberon → FMA, Uberon → EHDAA2), CIE-10-ES / ICD-10-CM (`ICD10CM:`), MeSH y TA98 del glosario (`glossary-external-ids`), Mondo/DOID si otra sesión los cargó. `equivalence` = `equivalent` sólo si la fuente lo afirma (Mondo `MONDO:equivalentTo`); si no, nula. |
| `catalog_import_batches` | Un lote por fuente y corrida (auditoría). |

**Deduplicación con las otras sesiones**: un code system con la misma URL canónica o el mismo
`internal_code` se reusa; un concepto con el mismo código en esa versión se reusa
(`UNIQUE(code_system_version_id, code)`) y designaciones, propiedades y relaciones cuelgan de su id.

**Idempotencia**: ids `md5('mantra:dictionaries:<tipo>:<clave>')`, `ON CONFLICT DO NOTHING`, nunca
`UPDATE`. Medido en un Postgres 16 desechable con el DDL del módulo 03: 1.ª corrida 46 s → 111 389
conceptos; 2.ª corrida 28 s → 0 filas nuevas (sólo el lote de auditoría).

## Reglas

- **Nada se redacta ni se traduce.** Lo que la fuente no trae queda nulo (HGNC no publica definiciones).
- **Relaciones sólo publicadas**, con el predicado verificado contra el `[Typedef]` del propio archivo:
  si el nombre no es el esperado, el build aborta (así se descartó el `develops_from` de BTO, que se llama
  «derives from/develops from» y mezcla dos relaciones).
- **Uberon y CL, sólo lo humano**: se excluyen los términos que la fuente declara `in_taxon` fuera del
  linaje de *Homo sapiens* o `never_in_taxon` dentro, y lo que cuelga de ellos por is_a/part_of
  (1 126 de Uberon, 265 de CL).
- **Xrefs que no se copian**: SNOMED CT (Bolivia no es miembro de SNOMED International), UMLS y MedGen
  (licencia UTS), MedDRA (licencia comercial). Se cuentan en `coverage.json`.
- **Organismos**: sólo los taxones que Mondo o DOID declaran como agente infeccioso o vector, más su linaje.
- **Lo que no sirve a una consulta del producto no se carga por defecto** (`load: 'opt-in'` en
  `lib/sources.mjs`, con el motivo en `productQuery`): queda construido y descargable.

## Esquema de fila (`<id>.ndjson`)

`key` (`<codeSystem>|<code>`), `codeSystem`, `code`, `domain`, `lang`, `display`, `definition`,
`definitionXrefs[]`, `synonymsExact[]`, `synonymsOther[{value,scope,type}]`, `designationsEs[]`,
`designationsLa[]` (sólo FMA), `xrefs[{id,sources?,equivalent}]`, `subsets[]`, `namespace`, `altIds[]`,
`relations[{type,predicate,target,targetKey}]`, `otherRelations[{predicate,label,target}]`, `extra{}`,
`provenance{sourceId,sourceName,sourceTermId,version,dataVersion,uri,fileUrl,fileSha256,retrievedAt,license,licenseUrl}`.

`disease-agents.ndjson`: `diseaseSystem` (`mondo`|`doid`), `diseaseId`, `diseaseLabel`,
`diseaseXrefs[{id,equivalent}]`, `type` (`INFECTIOUS_AGENT`|`TRANSMITTED_BY`), `predicate`,
`predicateLabel`, `axiom`, `target` (NCBITaxon), `provenance{file,sha256,retrievedAt,version,license,uri}`.
