# Catálogo exhaustivo de enfermedades — investigación, saturación y cobertura

Fecha de corte: **2026-10-24**; cierre de huecos (MeSH oficial, NCIt de EVS, NANDO, OncoTree, MedlinePlus Genetics, tablas OMS 2026-01) el **2026-10-28**: ver §12 (antes/después). Donde una sección vieja contradice al §12, vale el §12. Importador: `tools/terminology-import/diseases/`
([README](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/tools/terminology-import/diseases/README.md),
[SOURCES.md](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/tools/terminology-import/diseases/SOURCES.md)).
Sin DDL: todo entra en las tablas existentes del módulo 03 `terminology`.

## 1. Resumen

| | |
|---|---|
| Sistemas con nomenclatura propia | `mondo`, `orphanet` (**castellano**), `doid`, `ncit-disease` (+ `ncit-xref`), `icd11-mms`, `efo-disease`, `mesh` (oficial 2026), `nando`, `oncotree`, `medlineplus-genetics` |
| Sistemas de clave cruzada (sólo código) | `omim`, `icd10-who`, `icd11-foundation`, `mesh`, `umls`, `decipher` |
| Conceptos | **194 291** (antes 184 896; ver §12) |
| Designaciones | 369 606 (antes 311 525; 25 942 en castellano, todas de Orphanet) |
| Aristas de jerarquía (`REL_IS_A`) | 160 233 cargadas (antes 147 815) |
| Alineamientos publicados (`concept_maps`) | 219 192 cargados (antes 191 467) (+ los condicionales hacia `icd10cm` / CIE-10-ES si esos conceptos existen) |
| Propiedades | 624 713 (antes 495 193) |
| Peso en Postgres 16 (tablas + índices del módulo 03) | 423 MB la base de prueba completa; `concept_properties` 159 MB |
| Carga en base limpia / segunda corrida | 88 s / 42 s con **0 filas nuevas** (idempotente; desde la instantánea) |
| Instantánea en git | `tools/terminology-import/diseases/data/` — 16 `*.ndjson.gz` (18 MB, la mayor 4,3 MB) + `MANIFEST.json` + `SHA256SUMS`; `load-catalog.mjs --from-snapshot` carga desde ahí sin red: 99 s en base limpia, segunda corrida con 0 filas nuevas (`evidencia/C1/carga-1.txt`, `carga-2.txt`) |
| Saturación | Ver §12: 25 pasadas; ClinGen, ClinVar, Alliance, CURE ID, Hetionet, Orphadata p6/p9 aportan 0 y GenCC 2 componentes (códigos que el catálogo ya tiene, sin equivalencia publicada con otra pasada). Pendientes por licencia: GARD, CIE-11 ES; por tiempo: Wikidata. |

Todos los nombres, sinónimos y definiciones son **verbatim** de la fuente y
en el idioma que ella trae: Orphanet en castellano (oficial); MONDO, DOID,
NCIt, CIE-11 MMS y EFO en inglés. No hay traducciones propias.

## 2. Discovery (lo que ya había)

- **Glosario en castellano** (`load-glossary-es.mjs`, 11 sistemas, ~19 300
  términos, corpus fuera del repo): incluye CIE-10-ES Diagnósticos (Ministerio
  de Sanidad, ids `md5('mantra:glossary-es:concept:cie10es-dx-<slug>')`) y las
  relaciones de Wikidata. **No se duplica**: el catálogo de enfermedades vive en
  sus propios code systems y se **enlaza** al glosario con `concept_maps` desde
  cada xref ICD-10-CM que publica MONDO/DOID/EFO hacia el concepto CIE-10-ES de
  igual código (la CIE-10-ES es la traducción oficial de la ICD-10-CM). Esos
  mapeos se insertan sólo si el concepto del glosario existe en la base.
- **`import-icd10cm.mjs`** (`icd10cm`, 74 719 códigos, NLM): mismo criterio,
  enlace condicional por su id `md5('mantra:icd10cm:concept:<code>')`.
- **Módulo 03**: ya trae todo lo necesario — `REL_IS_A`, `EQUIV_EQUIVALENT /
  WIDER / NARROWER / INEXACT`, `LANG_ES / EN`, `TERM_ACTIVE / DRAFT /
  DEPRECATED`, `CodeSystem/$lookup`, `ConceptMap/$translate` y la búsqueda
  `GET /terminology/concepts?q=&codeSystemVersionId=`. No hace falta DDL.
- **Lección del MeSH retirado (1,44 M filas sin uso)**: acá se carga sólo lo que
  sirve para clasificar, buscar y enlazar enfermedades. No se cargan SCR de MeSH,
  ni fármacos/hallazgos de NCIt (sólo C2991), ni clases importadas por EFO, ni
  las 30 000 entidades de la Fundación de la CIE-11 que nadie cita (sólo las
  4 630 que citan MONDO u Orphanet). Ver §6 para el peso de cada parte.
- No hay `CLAUDE.md` ni `.claude/rules/` en el repo.

## 3. Contrato para enlazar por código (sesión `seed-symptoms` y otras)

Clave natural de cada concepto: `code_systems.internal_code` + `catalog_concepts.code`.
Id determinista: `md5('mantra:diseases:concept:<internal_code>:<code>')::uuid`
(en JS, `conceptId(cs, code)` de `lib/code-systems.mjs`). URL canónica del
sistema (para `$lookup`): `https://mantracore.health/fhir/CodeSystem/<internal_code>`.

| `internal_code` | Formato de `code` | Versión | Conceptos | Qué es |
|---|---|---|---:|---|
| `mondo` | `MONDO:0005015` | 2026-10-06 | 27 695 | Condiciones humanas de MONDO bajo «disease», «disease susceptibility» o «injury» (sin animales no humanos ni «disease characteristic»); 3 921 obsoletas |
| `orphanet` | `558` (ORPHAcode, sin prefijo) | 2026-06-23 | 11 645 | Nomenclatura Orphanet con **nombre, sinónimos y definición en castellano**; 1 888 inactivas |
| `doid` | `DOID:9351` | 2026-09-30 | 14 854 | Human Disease Ontology; 2 519 obsoletas (los `alt_id` en `disease_alt_ids`) |
| `ncit-disease` | `C2985` | 26.02d | 22 379 | NCI Thesaurus, subárbol C2991 «Disease or Disorder» |
| `icd11-mms` | `5A11` · `BlockL1-1A0` · `chapter-01` · `mms-entity-<id>` | 2026-01 | 37 052 | CIE-11 MMS completa (capítulos 01–26, V y X) |
| `efo-disease` | `EFO:0000195` | 3.95.0 | 1 159 | Clases propias de EFO bajo «disease» |
| `omim` | `219700` · `PS219700` | `xref-keys` | 10 871 | Clave: número MIM citado por MONDO, Orphanet, DOID, EFO, HPO o phenopacket-store |
| `icd10-who` | `E84.0` · `A00-A09` · `I` | `xref-keys` | 12 640 | Clave: código CIE-10 OMS 2019 (todas las entidades de la tabla OMS 10→11 + las citadas) |
| `icd11-foundation` | `465177735` | `xref-keys` | 4 631 | Clave: entidad de la Fundación citada por MONDO/Orphanet |
| `mesh` | `D003920` | `xref-keys` | 9 320 | Clave: descriptor MeSH citado (incluye los 1 046 de las anotaciones HPO de enfermedades comunes) |
| `umls` | `C0011849` | `xref-keys` | 32 589 | Clave: CUI citado |
| `decipher` | `16` | `xref-keys` | 61 | Clave: síndrome DECIPHER citado por HPO / MONDO |

Una **clave** tiene `display` = el propio código y la propiedad
`disease_xref_key` (`{ displayIsCode: true, citedBy: { mondo: 1, hpo-annotations: 1, … } }`).
Existe para que se pueda enlazar por código sin inventar un título.

**Cobertura de las anotaciones HPO 2026-09-01** (entrada de `seed-symptoms`):
los 12 880 identificadores de enfermedad resuelven todos — 8 478 OMIM → `omim`,
4 355 ORPHA → `orphanet` (0 faltantes), 47 DECIPHER → `decipher`.

Cómo enlazar (recomendado): colgar la relación síntoma ↔ enfermedad del
concepto **del sistema que cita la anotación** (`omim:619340`, `orphanet:558`) y,
cuando haga falta el concepto con nombre, seguir sus `concept_maps` (equivalencia
`EQUIV_EQUIVALENT`) hacia `mondo` / `orphanet`.

```sql
-- concepto por clave natural
SELECT cc.* FROM terminology.catalog_concepts cc
  JOIN terminology.code_system_versions v ON v.id = cc.code_system_version_id
  JOIN terminology.code_systems cs ON cs.id = v.code_system_id
 WHERE cs.internal_code = 'omim' AND cc.code = '219700';
-- quién lo alinea y con qué equivalencia (OMIM 219700 → DOID:1485, MONDO:0009061 E, ORPHA:586 E)
SELECT src.code, m.context, eq.code AS equivalence
  FROM terminology.concept_maps m
  JOIN terminology.catalog_concepts src ON src.id = m.source_concept_id
  LEFT JOIN terminology.catalog_concepts eq ON eq.id = m.equivalence_concept_id
 WHERE m.target_concept_id = md5('mantra:diseases:concept:omim:219700')::uuid;
```

Por API: `GET /terminology/CodeSystem/$lookup?system=https://mantracore.health/fhir/CodeSystem/orphanet&code=558`,
`POST /terminology/ConceptMap/$translate` con `{ "sourceConceptId": … }` y
`GET /terminology/concepts?q=fibrosis%20qu%C3%ADstica&codeSystemVersionId=<versión de orphanet>`.

## 4. Mapeo al módulo 03 (sin DDL)

| Dato de la fuente | Dónde queda |
|---|---|
| Nombre preferido / sinónimos (con idioma) | `catalog_concepts.display` + `concept_designations` (`LANG_ES`/`LANG_EN`, `DESIG_PREFERRED`/`DESIG_SYNONYM`) |
| Definición | `catalog_concepts.definition` (verbatim) + `disease_definition_lang`, `disease_definition_refs`, `disease_definition_html` (Orphanet con marcado) |
| Jerarquía (capítulo → bloque → categoría → subcategoría; clasificaciones Orphanet; `is_a`) | `concept_relationships` `REL_IS_A` |
| Obsoleto / reemplazado | `state_concept_id = TERM_DEPRECATED`, `selectable = false`, `replaced_by_concept_id` (si el reemplazo está vigente), `disease_replaced_by` |
| Cruce publicado y su semántica | `concept_maps` (`equivalence_concept_id` = `EQUIV_*` o nulo si la fuente no la declara; `context` = fuente y relación original; `version`; `TERM_DRAFT` si Orphanet no lo validó) |
| Procedencia por concepto | `disease_provenance` = `{ source, sourceId, version, uri, retrievedAt }`; licencia en `terminology_sources.license`; archivo y SHA-256 en `code_system_versions.checksum` |
| Clasificación propia | `orphanet_classification` (tipo, grupo, clasificaciones, padre preferencial, banderas), `icd11_classification` (classKind, capítulo, residual, hoja, agrupaciones, URIs), `icd11_coding_note`, `disease_subsets`, `ncit_semantic_types` |
| Xref sin sistema cargado | `disease_external_xrefs` (MedDRA, ICD-O, GARD, EFO importados, MedGen, ICD-9, NORD, NANDO…) y `disease_unresolved_xrefs` |

## 5. Protocolo de saturación

Regla de deduplicación (`coverage-report.mjs`): dos conceptos son la misma
entidad si **alguna fuente publica** entre ellos —directamente o a través de una
clave común (OMIM, UMLS, MeSH, CIE…)— un alineamiento de **equivalencia** o un
xref **sin semántica declarada**. «Más amplio», «más estrecho» e «inexacto» no
deduplican. **Nunca por nombre.** «Conceptos nuevos» = conceptos vigentes de la
pasada sin ese vínculo con una pasada anterior; «entidades» = componentes
conexos nuevos.

| Pasada | Fuente (versión) | Tipo | Ítems | Conceptos nuevos | Descartes de la pasada |
|---:|---|---|---:|---:|---|
| 1 | MONDO 2026-10-06 | ontología | 23 774 vigentes | **23 774** | 8 360 clases de animales no humanos / «disease characteristic»; SNOMED CT entero |
| 2 | Orphanet ES 2026-06-23 | ontología | 9 757 | **1 534** | MedDRA como referencia; 1 060 alineamientos duplicados en el propio XML |
| 3 | DOID 2026-09-30 | ontología | 12 335 | **277** | SNOMED CT; GARD heredado como referencia |
| 4 | NCIt 26.02d (C2991) | ontología | 22 379 | **14 511** | 187 531 clases fuera de C2991 (fármacos, genes, hallazgos); la edición 2024-05 (más vieja) |
| 5 | CIE-11 MMS 2026-01 | ontología | 37 052 | **29 257**: 11 542 de los capítulos 01–26, 159 de V y 17 556 del cap. X (códigos de extensión) | CIE-11 en español (sin archivo oficial accesible); contenedor `whoicd/icd-api` |
| 6 | EFO 3.95.0 | ontología | 1 159 | **495** | 93 486 clases que no son enfermedad o que EFO importa de MONDO |
| 7 | Anotaciones HPO 2026-09-02 | claves citadas | 12 880 | **67** (OMIM sólo citados por HPO o sólo con NTBT/BTNT de Orphanet; DECIPHER) | nombres de OMIM (licencia) |
| 8 | NANDO (2024-07) | medida, no se carga | 2 768 | 685 | sin licencia declarada |
| 9 | phenopacket-store 0.1.27 | claves citadas | 780 | **1** (`OMIM:601674`) | — |
| 10 | OncoTree 2025-10-03 | medida, no se carga | 865 | 189 | sin licencia declarada |
| 11 | Hetionet v1.0 | medida | 137 | **0** | — (`DOID:9917` resuelve por `alt_id` a `DOID:5158`) |
| 12 | OMS, tabla 10→11 (códigos CIE-10 2019) | claves citadas | 12 597 | **886** (destino poscoordinado o sin categoría simple en la CIE-11 2026-01) | títulos CIE-10 (licencia comercial de la OMS) |
| 13 | MeSH 2025 árbol C (conversión PyOBO) | medida, no se carga | 5 067 | 1 562 | conversión de terceros sin números de árbol; oficial bloqueada. La cabeza C21 «Disorders of Environmental Origin» no se incluyó en la medida (no se pudo verificar su id): subestima. |
| 14 | GARD (conversión PyOBO) | medida, no se carga | 6 109 | 2 598 | sin licencia declarada; sin cruces publicados |
| 15 | Anotaciones HPO de enfermedades comunes (Groza et al. 2015) | claves citadas | 3 647 (2 601 DOID, 1 046 MeSH) | **394** (MeSH que no citaba nadie o sólo sin equivalencia; `DOID:5898` sin resolver) | DOID con ceros a la izquierda resueltos por código exacto, sin ceros o `alt_id` (nunca por nombre) |
| 16 | ClinGen, validez gen-enfermedad (Monarch KG 2026-10-07, ingesta 2026-08-31) | medida | 118 | **0** | 4 MONDO obsoletos resueltos por su `replaced_by` |
| 17 | ClinVar (Monarch KG 2026-10-07, ingesta 2026-09-29) | medida | 5 052 | **0** | ídem (obsoletos por `replaced_by`) |
| 18 | Alliance of Genome Resources (Monarch KG 2026-10-07, 9.1.0) | medida | 2 160 | **0** | — |
| 19 | CURE ID, FDA/NCATS (Monarch KG 2026-10-07, 2026-05-28) | medida | 25 | **0** | — |

**Resultado.** Las pasadas 16 a 19 (cuatro fuentes independientes de curación
clínica, servidas por el bucket público de Monarch porque sus hosts están
bloqueados) aportan **0**: el protocolo de dos pasadas seguidas en 0 **se
cumple**. Dos matices honestos:

- Las cuatro llegan con sus ids de enfermedad **normalizados a MONDO por
  Monarch**: miden que ninguna enfermedad que usan quedó afuera, pero no son
  nomenclaturas propias que traigan conceptos nuevos.
- La pasada 16 encontró un **error real del catálogo**, ya corregido. El filtro
  de MONDO sólo aceptaba la raíz «disease» y dejaba afuera «disease
  susceptibility» (MONDO:0042489, susceptibilidades de OMIM, 492 clases fuera
  de «disease») e «injury» (MONDO:0021178). Ahora MONDO tiene 23 774 clases
  humanas vigentes (antes 23 264) y los recuentos de las pasadas son los de
  arriba, recalculados.

Lo que queda por encima de lo cargado son fuentes que **sí aportarían pero no se
pueden cargar**:

- **MeSH oficial** (`nlmpubs.nlm.nih.gov`, desc2026.xml con números de árbol y
  SCR de enfermedades raras): libre con atribución; sólo falta abrir el host.
- **GARD oficial** (`rarediseases.info.nih.gov`, NCATS).
- **NANDO** y **OncoTree**: confirmar licencia con el editor.
- **CIE-10 OMS con títulos** y **CIE-10 OPS en español**: licencia de la OMS/OPS.
- **UMLS** (referencia amplia y MedGen): cuenta UTS del propietario.
- Literatura (PubMed / Europe PMC) para detectar huecos: `eutils.ncbi.nlm.nih.gov`
  y `www.ebi.ac.uk` bloqueados; no se pudo correr.

Iteración: las 19 pasadas se corrieron en esta sesión, una fuente nueva e
independiente por vez; la 15 la aportó `seed-symptoms`. Para sumar una fuente:
`lib/sources.mjs` + `PASSES` en `coverage-report.mjs`.

### Cobertura contra una referencia amplia

- **MONDO como referencia**: 17 923 de las 23 774 clases vigentes de MONDO
  tienen al menos una equivalencia publicada hacia otro sistema cargado.
  Enlazados a MONDO: DOID 97,7 %, Orphanet 84,3 %, EFO 38,2 %, NCIt 35,1 %,
  CIE-11 MMS 20,8 % (las categorías de los caps. 22–26 y X casi no tienen
  correspondencia en MONDO: es esperable, son lesiones, causas externas,
  factores y extensiones).
- **UMLS**: no medido (exige cuenta UTS del propietario; no se creó).

## 6. Peso y consulta por sistema

Medido en Postgres 16 desechable (esquema `database/SQL/03_terminology` del
repo + los 12 conceptos internos que siembra la API), 2026-10-24.

| Sistema | Conceptos | Designaciones | Propiedades (filas / JSON) | `is_a` | Mapeos que origina | Para qué consulta sirve |
|---|---:|---:|---|---:|---:|---|
| `icd11-mms` | 37 052 | 37 052 | 74 739 / 19 MB | 37 024 | 19 024 | Clasificar y codificar (CIE-11), navegar capítulo → bloque → categoría; puente a CIE-10 |
| `mondo` | 27 695 | 111 790 | 110 255 / 9,0 MB | 36 104 | 75 138 | Concepto pivote: une OMIM, Orphanet, DOID, NCIt, MeSH, UMLS, CIE |
| `ncit-disease` | 22 379 | 69 326 | 67 134 / 4,7 MB | 37 305 | 13 981 | Oncología (15 356 bajo «Neoplasm») y sinónimos clínicos |
| `doid` | 14 854 | 37 793 | 49 959 / 4,1 MB | 17 479 | 24 666 | Clasificación etiológica / anatómica alternativa |
| `orphanet` | 11 645 | 52 894 | 48 992 / 9,6 MB | 19 711 | 45 767 | **Búsqueda en castellano** de enfermedades raras, con definición ES |
| `efo-disease` | 1 159 | 2 670 | 3 890 / 0,3 MB | 192 | 1 242 | Rasgos/enfermedades GWAS que no están en MONDO |
| `umls` (clave) | 32 589 | 0 | 65 178 / 7,7 MB | 0 | 0 (es destino) | Puente de deduplicación y enlace con fuentes que hablan en CUI. **Ninguna consulta de producto lo lee hoy**: si el propietario no lo necesita, se puede omitir con `--systems` (≈ 98 000 filas). |
| `icd10-who` (clave) | 12 640 | 0 | 25 280 / 3,0 MB | 0 | 11 649 | Códigos CIE-10 OMS (estándar del SNIS) ↔ CIE-11 |
| `omim` (clave) | 10 871 | 0 | 21 742 / 2,7 MB | 0 | 0 (es destino) | Enlace de las anotaciones HPO / síntomas |
| `mesh` (clave) | 9 320 | 0 | 18 640 / 2,1 MB | 0 | 0 (es destino) | Enlace con fuentes indexadas en MeSH |
| `icd11-foundation` (clave) | 4 631 | 0 | 9 262 / 1,0 MB | 0 | 0 (es destino) | Puente MONDO ↔ CIE-11 MMS |
| `decipher` (clave) | 61 | 0 | 122 | 0 | 0 | Enlace de las anotaciones HPO |

Fuera de la base: fuentes descargadas 1,3 GB y NDJSON intermedio 163 MB
(ambos fuera de git, en `glossary-data-build/`).

> **Búsqueda.** `concept_designations.value` y `catalog_concepts.display` no
> tienen índice de texto: una búsqueda `ILIKE '%…%'` recorre ~311 500
> designaciones (decenas de ms en la prueba). Ver la propuesta para el modelo
> en §9.

## 7. Cobertura detallada

Tablas generadas por `coverage-report.mjs` (`glossary-data-build/diseases-coverage.md`).

### CIE-11 MMS por capítulo

| Capítulo | Bloques | Categorías | Categorías enlazadas a MONDO |
|---|---:|---:|---:|
| 01 Certain infectious or parasitic diseases | 43 | 1025 | 630 |
| 02 Neoplasms | 42 | 1247 | 862 |
| 03 Diseases of the blood or blood-forming organs | 13 | 262 | 160 |
| 04 Diseases of the immune system | 6 | 257 | 202 |
| 05 Endocrine, nutritional or metabolic diseases | 25 | 637 | 467 |
| 06 Mental, behavioural or neurodevelopmental disorders | 25 | 858 | 445 |
| 07 Sleep-wake disorders | 6 | 79 | 64 |
| 08 Diseases of the nervous system | 28 | 842 | 581 |
| 09 Diseases of the visual system | 25 | 703 | 488 |
| 10 Diseases of the ear or mastoid process | 13 | 151 | 79 |
| 11 Diseases of the circulatory system | 24 | 583 | 306 |
| 12 Diseases of the respiratory system | 8 | 344 | 190 |
| 13 Diseases of the digestive system | 26 | 970 | 647 |
| 14 Diseases of the skin | 77 | 785 | 469 |
| 15 Diseases of the musculoskeletal system or connective tissue | 15 | 426 | 149 |
| 16 Diseases of the genitourinary system | 19 | 545 | 243 |
| 17 Conditions related to sexual health | 3 | 68 | 0 |
| 18 Pregnancy, childbirth or the puerperium | 9 | 522 | 32 |
| 19 Certain conditions originating in the perinatal period | 17 | 625 | 110 |
| 20 Developmental anomalies | 30 | 1323 | 1049 |
| 21 Symptoms, signs or clinical findings, not elsewhere classified | 47 | 1241 | 249 |
| 22 Injury, poisoning or certain other consequences of external causes | 30 | 1982 | 90 |
| 23 External causes of morbidity or mortality | 85 | 909 | 9 |
| 24 Factors influencing health status or contact with health services | 45 | 851 | 0 |
| 25 Codes for special purposes | 2 | 20 | 8 |
| 26 Supplementary Chapter Traditional Medicine Conditions | 125 | 1120 | 0 |
| V Supplementary section for functioning assessment | 28 | 130 | 0 |
| X Extension Codes | 544 | 17159 | 145 |

### orphanet por rama (un concepto puede estar en varias)

| Rama | Conceptos |
|---|---:|
| Orphanet classification of rare genetic diseases | 6763 |
| Orphanet classification of rare developmental anomalies during embryogenesis | 3654 |
| Orphanet classification of rare neurological diseases | 3376 |
| Orphanet classification of rare transplant-related disorders | 1647 |
| Orphanet classification of rare ophthalmic disorders | 1282 |
| Orphanet classification of rare inborn errors of metabolism | 1123 |
| Orphanet classification of rare neoplastic diseases | 1120 |
| Orphanet classification of rare skin diseases | 1048 |
| Orphanet classification of rare bone diseases | 904 |
| Orphanet classification of rare endocrine diseases | 700 |
| Orphanet classification of rare hematological diseases | 627 |
| Orphanet classification of rare renal diseases | 498 |
| Orphanet classification of rare otorhinolaryngological diseases | 457 |
| Orphanet classification of rare immunological diseases | 422 |
| Orphanet classification of rare gastroenterological diseases | 379 |
| Orphanet classification of rare circulatory system diseases | 369 |
| Orphanet classification of rare systemic and rheumatological diseases | 364 |
| Orphanet classification of rare gynecological and obstetric diseases | 308 |
| Orphanet classification of rare respiratory diseases | 289 |
| Orphanet classification of rare cardiac malformations | 257 |
| Orphanet classification of rare cardiac diseases | 241 |
| Orphanet classification of rare abdominal surgical diseases | 236 |
| Orphanet classification of rare hepatic diseases | 233 |
| Orphanet classification of rare infectious diseases | 224 |
| Orphanet classification of rare urogenital diseases | 222 |
| Orphanet classification of rare surgical maxillo-facial diseases | 214 |
| Classification of pediatric cancer (Functional) | 208 |
| Orphanet classification of rare infertility disorders | 160 |
| Orphanet classification of rare odontological diseases | 130 |
| Orphanet classification of rare systemic or rheumatologic diseases of childhood | 128 |
| Orphanet classification of rare surgical thoracic diseases | 97 |
| Orphanet classification of rare disorders due to toxic effects | 65 |
| Orphanet classification of rare teratologic disorders | 39 |
| Orphanet classification of rare allergic disease | 14 |
| Orphanet classification of rare disorder without a determined diagnosis | 1 |

### mondo por rama (un concepto puede estar en varias)

| Rama | Conceptos |
|---|---:|
| MONDO:7770008 disease by etiologic mechanism | 17811 |
| MONDO:7770007 disease by developmental or physiological process | 7323 |
| MONDO:0005071 nervous system disorder | 5536 |
| MONDO:0002254 syndromic disease | 3359 |
| MONDO:0002081 musculoskeletal system disorder | 3201 |
| MONDO:0002051 integumentary system disorder | 1710 |
| MONDO:0024458 disorder of visual system | 1701 |
| MONDO:0004995 cardiovascular disorder | 1629 |
| MONDO:0005151 endocrine system disorder | 1629 |
| MONDO:0005046 immune system disorder | 1589 |
| MONDO:0002022 disorder of orbital region | 1584 |
| MONDO:0005039 reproductive system disorder | 1485 |
| MONDO:0004335 digestive system disorder | 1432 |
| MONDO:0005570 hematologic disorder | 1341 |
| MONDO:0003900 connective tissue disorder | 914 |
| MONDO:0005087 respiratory system disorder | 804 |
| MONDO:0002118 urinary system disorder | 772 |
| MONDO:0024623 otorhinolaryngologic disease | 355 |
| MONDO:0002409 auditory system disorder | 345 |
| MONDO:0006858 mouth disorder | 296 |
| MONDO:0002657 breast disorder | 184 |

### doid por rama (un concepto puede estar en varias)

| Rama | Conceptos |
|---|---:|
| DOID:7 disease of anatomical entity | 9234 |
| DOID:630 genetic disease | 5236 |
| DOID:14566 disease of cellular proliferation | 2858 |
| DOID:225 syndrome | 1069 |
| DOID:0014667 disease of metabolism | 901 |
| DOID:150 disease of mental health | 625 |
| DOID:0080015 physical disorder | 620 |
| DOID:0050117 disease by infectious agent | 547 |

### ncit-disease por rama (un concepto puede estar en varias)

| Rama | Conceptos |
|---|---:|
| C27551 Disorder by Site | 18908 |
| C3262 Neoplasm | 15356 |
| C53529 Non-Neoplastic Disorder | 5418 |
| C4873 Rare Disorder | 1348 |
| C28193 Syndrome | 1257 |
| C89328 Pediatric Disorder | 1066 |
| C8278 Cancer-Related Condition | 629 |
| C3101 Genetic Disorder | 370 |
| C2893 Psychiatric Disorder | 262 |
| C3340 Polyp | 110 |
| C35470 Behavioral Disorder | 62 |
| C26684 Radiation-Induced Disorder | 27 |

### Cruces publicados (origen → destino, por equivalencia)

| Par | Equivalencias |
|---|---|
| doid → efo-disease | sin equivalencia declarada: 5 |
| doid → mesh | sin equivalencia declarada: 4100 |
| doid → ncit-disease | sin equivalencia declarada: 4750 |
| doid → omim | sin equivalencia declarada: 6236 |
| doid → orphanet | sin equivalencia declarada: 2357 |
| doid → umls | sin equivalencia declarada: 7218 |
| efo-disease → doid | sin equivalencia declarada: 126 |
| efo-disease → icd10-who | sin equivalencia declarada: 177 |
| efo-disease → mesh | sin equivalencia declarada: 300 |
| efo-disease → mondo | sin equivalencia declarada: 17 |
| efo-disease → ncit-disease | sin equivalencia declarada: 223 |
| efo-disease → omim | sin equivalencia declarada: 165 |
| efo-disease → orphanet | sin equivalencia declarada: 152 |
| efo-disease → umls | sin equivalencia declarada: 82 |
| icd10-who → icd11-mms | sin equivalencia declarada: 11649 |
| icd11-mms → icd10-who | sin equivalencia declarada: 16831 |
| icd11-mms → icd11-foundation | equivalent: 2193 |
| mondo → decipher | sin equivalencia declarada: 1 · equivalent: 60 |
| mondo → doid | equivalent: 11960 · sin equivalencia declarada: 124 |
| mondo → efo-disease | equivalent: 9 |
| mondo → icd10-who | equivalent: 209 |
| mondo → icd11-foundation | equivalent: 4628 · narrower: 2 · wider: 2 |
| mondo → mesh | equivalent: 8075 · sin equivalencia declarada: 25 · wider: 2 · narrower: 1 |
| mondo → ncit-disease | equivalent: 7106 · sin equivalencia declarada: 4 · narrower: 2 · wider: 2 · inexact: 1 |
| mondo → omim | equivalent: 10661 · sin equivalencia declarada: 136 |
| mondo → orphanet | equivalent: 9759 · sin equivalencia declarada: 708 |
| mondo → umls | equivalent: 21661 |
| ncit-disease → umls | sin equivalencia declarada: 13981 |
| orphanet → icd10-who | wider: 7034 · equivalent: 605 · narrower: 800 · inexact: 11 |
| orphanet → icd11-mms | wider: 5156 · equivalent: 1497 · narrower: 206 |
| orphanet → mesh | equivalent: 3209 |
| orphanet → mondo | equivalent: 8918 |
| orphanet → omim | equivalent: 3781 · narrower: 4138 · wider: 797 · inexact: 29 |
| orphanet → umls | equivalent: 9586 |

## 8. Licencias

| Fuente | Licencia | Estado |
|---|---|---|
| MONDO | CC BY 4.0 | Cargada, con atribución en `terminology_sources.license` |
| Orphanet | CC BY 4.0 | Cargada |
| DOID | CC0 1.0 | Cargada |
| NCI Thesaurus | **CC BY 4.0**, texto literal de `ThesaurusTermsofUse.htm` leído el 2026-10-28 (captura en `evidencia/C1/licencias-capturas-2026-10-28.txt`) | Cargada (subárbol C2991, 26.09d del archivo plano oficial de EVS), nombrada como subconjunto y no como la edición oficial |
| MeSH 2026 oficial | Uso libre con atribución a NLM («NLM freely provides MeSH data»; términos de `nlm.nih.gov/databases/download/terms_and_conditions_mesh.html`, capturados) | Cargada (árboles C y F03 + SCR clase 3), sólo inglés |
| MedlinePlus / MedlinePlus Genetics | Dominio público (obra del gobierno de EE. UU.), atribución pedida | Cargada (1 305 condiciones genéticas; pares MeSH → tema en español) |
| NANDO | **CC BY 4.0** (README del repo y `dcterms:license` dentro de `nando.ttl`) | Cargada |
| OncoTree | **CC BY 4.0** (sección License del README, capturada) | Cargada |
| GARD (NCATS/NIH) | Sin texto de licencia legible por HTTP (SPA; la política de NIH está tras Cloudflare) | **No se carga**: lector listo detrás de `--with-gard`; decisión del propietario |
| CIE-11 títulos en castellano (OMS) | CC BY-ND 3.0 IGO | **No se carga**: lector listo detrás de `--with-icd11-es`; el propietario excluyó la CIE-11 (la versión inglesa ya cargada es precedente previo) |
| CIE-11 MMS y tablas de correspondencia | CC BY-ND 3.0 IGO (OMS) | Cargada **sin modificar** (títulos verbatim; sin traducción ni agregados). Los títulos en castellano no están accesibles |
| EFO | Apache-2.0 | Cargada (clases propias) |
| Anotaciones HPO | Licencia HPO (uso libre con atribución) | Sólo identificadores |
| phenopacket-store | BSD-3-Clause | Sólo identificadores |
| OMIM | Registro + licencia | **Sin licencia** — sólo números MIM citados por otras fuentes |
| CIE-10 OMS (títulos) | Licencia OMS para uso comercial | **Sin licencia** — sólo códigos |
| CIE-10 OPS en castellano | OPS/OMS | **Sin licencia** (y host bloqueado) |
| UMLS / MedGen | Cuenta UTS + licencia | **Sin cuenta** — sólo CUI citados |
| SNOMED CT | Afiliación de país | **Excluido**: Bolivia no es miembro |
| MedDRA | Suscripción MSSO | **Excluido** — sólo como texto de referencia |
| DeCS | Formulario BIREME + token | **Sin token** |
| ICD-O-3 | Licencia OMS | **Sin licencia** (sin archivo accesible) |
| CIAP-2 / ICPC-2 | WONCA | **Sin licencia** (sin archivo accesible) |
| DSM | APA | Excluido |

## 9. Propuestas para el repo del modelo (`mantra-core-technologies/mantra-core-health-model`)

Nada de esto bloquea la carga; son mejoras para consultar el catálogo:

1. **Índice de texto para búsqueda en castellano**: `pg_trgm` + índice GIN
   sobre `terminology.concept_designations (value)` y
   `terminology.catalog_concepts (display)` (o `unaccent` + trigram). Hoy la
   búsqueda por texto en ~310 000 designaciones es un recorrido secuencial.
2. **Índice por clave natural de sistema**: la búsqueda de un concepto por
   `(code_systems.internal_code, code)` necesita dos joins; un índice sobre
   `catalog_concepts (code)` acelera los enlaces por código que harán otras
   sesiones (la unicidad ya existe por `(code_system_version_id, code)`).
3. **Índice sobre `concept_properties (property_code)`** si se van a filtrar
   conceptos por clasificación (`icd11_classification`, `orphanet_classification`).

## 10. Huecos

- **Castellano**: sólo Orphanet (11 645 conceptos, 6 868 definiciones). MONDO,
  DOID, NCIt, CIE-11 y EFO quedan en inglés: CIE-11 ES, CIE-10 OPS y DeCS no
  son accesibles o exigen licencia. Una traducción propia **no** se presenta
  como oficial y no se hizo.
- **Glosario**: el catálogo no se sumó a los value sets `glossary-*` (evita
  duplicar CIE-10-ES): mostrar Orphanet ES en
  `/glossary` exige una decisión de curación del propietario (qué categoría,
  cómo convive con CIE-10-ES).
- **Fuentes por encima de lo cargado** (§5): MeSH oficial (≥ 1 562 descriptores
  del árbol C sin cruce), GARD (≥ 2 598), NANDO (685), OncoTree (189).
- **CIE-11**: 9 códigos que Orphanet alinea ya no están en la MMS 2026-01;
  826 destinos poscoordinados de la tabla 10→11 no se reducen a un solo código.
- **Cruces sin destino** (`disease_unresolved_xrefs`): 2 376 xrefs de MONDO a
  clases EFO que EFO ya no tiene como propias, 677 hacia NCIt (fuera de C2991
  o retiradas), 35 entre MONDO, Orphanet y DOID y 24 de la tabla OMS 10→11 hacia
  códigos que ya no están en la CIE-11 2026-01.
- **NCIt**: la edición OBO 26.02d es la más nueva accesible; la de EVS puede ser
  posterior.
- **Literatura (PubMed / Europe PMC)**: no se pudo consultar (bloqueado).

## 11. Cómo reproducir

```sh
node tools/terminology-import/diseases/fetch-sources.mjs
node --max-old-space-size=2500 tools/terminology-import/diseases/build-catalog.mjs
node --max-old-space-size=2500 tools/terminology-import/diseases/coverage-report.mjs
node --max-old-space-size=2500 tools/terminology-import/diseases/load-catalog.mjs --dry-run
node --max-old-space-size=2500 tools/terminology-import/diseases/load-catalog.mjs
node --max-old-space-size=2500 tools/terminology-import/diseases/load-catalog.mjs --from-snapshot   # sin red: desde diseases/data/
node --test "tools/terminology-import/diseases/test/*.test.mjs"
```

## 12. Cierre de huecos del 2026-10-28 (carril C1)

Re-sondeo de cada host el 2026-10-28 (`docs/trabajo/2026-10-27-terminologia-cierre-huecos/evidencia/C1/sondeo-M1-resondeo-2026-10-28.txt`).
Las pasadas del 2026-10-24 daban por bloqueados `nlmpubs.nlm.nih.gov`, `evs.nci.nih.gov`, `icdcdn.who.int`,
`rarediseases.info.nih.gov` y `query.wikidata.org`: hoy responden los cinco.

| Hueco (§5/§10) | Estado hoy | Qué se hizo |
|---|---|---|
| MeSH oficial (árbol C, SCR de enfermedades raras) | `nlmpubs.nlm.nih.gov` 200 | **Cargado**: MeSH 2026 oficial, 12 490 conceptos (antes 9 320, todos claves sin nombre): 5 182 descriptores de los árboles C/F03 y 6 545 SCR clase 3 con nombre, sinónimos, nota de alcance y números de árbol; 7 963 aristas `is_a`; 834 enlaces a temas de MedlinePlus en español. 763 claves MeSH citadas por MONDO siguen sin nombre (`displayIsCode`): ya no existen en el MeSH 2026 de árboles C/F03 |
| NCIt más nuevo que la OBO Edition 26.02d | `evs.nci.nih.gov` 200 | **Cargado** el archivo plano oficial 26.09d: `ncit-disease` 22 379 → 22 854 y 645 `ncit-xref` (conceptos citados fuera de C2991 o retirados) |
| NANDO (licencia «sin declarar») | CC BY 4.0 en el README y en el propio `nando.ttl` | **Cargado**: 2 777 conceptos |
| OncoTree (licencia «sin declarar») | CC BY 4.0 en el README | **Cargado**: 898 conceptos |
| MedlinePlus Genetics | `medlineplus.gov` 200, dominio público | **Cargado**: 1 305 condiciones con sinónimos y descripción |
| Tablas OMS CIE-10 ↔ CIE-11 | `icdcdn.who.int` 200 | Reemplazadas por la release 2026-01 oficial (antes, copia de terceros 2025-01) |
| CIE-11 en castellano | `icdcdn.who.int` 200 (SHA-256 `7c7e5a02…`) | **No cargado**: CC BY-ND y exclusión del propietario; lector probado, flag `--with-icd11-es` |
| GARD oficial | `rarediseases.info.nih.gov` 200 | **No cargado**: sin texto de licencia verificable; lector probado, flag `--with-gard` (ver SOURCES.md) |
| Orphadata en castellano | 200; el repo oficial sólo tiene `es_product1/4/9`, `es_funct_consequences` | Sin novedad: `es_product1` ya cargado (mismo tamaño que `orphadata.com`); `es_product6` no existe (404); `es_product4` es de síntomas (C2) |
| CTD, OMIM, DeCS | CTD: verificación de navegador; OMIM y DeCS: 403 | Hueco de licencia/acceso, sin eludir |

### Antes / después (instantánea 2026-10-24 → 2026-10-28; conceptos / designaciones / is-a / alineamientos)

| Sistema | Antes | Después |
|---|---|---|
| mesh | 9 320 / 0 / 0 / 0 (sólo claves) | **12 490 / 42 487 / 7 963 / 14 509** |
| ncit-disease | 22 379 / 69 326 / 37 305 / 13 981 | 22 854 / 69 987 / 38 089 / 13 608 |
| ncit-xref | — | 645 / 1 633 / 0 / 564 |
| nando | — | 2 777 / 4 746 / 2 774 / 2 341 |
| oncotree | — | 898 / 898 / 897 / 1 360 |
| medlineplus-genetics | — | 1 305 / 7 656 / 0 / 8 638 |
| icd11-mms | 37 052 / 37 052 / 37 024 / 19 024 | 37 052 / 37 052 / 37 024 / 19 068 |
| mondo, doid, efo-disease, orphanet | sin cambio de conceptos | alineamientos de MONDO 77 343 → 80 490, DOID 28 366 → 28 696, EFO 1 244 → 1 341 (MeSH ahora resuelve) |
| omim, umls (claves) | 10 871 / 32 589 | 10 892 / 32 693 |
| **Total** | **184 896 / 311 525 / 147 963 / 197 374** | **194 291 / 369 606 / 160 381 / 228 021** |

Pasadas de saturación del 2026-10-28 (`data/diseases-coverage.md`): 25 pasadas. MeSH aporta 1 312 conceptos
sin cruce publicado hacia otra fuente (1 293 entidades), NANDO 685, OncoTree 195, NCIt 26.09d 14 880, ClinGen,
ClinVar, Alliance, CURE ID, Hetionet y Orphadata p6/p9 **0**, GenCC 2 (códigos que el catálogo ya tiene).
Dos pasadas seguidas en 0 por causa real (Orphadata p6 y p9) tras las últimas fuentes cargadas.

### Integridad en Postgres 16 desechable (`evidencia/C1/integridad-C1-salida.txt`)

Duplicados por (code system, versión, code): 0; entre versiones: 0. Huérfanos en designaciones, propiedades,
relaciones y mapas: 0; `replaced_by` huérfano: 0; auto-lazos `is_a`: 0; nombres o códigos vacíos: 0; designaciones
sin idioma: 0. Conceptos sin designación preferida: 763 `mesh` (claves citadas sin nombre en el MeSH 2026) y 2
`nando` (sólo etiqueta japonesa: el idioma `ja` no existe como concepto interno; queda en `display` y en
`nando_ja`). Procedencia (`disease_provenance`) en el 100 % de las filas de los 16 sistemas; SHA-256 de los
archivos de origen y licencia por sistema en `code_system_versions.checksum` y `terminology_sources.license`
(`evidencia/C1/procedencia-por-sistema.txt`). Segunda corrida: `+0` en todos los sistemas.

### Lo que sigue faltando

- **Castellano**: sigue siendo sólo Orphanet. El MeSH oficial es inglés; los títulos CIE-11 en castellano están
  listos pero detrás de una decisión del propietario.
- **GARD** (~16 000 enfermedades, nombres en castellano): decisión de licencia del propietario.
- **CIE-10 con títulos, OMIM, UMLS/MedGen, SNOMED CT, MedDRA, DeCS, ICD-O-3**: licencia.
- **CTD MEDIC, UniProt `humdisease`**: licencia sin texto verificable (CTD) / derivada de OMIM (UniProt).
