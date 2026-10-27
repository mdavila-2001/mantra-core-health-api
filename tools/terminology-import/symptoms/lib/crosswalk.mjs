// =============================================================================
// Identidad entre fuentes, SÓLO por cruce publicado (nunca por nombre).
//
// - Enfermedades: Mondo declara `xref: <PREFIJO>:<id> {source="MONDO:equivalentTo"}`
//   hacia OMIM, Orphanet, DOID, MeSH, DECIPHER… Dos códigos de enfermedad son la
//   misma cuando Mondo los declara equivalentes al mismo MONDO id.
// - Términos: un xref declarado por la fuente (HPO → NCIT:Cxxxx) o el mismo
//   UMLS CUI declarado por las dos (SYMP `UMLS_CUI`, NCIt `P207`).
// =============================================================================

/** Prefijos de Mondo → prefijo con que los escriben las anotaciones. */
const MONDO_PREFIX = { Orphanet: 'ORPHA', OMIM: 'OMIM', OMIMPS: 'OMIMPS', DOID: 'DOID', MESH: 'MESH', DECIPHER: 'DECIPHER', NCIT: 'NCIT', ICD10CM: 'ICD10CM', ICD10WHO: 'ICD10WHO', 'icd11.foundation': 'ICD11F', UMLS: 'UMLS' };

/**
 * Código de enfermedad con el prefijo de las anotaciones de HPO. El KG de
 * Monarch escribe `Orphanet:558` donde HPOA escribe `ORPHA:558`: mismo
 * identificador de Orphanet, distinto prefijo.
 */
export function normalizeDiseaseCurie(curie) {
  const i = curie.indexOf(':');
  if (i < 0) return curie;
  const prefix = MONDO_PREFIX[curie.slice(0, i)] ?? curie.slice(0, i);
  return `${prefix}:${curie.slice(i + 1)}`;
}

/** Mondo → { toMondo: Map(curie → MONDO id), mondoXrefs: Map(MONDO id → [curie]) }. */
export function mondoEquivalences(terms) {
  const toMondo = new Map();
  const mondoXrefs = new Map();
  for (const t of terms.values()) {
    if (t.obsolete || !t.id.startsWith('MONDO:')) continue;
    const list = [];
    for (const x of t.xrefs) {
      if (!x.qualifiers?.includes('MONDO:equivalentTo')) continue;
      const i = x.id.indexOf(':');
      const prefix = MONDO_PREFIX[x.id.slice(0, i)];
      if (!prefix) continue;
      const curie = `${prefix}:${x.id.slice(i + 1)}`;
      list.push(curie);
      if (!toMondo.has(curie)) toMondo.set(curie, t.id);
    }
    toMondo.set(t.id, t.id);
    mondoXrefs.set(t.id, list.sort());
  }
  return { toMondo, mondoXrefs };
}

/** Clave de identidad de una enfermedad: su MONDO id si Mondo la declara equivalente; si no, su propio código. */
export const diseaseIdentity = (curie, toMondo) => toMondo.get(curie) ?? curie;

/**
 * Términos de un sistema nuevo que YA están representados por uno anterior,
 * por xref declarado o CUI compartido. Devuelve Map(código nuevo → evidencia).
 */
export function termOverlaps(newRows, previousRows) {
  const prevKeys = new Map();
  const put = (k, v) => { if (!prevKeys.has(k)) prevKeys.set(k, v); };
  for (const r of previousRows) {
    put(`${r.codeSystem}:${r.code}`, `${r.codeSystem}:${r.code}`);
    for (const x of r.xrefs ?? []) {
      if (x.system === 'NCIT') put(`ncit:${x.code}`, `${r.codeSystem}:${r.code} xref NCIT:${x.code}`);
      if (x.system === 'MESH') put(`mesh-c23:${x.code}`, `${r.codeSystem}:${r.code} xref MESH:${x.code}`);
      if (x.system === 'UMLS' || x.system === 'UMLS_CUI') put(`umls:${x.code}`, `${r.codeSystem}:${r.code} UMLS ${x.code}`);
    }
  }
  const out = new Map();
  for (const r of newRows) {
    const keys = [`${r.codeSystem}:${r.code}`];
    for (const x of r.xrefs ?? []) {
      if (x.system === 'UMLS' || x.system === 'UMLS_CUI') keys.push(`umls:${x.code}`);
      if (x.system === 'HP' || x.system === 'HPO') keys.push(`hpo:${x.code.startsWith('HP:') ? x.code : `HP:${x.code}`}`);
    }
    for (const k of keys) {
      const hit = prevKeys.get(k);
      if (hit) {
        out.set(r.code, hit);
        break;
      }
    }
  }
  return out;
}
