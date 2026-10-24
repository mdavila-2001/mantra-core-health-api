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
  'victoracioly/g.stec': {
    url: 'https://github.com/victoracioly/g.stec',
    commit: '8a4c6ca3602431ec47cd8e64685a4778156c37cf',
    pins: [
      {
        path: 'dispositivos_medicos_anvisa/data/dispositivos_raw.csv',
        kind: 'sha256',
        hash: '65be2169f13f137b37ecf84fe7009d24506f187c81016adc633b6e8f56b37f04',
      },
    ],
  },
  'adnanioricce/DHsys': {
    url: 'https://github.com/adnanioricce/DHsys',
    commit: '818005835f952dfc23aa91612181488b5e28d270',
    pins: [
      {
        path: 'src/Tools/Helper/Csvs/Produtos',
        kind: 'tree',
        hash: '91d42c7acd81cd36847cac8c6a073bdb2c793782',
      },
    ],
  },
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
});

/** Fuentes buscadas que NO se pudieron obtener: van a `manifest.gaps`. */
export const GAPS = Object.freeze([
  {
    source: 'anvisa-produtos',
    reason:
      '403 del proxy (dados.anvisa.gov.br); se usó un espejo de 2025-06-17',
    url: OFFICIAL.anvisa,
  },
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
    source: 'tfda-devices',
    reason: '403 del proxy (data.gov.tw)',
    url: 'https://data.gov.tw/dataset/9576',
  },
  {
    source: 'cdsco-devices',
    reason: '403 del proxy (cdsco.gov.in)',
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
    source: 'invima-dispositivos',
    reason: '403 del proxy (www.datos.gov.co)',
    url: 'https://www.datos.gov.co/',
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
