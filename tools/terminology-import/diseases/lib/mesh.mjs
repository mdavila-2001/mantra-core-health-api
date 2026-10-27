// =============================================================================
// MeSH oficial (NLM) → registros del catálogo de enfermedades.
//
// Fuentes (https://www.nlm.nih.gov/databases/download/mesh.html, XML de
// `nlmpubs.nlm.nih.gov/projects/mesh/MESH_FILES/xmlmesh/`):
//   desc<año>.xml  DescriptorRecord: UI, nombre, números de árbol, conceptos y términos,
//                  nota de alcance, anotación.
//   supp<año>.xml  SupplementalRecord (SCR): `SCRClass="3"` = enfermedades raras; trae el
//                  descriptor al que se mapea (`HeadingMappedTo`).
//
// Reglas (todas de la fuente, ninguna inferida):
//  - Nombre, sinónimos (todos los `Term`), definición (`ScopeNote` del concepto preferido)
//    verbatim, en inglés. MeSH no publica traducciones en estos archivos.
//  - Jerarquía = números de árbol: el padre de `C01.100.200` es el descriptor que tiene el número
//    `C01.100`. Un descriptor con varios números tiene varios padres.
//  - Entra todo descriptor con algún número de árbol `C` (Enfermedades) salvo el que sólo cuelga de
//    `C22` (Enfermedades de los animales, igual criterio que MONDO), todo `F03` (Trastornos
//    mentales) y todo descriptor que otra fuente de enfermedades cita por su UI. De los SCR entra
//    `SCRClass="3"` (enfermedades raras) y los SCR que otra fuente cita.
//  - Un SCR no tiene número de árbol: su «mapped to» queda como alineamiento publicado por NLM
//    (sin equivalencia declarada) hacia el descriptor, y como propiedad. No se inventa jerarquía.
//  - MeSH es de uso libre con atribución («Courtesy of the U.S. National Library of Medicine»).
// =============================================================================

import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

import { child, children, parseXml, textOf } from './xml.mjs';

/** Raíces de árbol cuyos descriptores NO se cargan por sí solos (animales; criterio de MONDO). */
export const MESH_EXCLUDED_ONLY_ROOTS = ['C22'];
/** Raíces de árbol de enfermedad humana: C (menos C22) y F03 (trastornos mentales). */
export const MESH_DISEASE_ROOT = /^(C\d\d|F03)(\.|$)/;

/** Recorre un XML de MeSH en streaming y llama `onRecord(texto)` por cada `<tag>…</tag>` de primer nivel. */
export async function streamRecords(path, tag, onRecord) {
  const open = new RegExp(`^\\s*<${tag}[ >]`);
  const close = `</${tag}>`;
  const rl = createInterface({ input: createReadStream(path, { encoding: 'utf8' }), crlfDelay: Infinity });
  let buf = null;
  let n = 0;
  for await (const line of rl) {
    if (buf === null) {
      if (open.test(line)) buf = [line];
      else continue;
    } else buf.push(line);
    if (line.includes(close)) {
      await onRecord(buf.join('\n'));
      buf = null;
      n += 1;
    }
  }
  return n;
}

// Bloques que no aportan términos y pesan mucho (calificadores permitidos, acciones farmacológicas).
const dropBulky = (xml) => xml.replace(/<AllowableQualifiersList>[\s\S]*?<\/AllowableQualifiersList>/g, '').replace(/<PharmacologicalActionList>[\s\S]*?<\/PharmacologicalActionList>/g, '');

const dateOf = (el) => {
  if (!el) return null;
  const y = textOf(el, 'Year');
  const m = textOf(el, 'Month');
  const d = textOf(el, 'Day');
  return y && m && d ? `${y}-${m}-${d}` : null;
};
const nameOf = (el, wrapper) => textOf(child(el, wrapper), 'String');

function parseConcepts(rec) {
  return children(child(rec, 'ConceptList'), 'Concept').map((c) => ({
    ui: textOf(c, 'ConceptUI'),
    name: nameOf(c, 'ConceptName'),
    preferred: c.attrs.PreferredConceptYN === 'Y',
    scopeNote: textOf(c, 'ScopeNote'),
    terms: children(child(c, 'TermList'), 'Term').map((t) => ({
      ui: textOf(t, 'TermUI'),
      value: textOf(t, 'String'),
      lexicalTag: t.attrs.LexicalTag ?? null,
      conceptPreferred: t.attrs.ConceptPreferredTermYN === 'Y',
      recordPreferred: t.attrs.RecordPreferredTermYN === 'Y',
      permuted: t.attrs.IsPermutedTermYN === 'Y',
    })),
  }));
}

/** `<DescriptorRecord>` → objeto plano. */
export function parseDescriptorRecord(xml) {
  const rec = parseXml(dropBulky(xml));
  const concepts = parseConcepts(rec);
  const relations = children(child(rec, 'ConceptList'), 'Concept').flatMap((c) =>
    children(child(c, 'ConceptRelationList'), 'ConceptRelation').map((r) => ({
      relation: r.attrs.RelationName ?? null,
      concept1: textOf(r, 'Concept1UI'),
      concept2: textOf(r, 'Concept2UI'),
    })),
  );
  const preferred = concepts.find((c) => c.preferred) ?? concepts[0] ?? null;
  return {
    ui: textOf(rec, 'DescriptorUI'),
    name: nameOf(rec, 'DescriptorName'),
    descriptorClass: rec.attrs.DescriptorClass ?? null,
    treeNumbers: children(child(rec, 'TreeNumberList'), 'TreeNumber').map((t) => t.text),
    concepts,
    conceptRelations: relations,
    scopeNote: preferred?.scopeNote ?? null,
    annotation: textOf(rec, 'Annotation'),
    publicNote: textOf(rec, 'PublicMEDLINENote'),
    historyNote: textOf(rec, 'HistoryNote'),
    onlineNote: textOf(rec, 'OnlineNote'),
    nlmClassification: textOf(rec, 'NLMClassificationNumber'),
    seeRelated: children(child(rec, 'SeeRelatedList'), 'SeeRelatedDescriptor').map((s) => textOf(child(s, 'DescriptorReferredTo'), 'DescriptorUI')),
    considerAlso: textOf(rec, 'ConsiderAlso'),
    dateCreated: dateOf(child(rec, 'DateCreated')),
    dateEstablished: dateOf(child(rec, 'DateEstablished')),
    dateRevised: dateOf(child(rec, 'DateRevised')),
    dateIntroduced: dateOf(child(rec, 'DateIntroduced')),
    lastUpdated: dateOf(child(rec, 'LastUpdated')),
  };
}

/** `<SupplementalRecord>` (SCR) → objeto plano. */
export function parseSupplementalRecord(xml) {
  const rec = parseXml(dropBulky(xml));
  const concepts = parseConcepts(rec);
  return {
    ui: textOf(rec, 'SupplementalRecordUI'),
    name: nameOf(rec, 'SupplementalRecordName'),
    scrClass: rec.attrs.SCRClass ?? null,
    note: textOf(rec, 'Note'),
    frequency: textOf(rec, 'Frequency'),
    mappedTo: children(child(rec, 'HeadingMappedToList'), 'HeadingMappedTo').map((h) => {
      const d = child(h, 'DescriptorReferredTo');
      const ui = textOf(d, 'DescriptorUI') ?? '';
      const q = child(h, 'QualifierReferredTo');
      return { ui: ui.replace(/^\*/, ''), major: ui.startsWith('*'), name: nameOf(d, 'DescriptorName'), qualifier: q ? textOf(q, 'QualifierUI') : null };
    }),
    sources: children(child(rec, 'SourceList'), 'Source').map((s) => s.text),
    concepts,
    dateCreated: dateOf(child(rec, 'DateCreated')),
    dateIntroduced: dateOf(child(rec, 'DateIntroduced')),
    lastUpdated: dateOf(child(rec, 'LastUpdated')),
  };
}

/** Todos los descriptores como objetos planos (sin filtrar). */
export async function readDescriptors(path) {
  const out = [];
  await streamRecords(path, 'DescriptorRecord', (xml) => {
    out.push(parseDescriptorRecord(xml));
  });
  return out;
}

/** SCR: sólo los de clase en `classes` o cuyo UI esté en `alsoCited`. */
export async function readSupplementals(path, classes, alsoCited = new Set()) {
  const out = [];
  let total = 0;
  const wanted = classes.map((c) => `SCRClass = "${c}"`);
  await streamRecords(path, 'SupplementalRecord', (xml) => {
    total += 1;
    const head = xml.slice(0, 120);
    const byClass = wanted.some((w) => head.includes(w)) || classes.some((c) => head.includes(`SCRClass="${c}"`));
    if (!byClass) {
      const ui = /<SupplementalRecordUI>([^<]+)</.exec(xml)?.[1];
      if (!alsoCited.has(ui)) return;
    }
    out.push(parseSupplementalRecord(xml));
  });
  return { records: out, total };
}

/** Padre de un número de árbol: `C01.100.200` → `C01.100`; una raíz (`C01`) no tiene. */
export const parentTree = (tn) => (tn.includes('.') ? tn.slice(0, tn.lastIndexOf('.')) : null);

/** ¿Es un descriptor de enfermedad humana? Algún número `C` (que no sea sólo C22) o `F03`. */
export function isDiseaseDescriptor(d) {
  const roots = d.treeNumbers.filter((t) => MESH_DISEASE_ROOT.test(t));
  if (!roots.length) return { keep: false, onlyAnimal: false };
  const human = roots.filter((t) => !MESH_EXCLUDED_ONLY_ROOTS.some((r) => t === r || t.startsWith(`${r}.`)));
  return { keep: human.length > 0, onlyAnimal: human.length === 0 };
}
