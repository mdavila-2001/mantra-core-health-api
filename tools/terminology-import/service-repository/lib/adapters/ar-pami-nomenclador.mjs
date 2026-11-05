// PAMI (INSSJP, Argentina) — Nomenclador Común, «estructura unidades febrero 2019».
// CSV Latin-1 «Módulo;Código de práctica;Descripción de práctica;Valor resultante unidades».
// Licencia CC BY 4.0 (API CKAN de datos.pami.org.ar, `license_id: CC-BY-4.0`).
// Sin especialidad: el CSV sólo trae el número de módulo, sin título, y asignar
// por el prefijo del código sería inferir.
import { clean, count, newReport, readVerified } from '../common.mjs';

export const meta = {
  internalCode: 'ar-pami-nomenclador',
  name: 'PAMI — Nomenclador Común de prácticas (Argentina)',
  version: '2019-02',
  validFrom: null,
  source: {
    code: 'AR_PAMI',
    name: 'PAMI — Instituto Nacional de Servicios Sociales para Jubilados y Pensionados (Argentina)',
    owner: 'INSSJP-PAMI',
    officialUrl: 'https://datos.pami.org.ar/dataset/9937b24d-abad-45fb-8158-c1c5684d2635/resource/5d32d7a8-3d6a-4ed4-9701-6d4fd024c657/download/nomenclador-comun.csv',
    license: 'CC BY 4.0 (datos.pami.org.ar, license_id CC-BY-4.0). Se cita la fuente.',
  },
  files: [{ path: 'ar-pami-nomenclador-comun/nomenclador-comun.csv', sha256: '07370b31822789ce774f1f6632855a0e865ec23d65373a1c5e84aeefe96980b4' }],
};

/** Internación, estadías y módulos mensuales de cuidados crónicos: no son servicios de una práctica. */
const EXCLUDE = [
  [/INTERNACION|ESTADIA|PENSION|CUIDADOS CRONICOS/, 'internación o estadía'],
  [/^SUBMODULO|INSUMOS/, 'insumos o submódulo'],
];

export function parse(text) {
  const report = newReport();
  const records = [];
  const seen = new Set();
  for (const line of text.split(/\r?\n/)) {
    const cols = line.split(';');
    if (!/^\d+$/.test(cols[0]?.trim() ?? '') || !/^\d{6}$/.test(cols[1]?.trim() ?? '')) continue;
    report.read += 1;
    const [modulo, code, rawName, rawPrice] = cols.map((c) => c.trim());
    const display = clean(rawName);
    const rule = EXCLUDE.find(([re]) => re.test(display));
    if (rule) { count(report, rule[1]); continue; }
    if (seen.has(code)) { count(report, 'código repetido'); continue; }
    seen.add(code);
    const value = rawPrice ? Number(rawPrice.replace(/[$\s.]/g, '').replace(',', '.')) : null;
    records.push({
      codeSystem: meta.internalCode,
      code,
      display,
      chapter: `Módulo ${modulo}`,
      specialties: [],
      price: Number.isFinite(value) ? { value, unit: 'ARS' } : null,
      reviewStatus: 'source-verbatim',
    });
  }
  report.kept = records.length;
  return { records, report };
}

export async function build({ sourcesDir }) {
  const bytes = readVerified(sourcesDir, meta.files[0]);
  return parse(new TextDecoder('latin1').decode(bytes));
}
