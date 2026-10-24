// =============================================================================
// Registro de fuentes europeas: dónde se consultan, con qué términos, y si el
// pipeline las descarga automáticamente. `probe.mjs` sondea `probeUrl` en cada
// pasada; `fetch.mjs` solo descarga las que tienen `autoFetch: true`.
//
// `terms.verified` dice si el texto de términos se leyó en la fuente oficial
// desde esta sesión. Si es false, el texto resume lo que se pudo verificar por
// otras vías y lo que no se pudo verificar; no se presenta como dictamen.
// =============================================================================

export const SOURCES = {
  EMDN: {
    exchangeSource: 'ec-emdn',
    name: 'European Medical Device Nomenclature (EMDN)',
    owner: 'Comisión Europea, DG SANTE',
    officialUrl:
      'https://health.ec.europa.eu/medical-devices-topics-interest/european-medical-devices-nomenclature-emdn_en',
    probeUrl:
      'https://health.ec.europa.eu/medical-devices-topics-interest/european-medical-devices-nomenclature-emdn_en',
    // La página de la Comisión enlaza «download full list» a esta página de la
    // aplicación EMDN, que a su vez enlaza el Excel oficial (verificado el
    // 2026-10-24: build/EMDN v2026_EN..xlsx).
    downloadPage: 'https://webgate.ec.europa.eu/dyna2/emdn/M90',
    access:
      'Descarga completa en Excel enlazada desde la página oficial (el enlace se descubre en la página, no se fija a mano). Navegador por código: https://webgate.ec.europa.eu/dyna2/emdn/',
    terms: {
      verified: true,
      text: 'Leído en vivo el 2026-10-24: la página oficial (webgate.ec.europa.eu/dyna2/emdn/M90) dice que la EMDN entera es accesible a todos y sin costo, y su pie enlaza el aviso legal de la Comisión (commission.europa.eu/legal-notice_en): salvo indicación en contrario, el contenido de la UE se licencia CC BY 4.0 bajo la Decisión 2011/833/UE; reutilización permitida con atribución e indicando cambios.',
    },
    autoFetch: true,
  },
  EUDAMED_DATALAKE: {
    exchangeSource: 'eudamed-udi',
    name: 'EUDAMED Public API v1.0 (Data Lake de DG SANTE)',
    owner: 'Comisión Europea, DG SANTE',
    officialUrl: 'https://developer.datalake.sante.service.ec.europa.eu/',
    probeUrl:
      'https://api.datalake.sante.service.ec.europa.eu/eudamed/reference?LANGUAGE=en&format=json&api-version=v1.0',
    access:
      'GET /udi, /actors, /reference con filtros en mayúsculas (NOMENCLATURE_CODE, MF_SRN, …), format=json|csv, paginación por `nextLink`. Contrato verificado contra el OpenAPI v1.0 publicado por DG SANTE (copia en Arya012-UvA/Eudamed_Lookup@fe5bd47, docs/eudamed-public-openapi-v1.0.json) y contra el cliente @t4dhg/mcp-eudamed@0.1.1. Clave de suscripción opcional (EUDAMED_SUBSCRIPTION_KEY): un cliente reporta 200 sin clave, otro documenta la clave del portal de desarrolladores.',
    terms: {
      verified: false,
      text: 'API pública oficial; se usó sin clave (200 verificado en vivo el 2026-10-24). Aviso legal general de la Comisión leído en vivo: CC BY 4.0 bajo la Decisión 2011/833/UE salvo indicación en contrario, y advierte que puede hacer falta despejar derechos cuando el contenido identifica a personas físicas (por eso no se publican PRRC, correos ni teléfonos de actores). El aviso propio de EUDAMED no se pudo leer: la página es una aplicación JavaScript que no devuelve texto sin navegador.',
    },
    autoFetch: true,
  },
  EUDAMED_PORTAL: {
    exchangeSource: 'eudamed-certificates',
    name: 'EUDAMED, módulos públicos del portal (API interna de la interfaz)',
    owner: 'Comisión Europea, DG SANTE',
    officialUrl: 'https://ec.europa.eu/tools/eudamed/',
    probeUrl:
      'https://ec.europa.eu/tools/eudamed/api/devices/udiDiData?page=0&pageSize=1&size=1&iso2Code=en&languageIso2Code=en',
    access:
      'API no documentada que usa la interfaz (udiDiData, basicUdiData/{uuid} con certificados y organismo notificado). Contrato documentado por la comunidad: openregulatory/eudamed-api (MIT). Solo para completar certificados de filas ya obtenidas por el Data Lake.',
    terms: {
      verified: false,
      text: 'Sin términos específicos leídos para la API interna. No se descarga en bloque hasta verificar el aviso legal del portal; el Data Lake es la vía oficial.',
    },
    autoFetch: false,
  },
  MHRA_PARD: {
    exchangeSource: 'mhra-pard',
    name: 'MHRA Public Access Registration Database (PARD)',
    owner: 'Medicines and Healthcare products Regulatory Agency (Reino Unido)',
    officialUrl: 'https://pard.mhra.gov.uk/',
    probeUrl: 'https://pard.mhra.gov.uk/',
    access:
      'Búsqueda pública por fabricante y tipo GMDN con botón «Download CSV» por resultado. No hay API ni descarga completa documentadas; el formato del CSV no se pudo ver desde esta sesión.',
    terms: {
      verified: true,
      text: 'Leído en vivo el 2026-10-24: pard.mhra.gov.uk solo muestra «© Crown Copyright» y no declara la Open Government Licence; los términos de GOV.UK (gov.uk/help/terms-conditions) dicen que la mayoría, no todo, del contenido de GOV.UK va bajo OGL, y PARD no está en GOV.UK. Además, los nombres de tipo GMDN son propiedad de la GMDN Agency con uso comercial restringido. Sin licencia abierta explícita: no se descarga (hueco).',
    },
    autoFetch: false,
  },
  SWISSDAMED: {
    exchangeSource: 'swissmedic-swissdamed',
    name: 'swissdamed (Swissmedic): módulos públicos de actores y UDI',
    owner: 'Swissmedic',
    officialUrl: 'https://swissdamed.ch/',
    probeUrl: 'https://swissdamed.ch/',
    access:
      'POST /public/udi/basic-udis?page&size (cuerpo {}) → {values:[…]}; GET /public/udi/udi-dis/{id}/details; /public/act/actors y /public/act/mandates. Contrato verificado contra zdavatz/swissdamed2sqlite@45cd947 (GPL-3.0).',
    terms: {
      verified: true,
      text: 'Leído en vivo el 2026-10-24: las condiciones de uso de Swissmedic prohíben reproducir la información del sitio sin autorización expresa e incluyen expresamente toda extracción y almacenamiento automatizado (scraping/data mining), salvo las áreas pensadas para eso (RSS). No hay términos de reutilización propios de swissdamed. Sin autorización de Swissmedic NO se descarga ni se usa ningún dato derivado de swissdamed (incluido csv/srn_unique.csv de swissdamed2sqlite).',
    },
    autoFetch: false,
  },
  IT_BDRDM: {
    exchangeSource: 'it-salute-bdrdm',
    name: 'Italia — Banca dati e Repertorio dei dispositivi medici (BD/RDM)',
    owner: 'Ministero della Salute',
    officialUrl:
      'https://www.dati.salute.gov.it/it/dataset/dispositivi-medici/',
    probeUrl: 'https://www.dati.salute.gov.it/it/dataset/dispositivi-medici/',
    access:
      'ZIP semanal con el CSV completo (también en JSON y XML; se usa el CSV, separador «;», ~2,4 millones de filas al corte 2026-10-19) y diccionario de datos v2.0 en PDF. Clave del registro: tipologia_dm + progressivo_dm_ass.',
    terms: {
      verified: true,
      text: 'Italian Open Data Licence v2.0, leída en vivo en la ficha del conjunto el 2026-10-24 (campo «Licenza»). Atribución: Ministero della Salute.',
    },
    autoFetch: true,
  },
  IT_CND: {
    exchangeSource: 'it-salute-cnd',
    name: 'Italia — Classificazione Nazionale dei Dispositivi medici (CND)',
    owner: 'Ministero della Salute',
    officialUrl:
      'https://www.dati.salute.gov.it/it/dataset/classificazione-nazionale-dei-dispositivi-medici-cnd/',
    probeUrl:
      'https://www.dati.salute.gov.it/it/dataset/classificazione-nazionale-dei-dispositivi-medici-cnd/',
    access:
      'CSV mensual con código, descripción, nivel, nivel terminal y referencias CIVAB. La CND es la base de la EMDN.',
    terms: {
      verified: false,
      text: 'Italian Open Data License v2.0 según la ficha (leída vía buscador). Pendiente confirmar.',
    },
    autoFetch: true,
  },
  NANDO: {
    exchangeSource: 'ec-nando',
    name: 'NANDO — organismos notificados (MDR/IVDR)',
    owner: 'Comisión Europea, DG GROW',
    officialUrl:
      'https://webgate.ec.europa.eu/single-market-compliance-space/notified-bodies',
    probeUrl:
      'https://webgate.ec.europa.eu/single-market-compliance-space/notified-bodies',
    access:
      'Búsqueda pública por legislación; sin descarga masiva documentada. Se usa para nombrar el organismo notificado de cada certificado (número de 4 dígitos).',
    terms: {
      verified: false,
      text: 'Reutilización con atribución (Decisión 2011/833/UE), pendiente confirmar en el aviso legal del sitio.',
    },
    autoFetch: false,
  },
  DE_BFARM: {
    exchangeSource: 'de-bfarm',
    name: 'Alemania — BfArM, información de productos sanitarios (DMIDS heredado)',
    owner: 'Bundesinstitut für Arzneimittel und Medizinprodukte',
    officialUrl: 'https://www.bfarm.de/EN/Medical-devices/_node.html',
    probeUrl: 'https://www.bfarm.de/EN/Medical-devices/_node.html',
    access:
      'Sin descarga pública de registros de productos identificada; la base DMIDS heredada requiere acceso. Se registra como hueco.',
    terms: { verified: false, text: 'No evaluado: no hay descarga pública.' },
    autoFetch: false,
  },
  ES_AEMPS: {
    exchangeSource: 'es-aemps-ccps',
    name: 'España — AEMPS, comunicaciones de comercialización (CCPS)',
    owner: 'Agencia Española de Medicamentos y Productos Sanitarios',
    officialUrl: 'https://www.aemps.gob.es/',
    probeUrl: 'https://www.aemps.gob.es/',
    access:
      'Consulta pública por producto o empresa; sin descarga masiva documentada. Se registra como hueco.',
    terms: { verified: false, text: 'No evaluado: no hay descarga pública.' },
    autoFetch: false,
  },
  FR_ANSM: {
    exchangeSource: 'fr-ansm',
    name: 'Francia — ANSM',
    owner:
      'Agence nationale de sécurité du médicament et des produits de santé',
    officialUrl: 'https://ansm.sante.fr/',
    probeUrl: 'https://ansm.sante.fr/',
    access:
      'Francia no publica un registro nacional descargable de productos sanitarios: remite a EUDAMED. Se registra como hueco.',
    terms: { verified: false, text: 'No aplica.' },
    autoFetch: false,
  },
};

/** Hosts que hay que habilitar en la política de red para que el pipeline corra completo. */
export function requiredHosts() {
  return [
    ...new Set(
      Object.values(SOURCES)
        .map((s) => new URL(s.probeUrl).host)
        .concat(['webgate.ec.europa.eu', 'ec.europa.eu']),
    ),
  ].sort();
}
