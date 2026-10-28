// =============================================================================
// MeSH (NLM) — descriptores del archivo `desc2026.xml`, sólo las ramas que
// cubre este carril:
//  - «Chemical Actions and Uses» (árbol D27): acciones farmacológicas
//    (D27.505, incluye los mecanismos moleculares), acciones tóxicas y usos
//    terapéuticos. Son las clases farmacológicas de MeSH.
//  - «Epidemiologic Methods» (D004812, árbol E05.318): salud pública.
// Las demás ramas (enfermedades, anatomía, químicos…) las cargan o las citan
// otras sesiones. Términos de uso: https://www.nlm.nih.gov/databases/download/terms_and_conditions_mesh.html
// («NLM freely provides MeSH data»; hay que citar a NLM y la versión).
//
// El archivo es XML regular, un <DescriptorRecord> por descriptor. Se lee en
// streaming y se parsea cada registro con expresiones sobre su texto: el
// formato es estable (DTD nlmdescriptorrecordset) y evita una dependencia.
// =============================================================================

import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { provenance } from './terms.mjs';

const decodeXml = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
const clean = (s) => decodeXml(s).replace(/\s+/g, ' ').trim();

/** Registros <DescriptorRecord>…</DescriptorRecord> como texto, en streaming. */
export async function* descriptorRecords(path) {
  const rl = createInterface({ input: createReadStream(path, { encoding: 'utf8' }), crlfDelay: Infinity });
  let buf = null;
  for await (const line of rl) {
    if (buf === null) {
      if (line.startsWith('<DescriptorRecord ')) buf = [line];
      continue;
    }
    buf.push(line);
    if (line.trim() === '</DescriptorRecord>') {
      yield buf.join('\n');
      buf = null;
    }
  }
  if (buf !== null) throw new Error('MeSH: archivo truncado (un DescriptorRecord sin cerrar)');
}

const first = (xml, re) => re.exec(xml)?.[1];

/** Registro XML → descriptor { ui, name, class, treeNumbers, concepts[], pharmacologicalActions[], ... }. */
export function parseDescriptor(xml) {
  const ui = first(xml, /<DescriptorUI>(D\d+)<\/DescriptorUI>/);
  const name = first(xml, /<DescriptorName>\s*<String>([\s\S]*?)<\/String>/);
  if (!ui || name === undefined) throw new Error('MeSH: registro sin DescriptorUI o DescriptorName');
  // El orden del archivo: …AllowableQualifiersList, notas, PharmacologicalActionList, TreeNumberList, ConceptList.
  const head = xml.slice(0, xml.indexOf('<ConceptList>'));
  const treeNumbers = [...head.matchAll(/<TreeNumber>([\s\S]*?)<\/TreeNumber>/g)].map((m) => clean(m[1]));
  const pa = first(head, /<PharmacologicalActionList>([\s\S]*?)<\/PharmacologicalActionList>/) ?? '';
  const pharmacologicalActions = [...pa.matchAll(/<DescriptorReferredTo>\s*<DescriptorUI>(D\d+)<\/DescriptorUI>\s*<DescriptorName>\s*<String>([\s\S]*?)<\/String>/g)].map((m) => ({ ui: m[1], name: clean(m[2]) }));
  const concepts = [];
  const conceptList = first(xml, /<ConceptList>([\s\S]*)<\/ConceptList>/) ?? '';
  for (const c of conceptList.matchAll(/<Concept PreferredConceptYN="([YN])">([\s\S]*?)<\/Concept>/g)) {
    const body = c[2];
    const termList = first(body, /<TermList>([\s\S]*?)<\/TermList>/) ?? '';
    const terms = [...termList.matchAll(/<Term\s+([^>]*)>([\s\S]*?)<\/Term>/g)].map((t) => ({
      ui: first(t[2], /<TermUI>(T\d+)<\/TermUI>/),
      value: clean(first(t[2], /<String>([\s\S]*?)<\/String>/) ?? ''),
      conceptPreferred: /ConceptPreferredTermYN="Y"/.test(t[1]),
      recordPreferred: /RecordPreferredTermYN="Y"/.test(t[1]),
      lexicalTag: first(t[1], /LexicalTag="(\w+)"/) ?? null,
      permuted: /IsPermutedTermYN="Y"/.test(t[1]),
    }));
    const relations = [...body.matchAll(/<ConceptRelation RelationName="(\w+)">\s*<Concept1UI>(M\d+)<\/Concept1UI>\s*<Concept2UI>(M\d+)<\/Concept2UI>/g)].map((r) => ({ relation: r[1], from: r[2], to: r[3] }));
    const scope = first(body, /<ScopeNote>([\s\S]*?)<\/ScopeNote>/);
    concepts.push({
      ui: first(body, /<ConceptUI>(M\d+)<\/ConceptUI>/),
      preferred: c[1] === 'Y',
      name: clean(first(body, /<ConceptName>\s*<String>([\s\S]*?)<\/String>/) ?? ''),
      scopeNote: scope === undefined ? null : clean(scope),
      registryNumbers: [...body.matchAll(/<RegistryNumber>([\s\S]*?)<\/RegistryNumber>/g)].map((m) => clean(m[1])),
      relations,
      terms,
    });
  }
  const note = (tag) => {
    const v = first(head, new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
    return v === undefined ? null : clean(v);
  };
  return {
    ui,
    name: clean(name),
    class: first(xml, /DescriptorClass = "(\d)"/) ?? null,
    dateIntroduced: ymd(first(head, /<DateIntroduced>([\s\S]*?)<\/DateIntroduced>/)),
    lastUpdated: ymd(first(head, /<LastUpdated>([\s\S]*?)<\/LastUpdated>/)),
    treeNumbers,
    pharmacologicalActions,
    annotation: note('Annotation'),
    publicNote: note('PublicMeSHNote'),
    historyNote: note('HistoryNote'),
    concepts,
  };
}

function ymd(block) {
  if (!block) return null;
  const y = first(block, /<Year>(\d+)<\/Year>/);
  const m = first(block, /<Month>(\d+)<\/Month>/);
  const d = first(block, /<Day>(\d+)<\/Day>/);
  return y && m && d ? `${y}-${m}-${d}` : null;
}

/** Padre en el árbol: el número sin su último segmento (D27.505.519 → D27.505). Las raíces (D27) no tienen. */
export const parentTreeNumber = (tn) => (tn.includes('.') ? tn.slice(0, tn.lastIndexOf('.')) : null);

/**
 * Rama a la que pertenece un descriptor según sus números de árbol; el primer
 * criterio que coincida manda (un descriptor puede estar en varios árboles).
 */
export function branchOf(treeNumbers, branches) {
  for (const b of branches) if (treeNumbers.some((t) => t === b.tree || t.startsWith(`${b.tree}.`))) return b;
  return null;
}

/**
 * Descriptores (ya parseados, TODOS) → filas del corpus de las ramas pedidas.
 * La jerarquía is-a sale de los números de árbol que el archivo publica; el
 * padre puede quedar fuera de la rama (se anota sin resolver, no se inventa).
 * `declaredBy`: para cada acción farmacológica, los descriptores que la
 * declaran en su <PharmacologicalActionList> (la relación publicada
 * sustancia → clase; las sustancias no se cargan acá).
 */
export function meshRows(descriptors, source, file) {
  const byTree = new Map();
  for (const d of descriptors) for (const t of d.treeNumbers) byTree.set(t, d);
  const declaredBy = new Map();
  for (const d of descriptors) for (const pa of d.pharmacologicalActions) {
    if (!declaredBy.has(pa.ui)) declaredBy.set(pa.ui, []);
    declaredBy.get(pa.ui).push({ ui: d.ui, name: d.name });
  }
  const stats = { descriptors: descriptors.length, byBranch: {}, parentsOutsideBranch: 0, withDefinition: 0, withoutTree: 0 };
  const rows = [];
  for (const d of descriptors) {
    const branch = branchOf(d.treeNumbers, source.branches);
    if (!branch) continue;
    stats.byBranch[branch.id] = (stats.byBranch[branch.id] ?? 0) + 1;
    const preferred = d.concepts.find((c) => c.preferred);
    if (!preferred) throw new Error(`MeSH ${d.ui}: sin concepto preferido`);
    const recordPreferred = preferred.terms.find((t) => t.recordPreferred);
    if (!recordPreferred || recordPreferred.value !== d.name) throw new Error(`MeSH ${d.ui}: el término preferido del registro («${recordPreferred?.value}») no es el nombre del descriptor («${d.name}»)`);
    const exact = [...new Set(preferred.terms.filter((t) => t.value !== d.name).map((t) => t.value))];
    const other = [];
    for (const c of d.concepts.filter((x) => !x.preferred)) {
      // Relación del concepto con el preferido, según <ConceptRelationList> del descriptor (NRW/BRD/REL).
      const rel = preferred.relations.find((r) => r.to === c.ui)?.relation ?? 'REL';
      for (const t of c.terms) if (t.value !== d.name && !exact.includes(t.value)) other.push({ value: t.value, scope: { NRW: 'NARROW', BRD: 'BROAD', REL: 'RELATED' }[rel] ?? 'RELATED', type: `concept ${c.ui} (${c.name})` });
    }
    const relations = [];
    const unresolved = [];
    for (const tn of d.treeNumbers) {
      const pt = parentTreeNumber(tn);
      if (!pt) continue;
      const parent = byTree.get(pt);
      if (!parent) throw new Error(`MeSH ${d.ui}: el número de árbol ${tn} no tiene padre ${pt} en el archivo`);
      if (!relations.some((r) => r.target === parent.ui)) relations.push({ type: 'IS_A', predicate: 'mesh-tree-parent', target: parent.ui, targetKey: `${source.codeSystem}|${parent.ui}` });
    }
    for (const r of relations) if (!branchOf(byUi(descriptors, r.target)?.treeNumbers ?? [], source.branches)) { stats.parentsOutsideBranch++; unresolved.push(r.target); }
    if (preferred.scopeNote) stats.withDefinition++;
    if (!d.treeNumbers.length) stats.withoutTree++;
    rows.push({
      key: `${source.codeSystem}|${d.ui}`,
      codeSystem: source.codeSystem,
      code: d.ui,
      domain: branch.domain,
      lang: 'en',
      display: d.name,
      definition: preferred.scopeNote,
      definitionXrefs: [],
      synonymsExact: exact,
      synonymsOther: other,
      xrefs: [],
      subsets: [],
      namespace: `mesh-${branch.id}`,
      altIds: [],
      relations,
      otherRelations: [],
      extra: {
        treeNumbers: d.treeNumbers,
        conceptUi: preferred.ui,
        dateIntroduced: d.dateIntroduced,
        lastUpdated: d.lastUpdated,
        annotation: d.annotation,
        publicMeshNote: d.publicNote,
        historyNote: d.historyNote,
        ...(preferred.registryNumbers.length ? { registryNumbers: preferred.registryNumbers } : {}),
        ...(d.pharmacologicalActions.length ? { pharmacologicalActions: d.pharmacologicalActions } : {}),
        ...(declaredBy.has(d.ui) ? { declaredAsPharmacologicalActionBy: declaredBy.get(d.ui).sort((a, b) => a.ui.localeCompare(b.ui)) } : {}),
        ...(unresolved.length ? { parentsOutsideLoadedBranches: unresolved } : {}),
      },
      provenance: provenance(source, d.ui, { file }),
    });
  }
  stats.rows = rows.length;
  return { rows, stats };
}

let uiIndex = null;
let uiIndexFor = null;
function byUi(descriptors, ui) {
  if (uiIndexFor !== descriptors) { uiIndex = new Map(descriptors.map((d) => [d.ui, d])); uiIndexFor = descriptors; }
  return uiIndex.get(ui);
}
