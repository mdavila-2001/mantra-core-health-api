// =============================================================================
// Equipos de diagnóstico · ROW · fuentes y espejos fijados.
//
// El proxy de salida de los entornos en la nube rechaza (403) los portales
// oficiales (ver `docs/seed-research/diagnostic-devices-row.md`). Cada fuente
// se lee de una copia pública en GitHub del archivo oficial, fijada a un commit
// y a un hash de contenido: si el espejo cambia o desaparece, el build falla en
// vez de mezclar datos. Licencias y criterio de cada una: `SOURCES.md`.
//
// `pin.kind`:
//   sha256  hash del archivo
//   tree    hash git del árbol (directorio), que ya es direccionable por contenido
// =============================================================================

/** @typedef {{ path: string, kind: 'sha256'|'tree', hash: string }} Pin */

export const MIRRORS = Object.freeze({
  'zoefcuk/pmda-medical-devices': {
    url: 'https://github.com/zoefcuk/pmda-medical-devices',
    commit: 'd829883b5ba75980b28b33f75c9797758aca042e',
    pins: [
      {
        path: 'index.html',
        kind: 'sha256',
        hash: '3e14d6008cbf43102f9a4514a210bd2bedcb24a1ea3bb576ac7da2c67d9ff7e7',
      },
    ],
  },
  'misterrPink1/symmetric': {
    url: 'https://github.com/misterrPink1/symmetric',
    commit: 'a43a1a5844e7fe8defe72b0640209c293eac455f',
    pins: [
      {
        path: 'datasets.zip',
        kind: 'sha256',
        hash: 'e2a3f4510f68cd81f5084d83e2214918a2a18b8460fe7071f33933b2067747e5',
      },
    ],
  },
  'tobinsouth/MedicalDeviceNLP': {
    url: 'https://github.com/tobinsouth/MedicalDeviceNLP',
    commit: '868d2e2aa22e6a1fcb51da2430708a420c627862',
    pins: [
      {
        path: 'data/medical_device_summaries',
        kind: 'tree',
        hash: '73c3de3c4299cf5f2037a761025c252839994125',
      },
      {
        path: 'data/list_of_reports',
        kind: 'tree',
        hash: 'fb798d83f7a1ffc69a9a4deeac34aed7cbf13267',
      },
    ],
  },
});

/** URL del archivo leído, fijada al commit del espejo. */
export function mirrorFileUrl(repo, path) {
  const mirror = MIRRORS[repo];
  return `${mirror.url}/blob/${mirror.commit}/${path}`;
}

/** Bloque `extra.mirror` que acompaña a cada fila leída de un espejo. */
export function mirrorRef(repo, path) {
  const mirror = MIRRORS[repo];
  const pin = mirror.pins.find(
    (p) => path === p.path || path.startsWith(`${p.path}/`),
  );
  return {
    repo: mirror.url,
    commit: mirror.commit,
    path,
    pin: pin ? `${pin.kind}:${pin.hash}` : null,
  };
}

/** Portales oficiales de cada fuente (para la cita; no se pudieron leer desde la nube). */
export const OFFICIAL = Object.freeze({
  anvisa: 'https://dados.anvisa.gov.br/dados/',
  pmdaApprovals:
    'https://www.pmda.go.jp/review-services/drug-reviews/review-information/devices/0018.html',
  pmdaCertifications:
    'https://www.pmda.go.jp/review-services/drug-reviews/about-reviews/devices/0026.html',
  hcMdall: 'https://health-products.canada.ca/mdall-limh/',
  hcMdallApi:
    'https://health-products.canada.ca/api/documentation/mdall-documentation-en.html',
  tgaDaen: 'https://apps.tga.gov.au/Prod/devices/daen-entry.aspx',
  cdsco: 'https://cdscomdonline.gov.in/',
  cdscoApprovedDevices:
    'https://cdscomdonline.gov.in/NewMedDev/ListOfApprovedDevices',
  tfda: 'https://data.gov.tw/dataset/9576',
  whoPq:
    'https://extranet.who.int/prequal/vitro-diagnostics/prequalified/in-vitro-diagnostics',
  tfdaTudid: 'https://data.gov.tw/dataset/151955',
  nmpaUdi: 'https://udi.nmpa.gov.cn/download.html',
  sahpraTestKits:
    'https://www.sahpra.org.za/medical-devices/medical-devices-and-in-vitro-diagnostics-test-kits/',
  nmpaUdiApiDoc:
    'https://udi.nmpa.gov.cn/wordFile/%E5%8C%BB%E7%96%97%E5%99%A8%E6%A2%B0%E5%94%AF%E4%B8%80%E6%A0%87%E8%AF%86%E7%AE%A1%E7%90%86%E4%BF%A1%E6%81%AF%E7%B3%BB%E7%BB%9F%E6%95%B0%E6%8D%AE%E5%85%B1%E4%BA%ABAPI%E6%A0%87%E5%87%86%E6%96%87%E6%A1%A3V2.1.pdf',
});

/**
 * Descargas oficiales que hace `fetch-official.mjs`, por grupo. Cada archivo
 * queda en `$DX_DEVICES_BUILD_DIR/official/<grupo>/<name>` y su URL,
 * `Last-Modified`, tamaño y sha256 en `official/retrieved.json`.
 */
const ANVISA_DADOS = 'https://dados.anvisa.gov.br/dados/';
const SAHPRA_UPLOADS = 'https://www.sahpra.org.za/wp-content/uploads/';
const CDSCO_LIST =
  'https://cdscomdonline.gov.in/NewMedDev/viewListOfApprovedDevices';
export const OFFICIAL_DOWNLOADS = Object.freeze({
  // `categval` 1 = dispositivo médico, 2 = IVD; `selectFormType` 1 =
  // importación, 2 = fabricación (los mismos valores que usa la página).
  cdsco: [
    {
      name: 'approved-md-import.json',
      url: `${CDSCO_LIST}?selectFormType=1&categval=1`,
    },
    {
      name: 'approved-md-manufacturing.json',
      url: `${CDSCO_LIST}?selectFormType=2&categval=1`,
    },
    {
      name: 'approved-ivd-import.json',
      url: `${CDSCO_LIST}?selectFormType=1&categval=2`,
    },
    {
      name: 'approved-ivd-manufacturing.json',
      url: `${CDSCO_LIST}?selectFormType=2&categval=2`,
    },
  ],
  sahpra: [
    {
      name: 'List-of-authorised-COVID19-Antigen-Self-test-kits_24052023.xlsx',
      url: `${SAHPRA_UPLOADS}2023/06/List-of-authorised-COVID19-Antigen-Self-test-kits_24052023.xlsx`,
    },
    {
      name: 'List-of-authorised-COVID19-Professional-Antigen-test-kits_24052023.xlsx',
      url: `${SAHPRA_UPLOADS}2023/06/List-of-authorised-COVID19-Professional-Antigen-test-kits_24052023.xlsx`,
    },
    {
      name: 'List-of-authorised-Molecular-Test-Kits_24052023.xlsx',
      url: `${SAHPRA_UPLOADS}2023/06/List-of-authorised-Molecular-Test-Kits_24052023.xlsx`,
    },
    {
      name: 'List-of-authorised-serological-test-kits-_31052022.xlsx',
      url: `${SAHPRA_UPLOADS}2022/06/List-of-authorised-serological-test-kits-_31052022.xlsx`,
    },
  ],
  // Enlace firmado que publica https://udi.nmpa.gov.cn/download.html para el
  // release completo del mes; cambia con cada release.
  'nmpa-udi': [
    {
      name: 'UDID_FULL_RELEASE_20261001.zip',
      url: 'https://udid.nmpa.gov.cn/attachments/attachment/download.html?path=A2E0C4E371D356DC134BE4F49B806211AF5D12A4AF10DF792D2444462A1C5EFBE69FA130D049D6DF285981599B74F17A106FA3E13C776DDE892882C9D905B2BA',
      md5: 'ED0CD3AFA9E6BC687322710381626497',
    },
  ],
  hsa: [
    {
      name: 'smdr-listing-of-registered-medical-devices.csv',
      datagovsg: {
        id: 'd_8cfe111e0a5a5cf5b598e78851e58ad4',
        url: 'https://data.gov.sg/datasets/d_8cfe111e0a5a5cf5b598e78851e58ad4/view',
      },
    },
    {
      name: 'class-a-medical-devices.csv',
      datagovsg: {
        id: 'd_55a59f68de9275077a642024f13f7c3b',
        url: 'https://data.gov.sg/datasets/d_55a59f68de9275077a642024f13f7c3b/view',
      },
    },
  ],
  'who-pq': [
    {
      name: 'who-pq-ivd.csv',
      url: 'https://extranet.who.int/prequal/vitro-diagnostics/prequalified/in-vitro-diagnostics/export?page&_format=csv',
    },
  ],
  invima: [
    {
      name: 'y4qt-w6tk',
      socrata: {
        domain: 'www.datos.gov.co',
        id: 'y4qt-w6tk',
        url: 'https://www.datos.gov.co/d/y4qt-w6tk',
      },
    },
  ],
  tfda: [
    {
      name: 'export68-csv.zip',
      url: 'https://data.fda.gov.tw/data/opendata/export/68/csv',
      extract: true,
    },
    {
      name: 'dataset-9576.json',
      url: 'https://data.gov.tw/api/v2/rest/dataset/9576',
    },
    {
      name: 'export197-csv.zip',
      url: 'https://data.fda.gov.tw/data/opendata/export/197/csv',
      extract: true,
    },
    {
      name: 'dataset-151955.json',
      url: 'https://data.gov.tw/api/v2/rest/dataset/151955',
    },
  ],
  anvisa: [
    {
      name: 'TA_PRODUTO_SAUDE_SITE.csv',
      url: `${ANVISA_DADOS}TA_PRODUTO_SAUDE_SITE.csv`,
    },
    {
      name: 'TA_PRODUTO_SAUDE_MODELO.csv',
      url: `${ANVISA_DADOS}TA_PRODUTO_SAUDE_MODELO.csv`,
    },
    {
      name: 'CICLO_ANALISE_PETICOES_PROD_SAUDE_IN_VITRO.CSV',
      url: `${ANVISA_DADOS}CICLO_ANALISE_PETICOES_PROD_SAUDE_IN_VITRO.CSV`,
    },
    {
      name: 'CICLO_ANALISE_PETICOES_PRODUTO_SAUDE(CORRELATOS).CSV',
      url: `${ANVISA_DADOS}CICLO_ANALISE_PETICOES_PRODUTO_SAUDE%28CORRELATOS%29.CSV`,
    },
    {
      name: 'CICLO_ANALISE_PETICOES_PRODUTO_SAUDE.CSV',
      url: `${ANVISA_DADOS}CICLO_ANALISE_PETICOES_PRODUTO_SAUDE.CSV`,
    },
  ],
});

/** Fuentes buscadas que NO se pudieron obtener: van a `manifest.gaps`. */
export const GAPS = Object.freeze([
  {
    source: 'hc-mdall',
    reason:
      '503 en toda la API (health-products.canada.ca/api/medical-devices/…) al 2026-10-24; solo hay espejo de 2020-02-07',
    url: OFFICIAL.hcMdallApi,
  },
  {
    source: 'tga-artg',
    reason:
      'www.tga.gov.au no responde desde la nube (conexión cortada) al 2026-10-24; el ARTG completo no tiene espejo; solo hay DAEN parcial',
    url: 'https://www.tga.gov.au/resources/artg',
  },
  {
    source: 'mfds-devices',
    reason:
      'emedi.mfds.go.kr, udiportal.mfds.go.kr y www.data.go.kr no responden desde la nube (conexión cortada) al 2026-10-24',
    url: 'https://udiportal.mfds.go.kr/',
  },
  {
    source: 'amar-devices',
    reason:
      'data.gov.il no publica un conjunto de AMAR; el registro solo se consulta en gov.il',
    url: 'https://data.gov.il/',
  },
  {
    source: 'sfda-mdma',
    reason:
      'medicaldevice.sfda.gov.sa no responde desde la nube al 2026-10-24 (antes, 502)',
    url: 'https://medicaldevice.sfda.gov.sa/',
  },
  {
    source: 'thai-fda-devices',
    reason:
      'open.fda.moph.go.th no responde desde la nube al 2026-10-24 (antes, 502)',
    url: 'https://open.fda.moph.go.th/',
  },
  {
    source: 'mda-mdar',
    reason:
      'MDA publica el registro como buscador (mdar.mda.gov.my, «carian», exige un texto de búsqueda); el listado trae nombre, número de registro, establecimiento local y vigencia, pero no fabricante ni marca, que están en una ficha por registro',
    url: 'https://mdar.mda.gov.my/',
  },
  {
    source: 'cofepris-dispositivos',
    reason:
      'solo visor de consulta (registros.cofepris.gob.mx); datos.gob.mx no tiene conjuntos de dispositivos médicos (búsqueda CKAN, 0 resultados)',
    url: 'https://registros.cofepris.gob.mx/',
  },
  {
    source: 'anmat-productos-medicos',
    reason:
      'datos.gob.ar no tiene conjuntos de productos médicos de ANMAT (búsqueda CKAN «anmat»: solo vademécum y alimentos)',
    url: 'https://datos.gob.ar/',
  },
  {
    source: 'digemid-dispositivos',
    reason: '403 del propio servidor (www.digemid.minsa.gob.pe) al 2026-10-24',
    url: 'https://www.digemid.minsa.gob.pe/',
  },
  {
    source: 'isp-dispositivos',
    reason: 'www.ispch.gob.cl no responde desde la nube al 2026-10-24',
    url: 'https://www.ispch.gob.cl/',
  },
  {
    source: 'agemed-dispositivos',
    reason:
      'el portal de AGEMED solo publica circulares y comunicados en PDF; sin listado de dispositivos registrados',
    url: 'https://www.agemed.gob.bo/',
  },
  {
    source: 'sahpra-devices',
    reason:
      'SAHPRA no publica un registro general de dispositivos descargable; solo las listas de kits de COVID-19 (cargadas) y licencias de establecimientos',
    url: 'https://www.sahpra.org.za/medical-devices/',
  },
  {
    source: 'unicef-supply',
    reason:
      '403 del propio servidor (supply.unicef.org → supplyhub.unicef.org) al 2026-10-24',
    url: 'https://supply.unicef.org/',
  },
]);
