// =============================================================================
// OMS · lista de diagnósticos in vitro precalificados (WHO Prequalification).
//
// Export CSV oficial de la lista
// (extranet.who.int/prequal/vitro-diagnostics/prequalified/in-vitro-diagnostics):
// una línea por código de producto (referencia de catálogo) de cada producto
// precalificado. Una fila = un código de producto.
//
// - Todo es diagnóstico in vitro (es la lista de IVD precalificados).
// - Tipo: formato del ensayo («Immunochromatographic (lateral flow)», «NAT …»)
//   → `who:assay-format`; patógeno o marcador en `extra.target`.
// - `authorizationId`: WHO Product ID. La lista solo publica el año de
//   precalificación: va en `extra.prequalificationYear` y `authorizationDate`
//   queda en null.
// =============================================================================

import { makeRow, textOrNull } from './row.mjs';

export function whoPqRows(lines, ctx) {
  const rows = [];
  const seen = new Set();
  let duplicates = 0;
  for (const line of lines) {
    const productId = textOrNull(line['WHO Product ID']);
    const code = textOrNull(line['Product Code']);
    const manufacturer = textOrNull(line['Manufacturer name']);
    if (productId === null || manufacturer === null) continue;
    const id = `${productId}|${code ?? ''}`;
    if (seen.has(id)) {
      duplicates += 1;
      continue;
    }
    seen.add(id);
    const format = textOrNull(line['Assay Format']);
    rows.push(
      makeRow({
        source: 'who-pq-ivd',
        sourceRecordId: id,
        sourceUrl: ctx.sourceUrl,
        sourceVersion: ctx.sourceVersion,
        retrievedAt: ctx.retrievedAt,
        deviceTypeCode: null,
        deviceTypeSystem: format === null ? null : 'who:assay-format',
        deviceTypeName: format,
        manufacturerName: manufacturer,
        manufacturerCountry: null,
        manufacturerRegistryId: null,
        brandName: textOrNull(line['Product name']),
        model: code,
        udiDi: null,
        riskClass: null,
        authorizationId: productId,
        authorizationDate: null,
        status: 'prequalified',
        extra: {
          ...(textOrNull(line['Pathogen/Disease/Marker'])
            ? { target: textOrNull(line['Pathogen/Disease/Marker']) }
            : {}),
          ...(textOrNull(line['Regulatory Version'])
            ? { regulatoryVersion: textOrNull(line['Regulatory Version']) }
            : {}),
          ...(textOrNull(line['Year prequalification'])
            ? {
                prequalificationYear: textOrNull(line['Year prequalification']),
              }
            : {}),
          inVitroDiagnostic: true,
          officialFile: ctx.officialFile,
          officialPortal: ctx.officialPortal,
        },
      }),
    );
  }
  return { rows, duplicates };
}
