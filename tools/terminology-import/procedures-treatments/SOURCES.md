# Fuentes — procedimientos y tratamientos no farmacológicos

Las descargas se hacen en `../glossary-data-build/procedures-treatments/cache/<fuente>/` (redefinible con
`PROCEDURES_BUILD_DIR`), cada una con su `meta.json`: URL fijada por commit o tag, sha256, tamaño y fecha.

**Respaldo en git** (orden del propietario, 2026-10-24: «que lo lleven todo a la nube»): `snapshot.mjs`
copia a [`data/`](./data/) el corpus normalizado (`out/*.ndjson.gz`, `coverage.json.gz`), los `meta.json`
de cada fuente, el último sondeo de red y los **crudos chicos** (MAxO, POET y OHD, < 10 MB, CC BY 4.0).
Los crudos grandes (NCIt 283 MB, MONDO 53 MB, Uberon 23 MB) **no se suben**: `fetch.mjs <fuente>` los
vuelve a bajar del mismo tag y `data/MANIFEST.json` guarda su URL y sha256 para verificarlos. gzip
determinista: re-correr `snapshot.mjs` sobre el mismo corpus no genera cambios en git.

## Fuentes usadas (descargadas y normalizadas)

| Fuente (`cache/`) | Editor | Versión usada | URL fijada | sha256 | Licencia | Qué aporta |
|---|---|---|---|---|---|---|
| `maxo` | Monarch Initiative — Medical Action Ontology | `2026-01-15` (git `59b5d75a454f`) | `raw.githubusercontent.com/monarch-initiative/MAxO/59b5d75a…/maxo.obo` | `005178e6…` | CC BY 4.0 | 1 576 procedimientos no farmacológicos (1 930 términos vigentes; 354 farmacológicos excluidos); 15 sitios por axioma `RO:0002233 has input` → UBERON; 305 xrefs publicados a NCIt/MeSH |
| `maxo-annotations` | Monarch Initiative — curación POET | git `42edd966faac` | `raw.githubusercontent.com/monarch-initiative/maxo-annotations/42edd966…/data/poet/annotations.tsv` | `92e6dcfe…` | CC BY 4.0 | 293 afirmaciones procedimiento → enfermedad (MONDO) con PMID, tipo literal `TREATS`/`PREVENTS`/`NO_OBSERVED_BENEFIT`; 145 filas farmacológicas excluidas |
| `ncit-obo` | NCIt OBO Edition (derivada de NCI Thesaurus, NCI EVS) | NCIt `24.04e` (`releases/2024-05-07`) | `github.com/NCI-Thesaurus/thesaurus-obo-edition/releases/download/v2024-05-07/ncit.obo` | `e90ebb7e…` | CC BY 4.0 (términos de uso de NCIt) | 331 procedimientos NCIt; 438 roles procedimiento → anatomía (R163, R165–R171) |
| `ohd` | OHD project — Oral Health and Disease Ontology (OBO Foundry) | `releases/2026-10-01` (git `9cbaa1a17270`) | `raw.githubusercontent.com/oral-health-and-disease-ontologies/ohd-ontology/9cbaa1a1…/ohd.obo` | `f8518e5b…` | CC BY 4.0 | 81 procedimientos odontológicos (descendientes de `OHD:0000002` «dental procedure»); 0 relaciones (pasada 2) |
| `ncit-evs` | NCI Enterprise Vocabulary Services — NCI Thesaurus **edición oficial** | `26.09d` (Last-Modified 2026-09-30) | `evs.nci.nih.gov/ftp1/NCI_Thesaurus/Thesaurus.OWL.zip` | `a6b0897d…` | CC BY 4.0 | 346 procedimientos NCIt; 450 roles procedimiento → anatomía (R163, R165–R171); 0 R180 (pasada 5) |
| `icd10pcs` | CMS — ICD-10-PCS FY2027, tablas e índice + archivo de orden (títulos largos) | FY2027 (vigente desde 2026-10-01; archivos del 2026-06-05) | `www.cms.gov/files/zip/2027-icd-10-pcs-code-tables-index.zip` y `…/2027-icd-10-pcs-order-file-long-abbreviated-titles.zip` | `db77f8b9…`, `c9064c5c…` | Dominio público (EE. UU.) | 79 169 procedimientos con título oficial; 79 169 relaciones procedimiento → eje 4 (parte del cuerpo / región / sitio de tratamiento / sistema) por definición del código; 1 692 valores de eje (pasada 5) |
| `mesh` | NLM — MeSH 2026, descriptores | `desc2026.xml` (Last-Modified 2026-08-12) | `nlmpubs.nlm.nih.gov/projects/mesh/MESH_FILES/xmlmesh/desc2026.gz` | `ccd4d0d3…` | Términos de uso de MeSH (sin cargo, con atribución) | Clasificación por árbol (`lib/sources/mesh.mjs`): 1 526 intervenciones no farmacológicas usadas (E01.370, E02 bajo su raíz, E03, E04, E06, E07 o F04.754; sin E05 —métodos de investigación—, sin conceptos de estrategia/tiempo de E02/E04, sin insumos de laboratorio de E07, sin subárboles farmacológicos ni D); condiciones = árbol C o F03 |
| `ctgov` | NLM — ClinicalTrials.gov API v2 | API 2.0.5, datos del 2026-10-23T09:00:04 | `clinicaltrials.gov/api/v2/studies` (464 253 estudios intervencionales, 465 páginas) | — (API; extracto exacto en `data/raw/ctgov/`) | Dominio público (NLM); términos de uso de ClinicalTrials.gov | 34 083 relaciones intervención MeSH ↔ condición MeSH **«en estudio»** con todos los NCT de respaldo (40 539 estudios aportan un par) (pasada 5, cifra corregida en la 6 al depurar la clasificación MeSH) |
| `wikidata-p924` | Comunidad de Wikidata — P924 «possible treatment» | consulta SPARQL del 2026-10-24T16:49Z | `query.wikidata.org/sparql` (consulta en `meta.json`) | `f230c469…` | CC0 1.0 | 45 relaciones procedimiento → enfermedad de declaraciones **con referencia real** (P248 o P854); fuente colaborativa, no oficial, con su propio tipo (pasada 5) |
| `pubmed-cochrane` | NLM (indexación MeSH de MEDLINE) — revisiones de «Cochrane Database Syst Rev» | PubMed, consulta del 2026-10-24T17:17Z (17 554 registros, 3 particiones por fecha) | `eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi` (metadatos en `data/raw/pubmed-cochrane/`) | — | Metadatos bibliográficos e indexación MeSH de MEDLINE (NLM); sin texto de las revisiones | 8 075 relaciones procedimiento ↔ condición «evaluados en revisiones sistemáticas Cochrane»: intervención no farmacológica × condición con calificador therapy/surgery/rehabilitation/diet therapy/radiotherapy/prevention & control (5 886 revisiones aportan un par; 13 retractadas excluidas) (pasada 6) |
| `pubmed-guidelines` | NLM (indexación MeSH de MEDLINE) — guías de práctica clínica (tipos de publicación `Guideline` / `Practice Guideline`) | PubMed, consulta del 2026-10-24T17:29Z (44 031 en la búsqueda; 42 934 artículos de revista; 47 particiones por fecha de alta `[EDAT]`) | `eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi` (metadatos en `data/raw/pubmed-guidelines/`) | — | Metadatos bibliográficos e indexación MeSH de MEDLINE (NLM); sin texto de las guías | 25 469 relaciones procedimiento ↔ condición «tratados en guías de práctica clínica» (no implica recomendación): mismo criterio que Cochrane (13 197 guías aportan un par; 30 retractadas excluidas). Los 1 097 registros restantes son libros de Bookshelf (`PubmedBookArticle`), sin indexación MeSH de artículo: contados página por página en 170 páginas (`books.json` del caché) al revalidar con `fetch-pubmed.mjs` el 2026-10-24T21:22Z, no inferidos del filtro `pubmed books[filter]` (que en las revisiones marca 658 registros y ninguno llegó como libro) (pasada 7) |
| `pubmed-rct` | NLM (indexación MeSH de MEDLINE) — ensayos controlados aleatorizados publicados (tipo de publicación `Randomized Controlled Trial`) | PubMed, consulta del 2026-10-24T17:52Z (673 366 registros, 403 particiones por fecha de alta `[EDAT]`) | `eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi`; crudo de 51 MB comprimido **no subido** (`MANIFEST.json` → `omittedRaw`, con la búsqueda exacta y el comando para repetirla) | — | Metadatos bibliográficos e indexación MeSH de MEDLINE (NLM); sin texto de los artículos | 119 465 relaciones procedimiento ↔ condición **«En estudio»** (`investigational`): mismo criterio que Cochrane y las guías (208 351 ensayos aportan un par; 1 330 retractados excluidos) (pasada 8) |
| `pubmed-reviews` | NLM (indexación MeSH de MEDLINE) — revisiones sistemáticas y metaanálisis, sin la revista Cochrane (`Systematic Review` / `Meta-Analysis` NOT `"Cochrane Database Syst Rev"[Journal]`) | PubMed, consulta del 2026-10-24T21:19Z (423 482 registros, 206 particiones por fecha de alta `[EDAT]`; una página truncada se repitió y el total cierra) | `eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi`; crudo de 23 MB comprimido **no subido** (`MANIFEST.json` → `omittedRaw`) | — | Metadatos bibliográficos e indexación MeSH de MEDLINE (NLM); sin texto de los artículos | 62 308 relaciones procedimiento ↔ condición «evaluados en revisiones sistemáticas o metaanálisis» (`literature-indexing`; no implica eficacia ni indicación): 95 676 revisiones aportan un par; 882 retractadas excluidas (pasada 9) |
| `pubmed-trials` | NLM (indexación MeSH de MEDLINE) — ensayos clínicos no aleatorizados (`Clinical Trial` NOT `Randomized Controlled Trial`) | PubMed, consulta del 2026-10-24T19:53Z (389 365 registros, 220 particiones por fecha de alta `[EDAT]`) | `eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi`; crudo de 29 MB comprimido **no subido** (`MANIFEST.json` → `omittedRaw`) | — | Metadatos bibliográficos e indexación MeSH de MEDLINE (NLM); sin texto de los artículos | 96 237 relaciones procedimiento ↔ condición **«En estudio»** (`investigational`): 99 486 ensayos aportan un par; 171 retractados excluidos (pasada 10) |
| `mondo` | Monarch Initiative — Mondo Disease Ontology | `releases/2026-10-06` | `github.com/monarch-initiative/mondo/releases/download/v2026-10-06/mondo.obo` | `2631e8e1…` | CC BY 4.0 | Equivalencias `MONDO:equivalentTo` de las enfermedades MONDO enlazadas (174 tras la pasada 5) (ICD-10-CM, MeSH, Orphanet, OMIM, NCIt, DOID, ICD-11 Foundation) |
| `uberon` | Uberon consortium (OBO Foundry) | `releases/2026-10-01` | `github.com/obophenotype/uberon/releases/download/v2026-10-01/uberon.obo` | `d4751a15…` | CC BY 3.0 | Xrefs Uberon → NCIt (sitio NCIt expresado en Uberon, solo uno a uno) y Uberon → FMA/MeSH |

Atribución: «Contains data from MeSH and ClinicalTrials.gov, U.S. National Library of Medicine» (versiones arriba; no implica respaldo de NLM); «ICD-10-PCS, CMS»; «Oral Health and Disease Ontology (OHD), CC BY 4.0»; «Contains data from the Medical Action Ontology (MAxO) and MAxO annotations, Monarch Initiative,
CC BY 4.0»; «NCI Thesaurus, National Cancer Institute (OBO Edition), CC BY 4.0» — la edición OBO es un
derivado y no se presenta como la edición oficial de NCI; «Mondo Disease Ontology, CC BY 4.0»; «Uberon, CC BY 3.0».

## Fuentes descartadas (con motivo)

| Fuente | Motivo |
|---|---|
| `maxo-annotations/data/automaxo/*` | Extracción automática de resúmenes (pipeline AutoMAxO): la consigna prohíbe relaciones generadas por un modelo. |
| `maxo-annotations/data/poet/maxo_diagnostic_annotations.tsv` | Relaciona fenotipos HPO con acciones diagnósticas (`is_observable_through`), no procedimiento ↔ enfermedad. Fuera del alcance de las dos relaciones pedidas. |
| NCIt R172 `Regimen_Has_Accepted_Use_For_Disease` | Regímenes de quimioterapia: fármacos, de la sesión `justin/seed-drug-treatments`. |
| SNOMED CT (xrefs `SCTID` en MONDO/Uberon/MAxO) | Bolivia no es miembro de SNOMED International: no se cargan ni se usan para resolver. |
| CPT | Propiedad de la AMA. No se usa. |
| NLM MEDLINE Co-Occurrences (MRCOC) | NLM retiró el producto: la página redirige a su archivo en Archive-It (desde 2024-12). Pasada 6. |
| CDT (términos `CDT:` dentro de OHD) | Códigos de facturación odontológica de la ADA, con copyright: no se cargan aunque OHD los incluya. |
| SCDO — Sickle Cell Disease Ontology (`scdodev/scdo-ontology`, release 2021-04-15) | Tiene 286 relaciones `SCDO:1000018 treats` (cirugía, transfusión, fisioterapia, trasplante… → complicaciones de la drepanocitosis), pero la licencia declarada es **GPL-3.0**: incorporarlas en una base propietaria es una decisión del propietario. Hueco por licencia (pasada 2). |
| CIDO — Coronavirus Infectious Disease Ontology (git `d1ebe2ef`) | La propiedad `CIDO_0000012 treatment for` se usa una sola vez (clase «COVID-19 treatment», sustancias): 0 relaciones procedimiento ↔ enfermedad o sitio (pasada 2). |
| EFO 3.95.0 (`EBISPOT/efo`, release) | Sus `has input`/`has specified input` apuntan a CHEBI/CL/OBI: 0 relaciones procedimiento → UBERON o → enfermedad (pasada 2). |
| WHO SMART Guidelines (`WorldHealthOrganization/smart-anc`, `smart-hiv`, `smart-immunizations`…) | Usan ~25 códigos ICHI con su nombre oficial, pero dentro de lógica de decisión (PlanDefinition/CQL): extraer «procedimiento para la condición X» exigiría interpretar la lógica, no leer una relación publicada. Sin la clasificación ICHI (bloqueada) tampoco dan el eje Target. (pasada 2) |
| Espejos de terceros de fuentes oficiales (GitHub/PyPI de particulares) | No son el editor: procedencia no verificable. |
| WebFetch como transporte de datos | Pasa el contenido por un modelo antes de devolverlo: no garantiza fidelidad. Solo se usa para descubrir y leer licencias. |
| OGMS, ONS, ONE (OBO Foundry, git HEAD 2026-10-24) | Sin procedimientos clínicos con relación a enfermedad o anatomía (dietas de diseño de estudios; fermentación de alimentos). Pasada 3. |
| Disease Ontology `releases/2026-09-30` (CC0) | Solo `is_a` y `has material basis in`: no relaciona tratamientos. Pasada 4. |
| HPO `releases/2026-09-01` | 0 relaciones hacia MAxO o procedimientos. Pasada 4. |
| Relaciones propias de MONDO | 7 `therapeutic uses` (fármaco → CHEBI) y 3 `NCIT:R163` ya presentes por NCIt. Pasada 4. |
| Registros de ensayos fuera de ClinicalTrials.gov: ISRCTN, ICTRP (OMS), DRKS, ChiCTR, UMIN, CRIS, PACTR, SLCTR, REPEC (Perú) | Condición e intervención en **texto libre** (ISRCTN: `<condition><description>` y una clase general como «Surgery»; sin códigos MeSH ni de otro sistema). Asignarles códigos sería inventar un mapeo. Verificado con la API de ISRCTN el 2026-10-24. Pasada 8. |
| EU Clinical Trials Register / CTIS | El registro es de ensayos con medicamentos (Directiva 2001/20/CE y Reglamento 536/2014): no aporta intervenciones no farmacológicas; además `euclinicaltrials.eu` responde 403. Pasada 8. |
| ANZCTR, CTRI (India), jRCT, IRCT (Irán), ReBEC (Brasil), registro neerlandés, RPCEC (Cuba) | No responden desde este entorno (403, 502 en el túnel o conexión cortada). Mismo formato de texto libre en los que se conocen. Pasada 8. |

## Red del entorno y huecos que quedan

Hasta el 2026-10-24 16:29 UTC la política de red solo dejaba salir a GitHub, npm y PyPI (pasadas 1–4).
Desde entonces el entorno tiene red completa; el sondeo de `fetch.mjs --probe` (copiado en
`data/sources/_network.json`) responde para ClinicalTrials.gov, CMS, OMS, MinSalud CO, NLM, NCI EVS,
EBI, Wikidata, NICE y Sanidad ES. Quedan como huecos:

| Fuente | Estado | Motivo |
|---|---|---|
| WHO ICHI | hueco | La OMS publica ICHI en un navegador web; la descarga y la API exigen registro (cuenta). No se crean cuentas ni se raspan los endpoints internos del navegador. |
| ICD-11 MMS (relaciones, post-coordinación) | hueco | La API exige credenciales de registro. |
| Cochrane Library (sitio) | cubierta por PubMed | `www.cochranelibrary.com` responde 403; los metadatos de las revisiones se toman de MEDLINE (fila `pubmed-cochrane`). |
| Ministerio de Salud de Bolivia (NNAC) | hueco | `www.minsalud.gob.bo` no responde (respuesta vacía). |
| CUPS Colombia (catálogo completo) | descartada | Solo agrega códigos de procedimiento sin eje anatómico ni relación con enfermedades; el catálogo es de `seed-specialty-services`. |
| NICE interventional procedures guidance | descartada | Relaciona procedimiento e indicación por nombre en el título; no publica códigos en una forma reutilizable sin cuenta (OPCS-4 exige TRUD). Unir por nombre está prohibido. |
| CIE-10-ES Procedimientos (Sanidad) | sin aporte por código | Aporta nombres oficiales en castellano de ICD-10-PCS, no códigos ni relaciones nuevas; ya los carga la capa `cie10es-procedimientos` del glosario. |
