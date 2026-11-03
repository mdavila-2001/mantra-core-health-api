// =============================================================================
// Fuentes propias de `master/` convertidas al formato de intercambio común.
//
// `fda-ai-enabled-devices`: la lista de la FDA de dispositivos con IA
// autorizados (fecha de decisión, número de presentación, nombre del
// dispositivo, empresa, panel y product code principal). No es una fuente de
// equipos «de diagnóstico» por sí misma: el recorte lo hace la taxonomía con el
// product code de cada fila.
// =============================================================================

import { MIRRORS, mirrorVersion } from './sources.mjs';

export const AIML_COLUMNS = Object.freeze([
  'Date of Final Decision',
  'Submission Number',
  'Device',
  'Company',
  'Panel (Lead)',
  'Primary Product Code',
]);

/** CSV con comillas dobles (RFC 4180): campos con coma, comillas o saltos. */
export function parseCsv(text, delimiter = ',') {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"' && field === '') quoted = true;
    // Una comilla en medio de un campo sin comillas es literal (la copia TSV
    // de la EMDN trae `("BARBED")` sin escapar).
    else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

const usDate = (s) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((s ?? '').trim());
  return m ? `${m[3]}-${m[1]}-${m[2]}` : null;
};

/**
 * Ficha pública de cada tipo de presentación. El número decide la base de
 * datos de la FDA (510(k): K…; De Novo: DEN…; PMA: P…; HDE: H…).
 */
export function fdaSubmissionUrl(id) {
  if (/^K\d{6}$/.test(id))
    return `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=${id}`;
  if (/^DEN\d{6}$/.test(id))
    return `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/denovo.cfm?id=${id}`;
  if (/^P\d{6}/.test(id))
    return `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm?id=${id.replace(/\/.*$/, '')}`;
  if (/^H\d{6}/.test(id))
    return `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfhde/hde.cfm?id=${id}`;
  return null;
}

/** Lista FDA de dispositivos con IA → filas del formato común. */
export function aimlRows(text, { retrievedAt }) {
  const table = parseCsv(text);
  const header = table[0].map((h) => h.trim());
  const missing = AIML_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length)
    throw new Error(`lista IA: faltan columnas ${missing.join(', ')}`);
  const col = Object.fromEntries(header.map((h, i) => [h, i]));
  const f = MIRRORS['ej86-fda-ai'].files.aiml;
  const version = mirrorVersion('ej86-fda-ai');
  const out = [];
  const errors = [];
  for (let i = 1; i < table.length; i++) {
    const r = table[i];
    const get = (c) => {
      const v = (r[col[c]] ?? '').trim();
      return v === '' ? null : v;
    };
    const id = get('Submission Number');
    const company = get('Company');
    if (!id || !company) {
      errors.push({
        line: i + 1,
        reason: 'sin número de presentación o sin empresa',
      });
      continue;
    }
    const pc = get('Primary Product Code');
    out.push({
      source: f.source,
      sourceRecordId: id,
      sourceUrl: fdaSubmissionUrl(id) ?? f.officialUrl,
      sourceVersion: version,
      retrievedAt,
      deviceTypeCode: pc,
      deviceTypeSystem: pc ? 'fda-product-code' : null,
      // La lista no trae el nombre del tipo; lo pone la taxonomía.
      deviceTypeName: null,
      manufacturerName: company,
      manufacturerCountry: null,
      manufacturerRegistryId: null,
      brandName: get('Device'),
      model: null,
      udiDi: null,
      riskClass: null,
      authorizationId: id,
      authorizationDate: usDate(get('Date of Final Decision')),
      status: null,
      extra: { panelLead: get('Panel (Lead)'), listUrl: f.officialUrl },
    });
  }
  return { rows: out, errors };
}
