# Fixtures de genética

Todos son extractos REALES de los archivos descargados el 2026-10-28 (ver `../../SOURCES.md` para URL, versión y
SHA-256 de cada original). Se recortaron con `head`/`grep`/`awk` por código exacto; no se editó ningún valor.

| Fixture | Original | Qué se conservó |
|---|---|---|
| `hgnc_complete_set.sample.txt` | `hgnc_complete_set.txt` | encabezado de 53 columnas + A1BG, A1BG-AS1, A1CF y A4GALT (dos grupos, comillas, «\|») |
| `family.sample.csv`, `hierarchy.sample.csv`, `gene_has_family.sample.csv` | `genefamily_db_tables/*.csv` | los 9 grupos de esos genes (con campos multilínea) y 2 aristas de jerarquía |
| `withdrawn.sample.txt` | `withdrawn.txt` | 3 «Merged/Split» (uno hacia un gen retirado, uno hacia dos) y 1 «Entry Withdrawn» |
| `Homo_sapiens.gene_info.sample.gz` | `Homo_sapiens.gene_info.gz` | A1BG, A2M, A2ML1, un `biological-region` y un `pseudo` (gzip sin fecha) |
| `gene_condition_source_id.sample`, `disease_names.sample` | ClinVar | filas de los genes 144568, 53947, 8086 y 79719; 6 filas de `disease_names` con 5 categorías |
| `MGCONSO/MGSTY/MGDEF/MedGenIDMappings/MGREL/MERGED.sample.*`, `MedGen_CUI_history.sample.txt`, `ConceptID_history.sample.txt` | MedGen y ClinVar | 15 CUI: con nombre de MeSH/NCI/GTR/MONDO/Orphanet, solos de SNOMED o de OMIM (se descartan), con átomos de HPO, con `\r` suelto en MGDEF, con pareja NCI `isa`, jerarquía de MeSH, fusiones y reemplazos |
| `so.sample.obo` | `so.obo` | cabecera + 5 términos (SNV, sequence_variant, sequence_alteration, region, experimental_feature) + 1 obsoleto + 1 Typedef |
| `SubmissionTemplate.xlsx`, `SubmissionTemplateLite.xlsx`, `SubmissionTemplateSomatic.xlsx` | plantillas de ClinVar | archivos completos (hoja oculta `controlled_list`) |
| `ClinVar_VCV.sample.xsd` | `ClinVar_VCV.xsd` | cabecera + 2 `simpleType` con enumeración |
| `functional_consequences.sample.txt`, `functional_assay_types.sample.txt` | ClinVar | 4 términos de SO + 2 de FENICS; los 20 tipos de ensayo |
| `gene-validity.sample.csv`, `gene-dosage.sample.csv` | ClinGen | cabecera de presentación + 10 / 11 afirmaciones |
| `actionability-adult.sample.tsv`, `actionability-pediatric.sample.tsv` | TSV de actionability de ClinGen | encabezado + 4 / 3 afirmaciones |
| `syntax.sample.yaml`, `vrs-source.sample.yaml` | HGVS `syntax.yaml`, GA4GH `vrs-source.yaml` | archivos completos |
