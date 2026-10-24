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
  /** Informe MAUDE (`mdrfoi__id` = MDR_REPORT_KEY). */
  MAUDE: (key, pc) => `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfmaude/detail.cfm?mdrfoi__id=${encodeURIComponent(key)}&pc=${encodeURIComponent(pc)}`,
  /** Informe MAUDE en la API oficial de openFDA, por número de informe (cuando no hay MDR_REPORT_KEY). */
  MAUDE_REPORT: (n) => `https://api.fda.gov/device/event.json?search=report_number:%22${encodeURIComponent(n)}%22`,
  /** Registro de retiro en la API oficial de openFDA (enforcement), por número de retiro `Z-NNNN-AAAA`. */
  RECALL: (z) => `https://api.fda.gov/device/enforcement.json?search=recall_number:%22${encodeURIComponent(z)}%22`,
  GUDID: (di) => `https://accessgudid.nlm.nih.gov/devices/${encodeURIComponent(di)}`,
  PRODUCT_CODE: (pc) => `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPCD/classification.cfm?ID=${encodeURIComponent(pc)}`,
  /** Ficha pública de un listado (`lid` = KEY_VAL del listado, `lpcd` = product code). */
  LISTING: (keyVal, pc) => `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfRL/rl.cfm?lid=${encodeURIComponent(keyVal)}&lpcd=${encodeURIComponent(pc)}`,
  /**
   * Listado en la API oficial de openFDA `device/registrationlisting`, por registro (o FEI) y
   * product code: el export de openFDA no publica el KEY_VAL que pide la ficha `rl.cfm`.
   */
  LISTING_OPENFDA: (field, id, pc) =>
    `https://api.fda.gov/device/registrationlisting.json?search=registration.${field}:%22${encodeURIComponent(id)}%22+AND+products.product_code:%22${encodeURIComponent(pc)}%22`,
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
    priority: 10,
  },
  {
    id: 'ej86-fda-ai-medical-device-analytics',
    repo: 'https://github.com/ej86/fda-ai-medical-device-analytics',
    commit: '8840a03632ffdc346a8bf05a459236c913b9198c',
    files: ['foiclass.csv', 'aiml-devices-csv.csv'],
    license: 'Sin licencia declarada en el repo; los archivos son copias sin transformar de publicaciones de FDA (dominio público): foiclass.txt y la lista de dispositivos con IA.',
    upstream: {
      url: 'https://www.accessdata.fda.gov/premarket/ftparea/foiclass.zip',
      exportDate: null,
      note: 'foiclass.txt crudo (delimitado por `|` aunque se llame .csv); fecha de corte = commit del espejo',
    },
    priority: 10,
  },
  {
    id: 'bjoleary-fdadata',
    repo: 'https://github.com/bjoleary/fdadata',
    commit: '227bdaa24aec8565e333cc67689ff2c63ce5cea7',
    files: ['data/pmn.rda', 'data/pma.rda', 'data/product_codes.rda', 'LICENSE.md', 'man/pmn.Rd', 'man/pma.Rd', 'man/product_codes.Rd'],
    convert: [
      { rda: 'data/pmn.rda', object: 'pmn', out: 'pmn.ndjson' },
      { rda: 'data/pma.rda', object: 'pma', out: 'pma.ndjson' },
      { rda: 'data/product_codes.rda', object: 'product_codes', out: 'product_codes.ndjson' },
    ],
    license: 'MIT (Brendan O\'Leary). Datos: archivos de descarga de FDA (pmn*.zip, pma.zip, foiclass.zip de accessdata.fda.gov/premarket/ftparea), dominio público.',
    upstream: {
      url: 'https://www.accessdata.fda.gov/premarket/ftparea/',
      exportDate: '2026-10-20',
      note: '«accessed 2026-10-20» según man/pmn.Rd, man/pma.Rd y man/product_codes.Rd',
    },
    priority: 20,
  },
  {
    id: 'delapro-gudid',
    repo: 'https://github.com/Delapro/GUDID',
    commit: '9237402a49a6a6ad2fff2be9bb284be6eba96d09',
    files: ['LICENSE', 'DownloadGUDIDAndExpand.PS1', ...['', ...Array.from({ length: 19 }, (_, i) => String(i + 1))].map((n) => `Dental-xml/Dental-xml${n}.zip`)],
    license: 'MIT (Delapro). Datos: AccessGUDID Full Release XML de FDA/NLM (dominio público), filtrado por el autor a los dispositivos con algún product code de especialidad dental (DE) según foiclass.',
    upstream: {
      url: 'https://accessgudid.nlm.nih.gov/release_files/download/gudid_full_release_20250501.zip',
      exportDate: '2025-05-01',
      note: 'Partes FULLDownload_PartN_Of_192_2025-05-01-dental.xml; filtro en DownloadGUDIDAndExpand.PS1 (medicalspecialty -eq DE)',
    },
    priority: 10,
  },
  {
    id: 'double-strand-naat-registry',
    repo: 'https://github.com/double-strand/IVDmicrobialNAATregistry',
    commit: '6cdd1e5ed9ebf875069d7028b3b9481ff185a386',
    files: ['FDA510kPathogens_NAAT.csv', 'LICENSE'],
    license: 'GPL-3.0 (double-strand). Contenido: la lista FDA «Nucleic Acid Based Tests» (dominio público) reordenada por patógeno con TaxID de NCBI.',
    upstream: { url: 'https://www.fda.gov/medical-devices/in-vitro-diagnostics/nucleic-acid-based-tests', exportDate: null, note: 'sólo enriquece: patógenos y tecnología por K-number' },
    enrichOnly: true,
    priority: 0,
  },
  {
    id: 'sdgoldberg-meddev',
    repo: 'https://github.com/sdgoldberg/MedDev',
    commit: '6cbd231bb5d0778ff2fd7d165ba5d8f0f613f55e',
    files: ['project/data/Registration.txt', 'project/data/registration_listing.txt', 'project/data/Listing_PCD.txt', 'project/data/Owner_Operator.txt', 'project/data/listing_estabtypes.txt', 'README.md'],
    license: 'Sin licencia declarada en el repo; los .txt son los archivos planos de FDA «Establishment Registration and Medical Device Listing Files» (dominio público), sin transformar.',
    upstream: {
      url: 'https://www.fda.gov/medical-devices/device-registration-and-listing/establishment-registration-and-medical-device-listing-files-download',
      exportDate: '2024',
      note: 'Instantánea 2024: todas las filas de Registration.txt traen REG_EXPIRY_DATE_YEAR=2024 (commit 2025-05-30). No incluye el archivo de nombres propietarios.',
    },
    priority: 10,
  },
  {
    id: 'cdcgov-routes-livd',
    repo: 'https://github.com/CDCgov/routes',
    commit: 'e2e16eedfc7d232d9889eb4726f4c675b37e0df6',
    files: ['ReportStream/metadata/tables/local/LIVD-SARS-CoV-2.csv'],
    license: 'Apache-2.0 (CDC). Contenido: tabla LIVD de CDC para pruebas IVD de SARS-CoV-2 con autorización de uso de emergencia (EUA) de FDA (obra del gobierno de EE. UU., dominio público).',
    upstream: { url: 'https://www.cdc.gov/csels/dls/livd-codes.html', exportDate: null, note: 'LIVD SARS-CoV-2 (CDC), mapeo de pruebas EUA de FDA a LOINC' },
    priority: 10,
  },
  {
    id: 'unmtransinfo-cfde-biomarkers',
    repo: 'https://github.com/unmtransinfo/cfde-biomarkers',
    commit: '9a121841fd616d2c129faf46c9a1b1df546fb2e3',
    files: ['output/clia_doc2test2analyte_chem.tsv', 'output/clia_doc2test2analyte_gp.tsv', 'README.md'],
    license: 'Licencia Creative Commons en el repo. Contenido: extracto de la base CLIA de FDA (dominio público): documento (K-number) → sistema de prueba → analito.',
    upstream: { url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfClia/Search.cfm', exportDate: '2025-03', note: 'sólo enriquece: analitos por K-number' },
    enrichOnly: true,
    priority: 0,
  },
  {
    id: 'tonystathoulis-maude',
    repo: 'https://github.com/Tonystathoulis/Medical-Device-Safety-Intelligence',
    commit: 'd20a9fa8bd5a027c4068c2de1fa289ed2d6e5893',
    files: ['medical device safety intelligence/data/processed/maude_devices.csv', 'medical device safety intelligence/data/processed/maude_reports.csv'],
    license: 'Sin licencia declarada en el repo; contenido: registros de openFDA device/event (MAUDE), CC0.',
    upstream: { url: 'https://api.fda.gov/device/event.json', exportDate: null, note: 'Eventos recibidos 2026-09-01 a 2026-10-13, todos los paneles; marcas con «¿» donde el original tenía ® o ™ (daño de codificación del espejo, se conserva verbatim)' },
    priority: 10,
  },
  {
    id: 'sarath-fda-device-recalls',
    repo: 'https://github.com/Sarath-Venkatesan/fda-device-recalls-analytics',
    commit: '3e485d48c4f9ff490d0ce31d5f152acb323a2c9e',
    files: ['fda_device_recalls.xlsm'],
    convert: [{ xlsx: 'fda_device_recalls.xlsm', sheet: 'Recalls_Data', out: 'recalls.ndjson' }],
    license: 'Sin licencia declarada en el repo; contenido: openFDA device/enforcement unido a recall y classification (CC0).',
    upstream: { url: 'https://api.fda.gov/device/enforcement.json', exportDate: null, note: 'report_date 2012-06-20 a 2026-09-23' },
    priority: 10,
  },
  {
    id: 'hxlvvm-recalltrace',
    repo: 'https://github.com/hxlvvm/RecallTrace',
    commit: 'ffe8177d7906fbfac991fdc520c55a3d551c5ba0',
    files: ['data/snapshot/recalls.jsonl.gz', 'data/snapshot/MANIFEST.json'],
    license: 'MIT (código); el manifiesto declara los datos openFDA CC0.',
    upstream: { url: 'https://api.fda.gov/device/recall.json', exportDate: '2026-10-07', note: 'product_code FRN, MKJ, CBK, MHX, DQA' },
    priority: 20,
  },
  {
    id: 'hayden-farquhar-maude-ai',
    repo: 'https://github.com/hayden-farquhar/MAUDE-AI-Devices',
    commit: '355566d7211b08d0fba048c38c898c470e4a9a32',
    files: ['data/processed/linked_reports.parquet', 'LICENSE', 'README.md'],
    convert: [
      {
        parquet: 'data/processed/linked_reports.parquet',
        columns: 'report_number,date_received,device_report_product_code,brand_name,generic_name,manufacturer_d_name,model_number,catalog_number,event_type',
        out: 'linked_reports.ndjson',
      },
    ],
    license: 'Código MIT; datos CC BY 4.0 (Zenodo 10.5281/zenodo.20411622). Contenido: informes openFDA device/event (CC0) de product codes de dispositivos con IA.',
    upstream: { url: 'https://api.fda.gov/device/event.json', exportDate: null, note: 'informes recibidos 2020-01-01 a 2026-04-30; las columnas matched_* son un cruce del autor y NO se usan' },
    priority: 5,
  },
  {
    id: 'arpan2217-maude-1991-2010',
    repo: 'https://github.com/arpan2217/medical-device-adverse-events',
    commit: 'c2096e3e12a9a8f505f4057ce544e3b6b59fff6c',
    files: ['data/fda_adverse_events_subset.csv'],
    license: 'Sin licencia declarada en el repo; contenido: openFDA device/event (CC0) aplanado, con el arreglo `device` como mapa de texto.',
    upstream: { url: 'https://api.fda.gov/device/event.json', exportDate: null, note: '30 000 informes recibidos 1991–2010, todos los paneles' },
    priority: 4,
  },
  {
    id: 'sarcom2-maude-cardio-2024',
    repo: 'https://github.com/sarcom2/fda-device-events-elt',
    commit: 'd7e08df377ce61ab012a554d9a68b4c729a4dd50',
    files: ['data/snapshots/device_events_cardio_2024.parquet'],
    convert: [{ parquet: 'data/snapshots/device_events_cardio_2024.parquet', columns: 'mdr_report_key,report_number,date_received,brand_name,generic_name,manufacturer_name,device_report_product_code', out: 'cardio_2024.ndjson' }],
    license: 'Sin licencia declarada en el repo; contenido: openFDA device/event (CC0), panel cardiovascular, 2024.',
    upstream: { url: 'https://api.fda.gov/device/event.json', exportDate: null, note: '108 265 informes recibidos en 2024 (cardiovascular); sin número de modelo' },
    priority: 3,
  },
  {
    id: 'levisw-maude-2022-2024',
    repo: 'https://github.com/levisw/FDA-Medical-Device-Failure-Classification',
    commit: '728544bf5893161bd741e10796872746cd7ab9d1',
    files: ['data/train_data_1.csv', 'data/train_data_2.csv', 'data/train_data_3.csv', 'data/train_data_4.csv', 'data/test_data.csv'],
    license: 'Sin licencia declarada en el repo; contenido: columnas de los archivos masivos MAUDE de FDA (dominio público), eventos 2022–2024.',
    upstream: { url: 'https://www.fda.gov/medical-devices/medical-device-reporting-mdr-how-report-medical-device-problems/mdr-data-files', exportDate: null, note: 'MDR_REPORT_KEY, DEVICE_REPORT_PRODUCT_CODE, BRAND_NAME, MANUFACTURER_G1_NAME; sin modelo ni fabricante D' },
    priority: 2,
  },
]);
