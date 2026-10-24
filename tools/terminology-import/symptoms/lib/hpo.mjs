// =============================================================================
// Human Phenotype Ontology → filas del corpus de síntomas.
//
// Entrada: `hp.json` (obographs de la release) + `hp-es.babelon.tsv` (traducción
// oficial al castellano del HPO Translation Project). Puro: recibe el JSON ya
// parseado y el TSV como texto.
//
// - Un término por clase HP no obsoleta (todas las subontologías: anomalía
//   fenotípica, modo de herencia, modificador clínico, frecuencia…; las
//   anotaciones de enfermedad usan las de frecuencia, inicio y modificador).
// - Nombre en castellano SÓLO si la traducción figura con estado `OFFICIAL`.
//   Si no hay, `esName = null`: nunca se traduce por cuenta propia.
// - Definición y sinónimos en inglés, verbatim, con su alcance.
// - `systems`: los ancestros de primer nivel (hijos directos de la raíz de su
//   subontología), que dan la jerarquía sistema/órgano → tipo → término.
// =============================================================================

const OBO = 'http://purl.obolibrary.org/obo/';
const SYN_SCOPE = { hasExactSynonym: 'EXACT', hasRelatedSynonym: 'RELATED', hasBroadSynonym: 'BROAD', hasNarrowSynonym: 'NARROW' };

/** `http://purl.obolibrary.org/obo/HP_0001250` → `HP:0001250`. */
export function curie(uri) {
  if (!uri?.startsWith(OBO)) return null;
  const local = uri.slice(OBO.length);
  const i = local.indexOf('_');
  return i < 0 ? null : `${local.slice(0, i)}:${local.slice(i + 1)}`;
}

/** Raíces de las subontologías de HPO (hijos de HP:0000001 «All»). */
export const HPO_ROOT = 'HP:0000001';
export const HPO_PHENOTYPIC_ABNORMALITY = 'HP:0000118';

/** Traducciones oficiales: HP id → etiqueta ES. Ignora otros estados y predicados. */
export function parseBabelon(tsv) {
  const lines = tsv.split('\n').filter((l) => l.trim() !== '');
  const head = lines[0].split('\t');
  const col = (name) => {
    const i = head.indexOf(name);
    if (i < 0) throw new Error(`babelon sin columna ${name}`);
    return i;
  };
  const [cSubject, cPred, cValue, cStatus, cLang] = ['subject_id', 'predicate_id', 'translation_value', 'translation_status', 'translation_language'].map(col);
  const out = new Map();
  const stats = { rows: lines.length - 1, official: 0, otherStatus: 0 };
  for (const line of lines.slice(1)) {
    const f = line.split('\t');
    if (f[cLang] !== 'es' || f[cPred] !== 'rdfs:label') continue;
    if (f[cStatus] !== 'OFFICIAL') {
      stats.otherStatus++;
      continue;
    }
    const value = f[cValue]?.trim();
    if (!value) continue;
    out.set(f[cSubject], value);
    stats.official++;
  }
  return { labels: out, stats };
}

/** obographs → mapa id → término crudo (sólo clases HP). */
export function hpoTerms(graphJson) {
  const g = graphJson.graphs[0];
  const terms = new Map();
  for (const n of g.nodes) {
    if (n.type !== 'CLASS') continue;
    const id = curie(n.id);
    if (!id?.startsWith('HP:')) continue;
    const m = n.meta ?? {};
    const bpv = m.basicPropertyValues ?? [];
    terms.set(id, {
      id,
      name: n.lbl ?? null,
      def: m.definition?.val ?? null,
      defRefs: m.definition?.xrefs ?? [],
      comments: m.comments ?? [],
      synonyms: (m.synonyms ?? []).map((s) => ({ text: s.val, scope: SYN_SCOPE[s.pred] ?? 'RELATED', type: s.synonymType ? s.synonymType.split('#').pop() : null })),
      xrefs: (m.xrefs ?? []).map((x) => x.val),
      altIds: bpv.filter((p) => p.pred.endsWith('#hasAlternativeId')).map((p) => p.val),
      replacedBy: bpv.filter((p) => p.pred.endsWith('IAO_0100001')).map((p) => curie(p.val) ?? p.val),
      subsets: (m.subsets ?? []).map((s) => s.split('#').pop()),
      obsolete: m.deprecated === true,
      isA: [],
    });
  }
  for (const e of g.edges) {
    if (e.pred !== 'is_a') continue;
    const s = curie(e.sub);
    const o = curie(e.obj);
    if (terms.has(s) && o?.startsWith('HP:')) terms.get(s).isA.push(o);
  }
  for (const t of terms.values()) t.isA.sort();
  const meta = g.meta?.basicPropertyValues ?? [];
  const version = meta.find((p) => p.pred.endsWith('#versionInfo'))?.val ?? g.meta?.version?.match(/releases\/([^/]+)\//)?.[1] ?? null;
  return { terms, version, versionIri: g.meta?.version ?? null };
}

/**
 * Ancestros de primer nivel de cada término: los hijos directos de la raíz de
 * su subontología (p. ej. «Abnormality of the nervous system» bajo
 * «Phenotypic abnormality»). Memoizado; tolera multiherencia.
 */
export function topLevelSystems(terms) {
  const subRoots = new Set([...terms.values()].filter((t) => t.isA.includes(HPO_ROOT)).map((t) => t.id));
  const firstLevel = new Set([...terms.values()].filter((t) => t.isA.some((p) => subRoots.has(p))).map((t) => t.id));
  const memo = new Map();
  const visit = (id, stack = new Set()) => {
    if (memo.has(id)) return memo.get(id);
    if (stack.has(id)) return new Set();
    stack.add(id);
    const out = new Set();
    if (firstLevel.has(id)) out.add(id);
    else for (const p of terms.get(id)?.isA ?? []) for (const x of visit(p, stack)) out.add(x);
    stack.delete(id);
    memo.set(id, out);
    return out;
  };
  const result = new Map();
  for (const id of terms.keys()) result.set(id, [...visit(id)].sort());
  return { systems: result, subRoots, firstLevel };
}

/** Prefijo normalizado de un xref de HPO (`ICD-10:R51` → { system: 'ICD-10', code: 'R51' }). */
export function splitXref(x) {
  const i = x.indexOf(':');
  if (i < 0) return null;
  return { system: x.slice(0, i), code: x.slice(i + 1) };
}

/**
 * Filas del corpus. `provenance` = { version, uri, retrievedAt, license }.
 * Las clases obsoletas no son filas: su id queda como `altIds`/`replacedBy`
 * del término vigente que la fuente declara.
 */
export function hpoRows(graphJson, babelonTsv, provenance) {
  const { terms, version } = hpoTerms(graphJson);
  const { labels, stats: esStats } = parseBabelon(babelonTsv);
  const { systems, subRoots } = topLevelSystems(terms);
  const rows = [];
  let obsolete = 0;
  for (const t of [...terms.values()].sort((a, b) => a.id.localeCompare(b.id))) {
    if (t.obsolete) {
      obsolete++;
      continue;
    }
    const subontology = subRoots.has(t.id) ? t.id : ancestorIn(t.id, terms, subRoots);
    rows.push({
      codeSystem: 'hpo',
      code: t.id,
      enName: t.name,
      esName: labels.get(t.id) ?? null,
      esNameKind: labels.has(t.id) ? 'official-translation' : null,
      definition: t.def,
      definitionLang: t.def ? 'en' : null,
      definitionRefs: t.defRefs,
      synonyms: t.synonyms.map((s) => ({ ...s, lang: 'en' })),
      parents: t.isA,
      systems: systems.get(t.id) ?? [],
      subontology,
      altIds: t.altIds,
      xrefs: t.xrefs.map(splitXref).filter(Boolean),
      subsets: t.subsets,
      comments: t.comments,
      sourceRecordId: t.id,
      sourceUri: `https://hpo.jax.org/browse/term/${t.id}`,
      version: version ?? provenance.version,
      retrievedAt: provenance.retrievedAt,
      license: provenance.license,
      source: 'hpo',
    });
  }
  const withEs = rows.filter((r) => r.esName).length;
  return { rows, version, stats: { classes: terms.size, obsolete, terms: rows.length, withOfficialSpanish: withEs, babelon: esStats } };
}

function ancestorIn(id, terms, set, seen = new Set()) {
  if (seen.has(id)) return null;
  seen.add(id);
  for (const p of terms.get(id)?.isA ?? []) {
    if (set.has(p)) return p;
    const a = ancestorIn(p, terms, set, seen);
    if (a) return a;
  }
  return null;
}

/**
 * Índice id vigente ← id alternativo/obsoleto, para resolver anotaciones viejas
 * (las de enfermedades comunes son de 2015) sin adivinar: sólo `alt_id` y
 * `replaced_by` declarados por HPO.
 */
export function hpoIdResolver(graphJson) {
  const { terms } = hpoTerms(graphJson);
  const map = new Map();
  for (const t of terms.values()) {
    if (!t.obsolete) {
      map.set(t.id, { id: t.id, via: null });
      for (const a of t.altIds) if (!map.has(a)) map.set(a, { id: t.id, via: 'alt_id' });
    }
  }
  for (const t of terms.values()) {
    if (t.obsolete && t.replacedBy.length === 1 && !map.has(t.id)) {
      const target = map.get(t.replacedBy[0]);
      if (target) map.set(t.id, { id: target.id, via: 'replaced_by' });
    }
  }
  return (id) => map.get(id) ?? null;
}
