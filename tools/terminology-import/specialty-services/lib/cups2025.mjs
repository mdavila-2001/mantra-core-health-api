// =============================================================================
// CUPS 2025 — Resolución 2706 de 2025 del Ministerio de Salud y Protección Social de Colombia
// (23-dic-2025; rige desde el 1-ene-2026), Anexo Técnico 2 «Lista tabular».
//
// El parser lee el texto de `pdftotext -raw` del PDF OFICIAL
// (https://minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/DE/DIJ/resolucion-2706-de-2025.pdf),
// donde cada celda sale en el orden del documento: el código y, a continuación, su descripción
// (que puede ocupar varios renglones) y las notas «Incluye:», «Excluye:» o «Simultáneo:».
// Jerarquía del código: capítulo (NN) → categoría (NN.) → subcategoría (NN.N.) → grupo (NN.N.N.)
// → procedimiento (NN.N.N.NN, la hoja que se usa para codificar).
// Nada se redacta ni se traduce: el texto es el del Ministerio, con los saltos de línea unidos por espacio.
// =============================================================================

import { clean } from './common.mjs';

export const CUPS2025 = {
  resolution: 'Resolución 2706 de 2025',
  officialUrl: 'https://minsalud.gov.co/sites/rid/Lists/BibliotecaDigital/RIDE/DE/DIJ/resolucion-2706-de-2025.pdf',
  version: '2706-2025',
  validFrom: '2026-01-01',
};

const CODE = /^(\d{2}\.\d\.\d\.\d{2}|\d{2}\.\d\.\d\.|\d{2}\.\d\.|\d{2}\.)(?:\s+(.*))?$/;
const HEADER = [
  /^Resolución número\b.*Hoja No\. \d+ de \d+$/,
  /^Continuación de la resolución\b/,
  /^CUPS[”"]$/,
  /^CÓDIGO DESCRIPCIÓN$/,
  /^\d{1,3}$/, // numeración suelta de página
];
/** Un renglón de nota que termina así sigue en el siguiente. */
const CONNECTOR = /(?:\s(?:Y|A|O|E|DE|AL)|,|\()$/;
const NOTE = /^(Incluye|Excluye|Simultáneo):\s*(.*)$/;
const STRUCTURE = /^(Sección|Capítulo) (\d{2}) (.+)$/;

const LEVELS = { 3: 'category', 5: 'subcategory', 7: 'group', 9: 'procedure' };
const levelOf = (code) => LEVELS[code.length];

/** Recorta el texto del Anexo Técnico 2 de todo el documento. */
export function annexTwo(rawText) {
  const start = rawText.indexOf('ANEXO TÉCNICO 2\n');
  const end = rawText.indexOf('ANEXO TÉCNICO 3\n', start);
  if (start < 0 || end < 0) throw new Error('CUPS 2025: no están los límites del Anexo Técnico 2');
  return rawText.slice(start, end);
}

/**
 * @returns {{ rows: object[], chapters: {code:string,name:string}[], sections: {code:string,name:string}[] }}
 *   rows: `{ code, level, display, notes:[{kind,text}], chapter }` en el orden del documento.
 */
export function parseCups2025(rawText) {
  const lines = annexTwo(rawText).split('\n').map((l) => l.trim());
  const rows = [];
  const chapters = [];
  const sections = [];
  let cur = null;
  let note = null;
  let chapter = null;
  const flush = () => {
    if (!cur) return;
    cur.display = clean(cur.nameLines.join(' '));
    delete cur.nameLines;
    rows.push(cur);
    cur = null;
    note = null;
  };
  let previous = '';
  for (const line of lines) {
    if (line === '' || HEADER.some((re) => re.test(line))) continue;
    // Una nota puede citar códigos al inicio de un renglón («… SUBCATEGORÍAS 89.0.2.17 A» / «89.0.2.24 Y 89.0.2.36»):
    // si el renglón anterior de la nota termina en conector, es continuación y no una fila nueva.
    const citesCode = note !== null && CONNECTOR.test(previous);
    previous = line;
    const st = STRUCTURE.exec(line);
    if (st) {
      flush();
      (st[1] === 'Capítulo' ? chapters : sections).push({ code: st[2], name: clean(st[3]) });
      if (st[1] === 'Capítulo') chapter = st[2];
      continue;
    }
    let m = citesCode ? null : CODE.exec(line);
    // «89.0.3.25 - 89.0.3.94»: rango de códigos citado en una nota, no una fila
    if (m && note !== null && /^(?:[-–]|Y|A|O|E)\s*\d{2}\./.test(m[2] ?? '')) m = null;
    if (m) {
      flush();
      cur = { code: m[1], level: levelOf(m[1]), nameLines: m[2] ? [m[2]] : [], notes: [], chapter };
      continue;
    }
    if (!cur) continue; // título del anexo
    const n = NOTE.exec(line);
    if (n) {
      note = { kind: n[1], textLines: n[2] ? [n[2]] : [] };
      cur.notes.push(note);
    } else if (note) note.textLines.push(line);
    else cur.nameLines.push(line);
  }
  flush();
  for (const r of rows) r.notes = r.notes.map((x) => ({ kind: x.kind, text: clean(x.textLines.join(' ')) }));
  return { rows, chapters, sections };
}

/** Comprobaciones de estructura: código único, cada hoja cuelga de un grupo existente, y nombre no vacío. */
export function checkCups2025(rows) {
  const seen = new Set();
  const problems = [];
  for (const r of rows) {
    if (seen.has(r.code)) problems.push(`repetido: ${r.code}`);
    seen.add(r.code);
    if (!r.display) problems.push(`sin descripción: ${r.code}`);
  }
  for (const r of rows) {
    if (r.level === 'procedure' && !seen.has(r.code.slice(0, 7))) problems.push(`sin grupo: ${r.code}`);
  }
  return problems;
}
