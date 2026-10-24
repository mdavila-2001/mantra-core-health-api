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

## Fuentes bloqueadas por la red del entorno (huecos)

La política de red de esta sesión responde **403 al CONNECT** para estos hosts (sondeo en
`cache/_network.json`, `fetch.mjs --probe`). Para cerrarlos hay que permitir el host en la
configuración de red del entorno y correr `fetch.mjs` + un normalizador nuevo para la fuente.

| Fuente | Host(s) | Licencia | Qué aportaría |
|---|---|---|---|
| ClinicalTrials.gov API v2 | `clinicaltrials.gov` | Dominio público (NLM) | Intervenciones `PROCEDURE`/`BEHAVIORAL`/`DEVICE`/`RADIATION`/`DIETARY_SUPPLEMENT` ↔ condición con MeSH, **solo «en estudio»** |
| ICD-10-PCS (tablas oficiales) | `www.cms.gov` | Dominio público (CMS) | Procedimiento → parte del cuerpo por el eje Body Part del propio código |
| WHO ICHI | `icd.who.int`, `icdcdn.who.int` | CC BY-ND 3.0 IGO | Procedimiento → Target (sitio/función) por eje del código |
| ICD-11 MMS | `id.who.int` (+ credenciales: no se crean cuentas) | CC BY-ND 3.0 IGO | Post-coordinación y relaciones |
| CUPS Colombia | `www.minsalud.gov.co`, `web.sispro.gov.co` | Acto administrativo público | Catálogo de procedimientos (lo carga `seed-specialty-services`) |
| MeSH | `nlmpubs.nlm.nih.gov`, `id.nlm.nih.gov` | Términos NLM | Árbol E; une intervenciones de ensayos con procedimientos |
| NCI Thesaurus oficial | `evs.nci.nih.gov` | CC BY 4.0 | Todos los roles (la edición OBO trae solo 438 de procedimiento) |
| PubMed / Europe PMC | `eutils.ncbi.nlm.nih.gov`, `www.ebi.ac.uk` | Metadatos | Detección de huecos |
| Wikidata | `query.wikidata.org` | CC0 | P924 «tratamiento posible» (colaborativa, no oficial) |
| NICE IPG | `www.nice.org.uk` | Términos NICE | Procedimiento ↔ indicación citada |
| Cochrane | `www.cochranelibrary.com` | Metadatos | Intervención ↔ condición de revisiones |
| Ministerio de Salud de Bolivia (NNAC) | `www.minsalud.gob.bo` | Por verificar | Guías nacionales citadas |
| CIE-10-ES Procedimientos | `www.sanidad.gob.es` | Aviso legal, reutilización con cita | Nombres oficiales en castellano de ICD-10-PCS |
