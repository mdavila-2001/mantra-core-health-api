# Fuentes de genética (C12) — qué se baja, de dónde, con qué licencia y qué se carga

Descargado el **2026-10-28** por `fetch-genetics-sources.mjs` (streaming, de a un pedido, ≤ 1 pedido/s por host, reanudable).
La procedencia completa (URL, bytes, SHA-256 de 64 caracteres, fecha, `Last-Modified`, versión declarada) está en
`data/sources-manifest.json.gz` y viaja con el corpus. **Ningún crudo se versiona**: se re-bajan con el mismo script y se comparan contra esos SHA-256.
Re-sondeo de hosts de hoy: `docs/trabajo/2026-10-27-terminologia-cierre-huecos/evidencia/C12/resondeo-2026-10-28.tsv`.

## Archivos de entrada

| Clave | Archivo (URL) | Versión | Bytes | SHA-256 (16) | Licencia | Uso |
|---|---|---|---:|---|---|---|
| `hgnc-complete` | [hgnc_complete_set.txt](https://storage.googleapis.com/public-download-files/hgnc/tsv/tsv/hgnc_complete_set.txt) | 2026-10-27 | 16 986 126 | `d93ce6b22d01dc1e` | CC0 ¹ |  |
| `hgnc-withdrawn` | [withdrawn.txt](https://storage.googleapis.com/public-download-files/hgnc/tsv/tsv/withdrawn.txt) | 2026-10-27 | 259 101 | `51fedd10e711edc9` | CC0 ¹ | sólo para medir (entradas retiradas); no se carga |
| `hgnc-family` | [family.csv](https://storage.googleapis.com/public-download-files/hgnc/csv/csv/genefamily_db_tables/family.csv) | 2026-10-27 | 1 029 448 | `e27f88cc0b69879d` | CC0 ¹ |  |
| `hgnc-hierarchy` | [hierarchy.csv](https://storage.googleapis.com/public-download-files/hgnc/csv/csv/genefamily_db_tables/hierarchy.csv) | 2026-10-27 | 22 945 | `7eb5350bd475ebcf` | CC0 ¹ |  |
| `hgnc-gene-has-family` | [gene_has_family.csv](https://storage.googleapis.com/public-download-files/hgnc/csv/csv/genefamily_db_tables/gene_has_family.csv) | 2026-10-27 | 520 377 | `5af25e8301724d91` | CC0 ¹ |  |
| `ncbi-gene-info-hs` | [Homo_sapiens.gene_info.gz](https://ftp.ncbi.nlm.nih.gov/gene/DATA/GENE_INFO/Mammalia/Homo_sapiens.gene_info.gz) | 2026-10-27 | 5 199 342 | `8a1c9ab8b86a1b92` | NCBI/NLM ² |  |
| `ncbi-mim2gene-medgen` | [mim2gene_medgen](https://ftp.ncbi.nlm.nih.gov/gene/DATA/mim2gene_medgen) | 2026-10-27 | 872 928 | `8b4ec0e2ae9af08c` | NCBI/NLM ² | número MIM ↔ gen ↔ CUI de MedGen: sólo identificadores |
| `medgen-mgconso` | [MGCONSO.RRF.gz](https://ftp.ncbi.nlm.nih.gov/pub/medgen/MGCONSO.RRF.gz) | 2026-10-27 | 15 819 991 | `769baf61c3bd68ee` | NCBI/NLM ² |  |
| `medgen-mgdef` | [MGDEF.RRF.gz](https://ftp.ncbi.nlm.nih.gov/pub/medgen/MGDEF.RRF.gz) | 2026-10-27 | 5 311 050 | `c0fe7b0be19ea0c6` | NCBI/NLM ² |  |
| `medgen-mgrel` | [MGREL.RRF.gz](https://ftp.ncbi.nlm.nih.gov/pub/medgen/MGREL.RRF.gz) | 2026-10-27 | 16 060 412 | `7d31619cc86d0600` | NCBI/NLM ² | relaciones entre conceptos; sólo se leen las de fuentes abiertas (NCI, MeSH, Orphanet, GTR, MONDO) |
| `medgen-merged` | [MERGED.RRF.gz](https://ftp.ncbi.nlm.nih.gov/pub/medgen/MERGED.RRF.gz) | 2026-10-27 | 50 744 | `efc0fd3ac22a1f27` | NCBI/NLM ² | CUI fusionados (CUI → toCUI) |
| `medgen-cui-history` | [MedGen_CUI_history.txt](https://ftp.ncbi.nlm.nih.gov/pub/medgen/MedGen_CUI_history.txt) | 2026-10-27 | 91 554 | `b75498b75d6c6bc9` | NCBI/NLM ² | CUI reemplazados (Previous_CUI → Current_CUI, fecha de la acción) |
| `medgen-mgsty` | [MGSTY.RRF.gz](https://ftp.ncbi.nlm.nih.gov/pub/medgen/MGSTY.RRF.gz) | 2026-10-27 | 1 667 467 | `2a2468eae06eccae` | NCBI/NLM ² |  |
| `medgen-idmappings` | [MedGenIDMappings.txt.gz](https://ftp.ncbi.nlm.nih.gov/pub/medgen/MedGenIDMappings.txt.gz) | 2026-10-27 | 5 790 686 | `99ef5deefb4d8f32` | NCBI/NLM ² |  |
| `medgen-sources` | [MedGen_Sources.txt](https://ftp.ncbi.nlm.nih.gov/pub/medgen/MedGen_Sources.txt) | 2026-10-27 | 10 294 | `a514c8c0b0d9f9e2` | NCBI/NLM ² | catálogo de abreviaturas de fuente (SAB) |
| `medgen-readme` | [README.txt](https://ftp.ncbi.nlm.nih.gov/pub/medgen/README.txt) | 2024-11-08 | 17 286 | `d76c8f18baa8079c` | NCBI/NLM ² | documenta las columnas de los RRF |
| `clinvar-template` | [SubmissionTemplate.xlsx](https://ftp.ncbi.nlm.nih.gov/pub/clinvar/submission_templates/SubmissionTemplate.xlsx) | 2026-01-14 | 229 559 | `7d94ac9d92e8c31c` | NCBI/NLM ² | hoja oculta controlled_list: listas controladas de ClinVar |
| `clinvar-template-lite` | [SubmissionTemplateLite.xlsx](https://ftp.ncbi.nlm.nih.gov/pub/clinvar/submission_templates/SubmissionTemplateLite.xlsx) | 2026-01-14 | 86 407 | `d1b360a03740856c` | NCBI/NLM ² | hoja oculta controlled_list: términos de significancia clínica (una sola lista horizontal) |
| `clinvar-template-somatic` | [SubmissionTemplateSomatic.xlsx](https://ftp.ncbi.nlm.nih.gov/pub/clinvar/submission_templates/SubmissionTemplateSomatic.xlsx) | 2024-11-19 | 207 064 | `4ecc625f29cfed69` | NCBI/NLM ² | hoja oculta controlled_list: listas controladas del envío somático |
| `clinvar-template-functional` | [SubmissionTemplateFunctionalData.xlsx](https://ftp.ncbi.nlm.nih.gov/pub/clinvar/submission_templates/SubmissionTemplateFunctionalData.xlsx) | 2025-08-20 | 484 048 | `3777a7a0ec2805b1` | NCBI/NLM ² | hoja oculta controlled_list: listas controladas del envío de datos funcionales |
| `clinvar-xsd` | [ClinVar_VCV.xsd](https://ftp.ncbi.nlm.nih.gov/pub/clinvar/xsd_public/ClinVar_VCV.xsd) | 2.6; February 26, 2026 | 159 754 | `de01424a0c495bab` | NCBI/NLM ² |  |
| `clinvar-functional-consequences` | [functional_consequences.txt](https://ftp.ncbi.nlm.nih.gov/pub/clinvar/functional_consequences.txt) | 2026-04-03 | 18 766 | `bae55256c710b45b` | NCBI/NLM ² |  |
| `clinvar-functional-assay-types` | [functional_assay_types.txt](https://ftp.ncbi.nlm.nih.gov/pub/clinvar/functional_assay_types.txt) | 2026-06-11 | 1 143 | `3aa0293dd7d87bdd` | NCBI/NLM ² |  |
| `clinvar-disease-names` | [disease_names](https://ftp.ncbi.nlm.nih.gov/pub/clinvar/disease_names) | 2026-10-27 | 5 654 984 | `f191ec45e4a0de98` | NCBI/NLM ² | condiciones de ClinVar (sólo para medir y enlazar por ConceptID) |
| `clinvar-gene-condition` | [gene_condition_source_id](https://ftp.ncbi.nlm.nih.gov/pub/clinvar/gene_condition_source_id) | 2026-10-27 | 1 324 270 | `b5f2217942e8f667` | NCBI/NLM ² |  |
| `so-obo` | [so.obo](https://raw.githubusercontent.com/The-Sequence-Ontology/SO-Ontologies/master/Ontology_Files/so.obo) | 2026-08-07 | 1 058 091 | `22a8f3ec2b49125d` | CC BY 4.0 ³ |  |
| `clingen-gene-validity` | [gene-validity.csv](https://search.clinicalgenome.org/kb/gene-validity/download) | 2026-10-28 | 1 134 067 | `6fbbd318a3a33d00` | CC0 ⁴ |  |
| `clingen-dosage` | [gene-dosage.csv](https://search.clinicalgenome.org/kb/gene-dosage/download) | 2026-10-28 | 327 427 | `24d1a2237735295d` | CC0 ⁴ |  |
| `clingen-actionability-adult` | [actionability-adult-assertion.tsv](https://actionability.clinicalgenome.org/ac/Adult/api/summ/assertion?format=tsv) | bajado 2026-10-28 (sin versión declarada ni Last-Modified) | 99 334 | `cdfb8a2a1351ce73` | CC0 ⁴ | sólo se leen los valores de consensusAssertion y curationType; no se cargan las afirmaciones por gen |
| `clingen-actionability-pediatric` | [actionability-pediatric-assertion.tsv](https://actionability.clinicalgenome.org/ac/Pediatric/api/summ/assertion?format=tsv) | bajado 2026-10-28 (sin versión declarada ni Last-Modified) | 99 649 | `eef8a4b78363b82a` | CC0 ⁴ | sólo se leen los valores de consensusAssertion y curationType; no se cargan las afirmaciones por gen |
| `hgvs-syntax` | [syntax.yaml](https://raw.githubusercontent.com/HGVSnomenclature/hgvs-nomenclature/main/docs/syntax.yaml) | bajado 2026-10-28 (sin versión declarada ni Last-Modified) | 15 487 | `8b97c1a572760ab4` | CC0 / MIT ⁵ |  |
| `vrs-schema` | [vrs-source.yaml](https://raw.githubusercontent.com/ga4gh/vrs/2.0/schema/vrs/vrs-source.yaml) | 2.0.1 | 20 541 | `83e97b39090cd273` | Apache-2.0 ⁶ |  |

La **versión** es la que el propio archivo declara (`data-version` de SO, `version` del XSD, `FILE CREATED` de ClinGen, `$id` de VRS) o, si no
declara ninguna, el `Last-Modified` del servidor; sólo `syntax.yaml` de HGVS y los TSV de actionability de ClinGen no traen ninguna ni
`Last-Modified` (GitHub raw y la API de actionability): su versión es «bajado 2026-10-28» y lo que identifica el contenido es el SHA-256. HGVS
publica `main` sin etiqueta de versión consultable desde esta red (la API de GitHub no está habilitada en la sesión).

## Licencias leídas (textos en `evidencia/C12/licencias-2026-10-27.txt` y `licencias-2026-10-28.txt`)

1. **HGNC — CC0 1.0.** https://www.genenames.org/about/license/: «all data is released under the Creative Commons Public Domain (CC0) License […] any form of reuse of the content is permitted». La atribución es recomendada, no obligatoria.
2. **NCBI/NLM (NCBI Gene, MedGen, ClinVar) — dominio público con aviso.** https://www.ncbi.nlm.nih.gov/home/about/policies/: «Information that is created by or for the US government on this site is within the public domain»; se pide reconocer a NLM. **Aviso «Molecular Data Usage»** (se conserva en `source_license` de cada fila): NCBI no restringe el uso, pero «some submitters of the original data […] may claim patent, copyright, or other intellectual property rights in all or a portion of the data» y NCBI «cannot provide […] unrestricted permission». La misma página advierte que incorpora material de terceros con copyright (OMIM, GeneReviews/Bookshelf): **no se carga su texto**.
3. **Sequence Ontology — CC BY 4.0.** `LICENSE` del repositorio The-Sequence-Ontology/SO-Ontologies: «Attribution 4.0 International». Atribuir al Sequence Ontology.
4. **ClinGen — CC0 1.0.** https://clinicalgenome.org/docs/terms-of-use/: «All curated content published by ClinGen is available free of restriction under the CC0 1.0 Universal (CC0 1.0) Public Domain Dedication»; piden atribuir a ClinGen e indicar la fecha de acceso (está en cada fila: `source_retrieved_at`). La página menciona expresamente gene-disease validity, dosage sensitivity y clinical actionability.
5. **HGVS — texto CC0 1.0; código y artefactos legibles por máquina MIT.** README de HGVSnomenclature/hgvs-nomenclature (§ Availability). `syntax.yaml` es un artefacto legible por máquina: MIT.
6. **GA4GH VRS — Apache-2.0.** README de ga4gh/vrs (rama 2.0): «VRS is licensed under the Apache License 2.0».

### Componentes que MedGen reparte (cada concepto de `medgen` trae `component_licenses` con los que usa)

| Fuente (SAB) | Qué se toma | Licencia que consta |
|---|---|---|
| GTR (NCBI) | nombres de condiciones | NCBI/NLM (aviso de 2) |
| MONDO | nombres, definiciones, jerarquía | CC BY 4.0 (registrada también en `diseases/SOURCES.md`) |
| NCI Thesaurus | nombres, definiciones, `isa`, roles | CC BY 4.0 según https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/ThesaurusTermsofUse.htm (**leído y accesible hoy**: «The NCI Thesaurus™ is released under the Creative Commons Attribution 4.0 International license (CC BY 4.0)»). «NCI Thesaurus» es marca registrada: el code system no se llama así |
| Orphanet (ORDO) | nombres, definiciones, jerarquía | CC BY 4.0 (cabecera de `en_product6.xml`: `CC-BY-4.0`) |
| MeSH (MSH) | nombres, definiciones, jerarquía | https://www.nlm.nih.gov/databases/download/terms_and_conditions_mesh.html: «NLM freely provides MeSH data»; quien redistribuye reconoce a NLM, no insinúa su aval y mantiene la versión vigente o lo deja claro (versión en `source_version`) |
| MedlinePlus Genetics | definiciones | contenido sin copyright de MedlinePlus; se pide atribución |
| **HPO** | **ningún texto**; sólo el identificador `HP:…` como xref | cláusula «personal, noncommercial use» sin resolver por el propietario (`symptoms/lib/approvals.mjs`) |
| **SNOMED CT, OMIM, GeneReviews** | **nada** (ni nombres, ni definiciones, ni ids de SNOMED ni de variantes alélicas de OMIM) | licencia |

## Qué se carga y qué no (con el motivo exacto)

| Fuente | Estado |
|---|---|
| `hgnc_complete_set.txt` | **cargada** completa: 45 289 genes aprobados, 53 columnas |
| `family.csv`, `hierarchy.csv`, `gene_has_family.csv` | **cargadas**: 2 572 grupos, 1 740 aristas padre → hijo, 36 575 pertenencias gen → grupo |
| `withdrawn.txt` | 5 293 entradas retiradas: **no son conceptos**. 3 476 fusionadas en un gen aprobado van en su propiedad `retired_ids`; 39 apuntan a otra entrada retirada y 1 803 «Entry Withdrawn» no tienen reemplazo |
| `Homo_sapiens.gene_info.gz` | **cargada** completa: 194 025 GeneID, todos los tipos (incluye 128 261 `biological-region`, que el propietario puede cortar por `type_of_gene`). Otras especies: fuera de alcance |
| `gene_condition_source_id` | **cargada como propiedad** `medgen_condition_links` de 5 180 genes (sin `DiseaseName`) |
| `mim2gene_medgen` | **no se carga**: 28 698 pares MIM ↔ gen ↔ CUI ya cubiertos por los xrefs de HGNC/NCBI y `MedGenIDMappings`; sin valor nuevo |
| MedGen `MGCONSO`, `MGDEF`, `MGSTY`, `MedGenIDMappings`, `MGREL`, `MERGED`, `MedGen_CUI_history` | **cargados** 101 277 CUI con nombre de fuente abierta. **135 335 CUI no** (sus únicos nombres son de SNOMED CT, OMIM o GeneReviews) |
| MedGen `MGSAT`, `NAMES.RRF`, `MedGen_HPO_Mapping`, `MedGen_HPO_OMIM_Mapping`, `MedGen_UID_CUI_history`, `medgen_pubmed_lnk` | **no se cargan**: atributos propios de GTR (pesos, ids de pruebas), nombres preferidos (104 019 de SNOMED, 35 480 de OMIM), HPO/OMIM, historial de UID de la web y 183 MB de enlaces a PubMed (datos, no vocabulario) |
| `SubmissionTemplate{,Lite,Somatic,FunctionalData}.xlsx` | **cargadas** (hoja oculta `controlled_list`) |
| `ClinVar_VCV.xsd` | **cargado** (22 de sus 24 tipos simples traen enumeración) |
| `clinvar_submission.xsd` (2020) | no se carga: esquema anterior, reemplazado por `ClinVar_VCV.xsd` |
| `functional_consequences.txt` | **36 de 188** (los de Sequence Ontology). Los 152 de **FENICS** (Functional Epilepsy Nomenclature for Ion Channels) **no**: su licencia no está verificada |
| `functional_assay_types.txt` | **cargado** (20 tipos EFO/OBI/FBbi) |
| `disease_names` | sólo la **categoría** (7 valores) y su vínculo por ConceptID al CUI; **los 68 631 nombres no**: 19 248 son de HPO, 422 de OMIM y 17 357 no declaran fuente |
| `so.obo` | **cargada**: 2 409 clases vigentes; 211 obsoletas no son filas |
| ClinGen `gene-validity.csv`, `gene-dosage.csv`, actionability (TSV) | **cargados los valores controlados** (103 términos). Las 3 716 + 1 719 + 636 afirmaciones por gen son datos, no vocabulario: **no se cargan** |
| ClinGen `ls` (lumping & splitting), `downloadall`, regiones y CNV recurrentes (BED), Evidence Repository | no se cargan: afirmaciones o coordenadas, no vocabulario |
| `syntax.yaml` (HGVS) | **cargado**: 43 conceptos |
| `vrs-source.yaml` (GA4GH VRS 2.0.1) | **cargado**: 48 conceptos |
| NCBI `gene_history`, `gene_group`, `gene_orthologs`, `gene_summary`, `gene2*` | no se cargan: historia de identificadores, relaciones gen–gen, ortólogos y texto resumen (no vocabulario) |
| **OMIM, COSMIC, PharmGKB/ClinPGx, DECIPHER, GeneReviews, SNOMED CT, MedDRA** | **no**: licencia |
