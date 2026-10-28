// =============================================================================
// Cruces por CUI de UMLS publicados por NCBI MedGen (`MGCONSO.RRF.gz`).
//
// MedGen asigna a cada concepto un CUI y lista, por fuente (SAB), los códigos
// que lo componen. Si HPO, MeSH, NCIt (o SYMP, que declara su propio CUI) caen
// en el MISMO CUI, MedGen/UMLS los está publicando como el mismo concepto. Se
// guarda sólo el CUI y los códigos de las fuentes que YA están en el corpus;
// de MGCONSO no se toma ningún texto (hay nombres de SNOMED CT, MedDRA, CPT…
// que tienen licencia).
// =============================================================================

import { createHash } from 'node:crypto';

/** SAB de MGCONSO → code system del corpus. */
export const SAB_TO_SYSTEM = { HPO: 'hpo', MSH: 'mesh-c23', NCI: 'ncit' };
/** Orden fijo de los sistemas: cada par se escribe una sola vez, (menor, mayor). */
const ORDER = ['hpo', 'mesh-c23', 'ncit', 'symp'];

const md5 = (parts) => createHash('md5').update(parts.join('|'), 'utf8').digest('hex');

/**
 * @param text       contenido de MGCONSO.RRF (descomprimido)
 * @param codes      { hpo:Set, 'mesh-c23':Set, ncit:Set } códigos del corpus
 * @param sympByCui  Map CUI → código SYMP (el CUI que declara SYMP.obo, UMLS_CUI)
 * @param declared   Set de pares ya declarados por xref de la fuente (`a|b`), para marcarlos
 */
export function medgenLinks(text, codes, sympByCui, declared, prov) {
  const byCui = new Map();
  const stats = { lines: 0, kept: 0, bySab: {} };
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    stats.lines++;
    const f = line.split('|');
    const system = SAB_TO_SYSTEM[f[8]];
    if (!system || !codes[system]?.has(f[10])) continue;
    stats.kept++;
    stats.bySab[f[8]] = (stats.bySab[f[8]] ?? 0) + 1;
    if (!byCui.has(f[0])) byCui.set(f[0], new Map());
    byCui.get(f[0]).set(`${system}|${f[10]}`, { codeSystem: system, code: f[10] });
  }
  for (const [cui, symp] of sympByCui) {
    if (!byCui.has(cui)) continue; // sólo CUI que MedGen también publica
    byCui.get(cui).set(`symp|${symp}`, { codeSystem: 'symp', code: symp, viaOwnXref: true });
  }
  const rows = [];
  for (const [cui, members] of [...byCui].sort((a, b) => a[0].localeCompare(b[0]))) {
    const list = [...members.values()].sort((x, y) => ORDER.indexOf(x.codeSystem) - ORDER.indexOf(y.codeSystem) || x.code.localeCompare(y.code));
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        if (a.codeSystem === b.codeSystem) continue;
        rows.push({
          source: 'medgen-cui',
          cui,
          a: { codeSystem: a.codeSystem, code: a.code },
          b: { codeSystem: b.codeSystem, code: b.code },
          via: a.viaOwnXref || b.viaOwnXref ? 'medgen+symp-xref' : 'medgen',
          alsoDeclaredByXref: declared.has(`${a.codeSystem}:${a.code}|${b.codeSystem}:${b.code}`),
          version: prov.version,
          retrievedAt: prov.retrievedAt,
          license: prov.license,
          inputSha256: prov.sha256 ?? null,
          key: md5(['medgen-cui', cui, a.codeSystem, a.code, b.codeSystem, b.code]),
        });
      }
    }
  }
  return { rows, stats: { ...stats, cuisWithAnyCorpusCode: byCui.size, pairs: rows.length, alsoDeclaredByXref: rows.filter((r) => r.alsoDeclaredByXref).length } };
}

/** Pares que las propias fuentes ya cruzan por xref (hoy: HPO → NCIT, y SYMP → MESH). */
export function xrefDeclaredPairs(rowsBySystem) {
  const out = new Set();
  for (const rows of Object.values(rowsBySystem)) {
    for (const r of rows) {
      for (const x of r.xrefs ?? []) {
        const target = x.system === 'NCIT' ? 'ncit' : x.system === 'MESH' ? 'mesh-c23' : null;
        if (!target) continue;
        const pair = [`${r.codeSystem}:${r.code}`, `${target}:${x.code}`].sort((p, q) => ORDER.indexOf(p.split(':')[0]) - ORDER.indexOf(q.split(':')[0]));
        out.add(pair.join('|'));
      }
    }
  }
  return out;
}
