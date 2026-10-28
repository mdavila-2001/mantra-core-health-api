// =============================================================================
// Sequence Ontology (CC BY 4.0): tipos de elementos y de variantes de
// secuencia (SO:0001483 SNV, SO:0001059 sequence_alteration, genes, exones…).
// Lee `so.obo` con el lector OBO ya probado de symptoms/lib/obo.mjs. Las
// clases obsoletas no son filas (se cuentan). Sólo los sinónimos EXACT son
// designaciones; el resto queda en la propiedad `synonyms` con su alcance.
// =============================================================================

import { readObo } from '../../symptoms/lib/obo.mjs';
import { cleanProps, designationList, prop, uniq, withProvenance } from './rows.mjs';

function splitXref(x) {
  const i = x.indexOf(':');
  return i < 0 ? x : `${x.slice(0, i)}:${x.slice(i + 1)}`;
}

export async function soRows(path, prov) {
  const terms = new Map();
  const header = await readObo(path, (t) => terms.set(t.id, t));
  const live = new Map([...terms].filter(([id, t]) => !t.obsolete && id.startsWith('SO:')));
  const rows = [];
  for (const t of [...live.values()].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    const exact = t.synonyms.filter((s) => s.scope === 'EXACT').map((s) => s.text);
    const row = {
      codeSystem: 'so',
      code: t.id,
      display: t.name,
      designations: designationList(t.name, exact),
      definition: t.def ? { text: t.def, lang: 'en', refs: t.defRefs } : null,
      properties: cleanProps([
        prop('synonyms', 'json', t.synonyms.map((s) => ({ text: s.text, scope: s.scope, type: s.type, refs: s.refs }))),
        prop('alt_ids', 'json', t.altIds),
        prop('xrefs', 'json', t.xrefs.map((x) => splitXref(x.id))),
        prop('subsets', 'json', t.subsets),
        prop('comment', 'string', t.comment),
        prop('relationships', 'json', t.relationships.map((r) => `${r.pred} ${r.target}`)),
      ]),
      parents: uniq(t.isA.filter((p) => live.has(p))).sort(),
      maps: [],
      relations: [],
    };
    rows.push(withProvenance(row, prov, { source: 'so', sourceUrl: `http://purl.obolibrary.org/obo/${t.id.replace(':', '_')}` }));
  }
  const stats = { terms: terms.size, obsolete: [...terms.values()].filter((t) => t.obsolete).length, rows: rows.length, dataVersion: header.dataVersion };
  return { rows, stats, header };
}
