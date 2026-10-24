// =============================================================================
// Fuentes → registro común del catálogo de enfermedades.
//
// Un registro por concepto:
//   { cs, code, display, lang, definition, definitionLang, definitionRefs,
//     designations: [{ value, lang, preferred }], parents: [code],
//     status: 'active' | 'deprecated', replacedBy, properties: {…},
//     xrefs: [{ cs, code, equivalence, context, draft }], provenance: {…} }
//
// Reglas (todas declaradas por la fuente, ninguna inferida):
//  - Nombres, sinónimos y definiciones verbatim, en el idioma que trae la fuente.
//  - Jerarquía: `is_a` de cada ontología; en Orphanet, las aristas de sus
//    clasificaciones (product3) y su padre preferencial (product7).
//  - Cruces: sólo los alineamientos que publica la fuente, con la equivalencia
//    que ella declara. MONDO: xref anotada `MONDO:equivalentTo` o
//    `skos:exactMatch` → equivalente; `skos:closeMatch` → inexacto;
//    `skos:broadMatch` → el destino es más amplio (wider); `skos:narrowMatch` →
//    más estrecho. Orphanet: E → equivalente, NTBT → wider, BTNT → narrower,
//    ND → inexacto; «no validado» queda en borrador. Un xref sin semántica
//    declarada (DOID, MONDO sin anotación) entra como mapeo sin equivalencia.
//  - SNOMED CT (SCTID) se descarta entero: Bolivia no es miembro de SNOMED
//    International. MedDRA, ICD-O, GARD, EFO, MedGen, ICD-9, NORD, etc. quedan
//    sólo como referencia en la propiedad `disease_external_xrefs`.
// =============================================================================

import { SYSTEMS } from './code-systems.mjs';
import { readObo } from './obo.mjs';
import { parseProduct1, parseProduct3, parseProduct7 } from './orphanet.mjs';

const EXCLUDED_XREF_PREFIXES = new Set(['SCTID', 'SNOMEDCT', 'SNOMEDCT_US']);
const isSnomed = (prefix) => EXCLUDED_XREF_PREFIXES.has(prefix) || prefix.startsWith('SNOMEDCT_US_');

/** Prefijo de CURIE de una ontología → { cs, code } del catálogo, o null si queda como referencia. */
export function normalizeCurie(curie) {
  const i = curie.indexOf(':');
  if (i < 0) return null;
  const prefix = curie.slice(0, i);
  const local = curie.slice(i + 1).trim();
  if (!local) return null;
  switch (prefix) {
    case 'MONDO':
      return { cs: 'mondo', code: `MONDO:${local}` };
    case 'DOID':
      return { cs: 'doid', code: `DOID:${local}` };
    case 'Orphanet':
    case 'ORDO':
    case 'ORPHA':
      return { cs: 'orphanet', code: local };
    case 'NCIT':
    case 'NCI':
      return /^C\d+$/.test(local) ? { cs: 'ncit-disease', code: local } : null;
    case 'OMIM':
    case 'MIM':
      return /^\d{6}$/.test(local) ? { cs: 'omim', code: local } : null;
    case 'OMIMPS':
      return /^\d{6}$/.test(local) ? { cs: 'omim', code: `PS${local}` } : null;
    case 'MESH':
    case 'MSH':
      return /^[CD]\d+$/.test(local) ? { cs: 'mesh', code: local } : null;
    case 'UMLS':
    case 'UMLS_CUI':
      return /^C\d{7}$/.test(local) ? { cs: 'umls', code: local } : null;
    case 'ICD10WHO':
      return { cs: 'icd10-who', code: local };
    case 'icd11.foundation':
      return /^\d+$/.test(local) ? { cs: 'icd11-foundation', code: local } : null;
    case 'ICD10CM':
      return { cs: 'icd10cm', code: local, external: true };
    default:
      return null;
  }
}

const EQUIV_BY_SKOS = {
  'skos:exactMatch': 'equivalent',
  'skos:closeMatch': 'inexact',
  'skos:broadMatch': 'wider',
  'skos:narrowMatch': 'narrower',
  'skos:relatedMatch': null,
};

function pushDesignation(list, value, lang, preferred) {
  if (!value) return;
  const v = value.trim();
  if (!v || list.some((d) => d.value === v && d.lang === lang)) return;
  list.push({ value: v, lang, preferred });
}

/**
 * Hojas a excluir de una ontología: los descendientes de `excludedRoots` que no
 * tienen ningún otro camino hasta `root`. Devuelve el conjunto de ids a CONSERVAR.
 */
export function keepReachable(terms, root, excludedRoots) {
  const parents = new Map(terms.map((t) => [t.id, t.isA.map((p) => p.id)]));
  const memo = new Map();
  const visiting = new Set();
  const ok = (id) => {
    if (id === root) return true;
    if (excludedRoots.has(id)) return false;
    if (memo.has(id)) return memo.get(id);
    if (visiting.has(id)) return false;
    visiting.add(id);
    const r = (parents.get(id) ?? []).some(ok);
    visiting.delete(id);
    memo.set(id, r);
    return r;
  };
  return new Set(terms.filter((t) => ok(t.id)).map((t) => t.id));
}

async function oboTerms(path, prefix) {
  const terms = [];
  const header = await readObo(path, (t) => {
    if (t.id.startsWith(`${prefix}:`)) terms.push(t);
  });
  return { header, terms };
}

/** Xrefs no normalizables → referencia `{ prefix: [ids] }` (sin SNOMED). */
function addExternalRef(refs, curie) {
  const i = curie.indexOf(':');
  const prefix = i < 0 ? curie : curie.slice(0, i);
  if (isSnomed(prefix) || /^https?$/.test(prefix)) return;
  (refs[prefix] ??= []).includes(curie) || refs[prefix].push(curie);
}

// --- MONDO ---------------------------------------------------------------------

export async function buildMondo(file, meta) {
  const { header, terms } = await oboTerms(file.path, 'MONDO');
  const version = (header['data-version']?.[0] ?? '').replace(/^releases\//, '') || meta.version;
  const live = terms.filter((t) => !t.obsolete);
  const keep = keepReachable(live, 'MONDO:0000001', new Set(['MONDO:0005583', 'MONDO:0021125']));
  const excluded = { nonHumanOrCharacteristic: live.length - keep.size };
  const records = [];
  for (const t of terms) {
    if (!t.obsolete && !keep.has(t.id)) continue;
    const designations = [];
    pushDesignation(designations, t.name, 'en', true);
    t.synonyms.forEach((s) => pushDesignation(designations, s.text, 'en', false));
    const xrefs = [];
    const external = {};
    const seen = new Set();
    const addMap = (target, equivalence, context) => {
      const key = `${target.cs}|${target.code}|${context}`;
      if (seen.has(key)) return;
      seen.add(key);
      xrefs.push({ cs: target.cs, code: target.code, equivalence, context, external: Boolean(target.external) });
    };
    const skosTargets = new Set();
    for (const pv of t.propertyValues) {
      if (!(pv.prop in EQUIV_BY_SKOS) || pv.literal) continue;
      const target = normalizeCurie(pv.value.replace(/^icd10cm:/, 'ICD10CM:'));
      if (!target) {
        addExternalRef(external, pv.value);
        continue;
      }
      skosTargets.add(`${target.cs}|${target.code}`);
      addMap(target, EQUIV_BY_SKOS[pv.prop], `mondo:${pv.prop}`);
    }
    for (const x of t.xrefs) {
      const target = normalizeCurie(x.id);
      if (!target) {
        addExternalRef(external, x.id);
        continue;
      }
      if (skosTargets.has(`${target.cs}|${target.code}`)) continue;
      const eq = x.sources.includes('MONDO:equivalentTo') ? 'equivalent' : null;
      addMap(target, eq, eq ? 'mondo:xref MONDO:equivalentTo' : 'mondo:xref');
    }
    records.push({
      cs: 'mondo',
      code: t.id,
      display: t.name ?? t.id,
      lang: 'en',
      definition: t.def,
      definitionLang: t.def ? 'en' : null,
      definitionRefs: t.defRefs,
      designations,
      parents: t.obsolete ? [] : t.isA.map((p) => p.id).filter((p) => keep.has(p)),
      status: t.obsolete ? 'deprecated' : 'active',
      replacedBy: t.replacedBy[0] ?? null,
      properties: {
        ...(t.subsets.length ? { disease_subsets: t.subsets } : {}),
        ...(Object.keys(external).length ? { disease_external_xrefs: external } : {}),
      },
      xrefs,
      provenance: provenance(meta, version, t.id, 'mondo'),
    });
  }
  return { version, records, excluded };
}

// --- DOID ----------------------------------------------------------------------

export async function buildDoid(file, meta) {
  const { header, terms } = await oboTerms(file.path, 'DOID');
  const version = (header['data-version']?.[0] ?? '').replace(/^releases\//, '').replace(/\/doid\.obo$/, '') || meta.version;
  const records = terms.map((t) => {
    const designations = [];
    pushDesignation(designations, t.name, 'en', true);
    t.synonyms.forEach((s) => pushDesignation(designations, s.text, 'en', false));
    const xrefs = [];
    const external = {};
    for (const x of t.xrefs) {
      const target = normalizeCurie(x.id);
      if (!target) addExternalRef(external, x.id);
      else xrefs.push({ cs: target.cs, code: target.code, equivalence: null, context: 'doid:xref', external: Boolean(target.external) });
    }
    return {
      cs: 'doid',
      code: t.id,
      display: t.name ?? t.id,
      lang: 'en',
      definition: t.def,
      definitionLang: t.def ? 'en' : null,
      definitionRefs: t.defRefs,
      designations,
      parents: t.obsolete ? [] : t.isA.map((p) => p.id).filter((p) => p.startsWith('DOID:')),
      status: t.obsolete ? 'deprecated' : 'active',
      replacedBy: t.replacedBy[0] ?? null,
      properties: {
        ...(t.subsets.length ? { disease_subsets: t.subsets } : {}),
        ...(t.altIds.length ? { disease_alt_ids: t.altIds } : {}),
        ...(Object.keys(external).length ? { disease_external_xrefs: external } : {}),
      },
      xrefs,
      provenance: provenance(meta, version, t.id, 'doid'),
    };
  });
  return { version, records, excluded: {} };
}

// --- NCIt (sólo el subárbol Disease or Disorder) ---------------------------------

export async function buildNcit(file, meta) {
  const { header, terms } = await oboTerms(file.path, 'NCIT');
  const versionInfo = (header.property_value ?? []).find((v) => v.startsWith('owl:versionInfo'));
  const version = versionInfo ? /"([^"]+)"/.exec(versionInfo)[1] : meta.version;
  const live = terms.filter((t) => !t.obsolete);
  const keep = keepReachable(live, 'NCIT:C2991', new Set());
  const records = [];
  for (const t of live) {
    if (!keep.has(t.id)) continue;
    const code = t.id.slice(5);
    const designations = [];
    pushDesignation(designations, t.name, 'en', true);
    t.synonyms.forEach((s) => pushDesignation(designations, s.text, 'en', false));
    const pv = (p) => t.propertyValues.filter((x) => x.prop === p).map((x) => x.value);
    // NCIT:P207 = UMLS CUI que publica el propio NCI para el concepto.
    const xrefs = pv('NCIT:P207')
      .filter((c) => /^C\d{7}$/.test(c))
      .map((c) => ({ cs: 'umls', code: c, equivalence: null, context: 'ncit:P207 UMLS_CUI' }));
    records.push({
      cs: 'ncit-disease',
      code,
      display: t.name ?? code,
      lang: 'en',
      definition: t.def,
      definitionLang: t.def ? 'en' : null,
      definitionRefs: t.defRefs,
      designations,
      parents: t.isA.map((p) => p.id).filter((p) => keep.has(p)).map((p) => p.slice(5)),
      status: 'active',
      replacedBy: null,
      properties: pv('NCIT:P106').length ? { ncit_semantic_types: pv('NCIT:P106') } : {},
      xrefs,
      provenance: provenance(meta, version, t.id, 'ncit-disease', code),
    });
  }
  return { version, records, excluded: { outsideDiseaseOrDisorder: terms.length - records.length } };
}

// --- Orphanet ------------------------------------------------------------------

const ORPHA_TARGET = {
  'ICD-10': (r) => ({ cs: 'icd10-who', code: r }),
  'ICD-11': (r) => ({ cs: 'icd11-mms', code: r }),
  OMIM: (r) => (/^\d{6}$/.test(r) ? { cs: 'omim', code: r } : null),
  UMLS: (r) => (/^C\d{7}$/.test(r) ? { cs: 'umls', code: r } : null),
  MeSH: (r) => (/^[CD]\d+$/.test(r) ? { cs: 'mesh', code: r } : null),
  MONDO: (r) => ({ cs: 'mondo', code: `MONDO:${r.padStart(7, '0')}` }),
};
const ORPHA_EQUIV = { E: 'equivalent', NTBT: 'wider', BTNT: 'narrower', ND: 'inexact' };
const INACTIVE_FLAGS = new Set(['obsolete', 'deprecated', 'inactive', 'historical', 'obsolete-with-resources']);

export function buildOrphanet({ es, en, classifications, linearisation }, meta) {
  const version = es.date;
  const parents = new Map();
  const memberOf = new Map();
  for (const c of classifications) {
    for (const { parent, child } of c.edges) {
      if (!parents.has(child)) parents.set(child, new Set());
      parents.get(child).add(parent);
    }
    for (const n of c.nodes) {
      if (!memberOf.has(n)) memberOf.set(n, []);
      memberOf.get(n).push({ id: c.id, name: c.name });
    }
  }
  const codes = new Set([...es.disorders.keys(), ...en.disorders.keys(), ...parents.keys()]);
  const records = [];
  for (const code of codes) {
    const e = es.disorders.get(code);
    const n = en.disorders.get(code);
    const base = e ?? n;
    if (!base) continue; // nodo de clasificación sin ficha en product1: no hay nombre que mostrar
    const designations = [];
    if (e) {
      pushDesignation(designations, e.name, 'es', true);
      e.synonyms.forEach((s) => pushDesignation(designations, s, 'es', false));
    }
    if (n) {
      pushDesignation(designations, n.name, 'en', !e);
      n.synonyms.forEach((s) => pushDesignation(designations, s, 'en', false));
    }
    const external = {};
    const xrefs = [];
    for (const x of base.xrefs) {
      const make = ORPHA_TARGET[x.source];
      const target = make ? make(x.reference) : null;
      if (!target) {
        (external[x.source] ??= []).push({ code: x.reference, relation: x.relation });
        continue;
      }
      const context = `orphanet:${x.relation ?? 'sin relación'}${x.icdRelationId ? ` icd-relation:${x.icdRelationId}` : ''}`;
      // product1 repite algunos alineamientos idénticos (≈1 000): uno solo por destino y contexto.
      if (xrefs.some((y) => y.cs === target.cs && y.code === target.code && y.context === context)) continue;
      xrefs.push({
        cs: target.cs,
        code: target.code,
        equivalence: ORPHA_EQUIV[x.relation] ?? null,
        context,
        draft: !x.validated,
        icdRefUri: x.icdRefUri,
      });
    }
    const inactive = base.flags.some((f) => INACTIVE_FLAGS.has(f));
    const movedTo = base.associations.find((a) => a.type === 'moved-to')?.target ?? null;
    const defLang = e?.definition ? 'es' : n?.definition ? 'en' : null;
    records.push({
      cs: 'orphanet',
      code,
      display: e?.name ?? n.name,
      lang: e ? 'es' : 'en',
      definition: e?.definition ?? n?.definition ?? null,
      definitionLang: defLang,
      definitionRefs: [],
      designations,
      parents: [...(parents.get(code) ?? [])].filter((p) => p !== code),
      status: inactive ? 'deprecated' : 'active',
      replacedBy: movedTo,
      properties: {
        orphanet_classification: {
          disorderTypeId: base.disorderTypeId,
          disorderType: { es: e?.disorderType ?? null, en: n?.disorderType ?? null },
          disorderGroupId: base.disorderGroupId,
          disorderGroup: { es: e?.disorderGroup ?? null, en: n?.disorderGroup ?? null },
          classifications: memberOf.get(code) ?? [],
          preferentialParent: linearisation.parents.get(code) ?? null,
          flags: base.flags,
        },
        ...(Object.keys(external).length ? { disease_external_xrefs: external } : {}),
        ...(e?.expertLink ? { orphanet_expert_link: e.expertLink } : {}),
        ...(base.associations.length ? { orphanet_associations: base.associations } : {}),
        ...((e?.definitionHtml ?? n?.definitionHtml) !== (e?.definition ?? n?.definition) && (e?.definitionHtml ?? n?.definitionHtml)
          ? { disease_definition_html: { [defLang]: e?.definitionHtml ?? n?.definitionHtml } }
          : {}),
      },
      xrefs,
      provenance: provenance(meta, version, `ORPHA:${code}`, 'orphanet', code),
    });
  }
  return { version, records, excluded: {} };
}

export function readOrphanet(paths) {
  return {
    es: parseProduct1(paths.es),
    en: parseProduct1(paths.en),
    classifications: paths.product3.map(parseProduct3),
    linearisation: parseProduct7(paths.product7),
  };
}

// --- Procedencia ---------------------------------------------------------------

function provenance(meta, version, sourceId, cs, code = sourceId) {
  return {
    source: SYSTEMS[cs].name,
    sourceId,
    version,
    uri: SYSTEMS[cs].uri(code),
    file: meta.url,
    sha256: meta.sha256 ?? null,
    retrievedAt: meta.retrievedAt ?? null,
    license: SYSTEMS[cs].license,
  };
}
