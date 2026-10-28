// =============================================================================
// ClinVar: SÓLO vocabulario controlado (nunca variantes individuales).
//
//  - `clinvar-terms`: (a) listas controladas de la plantilla oficial de envío
//    (hoja oculta `controlled_list` de SubmissionTemplate.xlsx): tipo de
//    variante, significancia clínica, modo de herencia, origen del alelo,
//    método, cigosidad…; (b) enumeraciones con nombre del esquema público
//    ClinVar_VCV.xsd (estados de revisión, orígenes, cigosidad, tipos de
//    aserción…). ClinVar NO publica códigos para estos valores: el código es
//    `<lista>:<valor>` armado con los textos verbatim (y la lista dice de dónde
//    sale). El `display` es el valor verbatim.
//  - `clinvar-functional`: consecuencias funcionales (SO) y tipos de ensayo
//    funcional (EFO/OBI/FBbi) con el ID que publica ClinVar. Los términos de
//    FENICS (otra fuente, licencia sin verificar) NO se cargan: se cuentan.
// =============================================================================

import { readFileSync } from 'node:fs';
import { readWorkbook } from './xlsx.mjs';
import { cleanProps, designationList, prop, withProvenance } from './rows.mjs';

export const FUNCTIONAL_SOURCE_LOADED = 'Sequence Ontology';

/** Hoja `controlled_list` → [{ sheets, field, required, defaultValue, allowMultiple, values[] }]. */
export function templateLists(path) {
  const sheet = readWorkbook(path).find((s) => s.name === 'controlled_list');
  if (!sheet) throw new Error(`${path}: no tiene la hoja controlled_list`);
  const header = sheet.rows.get(1);
  const expect = ['##sheetname', '#header', '#Requird', '#default_val', '#allow_multiple', '#add_pulldown', '#allowed_values'];
  if (!header || expect.some((h, i) => header.get(i + 1) !== h)) throw new Error(`${path}: encabezado de controlled_list inesperado: ${JSON.stringify([...(header ?? [])])}`);
  const lists = [];
  for (const [r, cols] of [...sheet.rows].sort((a, b) => a[0] - b[0])) {
    if (r === 1) continue;
    const maxCol = Math.max(...cols.keys());
    const values = [];
    for (let c = 7; c <= maxCol; c++) if (cols.has(c)) values.push(cols.get(c));
    lists.push({ sheets: cols.get(1), field: cols.get(2)?.trim(), required: cols.get(3) === 'y', defaultValue: cols.get(4) ?? null, allowMultiple: cols.get(5) === 'y', values });
  }
  return lists.filter((l) => l.values.length > 0);
}

/** `<xs:simpleType name="X">` con `<xs:enumeration value="…"/>` → [{ name, values[] }] (sólo tipos con nombre y enumeración). */
export function xsdEnumerations(text) {
  const out = [];
  for (const m of text.matchAll(/<xs:simpleType\s+name="([^"]+)"[^>]*>([\s\S]*?)<\/xs:simpleType>/g)) {
    const values = [...m[2].matchAll(/<xs:enumeration\s+value="([^"]*)"\s*\/>/g)].map((x) => decodeAttr(x[1]));
    if (values.length) out.push({ name: m[1], values });
  }
  return out;
}
const decodeAttr = (s) => s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

export function clinvarTermRows({ templatePath, xsdPath }, provTemplate, provXsd) {
  const rows = [];
  const seen = new Set();
  const push = (row, prov, source) => {
    const key = `${row.codeSystem}\u0000${row.code}`;
    if (seen.has(key)) throw new Error(`código repetido en clinvar-terms: ${row.code}`);
    seen.add(key);
    rows.push(withProvenance(row, prov, { source }));
  };
  for (const l of templateLists(templatePath)) {
    const listId = `${l.sheets.replace(/,\s*/g, '+')}:${l.field}`;
    l.values.forEach((value, i) => {
      push(
        {
          codeSystem: 'clinvar-terms',
          code: `template:${listId}:${value}`,
          display: value,
          designations: designationList(value, []),
          definition: null,
          properties: cleanProps([
            prop('list_name', 'string', l.field),
            prop('list_kind', 'string', 'lista controlada de la plantilla de envío de ClinVar (SubmissionTemplate.xlsx, hoja oculta controlled_list)'),
            prop('applies_to_sheets', 'json', l.sheets.split(',').map((x) => x.trim())),
            prop('list_position', 'string', String(i + 1)),
            prop('list_required', 'string', l.required ? 'y' : 'n'),
            prop('list_default', 'string', l.defaultValue),
            prop('list_allow_multiple', 'string', l.allowMultiple ? 'y' : 'n'),
          ]),
          parents: [],
          maps: [],
          relations: [],
        },
        provTemplate,
        'clinvar-template',
      );
    });
  }
  for (const e of xsdEnumerations(readFileSync(xsdPath, 'utf8'))) {
    e.values.forEach((value, i) => {
      push(
        {
          codeSystem: 'clinvar-terms',
          code: `xsd:${e.name}:${value}`,
          display: value,
          designations: designationList(value, []),
          definition: null,
          properties: cleanProps([
            prop('list_name', 'string', e.name),
            prop('list_kind', 'string', 'enumeración con nombre del esquema público ClinVar_VCV.xsd'),
            prop('list_position', 'string', String(i + 1)),
          ]),
          parents: [],
          maps: [],
          relations: [],
        },
        provXsd,
        'clinvar-xsd',
      );
    });
  }
  return rows;
}

/** Archivo `Término<TAB>ID[<TAB>Fuente]` precedido de prosa (`#####…`). */
export function parseTermIdFile(text, { withSource }) {
  const lines = text.split(/\r?\n/).filter((l) => l !== '' && !l.startsWith('#'));
  const header = lines.shift().split('\t');
  const expected = withSource ? 3 : 2;
  if (header.length !== expected) throw new Error(`encabezado inesperado: ${header.join(' | ')}`);
  return lines.map((l) => {
    const f = l.split('\t');
    if (f.length !== expected) throw new Error(`fila con ${f.length} campos: ${l}`);
    return { term: f[0], id: f[1], source: withSource ? f[2] : null };
  });
}

export function clinvarFunctionalRows({ consequencesPath, assaysPath }, provConseq, provAssay) {
  const rows = [];
  const stats = { consequences: 0, consequencesLoaded: 0, consequencesNotLoaded: {}, assays: 0 };
  const seen = new Set();
  const push = (row, prov, source) => {
    if (seen.has(row.code)) throw new Error(`ID repetido en clinvar-functional: ${row.code}`);
    seen.add(row.code);
    rows.push(withProvenance(row, prov, { source }));
  };
  for (const r of parseTermIdFile(readFileSync(consequencesPath, 'utf8'), { withSource: true })) {
    stats.consequences++;
    if (r.source !== FUNCTIONAL_SOURCE_LOADED) {
      stats.consequencesNotLoaded[r.source] = (stats.consequencesNotLoaded[r.source] ?? 0) + 1;
      continue;
    }
    stats.consequencesLoaded++;
    push(
      {
        codeSystem: 'clinvar-functional',
        code: r.id,
        display: r.term,
        designations: designationList(r.term, []),
        definition: null,
        properties: cleanProps([prop('functional_kind', 'string', 'consecuencia funcional'), prop('term_source', 'string', r.source)]),
        parents: [],
        maps: [{ system: 'so', code: r.id, context: `ID declarado por ClinVar (functional_consequences.txt, fuente «${r.source}»)` }],
        relations: [],
      },
      provConseq,
      'clinvar-functional-consequences',
    );
  }
  for (const r of parseTermIdFile(readFileSync(assaysPath, 'utf8'), { withSource: false })) {
    stats.assays++;
    push(
      {
        codeSystem: 'clinvar-functional',
        code: r.id,
        display: r.term,
        designations: designationList(r.term, []),
        definition: null,
        properties: cleanProps([prop('functional_kind', 'string', 'tipo de ensayo funcional'), prop('term_source', 'string', 'Experimental Factors Ontology (EFO), según functional_assay_types.txt')]),
        parents: [],
        maps: [],
        relations: [],
      },
      provAssay,
      'clinvar-functional-assay-types',
    );
  }
  return { rows, stats };
}
