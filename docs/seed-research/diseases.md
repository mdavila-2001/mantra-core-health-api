# Catálogo exhaustivo de enfermedades — investigación, saturación y cobertura

Fecha de corte: **2026-10-24**. Importador: `tools/terminology-import/diseases/`
([README](../../tools/terminology-import/diseases/README.md),
[SOURCES.md](../../tools/terminology-import/diseases/SOURCES.md)).
Sin DDL: todo entra en las tablas existentes del módulo 03 `terminology`.

## 1. Resumen

| | |
|---|---|
| Sistemas con nomenclatura propia | `mondo`, `orphanet` (**castellano**), `doid`, `ncit-disease`, `icd11-mms`, `efo-disease` |
| Sistemas de clave cruzada (sólo código) | `omim`, `icd10-who`, `icd11-foundation`, `mesh`, `umls`, `decipher` |
| Conceptos | **183 313** (114 226 de nomenclatura + 69 087 claves) |
| Designaciones | 309 745 (25 942 en castellano, todas de Orphanet) |
| Aristas de jerarquía (`REL_IS_A`) | 147 251 |
| Alineamientos publicados (`concept_maps`) | 190 313 (+ los condicionales hacia `icd10cm` / CIE-10-ES si esos conceptos existen) |
| Propiedades | 491 228 |
| Peso en Postgres 16 (tablas + índices del módulo 03) | 419 MB la base de prueba completa; `concept_properties` 158 MB |
| Carga en base limpia / segunda corrida | 72 s / 43 s con **0 filas nuevas** (idempotente) |
| Saturación | **No alcanzada** con lo accesible: las últimas pasadas que aportan vienen de fuentes que no se pueden cargar (licencia sin declarar o sólo conversiones de terceros). Ver §5. |

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
| `mondo` | `MONDO:0005015` | 2026-10-06 | 27 185 | Enfermedades humanas de MONDO (sin animales no humanos ni «disease characteristic»); 3 921 obsoletas |
| `orphanet` | `558` (ORPHAcode, sin prefijo) | 2026-06-23 | 11 645 | Nomenclatura Orphanet con **nombre, sinónimos y definición en castellano**; 1 888 inactivas |
| `doid` | `DOID:9351` | 2026-09-30 | 14 854 | Human Disease Ontology; 2 519 obsoletas (los `alt_id` en `disease_alt_ids`) |
| `ncit-disease` | `C2985` | 26.02d | 22 379 | NCI Thesaurus, subárbol C2991 «Disease or Disorder» |
| `icd11-mms` | `5A11` · `BlockL1-1A0` · `chapter-01` · `mms-entity-<id>` | 2026-01 | 37 052 | CIE-11 MMS completa (capítulos 01–26, V y X) |
| `efo-disease` | `EFO:0000195` | 3.95.0 | 1 111 | Clases propias de EFO bajo «disease» |
| `omim` | `219700` · `PS219700` | `xref-keys` | 10 744 | Clave: número MIM citado por MONDO, Orphanet, DOID, EFO, HPO o phenopacket-store |
| `icd10-who` | `E84.0` · `A00-A09` · `I` | `xref-keys` | 12 639 | Clave: código CIE-10 OMS 2019 (todas las entidades de la tabla OMS 10→11 + las citadas) |
| `icd11-foundation` | `465177735` | `xref-keys` | 4 630 | Clave: entidad de la Fundación citada por MONDO/Orphanet |
| `mesh` | `D003920` | `xref-keys` | 8 863 | Clave: descriptor MeSH citado |
| `umls` | `C0011849` | `xref-keys` | 32 150 | Clave: CUI citado |
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
| 1 | MONDO 2026-10-06 | ontología | 23 264 vigentes | **23 264** | 8 870 clases de animales no humanos / «disease characteristic»; SNOMED CT entero |
| 2 | Orphanet ES 2026-06-23 | ontología | 9 757 | **1 551** | MedDRA como referencia; 1 060 alineamientos duplicados en el propio XML |
| 3 | DOID 2026-09-30 | ontología | 12 335 | **342** | SNOMED CT; GARD heredado como referencia |
| 4 | NCIt 26.02d (C2991) | ontología | 22 379 | **14 515** | 187 531 clases fuera de C2991 (fármacos, genes, hallazgos); la edición 2024-05 (más vieja) |
| 5 | CIE-11 MMS 2026-01 | ontología | 37 052 | **29 310** — 11 595 de los capítulos 01–26, 159 de V y 17 556 del cap. X (códigos de extensión) | CIE-11 en español (sin archivo oficial accesible); contenedor `whoicd/icd-api` |
| 6 | EFO 3.95.0 | ontología | 1 111 | **472** | 93 534 clases que no son enfermedad o que EFO importa de MONDO |
| 7 | Anotaciones HPO 2026-09-02 | claves citadas | 12 880 | **181** (OMIM sólo citados por HPO o sólo con NTBT/BTNT de Orphanet; DECIPHER) | nombres de OMIM (licencia) |
| 8 | NANDO (2024-07) | medida, no se carga | 2 768 | 693 | sin licencia declarada |
| 9 | phenopacket-store 0.1.27 | claves citadas | 780 | **1** (`OMIM:601674`) | — |
| 10 | OncoTree 2025-10-03 | medida, no se carga | 865 | 189 | sin licencia declarada |
| 11 | Hetionet v1.0 | medida | 137 | **0** | — (`DOID:9917` resuelve por `alt_id` a `DOID:5158`) |
| 12 | OMS, tabla 10→11 (códigos CIE-10 2019) | claves citadas | 12 597 | **887** (destino poscoordinado o sin categoría simple en la CIE-11 2026-01) | títulos CIE-10 (licencia comercial de la OMS) |
| 13 | MeSH 2025 árbol C (conversión PyOBO) | medida, no se carga | 5 067 | 1 585 | conversión de terceros sin números de árbol; oficial bloqueada. La cabeza C21 «Disorders of Environmental Origin» no se incluyó en la medida (no se pudo verificar su id): subestima. |
| 14 | GARD (conversión PyOBO) | medida, no se carga | 6 109 | 2 598 | sin licencia declarada; sin cruces publicados |

**Resultado.** Con las fuentes accesibles y cargables, **no se llegó a dos
pasadas seguidas con 0**: la 11 dio 0, pero la 12 (CIE-10 OMS) aportó 887
códigos, y las 13–14 siguen aportando desde fuentes que no se pueden cargar.
Lo que queda por encima de lo cargado es, por fuente:

- **MeSH oficial** (`nlmpubs.nlm.nih.gov`, desc2026.xml con números de árbol y
  SCR de enfermedades raras): libre con atribución; sólo falta abrir el host.
- **GARD oficial** (`rarediseases.info.nih.gov`, NCATS).
- **NANDO** y **OncoTree**: confirmar licencia con el editor.
- **CIE-10 OMS con títulos** y **CIE-10 OPS en español**: licencia de la OMS/OPS.
- **UMLS** (referencia amplia y MedGen): cuenta UTS del propietario.
- Literatura (PubMed / Europe PMC) para detectar huecos: `eutils.ncbi.nlm.nih.gov`
  y `www.ebi.ac.uk` bloqueados; no se pudo correr.

Iteración: las 14 pasadas se corrieron en esta sesión, una fuente nueva e
independiente por vez, hasta agotar las fuentes accesibles desde la red del
contenedor. Para seguir, abrir los hosts de arriba (Network access del entorno)
y agregar la fuente a `lib/sources.mjs` + `PASSES`.

### Cobertura contra una referencia amplia

- **MONDO como referencia**: 17 834 de las 23 264 clases vigentes de MONDO
  tienen al menos una equivalencia publicada hacia otro sistema cargado.
  Enlazados a MONDO: DOID 97,1 %, Orphanet 84,1 %, EFO 39,1 %, NCIt 35,0 %,
  CIE-11 MMS 20,7 % (las categorías de los caps. 22–26 y X casi no tienen
  correspondencia en MONDO: es esperable, son lesiones, causas externas,
  factores y extensiones).
- **UMLS**: pendiente para el propietario (cuenta UTS; no se creó).

## 6. Peso y consulta por sistema

Medido en Postgres 16 desechable (esquema `database/SQL/03_terminology` del
repo + los 12 conceptos internos que siembra la API), 2026-10-24.

| Sistema | Conceptos | Designaciones | Propiedades (filas / JSON) | `is_a` | Mapeos que origina | Para qué consulta sirve |
|---|---:|---:|---|---:|---:|---|
| `icd11-mms` | 37 052 | 37 052 | 74 739 / 19 MB | 37 024 | 19 023 | Clasificar y codificar (CIE-11), navegar capítulo → bloque → categoría; puente a CIE-10 |
| `mondo` | 27 185 | 110 080 | 108 518 / 8,9 MB | 35 577 | 74 071 | Concepto pivote: une OMIM, Orphanet, DOID, NCIt, MeSH, UMLS, CIE |
| `ncit-disease` | 22 379 | 69 326 | 67 134 / 4,7 MB | 37 305 | 13 981 | Oncología (15 356 bajo «Neoplasm») y sinónimos clínicos |
| `doid` | 14 854 | 37 793 | 49 959 / 4,1 MB | 17 479 | 24 668 | Clasificación etiológica / anatómica alternativa |
| `orphanet` | 11 645 | 52 894 | 49 011 / 9,6 MB | 19 711 | 45 748 | **Búsqueda en castellano** de enfermedades raras, con definición ES |
| `efo-disease` | 1 111 | 2 600 | 3 693 / 0,2 MB | 155 | 1 177 | Rasgos/enfermedades GWAS que no están en MONDO |
| `umls` (clave) | 32 150 | 0 | 64 300 / 7,6 MB | 0 | 0 (es destino) | Puente de deduplicación y enlace con fuentes que hablan en CUI. **Ninguna consulta de producto lo lee hoy**: si el propietario no lo necesita, se puede omitir con `--systems` (≈ 96 000 filas). |
| `icd10-who` (clave) | 12 639 | 0 | 25 278 / 3,0 MB | 0 | 11 649 | Códigos CIE-10 OMS (estándar del SNIS) ↔ CIE-11 |
| `omim` (clave) | 10 744 | 0 | 21 488 / 2,7 MB | 0 | 0 (es destino) | Enlace de las anotaciones HPO / síntomas |
| `mesh` (clave) | 8 863 | 0 | 17 726 / 2,0 MB | 0 | 0 (es destino) | Enlace con fuentes indexadas en MeSH |
| `icd11-foundation` (clave) | 4 630 | 0 | 9 260 / 1,0 MB | 0 | 0 (es destino) | Puente MONDO ↔ CIE-11 MMS |
| `decipher` (clave) | 61 | 0 | 122 | 0 | 0 | Enlace de las anotaciones HPO |

Fuera de la base: fuentes descargadas 1,3 GB y NDJSON intermedio 163 MB
(ambos fuera de git, en `glossary-data-build/`).

> **Búsqueda.** `concept_designations.value` y `catalog_concepts.display` no
> tienen índice de texto: una búsqueda `ILIKE '%…%'` recorre ~310 000
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
| 22 Injury, poisoning or certain other consequences of external causes | 30 | 1982 | 39 |
| 23 External causes of morbidity or mortality | 85 | 909 | 8 |
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
| efo-disease → icd10-who | sin equivalencia declarada: 120 |
| efo-disease → mesh | sin equivalencia declarada: 294 |
| efo-disease → mondo | sin equivalencia declarada: 16 |
| efo-disease → ncit-disease | sin equivalencia declarada: 223 |
| efo-disease → omim | sin equivalencia declarada: 164 |
| efo-disease → orphanet | sin equivalencia declarada: 152 |
| efo-disease → umls | sin equivalencia declarada: 82 |
| icd10-who → icd11-mms | sin equivalencia declarada: 11649 |
| icd11-mms → icd10-who | sin equivalencia declarada: 16831 |
| icd11-mms → icd11-foundation | equivalent: 2192 |
| mondo → decipher | sin equivalencia declarada: 1 · equivalent: 60 |
| mondo → doid | equivalent: 11881 · sin equivalencia declarada: 111 |
| mondo → efo-disease | equivalent: 9 |
| mondo → icd10-who | equivalent: 208 |
| mondo → icd11-foundation | equivalent: 4627 · narrower: 2 · wider: 2 |
| mondo → mesh | equivalent: 8007 · sin equivalencia declarada: 25 · wider: 2 · narrower: 1 |
| mondo → ncit-disease | equivalent: 7104 · sin equivalencia declarada: 4 · narrower: 2 · wider: 2 · inexact: 1 |
| mondo → omim | equivalent: 10235 · sin equivalencia declarada: 134 |
| mondo → orphanet | equivalent: 9740 · sin equivalencia declarada: 707 |
| mondo → umls | equivalent: 21204 |
| ncit-disease → umls | sin equivalencia declarada: 13981 |
| orphanet → icd10-who | wider: 7034 · equivalent: 605 · narrower: 800 · inexact: 11 |
| orphanet → icd11-mms | wider: 5156 · equivalent: 1497 · narrower: 206 |
| orphanet → mesh | equivalent: 3209 |
| orphanet → mondo | equivalent: 8899 |
| orphanet → omim | equivalent: 3781 · narrower: 4138 · wider: 797 · inexact: 29 |
| orphanet → umls | equivalent: 9586 |

## 8. Licencias

| Fuente | Licencia | Estado |
|---|---|---|
| MONDO | CC BY 4.0 | Cargada, con atribución en `terminology_sources.license` |
| Orphanet | CC BY 4.0 | Cargada |
| DOID | CC0 1.0 | Cargada |
| NCI Thesaurus | CC BY 4.0 | Cargada (subárbol C2991) |
| CIE-11 MMS y tablas de correspondencia | CC BY-ND 3.0 IGO (OMS) | Cargada **sin modificar** (títulos verbatim; sin traducción ni agregados). Los títulos en castellano no están accesibles |
| EFO | Apache-2.0 | Cargada (clases propias) |
| Anotaciones HPO | Licencia HPO (uso libre con atribución) | Sólo identificadores |
| phenopacket-store | BSD-3-Clause | Sólo identificadores |
| OMIM | Registro + licencia | **Pendiente** — sólo números MIM citados por otras fuentes |
| CIE-10 OMS (títulos) | Licencia OMS para uso comercial | **Pendiente** — sólo códigos |
| CIE-10 OPS en castellano | OPS/OMS | **Pendiente** (y host bloqueado) |
| UMLS / MedGen | Cuenta UTS + licencia | **Pendiente para el propietario** — sólo CUI citados |
| SNOMED CT | Afiliación de país | **Excluido**: Bolivia no es miembro |
| MedDRA | Suscripción MSSO | **Excluido** — sólo como texto de referencia |
| DeCS | Formulario BIREME + token | **Pendiente** |
| ICD-O-3 | Licencia OMS | **Pendiente** (sin archivo accesible) |
| CIAP-2 / ICPC-2 | WONCA | **Pendiente** (sin archivo accesible) |
| DSM | APA | Excluido |
| NANDO, OncoTree | No declarada en el repositorio | **Pendiente**: confirmar con el editor |

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
4. (Ya documentado en `tools/terminology-import/README.md`) resolver
   `ConceptsService.searchConcepts` con `JOIN`/`EXISTS` antes de sumar el
   catálogo de enfermedades a los value sets del glosario.

## 10. Huecos que quedan

- **Castellano**: sólo Orphanet (11 645 conceptos, 6 868 definiciones). MONDO,
  DOID, NCIt, CIE-11 y EFO quedan en inglés: CIE-11 ES, CIE-10 OPS y DeCS no
  son accesibles o exigen licencia. Una traducción propia **no** se presenta
  como oficial y no se hizo.
- **Glosario**: el catálogo no se sumó a los value sets `glossary-*` (evita
  duplicar CIE-10-ES y no agrava el `IN` de §9.4). Para mostrar Orphanet ES en
  `/glossary` hace falta decidir la curación (qué categoría, cómo convive con
  CIE-10-ES) — decisión del propietario.
- **Fuentes por encima de lo cargado** (§5): MeSH oficial (≥ 1 585 descriptores
  del árbol C sin cruce), GARD (≥ 2 598), NANDO (693), OncoTree (189).
- **CIE-11**: 9 códigos que Orphanet alinea ya no están en la MMS 2026-01;
  826 destinos poscoordinados de la tabla 10→11 no se reducen a un solo código.
- **Cruces sin destino** (`disease_unresolved_xrefs`): 2 366 xrefs de MONDO a
  clases EFO que EFO ya no tiene como propias, 641 hacia NCIt (fuera de C2991
  o retiradas), 54 entre MONDO, Orphanet y DOID y 24 de la tabla OMS 10→11 hacia
  códigos que ya no están en la CIE-11 2026-01.
- **NCIt**: la edición OBO 26.02d es la más nueva accesible; la de EVS puede ser
  posterior.
- **Literatura (PubMed / Europe PMC)**: no se pudo consultar (bloqueado).

## 11. Cómo reproducir

```sh
node tools/terminology-import/diseases/fetch-sources.mjs
node --max-old-space-size=8000 tools/terminology-import/diseases/build-catalog.mjs
node --max-old-space-size=8000 tools/terminology-import/diseases/coverage-report.mjs
node --max-old-space-size=8000 tools/terminology-import/diseases/load-catalog.mjs --dry-run
node --max-old-space-size=8000 tools/terminology-import/diseases/load-catalog.mjs
node --test "tools/terminology-import/diseases/test/*.test.mjs"
```
