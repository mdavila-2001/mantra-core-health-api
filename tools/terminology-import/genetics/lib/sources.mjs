// =============================================================================
// Catálogo de fuentes del corpus de genética (SÓLO vocabulario: nada de datos
// de pacientes ni variantes individuales de ClinVar).
//
// Cada entrada dice de dónde se baja el archivo, con qué licencia se publica y
// qué aporta. Los archivos quedan FUERA de git, en
// `<GLOSSARY_BUILD_DIR>/genetics-sources/`; `fetch-genetics-sources.mjs`
// escribe ahí `manifest.json` con URL, SHA-256, tamaño, fecha de descarga y la
// versión que declara el propio archivo (o, si no declara, su `Last-Modified`).
//
// La licencia se copia de lo que declara la fuente. Los textos leídos el
// 2026-10-27 están en
// docs/trabajo/2026-10-27-terminologia-cierre-huecos/evidencia/C12/licencias-2026-10-27.txt
// =============================================================================

import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUILD_DIR } from '../../lib/glossary-es/common.mjs';

export const SOURCES_DIR = process.env.GENETICS_SOURCES_DIR ?? resolve(BUILD_DIR, 'genetics-sources');
export const OUT_DIR = process.env.GENETICS_OUT_DIR ?? resolve(BUILD_DIR, 'genetics');
/** Corpus normalizado comprimido y versionado en git (pack-data.mjs / unpack-data.mjs). */
export const DATA_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'data');
export const sourcePath = (file) => join(SOURCES_DIR, file);

const HGNC = 'https://storage.googleapis.com/public-download-files/hgnc/tsv/tsv';
const HGNC_FAM = 'https://storage.googleapis.com/public-download-files/hgnc/csv/csv/genefamily_db_tables';
const NCBI_GENE = 'https://ftp.ncbi.nlm.nih.gov/gene/DATA';
const MEDGEN = 'https://ftp.ncbi.nlm.nih.gov/pub/medgen';
const CLINVAR = 'https://ftp.ncbi.nlm.nih.gov/pub/clinvar';

export const LICENSES = {
  hgnc: 'CC0 1.0 (HGNC License Agreement, https://www.genenames.org/about/license/: «all data is released under the Creative Commons Public Domain (CC0) License»); la atribución es recomendada, no obligatoria',
  ncbi: 'Dominio público de NCBI/NLM para lo creado por o para el gobierno de EE. UU. (https://www.ncbi.nlm.nih.gov/home/about/policies/, leída el 2026-10-28: «Information that is created by or for the US government on this site is within the public domain»; se pide reconocer a NLM). Aviso «Molecular Data Usage» de la misma página, que se conserva: «NCBI itself places no restrictions on the use or distribution of the data contained therein. […] However, some submitters of the original data […] may claim patent, copyright, or other intellectual property rights in all or a portion of the data […] NCBI cannot provide comment or unrestricted permission concerning the use, copying, or distribution of the information contained in the molecular databases». La página advierte además que NCBI incorpora material de terceros con copyright (OMIM, GeneReviews/Bookshelf): este importador no carga su texto',
  so: 'CC BY 4.0 (LICENSE del repositorio The-Sequence-Ontology/SO-Ontologies: «Attribution 4.0 International»); atribuir al Sequence Ontology',
  clingen: 'CC0 1.0 (https://clinicalgenome.org/docs/terms-of-use/: «All curated content published by ClinGen is available free of restriction under the CC0 1.0 Universal (CC0 1.0) Public Domain Dedication»; piden atribuir a ClinGen e indicar la fecha de acceso)',
  hgvs: 'Texto de la nomenclatura HGVS: CC0 1.0; código y artefactos legibles por máquina del repositorio (syntax.yaml): MIT (README del repositorio HGVSnomenclature/hgvs-nomenclature, § Availability)',
  vrs: 'Apache License 2.0 (README de ga4gh/vrs: «VRS is licensed under the Apache License 2.0»)',
};

/**
 * `file` es relativo a SOURCES_DIR. `versionFrom` dice cómo se lee la versión
 * del propio archivo; si el archivo no declara ninguna se usa `last-modified`
 * (cabecera HTTP) y así queda dicho en `source_version`.
 */
export const SOURCE_FILES = [
  { key: 'hgnc-complete', file: 'hgnc/hgnc_complete_set.txt', url: `${HGNC}/hgnc_complete_set.txt`, owner: 'HUGO Gene Nomenclature Committee (HGNC)', license: LICENSES.hgnc, versionFrom: 'last-modified' },
  { key: 'hgnc-withdrawn', file: 'hgnc/withdrawn.txt', url: `${HGNC}/withdrawn.txt`, owner: 'HUGO Gene Nomenclature Committee (HGNC)', license: LICENSES.hgnc, versionFrom: 'last-modified', note: 'entradas retiradas: no son conceptos; los ids fusionados en un gen aprobado van en su propiedad retired_ids' },
  { key: 'hgnc-family', file: 'hgnc/family.csv', url: `${HGNC_FAM}/family.csv`, owner: 'HUGO Gene Nomenclature Committee (HGNC) — grupos de genes', license: LICENSES.hgnc, versionFrom: 'last-modified' },
  { key: 'hgnc-hierarchy', file: 'hgnc/hierarchy.csv', url: `${HGNC_FAM}/hierarchy.csv`, owner: 'HUGO Gene Nomenclature Committee (HGNC) — grupos de genes', license: LICENSES.hgnc, versionFrom: 'last-modified' },
  { key: 'hgnc-gene-has-family', file: 'hgnc/gene_has_family.csv', url: `${HGNC_FAM}/gene_has_family.csv`, owner: 'HUGO Gene Nomenclature Committee (HGNC) — grupos de genes', license: LICENSES.hgnc, versionFrom: 'last-modified' },
  { key: 'ncbi-gene-info-hs', file: 'ncbi-gene/Homo_sapiens.gene_info.gz', url: `${NCBI_GENE}/GENE_INFO/Mammalia/Homo_sapiens.gene_info.gz`, owner: 'NCBI Gene (NLM/NCBI)', license: LICENSES.ncbi, versionFrom: 'last-modified' },
  { key: 'ncbi-mim2gene-medgen', file: 'ncbi-gene/mim2gene_medgen', url: `${NCBI_GENE}/mim2gene_medgen`, owner: 'NCBI Gene (NLM/NCBI)', license: LICENSES.ncbi, versionFrom: 'last-modified', note: 'número MIM ↔ gen ↔ CUI de MedGen: sólo identificadores' },
  { key: 'medgen-mgconso', file: 'medgen/MGCONSO.RRF.gz', url: `${MEDGEN}/MGCONSO.RRF.gz`, owner: 'MedGen (NLM/NCBI)', license: LICENSES.ncbi, versionFrom: 'last-modified' },
  { key: 'medgen-mgdef', file: 'medgen/MGDEF.RRF.gz', url: `${MEDGEN}/MGDEF.RRF.gz`, owner: 'MedGen (NLM/NCBI)', license: LICENSES.ncbi, versionFrom: 'last-modified' },
  { key: 'medgen-mgrel', file: 'medgen/MGREL.RRF.gz', url: `${MEDGEN}/MGREL.RRF.gz`, owner: 'MedGen (NLM/NCBI)', license: LICENSES.ncbi, versionFrom: 'last-modified', note: 'relaciones entre conceptos; sólo se leen las de fuentes abiertas (NCI, MeSH, Orphanet, GTR, MONDO)' },
  { key: 'medgen-merged', file: 'medgen/MERGED.RRF.gz', url: `${MEDGEN}/MERGED.RRF.gz`, owner: 'MedGen (NLM/NCBI)', license: LICENSES.ncbi, versionFrom: 'last-modified', note: 'CUI fusionados (CUI → toCUI)' },
  { key: 'medgen-cui-history', file: 'medgen/MedGen_CUI_history.txt', url: `${MEDGEN}/MedGen_CUI_history.txt`, owner: 'MedGen (NLM/NCBI)', license: LICENSES.ncbi, versionFrom: 'last-modified', note: 'CUI reemplazados (Previous_CUI → Current_CUI, fecha de la acción)' },
  { key: 'clinvar-concept-history', file: 'clinvar/ConceptID_history.txt', url: `${CLINVAR}/ConceptID_history.txt`, owner: 'ClinVar (NLM/NCBI)', license: LICENSES.ncbi, versionFrom: 'last-modified', note: 'ConceptID retirados → vigentes (o «No longer reported»); va en retired_cuis de MedGen' },
  { key: 'medgen-mgsty', file: 'medgen/MGSTY.RRF.gz', url: `${MEDGEN}/MGSTY.RRF.gz`, owner: 'MedGen (NLM/NCBI)', license: LICENSES.ncbi, versionFrom: 'last-modified' },
  { key: 'medgen-idmappings', file: 'medgen/MedGenIDMappings.txt.gz', url: `${MEDGEN}/MedGenIDMappings.txt.gz`, owner: 'MedGen (NLM/NCBI)', license: LICENSES.ncbi, versionFrom: 'last-modified' },
  { key: 'medgen-sources', file: 'medgen/MedGen_Sources.txt', url: `${MEDGEN}/MedGen_Sources.txt`, owner: 'MedGen (NLM/NCBI)', license: LICENSES.ncbi, versionFrom: 'last-modified', note: 'catálogo de abreviaturas de fuente (SAB)' },
  { key: 'medgen-readme', file: 'medgen/README.txt', url: `${MEDGEN}/README.txt`, owner: 'MedGen (NLM/NCBI)', license: LICENSES.ncbi, versionFrom: 'last-modified', note: 'documenta las columnas de los RRF' },
  { key: 'clinvar-template', file: 'clinvar/SubmissionTemplate.xlsx', url: `${CLINVAR}/submission_templates/SubmissionTemplate.xlsx`, owner: 'ClinVar (NLM/NCBI)', license: LICENSES.ncbi, versionFrom: 'last-modified', note: 'hoja oculta controlled_list: listas controladas de ClinVar' },
  { key: 'clinvar-template-lite', file: 'clinvar/SubmissionTemplateLite.xlsx', url: `${CLINVAR}/submission_templates/SubmissionTemplateLite.xlsx`, owner: 'ClinVar (NLM/NCBI)', license: LICENSES.ncbi, versionFrom: 'last-modified', note: 'hoja oculta controlled_list: términos de significancia clínica (una sola lista horizontal)' },
  { key: 'clinvar-template-somatic', file: 'clinvar/SubmissionTemplateSomatic.xlsx', url: `${CLINVAR}/submission_templates/SubmissionTemplateSomatic.xlsx`, owner: 'ClinVar (NLM/NCBI)', license: LICENSES.ncbi, versionFrom: 'last-modified', note: 'hoja oculta controlled_list: listas controladas del envío somático' },
  { key: 'clinvar-template-functional', file: 'clinvar/SubmissionTemplateFunctionalData.xlsx', url: `${CLINVAR}/submission_templates/SubmissionTemplateFunctionalData.xlsx`, owner: 'ClinVar (NLM/NCBI)', license: LICENSES.ncbi, versionFrom: 'last-modified', note: 'hoja oculta controlled_list: listas controladas del envío de datos funcionales' },
  { key: 'clinvar-xsd', file: 'clinvar/ClinVar_VCV.xsd', url: `${CLINVAR}/xsd_public/ClinVar_VCV.xsd`, owner: 'ClinVar (NLM/NCBI)', license: LICENSES.ncbi, versionFrom: 'xsd-version' },
  { key: 'clinvar-functional-consequences', file: 'clinvar/functional_consequences.txt', url: `${CLINVAR}/functional_consequences.txt`, owner: 'ClinVar (NLM/NCBI)', license: LICENSES.ncbi, versionFrom: 'last-modified' },
  { key: 'clinvar-functional-assay-types', file: 'clinvar/functional_assay_types.txt', url: `${CLINVAR}/functional_assay_types.txt`, owner: 'ClinVar (NLM/NCBI)', license: LICENSES.ncbi, versionFrom: 'last-modified' },
  { key: 'clinvar-disease-names', file: 'clinvar/disease_names', url: `${CLINVAR}/disease_names`, owner: 'ClinVar (NLM/NCBI)', license: LICENSES.ncbi, versionFrom: 'last-modified', note: 'sólo se lee la categoría por ConceptID; los nombres no se cargan (HPO sin aprobación, OMIM con licencia)' },
  { key: 'clinvar-gene-condition', file: 'clinvar/gene_condition_source_id', url: `${CLINVAR}/gene_condition_source_id`, owner: 'ClinVar / MedGen (NLM/NCBI)', license: LICENSES.ncbi, versionFrom: 'last-modified', note: 'gen ↔ condición (CUI): enlace por código; se descarta DiseaseName' },
  { key: 'so-obo', file: 'so/so.obo', url: 'https://raw.githubusercontent.com/The-Sequence-Ontology/SO-Ontologies/master/Ontology_Files/so.obo', owner: 'Sequence Ontology', license: LICENSES.so, versionFrom: 'obo-data-version' },
  { key: 'clingen-gene-validity', file: 'clingen/gene-validity.csv', url: 'https://search.clinicalgenome.org/kb/gene-validity/download', owner: 'Clinical Genome Resource (ClinGen)', license: LICENSES.clingen, versionFrom: 'clingen-file-created' },
  { key: 'clingen-dosage', file: 'clingen/gene-dosage.csv', url: 'https://search.clinicalgenome.org/kb/gene-dosage/download', owner: 'Clinical Genome Resource (ClinGen)', license: LICENSES.clingen, versionFrom: 'clingen-file-created' },
  { key: 'clingen-actionability-adult', file: 'clingen/actionability-adult-assertion.tsv', url: 'https://actionability.clinicalgenome.org/ac/Adult/api/summ/assertion?format=tsv', owner: 'Clinical Genome Resource (ClinGen) — Actionability', license: LICENSES.clingen, versionFrom: 'last-modified', note: 'sólo se leen los valores de consensusAssertion y curationType; no se cargan las afirmaciones por gen' },
  { key: 'clingen-actionability-pediatric', file: 'clingen/actionability-pediatric-assertion.tsv', url: 'https://actionability.clinicalgenome.org/ac/Pediatric/api/summ/assertion?format=tsv', owner: 'Clinical Genome Resource (ClinGen) — Actionability', license: LICENSES.clingen, versionFrom: 'last-modified', note: 'sólo se leen los valores de consensusAssertion y curationType; no se cargan las afirmaciones por gen' },
  { key: 'hgvs-syntax', file: 'hgvs/syntax.yaml', url: 'https://raw.githubusercontent.com/HGVSnomenclature/hgvs-nomenclature/main/docs/syntax.yaml', owner: 'HGVS Nomenclature — HUGO Variation Nomenclature Committee (HVNC)', license: LICENSES.hgvs, versionFrom: 'last-modified' },
  { key: 'vrs-schema', file: 'vrs/vrs-source.yaml', url: 'https://raw.githubusercontent.com/ga4gh/vrs/2.0/schema/vrs/vrs-source.yaml', owner: 'GA4GH Variation Representation Specification (VRS)', license: LICENSES.vrs, versionFrom: 'yaml-id' },
];

export const sourceByKey = (key) => {
  const s = SOURCE_FILES.find((x) => x.key === key);
  if (!s) throw new Error(`fuente desconocida: ${key}`);
  return s;
};
