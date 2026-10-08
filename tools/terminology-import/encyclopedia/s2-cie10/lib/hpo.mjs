// =============================================================================
// HPO: etiquetas (hp.json), traducción OFICIAL al castellano (hp-es.babelon.tsv)
// y anotaciones enfermedad → fenotipo (phenotype.hpoa).
//
// Reglas: se usan los términos y las anotaciones TAL CUAL (la licencia HPO no
// permite alterarlos); la etiqueta en castellano es solo la oficial
// (`translation_status = OFFICIAL`); sin ella el ítem queda en inglés y
// marcado. No se traduce nada.
// =============================================================================

import { HPO_FREQUENCY_TERMS } from './config.mjs';

/** hp.json (objeto) → {version, labels: Map<'HP:…', etiqueta en inglés>}. */
export function parseHpJson(json) {
  const graph = json.graphs?.[0];
  if (!graph) throw new Error('hp.json sin graphs[0]');
  const labels = new Map();
  for (const n of graph.nodes) {
    const m = n.id?.match(/^http:\/\/purl\.obolibrary\.org\/obo\/HP_(\d+)$/);
    if (m && n.lbl && !n.meta?.deprecated) labels.set(`HP:${m[1]}`, n.lbl);
  }
  return { version: graph.meta?.version?.match(/releases\/([\d-]+)\//)?.[1] ?? null, labels };
}

/** hp-es.babelon.tsv → Map<'HP:…', etiqueta oficial en castellano> (solo `rdfs:label` OFFICIAL). */
export function parseBabelon(tsv) {
  const out = new Map();
  const lines = tsv.split('\n');
  const header = lines[0].split('\t');
  const col = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
  for (const line of lines.slice(1)) {
    if (!line) continue;
    const p = line.split('\t');
    if (p[col.predicate_id] !== 'rdfs:label' || p[col.translation_status]?.trim() !== 'OFFICIAL') continue;
    const value = p[col.translation_value]?.trim();
    if (value) out.set(p[col.subject_id], value);
  }
  return out;
}

/**
 * phenotype.hpoa → Map<databaseId, {P:[…], I:[…], C:[…]}>.
 * Se descartan las filas con calificador `NOT` (el fenotipo está AUSENTE) y las
 * de frecuencia «excluida» (HP:0040285, 0 %).
 */
export function parseHpoa(tsv) {
  const header = { version: tsv.match(/^#version: (\S+)/m)?.[1] ?? null, hpoVersion: tsv.match(/^#hpo-version: (\S+)/m)?.[1] ?? null };
  const out = new Map();
  let col = null;
  for (const line of tsv.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    const p = line.split('\t');
    if (!col) {
      col = Object.fromEntries(p.map((h, i) => [h, i]));
      continue;
    }
    const qualifier = p[col.qualifier];
    const frequency = p[col.frequency] || null;
    if (qualifier === 'NOT') continue;
    if (frequency && HPO_FREQUENCY_TERMS[frequency]?.excluded) continue;
    const aspect = p[col.aspect];
    if (!['P', 'I', 'C'].includes(aspect)) continue;
    const id = p[col.database_id];
    if (!out.has(id)) out.set(id, { P: [], I: [], C: [] });
    out.get(id)[aspect].push({
      hpoId: p[col.hpo_id],
      reference: p[col.reference],
      evidence: p[col.evidence],
      onset: p[col.onset] || null,
      frequency,
      sex: p[col.sex] || null,
      biocuration: p[col.biocuration] || null,
    });
  }
  return { ...header, diseases: out };
}

/**
 * Frecuencia de una anotación → {rank, label}. `label` es SIEMPRE un valor de la
 * fuente: la etiqueta del término de frecuencia, o la fracción/porcentaje tal cual.
 * Sin dato → rank 0 y label null (nunca se estima).
 */
export function frequencyOf(raw, labelOf) {
  if (!raw) return { rank: 0, label: null };
  if (HPO_FREQUENCY_TERMS[raw]) return { rank: HPO_FREQUENCY_TERMS[raw].rank, label: labelOf(raw) };
  const frac = raw.match(/^(\d+)\/(\d+)$/);
  if (frac) return { rank: (100 * Number(frac[1])) / Number(frac[2]), label: `${frac[1]}/${frac[2]}` };
  const pct = raw.match(/^(\d+(?:\.\d+)?)%$/);
  if (pct) return { rank: Number(pct[1]), label: raw };
  return { rank: 0, label: null };
}

/**
 * Anotaciones de fenotipo (aspecto P) → ítems ordenados de más a menos frecuente.
 * Una misma HP puede repetirse con distintas referencias: se conserva la de mayor frecuencia
 * y se acumulan las referencias.
 */
export function phenotypeItems(rows, { esLabels, enLabels }) {
  const byHpo = new Map();
  for (const r of rows) {
    const freq = frequencyOf(r.frequency, (id) => esLabels.get(id) ?? enLabels.get(id) ?? id);
    const cur = byHpo.get(r.hpoId);
    if (!cur) {
      byHpo.set(r.hpoId, { hpoId: r.hpoId, freq, references: [r.reference] });
    } else {
      if (freq.rank > cur.freq.rank) cur.freq = freq;
      if (!cur.references.includes(r.reference)) cur.references.push(r.reference);
    }
  }
  return [...byHpo.values()]
    .map((it) => {
      const es = esLabels.get(it.hpoId) ?? null;
      const en = enLabels.get(it.hpoId) ?? null;
      return { ...it, label: es ?? en, officialSpanish: es != null };
    })
    .filter((it) => it.label)
    .sort((a, b) => b.freq.rank - a.freq.rank || a.label.localeCompare(b.label, 'es') || a.hpoId.localeCompare(b.hpoId));
}
