// FONASA MLE 2026 (Chile), las 2 515 prestaciones — no sólo las que nombran
// especialidad (esas ya las relaciona specialty-services/). Mismo transporte y
// mismas verificaciones que specialty-services/ (copia npm cotejada 596/596
// contra el PDF oficial). Mismo codeSystem → mismo id de concepto.
import { createRequire } from 'node:module';
import { newReport, readVerified } from '../common.mjs';
import { readTarGzMember } from '../../../specialty-services/lib/common.mjs';
import { SOURCES, parseFonasa, readFonasaPdfExtracts, verifyFonasaAgainstPdf } from '../../../specialty-services/lib/sources.mjs';

const DEF = SOURCES.fonasa;

export const meta = {
  internalCode: DEF.codeSystem,
  name: DEF.codeSystemName,
  version: DEF.version,
  validFrom: DEF.validFrom,
  source: { code: DEF.sourceCode, name: DEF.sourceName, owner: DEF.owner, officialUrl: DEF.officialUrl, license: DEF.license },
  files: [{ path: 'cl-fonasa-mle-2026-npm/fonasa-mle-open-1.0.0.tgz', sha256: 'b622019be7a3a1e3eb560c01415d991947ac21561ed074187f2b9ee687e9e05c' }],
};

export function parse(json) {
  const report = newReport();
  const rows = parseFonasa(json);
  const check = verifyFonasaAgainstPdf(rows, readFonasaPdfExtracts());
  if (check.problems.length > 0) throw new Error(`FONASA: la copia no coincide con el PDF oficial: ${check.problems.slice(0, 5).join('; ')}`);
  const records = rows.map((r) => ({
    codeSystem: meta.internalCode,
    code: r.code,
    display: r.display,
    chapter: `Grupo ${r.code.slice(0, 2)}`,
    specialties: [],
    price: Number.isFinite(r.level1Total) ? { value: r.level1Total, unit: 'CLP' } : null,
    reviewStatus: 'source-verbatim',
  }));
  report.read = rows.length;
  report.kept = records.length;
  report.pdfCrossCheck = { checked: check.checked, problems: 0 };
  return { records, report };
}

export async function build({ sourcesDir }) {
  const tgz = readVerified(sourcesDir, meta.files[0]);
  return parse(readTarGzMember(tgz, DEF.transport.member).toString('utf8'));
}
