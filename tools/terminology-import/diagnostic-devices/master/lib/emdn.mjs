// =============================================================================
// EMDN completa (archivo publicado por la Comisión Europea: CATEGORY,
// CATEGORY DESCRIPTION, CODE, TERM, LEVEL, TERMINAL LEVEL YES/NO) → nodos de
// la taxonomía `emdn`.
//
// Criterio de «diagnóstico», en el mismo espíritu que las subpartes del 21 CFR:
// el título publicado de un **grupo** (nodo no terminal) de la jerarquía.
//   1. Categoría W («IN VITRO DIAGNOSTIC MEDICAL DEVICES») → IVD.
//   2. Un grupo cuyo título declara solo diagnóstico o monitoreo (DIAGNOS…,
//      MONITOR…) → diagnóstico, y lo heredan sus descendientes.
//   3. Un grupo cuyo título mezcla diagnóstico con terapia, intervención,
//      soporte o cirugía («DIAGNOSTIC AND INTERVENTIONAL RADIOLOGY…») → sin
//      decisión (`emdn-group-title-mixed`), igual que sus descendientes salvo
//      que un subgrupo propio decida.
//   4. Los términos terminales no deciden por su nombre: solo heredan.
//   5. Todo lo demás queda `null`: puede decidirse después por un mapeo
//      publicado.
// =============================================================================

import { parseCsv } from './own-sources.mjs';
import { emdnParent } from './taxonomy.mjs';

export const EMDN_COLUMNS = Object.freeze([
  'CATEGORY',
  'CATEGORY DESCRIPTION',
  'CODE',
  'TERM',
  'LEVEL',
  'TERMINAL LEVEL YES/NO',
]);

const DX_TITLE = /\b(DIAGNOS\w*|RADIODIAGNOST\w*|MONITOR\w*)\b/;
const NON_DX_PURPOSE =
  /\b(THERAP\w*|TREATMENT\w*|INTERVENTION\w*|SUPPORT\w*|SURGER\w*|SURGICAL|PHYSIOTHERAP\w*|REHABILITATION)\b/;

/** Lee el CSV (con BOM y cabeceras con espacios finales, tal como se publica). */
export function parseEmdn(text) {
  return rowsFromTable(parseCsv(text.replace(/^\uFEFF/, '')));
}

function rowsFromTable(table) {
  const header = table[0].map((h) => h.trim());
  const missing = EMDN_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length)
    throw new Error(`EMDN: faltan columnas ${missing.join(', ')}`);
  const col = Object.fromEntries(header.map((h, i) => [h, i]));
  const rows = [];
  for (let i = 1; i < table.length; i++) {
    const r = table[i];
    const code = (r[col.CODE] ?? '').trim();
    if (!code) continue;
    rows.push({
      category: (r[col.CATEGORY] ?? '').trim(),
      categoryDescription: (r[col['CATEGORY DESCRIPTION']] ?? '').trim(),
      code,
      term: (r[col.TERM] ?? '').trim(),
      level: Number((r[col.LEVEL] ?? '').trim()),
      terminal:
        (r[col['TERMINAL LEVEL YES/NO']] ?? '').trim().toUpperCase() === 'YES',
    });
  }
  return rows;
}

/** Decisión propia de un grupo por su título (o null si el título no decide). */
export function emdnGroupTitleDecision(term) {
  const t = term.toUpperCase();
  if (!DX_TITLE.test(t)) return null;
  return NON_DX_PURPOSE.test(t)
    ? { diagnostic: null, basis: 'emdn-group-title-mixed' }
    : { diagnostic: true, branch: 'diagnostic', basis: 'emdn-group-title' };
}

/**
 * Filas EMDN → nodos de taxonomía con su decisión. Verifica la estructura: el
 * nivel publicado tiene que coincidir con la longitud del código y el padre
 * estructural tiene que existir en el archivo.
 */
export function emdnNodes(rows, provenance) {
  const byCode = new Map(rows.map((r) => [r.code, r]));
  const problems = [];
  for (const r of rows) {
    const expected = r.code.length === 1 ? 1 : 1 + (r.code.length - 1) / 2;
    if (expected !== r.level)
      problems.push(`${r.code}: nivel ${r.level} ≠ ${expected}`);
    const p = emdnParent(r.code);
    if (r.level > 1 && (!p || !byCode.has(p)))
      problems.push(`${r.code}: sin padre ${p}`);
  }
  const decisionCache = new Map();
  const decide = (code) => {
    if (decisionCache.has(code)) return decisionCache.get(code);
    const r = byCode.get(code);
    let d;
    if (code.startsWith('W'))
      d = { diagnostic: true, branch: 'ivd', basis: 'emdn-category-w' };
    else {
      const own = r && !r.terminal ? emdnGroupTitleDecision(r.term) : null;
      const parent = emdnParent(code);
      const inherited = parent ? decide(parent) : null;
      if (own) d = own;
      else if (
        inherited &&
        inherited.basis !== null &&
        inherited.basis !== undefined
      ) {
        d = {
          ...inherited,
          basis: inherited.basis.startsWith('emdn-group-title')
            ? `${inherited.basis.replace(/-inherited$/, '')}-inherited`
            : inherited.basis,
        };
      } else d = { diagnostic: null, branch: null, basis: null };
    }
    decisionCache.set(code, d);
    return d;
  };
  const nodes = rows.map((r) => {
    const d = decide(r.code);
    return {
      system: 'emdn',
      code: r.code,
      name: r.term,
      definition: null,
      parent: emdnParent(r.code),
      diagnostic: d.diagnostic ?? null,
      branch: d.diagnostic ? (d.branch ?? null) : null,
      basis: d.basis ?? null,
      attributes: {
        category: r.category,
        categoryDescription: r.categoryDescription,
        level: r.level,
        terminal: r.terminal,
      },
      provenance: { ...provenance, sourceRecordId: r.code },
    };
  });
  return { nodes, problems };
}

/**
 * Copia separada por tabuladores (primera línea «EMDN V2», campos entre
 * comillas que pueden traer saltos de línea). Devuelve las mismas filas que
 * `parseEmdn`.
 */
export function parseEmdnTsv(text) {
  const body = text.replace(/^\uFEFF/, '');
  const start = body.search(/^CATEGORY\s*\t/m);
  if (start < 0) throw new Error('EMDN (tsv): sin cabecera');
  const table = parseCsv(body.slice(start), '\t');
  return rowsFromTable(table);
}

/** Compara dos copias: códigos que faltan en cada una y diferencias de término/nivel. */
export function compareEmdnCopies(a, b) {
  const ma = new Map(a.map((r) => [r.code, r]));
  const mb = new Map(b.map((r) => [r.code, r]));
  const onlyA = [...ma.keys()].filter((k) => !mb.has(k));
  const onlyB = [...mb.keys()].filter((k) => !ma.has(k));
  const differ = [...ma.keys()].filter(
    (k) =>
      mb.has(k) &&
      (ma.get(k).term !== mb.get(k).term ||
        ma.get(k).level !== mb.get(k).level),
  );
  return { rowsA: a.length, rowsB: b.length, onlyA, onlyB, differ };
}
