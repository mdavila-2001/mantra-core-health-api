// =============================================================================
// MeSH (NLM) rama C23 «Pathological Conditions, Signs and Symptoms» →
// filas del corpus. Fuente: `desc2026.xml` (XML de descriptores, 313 MB).
//
// Entra todo descriptor con al menos un número de árbol `C23*`:
//   C23.888 Signs and Symptoms            ← la rama de signos y síntomas
//   C23.149 Morphological and Microscopic Findings
//   C23.300 Pathological Conditions, Anatomical
//   C23.550 Pathologic Processes
// y la cabeza C23. La rama de cada fila queda en `subontology` y TODOS sus
// números de árbol (también los de otras ramas) en `treeNumbers`.
//
// Jerarquía: por prefijo del número de árbol, sólo dentro de C23 (un
// descriptor con varios números tiene varios padres). Sinónimos: los términos
// del concepto preferido son EXACT; los de conceptos más angostos o más amplios
// quedan con su alcance (NARROW/BROAD/RELATED) y no se presentan como
// equivalentes. Los términos «permutados» (`IsPermutedTermYN="Y"`) son
// reordenamientos mecánicos de otro término («Temperature, Body»): no se
// cargan, se cuentan. Nada se traduce: MeSH en castellano es DeCS (BIREME), con
// otra licencia.
// =============================================================================

import { createInterface } from 'node:readline';
import { unescapeXml } from './orphadata.mjs';

export const MESH_ROOT = 'C23';
/** Ramas de primer nivel de C23, en el orden en que se decide `subontology`. */
export const MESH_BRANCHES = ['C23.888', 'C23.149', 'C23.300', 'C23.550'];

const one = (s, re) => {
  const m = s.match(re);
  return m ? unescapeXml(m[1]).trim() : null;
};
const all = (s, re) => [...s.matchAll(re)].map((m) => unescapeXml(m[1]).trim());

/** Concept → { ui, name, preferred, scopeNote, umlsUi, relations, terms[] }. */
function parseConcepts(block) {
  const out = [];
  const listStart = block.indexOf('<ConceptList>');
  if (listStart < 0) return out;
  for (const c of block.slice(listStart).split('<Concept ').slice(1)) {
    const ui = one(c, /<ConceptUI>([^<]*)<\/ConceptUI>/);
    const terms = [];
    for (const t of c.split('<Term ').slice(1)) {
      const attrs = t.slice(0, t.indexOf('>'));
      terms.push({
        ui: one(t, /<TermUI>([^<]*)<\/TermUI>/),
        text: one(t, /<String>([^<]*)<\/String>/),
        conceptPreferred: /ConceptPreferredTermYN="Y"/.test(attrs),
        permuted: /IsPermutedTermYN="Y"/.test(attrs),
        recordPreferred: /RecordPreferredTermYN="Y"/.test(attrs),
        lexicalTag: attrs.match(/LexicalTag="([^"]*)"/)?.[1] ?? null,
      });
    }
    out.push({
      ui,
      preferred: /^PreferredConceptYN="Y"/.test(c),
      name: one(c, /<ConceptName>\s*<String>([^<]*)<\/String>/),
      scopeNote: one(c, /<ScopeNote>([^<]*)<\/ScopeNote>/),
      umlsUi: one(c, /<ConceptUMLSUI>([^<]*)<\/ConceptUMLSUI>/),
      relations: [...c.matchAll(/<ConceptRelation RelationName="([A-Z]+)">\s*<Concept1UI>([^<]*)<\/Concept1UI>\s*<Concept2UI>([^<]*)<\/Concept2UI>/g)].map((m) => ({ name: m[1], c1: m[2], c2: m[3] })),
      terms,
    });
  }
  return out;
}

const RELATION_SCOPE = { NRW: 'NARROW', BRD: 'BROAD', REL: 'RELATED' };

/** Registro de descriptor (texto) → datos crudos, o null si no es de C23. */
export function parseDescriptor(block) {
  const ui = one(block, /<DescriptorUI>([^<]*)<\/DescriptorUI>/);
  const treeNumbers = all(block.slice(block.indexOf('<TreeNumberList>') >= 0 ? block.indexOf('<TreeNumberList>') : 0), /<TreeNumber>([^<]*)<\/TreeNumber>/g);
  if (!treeNumbers.some((t) => t === MESH_ROOT || t.startsWith(`${MESH_ROOT}.`))) return null;
  const name = one(block, /<DescriptorName>\s*<String>([^<]*)<\/String>/);
  const concepts = parseConcepts(block);
  return {
    ui,
    name,
    treeNumbers,
    concepts,
    annotation: one(block, /<Annotation>([^<]*)<\/Annotation>/),
    dateIntroduced: (() => {
      const m = block.match(/<DateIntroduced>\s*<Year>(\d+)<\/Year>\s*<Month>(\d+)<\/Month>\s*<Day>(\d+)<\/Day>/);
      return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : null;
    })(),
    lastUpdated: (() => {
      const m = block.match(/<LastUpdated>\s*<Year>(\d+)<\/Year>\s*<Month>(\d+)<\/Month>\s*<Day>(\d+)<\/Day>/);
      return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : null;
    })(),
  };
}

/** Lee un flujo de `desc20XX.xml` y devuelve los descriptores C23 crudos + cuántos escaneó. */
export async function readC23Descriptors(stream) {
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  const found = [];
  let scanned = 0;
  let buf = null;
  for await (const line of rl) {
    if (line.startsWith('<DescriptorRecord ')) {
      buf = [line];
      continue;
    }
    if (!buf) continue;
    buf.push(line);
    if (line.trim() === '</DescriptorRecord>') {
      scanned++;
      const d = parseDescriptor(buf.join('\n'));
      if (d) found.push(d);
      buf = null;
    }
  }
  return { descriptors: found, scanned };
}

/** Rama de primer nivel a la que pertenece un descriptor. */
export function branchOf(treeNumbers) {
  for (const b of MESH_BRANCHES) if (treeNumbers.some((t) => t === b || t.startsWith(`${b}.`))) return b;
  return treeNumbers.includes(MESH_ROOT) ? MESH_ROOT : null;
}

const asKey = (s) => s.toLowerCase();

/** Descriptores C23 → filas del corpus (`terms-mesh-c23`). */
export function meshC23Rows(descriptors, { version, retrievedAt, license, descriptorXmlSha256 = null }) {
  const byTree = new Map();
  for (const d of descriptors) for (const t of d.treeNumbers) if (t === MESH_ROOT || t.startsWith(`${MESH_ROOT}.`)) byTree.set(t, d.ui);
  const stats = { descriptors: descriptors.length, permutedTermsSkipped: 0, synonyms: { exact: 0, narrow: 0, broad: 0, related: 0, unknown: 0 }, byBranch: {}, withScopeNote: 0, withUmls: 0 };
  const rows = [];
  for (const d of [...descriptors].sort((a, b) => a.ui.localeCompare(b.ui))) {
    const pref = d.concepts.find((c) => c.preferred) ?? d.concepts[0];
    const scopeOf = new Map([[pref.ui, 'EXACT']]);
    for (const c of d.concepts) {
      if (c.ui === pref.ui) continue;
      // El calificador lo declara la fuente en la relación entre el concepto preferido y éste.
      const rel = pref.relations.find((r) => r.c1 === pref.ui && r.c2 === c.ui) ?? c.relations.find((r) => r.c1 === pref.ui && r.c2 === c.ui);
      scopeOf.set(c.ui, rel ? RELATION_SCOPE[rel.name] ?? null : null);
    }
    const seen = new Set([asKey(d.name)]);
    const synonyms = [];
    for (const c of d.concepts) {
      for (const t of c.terms) {
        if (t.permuted) {
          stats.permutedTermsSkipped++;
          continue;
        }
        if (seen.has(asKey(t.text))) continue;
        seen.add(asKey(t.text));
        const scope = scopeOf.get(c.ui) ?? null;
        synonyms.push({ text: t.text, scope: scope ?? 'UNSPECIFIED', type: 'entry-term', lang: 'en', termUi: t.ui, conceptUi: c.ui });
        const k = scope ? scope.toLowerCase() : 'unknown';
        stats.synonyms[k in stats.synonyms ? k : 'unknown']++;
      }
    }
    const parents = [
      ...new Set(
        d.treeNumbers
          .filter((t) => t.startsWith(`${MESH_ROOT}.`))
          .map((t) => byTree.get(t.slice(0, t.lastIndexOf('.'))))
          .filter(Boolean),
      ),
    ].sort();
    const branch = branchOf(d.treeNumbers);
    stats.byBranch[branch] = (stats.byBranch[branch] ?? 0) + 1;
    if (pref.scopeNote) stats.withScopeNote++;
    if (pref.umlsUi) stats.withUmls++;
    rows.push({
      codeSystem: 'mesh-c23',
      code: d.ui,
      enName: d.name,
      esName: null,
      esNameKind: null,
      definition: pref.scopeNote,
      definitionLang: pref.scopeNote ? 'en' : null,
      definitionRefs: [],
      synonyms,
      parents,
      systems: [],
      subontology: branch,
      treeNumbers: d.treeNumbers,
      altIds: [],
      xrefs: pref.umlsUi ? [{ system: 'UMLS', code: pref.umlsUi }] : [],
      subsets: [],
      comments: d.annotation ? [d.annotation] : [],
      sourceRecordId: d.ui,
      sourceUri: `https://id.nlm.nih.gov/mesh/${d.ui}`,
      sourceDates: { introduced: d.dateIntroduced, lastUpdated: d.lastUpdated },
      version,
      retrievedAt,
      license,
      scopeRule: 'mesh-tree-c23',
      source: 'mesh-c23',
      sourceFileSha256: descriptorXmlSha256,
    });
  }
  return { rows, stats };
}
