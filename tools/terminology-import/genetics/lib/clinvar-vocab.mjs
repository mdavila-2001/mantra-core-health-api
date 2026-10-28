// =============================================================================
// ClinVar: SÓLO vocabulario controlado (nunca variantes individuales).
//
//  - `clinvar-terms`: (a) listas controladas de las plantillas oficiales de envío
//    (hoja oculta `controlled_list` de SubmissionTemplate, …Lite, …Somatic y …FunctionalData): tipo de
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

/**
 * Hoja `controlled_list` → [{ sheets, field, required, defaultValue, allowMultiple, values[] }].
 * Dos formatos reales: el de las plantillas completas (encabezado `##sheetname`, `#header`, … y una lista por
 * fila) y el de `SubmissionTemplateLite.xlsx` (una sola fila: nombre de la lista y sus valores en las celdas
 * siguientes; el archivo no dice a qué hoja se aplica).
 */
export function templateLists(path) {
  const sheet = readWorkbook(path).find((s) => s.name === 'controlled_list');
  if (!sheet) throw new Error(`${path}: no tiene la hoja controlled_list`);
  const header = sheet.rows.get(1);
  if (header && sheet.rows.size === 1 && !String(header.get(1)).startsWith('##')) {
    const maxCol = Math.max(...header.keys());
    const values = [];
    for (let c = 2; c <= maxCol; c++) if (header.has(c)) values.push(header.get(c));
    return [{ sheets: '', field: header.get(1).trim(), required: false, defaultValue: null, allowMultiple: false, values }];
  }
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

const minIso = (xs) => [...xs].sort()[0];

/**
 * Términos de las plantillas (`templates` = [{ name, path, prov }]) y del XSD. Un mismo valor de una misma lista
 * (`<hojas>:<campo>:<valor>`) que aparece en varias plantillas es UN concepto; sus plantillas, posiciones y
 * archivos de entrada (versión y SHA-256) quedan en la fila.
 */
export function clinvarTermRows({ templates, xsdPath }, provXsd) {
  const byCode = new Map();
  for (const t of templates) {
    for (const l of templateLists(t.path)) {
      const listId = l.sheets ? `${l.sheets.replace(/,\s*/g, '+')}:${l.field}` : l.field;
      const seenInList = new Set();
      l.values.forEach((value, i) => {
        const code = `template:${listId}:${value}`;
        if (seenInList.has(code)) throw new Error(`${t.name}: valor repetido en la lista ${listId}: ${value}`);
        seenInList.add(code);
        if (!byCode.has(code)) byCode.set(code, { value, listId, field: l.field, templates: [] });
        byCode.get(code).templates.push({ template: t.name, sheets: l.sheets ? l.sheets.split(',').map((x) => x.trim()) : [], position: i + 1, required: l.required ? 'y' : 'n', default: l.defaultValue, allow_multiple: l.allowMultiple ? 'y' : 'n', version: t.prov.version, sha256: t.prov.sourceSha256, prov: t.prov });
      });
    }
  }
  const rows = [];
  for (const [code, e] of byCode) {
    const provs = e.templates.map((x) => x.prov);
    const merged = {
      version: [...new Set(provs.map((p) => p.version))].sort().join(' + '),
      retrievedAt: minIso(provs.map((p) => p.retrievedAt)),
      sourceSha256: provs.map((p) => p.sourceSha256).join(' '),
      license: provs[0].license,
      sourceUrl: provs.map((p) => p.sourceUrl).join(' '),
    };
    rows.push(
      withProvenance(
        {
          codeSystem: 'clinvar-terms',
          code,
          display: e.value,
          designations: designationList(e.value, []),
          definition: null,
          properties: cleanProps([
            prop('list_name', 'string', e.field),
            prop('list_kind', 'string', 'lista controlada de una plantilla de envío de ClinVar (hoja oculta controlled_list)'),
            prop('templates', 'json', e.templates.map(({ prov, ...x }) => x)),
          ]),
          parents: [],
          maps: [],
          relations: [],
        },
        merged,
        { source: 'clinvar-template' },
      ),
    );
  }
  const seen = new Set(rows.map((r) => r.code));
  for (const e of xsdEnumerations(readFileSync(xsdPath, 'utf8'))) {
    e.values.forEach((value, i) => {
      const code = `xsd:${e.name}:${value}`;
      if (seen.has(code)) throw new Error(`código repetido en clinvar-terms: ${code}`);
      seen.add(code);
      rows.push(
        withProvenance(
          {
            codeSystem: 'clinvar-terms',
            code,
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
          { source: 'clinvar-xsd' },
        ),
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
        maps: [{ system: 'sequence-ontology', code: r.id, context: `ID declarado por ClinVar (functional_consequences.txt, fuente «${r.source}»)` }],
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

/** Categorías de condición de `disease_names` (columna Category) como lista de valores. ClinVar no las define en el archivo. */
export function clinvarCategoryRows(categories, prov) {
  return [...categories].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([value, count], i) =>
    withProvenance(
      {
        codeSystem: 'clinvar-terms',
        code: `disease_names:Category:${value}`,
        display: value,
        designations: designationList(value, []),
        definition: null,
        properties: cleanProps([
          prop('list_name', 'string', 'Category'),
          prop('list_kind', 'string', 'valores distintos de la columna Category del archivo disease_names de ClinVar; el archivo no define cada valor'),
          prop('list_position', 'string', String(i + 1)),
          prop('occurrences_in_file', 'string', String(count)),
        ]),
        parents: [],
        maps: [],
        relations: [],
      },
      prov,
      { source: 'clinvar-disease-names' },
    ),
  );
}
