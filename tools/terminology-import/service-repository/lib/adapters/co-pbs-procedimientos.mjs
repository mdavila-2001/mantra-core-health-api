// MinSalud Colombia — «Procedimiento del PBS» (datos.gov.co 9zcz-bjue).
// 8 114 CUPS con su explicación en lenguaje llano («Qué es»).
// Aporta a los conceptos CUPS (`cups-co`) su DEFINICIÓN; el nombre oficial lo
// pone la CUPS 2026 cuando el código está en las dos (ver merge en el armado).
// Licencia CC BY-SA 4.0 (metadata del dataset): la definición viaja con su
// atribución en la propiedad de fuente; ShareAlike → ver SOURCES.md.
import { createRequire } from 'node:module';
import { clean, count, newReport, readVerified } from '../common.mjs';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

export const meta = {
  internalCode: 'cups-co',
  name: 'CUPS — Clasificación Única de Procedimientos en Salud (Colombia)',
  version: 'pbs-datos-gov-co',
  validFrom: null,
  mergeOnly: true,
  source: {
    code: 'MINSALUD_CO_PBS',
    name: 'MinSalud Colombia — Procedimientos del Plan de Beneficios en Salud (datos.gov.co)',
    owner: 'Ministerio de Salud y Protección Social de Colombia',
    officialUrl: 'https://www.datos.gov.co/api/views/9zcz-bjue/rows.csv?accessType=DOWNLOAD',
    license: 'CC BY-SA 4.0 (metadata del dataset 9zcz-bjue en datos.gov.co). Atribución: Ministerio de Salud y Protección Social.',
  },
  files: [{ path: 'co-minsalud-pbs-procedimientos/procedimiento_pbs_9zcz-bjue.csv', sha256: '4a8ed7ff9c225a96427d884b4c683472e4c765cacc93a83f22229ebb80140636' }],
};

export function parse(text) {
  const report = newReport();
  const wb = XLSX.read(text, { type: 'string', raw: true });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false });
  const records = [];
  const seen = new Set();
  for (const row of rows) {
    report.read += 1;
    const raw = String(row.CodigoCUPS ?? '').trim();
    if (!/^\d{1,6}$/.test(raw)) { count(report, 'sin código CUPS'); continue; }
    // El dataset perdió el cero inicial al guardarse como número.
    const code = raw.padStart(6, '0');
    if (seen.has(code)) { count(report, 'código repetido'); continue; }
    seen.add(code);
    const queEs = clean(row.QueEs);
    records.push({
      codeSystem: meta.internalCode,
      code,
      display: clean(row.Descripcion),
      definition: queEs && queEs !== 'Sin dato' ? queEs : null,
      definitionSource: 'MINSALUD_CO_PBS',
      specialties: [],
      price: null,
      reviewStatus: 'source-verbatim',
    });
  }
  report.kept = records.length;
  return { records, report };
}

export async function build({ sourcesDir }) {
  return parse(readVerified(sourcesDir, meta.files[0]).toString('utf8'));
}
