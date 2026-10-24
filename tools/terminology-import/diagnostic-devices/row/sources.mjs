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
  'vishnuu-patil/india-meddevice-intelligence': {
    url: 'https://github.com/vishnuu-patil/india-meddevice-intelligence',
    commit: '62e88588be6ce521c9f38d2530f0cf732f8cd810',
    pins: [
      {
        path: 'Data/MD - Medical Devices.xlsx',
        kind: 'sha256',
        hash: 'df21440356cf3da7f3fc8a4fa9e148209662b30be370d4100234657581f4511c',
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
  tfda: 'https://data.gov.tw/dataset/9576',
  tfdaTudid: 'https://data.gov.tw/dataset/151955',
});

/**
 * Descargas oficiales que hace `fetch-official.mjs`, por grupo. Cada archivo
 * queda en `$DX_DEVICES_BUILD_DIR/official/<grupo>/<name>` y su URL,
 * `Last-Modified`, tamaño y sha256 en `official/retrieved.json`.
 */
const ANVISA_DADOS = 'https://dados.anvisa.gov.br/dados/';
export const OFFICIAL_DOWNLOADS = Object.freeze({
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
      '403 del proxy (health-products.canada.ca); solo hay espejo de 2020-02-07',
    url: OFFICIAL.hcMdall,
  },
  {
    source: 'tga-artg',
    reason:
      '403 del proxy (www.tga.gov.au); el ARTG completo no tiene espejo; solo hay DAEN parcial',
    url: 'https://www.tga.gov.au/resources/artg',
  },
  {
    source: 'nmpa-udi',
    reason: '403 del proxy (udi.nmpa.gov.cn)',
    url: 'https://udi.nmpa.gov.cn/',
  },
  {
    source: 'mfds-devices',
    reason: '403 del proxy (www.data.go.kr, emedi.mfds.go.kr)',
    url: 'https://www.data.go.kr/',
  },
  {
    source: 'cdsco-devices',
    reason:
      '403 del proxy (cdsco.gov.in, cdscomdonline.gov.in). Se cargaron las licencias de importación (espejo); faltan las licencias de fabricación nacional (MD-5/MD-9) y las de autoridades estatales',
    url: 'https://cdsco.gov.in/',
  },
  {
    source: 'hsa-smdr',
    reason: '403 del proxy (data.gov.sg)',
    url: 'https://data.gov.sg/',
  },
  {
    source: 'amar-devices',
    reason: '403 del proxy (data.gov.il)',
    url: 'https://data.gov.il/',
  },
  {
    source: 'sfda-mdma',
    reason: '403 del proxy (medicaldevice.sfda.gov.sa)',
    url: 'https://medicaldevice.sfda.gov.sa/',
  },
  {
    source: 'thai-fda-devices',
    reason: '403 del proxy (open.fda.moph.go.th)',
    url: 'https://open.fda.moph.go.th/',
  },
  {
    source: 'mda-medcast',
    reason: '403 del proxy (portal.mda.gov.my)',
    url: 'https://portal.mda.gov.my/',
  },
  {
    source: 'cofepris-dispositivos',
    reason: '403 del proxy (datos.gob.mx)',
    url: 'https://datos.gob.mx/',
  },
  {
    source: 'anmat-productos-medicos',
    reason: '403 del proxy (datos.gob.ar)',
    url: 'https://datos.gob.ar/',
  },
  {
    source: 'digemid-dispositivos',
    reason: '403 del proxy (www.datosabiertos.gob.pe)',
    url: 'https://www.datosabiertos.gob.pe/',
  },
  {
    source: 'agemed-dispositivos',
    reason: '403 del proxy (www.agemed.gob.bo)',
    url: 'https://www.agemed.gob.bo/',
  },
  {
    source: 'who-pq-ivd',
    reason: '403 del proxy (extranet.who.int)',
    url: 'https://extranet.who.int/prequal/vitro-diagnostics/prequalified/in-vitro-diagnostics',
  },
  {
    source: 'unicef-supply',
    reason: '403 del proxy (supply.unicef.org)',
    url: 'https://supply.unicef.org/',
  },
]);
