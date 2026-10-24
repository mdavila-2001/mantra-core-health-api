# Fuentes del catálogo de enfermedades

Registro de cada archivo que usa `tools/terminology-import/diseases/` (definido en
`lib/sources.mjs`). Los archivos viven **fuera de git**, en
`<GLOSSARY_BUILD_DIR>/diseases-sources/` (por defecto `../glossary-data-build/`),
y `fetch-sources.mjs` deja su SHA-256 y fecha en `diseases-sources/manifest.json`.
Descarga verificada el **2026-10-24**.

> **Red de la sesión que armó esto.** El proxy bloqueaba `www.orphadata.com`,
> `icd.who.int`, `id.who.int`, `icdcdn.who.int`, `www.nlm.nih.gov`,
> `nlmpubs.nlm.nih.gov`, `evs.nci.nih.gov`, `omim.org`, `decs.bvsalud.org`,
> `query.wikidata.org`, `www.ebi.ac.uk`, `eutils.ncbi.nlm.nih.gov`,
> `ftp.ncbi.nlm.nih.gov`, `purl.obolibrary.org`, `zenodo.org`,
> `rarediseases.info.nih.gov`, `rest.uniprot.org`, `reactome.org`, `paho.org`
> y `bioportal`. Por eso varias fuentes se toman del **espejo oficial en GitHub**
> del editor, o de una copia de terceros del archivo oficial **verificada por
> hash**. Con esos hosts abiertos, las URL oficiales de la columna
> «Oficial» sirven igual: el contenido es el mismo.

## Cargadas

| Clave (`manifest`) | Editor | Versión | Archivo / URL usada | Oficial | SHA-256 | Licencia | Qué se toma |
|---|---|---|---|---|---|---|---|
| `mondo` | Monarch Initiative | 2026-10-06 | [mondo.obo](https://github.com/monarch-initiative/mondo/releases/download/v2026-10-06/mondo.obo) (release de GitHub) | ídem | `2631e8e165d41def1a46749adb1ce0a336c8aba7f6bc0978729592cee8fed60b` | CC BY 4.0 | Clases MONDO de enfermedad humana: nombre, sinónimos, definición, `is_a`, xrefs con su anotación, obsolescencia |
| `orphanet-es-product1` | Orphanet (INSERM US14) | 2026-06-23 | [es_product1.xml](https://media.githubusercontent.com/media/Orphanet/Orphadata_aggregated/master/Rare%20diseases%20and%20classifications/Cross-referencing%20of%20rare%20diseases/XML/es_product1.xml) — repo oficial `Orphanet/Orphadata_aggregated` (Git LFS) | orphadata.com | `3eb547bb9aa0429bd8a05e55ea2c539a72b502a969325b1b5adeb601ab448ee0` | CC BY 4.0 | **Nombre, sinónimos y definición en castellano**; tipo, grupo, banderas; alineamientos ICD-10/ICD-11/OMIM/UMLS/MeSH/MONDO con su relación (E/NTBT/BTNT/ND) y estado de validación |
| `orphanet-en-product1` | Orphanet | 2026-06-23 | `en_product1.xml` (mismo repo) | orphadata.com | `df8d562a0c6011af36a74eb4000ce81ca7d723e8031010819fb71727c0962bbb` | CC BY 4.0 | Nombre y sinónimos en inglés (designaciones EN) |
| `orphanet-en-product7` | Orphanet | 2026-06-23 | `en_product7.xml` (mismo repo) | orphadata.com | `63d0e31a72141a9efe6746f8fd82c2bae67b4212809a49557a2229fe02cc4a74` | CC BY 4.0 | Padre preferencial (linealización) |
| `orphanet-en-product3-<n>` (35) | Orphanet | 2026-06-23 | `en_product3_<n>.xml` (mismo repo) | orphadata.com | ver `manifest.json` | CC BY 4.0 | Las 35 clasificaciones por especialidad (aristas padre→hijo) |
| `doid` | Disease Ontology (UMSOM) | 2026-09-30 | [doid.obo del tag v2026-09-30](https://raw.githubusercontent.com/DiseaseOntology/HumanDiseaseOntology/v2026-09-30/src/ontology/doid.obo) | ídem | `51e717b6b9f5d391f2793f9e16faf9c8629a661ab8f21c3a024458129f182ad2` | CC0 1.0 | Todo DOID: nombre, sinónimos, definición, `is_a`, xrefs, `alt_id` |
| `ncit` | NCI Thesaurus OBO Edition | 26.02d (2026-03-19) | [ncit.obo](https://github.com/ncit-obo-org/ncit-obo-edition/releases/download/v2026-03-19/ncit.obo) | evs.nci.nih.gov | `8fdc2d29c9ebd91ada8330ed023b0c56ae787a31e6aedff453ee9bfef6fc18f6` | CC BY 4.0 | Sólo el subárbol **C2991 Disease or Disorder**; UMLS CUI (P207) y tipo semántico (P106) |
| `icd11-mms` | OMS | 2026-01 (17-ene-2026) | [catalog.zip](https://raw.githubusercontent.com/Wulfgardr/mediflow/3fa8899af07bbf70e802c9f2b01607820bd437c7/assets/reference-data/icd11/catalog.zip) — copia de terceros **sin modificar** | `icdcdn.who.int/static/releasefiles/2026-01/SimpleTabulation-ICD-11-MMS-en.zip` | `f1356588f40953a83e3af2b662deab47c5e269f944d1ea4ed0cfeb2007c7cd39` (= el publicado en el `manifest.json` del repo; `fetch-sources.mjs` lo exige) | CC BY-ND 3.0 IGO | Tabulación simple en **inglés**: 28 capítulos, 1 360 bloques, 35 664 categorías, con padre, residuales, notas de codificación y agrupaciones. Incluye el cap. 26 (medicina tradicional) y X (extensiones) |
| `icd11-to-icd10` | OMS | 2025-01 (24-ene-2025) | [11To10MapToOneCategory.txt](https://raw.githubusercontent.com/drguptavivek/DigitVA/9aeff9688e1a9951a102e03a2768a067fdd22c9b/docs/icd-causegrp-mappings/migration-artifacts/icd11-icd10-mapping-tables-2025-01-base-2026-09-16/11To10MapToOneCategory.txt) — copia de terceros «extraída sin cambios» | `icdcdn.who.int/static/releasefiles/2025-01/mapping.zip` | `49737c349dd7a831c1c3f8e40d2281dbb26c989a4a880b398b2f93118002b0e9` (MD5 `38e12635dc3602950740d6c2bb13eda8` = el que publica el repo) | CC BY-ND 3.0 IGO | Sólo los pares código CIE-11 → código CIE-10 (los títulos CIE-10 no se cargan) |
| `icd10-to-icd11` | OMS | 2025-01 | `10To11MapToOneCategory.txt` (mismo repo y carpeta) | ídem | `1af732d79829d1752457bcc5d254098e576f19ac8f447534ce31744c873224e7` (MD5 `baae34f03596f46d198169b7bf94c0ea` = el publicado) | CC BY-ND 3.0 IGO | Sólo los códigos CIE-10 2019 y su destino CIE-11 |
| `efo` | EMBL-EBI | 3.95.0 | [efo.obo](https://github.com/EBISPOT/efo/releases/download/v3.95.0/efo.obo) | ídem | `062edb95420a0556affa61e252a4ef316cfba4bc42dd10f01ae8b90e7434ad14` | Apache-2.0 | Sólo clases propias `EFO_` bajo «disease» (MONDO:0000001) |
| `hpo-annotations` | HPO (Monarch / JAX) | 2026-09-02 (hp 2026-09-01) | [phenotype.hpoa](https://github.com/obophenotype/human-phenotype-ontology/releases/download/v2026-09-01/phenotype.hpoa) | ídem | `e89aa39c8f97bf5a52c5d160f9250a603681d630ade8ec2679d84ac5aece1f72` | licencia HPO (uso libre con atribución) | Sólo los identificadores OMIM/ORPHA/DECIPHER anotados (no los nombres: los de OMIM son de OMIM) |
| `phenopacket-store` | Monarch Initiative | 0.1.27 | [all_phenopackets.zip](https://github.com/monarch-initiative/phenopacket-store/releases/download/0.1.27/all_phenopackets.zip) | ídem | `d0c70005bb09b87035087516252b6b539fbc0415be7c664b73c9cde7eedf205a` | BSD-3-Clause | Sólo el OMIM de cada diagnóstico |

## Sólo medidas (no se cargan)

| Clave | Editor | Versión | URL | SHA-256 | Motivo |
|---|---|---|---|---|---|
| `nando` | NANDO (DBCLS / NIBIOHN, Japón) | commit `9af59ee` (2024-07-23) | [nando.ttl](https://raw.githubusercontent.com/aidrd/nando/9af59ee203fabf7ca479a9a30e972d44124f1843/results/nando.ttl) | `7a20340bb122d8c51b5d619d20e1abe043585a8e5c9bed12c9b60b1040097637` | El repositorio no declara licencia. |
| `oncotree` | OncoTree (MSKCC) | 2025-10-03 | [oncotree_2025_10_03.json](https://raw.githubusercontent.com/cBioPortal/oncotree/3cf9fb3035cbdf75ac8983700935f9daa5dc08eb/trees/oncotree_2025_10_03.json) | `613c84ebecce7b47fb6800a94efecf8c7edbc25120401d898591d3b478c36231` | El repositorio no declara licencia. |
| `mesh-c` | MeSH 2025 (NLM), conversión PyOBO | 2025 | [mesh.obo](https://raw.githubusercontent.com/biopragmatics/obo-db-ingest/77e65923b484a2aa1c38306a03e916592f1d5f36/export/mesh/2025/mesh.obo) | `290a871383eb369bfdb2dec2179a8c344543029f5ecf81030d83b86fc3bf6fb5` | Conversión de terceros **sin números de árbol** y con los SCR sin su «mapped to»: no reconstruye el árbol C. La oficial (`nlmpubs.nlm.nih.gov`) está bloqueada. |
| `gard` | GARD (NCATS), conversión PyOBO | 2025-10-31 | [gard.obo](https://raw.githubusercontent.com/biopragmatics/obo-db-ingest/77e65923b484a2aa1c38306a03e916592f1d5f36/export/gard/gard.obo) | `235c9c5b3fd306437be84db378e4180419a2ac1dc388ff37b19cf622a08d1cd0` | Conversión sin licencia declarada ni cruces; la oficial está bloqueada. |
| `hetionet` | Hetionet v1.0 | v1.0 | [hetionet-v1.0-nodes.tsv](https://raw.githubusercontent.com/hetio/hetionet/8a6cc0c5604d0e2908786e4de38af67b8e46ee4a/hetnet/tsv/hetionet-v1.0-nodes.tsv) | `3ad9eb86c031df8bc7d5efefa6edc93562182eb9a6a71e5129d3f18b9d42c50e` | CC0; sus 137 enfermedades ya están (DOID). Aporta 0. |

## Evaluadas y descartadas

| Fuente | Motivo |
|---|---|
| CIE-11 en **español** | Ningún archivo oficial accesible: la OMS publica la tabulación ES por `icdcdn.who.int` (bloqueado). Los CSV de terceros en GitHub se generan desde la API (`bypabloc/cie`): son derivados, no el archivo de la OMS, y la licencia ND no permite tratarlos como oficiales. |
| Contenedor `whoicd/icd-api` (Docker Hub) | Trae sólo la aplicación; baja los datos de `icdcdn.who.int` al arrancar (bloqueado), envía analítica a la OMS y exige `acceptLicense=true`. No se usó. |
| CIE-10 OMS 2019 (títulos; ClaML `icd102019en.xml`) | Accesible (copia de terceros), pero la OMS exige licencia para uso comercial de la CIE-10 y no la tenemos: sólo se cargan los **códigos** (vía las tablas de la CIE-11) sin títulos. |
| CIE-10 en español (OPS/BIREME; DEIS Chile `verasativa/CIE-10`; GNU Health `es.po`) | OPS bloqueada; DEIS sin licencia declarada; GNU Health es traducción comunitaria (GPL), no oficial. |
| DeCS (BIREME) | Licencia por formulario + token; `decs.bvsalud.org` bloqueado. |
| OMIM (títulos, `mimTitles`, `genemap2`, `morbidmap`) | Exige registro y licencia: sólo se cargan los números MIM que citan otras fuentes. |
| UMLS Metathesaurus | Exige cuenta UTS y licencia: sólo CUI como clave. |
| SNOMED CT | Bolivia no es miembro de SNOMED International: los SCTID que traen MONDO/DOID/EFO **se descartan enteros** (ni como referencia). |
| MedDRA | Licencia MSSO: los códigos que citan Orphanet/MONDO/EFO quedan sólo como referencia textual (`disease_external_xrefs`), sin concepto. |
| ICD-O-3 | Licencia OMS y ningún archivo accesible; el cap. X de la CIE-11 (histopatología) sí está. |
| CIAP-2 / ICPC-2 (WONCA) | Sin archivo accesible (`ph3c.org`, `wonca.net` bloqueados); licencia de WONCA sin verificar. |
| DSM | Licencia de la APA. |
| Open Targets (disease index) | Bucket «requester pays»: exige facturar a un proyecto GCP. |
| CTD MEDIC, ClinGen, GenCC, UniProt diseases, Reactome, MedGen, Wikidata, PubMed / Europe PMC | Hosts bloqueados. |
| CIViC | Clonado cortado por el proxy (TLS); los volcados viven en `civicdb.org`. |
| EFO como fuente de clases MONDO | EFO importa MONDO: sólo se toman sus clases propias `EFO_`. |
