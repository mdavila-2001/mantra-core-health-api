// =============================================================================
// Metainventario de abreviaturas médicas (CSV `|`) → filas del corpus.
//
// La unidad es el SENTIDO (`GroupID`): una sigla con una expansión, armonizada
// entre los ocho inventarios de origen. display = expansión (LF), designaciones
// = la sigla (SF) y las variantes de escritura que la fuente agrupó. Nada se
// infiere: si la fuente no agrupó dos registros, son dos sentidos.
// =============================================================================

import { provenance } from './terms.mjs';

const COLUMNS = ['GroupID', 'RecordID', 'SF', 'SFUI', 'NormSF', 'LF', 'LFUI', 'NormLF', 'Source', 'Modified'];

export function parseMetainventory(text) {
  const lines = text.split(/\r?\n/).filter((l) => l !== '');
  const header = lines[0].split('|');
  if (COLUMNS.some((c, i) => header[i] !== c)) throw new Error(`Metainventario: cabecera inesperada «${lines[0]}»`);
  return lines.slice(1).map((l) => {
    const v = l.split('|');
    return Object.fromEntries(COLUMNS.map((c, i) => [c, v[i] ?? '']));
  });
}

/** Registros → filas por sentido. `clinicalOnly` deja sólo sentidos con un registro de inventario clínico. */
export function abbreviationRows(records, source, file, { clinicalOnly } = {}) {
  const byGroup = new Map();
  for (const r of records) {
    if (!byGroup.has(r.GroupID)) byGroup.set(r.GroupID, []);
    byGroup.get(r.GroupID).push(r);
  }
  const clinical = new Set(source.clinicalSources);
  const stats = { records: records.length, groups: byGroup.size, rows: 0, literatureOnly: 0 };
  const rows = [];
  for (const [group, recs] of [...byGroup].sort((a, b) => a[0].localeCompare(b[0]))) {
    const sources = [...new Set(recs.map((r) => r.Source))].sort();
    const isClinical = sources.some((s) => clinical.has(s));
    if (!isClinical) stats.literatureOnly++;
    if (clinicalOnly && !isClinical) continue;
    // La expansión más frecuente del grupo; empate → la primera en orden de RecordID.
    const lfCount = new Map();
    for (const r of recs) lfCount.set(r.LF, (lfCount.get(r.LF) ?? 0) + 1);
    const display = [...lfCount].sort((a, b) => b[1] - a[1])[0][0];
    const variants = [...new Set([...recs.map((r) => r.SF), ...recs.map((r) => r.LF)])].filter((v) => v && v !== display);
    rows.push({
      key: `${source.codeSystem}|${group}`,
      codeSystem: source.codeSystem,
      code: group,
      domain: source.domain,
      lang: 'en',
      display,
      definition: null,
      definitionXrefs: [],
      synonymsExact: variants,
      synonymsOther: [],
      xrefs: [],
      subsets: sources.map((s) => (clinical.has(s) ? `clinical:${s}` : `literature:${s}`)),
      namespace: isClinical ? 'clinical' : 'literature',
      altIds: [],
      relations: [],
      otherRelations: [],
      extra: {
        shortForms: [...new Set(recs.map((r) => r.SF))],
        records: recs.map((r) => ({ recordId: r.RecordID, sf: r.SF, sfui: r.SFUI || null, lf: r.LF, lfui: r.LFUI || null, source: r.Source, modified: r.Modified || null })),
      },
      provenance: provenance(source, group, { file }),
    });
  }
  stats.rows = rows.length;
  return { rows, stats };
}
