// =============================================================================
// Symptom Ontology (SYMP) y NCI Thesaurus (subconjunto de signos y síntomas)
// → filas del corpus. Reciben términos ya leídos con `obo.mjs`.
//
// NCIt es un tesauro general (≈190 000 conceptos). Entra sólo lo que el propio
// NCIt clasifica como signo, síntoma o hallazgo de examen físico:
//   - descendientes de C100104 «Sign or Symptom», C176707 y C83119
//     «Physical Examination Finding»;
//   - todo concepto cuyo tipo semántico declarado (P106) sea «Sign or Symptom»;
//   - hallazgos clínicos: descendientes de C36278 «Finding by Site or System»
//     cuyo tipo semántico sea «Finding» o «Sign or Symptom» (quedan fuera los
//     que NCIt tipa como resultado de laboratorio, enfermedad o neoplasia).
// Quedan fuera los descendientes de C2991 «Disease or Disorder» (NCIt es
// polijerárquico: en 26.02d «Erectile Dysfunction» es signo y también enfermedad): los carga la sesión
// `seed-diseases` como code system `ncit-disease` y no se duplican.
// El criterio sale de la fuente; no se elige concepto por concepto. Cada fila
// dice por qué regla entró (`scopeRule`).
// =============================================================================

import { childrenIndex, descendants } from './obo.mjs';

export const NCIT_ROOTS = ['NCIT:C100104', 'NCIT:C176707', 'NCIT:C83119'];
export const NCIT_SEMANTIC_TYPE = 'Sign or Symptom';
export const NCIT_FINDING_ROOT = 'NCIT:C36278';
export const NCIT_FINDING_TYPES = ['Finding', 'Sign or Symptom'];
export const NCIT_DISEASE_ROOT = 'NCIT:C2991';

const stringPv = (term, prop) =>
  term.propertyValues
    .map((pv) => pv.match(new RegExp(`^${prop.replace(':', '\\:')} "((?:[^"\\\\]|\\\\.)*)"`))?.[1])
    .filter(Boolean);

/** Sinónimos sin repetidos (NCIt repite el mismo texto por cada fuente que lo aporta). */
export function uniqueSynonyms(term) {
  const seen = new Set([term.name?.toLowerCase()]);
  const out = [];
  for (const s of term.synonyms) {
    const k = s.text.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ text: s.text, scope: s.scope, type: s.type, lang: 'en' });
  }
  return out;
}

/** Ancestros de primer nivel bajo cualquiera de `roots` (para «sistema/tipo»). */
function firstLevelUnder(terms, roots) {
  const rootSet = new Set(roots);
  const memo = new Map();
  const visit = (id, stack = new Set()) => {
    if (memo.has(id)) return memo.get(id);
    if (stack.has(id)) return [];
    stack.add(id);
    const t = terms.get(id);
    let out = [];
    if (t && t.isA.some((p) => rootSet.has(p))) out = [id];
    else for (const p of t?.isA ?? []) out.push(...visit(p, stack));
    stack.delete(id);
    const uniq = [...new Set(out)].sort();
    memo.set(id, uniq);
    return uniq;
  };
  return visit;
}

function splitPrefixed(x) {
  const i = x.indexOf(':');
  return i < 0 ? null : { system: x.slice(0, i), code: x.slice(i + 1) };
}

/** SYMP → filas. `terms`: Map id → término OBO. */
export function sympRows(terms, header, provenance) {
  const live = new Map([...terms].filter(([, t]) => !t.obsolete && t.id.startsWith('SYMP:')));
  const root = 'SYMP:0000462'; // «symptom», raíz declarada de la ontología
  const systemsOf = firstLevelUnder(live, [root]);
  const rows = [];
  for (const t of [...live.values()].sort((a, b) => a.id.localeCompare(b.id))) {
    rows.push({
      codeSystem: 'symp',
      code: t.id,
      enName: t.name,
      esName: null,
      esNameKind: null,
      definition: t.def,
      definitionLang: t.def ? 'en' : null,
      definitionRefs: t.defRefs,
      synonyms: uniqueSynonyms(t),
      parents: t.isA.filter((p) => live.has(p)).sort(),
      systems: t.id === root ? [] : systemsOf(t.id),
      subontology: root,
      altIds: t.altIds,
      xrefs: t.xrefs.map((x) => splitPrefixed(x.id)).filter(Boolean),
      subsets: t.subsets,
      comments: t.comment ? [t.comment] : [],
      sourceRecordId: t.id,
      sourceUri: `http://purl.obolibrary.org/obo/${t.id.replace(':', '_')}`,
      version: header.dataVersion?.match(/releases\/([^/]+)\//)?.[1] ?? header.dataVersion,
      retrievedAt: provenance.retrievedAt,
      license: provenance.license,
      source: 'symp',
    });
  }
  return { rows, stats: { terms: terms.size, obsolete: terms.size - live.size, rows: rows.length } };
}

/** Ids de NCIt que entran al corpus → regla por la que entran (ver criterio arriba). */
export function ncitScope(terms) {
  const kids = childrenIndex(terms);
  const live = (id) => terms.has(id) && !terms.get(id).obsolete;
  const byRoots = descendants(kids, NCIT_ROOTS);
  const bySemType = new Set([...terms.values()].filter((t) => stringPv(t, 'NCIT:P106').includes(NCIT_SEMANTIC_TYPE)).map((t) => t.id));
  const findings = [...descendants(kids, [NCIT_FINDING_ROOT])].filter((id) => live(id) && stringPv(terms.get(id), 'NCIT:P106').some((x) => NCIT_FINDING_TYPES.includes(x)));
  const diseases = descendants(kids, [NCIT_DISEASE_ROOT]);
  const scope = new Map();
  for (const id of [...byRoots, ...bySemType]) if (live(id)) scope.set(id, 'sign-symptom');
  for (const id of findings) if (!scope.has(id)) scope.set(id, 'finding-by-site-or-system');
  const excludedAsDisease = [...scope.keys()].filter((id) => diseases.has(id)).sort();
  for (const id of excludedAsDisease) scope.delete(id);
  return { scope, byRoots: byRoots.size, bySemanticType: bySemType.size, findingsBySite: findings.length, excludedAsDisease };
}

/** NCIt (subconjunto) → filas. */
export function ncitRows(terms, header, provenance) {
  const { scope, byRoots, bySemanticType, findingsBySite, excludedAsDisease } = ncitScope(terms);
  const systemsOf = firstLevelUnder(terms, [...NCIT_ROOTS, NCIT_FINDING_ROOT]);
  const rows = [];
  for (const id of [...scope.keys()].sort()) {
    const t = terms.get(id);
    const cui = stringPv(t, 'NCIT:P207');
    rows.push({
      codeSystem: 'ncit',
      code: t.id.replace(/^NCIT:/, ''),
      enName: t.name,
      esName: null,
      esNameKind: null,
      definition: t.def,
      definitionLang: t.def ? 'en' : null,
      definitionRefs: t.defRefs,
      synonyms: uniqueSynonyms(t),
      // Sólo padres dentro del subconjunto: la jerarquía no cuelga de conceptos que no se cargan.
      parents: t.isA.filter((p) => scope.has(p)).map((p) => p.replace(/^NCIT:/, '')).sort(),
      systems: systemsOf(t.id).map((p) => p.replace(/^NCIT:/, '')),
      // El sistema/órgano puede ser un concepto que no entra al corpus (p. ej. un
      // agrupador tipado como «Conceptual Entity»): se guarda su nombre EN de NCIt.
      systemLabels: Object.fromEntries(systemsOf(t.id).map((p) => [p.replace(/^NCIT:/, ''), terms.get(p)?.name ?? null])),
      subontology: null,
      altIds: t.altIds,
      xrefs: [...t.xrefs.map((x) => splitPrefixed(x.id)).filter(Boolean), ...cui.map((c) => ({ system: 'UMLS', code: c }))],
      semanticTypes: stringPv(t, 'NCIT:P106'),
      scopeRule: scope.get(id),
      subsets: t.subsets,
      comments: [],
      sourceRecordId: t.id.replace(/^NCIT:/, ''),
      sourceUri: `https://evsexplore.semantics.cancer.gov/evsexplore/concept/ncit/${t.id.replace(/^NCIT:/, '')}`,
      version: header.propertyValues.find((p) => p.startsWith('owl:versionInfo'))?.match(/"([^"]+)"/)?.[1] ?? header.dataVersion,
      retrievedAt: provenance.retrievedAt,
      license: provenance.license,
      source: 'ncit',
    });
  }
  return { rows, stats: { inScope: scope.size, byRoots, bySemanticType, findingsBySite, excludedAsDisease: excludedAsDisease.length, excludedAsDiseaseCodes: excludedAsDisease.map((x) => x.replace(/^NCIT:/, '')), byRule: { signSymptom: rows.filter((r) => r.scopeRule === 'sign-symptom').length, findingBySiteOrSystem: rows.filter((r) => r.scopeRule === 'finding-by-site-or-system').length } } };
}
