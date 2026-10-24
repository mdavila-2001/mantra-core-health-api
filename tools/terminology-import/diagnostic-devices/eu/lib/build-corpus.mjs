// =============================================================================
// Ensamblado del corpus (puro, sin red ni disco): filas crudas ya leídas →
// filas del formato común, deduplicadas, más el reporte de cobertura.
//
// Recorte: se exportan las filas cuyo código EMDN/CND está EN ALCANCE (W
// entera o tipo listado) y también las de categorías EN REVISIÓN, marcadas en
// `extra.dxScope`, para que `master/` las clasifique con su taxonomía. Las de
// categorías excluidas no se exportan (y fetch.mjs ni siquiera las pide).
// =============================================================================

import { RowError, dedupe, normKey } from './common.mjs';
import { classifyEmdn, emdnCategory } from './emdn-scope.mjs';
import {
  buildReferenceIndex,
  indexActors,
  normalizeUdiRow,
} from './sources/eudamed-datalake.mjs';

const inc = (obj, k, n = 1) => ((obj[k] = (obj[k] ?? 0) + n), obj);

/** Códigos de tipo de una fila: el principal y los de `extra.deviceTypes`. */
export const typeCodes = (r) =>
  [
    r.deviceTypeSystem && r.deviceTypeCode
      ? { system: r.deviceTypeSystem, code: r.deviceTypeCode }
      : null,
    ...(r.extra?.deviceTypes ?? []),
  ].filter((t) => t && ['emdn', 'cnd'].includes(t.system) && t.code);

/** Veredicto de alcance de una fila: el de cualquier código en alcance, si no el del primero. */
export function scopeOf(record) {
  const codes = typeCodes(record);
  if (!codes.length) return { inScope: false, rule: 'sin-codigo-emdn' };
  const verdicts = codes.map((t) => classifyEmdn(t.code));
  return (
    verdicts.find((v) => v.inScope) ??
    verdicts.find((v) => v.rule.startsWith('pendiente-revision')) ??
    verdicts[0]
  );
}

export const isExported = (s) =>
  s.inScope || s.rule.startsWith('pendiente-revision');

/**
 * @param {{
 *   emdnConcepts?: object[],
 *   referenceRows?: object[],
 *   udiPages?: { rows: object[], sourceUrl: string, retrievedAt: string }[],
 *   actorRows?: object[],
 *   extraDevices?: object[],
 *   gaps?: object[],
 * }} input
 */
export function buildCorpus({
  emdnConcepts = [],
  referenceRows = [],
  udiPages = [],
  actorRows = [],
  extraDevices = [],
  gaps = [],
}) {
  const emdnByCode = new Map(emdnConcepts.map((c) => [c.code, c]));
  const reference = buildReferenceIndex(referenceRows);
  const actorsBySrn = indexActors(actorRows);
  const excludedByRule = {};
  const rejected = { count: 0, samples: [] };
  const candidates = [];

  const normalized = [];
  for (const p of udiPages)
    for (const row of p.rows)
      try {
        normalized.push(
          normalizeUdiRow(row, {
            reference,
            emdnByCode,
            actorsBySrn,
            sourceUrl: p.sourceUrl,
            retrievedAt: p.retrievedAt,
          }),
        );
      } catch (err) {
        if (!(err instanceof RowError)) throw err;
        rejected.count++;
        if (rejected.samples.length < 20) rejected.samples.push(err.message);
      }
  const all = [...normalized, ...extraDevices];
  for (const r of all) {
    const s = scopeOf(r);
    if (isExported(s))
      candidates.push({ ...r, extra: { ...r.extra, dxScope: s.rule } });
    else inc(excludedByRule, s.rule);
  }
  const { kept: devices, duplicates } = dedupe(candidates);

  return {
    devices,
    coverage: coverageReport({
      devices,
      emdnConcepts,
      excludedByRule,
      duplicates,
      rejected,
      gaps,
      totalRead: all.length + rejected.count,
    }),
  };
}

export function coverageReport({
  devices,
  emdnConcepts,
  excludedByRule,
  duplicates,
  rejected = { count: 0, samples: [] },
  gaps,
  totalRead,
}) {
  const bySource = {};
  const byScope = {};
  const byCategory = {};
  const byGroup = {};
  const mfKeys = new Set();
  const brandKeys = new Set();
  for (const d of devices) {
    inc(bySource, d.source);
    inc(byScope, d.extra?.dxScope ?? '—');
    inc(byCategory, emdnCategory(d.deviceTypeCode) ?? '—');
    inc(byGroup, d.deviceTypeCode?.slice(0, 3) ?? '—');
    const mf = normKey(d.manufacturerRegistryId ?? d.manufacturerName);
    if (mf) mfKeys.add(mf);
    if (mf && d.brandName) brandKeys.add(`${mf}|${normKey(d.brandName)}`);
  }
  const scopeCodes = emdnConcepts.filter((c) => c.scope.inScope);
  const codesWithDevices = new Set(
    devices.flatMap((d) => typeCodes(d).map((t) => t.code)),
  );
  return {
    totalRead,
    devicesExported: devices.length,
    devicesInScope: devices.filter(
      (d) => !d.extra?.dxScope?.startsWith('pendiente'),
    ).length,
    devicesPendingReview: devices.filter((d) =>
      d.extra?.dxScope?.startsWith('pendiente'),
    ).length,
    duplicatesDropped: duplicates.length,
    rejectedRows: rejected.count,
    rejectedSamples: rejected.samples,
    excludedByRule,
    devicesBySource: bySource,
    devicesByScope: byScope,
    devicesByEmdnCategory: byCategory,
    devicesByEmdnGroup: byGroup,
    distinctManufacturers: mfKeys.size,
    distinctBrands: brandKeys.size,
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
