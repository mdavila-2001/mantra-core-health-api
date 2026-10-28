// =============================================================================
// Licencias verificadas de terminologías y escalas de enfermería.
//
// Cada entrada dice QUÉ se verificó, DÓNDE (URL), CUÁNDO y con qué nivel de
// evidencia. «secondary» = lo afirma una fuente que no es el titular (buscador,
// Wikipedia, LOINC, una guía clínica); «primary» = lo dice el titular. Las entradas del
// 2026-10-24 son casi todas secundarias (la red de entonces no llegaba a los titulares); las
// marcadas `checkedAt: '2026-10-27'` se leyeron ese día en el sitio del titular.
//
// Esta tabla NO habilita contenido por sí sola. El contenido de una escala se carga sólo si su estado es
// `declared-free` (lo dice el propio arquetipo) o `verified-free` (`LICENSE_OVERRIDES`, evidencia primaria sin
// reservas). Con evidencia primaria PERO una decisión del propietario sin tomar, el estado es
// `pending-owner-decision`: las filas se generan y se versionan, y el cargador las OMITE salvo
// `--owner-approved=<clave>` (ver `load-nursing-care.mjs`). Hoy no hay ningún `verified-free`; hay dos
// `pending-owner-decision`: la escala de Glasgow (clave `glasgow-coma-scale`) y el Omaha System (`omaha-system`).
//
// `url` es la dirección que devolvió la búsqueda o que cita la propia fuente;
// `null` cuando no se obtuvo ninguna (no se completa de memoria).
// =============================================================================

export const CHECKED_AT = '2026-10-24';

/**
 * Terminologías de enfermería reconocidas por la ANA (lista de 12; posición de
 * la ANA de marzo de 2015, citada abajo). Clave = id del NamingSystem de HL7 THO.
 */
export const TERMINOLOGY_LICENSES = {
  oms: {
    status: 'public-domain-terms-pending-owner-decision',
    loadable: false,
    blockedBy: 'owner-decision',
    approvalKey: 'omaha-system',
    checkedAt: '2026-10-27',
    summary: 'FAQ oficial, pregunta 1 (leída el 2026-10-27): «The Omaha System has existed in the public domain since 1975, and, therefore, is not held under copyright. The complete terms, definitions, and codes are presented in Appendix A and Appendix E of the 2005 book; they may be used by anyone without permission and without a licensing fee […]. However, the terms and structure must be used as described in the 2005 book, and referenced (ie 2005 book or Website).» Pero: «Other sections of the book including the User’s Guide are held under copyright by Health Connections Press […]. Developers and companies who design and sell software based on the Omaha System are also required to observe copyright laws related to the book and should contact Health Connections Press.» Cargar los términos en un producto comercial queda a la espera de que el propietario confirme con la editorial que entra en el uso libre: el corpus (320 conceptos) se arma y se versiona, pero el cargador lo OMITE salvo `--owner-approved=omaha-system`.',
    url: 'https://www.omahasystem.org/faq',
    evidence: 'primary (FAQ del sitio oficial, descargado y leído el 2026-10-27; SHA-256 en omaha-meta)',
  },
  CCC: {
    status: 'copyright-license-unverified',
    loadable: false,
    blockedBy: 'license-unverified',
    summary: 'Clinical Care Classification v2.5 © Virginia K. Saba (2012). Se distribuye con acuerdo de uso a través de SabaCare; no se pudo leer el acuerdo vigente.',
    url: null,
    evidence: 'secondary (catálogo editorial Springer 2012 y traducción italiana con © V. K. Saba)',
  },
  icnp: {
    status: 'licensed-permission-required',
    loadable: false,
    blockedBy: 'license',
    summary: 'ICNP es propiedad del Consejo Internacional de Enfermeras (CIE/ICN). Todo uso requiere permiso; el uso local no comercial es gratuito con formulario, el comercial paga tasas. Para miembros de SNOMED International se distribuye dentro de SNOMED CT; Bolivia no es miembro.',
    url: 'https://www.icn.ch/es/node/376',
    evidence: 'secondary (ICNP Q&A, ICN, octubre de 2020; página de descarga de ICNP del ICN)',
  },
  'nanda-i': {
    status: 'proprietary',
    loadable: false,
    blockedBy: 'license',
    summary: 'NANDA-I (hoy INKA) es propiedad intelectual protegida; integrarla en una historia clínica electrónica exige permiso formal o licencia de base de datos (licenciatarios regionales).',
    url: 'https://nanda.org/?p=7274',
    evidence: 'secondary (página de licencias de nanda.org vía buscador; RECOM como licenciatario)',
  },
  nic: {
    status: 'proprietary',
    loadable: false,
    blockedBy: 'license',
    summary: 'NIC (Universidad de Iowa / Elsevier): licencia comercial. No se copia contenido.',
    url: 'https://nursing.uiowa.edu/cncce/nursing-interventions-classification-overview',
    evidence: 'secondary (URI del NamingSystem de HL7 THO; README de tools/terminology-import)',
  },
  noc: {
    status: 'proprietary',
    loadable: false,
    blockedBy: 'license',
    summary: 'NOC (Universidad de Iowa / Elsevier): licencia comercial. No se copia contenido.',
    url: 'http://terminology.hl7.org/NamingSystem/noc',
    evidence: 'secondary (README de tools/terminology-import)',
  },
  pnds: {
    status: 'proprietary-unverified',
    loadable: false,
    blockedBy: 'license-unverified',
    summary: 'Perioperative Nursing Data Set, publicado por AORN. No se encontró una licencia abierta.',
    url: 'http://terminology.hl7.org/NamingSystem/pnds',
    evidence: 'secondary (publicador en el NamingSystem de HL7 THO)',
  },
  abcCodes: {
    status: 'proprietary-unverified',
    loadable: false,
    blockedBy: 'license-unverified',
    summary: 'ABC Codes (Alternative Link Systems): códigos de facturación de prestadores CAM y de enfermería en EE. UU.; retirado en HL7 THO.',
    url: 'http://terminology.hl7.org/NamingSystem/abcCodes',
    evidence: 'secondary (NamingSystem de HL7 THO, estado retired)',
  },
  nmds: {
    status: 'data-set-not-terminology',
    loadable: false,
    blockedBy: 'not-a-term-list',
    summary: 'Nursing Minimum Data Set: conjunto mínimo de variables, no una lista de términos clínicos; retirado en HL7 THO.',
    url: 'http://terminology.hl7.org/NamingSystem/nmds',
    evidence: 'secondary (NamingSystem de HL7 THO)',
  },
  nmmds: {
    status: 'data-set-not-terminology',
    loadable: false,
    blockedBy: 'not-a-term-list',
    summary: 'Nursing Management Minimum Data Set: variables de gestión de enfermería, no términos clínicos.',
    url: 'http://terminology.hl7.org/NamingSystem/nmmds',
    evidence: 'secondary (NamingSystem de HL7 THO)',
  },
  'v3-loinc': {
    status: 'free-license-with-terms',
    loadable: true,
    blockedBy: 'host-unreachable',
    summary: 'LOINC se usa con su licencia gratuita (aviso y atribución). El repo ya tiene `import-loinc.mjs`; este importador sólo ENLAZA por código a los conceptos LOINC presentes en la base.',
    url: null,
    evidence: 'secondary (README de tools/terminology-import)',
  },
  'v3-snomed-CT': {
    status: 'not-licensed-in-bolivia',
    loadable: false,
    blockedBy: 'license',
    summary: 'SNOMED CT requiere licencia de país miembro o de afiliado; Bolivia no es miembro de SNOMED International. Los enlaces a SNOMED de los arquetipos no se cargan: sólo se cuentan.',
    url: 'http://www.snomed.org/snomed-ct/get-snomedct',
    evidence: 'secondary (regla del pedido; README de tools/terminology-import)',
  },
};

/** Fuente de la lista de 12 terminologías reconocidas por la ANA. */
export const ANA_RECOGNITION = {
  title: 'ANA Position Statement: Inclusion of Recognized Terminologies Supporting Nursing Practice within Electronic Health Records and Other Health Information Technology Solutions (marzo de 2015)',
  url: 'https://www.nursingworld.org/globalassets/docs/ana/inclusion-of-recognized-terminologies-within-ehrs-and-other-health-information-technology-solutions.pdf',
  checkedAt: CHECKED_AT,
  evidence: 'secondary (resumen del buscador; el host no resolvía desde el contenedor)',
};

/**
 * Verificación de licencia de las escalas que nombra el pedido y de las
 * escalas de enfermería del corpus. Informativa: se guarda como propiedad del
 * concepto de la escala. Ninguna habilita contenido (ver encabezado).
 */
export const SCALE_LICENSE_NOTES = {
  'openEHR-EHR-OBSERVATION.braden_scale.v1': {
    holder: 'Barbara Braden y Nancy Bergstrom (1988); licencia vigente a través de HD Nursing',
    summary: 'El propio arquetipo transcribe «Copyright statement: Barbara Braden and Nancy Bergstrom, 1988 All rights reserved». El sitio oficial (bradenscale.com, 2026-10-27) dice que la escala se licencia («Click here to contact us to discuss licensing requirements, terms/conditions and fee»). Hueco de licencia.',
    url: 'https://www.bradenscale.com/faqs-braden-scale-ii',
    evidence: 'primary (titular; FAQ leído el 2026-10-27) y primary-in-archetype',
  },
  'openEHR-EHR-OBSERVATION.braden_scale_q.v0': {
    holder: 'Barbara Braden y Nancy Bergstrom (1988); versión Q modificada',
    summary: 'Mismo aviso de copyright que la escala de Braden.',
    url: 'http://bradenscale.com/copyright.htm',
    evidence: 'primary-in-archetype',
  },
  'openEHR-EHR-OBSERVATION.modified_barthel_index.v0': {
    holder: 'Maryland State Medical Society (MedChi), 1965',
    summary: 'Stroke Engine (2026-10-27) reproduce el aviso del titular: «The Maryland State Medical Society holds the copyright for the Barthel Index. It may be used freely for non commercial purposes with the following citation: Mahoney FI, Barthel D. “Functional evaluation: the Barthel Index.” Maryland State Med Journal 1965;14:56-61. Used with permission. Permission is required to modify the Barthel Index or to use it for commercial purposes.» Un catálogo de un producto comercial y el índice MODIFICADO (Shah, 1989) caen en «permiso requerido»: hueco de licencia.',
    url: 'https://strokengine.ca/en/assessments/barthel-index-bi/',
    evidence: 'secondary (sitio que cita al titular, leído el 2026-10-27; el titular, medchi.org, no se consultó)',
  },
  'openEHR-EHR-OBSERVATION.downton_fall_risk_index.v0': {
    holder: 'J. H. Downton (1993); sin titular identificado',
    summary: 'No se encontró ninguna declaración de licencia del instrumento. La licencia CC-BY-SA del arquetipo cubre el modelado, no el cuestionario.',
    url: 'https://ckm.openehr.org/ckm/archetypes/1013.1.5144',
    evidence: 'secondary (buscador)',
  },
  'openEHR-EHR-OBSERVATION.glasgow_coma_scale.v1': {
    holder: 'University of Glasgow (GCS); Sir Graham Teasdale (GCS Aid, GCS-P)',
    summary: 'Página oficial de permisos (leída el 2026-10-27): «The Glasgow Coma Scale (GCS), GCS Aid, GCS-P score, GCS P-Age CT prognostic charts and GCS verbal score imputation tool may all be used for clinical care and clinical research at no cost. No license is required. The copywrite of Glasgow University (GCS), and Sir Graham Teasdale (GCS Aid, GCS-P, GCS-P Age CT prognostic charts and imputation tool) should be acknowledged.» El permiso cubre «clinical care and clinical research»: incluir la escala en un catálogo de terminología de un producto no es, sin más, ninguno de los dos usos; además las filas vienen de un arquetipo CC BY-SA (obra derivada con *share-alike*, decisión legal ya abierta para todo CKM). Por eso NO se habilita sin decisión del propietario (`pending-owner-decision`): las filas se generan y se versionan, y el cargador las omite salvo `--owner-approved=glasgow-coma-scale`. Sólo escala de adultos; la pediátrica es otra adaptación.',
    url: 'https://www.glasgowcomascale.org/permissions/',
    evidence: 'primary (titular; página leída el 2026-10-27)',
  },
  'openEHR-EHR-OBSERVATION.news2.v1': {
    holder: 'Royal College of Physicians (2017)',
    summary: 'Página oficial de NEWS2 (leída el 2026-10-27): «there is no copyright restriction on NEWS2. You are therefore free to reproduce material, as long as you meet the following conditions: the RCP should be acknowledged […]; the material must not be modified/amended in any way; the NEWS2 charts must be reproduced in colour; […] disclaimer on any translated material». NO se habilita: re-expresar los parámetros y puntajes como filas de catálogo es, a juicio de este importador, una modificación del material que la condición prohíbe. Decisión del propietario (¿basta con citar y no alterar valores?).',
    url: 'https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/',
    evidence: 'primary (titular; página leída el 2026-10-27)',
  },
  'openEHR-EHR-OBSERVATION.waterlow_score.v0': {
    holder: 'Judy Waterlow (2005-2007)',
    summary: 'El arquetipo transcribe «The Waterlow score is Copyright Protected © 2005-2007 judy-waterlow.co.uk».',
    url: 'http://www.judy-waterlow.co.uk/waterlow_score.htm',
    evidence: 'primary-in-archetype',
  },
};

/**
 * Estado de licencia fijado con evidencia PRIMARIA del titular (URL, fecha y cita): entrada de
 * `classifyContentLicense(…, overrides)`. `verified-free` carga el contenido; `pending-owner-decision` lo genera pero el cargador
 * lo omite hasta que el propietario lo apruebe (`approvalKey`).
 */
export const LICENSE_OVERRIDES = {
  'openEHR-EHR-OBSERVATION.glasgow_coma_scale.v1': {
    status: 'pending-owner-decision',
    approvalKey: 'glasgow-coma-scale',
    approvalReason: 'El permiso del titular cubre «clinical care and clinical research at no cost»; falta que el propietario decida si un catálogo de terminología entra en ese uso y cómo trata el share-alike del arquetipo CC BY-SA.',
    quote: 'The Glasgow Coma Scale (GCS), GCS Aid, GCS-P score, GCS P-Age CT prognostic charts and GCS verbal score imputation tool may all be used for clinical care and clinical research at no cost. No license is required. The copywrite of Glasgow University (GCS), and Sir Graham Teasdale (GCS Aid, GCS-P, GCS-P Age CT prognostic charts and imputation tool) should be acknowledged.',
    url: 'https://www.glasgowcomascale.org/permissions/',
    checkedAt: '2026-10-27',
  },
};

/**
 * Escalas que nombra el pedido y que NO están en el espejo de CKM: quedan como
 * hueco, con su estado de licencia.
 */
export const MISSING_SCALES = [
  { name: 'Escala de Norton', note: 'No hay arquetipo en el espejo internacional. Licencia del instrumento (Norton, McLaren y Exton-Smith, 1962) sin declaración encontrada; tampoco hay fuente abierta con licencia verificable en castellano (EMINA, Cubbin-Jackson y Norton modificada: ver docs/seed-research/nursing-care.md, pasada 2026-10-27).', url: 'https://scireproject.com/wp-content/uploads/2025/01/Norton_presure_sore_risk_assessment_scale.pdf' },
  { name: 'Escala de caídas de Morse', note: 'No hay arquetipo en el espejo internacional. Fuentes secundarias dicen que tiene copyright y que el uso es gratuito con permiso de la autora (Janice Morse).', url: 'https://resolve.cambridge.org/core/journals/canadian-journal-on-aging-la-revue-canadienne-du-vieillissement/article/abs/development-of-a-scale-to-identify-the-fallprone-patient/A0CDFA5381DEC8DA4D7E7A1B1A74692E' },
];
