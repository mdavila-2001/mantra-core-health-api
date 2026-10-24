// =============================================================================
// Ensamblado del corpus (puro, sin red ni disco): filas crudas ya leídas →
// registros comunes en alcance, deduplicados, más el reporte de cobertura.
// =============================================================================

import { dedupe, normKey } from './common.mjs';
import { classifyEmdn, emdnCategory } from './emdn-scope.mjs';
import {
  buildReferenceIndex,
  normalizeActorRow,
  normalizeUdiRow,
  splitNomenclature,
} from './sources/eudamed-datalake.mjs';

const inc = (obj, k, n = 1) => ((obj[k] = (obj[k] ?? 0) + n), obj);

/** Un registro está en alcance si alguno de sus códigos EMDN/CND lo está. */
export function scopeOf(record) {
  const codes = [
    record.deviceTypeCode,
    ...(record.extensions?.emdnCodes ?? []),
  ].filter(Boolean);
  if (!['EMDN', 'CND'].includes(record.deviceTypeSystem) || !codes.length)
    return { inScope: false, rule: 'sin-codigo-emdn' };
  const verdicts = codes.map((c) => classifyEmdn(c));
  return verdicts.find((v) => v.inScope) ?? verdicts[0];
}

/**
 * @param {{
 *   emdnConcepts?: object[],
 *   referenceRows?: object[],
 *   udiPages?: { rows: object[], sourceUrl: string, retrievedAt: string }[],
 *   actorPages?: { rows: object[], sourceUrl: string, retrievedAt: string }[],
 *   extraDevices?: object[],
 *   gaps?: object[],
 * }} input
 */
export function buildCorpus({
  emdnConcepts = [],
  referenceRows = [],
  udiPages = [],
  actorPages = [],
  extraDevices = [],
  gaps = [],
}) {
  const emdnByCode = new Map(emdnConcepts.map((c) => [c.code, c]));
  const reference = buildReferenceIndex(referenceRows);
  const excludedByRule = {};
  const candidates = [];

  const all = [
    ...udiPages.flatMap((p) =>
      p.rows.map((row) =>
        normalizeUdiRow(row, {
          reference,
          emdnByCode,
          sourceUrl: p.sourceUrl,
          retrievedAt: p.retrievedAt,
        }),
      ),
    ),
    ...extraDevices,
  ];
  for (const r of all) {
    const s = scopeOf(r);
    if (s.inScope)
      candidates.push({
        ...r,
        extensions: { ...r.extensions, scopeRule: s.rule },
      });
    else inc(excludedByRule, s.rule);
  }
  const { kept: devices, duplicates } = dedupe(candidates);

  // Fabricantes: solo los que aparecen como fabricante legal de algún equipo en alcance.
  const srnsInScope = new Set(
    devices.map((d) => d.manufacturerRegistryId).filter(Boolean),
  );
  const manufacturers = dedupe(
    actorPages
      .flatMap((p) =>
        p.rows.map((row) =>
          normalizeActorRow(row, {
            sourceUrl: p.sourceUrl,
            retrievedAt: p.retrievedAt,
          }),
        ),
      )
      .filter((m) => srnsInScope.has(m.manufacturerRegistryId)),
  ).kept;

  return {
    devices,
    manufacturers,
    coverage: coverageReport({
      devices,
      manufacturers,
      emdnConcepts,
      excludedByRule,
      duplicates,
      gaps,
      totalRead: all.length,
    }),
  };
}

export function coverageReport({
  devices,
  manufacturers,
  emdnConcepts,
  excludedByRule,
  duplicates,
  gaps,
  totalRead,
}) {
  const bySource = {};
  const byCategory = {};
  const byGroup = {};
  const mfKeys = new Set();
  const brandKeys = new Set();
  for (const d of devices) {
    inc(bySource, d.source);
    const cat = emdnCategory(d.deviceTypeCode) ?? '—';
    inc(byCategory, cat);
    inc(byGroup, d.deviceTypeCode?.slice(0, 3) ?? '—');
    const mf = normKey(d.manufacturerRegistryId ?? d.manufacturerName);
    if (mf) mfKeys.add(mf);
    if (mf && d.brandName) brandKeys.add(`${mf}|${normKey(d.brandName)}`);
  }
  const scopeCodes = emdnConcepts.filter((c) => c.scope.inScope);
  const codesWithDevices = new Set(
    devices.flatMap((d) => [
      d.deviceTypeCode,
      ...(d.extensions?.emdnCodes ?? []),
    ]),
  );
  return {
    totalRead,
    devicesInScope: devices.length,
    duplicatesDropped: duplicates.length,
    excludedByRule,
    devicesBySource: bySource,
    devicesByEmdnCategory: byCategory,
    devicesByEmdnGroup: byGroup,
    distinctManufacturers: mfKeys.size,
    distinctBrands: brandKeys.size,
    manufacturerRecords: manufacturers.length,
    emdn: {
      concepts: emdnConcepts.length,
      inScopeConcepts: scopeCodes.length,
      inScopeTerminal: scopeCodes.filter((c) => c.terminal).length,
      inScopeTerminalWithoutDevices: scopeCodes.filter(
        (c) => c.terminal && !codesWithDevices.has(c.code),
      ).length,
    },
    gaps,
  };
}

export { splitNomenclature };
