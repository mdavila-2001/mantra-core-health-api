// =============================================================================
// SAHPRA (Sudáfrica) · listas de kits de diagnóstico in vitro de COVID-19
// autorizados (xlsx publicados en
// https://www.sahpra.org.za/medical-devices/medical-devices-and-in-vitro-diagnostics-test-kits/).
//
// Cuatro listas, cada una con su fecha de corte en el nombre del archivo:
// antígeno autotest, antígeno profesional, moleculares y serológicos. Columnas:
// «No.», [«Application Date»], «SAHPRA Licence Holder», «Product Name»,
// «Product Description», «Original Manufacturer», «Date Authorised».
//
// - Una fila por línea de la lista (`<lista>|<No.>`): el mismo producto puede
//   figurar varias veces con distintos titulares de licencia locales.
// - Fabricante: «Original Manufacturer»; el titular local en
//   `extra.licenceHolder`. Marca: «Product Name».
// - Tipo: la lista (`za:sahpra-covid-test-kit-list`, nombre de la hoja);
//   «Product Description» verbatim en `extra.description`.
// - Las listas no publican número de autorización ni clase: quedan en null.
// =============================================================================

import { dmyToIso, makeRow, textOrNull } from './row.mjs';

/**
 * @param {{ key: string, sheet: string, rows: unknown[][], ctx: object }[]} lists
 */
export function sahpraRows(lists) {
  const rows = [];
  const stats = { duplicates: 0, withoutManufacturer: 0 };
  for (const list of lists) {
    const [head, ...body] = list.rows;
    const col = Object.fromEntries(
      head.map((name, i) => [textOrNull(name), i]).filter(([n]) => n),
    );
    const get = (line, name) =>
      col[name] === undefined ? null : textOrNull(line[col[name]]);
    const seen = new Set();
    for (const line of body) {
      const no = get(line, 'No.');
      if (no === null) continue;
      if (seen.has(no)) {
        stats.duplicates += 1;
        continue;
      }
      seen.add(no);
      const manufacturer = get(line, 'Original Manufacturer');
      if (manufacturer === null) {
        stats.withoutManufacturer += 1;
        continue;
      }
      rows.push(
        makeRow({
          source: 'sahpra-covid-ivd',
          sourceRecordId: `${list.key}|${no}`,
          sourceUrl: list.ctx.sourceUrl,
          sourceVersion: list.ctx.sourceVersion,
          retrievedAt: list.ctx.retrievedAt,
          deviceTypeCode: null,
          deviceTypeSystem: 'za:sahpra-covid-test-kit-list',
          deviceTypeName: list.sheet,
          manufacturerName: manufacturer,
          manufacturerCountry: null,
          manufacturerRegistryId: null,
          brandName: get(line, 'Product Name'),
          model: null,
          udiDi: null,
          riskClass: null,
          authorizationId: null,
          authorizationDate: dmyToIso(get(line, 'Date Authorised')),
          status: 'authorised',
          extra: {
            ...(get(line, 'Product Description')
              ? { description: get(line, 'Product Description') }
              : {}),
            licenceHolder: get(line, 'SAHPRA Licence Holder'),
            ...(dmyToIso(get(line, 'Application Date'))
              ? { applicationDate: dmyToIso(get(line, 'Application Date')) }
              : {}),
            inVitroDiagnostic: true,
            officialFile: list.ctx.officialFile,
            officialPortal: list.ctx.officialPortal,
          },
        }),
      );
    }
  }
  return { rows, stats };
}
