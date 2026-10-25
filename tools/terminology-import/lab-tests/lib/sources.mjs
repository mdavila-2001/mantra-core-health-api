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
    license: 'Obra del gobierno federal de EE. UU. (CMS), dominio público. Archivos oficiales de cms.gov: order file y code tables FY2027.',
    obtain: 'url',
    dir: 'cms-icd10pcs',
  },
  'cups-co': {
    sourceCode: 'MINSALUD_CO_CUPS',
    name: 'CUPS — Clasificación Única de Procedimientos en Salud (MinSalud Colombia, POS Pópuli)',
    owner: 'Ministerio de Salud y Protección Social de Colombia',
    officialUrl: 'https://www.datos.gov.co/Salud-y-Protecci-n-Social/POSPOPULI-LABORATORIO/s5f2-yivs',
    license:
      'Datos abiertos de MinSalud Colombia en datos.gov.co (conjuntos s5f2-yivs y 9zcz-bjue), licencia Creative Commons Atribución-CompartirIgual 4.0 Internacional (CC BY-SA 4.0): se cita la fuente y las adaptaciones que se redistribuyan conservan la licencia.',
    obtain: 'url',
    dir: 'minsalud-co',
  },
  'gtr-ncbi': {
    sourceCode: 'NCBI_GTR',
    name: 'NCBI Genetic Testing Registry (GTR)',
    owner: 'National Center for Biotechnology Information (NCBI), U.S. National Library of Medicine',
    officialUrl: 'https://www.ncbi.nlm.nih.gov/gtr/',
    license:
      'Dominio público (información del gobierno de EE. UU., NCBI/NLM). NCBI pide atribución: enlace a https://www.ncbi.nlm.nih.gov/gtr/ y cita de Rubinstein WS et al., Nucleic Acids Res. 2013;41:D925.',
    obtain: 'ftp',
    dir: 'gtr',
  },
  'cdisc-sdtm': {
    sourceCode: 'CDISC_SDTM_CT',
    name: 'CDISC SDTM Controlled Terminology (NCI EVS)',
    owner: 'Clinical Data Interchange Standards Consortium (CDISC), mantenida por NCI Enterprise Vocabulary Services',
    officialUrl: 'https://evs.nci.nih.gov/ftp1/CDISC/SDTM/',
    license:
      'CDISC Controlled Terminology se mantiene y distribuye como parte del NCI Thesaurus (cdisc.org, página «Controlled Terminology»); NCI Thesaurus se publica bajo CC BY 4.0 (https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/ThesaurusTermsofUse.htm). Se cita a CDISC y a NCI EVS.',
    obtain: 'url',
    dir: 'cdisc',
  },
  'npu-ifcc': {
    sourceCode: 'IFCC_IUPAC_NPU',
    name: 'NPU Terminology (IFCC-IUPAC), versión internacional',
    owner: 'International Federation of Clinical Chemistry and Laboratory Medicine (IFCC) e International Union of Pure and Applied Chemistry (IUPAC); repositorio: Danish Health Data Authority',
    officialUrl: 'https://npu-terminology.org/npu-database/',
    license:
      'NPU License & Terms of Use (2023-05-17): uso y copia sin cargo, comercial o no comercial, para identificar observaciones clínicas de pacientes; prohibido cambiar códigos, definiciones o términos y traducirlos; toda copia cita la NPU Terminology como propiedad de IFCC e IUPAC y el sitio www.labterm.dk.',
    obtain: 'url',
    dir: 'npu',
  },
  'pami-nomenclador': {
    sourceCode: 'PAMI_NOMENCLADOR',
    name: 'PAMI — Nomenclador Común de prácticas médicas (Argentina)',
    owner: 'Instituto Nacional de Servicios Sociales para Jubilados y Pensionados (PAMI), Argentina',
    officialUrl: 'https://www.datos.gob.ar/dataset/pami-nomenclador-practicas-medicas--valor-por-capitas-modulos',
    license: 'Datos abiertos de PAMI publicados en datos.gob.ar bajo CC-BY-4.0 (verificado en la API CKAN del portal, conjunto «nomenclador»); se cita la fuente.',
    obtain: 'url',
    dir: 'pami',
  },
};

/** Fuentes evaluadas que no se pudieron obtener o no se usan: van a la cobertura como hueco. Estado al 2026-10-24 (red del entorno abierta). */
export const GAPS = [
  {
    source: 'LOINC, distribución oficial (zip «LOINC Table + Accessory Files»)',
    url: 'https://loinc.org/downloads/',
    reason: 'Exige cuenta en loinc.org (403 del propio servidor a clientes sin sesión). LOINC se cargó por tx.fhir.org + NLM; lo que SÓLO trae el zip queda pendiente: TIME_ASPCT, SYSTEM y SCALE_TYP en inglés, partes LP (LoincPartLink), Universal Lab Orders, Top 2000 y la armonización RSNA Playbook. El parser del zip ya existe.',
    status: 'pendiente-usuario',
  },
  {
    source: 'RSNA RadLex Playbook (RPID)',
    url: 'https://playbook.radlex.org/',
    reason: 'La descarga (api3.rsna.org/radlex/v1/createCsv) está detrás de la aceptación del «RadLex License Agreement and Terms of Use». No se acepta una licencia en nombre del propietario.',
    status: 'licencia',
  },
  {
    source: 'DICOM PS3.16 CID 29 (modalidades de adquisición)',
    url: 'https://dicom.nema.org/medical/dicom/current/output/chtml/part16/sect_CID_29.html',
    reason: 'Legible, pero la página de derechos de autor y marca de NEMA no responde (404) y el aviso del estándar es sólo un descargo de responsabilidad: la licencia no quedó verificada.',
    status: 'licencia-sin-verificar',
  },
  {
    source: 'SIGTAP (cotejo con el original)',
    url: 'ftp://ftp2.datasus.gov.br/pub/sistemas/tup/downloads/',
    reason: 'DATASUS publica sólo por FTP; el proxy del entorno sólo admite HTTPS. La redistribución npm declara el archivo y su checksum, pero no se cotejó.',
    status: 'no-cotejado',
  },
  {
    source: 'FONASA (cotejo con el XLSX oficial)',
    url: 'https://www.fonasa.cl/',
    reason: 'fonasa.cl responde 403. Se usa la redistribución npm, sin cotejar.',
    status: 'no-cotejado',
  },
  {
    source: 'CUPS completo (Colombia)',
    url: 'https://www.datos.gov.co/',
    reason: 'datos.gov.co no publica la tabla CUPS completa (búsquedas «CUPS» y «Clasificación Única de Procedimientos»); se usan los conjuntos POS Pópuli de MinSalud (laboratorio y PBS).',
    status: 'parcial',
  },
  {
    source: 'Nomencladores de México, prestaciones SUS Bolivia, INLASA',
    url: 'https://www.datos.gob.mx/ · https://www.minsalud.gob.bo/ · https://inlasa.gob.bo/',
    reason: 'minsalud.gob.bo e inlasa.gob.bo no responden (sin respuesta del servidor); no se encontró un catálogo nacional de análisis abierto de México. INLASA ya tiene importador propio (import-inlasa.mjs).',
    status: 'sin-acceso',
  },
  {
    source: 'Subgrupos mixtos (diagnóstico + tratamiento) de FONASA, TUSS, PAMI y PBS de Colombia',
    url: '—',
    reason: 'Contienen pruebas funcionales y endoscopias reales mezcladas con procedimientos terapéuticos; clasificarlas exige curaduría ítem por ítem. Tamaños en lab-tests-coverage.json (excludedByPrefix).',
    status: 'curaduria-pendiente',
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
    source: 'MBS — Medicare Benefits Schedule (Australia), grupos de patología e imagen',
    url: 'https://www.mbsonline.gov.au/internet/mbsonline/publishing.nsf/Content/copyright',
    reason: 'El XML se descarga, pero el copyright del Commonwealth sólo permite uso personal no comercial y prohíbe redistribuir sin permiso escrito. Se borró la copia.',
    status: 'licencia',
  },
  {
    source: 'JLAC10 / JLAC11 (Japanese Society of Laboratory Medicine)',
    url: 'https://www.jslm.org/committees/code/index.html',
    reason: 'Las tablas se descargan, pero la JSLM exige solicitar permiso de reproducción (転載許諾申請); no hay licencia abierta publicada.',
    status: 'licencia',
  },
  {
    source: 'Nomenclatura INAMI (Bélgica), NABM y CCAM (Francia)',
    url: 'https://www.inami.fgov.be/fr/nomenclature',
    reason: 'INAMI publica la nomenclatura sólo en PDF/Word («tous droits réservés») y NomenSoft responde 403; ameli.fr responde 403 y data.gouv.fr no tiene conjunto NABM.',
    status: 'sin-acceso',
  },
  {
    source: 'WHO Essential In Vitro Diagnostics List, ICHI (OMS), NICIP (NHS), CPMS (Perú)',
    url: 'https://www.who.int/publications/i/item/9789240081093',
    reason: 'EDL: informe PDF de categorías, no códigos, con licencia no comercial de la OMS (IRIS 403). ICHI: versión beta, sólo por API con registro. NICIP: TRUD exige cuenta. CPMS: basado en CPT (AMA).',
    status: 'licencia',
  },
  {
    source: 'Catálogos de laboratorios de referencia (Mayo Clinic Labs, ARUP, Quest)',
    url: 'https://www.mayocliniclabs.com/',
    reason: 'Sólo sirven para detectar huecos, nunca como fuente de códigos. Tubo/contenedor por análisis y rangos de referencia sólo los publican estos catálogos: quedan sin fuente abierta.',
    status: 'solo-referencia',
  },
];
