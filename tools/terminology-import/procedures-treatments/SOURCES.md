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
| `mondo` | Monarch Initiative — Mondo Disease Ontology | `releases/2026-10-06` | `github.com/monarch-initiative/mondo/releases/download/v2026-10-06/mondo.obo` | `2631e8e1…` | CC BY 4.0 | Equivalencias `MONDO:equivalentTo` de las 167 enfermedades enlazadas (ICD-10-CM, MeSH, Orphanet, OMIM, NCIt, DOID, ICD-11 Foundation) |
| `uberon` | Uberon consortium (OBO Foundry) | `releases/2026-10-01` | `github.com/obophenotype/uberon/releases/download/v2026-10-01/uberon.obo` | `d4751a15…` | CC BY 3.0 | Xrefs Uberon → NCIt (sitio NCIt expresado en Uberon, solo uno a uno) y Uberon → FMA/MeSH |
| `icd10pcs-cms-2027` | CMS (EE. UU.) | ICD-10-PCS FY2027 (Last-Modified 2026-06-05) | `cms.gov/files/zip/2027-icd-10-pcs-code-tables-index.zip` (+ `codes`, `order`) | `db77f8b9…` (tables) | Obra del gobierno federal de EE. UU.: dominio público | 79 256 códigos con título corto y largo; 1 745 sitios por el eje del propio código (Body Part, Body System, Treatment Site…) = 79 169 afirmaciones procedimiento → sitio |
| `cie10es-procedimientos` | Ministerio de Sanidad (España) | CIE-10-ES Procedimientos 2026 (Last-Modified 2025-12-16) | `sanidad.gob.es/…/CIE10/2026/Procedimientos_Tabla_Referencia_CIE10ES_2026.xlsx` | `8c091285…` | Aviso legal: reutilización (también comercial) citando fuente y fecha, sin desnaturalizar el contenido | 78 869 designaciones oficiales en castellano de ICD-10-PCS (verbatim) |
| `mesh-desc-2026` | NLM (EE. UU.) | MeSH 2026, DTD 20260101 | `nlmpubs.nlm.nih.gov/projects/mesh/MESH_FILES/xmlmesh/desc2026.gz` | `ccd4d0d3…` | Términos de NLM: sin cargo; reconocer a NLM, no sugerir respaldo, identificar la versión | 2 001 descriptores de procedimiento del árbol E (E01, E02 sin E02.319, E03, E04, E06) con nota de alcance verbatim |
| `clinicaltrials-gov` | NLM (EE. UU.) | API 2.0.5, dataTimestamp 2026-10-27T09:00:04 | `clinicaltrials.gov/api/v2/studies` (consulta y campos en el meta) | `f313e9e4…` (studies.ndjson) | Dominio público (NLM) | 152 647 estudios leídos, 50 290 con MeSH de intervención y de condición; 29 697 pares «en estudio» (clase `investigational`, no es indicación) |

Atribución: «Oral Health and Disease Ontology (OHD), CC BY 4.0»; «Contains data from the Medical Action Ontology (MAxO) and MAxO annotations, Monarch Initiative,
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

## Huecos y estado de red (re-sondeo 2026-10-28)

Cerrados desde la pasada anterior (hoy responden 200): ICD-10-PCS (`www.cms.gov`), ClinicalTrials.gov, MeSH
(`nlmpubs.nlm.nih.gov`), CIE-10-ES (`www.sanidad.gob.es`), `evs.nci.nih.gov`, `www.minsalud.gov.co`.

| Fuente | Estado hoy | Licencia | Qué falta |
|---|---|---|---|
| WHO ICHI | `icd.who.int` 302, `icdcdn.who.int` 400: sin descarga abierta | CC BY-ND 3.0 IGO (ND: no se redistribuyen derivados) | decisión del propietario + acceso |
| ICD-11 MMS | `id.who.int` 404; API con cuenta (no se crean) | CC BY-ND 3.0 IGO | cuenta + decisión |
| CUPS Colombia | `datos.gov.co` 200; lo carga `specialty-services` (CUPS 2025) y `lab-tests` (capa CC BY-SA, gated) | acto administrativo / CC BY-SA 4.0 | decisión del propietario sobre CC BY-SA |
| NCIt oficial (todos los roles) | `evs.nci.nih.gov` 200; no se normalizó (la edición OBO trae 438 roles de procedimiento) | CC BY 4.0 | normalizador contra el archivo real (C1 ya baja NCIt EVS) |
| Wikidata P924, NICE IPG, Cochrane, PubMed | no usados (colaborativa / términos propios / metadatos) | variadas | curaduría |
| Ministerio de Salud de Bolivia (NNAC) | `minsalud.gob.bo` sin respuesta | por verificar | acceso |
| SNOMED CT, CPT, CDT | licencia | — | no se cargan |
