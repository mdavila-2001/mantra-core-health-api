// =============================================================================
// TGA (Australia) · DAEN (Database of Adverse Event Notifications, medical
// devices) → formato común.
//
// No es el ARTG: son los dispositivos que aparecen en notificaciones de eventos
// adversos, con su número ARTG, nombre comercial, sponsor, fabricante, término
// GMDN y, en los reportes completos, clase y número de modelo. El espejo los
// bajó por sponsor (CSV resumidos y pickles con el reporte completo; los
// pickles se convierten a JSONL en `fetch-mirrors.mjs` sin ejecutar código).
//
// Una fila = ARTG + nombre comercial + modelo. DAEN escribe «-» cuando no hay
// valor: se toma como vacío. La narrativa del evento no se exporta.
// =============================================================================

import { dmyToIso, makeRow, textOrNull } from './row.mjs';

/** DAEN usa «-» como vacío. */
export function daenText(value) {
  const text = textOrNull(value);
  return text === '-' ? null : text;
}

/** `10/01/2018` o `6/12/2018` (d/m/aaaa) → `2018-01-10` / `2018-12-06`. */
export function daenDate(value) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(value ?? '').trim());
  return m === null
    ? null
    : dmyToIso(`${m[1].padStart(2, '0')}/${m[2].padStart(2, '0')}/${m[3]}`);
}

function keyOf(r) {
  return `${daenText(r['ARTG number']) ?? ''}|${daenText(r['Trade name']) ?? ''}|${daenText(r['Model number']) ?? ''}`;
}

function accumulate(groups, r, withModel) {
  const key = withModel ? keyOf(r) : keyOf({ ...r, 'Model number': null });
  let g = groups.get(key);
  if (g === undefined) {
    g = {
      first: r,
      reports: new Set(),
      dates: [],
      classes: new Set(),
      software: new Set(),
    };
    groups.set(key, g);
  }
  if (daenText(r['Report number'])) g.reports.add(daenText(r['Report number']));
  const date = daenDate(r['Report date']);
  if (date) g.dates.push(date);
  if (daenText(r['Device classification']))
    g.classes.add(daenText(r['Device classification']));
  if (daenText(r['Software version']))
    g.software.add(daenText(r['Software version']));
  return key;
}

/**
 * @param {Iterable<object>} fullReports  filas de `reports.jsonl` (con clase y modelo)
 * @param {Iterable<object>} summaryRows  filas de los CSV resumidos (sin clase ni modelo)
 */
export function daenRows(fullReports, summaryRows, ctx) {
  const groups = new Map();
  const coveredPairs = new Set();
  for (const r of fullReports) {
    accumulate(groups, r, true);
    coveredPairs.add(
      `${daenText(r['ARTG number']) ?? ''}|${daenText(r['Trade name']) ?? ''}`,
    );
  }
  for (const r of summaryRows) {
    const pair = `${daenText(r['ARTG number']) ?? ''}|${daenText(r['Trade name']) ?? ''}`;
    if (coveredPairs.has(pair)) continue;
    accumulate(groups, r, false);
  }
  const rows = [];
  let withoutManufacturer = 0;
  for (const [key, g] of groups) {
    const r = g.first;
    const manufacturerName = daenText(r.Manufacturer);
    if (manufacturerName === null) {
      withoutManufacturer += 1;
      continue;
    }
    const classes = [...g.classes];
    const dates = g.dates.sort();
    const gmdn = daenText(r['GMDN term']);
    rows.push(
      makeRow({
        source: 'tga-daen',
        sourceRecordId: key,
        sourceUrl: ctx.sourceUrl,
        sourceVersion: ctx.sourceVersion,
        retrievedAt: ctx.retrievedAt,
        deviceTypeCode: null,
        deviceTypeSystem: gmdn === null ? null : 'gmdn-pt',
        deviceTypeName: gmdn,
        manufacturerName,
        manufacturerCountry: null,
        manufacturerRegistryId: null,
        brandName: daenText(r['Trade name']),
        model: daenText(r['Model number']),
        udiDi: null,
        riskClass: classes.length === 1 ? `au:${classes[0]}` : null,
        authorizationId: daenText(r['ARTG number']),
        authorizationDate: null,
        status: null,
        extra: {
          sponsor: daenText(r.Sponsor),
          ...(classes.length > 1 ? { deviceClassifications: classes } : {}),
          ...(g.software.size > 0 ? { softwareVersions: [...g.software] } : {}),
          reportNumbers: [...g.reports].sort((a, b) => Number(a) - Number(b)),
          ...(dates.length > 0
            ? {
                firstReportDate: dates[0],
                lastReportDate: dates[dates.length - 1],
              }
            : {}),
          mirror: ctx.mirror,
          officialPortal: ctx.officialPortal,
        },
      }),
    );
  }
  return { rows, withoutManufacturer };
}
