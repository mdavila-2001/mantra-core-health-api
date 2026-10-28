# Fuentes del catálogo de enfermedades

Registro de cada archivo que usa `tools/terminology-import/diseases/` (definido en
`lib/sources.mjs`). Los archivos viven **fuera de git**, en
`<GLOSSARY_BUILD_DIR>/diseases-sources/`, y `fetch-sources.mjs` deja su SHA-256 y fecha en
`diseases-sources/manifest.json` (copia sin rutas locales en `data/sources-manifest.json`).
Descarga verificada el **2026-10-28** (00:20 UTC). Las fuentes crudas (~2 GB) **no** se suben; el resultado
normalizado sí: `diseases/data/` (gzip determinista, 18 MB, `MANIFEST.json` y `SHA256SUMS` con el SHA-256
de cada archivo). Cada fila cargada lleva su procedencia (fuente, id de origen, versión, URI, fecha de
descarga) en la propiedad `disease_provenance`; el SHA-256 del archivo de origen queda en
`code_system_versions.checksum`.

> **Red.** El 2026-10-28 se re-sondeó cada host (`evidencia/C1/sondeo-M1-resondeo-2026-10-28.txt`):
> responden `nlmpubs.nlm.nih.gov`, `evs.nci.nih.gov`, `icdcdn.who.int`, `www.orphadata.com`,
> `rarediseases.info.nih.gov`, `query.wikidata.org`, `oncotree.mskcc.org`, `ftp.ncbi.nlm.nih.gov`,
> `medlineplus.gov` y GitHub. No responden: `omim.org` y `decs.bvsalud.org` (403), `nanbyodata.jp` (404; se usa
> el repositorio `aidrd/nando`), `ctdbase.org` (redirección sin fin hacia una verificación de navegador; no se
> elude) y `www.nih.gov` (Cloudflare «Attention Required»).

## Cargadas

| Clave (`manifest`) | Editor | Versión | URL | SHA-256 | Licencia (capturada en `evidencia/C1/licencias-capturas-2026-10-28.txt`) | Qué se toma |
|---|---|---|---|---|---|---|
| `mondo` | Monarch Initiative | 2026-10-06 | [mondo.obo](https://github.com/monarch-initiative/mondo/releases/download/v2026-10-06/mondo.obo) | `2631e8e165d41def1a46749adb1ce0a336c8aba7f6bc0978729592cee8fed60b` | CC BY 4.0 | Clases MONDO de enfermedad humana: nombre, sinónimos, definición, `is_a`, xrefs con su anotación, obsolescencia |
| `orphanet-es-product1` | Orphanet (INSERM US14) | 2026-06-23 (igual en `orphadata.com`: `Last-Modified` 2026-06-29, mismo tamaño) | [es_product1.xml](https://www.orphadata.com/data/xml/es_product1.xml) — se baja del repo oficial `Orphanet/Orphadata_aggregated` (Git LFS) | `3eb547bb9aa0429bd8a05e55ea2c539a72b502a969325b1b5adeb601ab448ee0` | CC BY 4.0 (la declara el propio XML: `<Licence>`) | **Nombre, sinónimos y definición en castellano**; tipo, grupo, banderas; alineamientos ICD-10/ICD-11/OMIM/UMLS/MeSH/MONDO con su relación (E/NTBT/BTNT/ND) y estado de validación |
| `orphanet-en-product1` | Orphanet | 2026-06-23 | `en_product1.xml` (mismo repo) | `df8d562a0c6011af36a74eb4000ce81ca7d723e8031010819fb71727c0962bbb` | CC BY 4.0 | Nombre y sinónimos en inglés |
| `orphanet-en-product7` | Orphanet | 2026-06-23 | `en_product7.xml` | `63d0e31a72141a9e…` (completo en `data/sources-manifest.json`) | CC BY 4.0 | Padre preferencial (linealización) |
| `orphanet-en-product3-<n>` (35) | Orphanet | 2026-06-23 | `en_product3_<n>.xml` | ver `manifest.json` | CC BY 4.0 | Las 35 clasificaciones por especialidad (aristas padre→hijo). Orphanet **no publica** clasificaciones en castellano (el repo oficial sólo tiene `es_product1`, `es_product4`, `es_product9_*` y `es_funct_consequences`) |
| `doid` | Disease Ontology (UMSOM) | 2026-09-30 | [doid.obo v2026-09-30](https://raw.githubusercontent.com/DiseaseOntology/HumanDiseaseOntology/v2026-09-30/src/ontology/doid.obo) | `51e717b6b9f5d391f2793f9e16faf9c8629a661ab8f21c3a024458129f182ad2` | CC0 1.0 | Todo DOID: nombre, sinónimos, definición, `is_a`, xrefs, `alt_id` |
| `ncit-evs-flat` + `ncit-evs-cui-map` | NCI — EVS (archivo plano **oficial**) | 26.09d (reemplaza a la OBO Edition 26.02d de un espejo) | [Thesaurus_26.09d.FLAT.zip](https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/Thesaurus_26.09d.FLAT.zip), [nci_code_cui_map_202402.dat](https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/nci_code_cui_map_202402.dat) | `3c2743ffb33302226f6f4df3ee683d2812d2c8726f4094237b80a496cf48411b`, `a68bd56fd0ab6a56907a06064e972af5cd4569b79a6dacb40911b52adb177fd9` | **CC BY 4.0**, texto literal de [ThesaurusTermsofUse.htm](https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/ThesaurusTermsofUse.htm) (SHA-256 `c42ebee4…`, leído el 2026-10-28): «The NCI Thesaurus™ is released under the Creative Commons Attribution 4.0 International license (CC BY 4.0)». «NCI Thesaurus» es marca: lo cargado es un subconjunto, no la edición oficial | Subárbol **C2991 Disease or Disorder** (22 854 conceptos) más 645 conceptos que otras fuentes citan y quedan fuera de C2991 o retirados (`ncit-xref`); UMLS CUI y tipo semántico |
| `mesh-desc`, `mesh-supp` | NLM — MeSH 2026 **oficial** (`nlmpubs.nlm.nih.gov`) | 2026 (archivos del 2026-08-12) | [desc2026.zip](https://nlmpubs.nlm.nih.gov/projects/mesh/MESH_FILES/xmlmesh/desc2026.zip), [supp2026.zip](https://nlmpubs.nlm.nih.gov/projects/mesh/MESH_FILES/xmlmesh/supp2026.zip). El zip se re-publica con otros bytes; lo que se fija es el XML de adentro: `desc2026.xml` `449792ed…bcdb`, `supp2026.xml` `8ec0efa7…24ca` | zips: `bb73dfdf…`, `4c34a3fa…` | Uso libre con atribución: «NLM freely provides MeSH data … acknowledge NLM as the source … not indicate or imply that NLM has endorsed its products» ([términos](https://www.nlm.nih.gov/databases/download/terms_and_conditions_mesh.html); los archivos de traducción MTMS **no** están cubiertos y no se usan) | Descriptores bajo los árboles C (menos C22 exclusivo) y F03, con números de árbol, términos sin permutados y nota de alcance; los citados por otra fuente aunque estén fuera; conceptos suplementarios (SCR) de clase 3 (enfermedades raras) con su «mapped to». Sin animales. El MeSH oficial es **sólo inglés** |
| `medlineplus-topics` | NLM — MedlinePlus | 2026-10-27 | [mplus_topics_2026-10-27.xml](https://medlineplus.gov/xml/mplus_topics_2026-10-27.xml) | `256eacdbb4dc480c…` | Dominio público (obra del gobierno de EE. UU.; atribución pedida): ver `LICENSES.MEDLINEPLUS` | Sólo los pares «descriptor MeSH → tema de salud en español» (834 enlazados, cada uno al concepto del glosario) |
| `medlineplus-genetics` | NLM — MedlinePlus Genetics | 2026-10-27 | [ghr-summaries.xml](https://medlineplus.gov/download/ghr-summaries.xml) | `fdc8bd614310c127…` | Dominio público (contenido «Summaries on Genetics pages» sin copyright en https://medlineplus.gov/about/using/usingcontent/); atribución pedida | 1 305 condiciones genéticas: nombre, sinónimos, descripción en inglés, claves (SNOMED CT descartado) |
| `nando` | NANDO — DBCLS / NIBIOHN | 1.0.0 (2023-11-27), commit `9af59ee` (el último del repositorio) | [nando.ttl](https://raw.githubusercontent.com/aidrd/nando/9af59ee203fabf7ca479a9a30e972d44124f1843/results/nando.ttl) | `7a20340bb122d8c51b5d619d20e1abe043585a8e5c9bed12c9b60b1040097637` | **CC BY 4.0**: README del repo («Licens: CC-BY 4.0 \| DBCLS») y `dcterms:license <https://creativecommons.org/licenses/by/4.0/>` dentro del propio `nando.ttl` (antes se había dejado «sin licencia declarada» por no haber leído ambos) | 2 777 enfermedades intratables de Japón: etiqueta inglesa (designación EN), japonés y hiragana en propiedades, `closeMatch` a MONDO como alineamiento «inexacto» |
| `oncotree` | OncoTree — MSKCC | 2025-10-03 (la última publicada) | [oncotree_2025_10_03.json](https://raw.githubusercontent.com/cBioPortal/oncotree/0ff6ef4b8f16d76edc6554e6ea9fe063db5790f7/trees/oncotree_2025_10_03.json) | `613c84ebecce7b47fb6800a94efecf8c7edbc25120401d898591d3b478c36231` | **CC BY 4.0**, sección License del README del repo (texto capturado) | 898 tipos tumorales con jerarquía por `parent`; NCI y UMLS publicados como alineamientos sin equivalencia declarada |
| `icd11-mms` | OMS — CIE-11 MMS, tabulación simple **en inglés** (oficial, `icdcdn.who.int`) | 2026-01 (2026-Jan-17) | [SimpleTabulation-ICD-11-MMS-en.zip](https://icdcdn.who.int/static/releasefiles/2026-01/SimpleTabulation-ICD-11-MMS-en.zip) | `f1356588f40953a83e3af2b662deab47c5e269f944d1ea4ed0cfeb2007c7cd39` (el mismo que tenía la copia de terceros usada antes) | CC BY-ND 3.0 IGO. **Precedente previo del repo** (ya cargada el 2026-10-24); el propietario la lista como «sin licencia» en RELEVO.md: **decisión del propietario** (ver «Condicionadas») | 28 capítulos, 1 360 bloques, 35 664 categorías, padre, residuales, notas |
| `icd11-mapping` | OMS — tablas CIE-10 ↔ CIE-11, release **2026-01** | 2026-Jan-17 | [mapping.zip](https://icdcdn.who.int/static/releasefiles/2026-01/mapping.zip) | `2eb158cf2a0d53690d6e9baf0956f7617e1315e4f2a44dfc3db3be8f49193a1d` | CC BY-ND 3.0 IGO (ídem) | Sólo pares de códigos CIE-11 ↔ CIE-10 (los títulos CIE-10 no se cargan). Reemplaza a las de 2025-01 que venían de una copia de terceros |
| `efo` | EMBL-EBI | 3.95.0 | [efo.obo](https://github.com/EBISPOT/efo/releases/download/v3.95.0/efo.obo) | `062edb95420a0556affa61e252a4ef316cfba4bc42dd10f01ae8b90e7434ad14` | Apache-2.0 | Sólo clases propias `EFO_` bajo «disease» |
| `hpo-annotations` | HPO (Monarch / JAX) | 2026-09-02 | [phenotype.hpoa](https://github.com/obophenotype/human-phenotype-ontology/releases/download/v2026-09-01/phenotype.hpoa) | `e89aa39c8f97bf5a52c5d160f9250a603681d630ade8ec2679d84ac5aece1f72` | licencia HPO (atribución; el sitio agrega una cláusula de «uso no comercial» pendiente de decisión del propietario) | **Sólo identificadores** OMIM/ORPHA/DECIPHER (no nombres) |
| `hpo-common-diseases` | HPO — Groza et al. 2015 | archivo fijo 2015 | [common_disease_annot.tar.gz](https://storage.googleapis.com/data-public-monarchinitiative/hpo/common_disease_annot.tar.gz) | `4c871573d57199cd944cac991ecdbbe60272420376a4064db92f39691afc93d2` | licencia HPO | Sólo ids de enfermedad (DOID, MeSH) |
| `phenopacket-store` | Monarch Initiative | 0.1.27 | [all_phenopackets.zip](https://github.com/monarch-initiative/phenopacket-store/releases/download/0.1.27/all_phenopackets.zip) | `d0c70005bb09b87035087516252b6b539fbc0415be7c664b73c9cde7eedf205a` | BSD-3-Clause | Sólo el OMIM de cada diagnóstico |

OMIM, UMLS, DECIPHER, CIE-10 OMS (`icd10-who`) y CIE-11 Fundación se cargan **sólo como claves** (código, sin título): un
concepto por código que alguna fuente cita en un alineamiento publicado.

## Condicionadas (construidas por flag; **no** están en `data/` ni cargadas por defecto)

| Fuente | Flag | Estado | Por qué no se carga |
|---|---|---|---|
| GARD (NCATS/NIH): lista oficial de ~16 000 enfermedades + 6 300 fichas (nombre en castellano, xrefs) | `build-catalog.mjs --with-gard` (tras `fetch-gard.mjs`, ≈ 2,5 h a ≤ 1,5 pedidos/s; se bajaron 309 fichas de prueba el 2026-10-28 y se interrumpió) | Lector y pruebas listos (`lib/records-extra.mjs`, fixtures reales) | El sitio es una SPA sin texto de licencia legible por HTTP: `/about`, `/disclaimer` y `/privacy` devuelven el shell de la aplicación y `www.nih.gov/web-policies-notices` (la política general de NIH) queda detrás de Cloudflare (no se elude). La razón «obra del gobierno federal, 17 U.S.C. §105» es una **inferencia**, no un texto de GARD, y GARD reproduce material de terceros (OMIM, Orphanet, MONDO). Hasta que el propietario la apruebe o se lea el texto, no se carga |
| Títulos CIE-11 **en castellano** de la OMS (`SimpleTabulation-ICD-11-MMS-es.zip`, SHA-256 `7c7e5a02706aefd6ff2c95675ad4d33e3f2b2a518a1cabc8bf9f10c07b33113f`, 2026-01) | `build-catalog.mjs --with-icd11-es` | Lector probado; el build con el flag verifica que el archivo español calza con el inglés fila por fila | CC BY-ND 3.0 IGO, y el propietario excluyó explícitamente la CIE-11 («CC BY-ND y API con cuenta») de lo cargable. La versión inglesa ya está cargada por precedente previo; sumar el español amplía una licencia que el propietario no aprobó. **Decisión del propietario** |

## Sólo medidas (se bajan y se cuentan en la saturación; no se cargan)

| Clave | Editor | Versión | Aporta | Motivo |
|---|---|---|---|---|
| `hetionet` | Hetionet v1.0 (CC0) | v1.0 | 0 | Sus 137 enfermedades ya están (DOID) |
| `gencc` | GenCC | 2026-10-27 | 0 | Sólo ids de enfermedad (`disease_curie`) |
| `orphadata-en-product6`, `orphadata-en-product9-prev` | Orphanet | 2026-10-27 | 0 | Genes asociados y epidemiología: no hay enfermedades nuevas. No existe `es_product6` |
| `monarch-clingen`, `-clinvar`, `-alliance`, `-cureid` | Monarch KG 2026-10-07 | — | 0 | Licencia no declarada en `metadata.yaml`; sólo se miden ids de enfermedad |

## Evaluadas y descartadas (huecos declarados)

| Fuente | Motivo (re-sondeo 2026-10-28) |
|---|---|
| CIE-10 OMS (títulos, ClaML) | La OMS exige licencia para uso comercial de la CIE-10: sólo se cargan los códigos |
| CIE-10 en español (OPS/BIREME), DeCS | `decs.bvsalud.org` 403; DeCS exige formulario y token |
| OMIM (títulos, `mimTitles`, `genemap2`) | `omim.org` 403; exige registro y licencia: sólo los números MIM que citan otras fuentes |
| UMLS Metathesaurus, MedGen, ClinVar `disease_names` | UMLS exige cuenta UTS; MedGen y ClinVar incluyen nombres de vocabularios con licencia (SNOMED CT, MedDRA, OMIM): sólo CUI como clave |
| SNOMED CT, MedDRA, ICD-O-3, DSM, CIAP-2/ICPC-2 | Licencia (Bolivia no es miembro de SNOMED International; los SCTID se descartan enteros) |
| CTD MEDIC (`CTD_diseases.tsv.gz`) | La página legal de CTD redirige a una verificación de navegador; sin texto de licencia legible no se carga |
| UniProt `humdisease` (CC BY 4.0 en UniProt) | Sus nombres derivan de OMIM; la licencia de OMIM no está resuelta. Aporta nombres de enfermedad ya cubiertos por MONDO/Orphanet |
| Open Targets, IHME GBD (cause hierarchy) | Open Targets: bucket «requester pays». IHME: la descarga exige iniciar sesión (OAuth) |
| NANDA/NIC/NOC y otros del brief | Licencia (ver `nursing-care/`) |
| Wikidata | Ver `docs/seed-research/diseases.md` §12 (estado de la pasada Wikidata del 2026-10-28) |
