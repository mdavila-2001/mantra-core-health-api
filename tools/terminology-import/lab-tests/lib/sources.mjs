// =============================================================================
// Registro de fuentes del catálogo de análisis médicos (puro, sin red).
//
// Una entrada por fuente con lo que se escribe en `terminology_sources` y en la
// procedencia de cada concepto: dueño, licencia (verificada, no supuesta), URL
// oficial y de dónde se obtiene el archivo. Las descargas viven FUERA de git,
// en `<GLOSSARY_BUILD_DIR>/lab-tests-sources/<dir>/` (ver SOURCES.md).
//
// `obtain` dice cómo llega el archivo:
//   - 'npm'    : tarball del registro npm, verificado contra `dist.integrity`
//                (lo hace `fetch-lab-tests-sources.mjs`).
//   - 'manual' : exige una cuenta o aceptar una licencia: lo baja una persona.
// =============================================================================

export const LOINC_LICENSE_TEXT =
  'This material contains content from LOINC (http://loinc.org). LOINC is copyright © Regenstrief Institute, Inc. and the Logical Observation Identifiers Names and Codes (LOINC) Committee and is available at no cost under the license at http://loinc.org/license. LOINC® is a registered United States trademark of Regenstrief Institute, Inc.';

export const SOURCES = {
  loinc: {
    sourceCode: 'LOINC', // mismo `terminology_sources.code` que import-loinc.mjs
    name: 'LOINC — Logical Observation Identifiers Names and Codes',
    owner: 'Regenstrief Institute, Inc.',
    officialUrl: 'https://loinc.org/downloads/',
    license: LOINC_LICENSE_TEXT,
    obtain: 'manual',
    dir: 'loinc',
  },
  'hl7-tho': {
    sourceCode: 'HL7_THO',
    name: 'HL7 Terminology (THO)',
    owner: 'HL7 International — Vocabulary Work Group',
    officialUrl: 'https://terminology.hl7.org/',
    // `package.json` del paquete: "license": "CC0-1.0".
    license: 'CC0-1.0 (HL7 Terminology, https://terminology.hl7.org/license.html).',
    obtain: 'npm',
    npm: { name: 'hl7.terminology.r4', version: '7.0.1' },
    dir: 'hl7-terminology-r4',
  },
  ucum: {
    sourceCode: 'UCUM',
    name: 'UCUM — The Unified Code for Units of Measure (tabla de unidades de UCUM-LHC)',
    owner: 'Regenstrief Institute, Inc. (UCUM); tabla compilada por NLM/LHNCBC (ucum-lhc)',
    officialUrl: 'https://ucum.org/',
    license:
      'UCUM table and codes © 1995-2009 Regenstrief Institute, Inc. and the UCUM Organization, under https://ucum.org/license. Tabla `data/ucumDefs.min.json` de @lhncbc/ucum-lhc (NLM/LHNCBC; LICENSE.md tipo BSD: redistribución permitida conservando el aviso del dueño). Incluye combinaciones de unidades tomadas de LOINC: rige además https://loinc.org/terms-of-use.',
    obtain: 'npm',
    npm: { name: '@lhncbc/ucum-lhc', version: '8.0.1' },
    dir: 'ucum-lhc',
  },
  'fonasa-mle': {
    sourceCode: 'FONASA_MLE',
    name: 'FONASA — Arancel de la Modalidad Libre Elección (Chile)',
    owner: 'Fondo Nacional de Salud (FONASA), Chile',
    officialUrl: 'https://www.fonasa.cl/',
    license:
      'Arancel público de FONASA (información pública del Estado de Chile). Extraído de los XLSX oficiales y redistribuido por @mariohealthbits/fonasa-mle-open (licencia MIT del paquete). NO cotejado con el XLSX oficial: fonasa.cl responde 403 desde la sesión que lo cargó.',
    obtain: 'npm',
    npm: { name: '@mariohealthbits/fonasa-mle-open', version: '1.0.0' },
    dir: 'fonasa-mle-open',
    redistributor: 'https://www.npmjs.com/package/@mariohealthbits/fonasa-mle-open',
  },
  'sigtap-sus': {
    sourceCode: 'DATASUS_SIGTAP',
    name: 'SIGTAP — Tabela de Procedimentos, Medicamentos e OPM do SUS (Brasil)',
    owner: 'Ministério da Saúde / DATASUS, Brasil',
    officialUrl: 'http://sigtap.datasus.gov.br/',
    license:
      'Dados públicos do Ministério da Saúde (DATASUS). Redistribuídos sem modificação de conteúdo por @br-health-kit/sigtap (MIT), desde ftp2.datasus.gov.br/pub/sistemas/tup/downloads/ (archivo y checksum en el metadata.json del paquete).',
    obtain: 'npm',
    npm: { name: '@br-health-kit/sigtap', version: '1.0.0' },
    dir: 'br-health-kit-sigtap',
    redistributor: 'https://www.npmjs.com/package/@br-health-kit/sigtap',
  },
  'tuss-ans': {
    sourceCode: 'ANS_TUSS',
    name: 'TUSS — Terminologia Unificada da Saúde Suplementar, tabela 22 (Brasil)',
    owner: 'Agência Nacional de Saúde Suplementar (ANS), Brasil',
    officialUrl: 'https://dadosabertos.ans.gov.br/FTP/PDA/terminologia_unificada_saude_suplementar_TUSS-049/',
    license:
      'Dados abertos da ANS (Plano de Dados Abertos, PDA-049), redistribuídos sem modificação por @br-health-kit/tuss (MIT). La licencia del conjunto en el portal de la ANS no se pudo leer (403 desde la sesión): a confirmar.',
    obtain: 'npm',
    npm: { name: '@br-health-kit/tuss', version: '1.0.0' },
    dir: 'br-health-kit-tuss',
    redistributor: 'https://www.npmjs.com/package/@br-health-kit/tuss',
  },
  'icd10pcs-cms': {
    sourceCode: 'CMS_ICD10PCS',
    name: 'ICD-10-PCS — International Classification of Diseases, 10th Revision, Procedure Coding System (EE. UU.)',
    owner: 'Centers for Medicare & Medicaid Services (CMS), EE. UU.',
    officialUrl: 'https://www.cms.gov/medicare/coding-billing/icd-10-codes',
    license:
      'Obra del gobierno federal de EE. UU. (CMS), dominio público. Tomado del índice SQLite que empaqueta @cyanheads/medical-codes-mcp-server (Apache-2.0), construido desde los order files oficiales de CMS (release y URL en su tabla build_meta).',
    obtain: 'npm',
    npm: { name: '@cyanheads/medical-codes-mcp-server', version: '0.4.1' },
    dir: 'medical-codes-mcp-server',
    redistributor: 'https://www.npmjs.com/package/@cyanheads/medical-codes-mcp-server',
  },
  'pami-nomenclador': {
    sourceCode: 'PAMI_NOMENCLADOR',
    name: 'PAMI — Nomenclador de prácticas médicas (Argentina)',
    owner: 'Instituto Nacional de Servicios Sociales para Jubilados y Pensionados (PAMI), Argentina',
    officialUrl: 'https://www.datos.gob.ar/dataset/pami-nomenclador-practicas-medicas--valor-por-capitas-modulos',
    license:
      'Datos abiertos de PAMI en datos.gob.ar (conjunto creado y modificado por última vez el 2022-08-03), redistribuidos por nomenclador-salud-js (ISC). La licencia del conjunto en el portal no se pudo leer (403 desde la sesión): a confirmar.',
    obtain: 'npm',
    npm: { name: 'nomenclador-salud-js', version: '1.0.2' },
    dir: 'nomenclador-salud-js',
    redistributor: 'https://www.npmjs.com/package/nomenclador-salud-js',
  },
};

/** Fuentes evaluadas que no se pudieron obtener o no se usan: van a la cobertura como hueco. */
export const GAPS = [
  {
    source: 'LOINC (distribución completa: Loinc.csv, PartFile, PanelsAndForms, LinguisticVariants, Universal Lab Orders, RSNA Playbook, Top 2000)',
    url: 'https://loinc.org/downloads/',
    reason: 'Exige cuenta gratuita en loinc.org y aceptar la licencia (acción de una persona). Además, desde el entorno de esta sesión loinc.org responde 403 por la política de red.',
    status: 'pendiente-usuario',
  },
  {
    source: 'LOINC, subconjunto público por NLM Clinical Table Search Service (import-loinc.mjs)',
    url: 'https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search',
    reason: 'Sin cuenta, pero clinicaltables.nlm.nih.gov responde 403 desde esta sesión (política de red del entorno).',
    status: 'bloqueado-red',
  },
  {
    source: 'NCBI Genetic Testing Registry (GTR)',
    url: 'https://ftp.ncbi.nlm.nih.gov/pub/GTR/data/',
    reason: 'Dominio público (NCBI). ftp.ncbi.nlm.nih.gov responde 403 desde esta sesión. No se escribió parser a ciegas: el formato se valida contra el archivo real cuando esté.',
    status: 'bloqueado-red',
  },
  {
    source: 'RSNA RadLex Playbook (RPID)',
    url: 'https://playbook.radlex.org/',
    reason: 'playbook.radlex.org responde 403 desde esta sesión. La armonización LOINC/RSNA viaja también dentro de la distribución de LOINC (LoincRsnaRadiologyPlaybook.csv), que sí está soportada por el parser.',
    status: 'bloqueado-red',
  },
  {
    source: 'HL7 tx.fhir.org / fhir.loinc.org ($lookup de LOINC con partes y variante ES)',
    url: 'https://tx.fhir.org/r4',
    reason: '403 desde esta sesión; fhir.loinc.org además exige cuenta de loinc.org.',
    status: 'bloqueado-red',
  },
  {
    source: 'UCUM (ucum-essence.xml oficial)',
    url: 'https://ucum.org/ucum',
    reason: 'ucum.org responde 403; se usó la tabla de @lhncbc/ucum-lhc (npm), que se genera de ucum-essence.xml.',
    status: 'sustituido',
  },
  {
    source: 'CUPS (Colombia), nomenclador de México, prestaciones SUS Bolivia, INLASA',
    url: 'https://www.datos.gov.co/ · https://www.datos.gob.mx/ · https://www.minsalud.gob.bo/ · https://inlasa.gob.bo/',
    reason: 'Todos responden 403 desde esta sesión (política de red del entorno) y no hay redistribución en npm/PyPI/Maven. INLASA ya tiene importador propio (import-inlasa.mjs).',
    status: 'bloqueado-red',
  },
  {
    source: 'Archivos oficiales de FONASA, DATASUS (SIGTAP), ANS (TUSS) y datos.gob.ar (PAMI)',
    url: 'https://www.fonasa.cl/ · ftp://ftp2.datasus.gov.br/ · https://dadosabertos.ans.gov.br/ · https://www.datos.gob.ar/',
    reason: 'Se cargaron desde redistribuciones en npm (ver SOURCES.md); los originales responden 403 desde esta sesión y no se pudieron cotejar. SIGTAP y TUSS declaran el ZIP oficial y su checksum; FONASA y PAMI no.',
    status: 'sustituido',
  },
  {
    source: 'Subgrupos mixtos (diagnóstico + tratamiento) de FONASA (11-01, 12-01, 13-01, 17-01, 17-07, 18-01, 19-01, 20-01), TUSS (4.02, 4.04, 4.07, 4.12, 4.13, 4.15) y PAMI (17, 26, 28, 29, 30, 31…)',
    url: '—',
    reason: 'Contienen pruebas funcionales y endoscopias reales (ECG, espirometría, audiometría, campimetría, EEG) mezcladas con procedimientos terapéuticos. Clasificarlas exige curaduría ítem por ítem: quedan fuera, con su tamaño en lab-tests-coverage.json.',
    status: 'curaduria-pendiente',
  },
  {
    source: 'DICOM CID 29 (modalidades de adquisición)',
    url: 'https://dicom.nema.org/medical/dicom/current/output/chtml/part16/sect_CID_29.html',
    reason: 'dicom.nema.org responde 403. El code system DCM completo viaja en @medplum/definitions, pero sin la lista de miembros de CID 29 no se puede saber cuáles son modalidades sin adivinar.',
    status: 'bloqueado-red',
  },
  {
    source: 'SNOMED CT (tipos de muestra y procedimientos)',
    url: 'https://www.snomed.org/',
    reason: 'Bolivia no es miembro de SNOMED International: no hay licencia de país.',
    status: 'licencia',
  },
  {
    source: 'CPT (AMA)',
    url: 'https://www.ama-assn.org/practice-management/cpt',
    reason: 'Propiedad de la AMA, licencia comercial.',
    status: 'licencia',
  },
  {
    source: 'Catálogos de laboratorios de referencia (Mayo Clinic Labs, ARUP, Quest)',
    url: 'https://www.mayocliniclabs.com/',
    reason: 'Sólo sirven para detectar huecos, nunca como fuente de códigos; además responden 403 desde esta sesión. Tubo/contenedor por análisis sólo lo publican estos catálogos: queda sin fuente.',
    status: 'solo-referencia',
  },
];
