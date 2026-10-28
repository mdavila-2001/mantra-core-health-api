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
      'Datos abiertos de PAMI (conjunto «nomenclador», creado y modificado por última vez el 2022-08-03), redistribuidos por nomenclador-salud-js (ISC). Licencia del conjunto: CC-BY-4.0 según el metadato del portal propio de PAMI (datos.pami.org.ar, leído el 2026-10-27; datos.gob.ar responde 502). Cotejado contra el CSV oficial: mismos 4 739 códigos; el paquete trae los nombres en Title Case y el original en MAYÚSCULAS.',
    obtain: 'npm',
    npm: { name: 'nomenclador-salud-js', version: '1.0.2' },
    dir: 'nomenclador-salud-js',
    redistributor: 'https://www.npmjs.com/package/nomenclador-salud-js',
  },
  'gtr-ncbi': {
    sourceCode: 'NCBI_GTR',
    name: 'NCBI Genetic Testing Registry (GTR) — pruebas genéticas registradas por laboratorios',
    owner: 'National Center for Biotechnology Information (NCBI), National Library of Medicine (NLM/NIH), EE. UU.',
    officialUrl: 'https://www.ncbi.nlm.nih.gov/gtr/',
    license:
      'Dominio público: «Information that is created by or for the US government on this site is within the public domain» (https://ftp.ncbi.nlm.nih.gov/pub/GTR/data/_README.html). NCBI pide atribuir a GTR (http://www.ncbi.nlm.nih.gov/gtr/; cita: http://nar.oxfordjournals.org/content/41/D1/D925.full). Aviso de NIH: no verifica de forma independiente lo que envían los laboratorios ni respalda pruebas ni laboratorios.',
    obtain: 'http',
    dir: 'ncbi-gtr',
    files: [
      { name: 'test_version.gz', url: 'https://ftp.ncbi.nlm.nih.gov/pub/GTR/data/test_version.gz' },
      { name: 'test_condition_gene.txt', url: 'https://ftp.ncbi.nlm.nih.gov/pub/GTR/data/test_condition_gene.txt' },
      { name: 'tests_by_method_category.txt', url: 'https://ftp.ncbi.nlm.nih.gov/pub/GTR/data/tests_by_method_category.txt' },
      { name: '_README.html', url: 'https://ftp.ncbi.nlm.nih.gov/pub/GTR/data/_README.html' },
    ],
  },
  'dicom-dcm': {
    sourceCode: 'DICOM_PS316',
    name: 'DICOM PS3.16 — Context Group CID 29 «Acquisition Modality» (códigos DCM)',
    owner: 'National Electrical Manufacturers Association (NEMA) — DICOM Standards Committee',
    officialUrl: 'https://dicom.nema.org/medical/dicom/current/output/chtml/part16/sect_CID_29.html',
    license:
      '© NEMA. «The DICOM Standard is free to download and use» (https://www.dicomstandard.org/). El aviso de marca y derechos está en https://www.dicomstandard.org/about-home/trademark: DICOM® es marca registrada de NEMA para sus publicaciones de estándares; el copyright del estándar es de NEMA. El sitio NO publica un texto de licencia de redistribución: uso declarado libre, redistribución a confirmar por el propietario (capa aislada: se puede retirar sola).',
    obtain: 'http',
    dir: 'dicom-nema',
    files: [
      { name: 'ValueSet-dicom-cid-29-AcquisitionModality.json', url: 'https://dicom.nema.org/medical/dicom/resources/valuesets/fhir/json/ValueSet-dicom-cid-29-AcquisitionModality.json' },
      { name: 'chapter_D.html', url: 'https://dicom.nema.org/medical/dicom/current/output/chtml/part16/chapter_D.html' },
      { name: 'sect_CID_29.html', url: 'https://dicom.nema.org/medical/dicom/current/output/chtml/part16/sect_CID_29.html' },
    ],
  },
  'radlex-playbook': {
    sourceCode: 'RSNA_RADLEX_PLAYBOOK',
    name: 'RSNA RadLex Playbook — lexicón de órdenes, procedimientos y protocolos de radiología',
    owner: 'Radiological Society of North America (RSNA)',
    officialUrl: 'https://playbook.radlex.org/',
    license:
      'Copyright 2014 RSNA. RadLex License Version 2.1 (2025-01-06), http://www.rsna.org/radlexdownloads/ : licencia de copyright mundial, no exclusiva, sin cargo y libre de regalías para reproducir, adaptar, mostrar y redistribuir el Playbook con condiciones: (a) dar aviso y una copia del Acuerdo a quien reciba la obra (copia en data/licenses/); (b) toda adaptación debe declarar que modificó la obra, que no es la obra original y que no está respaldada por RSNA; (c) no se cambian el RPID, el código de letras, el nombre corto, el nombre largo, la descripción ni los pares atributo-valor; (d) se conservan los avisos de copyright; (e) no se usan las marcas RSNA/RadLex/RadLex Playbook salvo para atribuir. Esta capa es una adaptación (NDJSON normalizado, estado y subconjuntos como propiedades) y NO está respaldada ni aprobada por RSNA. Obra provista «AS IS» sin garantías.',
    obtain: 'http',
    dir: 'rsna-radlex-playbook',
    files: [
      { name: 'complete-playbook-dev.csv', url: 'https://api3.rsna.org/radlex/v1/createCsv?csvType=new' },
      { name: 'subset-table-playbook-dev.csv', url: 'https://api3.rsna.org/radlex/v1/createCsv?csvType=subset' },
      { name: 'map-to-table-playbook-dev.xlsx', url: 'https://api3.rsna.org/radlex/v1/createXlsx' },
      { name: 'RadLex_License_Agreement_and_Terms_of_Use_V2.1.pdf', url: 'http://www.rsna.org/uploadedFiles/RSNA/Content/Informatics/RadLex_License_Agreement_and_Terms_of_Use_V2_Final.pdf' },
    ],
  },
  // Originales que sólo se bajan para COTEJAR las redistribuciones de npm (no generan una capa propia).
  'pami-datos': {
    sourceCode: 'PAMI_DATOS',
    name: 'PAMI — Portal de datos abiertos (original del nomenclador de prácticas médicas)',
    owner: 'Instituto Nacional de Servicios Sociales para Jubilados y Pensionados (INSSJP / PAMI), Argentina',
    officialUrl: 'https://datos.pami.org.ar/dataset/nomenclador',
    license: 'CC-BY-4.0 (https://creativecommons.org/licenses/by/4.0/), según `license_id` del conjunto «nomenclador» en datos.pami.org.ar (CKAN `package_search`, 2026-10-27); autor INSSJP; creado 2022-08-03.',
    obtain: 'http',
    dir: 'pami-datos',
    files: [
      { name: 'nomenclador-comun.csv', url: 'https://datos.pami.org.ar/dataset/9937b24d-abad-45fb-8158-c1c5684d2635/resource/5d32d7a8-3d6a-4ed4-9701-6d4fd024c657/download/nomenclador-comun.csv' },
      { name: 'package_show.json', url: 'https://datos.pami.org.ar/api/3/action/package_show?id=nomenclador' },
    ],
  },
  'tuss-ans-original': {
    sourceCode: 'ANS_TUSS_PDA049',
    name: 'ANS — Plan de Dados Abertos PDA-049, TUSS (original)',
    owner: 'Agência Nacional de Saúde Suplementar (ANS), Brasil',
    officialUrl: 'https://dadosabertos.ans.gov.br/FTP/PDA/terminologia_unificada_saude_suplementar_TUSS-049/',
    license: 'Dados abertos del PDA de la ANS. El Plano de Dados Abertos define «dados abertos» como los publicados bajo licencia abierta (uso, reuso y redistribución con, como máximo, crédito y compartir igual); el conjunto TUSS no declara un texto de licencia propio. El PDF del PDA es CC BY-NC-ND 4.0 (la obra documental, no los datos).',
    obtain: 'http',
    dir: 'ans-tuss-original',
    files: [
      { name: 'pda-049-tuss.zip', url: 'https://dadosabertos.ans.gov.br/FTP/PDA/terminologia_unificada_saude_suplementar_TUSS-049/pda-049-tuss.zip' },
      { name: 'dicionario-pda-049-tuss.ods', url: 'https://dadosabertos.ans.gov.br/FTP/PDA/terminologia_unificada_saude_suplementar_TUSS-049/dicionario-pda-049-tuss.ods' },
    ],
  },
  // CC BY-SA 4.0 (compartir igual): se descarga y se prueba, pero NO entra en el build ni en la carga por omisión.
  'cups-co': {
    sourceCode: 'MINSALUD_POSPOPULI_CUPS',
    name: 'CUPS Colombia — exámenes de laboratorio del Plan de Beneficios en Salud (POSpópuli, datos.gov.co)',
    owner: 'Ministerio de Salud y Protección Social (MinSalud), Colombia',
    officialUrl: 'https://www.datos.gov.co/d/s5f2-yivs',
    license:
      'Creative Commons Atribución-CompartirIgual 4.0 Internacional (CC BY-SA 4.0), según el metadato `licenseId` = CC_40_BY_SA del conjunto en datos.gov.co (leído el 2026-10-27). Atribución: Ministerio de Salud y Protección Social - MinSalud, Bogotá D.C. Compartir igual: cargarlo al catálogo es una decisión del propietario.',
    obtain: 'http',
    shareAlike: true,
    dir: 'cups-co',
    files: [
      { name: 'pospopuli-laboratorio.json', url: 'https://www.datos.gov.co/resource/s5f2-yivs.json?$limit=50000&$order=:id' },
      { name: 'pospopuli-laboratorio.meta.json', url: 'https://www.datos.gov.co/api/views/s5f2-yivs.json' },
      { name: 'pospopuli-procedimientos-pbs.json', url: 'https://www.datos.gov.co/resource/9zcz-bjue.json?$limit=50000&$order=:id' },
      { name: 'pospopuli-procedimientos-pbs.meta.json', url: 'https://www.datos.gov.co/api/views/9zcz-bjue.json' },
    ],
  },
};

/** Fuentes evaluadas que no se pudieron obtener o no se usan: van a la cobertura como hueco. */
export const GAPS = [
  {
    source: 'LOINC (distribución completa: Loinc.csv, PartFile, PanelsAndForms, LinguisticVariants, Universal Lab Orders, RSNA Playbook, Top 2000)',
    url: 'https://loinc.org/downloads/',
    reason: 'Exige cuenta gratuita en loinc.org y aceptar la licencia (acción de una persona; no se crean cuentas). loinc.org y fhir.loinc.org responden 403 (re-sondeo 2026-10-28). El parser existe y está probado con CSV sintéticos, no con el archivo real.',
    status: 'pendiente-usuario',
  },
  {
    source: 'LOINC, subconjunto público por NLM Clinical Table Search Service (import-loinc.mjs)',
    url: 'https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search',
    reason: 'Sin cuenta. clinicaltables.nlm.nih.gov responde 200 desde 2026-10-27 (prefijo LOINC_NUM «1»: 25 169 códigos). El importador genérico import-loinc.mjs (fuera de este carril) ya existe y puede correr; este catálogo enriquece los mismos ids. No se corrió en este carril (cientos de pedidos; sin paneles ni castellano).',
    status: 'alcanzable-sin-correr',
  },
  {
    source: 'HL7 tx.fhir.org / fhir.loinc.org ($lookup de LOINC con partes y variante ES)',
    url: 'https://tx.fhir.org/r4',
    reason: 'tx.fhir.org responde 200 pero no se usó (LOINC por $lookup uno a uno); fhir.loinc.org exige cuenta de loinc.org (403).',
    status: 'bloqueado-licencia-cuenta',
  },
  {
    source: 'UCUM (ucum-essence.xml oficial)',
    url: 'https://ucum.org/ucum',
    reason: 'ucum.org no se re-sondeó; se usó la tabla de @lhncbc/ucum-lhc (npm), que se genera de ucum-essence.xml.',
    status: 'sustituido',
  },
  {
    source: 'CUPS Colombia — POSpópuli laboratorio (1 339 filas) y procedimientos del PBS (8 114 filas), datos.gov.co',
    url: 'https://www.datos.gov.co/d/s5f2-yivs · https://www.datos.gov.co/d/9zcz-bjue',
    reason: 'datos.gov.co responde 200 y el parser está probado con filas reales, pero la licencia declarada por el portal es CC BY-SA 4.0 (licenseId CC_40_BY_SA, leído 2026-10-28) y el repo no tiene un precedente aceptado de cargar contenido CompartirIgual: la capa se construye sólo con --include-share-alike. Decisión del propietario. La CUPS 2025 oficial (Resolución 2706 de 2025) la carga specialty-services.',
    status: 'decision-propietario-licencia',
  },
  {
    source: 'Nomenclador de México (datos.gob.mx, DGIS)',
    url: 'https://www.datos.gob.mx/ · http://www.dgis.salud.gob.mx/',
    reason: 'datos.gob.mx responde 403. dgis.salud.gob.mx responde 200 sólo por http; su página de catálogos NOM-024 (iis_catalogos_gobmx.html) no lista archivos descargables ni un catálogo de laboratorio/procedimientos. Sin fuente obtenible: nada que cargar.',
    status: 'bloqueado-red',
  },
  {
    source: 'Prestaciones SUS Bolivia (Ministerio de Salud y Deportes)',
    url: 'https://www.minsalud.gob.bo/',
    reason: 'https://www.minsalud.gob.bo/ no responde (conexión sin respuesta, 3 pedidos el 2026-10-28; http responde 301 a https). Sin fuente obtenible.',
    status: 'bloqueado-red',
  },
  {
    source: 'SIGTAP (SUS Brasil): cotejo con el archivo oficial TabelaUnificada',
    url: 'http://sigtap.datasus.gov.br/tabela-unificada/app/download.jsp',
    reason: 'El portal responde 200 pero su página de descargas dice «no momento o serviço de downloads encontra-se indisponível»; ftp2.datasus.gov.br da 503 (2026-10-28). SIGTAP sigue cargado desde la redistribución npm, que declara el ZIP oficial y su checksum, sin cotejar.',
    status: 'bloqueado-fuente',
  },
  {
    source: 'FONASA (Chile): cotejo con el XLSX oficial del arancel MLE',
    url: 'https://www.fonasa.cl/',
    reason: 'fonasa.cl y fonasa.gob.cl responden 403 (2026-10-28). FONASA sigue cargado desde la redistribución npm sin cotejar.',
    status: 'bloqueado-red',
  },
  {
    source: 'TUSS (ANS) y PAMI: cotejo con los originales',
    url: 'https://dadosabertos.ans.gov.br/ · https://datos.pami.org.ar/dataset/nomenclador',
    reason: 'HECHO: el ZIP oficial de la ANS es byte a byte el de npm (SHA-256 8d3bc59e…, 5 966 filas, 0 diferencias); el CSV de datos.pami.org.ar (CC-BY-4.0) tiene los mismos 4 739 códigos que npm (nombres iguales salvo caja y 10 filas con una letra griega perdida). datos.gob.ar sigue en 502. La ANS no declara texto de licencia propio para el conjunto: a confirmar por el propietario.',
    status: 'cotejado',
  },
  {
    source: 'ICD-10-PCS FY2026 (npm) frente a FY2027 oficial (CMS)',
    url: 'https://www.cms.gov/medicare/coding-billing/icd-10-codes',
    reason: 'procedures-treatments carga el FY2027 oficial completo (79 256 códigos) con el mismo code system icd10pcs-cms. Los 4 397 códigos de esta capa (FY2026) existen todos en FY2027 con el mismo texto, pero quedan como una segunda versión del code system con otros ids de concepto. Decisión del propietario: retirar esta capa y apuntar los value sets de dominio a los conceptos FY2027.',
    status: 'decision-propietario',
  },
  {
    source: 'Subgrupos mixtos (diagnóstico + tratamiento) de FONASA (11-01, 12-01, 13-01, 17-01, 17-07, 18-01, 19-01, 20-01), TUSS (4.02, 4.04, 4.07, 4.12, 4.13, 4.15) y PAMI (17, 26, 28, 29, 30, 31…)',
    url: '—',
    reason: 'Contienen pruebas funcionales y endoscopias reales (ECG, espirometría, audiometría, campimetría, EEG) mezcladas con procedimientos terapéuticos. Clasificarlas exige curaduría ítem por ítem: quedan fuera, con su tamaño en lab-tests-coverage.json.',
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
    source: 'Catálogos de laboratorios de referencia (Mayo Clinic Labs, ARUP, Quest)',
    url: 'https://www.mayocliniclabs.com/',
    reason: 'Sólo sirven para detectar huecos, nunca como fuente de códigos; además responden 403 desde esta sesión. Tubo/contenedor por análisis sólo lo publican estos catálogos: queda sin fuente.',
    status: 'solo-referencia',
  },
];
