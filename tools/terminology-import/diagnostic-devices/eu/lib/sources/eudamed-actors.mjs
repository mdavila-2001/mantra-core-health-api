// =============================================================================
// Actores fabricantes de EUDAMED vía la réplica
// longtran00/EUDAMED_ManufacturersScraper (Eudamed_Manufacturers.xlsx, hoja
// «Manufacturers»): «Actor ID/SRN, Version, Role, Name, Abbreviated Name,
// City, Country». No son filas de equipos: van aparte (out/actors/) para que
// `master` pueda unir fabricantes por SRN. El país viene como nombre en
// inglés; se convierte a ISO alfa-2 solo por coincidencia exacta con los
// nombres en inglés de Intl.DisplayNames (sin parecidos difusos).
// =============================================================================

import { clean, makeDeviceRecord } from '../common.mjs';

export const SOURCE = 'eudamed-actors';
const HEADER = [
  'Actor ID/SRN',
  'Version',
  'Role',
  'Name',
  'Abbreviated Name',
  'City',
  'Country',
];

export function assertActorsHeader(header) {
  const missing = HEADER.filter((h) => !header.includes(h));
  if (missing.length)
    throw new Error(
      `Planilla de actores sin columnas ${missing.join(', ')}. Encabezados reales: ${JSON.stringify(header)}`,
    );
}

let countryIndex = null;
/** Nombre de país en inglés → ISO alfa-2, por coincidencia exacta (sin distinguir mayúsculas). */
export function countryNameToIso(name) {
  const n = clean(name)?.toLowerCase();
  if (!n) return null;
  if (!countryIndex) {
    countryIndex = new Map();
    const dn = new Intl.DisplayNames(['en'], { type: 'region' });
    for (let a = 65; a <= 90; a++)
      for (let b = 65; b <= 90; b++) {
        const code = String.fromCharCode(a, b);
        const label = dn.of(code);
        if (label && label !== code)
          countryIndex.set(label.toLowerCase(), code);
      }
  }
  return countryIndex.get(n) ?? null;
}

const SRN_RE = /^([A-Z]{2})-(MF|AR|IM|PR)-\d{9}$/;

/** «AT-MF-000001790\r\nInactive» → { srn, status: 'Inactive' }; la celda trae el estado pegado. */
export function parseSrnCell(cell) {
  const [srn, ...rest] = String(cell ?? '')
    .trim()
    .split(/\s+/);
  return { srn: SRN_RE.test(srn) ? srn : null, status: clean(rest.join(' ')) };
}

/** «3 (Current)» → { n: 3, current: true }. */
export function parseVersion(v) {
  const m = /^(\d+)\s*\((Current|History)\)$/i.exec(clean(v) ?? '');
  return m
    ? { n: Number(m[1]), current: m[2].toLowerCase() === 'current' }
    : { n: -1, current: false };
}

/**
 * La planilla trae todas las versiones (búsqueda con historial). Por SRN se
 * queda la versión vigente («Current»; si hay más de una, la de número mayor)
 * y se anota cuántas versiones históricas había.
 */
export function selectCurrentVersions(rows) {
  const bySrn = new Map();
  for (const r of rows) {
    const { srn } = parseSrnCell(r['Actor ID/SRN']);
    if (!srn) continue;
    (bySrn.get(srn) ?? bySrn.set(srn, []).get(srn)).push(r);
  }
  return [...bySrn.values()].map((list) => {
    const ranked = [...list].sort((a, b) => {
      const va = parseVersion(a.Version);
      const vb = parseVersion(b.Version);
      return Number(vb.current) - Number(va.current) || vb.n - va.n;
    });
    return { row: ranked[0], versions: list.length };
  });
}

/** Fila de la planilla → registro de actor (mismos campos de cita que una fila de equipo). */
export function normalizeActorRow(row, ctx) {
  const { srn, status } = parseSrnCell(row['Actor ID/SRN']);
  if (!srn) return null;
  const iso = countryNameToIso(row.Country);
  // Si el nombre no coincide exacto, el país sale del prefijo del SRN (formato
  // de EUDAMED: país del actor), marcado en extra.manufacturerCountrySource.
  const prefix = SRN_RE.exec(srn)[1];
  const rec = makeDeviceRecord({
    source: SOURCE,
    sourceRecordId: srn,
    sourceUrl: ctx.sourceUrl,
    sourceVersion: `eudamed-actor-version=${clean(row.Version) ?? '?'};via=EUDAMED_ManufacturersScraper@${ctx.mirror.commit.slice(0, 8)}`,
    retrievedAt: ctx.retrievedAt,
    manufacturerName: row.Name,
    manufacturerCountry: iso ?? prefix,
    manufacturerRegistryId: `srn:${srn}`,
    extra: {
      role: clean(row.Role),
      actorStatus: status,
      versionsInSource: ctx.versions ?? null,
      abbreviatedName: clean(row['Abbreviated Name']),
      city: clean(row.City),
      countryName: clean(row.Country),
      manufacturerCountrySource: iso ? 'nombre-de-pais-exacto' : 'prefijo-SRN',
      mirror: ctx.mirror,
    },
  });
  // Un actor no es un equipo: se quitan los campos de equipo (todos null).
  return Object.fromEntries(
    Object.entries(rec).filter(([k]) =>
      [
        'source',
        'sourceRecordId',
        'sourceUrl',
        'sourceVersion',
        'retrievedAt',
        'manufacturerName',
        'manufacturerCountry',
        'manufacturerRegistryId',
        'extra',
      ].includes(k),
    ),
  );
}
