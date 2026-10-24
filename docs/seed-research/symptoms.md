# Síntomas, signos y fenotipos, relacionados con enfermedades

Investigación y corpus de la sesión `seed-symptoms` (2026-10-24). Importadores en
`tools/terminology-import/symptoms/`, fuentes y licencias en
`tools/terminology-import/symptoms/SOURCES.md`.

## Resumen

| | Cantidad |
|---|---:|
| Términos (síntomas, signos, hallazgos y fenotipos), 3 sistemas de códigos | **24 501** |
| — HPO (todas las subontologías) | 19 894 |
| — con nombre **oficial** en castellano (HPO Translation Project) | 19 345 |
| — Symptom Ontology (SYMP) | 895 |
| — NCI Thesaurus: signos/síntomas + hallazgos clínicos por sistema | 3 712 |
| Aristas jerárquicas is-a (sistema/órgano → tipo → término) | 29 136 |
| Filas de relación enfermedad → síntoma leídas (4 fuentes publicadas) | 422 493 |
| — que son síntoma/fenotipo (aspecto P), positivas y negadas | 404 266 |
| Enfermedades humanas de Mondo con al menos un síntoma enlazado | **12 625 de 23 263 (54,3 %)** |
| Términos HPO de anomalía fenotípica con al menos una enfermedad | 11 867 de 19 178 |

Estado de la carga:

- **Términos: listos y medidos.** `load-symptoms.mjs` corrió contra un Postgres 16
  desechable con el DDL real del módulo 03: 24 501 conceptos, 70 216
  designaciones, 363 678 propiedades, 29 136 relaciones is-a; segunda corrida
  = 0 filas nuevas.
- **Relaciones: bloqueadas por el modelo.** `concept_relationships` no puede
  guardar fuente, frecuencia ni evidencia por arista (§ Modelo). El cargador
  existe y se probó contra la tabla propuesta aplicada **sólo en la base
  desechable**; contra el modelo actual aborta sin escribir (código de salida 2).
- **Enlace con `seed-diseases`: formatos confirmados.** La sesión hermana
  (mdavila-2001/mantra-core-health-api#688) confirmó sus `internal_code` y el
  formato de cada código; el cargador los usa por defecto y, con ese formato,
  resuelve el 100 % de las filas de HPOA directo por código (§ Dependencia).

## Paso 0: discovery

- `tools/terminology-import/`: importadores del glosario ES (19 313 términos;
  CIE-10-ES con el capítulo R «Signos y síntomas», MedlinePlus, CIMA, Wikidata
  con P780 *symptoms and signs*). El glosario no trae HPO, SYMP ni NCIt, y la
  única relación enfermedad → síntoma es la de Wikidata, **sin frecuencia ni
  evidencia**.
- `src/common/seed/glossary-taxonomy.ts` ya tiene la categoría
  `signs-symptoms` (`glossary-category-signs-symptoms`); `concepts.ts` ya tiene
  `REL_SYMPTOM`, `REL_IS_A`, `LANG_EN`/`LANG_ES` y las equivalencias de mapeo.
- No hay en este repo un catálogo de motivos de consulta del triage: el AI
  Service vive en otro repositorio (no está en el alcance de la sesión).
- No hay `CLAUDE.md` ni `.claude/rules/` en el repo.
- **`concept_relationships` sólo tiene origen, destino, tipo y ordinal.** No
  puede guardar la fuente, la frecuencia ni la evidencia de cada relación. Según
  la orden, se paró la carga de relaciones y se redactó la propuesta.

## Modelo: qué tiene que cambiar el repo del modelo

Propuesta completa en
`tools/terminology-import/symptoms/proposal/concept_relationship_evidence.sql`
(no es una migración; la API no escribe DDL, ADR-0021).

1. **Tabla nueva `terminology.concept_relationship_evidence`**, 1:N con
   `concept_relationships`: `relationship_id`, `source_id`
   (→ `terminology_sources`), `source_record_key` (id estable de la línea o
   axioma), `source_version`, `source_uri`, `retrieved_at`, `negated`,
   `frequency_text` (tal como viene), `frequency_concept_id` (término HPO de
   frecuencia), `frequency_numerator`/`frequency_denominator`,
   `frequency_percent`, `evidence_code` (PCS/TAS/IEA/ITM…),
   `onset_concept_id`, `sex`, `source_references` (jsonb), `qualifiers` (jsonb:
   código y nombre tal como se publicaron, aspecto, modificadores, biocuración).
   Único por `(relationship_id, source_id, source_record_key)`.
   *Por qué 1:N y no columnas:* una misma arista la afirman varias líneas
   (Marfan → aracnodactilia: OMIM con 124/197 y PCS; Orphanet con «Muy
   frecuente» y TAS). Con columnas se perdería una de las dos.
2. **Concepto nuevo `REL_SYMPTOM_EXCLUDED`**
   (`terminology:relationship:symptom-excluded`) en `concepts.ts`: es dato que
   siembra la API, no DDL. HPOA trae 733 anotaciones `NOT` (la enfermedad
   **no** presenta el rasgo); nunca pueden cargarse como `REL_SYMPTOM`. Sin
   el concepto, el cargador las omite y lo cuenta.

Validación de la propuesta en la base desechable: 344 981 aristas
enfermedad → síntoma (344 258 `REL_SYMPTOM` + 723 `REL_SYMPTOM_EXCLUDED`) y
372 528 filas de evidencia en 60 s; segunda corrida 0/0 en 38 s. Muestra (Marfan, `MONDO:0007947`): «Aracnodactilia» con `124/197` PCS
desde `OMIM:154700` y con «Muy frecuente» TAS desde `ORPHA:558`, en la misma
arista.

## Protocolo de saturación

Deduplicación **por código y por cruce publicado**, nunca por nombre: un término
es repetido si la fuente declara un xref a uno ya incorporado (HPO → `NCIT:`) o
si las dos declaran el mismo UMLS CUI (SYMP `UMLS_CUI`, NCIt `P207`); una
relación es repetida si une la misma enfermedad (misma clave, o códigos que
Mondo declara `equivalentTo` el mismo MONDO id) con el mismo fenotipo. Sólo
cuentan relaciones de aspecto P no negadas. Cálculo reproducible en
`build-symptoms-corpus.mjs` → `symptoms/saturation.json`.

| Pasada | Fuentes | Términos nuevos | Relaciones nuevas | Notas |
|---:|---|---:|---:|---|
| 1 | HPO `hp.json` 2026-09-01 + `hp-es.babelon.tsv` + `phenotype.hpoa` 2026-09-02 | 19 894 | 248 404 | OMIM 8 478, Orphanet 4 355, DECIPHER 47 enfermedades |
| 2 | Symptom Ontology 2026-07-30 + Human Disease Ontology 2026-09-30 (`RO:0002452 has symptom`) | 895 | 2 268 | 873 enfermedades DOID |
| 3 | NCIt 24.04e, signos y síntomas + Mondo 2026-10-06 (`disease_has_feature`/`has_characteristic` → HP) | 1 054 | 589 | 19 términos NCIt ya estaban (mismo CUI que SYMP) |
| 4 | Anotaciones HPO de enfermedades comunes (Groza 2015) | 0 | 124 591 | evidencia `ITM` (minería de texto de la fuente), ver abajo |
| 5 | Monarch KG `hpoa_disease_to_phenotype_edges.tsv` (2026-10-07) | 0 | **0** | misma fuente que la pasada 1, re-transformada: lo confirma |
| 6 | NCIt, hallazgos clínicos por sitio o sistema (C36278, tipo semántico *Finding*) | 2 632 | 0 | criterio de la fuente; quedan fuera resultados de laboratorio, enfermedades y neoplasias |
| 7 | Monarch `phenopacket_ingest_edges.tsv`, `cureid_edges.tsv` | **0** | **0** | casos individuales y tratamientos; los 7 HP «faltantes» son `alt_id` |
| 8 | Hetionet v1.0, OAE, `hp-es.synonyms.tsv`, `hp-international.obo`, HPO `src/mappings` | **0** | **0** | co-ocurrencia estadística, eventos adversos, archivo vacío, sinónimos sin idioma, licencias de terceros |

**Dos pasadas seguidas (7 y 8) aportan 0**: el corpus está saturado **dentro de
lo que se puede bajar desde este entorno**. Los motivos de cada descarte están
en `SOURCES.md` § Fuentes evaluadas y no cargadas. Lo que no se pudo bajar está
en § Huecos: cuando haya acceso, hay que volver a correr el protocolo con esas
fuentes antes de afirmar que no existen más términos.

### Sobre las anotaciones de enfermedades comunes (pasada 4)

HPO las publicó (Groza et al. 2015, PMC4572507) para 3 647 enfermedades comunes
(2 601 DOID, 1 046 MeSH). El 99,5 % tiene evidencia `ITM`: la **fuente** las
extrajo por minería de texto de resúmenes de PubMed (BioLark) y cita los PMID.
No las generó esta sesión. Se cargan con su código `ITM`, para que quien las use
pueda filtrarlas. Dos ajustes de formato, ambos comprobados contra la release:

- Escriben el DOID con ceros a la izquierda (`DOID:0013550`) donde DO publica
  `DOID:13550`. Se normaliza **sólo** si el id tal cual no existe en
  `doid.owl` y el id sin ceros sí: 92 532 filas. Cada fila guarda el código
  publicado (`diseaseAsPublished`) y la normalización aplicada.
- Usan HP de 2015: 1 681 se traducen por `alt_id`/`replaced_by` que declara HPO;
  20 que HPO ya no resuelve se descartan y se cuentan.

## Cobertura

### Términos por sistema/órgano (HPO, anomalía fenotípica, 19 178 términos)

| Código | Sistema/órgano (nombre oficial ES) | Términos | Con nombre ES | Con definición (EN) |
|---|---|---:|---:|---:|
| HP:0033127 | Anormalidad del sistema musculoesquelético | 4 759 | 4 712 | 3 544 |
| HP:0040064 | Anormalidad de las extremidades | 3 024 | 3 007 | 2 063 |
| HP:0000707 | Anomalía del sistema nervioso | 2 832 | 2 795 | 2 578 |
| HP:0001939 | Anomalía del metabolismo / homeostasis | 2 481 | 2 454 | 2 386 |
| HP:0002715 | Alteración del sistema inmune | 1 785 | 1 373 | 1 768 |
| HP:0000119 | Anormalidad del sistema genitourinario | 1 713 | 1 691 | 1 629 |
| HP:0001626 | Anomalía del sistema cardiovascular | 1 507 | 1 480 | 1 418 |
| HP:0000152 | Anomalía de la cabeza y el cuello | 1 488 | 1 460 | 1 326 |
| HP:0000478 | Anomalía del ojo | 1 199 | 1 192 | 984 |
| HP:0001574 | Anormalidad del tegumento | 1 128 | 1 091 | 943 |
| HP:0001871 | Alteración de la sangre y de los tejidos que forman la sangre | 921 | 886 | 890 |
| HP:0025031 | Anomalía del sistema digestivo | 910 | 862 | 832 |
| HP:0002664 | Neoplasia | 714 | 709 | 631 |
| HP:0002086 | Alteración del sistema respiratorio | 668 | 653 | 609 |
| HP:0000818 | Alteración del sistema endocrino | 475 | 473 | 429 |
| HP:0000598 | Anomalía de la oreja | 314 | 308 | 275 |
| HP:0025354 | Fenotipo celular anormal | 307 | 303 | 280 |
| HP:0001197 | Anomalía del desarrollo prenatal o el parto | 267 | 261 | 233 |
| HP:0025142 | Síntoma constitucional | 160 | 159 | 157 |
| HP:0001507 | Anormalidad del crecimiento | 103 | 103 | 90 |
| HP:0000769 | Anomalía de la mama | 56 | 54 | 51 |
| HP:0001608 | Anomalía de la voz | 28 | 28 | 20 |
| HP:0045027 | Anormalidad de la cavidad torácica | 7 | 7 | 6 |

Un término con varios padres cuenta en cada sistema. El resto de HPO: modificador
clínico 356, antecedentes 208, fenotipo de muestra biológica 94, modo de herencia
41, grupo sanguíneo 9, frecuencia 7.

SYMP (895): sistema nervioso 148, cabeza y cuello 116, abdominal 79, piel 76,
general 67, neurológico-fisiológico 62, respiratorio 60, digestivo 59,
musculoesquelético 56, hemático-inmune 53, nutrición-metabolismo 40, urinario 36,
cardiovascular 34, reproductor 19. NCIt (3 712): 1 073 por la regla de signos y
síntomas y 2 639 hallazgos clínicos por sistema (cardiovascular 821, reproductor
455, digestivo 274, cabeza y cuello 240, nervioso 238, tejido conectivo 231,
hematopoyético 179, endocrino 131…).

**Idioma.** Sólo HPO publica nombres oficiales en castellano (19 345 de 19 894).
SYMP y NCIt no tienen traducción oficial: sus 4 607 términos quedan con el nombre
en inglés de la fuente, declarado como tal en la designación. No se tradujo nada.
Las definiciones son las de la fuente, en inglés, en la propiedad
`source_definition` con su idioma (no en la columna `definition`, que la API
muestra como texto en castellano).

### Relaciones por fuente

| Fuente | Filas | Enfermedades | Fenotipos | Aspecto P | Negadas | Frecuencia | Evidencia |
|---|---:|---:|---:|---:|---:|---|---|
| HPOA (OMIM, Orphanet, DECIPHER) | 286 651 | 12 880 | 11 658 | 268 906 | 733 | término HPO 119 446 · n/m 103 704 · % 105 · sin dato 63 396 | TAS 137 011 · PCS 119 333 · IEA 30 307 |
| Mondo | 974 | 700 | 413 | 815 | 0 | — | calificador `source=` de Mondo |
| Disease Ontology (RO:0002452) | 2 268 | 873 | 305 (SYMP) | 2 268 | 0 | — | axioma curado |
| HPO enfermedades comunes | 132 600 | 3 647 | 4 524 | 132 277 | 0 | — | ITM 131 986 · IEA 527 · TAS 87 |

Los aspectos C (curso clínico), I (herencia), M (modificador) y H (antecedente)
de HPOA, y los destinos de Mondo/comunes fuera de HP:0000118 (inicio, herencia),
no son síntomas: quedan en el corpus pero no se cargan como `REL_SYMPTOM`.

### Enfermedades con y sin síntomas enlazados

Medido contra las 23 263 enfermedades humanas de Mondo (descendientes de
`MONDO:0700096`), uniendo códigos por las equivalencias que declara Mondo:

- **Con síntomas: 12 625 (54,3 %)**; sin síntomas: 10 638.
- Por combinación de fuentes: sólo HPOA 9 288; sólo enfermedades comunes 1 520;
  HPOA + comunes 575; sólo DOID 208; DOID + comunes 208; DOID + HPOA 203; HPOA +
  Mondo 139; sólo Mondo 86; resto 398.
- Códigos anotados **sin** equivalencia en Mondo (no se pueden enlazar vía Mondo;
  sí directo si `seed-diseases` carga ese sistema): MeSH 540, DOID 362, OMIM 87,
  ORPHA 33, DECIPHER 1.

## Dependencia con `seed-diseases`

Las relaciones se enlazan **por código**, en este orden:

1. El código tal como lo publica la fuente, en el sistema que lo cita. Formatos
   confirmados por `seed-diseases` (#688, `docs/seed-research/diseases.md` §3):
   `omim` → `616331` (sin prefijo), `orphanet` → `558`, `decipher` → `16`,
   `mesh` → `D003920`, `mondo` → `MONDO:0007739` y `doid` → `DOID:9351` (con
   prefijo). Es también lo que recomendó esa sesión: colgar la arista del
   concepto del sistema que cita la anotación. Se reemplaza con
   `--disease-systems <json>` sin tocar código.
2. Si no está, el MONDO id que Mondo declara `equivalentTo` (74 548
   equivalencias en `disease-equivalences.ndjson`); la evidencia lo anota en
   `qualifiers.diseaseResolvedVia`.
3. Si tampoco, la fila no se carga y se cuenta por prefijo
   (`--check` lo muestra sin escribir).

Medición en la base desechable con dos andamios:

- **Con el formato de #688** (`omim`/`orphanet`/`decipher` con los 8 478 + 4 355
  + 47 códigos de HPOA, código sin prefijo): HPOA resuelve **268 906 de 268 906**
  filas P directo por código, 0 vía Mondo, 0 sin resolver → 268 306 aristas.
- **Sólo con Mondo** (sin otros sistemas): HPOA 267 254 de 268 906 (1 652 filas
  de 121 códigos sin equivalencia en Mondo), Mondo 815/815, DOID 2 248/2 268 y
  enfermedades comunes 102 242 de 132 277 (30 035 filas de 898 códigos DOID/MeSH
  sin equivalencia en Mondo: entran directo porque `seed-diseases` carga `doid` y
  `mesh`).

CIE-11 capítulo 21 y CIE-10 capítulo R: los carga `seed-diseases` (MMS 2026-01
completa; CIE-10 sólo como claves `icd10-who` sin título por la licencia OMS
pendiente). Esta sesión **no** los duplica ni crea un `icd10-who` propio.

## Glosario: extensión, no duplicado

- `load-symptoms.mjs --glossary` agrega al glosario los 18 646 fenotipos de HPO
  (HP:0000118) con nombre oficial en castellano: membresía en
  `glossary-all-terms` + `glossary-category-signs-symptoms` y propiedades
  `glossary-slug` (`hpo-hp-0001250`), `glossary-external-ids`,
  `glossary-provenance`. Es el **mismo concepto** del sistema `hpo`, no una copia.
- **Riesgo de duplicado visible:** las fichas `wikidata-sintoma-*` del glosario
  (destinos de Wikidata P780) no declaran su id HPO, así que hoy no se puede saber
  por código cuáles son el mismo síntoma que un término HPO. El cruce existe en
  Wikidata (P3841 *Human Phenotype Ontology ID*), pero `query.wikidata.org` está
  bloqueado en este entorno. Por eso `--glossary` **no es el comportamiento por
  defecto**: es decisión del propietario activarlo antes o después de traer P3841.

## Corrida en Postgres desechable

Postgres 16 local, DDL de `database/SQL/00_shared` + `03_terminology` (copia del
modelo). Andamio, **no commiteado**: los 7 conceptos internos que en un entorno
real siembra la API (estado activo, idiomas, tipos de designación, is-a,
`REL_SYMPTOM`, `REL_SYMPTOM_EXCLUDED`), los dos value sets del glosario y Mondo
como sustituto de `seed-diseases`.

| Paso | Filas nuevas | Tiempo | Re-corrida |
|---|---|---:|---|
| `load-symptoms.mjs --apply --glossary` | 24 501 conceptos · 70 216 designaciones · 363 678 propiedades · 29 136 is-a · 37 292 membresías | 19 s | 0 filas, 12 s |
| `load-disease-phenotypes.mjs --apply` sin la tabla propuesta | 0 (aborta, salida 2) | 5 s | — |
| idem con la tabla propuesta aplicada en la base desechable | 344 981 aristas · 372 528 evidencias | 60 s | 0 filas, 38 s |

Tamaño de la base tras todo (incluido el andamio de Mondo): 724 MB. `catalog_import_batches` suma una fila por
corrida y sistema (es el registro de cada corrida, no dato).

## Huecos

| Fuente | Qué aportaría | Por qué no está |
|---|---|---|
| Orphadata `en_product4.xml` / `es_product4.xml` | fenotipos de enfermedades raras directo de Orphanet (y nombres ES de Orphanet) | 403 del proxy de red. Su contenido llega vía HPOA (filas `ORPHA:`, 116 661) |
| CIE-11 capítulo 21 en castellano | nombres ES oficiales de síntomas, signos y hallazgos (OMS/OPS) | La MMS 2026-01 en inglés **ya la carga `seed-diseases`** (47 bloques + 1 241 categorías del cap. 21). La versión ES: `icd.who.int` / `icdcdn.who.int` bloqueados; la API de la OMS exige cuenta |
| CIE-10 capítulo R | signos y síntomas | **Ya está** en el glosario (CIE-10-ES) y en `icd10cm`; no se duplica |
| MeSH C23 y DeCS (BIREME) | descriptores de signos y síntomas, en castellano (DeCS) | `nlm.nih.gov` bloqueado; DeCS exige solicitar licencia y token a BIREME/OPS |
| Wikidata P3841 | cruce HPO ↔ fichas `wikidata-sintoma` del glosario | `query.wikidata.org` bloqueado |
| SNOMED CT (incluido el Global Patient Set) | hallazgos clínicos | Bolivia no es miembro; el GPS se distribuye por snomed.org/MLDS (cuenta). No se crean cuentas |
| UMLS / MedDRA / OMIM API | sinónimos y cruces | requieren licencia o cuenta |
| CIAP-2 / ICPC-2 (WONCA) | motivos de consulta de atención primaria | © WONCA; uso comercial con licencia. No se usaron copias de terceros |
| PubMed / Europe PMC | detectar huecos en la literatura | `eutils.ncbi.nlm.nih.gov` y `www.ebi.ac.uk` bloqueados |
| Página de licencia de HPO y términos de uso del NCIt | texto vigente de las condiciones | `hpo.jax.org` y `evs.nci.nih.gov` bloqueados: verificar antes de publicar |
| NCIt vigente | NCIt 26.x | la edición OBO más reciente en GitHub es 24.04e (2024-05-07) |

## Cómo correr

```sh
node tools/terminology-import/symptoms/fetch-symptom-sources.mjs        # ~1 min, 510 MB, reanudable
node tools/terminology-import/symptoms/build-symptoms-corpus.mjs        # ~25 s, sin red ni base
node tools/terminology-import/symptoms/load-symptoms.mjs                # dry-run: plan y conteos
node tools/terminology-import/symptoms/load-symptoms.mjs --apply        # términos (.env DB_*); --glossary opcional
node tools/terminology-import/symptoms/load-disease-phenotypes.mjs      # dry-run del plan de relaciones
node tools/terminology-import/symptoms/load-disease-phenotypes.mjs --check   # modelo + resolución, sin escribir
node tools/terminology-import/symptoms/load-disease-phenotypes.mjs --apply   # sólo cuando el modelo tenga la tabla
node --test "tools/terminology-import/symptoms/test/*.test.mjs"         # 13 pruebas con recortes reales
```
