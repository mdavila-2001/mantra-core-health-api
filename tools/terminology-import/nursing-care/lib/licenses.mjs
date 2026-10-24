// =============================================================================
// Licencias verificadas de terminologías y escalas de enfermería.
//
// Cada entrada dice QUÉ se verificó, DÓNDE (URL), CUÁNDO y con qué nivel de
// evidencia. «secondary» = lo afirma una fuente que no es el titular (buscador,
// Wikipedia, LOINC, una guía clínica); «primary» = lo dice el titular. La red del
// contenedor donde se escribió esto (2026-10-24) no llegaba a los sitios de los
// titulares, así que casi todo es secundario y queda para confirmar.
//
// Esta tabla NO habilita contenido por sí sola: el importador carga ítems y
// respuestas de una escala sólo si su estado es `declared-free` (lo dice el
// propio arquetipo) o `verified-free` (override con evidencia primaria). Hoy no
// hay ningún `verified-free`.
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
    status: 'public-domain-terms',
    loadable: true,
    blockedBy: 'host-unreachable',
    summary: 'El FAQ oficial dice que el núcleo del Omaha System (términos, definiciones y códigos) está en el dominio público desde 1975 y se usa sin permiso ni pago, respetando su estructura y citando el libro (Martin, 2005) o el sitio. El resto del libro (guía del usuario) tiene copyright de Health Connections Press; quien venda software basado en Omaha debe respetarlo.',
    url: 'https://www.omahasystem.org/faq',
    evidence: 'secondary (resumen del buscador del FAQ oficial; el host no resolvía desde el contenedor)',
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
    holder: 'Barbara Braden y Nancy Bergstrom (1988)',
    summary: 'El propio arquetipo transcribe «Copyright statement: Barbara Braden and Nancy Bergstrom, 1988 All rights reserved» y remite a http://bradenscale.com/copyright.htm.',
    url: 'http://bradenscale.com/copyright.htm',
    evidence: 'primary-in-archetype',
  },
  'openEHR-EHR-OBSERVATION.braden_scale_q.v0': {
    holder: 'Barbara Braden y Nancy Bergstrom (1988); versión Q modificada',
    summary: 'Mismo aviso de copyright que la escala de Braden.',
    url: 'http://bradenscale.com/copyright.htm',
    evidence: 'primary-in-archetype',
  },
  'openEHR-EHR-OBSERVATION.modified_barthel_index.v0': {
    holder: 'Maryland State Medical Society (MedChi), 1965',
    summary: 'Uso libre no comercial citando a Mahoney y Barthel (1965); modificarlo o usarlo comercialmente requiere permiso. El arquetipo es del índice MODIFICADO (Shah, 1989), que además se cita aparte.',
    url: 'https://en.wikipedia.org/wiki/Barthel_scale',
    evidence: 'secondary (Wikipedia, LOINC 96761-2/96762-0, hojas de trabajo SCIRE)',
  },
  'openEHR-EHR-OBSERVATION.downton_fall_risk_index.v0': {
    holder: 'J. H. Downton (1993); sin titular identificado',
    summary: 'No se encontró ninguna declaración de licencia del instrumento. La licencia CC-BY-SA del arquetipo cubre el modelado, no el cuestionario.',
    url: 'https://ckm.openehr.org/ckm/archetypes/1013.1.5144',
    evidence: 'secondary (buscador)',
  },
  'openEHR-EHR-OBSERVATION.glasgow_coma_scale.v1': {
    holder: 'Teasdale y Jennett (1974); sitio oficial glasgowcomascale.org',
    summary: 'No se pudo leer el aviso del sitio oficial (el host no resolvía). Sin verificar.',
    url: 'https://www.glasgowcomascale.org/',
    evidence: 'not-verified',
  },
  'openEHR-EHR-OBSERVATION.news2.v1': {
    holder: 'Royal College of Physicians (2017)',
    summary: 'No se encontró en la búsqueda la condición de reutilización de NEWS2. Sin verificar.',
    url: null,
    evidence: 'not-verified',
  },
  'openEHR-EHR-OBSERVATION.waterlow_score.v0': {
    holder: 'Judy Waterlow (2005-2007)',
    summary: 'El arquetipo transcribe «The Waterlow score is Copyright Protected © 2005-2007 judy-waterlow.co.uk».',
    url: 'http://www.judy-waterlow.co.uk/waterlow_score.htm',
    evidence: 'primary-in-archetype',
  },
};

/**
 * Escalas que nombra el pedido y que NO están en el espejo de CKM: quedan como
 * hueco, con su estado de licencia.
 */
export const MISSING_SCALES = [
  { name: 'Escala de Norton', note: 'No hay arquetipo en el espejo internacional. Licencia del instrumento (Norton, McLaren y Exton-Smith, 1962) sin declaración encontrada.', url: 'https://scireproject.com/wp-content/uploads/2025/01/Norton_presure_sore_risk_assessment_scale.pdf' },
  { name: 'Escala de caídas de Morse', note: 'No hay arquetipo en el espejo internacional. Fuentes secundarias dicen que tiene copyright y que el uso es gratuito con permiso de la autora (Janice Morse).', url: 'https://resolve.cambridge.org/core/journals/canadian-journal-on-aging-la-revue-canadienne-du-vieillissement/article/abs/development-of-a-scale-to-identify-the-fallprone-patient/A0CDFA5381DEC8DA4D7E7A1B1A74692E' },
];
