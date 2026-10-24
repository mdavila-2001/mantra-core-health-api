// =============================================================================
// Registro de fuentes FDA/NLM: URL oficial, licencia y, cuando el host oficial
// no es alcanzable desde la red de la sesión, el espejo público fijado por
// commit que se usó en su lugar. Las licencias se describen en `../SOURCES.md`.
// =============================================================================

/** Fichas oficiales por tipo de autorización (la URL que se escribe en `sourceUrl`). */
export const OFFICIAL_RECORD_URL = Object.freeze({
  '510K': (id) => `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=${encodeURIComponent(id)}`,
  DENOVO: (id) => `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/denovo.cfm?ID=${encodeURIComponent(id)}`,
  PMA: (id) => `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?id=${encodeURIComponent(id)}`,
  HDE: (id) => `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfhde/hde.cfm?id=${encodeURIComponent(id)}`,
  GUDID: (di) => `https://accessgudid.nlm.nih.gov/devices/${encodeURIComponent(di)}`,
  PRODUCT_CODE: (pc) => `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPCD/classification.cfm?ID=${encodeURIComponent(pc)}`,
  REGISTRATION: (reg) => `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfRL/rl.cfm?lid=&rid=${encodeURIComponent(reg)}`,
});

/** Tipo de autorización a partir del número FDA. */
export function authorizationKind(id) {
  const s = String(id ?? '').trim().toUpperCase();
  if (/^K\d{6}$/.test(s)) return '510K';
  if (/^DEN\d{6}$/.test(s)) return 'DENOVO';
  if (/^P\d{6}$/.test(s)) return 'PMA';
  if (/^[HN]\d{6}$/.test(s)) return s.startsWith('H') ? 'HDE' : 'PMA';
  if (/^BK\d{6}$/.test(s) || /^BP\d{6}$/.test(s)) return 'CBER';
  return null;
}

/** Fuentes oficiales (descarga completa). `fetch-official.mjs` las baja cuando el host está habilitado. */
export const OFFICIAL_SOURCES = Object.freeze([
  {
    id: 'openfda-download-index',
    url: 'https://api.fda.gov/download.json',
    note: 'Índice de particiones de openFDA (device/udi, 510k, pma, classification, registrationlisting).',
    endpoints: ['device/udi', 'device/510k', 'device/pma', 'device/classification', 'device/registrationlisting'],
  },
  {
    id: 'accessgudid-delimited-full',
    url: 'https://accessgudid.nlm.nih.gov/download/delimited',
    note: 'Página de descargas AccessGUDID: se toma el enlace del último «Full Release» delimitado por `|` (zip, ~0,4–0,5 GB).',
  },
  { id: 'fda-foiclass', url: 'https://www.accessdata.fda.gov/premarket/ftparea/foiclass.zip', note: 'Product Classification (se reemplaza cada domingo).' },
  { id: 'fda-pmn96cur', url: 'https://www.accessdata.fda.gov/premarket/ftparea/pmn96cur.zip', note: '510(k) 1996–actual (se reemplaza el 5 de cada mes).' },
  { id: 'fda-pma', url: 'https://www.accessdata.fda.gov/premarket/ftparea/pma.zip', note: 'PMA y suplementos.' },
]);

/**
 * Espejos públicos fijados por commit. Cada uno declara la URL oficial, la
 * fecha de exportación y el sha256 del archivo oficial que reprocesó.
 */
export const MIRRORS = Object.freeze([
  {
    id: 'choiben314-510k-lineage',
    repo: 'https://github.com/choiben314/510k-lineage',
    commit: '806b59cba5c8f5bac9fe327f8c49c8a2f5807804',
    files: ['dataset/devices.csv', 'data/raw/manifest.jsonl', 'LICENSE', 'README.md'],
    license: 'Datos: CC BY 4.0 (Ben Choi, 2026); registros FDA de dominio público. Código: MIT.',
    upstream: {
      url: 'https://download.open.fda.gov/device/510k/device-510k-0001-of-0001.json.zip',
      exportDate: '2026-08-10',
      fetchedAt: '2026-08-17T20:39:37+00:00',
      sha256: '996cd24da0f15d1af632c5676916a3d7d351ee121dff791cdc153a5612bb25c4',
    },
  },
]);
