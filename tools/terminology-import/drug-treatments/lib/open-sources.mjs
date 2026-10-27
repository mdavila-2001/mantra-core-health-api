// =============================================================================
// Fuentes abiertas que se bajan por HTTP (API o archivo), no por `git clone`.
// Pasadas del 2026-10-27 (carril C6): MED-RT, ChEMBL, DrugCentral actual,
// Wikidata, WHO eEML, EMA, Open Targets, ClinicalTrials.gov y CIViC, más los
// cruces a ATC (RxClass, ChEMBL, Wikidata, DrugCentral) y MeSH concepto →
// descriptor.
//
// Igual que `sources.mjs`: la versión y la licencia son las que declara la
// fuente, con el lugar donde se verificó el 2026-10-27. Los tipos de relación
// son los que DECLARA cada fuente (sin colapsar); la definición en inglés es
// literal de su documentación; la etiqueta en castellano es traducción propia
// (`labelEsOfficial: false`).
//
// `transport: 'http'` distingue estas fuentes de las de GitHub (que tienen
// `repo` y `commit`). La procedencia de un archivo HTTP queda en
// `cache/drug-treatments-http/manifest.json`: URL, fecha de descarga, SHA-256,
// bytes y, si la fuente los da, ETag y Last-Modified.
// =============================================================================

export const OPEN_SOURCES = {
  medrt: {
    transport: 'http',
    name: 'MED-RT — Medication Reference Terminology (Departamento de Asuntos de Veteranos de EE. UU.)',
    owner: 'U.S. Department of Veterans Affairs, Veterans Health Administration (publica NCI EVS)',
    officialUrl: 'https://evs.nci.nih.gov/ftp1/MED-RT/',
    repo: null,
    commit: null,
    versionTag: 'MED-RT-2026.10.05',
    version: 'MED-RT 2026.10.05 (Core_MEDRT_XML.zip, Last-Modified 2026-10-05); RxNorm 2026.09.08.26AA; MeSH 2026_2026.07.01',
    license:
      'Obra del Departamento de Asuntos de Veteranos de EE. UU. (gobierno federal; 17 U.S.C. §105). El paquete no trae aviso de licencia propio: se trata como dominio público por lo que declara el pedido, a confirmar por el propietario. Las relaciones con SNOMED CT del archivo no se cargan.',
    licenseUrl: 'https://evs.nci.nih.gov/ftp1/MED-RT/ (el paquete no incluye aviso de licencia)',
    files: { xml: 'medrt/Core_MEDRT_2026.10.05_XML.xml', doc: 'medrt/MED-RT Documentation.pdf' },
    urls: { zip: 'https://evs.nci.nih.gov/ftp1/MED-RT/Core_MEDRT_XML.zip' },
  },
  chembl: {
    transport: 'http',
    name: 'ChEMBL — drug_indication (EMBL-EBI)',
    owner: 'EMBL-EBI (ChEMBL)',
    officialUrl: 'https://www.ebi.ac.uk/chembl/',
    repo: null,
    commit: null,
    versionTag: 'ChEMBL_37',
    version: 'ChEMBL_37 (2026-05-01), API https://www.ebi.ac.uk/chembl/api/data/drug_indication',
    license:
      'CC BY-SA 3.0 (README y LICENSE del FTP de ChEMBL). Compartir igual: la base derivada de estas filas debe publicarse bajo la misma licencia; las filas están en un code system propio (drug-treatment-assertions-chembl) para poder retirarlas. Atribución: «ChEMBL data is from http://www.ebi.ac.uk/chembl - the version of ChEMBL is chembl_37».',
    licenseUrl: 'https://ftp.ebi.ac.uk/pub/databases/chembl/ChEMBLdb/latest/README',
    files: { indications: 'chembl/drug_indication.ndjson' },
    urls: { api: 'https://www.ebi.ac.uk/chembl/api/data/drug_indication.json' },
  },
  drugcentral: {
    transport: 'http',
    name: 'DrugCentral 2027 — omop_relationship (indicaciones, contraindicaciones, uso fuera de indicación)',
    owner: 'Division of Translational Informatics, University of New Mexico (DrugCentral)',
    officialUrl: 'https://drugcentral.org/',
    repo: null,
    commit: null,
    versionTag: 'DrugCentral-2026-09-25',
    version: 'DrugCentral 2027, volcado publicado 2026-09-25 (dbversion 56)',
    license:
      'CC BY-SA 4.0 (https://drugcentral.org/privacy: «DrugCentral is available under Creative Commons license» → creativecommons.org/licenses/by-sa/4.0). Compartir igual: filas en un code system propio para poder retirarlas. Atribución: DrugCentral. Las columnas SNOMED CT no se cargan.',
    licenseUrl: 'https://drugcentral.org/privacy',
    files: {
      relationships: 'drugcentral/omop_relationship.tsv',
      identifiers: 'drugcentral/identifier.tsv',
      atc: 'drugcentral/struct2atc.tsv',
      structures: 'drugcentral/structures.tsv',
    },
    urls: { dump: 'https://unmtid-dbs.net/download/DrugCentral/2027/db_dump/Drugcentral_2026-09-25.pgdump' },
  },
  wikidata: {
    transport: 'http',
    name: 'Wikidata — P2175 «medical condition treated» y P2176 «drug or therapy used for treatment»',
    owner: 'Wikimedia Foundation (comunidad de Wikidata)',
    officialUrl: 'https://www.wikidata.org/',
    repo: null,
    commit: null,
    versionTag: 'wikidata-2026-10-27',
    version: 'Wikidata Query Service, consulta del 2026-10-27',
    license: 'CC0 1.0 (https://www.wikidata.org/wiki/Wikidata:Licensing)',
    licenseUrl: 'https://www.wikidata.org/wiki/Wikidata:Licensing',
    files: { statements: 'wikidata/treatment-statements.ndjson', ids: 'wikidata/item-ids.ndjson' },
    urls: { sparql: 'https://query.wikidata.org/sparql' },
  },
  eeml: {
    transport: 'http',
    name: 'WHO eEML — Lista Modelo de Medicamentos Esenciales (recomendaciones por indicación)',
    owner: 'World Health Organization',
    officialUrl: 'https://list.essentialmeds.org/',
    repo: null,
    commit: null,
    versionTag: 'eEML-2026-10-27',
    version: 'WHO eEML (beta 1.0), páginas /recommendations/N leídas el 2026-10-27',
    license:
      'CC BY 3.0 IGO (https://list.essentialmeds.org/licencing). Atribución exigida: «WHO electronic Essential Medicines List (eEML), World Health Organization, 2020. https://list.essentialmeds.org/ (beta version 1.0). Licence: CC BY 3.0 IGO.» No se usa el logo de la OMS ni se sugiere su respaldo; es una adaptación.',
    licenseUrl: 'https://list.essentialmeds.org/licencing',
    files: { recommendations: 'eeml/recommendations.ndjson' },
    urls: { site: 'https://list.essentialmeds.org/recommendations/' },
  },
  ema: {
    transport: 'http',
    name: 'EMA — informe de medicamentos (EPAR): área terapéutica (MeSH) y código ATC',
    owner: 'European Medicines Agency',
    officialUrl: 'https://www.ema.europa.eu/en/medicines/download-medicine-data',
    repo: null,
    commit: null,
    versionTag: 'EMA-medicines-2026-10-27',
    version: 'medicines-output-medicines-report_en.xlsx, generado por la EMA el 2026-10-27 18:05',
    license:
      'Información pública de la EMA: «may be reproduced and / or distributed, totally or in part … for non-commercial and commercial purposes, provided that EMA is always acknowledged as the source» (aviso legal de la EMA).',
    licenseUrl: 'https://www.ema.europa.eu/en/about-us/legal-notice',
    files: { medicines: 'ema/medicines.tsv' },
    urls: { xlsx: 'https://www.ema.europa.eu/en/documents/report/medicines-output-medicines-report_en.xlsx' },
  },
  opentargets: {
    transport: 'http',
    name: 'Open Targets Platform 26.09 — informes clínicos (EMA Human Drugs)',
    owner: 'Open Targets (EMBL-EBI, Wellcome Sanger Institute, GSK, Pfizer, Sanofi, MSD)',
    officialUrl: 'https://platform.opentargets.org/',
    repo: null,
    commit: null,
    versionTag: 'OpenTargets-26.09',
    version: 'Open Targets Platform 26.09 (2026-09-24), dataset clinical_report',
    license:
      'CC0 1.0 para los datos de la Plataforma (https://platform-docs.opentargets.org/licence). Solo se cargan los informes cuyo origen es la EMA (aviso legal de la EMA: reutilización comercial con atribución). Los de TTD, PMDA y los derivados de ChEMBL (CC BY-SA, ya cargado directo) no se cargan.',
    licenseUrl: 'https://platform-docs.opentargets.org/licence',
    files: { reports: 'opentargets/clinical_report_ema.ndjson' },
    urls: { parquet: 'https://ftp.ebi.ac.uk/pub/databases/opentargets/platform/26.09/output/clinical_report/00000000.parquet' },
  },
  clinicaltrials: {
    transport: 'http',
    name: 'ClinicalTrials.gov API v2 — fármacos en estudio por condición (MeSH)',
    owner: 'U.S. National Library of Medicine',
    officialUrl: 'https://clinicaltrials.gov/',
    repo: null,
    commit: null,
    versionTag: 'CTgov-2026-10-27',
    version: 'ClinicalTrials.gov API 2.0.5, dataTimestamp 2026-10-27T09:00:04',
    license:
      'Obra de la NLM (gobierno federal de EE. UU., sin copyright en EE. UU.; «Please acknowledge NLM as the source»). Los registros pueden traer texto de quien los presenta: solo se toman campos estructurados (NCT, fase, estado, términos MeSH que asigna la propia API).',
    licenseUrl: 'https://www.nlm.nih.gov/web_policies.html',
    files: { studies: 'clinicaltrials/drug-studies.ndjson' },
    urls: { api: 'https://clinicaltrials.gov/api/v2/studies' },
  },
  civic: {
    transport: 'http',
    name: 'CIViC — evidencia predictiva de terapias en cáncer, condicionada a un perfil molecular',
    owner: 'Griffith Lab, McDonnell Genome Institute, Washington University',
    officialUrl: 'https://civicdb.org/',
    repo: null,
    commit: null,
    versionTag: 'CIViC-2026-10-27',
    version: 'CIViC API GraphQL, consulta del 2026-10-27',
    license: 'CC0 1.0: «The content of CIViC … is released under the Creative Commons Public Domain Dedication (CC0 1.0 Universal)» (https://docs.civicdb.org/en/latest/about/faq.html)',
    licenseUrl: 'https://docs.civicdb.org/en/latest/about/faq.html',
    files: { evidence: 'civic/predictive-evidence.ndjson' },
    urls: { graphql: 'https://civicdb.org/api/graphql' },
  },
};

/** Cruces publicados que solo agregan códigos (no aportan relaciones fármaco → enfermedad). */
export const OPEN_CROSSWALKS = {
  'rxclass-atc': {
    transport: 'http',
    name: 'RxClass (NLM) — RxCUI → código ATC (relaSource=ATC)',
    owner: 'U.S. National Library of Medicine',
    versionTag: 'RxClass-2026-10-27',
    version: 'RxNav RxClass API, consulta del 2026-10-27 (RxNorm del momento)',
    license:
      'API pública de la NLM sin licencia previa. De la OMS solo se guarda el CÓDIGO ATC (nivel 5); no se guardan nombres de clases ni DDD (derechos de la OMS / WHO CC).',
    licenseUrl: 'https://lhncbc.nlm.nih.gov/RxNav/TermsofService.html',
    files: { atc: 'rxclass/rxcui-atc.tsv' },
  },
  'chembl-atc': {
    transport: 'http',
    name: 'ChEMBL — molécula → códigos ATC',
    owner: 'EMBL-EBI (ChEMBL)',
    versionTag: 'ChEMBL_37',
    version: 'ChEMBL_37, endpoint molecule (campo atc_classifications)',
    license: 'CC BY-SA 3.0 (ver chembl). Solo el código ATC; sin nombres de clase.',
    licenseUrl: 'https://ftp.ebi.ac.uk/pub/databases/chembl/ChEMBLdb/latest/README',
    files: { atc: 'chembl/molecule-atc.tsv' },
  },
  'wikidata-ids': {
    transport: 'http',
    name: 'Wikidata — identificadores externos de sustancias y enfermedades (ATC P267, RxNorm P3345, ChEMBL P592, …)',
    owner: 'Wikimedia Foundation',
    versionTag: 'wikidata-2026-10-27',
    version: 'Wikidata Query Service, consulta del 2026-10-27',
    license: 'CC0 1.0',
    licenseUrl: 'https://www.wikidata.org/wiki/Wikidata:Licensing',
    files: { ids: 'wikidata/item-ids.ndjson' },
  },
  'drugcentral-ids': {
    transport: 'http',
    name: 'DrugCentral 2027 — identificadores y ATC por fármaco',
    owner: 'University of New Mexico (DrugCentral)',
    versionTag: 'DrugCentral-2026-09-25',
    version: 'DrugCentral 2027, volcado 2026-09-25',
    license: 'CC BY-SA 4.0. Solo el código ATC; sin nombres de clase.',
    licenseUrl: 'https://drugcentral.org/privacy',
    files: { identifiers: 'drugcentral/identifier.tsv', atc: 'drugcentral/struct2atc.tsv' },
  },
  'mesh-concepts': {
    transport: 'http',
    name: 'MeSH 2026 — concepto (M) → descriptor (D)',
    owner: 'U.S. National Library of Medicine',
    versionTag: 'MeSH-2026',
    version: 'desc2026.xml (MeSH 2026)',
    license: 'Obra de la NLM; términos de uso de MeSH (https://www.nlm.nih.gov/databases/download/terms_and_conditions.html).',
    licenseUrl: 'https://www.nlm.nih.gov/databases/download/terms_and_conditions.html',
    files: { concepts: 'mesh/concept-descriptor.tsv' },
  },
};

/**
 * Tipos de relación, uno por tipo que declara cada fuente. `polarity`:
 *   positive        la fuente afirma un uso terapéutico/preventivo
 *   negative        la fuente afirma lo contrario (contraindicación, no indicación)
 *   investigational en estudio (fase y estado en la evidencia); NO es un tratamiento
 *   diagnostic      uso diagnóstico; NO es un tratamiento
 *   conditional     vale solo con un perfil molecular/biomarcador; NO es un tratamiento general
 */
export const OPEN_RELATION_TYPES = {
  'medrt:may_treat': {
    source: 'medrt',
    polarity: 'positive',
    definitionEn: 'may_treat – therapeutic use or indication of an ingredient (Target: MeSH).',
    labelEs: 'Puede tratar (MED-RT)',
  },
  'medrt:may_prevent': {
    source: 'medrt',
    polarity: 'positive',
    definitionEn: 'may_prevent – preventative use or indication of an ingredient (Target: MeSH).',
    labelEs: 'Puede prevenir (MED-RT)',
  },
  'medrt:may_diagnose': {
    source: 'medrt',
    polarity: 'diagnostic',
    definitionEn: 'may_diagnose – diagnostic use or indication of an ingredient (Target: MeSH).',
    labelEs: 'Puede diagnosticar (MED-RT; uso diagnóstico, no tratamiento)',
  },
  'medrt:CI_with': {
    source: 'medrt',
    polarity: 'negative',
    definitionEn: 'CI_with – therapeutic or co-morbid contraindication of an ingredient (Target: MeSH).',
    labelEs: 'Contraindicado con (MED-RT)',
  },
  'chembl:indication-phase-4': {
    source: 'chembl',
    polarity: 'positive',
    definitionEn:
      'MAX_PHASE_FOR_IND = 4 — Maximum phase of development that the drug is known to have reached for this particular indication (4 = Approved, 3 = Phase 3 Clinical Trials, 2 = Phase 2 Clinical Trials, 1 = Phase 1 Clinical Trials, 0.5 = Early Phase 1 Clinical Trials, -1 = Clinical Phase unknown for drug or clinical candidate drug ie where ChEMBL cannot assign a clinical phase)',
    labelEs: 'Indicación aprobada, fase máxima 4 (ChEMBL)',
  },
  'chembl:indication-phase-3': {
    source: 'chembl',
    polarity: 'investigational',
    definitionEn:
      'MAX_PHASE_FOR_IND = 3 — Maximum phase of development that the drug is known to have reached for this particular indication (4 = Approved, 3 = Phase 3 Clinical Trials, 2 = Phase 2 Clinical Trials, 1 = Phase 1 Clinical Trials, 0.5 = Early Phase 1 Clinical Trials, -1 = Clinical Phase unknown for drug or clinical candidate drug ie where ChEMBL cannot assign a clinical phase)',
    labelEs: 'En estudio, fase máxima 3 (ChEMBL)',
  },
  'chembl:indication-phase-2': {
    source: 'chembl',
    polarity: 'investigational',
    definitionEn:
      'MAX_PHASE_FOR_IND = 2 — Maximum phase of development that the drug is known to have reached for this particular indication (4 = Approved, 3 = Phase 3 Clinical Trials, 2 = Phase 2 Clinical Trials, 1 = Phase 1 Clinical Trials, 0.5 = Early Phase 1 Clinical Trials, -1 = Clinical Phase unknown for drug or clinical candidate drug ie where ChEMBL cannot assign a clinical phase)',
    labelEs: 'En estudio, fase máxima 2 (ChEMBL)',
  },
  'chembl:indication-phase-1': {
    source: 'chembl',
    polarity: 'investigational',
    definitionEn:
      'MAX_PHASE_FOR_IND = 1 — Maximum phase of development that the drug is known to have reached for this particular indication (4 = Approved, 3 = Phase 3 Clinical Trials, 2 = Phase 2 Clinical Trials, 1 = Phase 1 Clinical Trials, 0.5 = Early Phase 1 Clinical Trials, -1 = Clinical Phase unknown for drug or clinical candidate drug ie where ChEMBL cannot assign a clinical phase)',
    labelEs: 'En estudio, fase máxima 1 (ChEMBL)',
  },
  'chembl:indication-phase-0.5': {
    source: 'chembl',
    polarity: 'investigational',
    definitionEn:
      'MAX_PHASE_FOR_IND = 0.5 — Maximum phase of development that the drug is known to have reached for this particular indication (4 = Approved, 3 = Phase 3 Clinical Trials, 2 = Phase 2 Clinical Trials, 1 = Phase 1 Clinical Trials, 0.5 = Early Phase 1 Clinical Trials, -1 = Clinical Phase unknown for drug or clinical candidate drug ie where ChEMBL cannot assign a clinical phase)',
    labelEs: 'En estudio, fase máxima 0,5 (ChEMBL)',
  },
  'chembl:indication-phase-unknown': {
    source: 'chembl',
    polarity: 'investigational',
    definitionEn:
      'MAX_PHASE_FOR_IND = -1 — Maximum phase of development that the drug is known to have reached for this particular indication (4 = Approved, 3 = Phase 3 Clinical Trials, 2 = Phase 2 Clinical Trials, 1 = Phase 1 Clinical Trials, 0.5 = Early Phase 1 Clinical Trials, -1 = Clinical Phase unknown for drug or clinical candidate drug ie where ChEMBL cannot assign a clinical phase)',
    labelEs: 'Indicación con fase clínica desconocida, max_phase_for_ind = -1 (ChEMBL)',
  },
  'chembl:indication-phase-null': {
    source: 'chembl',
    polarity: 'investigational',
    definitionEn: 'MAX_PHASE_FOR_IND is NULL in the ChEMBL drug_indication row (no maximum phase reported for this indication).',
    labelEs: 'Indicación sin fase máxima informada, max_phase_for_ind nulo (ChEMBL)',
  },
  'drugcentral:indication': {
    source: 'drugcentral',
    polarity: 'positive',
    definitionEn: 'relationship_name = indication (drug indications based on OMOP v4 and manual annotations).',
    labelEs: 'Indicación (DrugCentral)',
  },
  'drugcentral:contraindication': {
    source: 'drugcentral',
    polarity: 'negative',
    definitionEn: 'relationship_name = contraindication (drug contra-indications based on OMOP v4 and manual annotations).',
    labelEs: 'Contraindicación (DrugCentral)',
  },
  'drugcentral:off-label-use': {
    source: 'drugcentral',
    polarity: 'positive',
    definitionEn: 'relationship_name = off-label use (drug off-label use based on OMOP v4 and manual annotations).',
    labelEs: 'Uso fuera de indicación (DrugCentral)',
  },
  'drugcentral:symptomatic-treatment': {
    source: 'drugcentral',
    polarity: 'positive',
    definitionEn: 'relationship_name = symptomatic treatment (DrugCentral omop_relationship).',
    labelEs: 'Tratamiento sintomático (DrugCentral)',
  },
  'drugcentral:reduce-risk': {
    source: 'drugcentral',
    polarity: 'positive',
    definitionEn: 'relationship_name = reduce risk (DrugCentral omop_relationship).',
    labelEs: 'Reduce el riesgo (DrugCentral)',
  },
  'drugcentral:diagnosis': {
    source: 'drugcentral',
    polarity: 'diagnostic',
    definitionEn: 'relationship_name = diagnosis (DrugCentral omop_relationship).',
    labelEs: 'Diagnóstico (DrugCentral; uso diagnóstico, no tratamiento)',
  },
  'wikidata:P2176': {
    source: 'wikidata',
    polarity: 'positive',
    definitionEn: 'P2176 drug or therapy used for treatment: drug, procedure, or therapy that is used to treat a medical condition (statement on the condition).',
    labelEs: 'Fármaco o terapia usado para el tratamiento (Wikidata P2176)',
  },
  'wikidata:P2175': {
    source: 'wikidata',
    polarity: 'positive',
    definitionEn: 'P2175 medical condition treated: disease that this pharmaceutical drug, procedure, or therapy is used to treat (statement on the drug).',
    labelEs: 'Condición médica tratada (Wikidata P2175)',
  },
  'eeml:recommendation': {
    source: 'eeml',
    polarity: 'positive',
    definitionEn: 'WHO Model List of Essential Medicines recommendation: the medicine is listed for the indication (ICD-11 code) in an EML section.',
    labelEs: 'Medicamento esencial recomendado para la indicación (OMS eEML)',
  },
  'ema:therapeutic-area-authorised': {
    source: 'ema',
    polarity: 'positive',
    definitionEn: 'Therapeutic area (MeSH) of a medicine with Medicine status = Authorised in the EMA medicines report.',
    labelEs: 'Área terapéutica (MeSH) de un medicamento autorizado por la UE (EMA)',
  },
  'opentargets:ema-human-drugs-indication': {
    source: 'opentargets',
    polarity: 'positive',
    definitionEn: 'clinical_report with origin REGULATORY_AGENCY, provider EMA, type INDICATION, source "EMA Human Drugs" and clinicalStage APPROVAL (Open Targets Platform).',
    labelEs: 'Indicación de un medicamento autorizado por la EMA (informe de Open Targets)',
  },
  'clinicaltrials:studied-in-registered-study': {
    source: 'clinicaltrials',
    polarity: 'investigational',
    definitionEn:
      'The intervention and the condition are both listed (MeSH terms assigned by ClinicalTrials.gov) in the same registered interventional study; phase and overall status come from the study record.',
    labelEs: 'En estudio: figuran juntos en estudios registrados en ClinicalTrials.gov (no es una indicación)',
  },
  'civic:predictive-supports-sensitivity-response': {
    source: 'civic',
    polarity: 'conditional',
    definitionEn: 'evidence_type PREDICTIVE, evidence_direction SUPPORTS, significance SENSITIVITYRESPONSE (for the molecular profile of the evidence item).',
    labelEs: 'Evidencia predictiva que apoya sensibilidad/respuesta, según perfil molecular (CIViC)',
  },
  'civic:predictive-supports-resistance': {
    source: 'civic',
    polarity: 'conditional',
    definitionEn: 'evidence_type PREDICTIVE, evidence_direction SUPPORTS, significance RESISTANCE (for the molecular profile of the evidence item).',
    labelEs: 'Evidencia predictiva que apoya resistencia, según perfil molecular (CIViC)',
  },
  'civic:predictive-supports-reduced-sensitivity': {
    source: 'civic',
    polarity: 'conditional',
    definitionEn: 'evidence_type PREDICTIVE, evidence_direction SUPPORTS, significance REDUCED_SENSITIVITY (for the molecular profile of the evidence item).',
    labelEs: 'Evidencia predictiva que apoya sensibilidad reducida, según perfil molecular (CIViC)',
  },
  'civic:predictive-supports-adverse-response': {
    source: 'civic',
    polarity: 'conditional',
    definitionEn: 'evidence_type PREDICTIVE, evidence_direction SUPPORTS, significance ADVERSE_RESPONSE (for the molecular profile of the evidence item).',
    labelEs: 'Evidencia predictiva que apoya respuesta adversa, según perfil molecular (CIViC)',
  },
  'civic:predictive-does-not-support-sensitivity-response': {
    source: 'civic',
    polarity: 'conditional',
    definitionEn: 'evidence_type PREDICTIVE, evidence_direction DOES_NOT_SUPPORT, significance SENSITIVITYRESPONSE (for the molecular profile of the evidence item).',
    labelEs: 'Evidencia predictiva que NO apoya sensibilidad/respuesta, según perfil molecular (CIViC)',
  },
  'civic:predictive-does-not-support-resistance': {
    source: 'civic',
    polarity: 'conditional',
    definitionEn: 'evidence_type PREDICTIVE, evidence_direction DOES_NOT_SUPPORT, significance RESISTANCE (for the molecular profile of the evidence item).',
    labelEs: 'Evidencia predictiva que NO apoya resistencia, según perfil molecular (CIViC)',
  },
  'civic:predictive-does-not-support-reduced-sensitivity': {
    source: 'civic',
    polarity: 'conditional',
    definitionEn: 'evidence_type PREDICTIVE, evidence_direction DOES_NOT_SUPPORT, significance REDUCED_SENSITIVITY (for the molecular profile of the evidence item).',
    labelEs: 'Evidencia predictiva que NO apoya sensibilidad reducida, según perfil molecular (CIViC)',
  },
  'civic:predictive-does-not-support-adverse-response': {
    source: 'civic',
    polarity: 'conditional',
    definitionEn: 'evidence_type PREDICTIVE, evidence_direction DOES_NOT_SUPPORT, significance ADVERSE_RESPONSE (for the molecular profile of the evidence item).',
    labelEs: 'Evidencia predictiva que NO apoya respuesta adversa, según perfil molecular (CIViC)',
  },
};
