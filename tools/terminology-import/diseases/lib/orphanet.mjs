// =============================================================================
// Productos de Orphanet (Orphadata, CC BY 4.0) → registros planos.
//
//  - product1 (ES y EN): nomenclatura, sinónimos, definición, tipo, banderas y
//    alineamientos con ICD-10, ICD-11, OMIM, UMLS, MeSH, MedDRA, GARD y MONDO,
//    cada uno con la relación que declara Orphanet (E, NTBT, BTNT, ND).
//  - product3: las clasificaciones (árbol padre→hijo por especialidad).
//  - product7: el «padre preferencial» de cada trastorno (linealización).
//
// Los ids numéricos de las listas de Orphanet (21527, 36547, …) son estables
// entre idiomas; las equivalencias se deciden por id, nunca por el texto.
// =============================================================================

import { readFileSync } from 'node:fs';
import { child, children, parseXml, pathAll, textOf } from './xml.mjs';

/** Relación de alineamiento de Orphanet (id de su lista) → clave propia. */
export const ORPHA_MAPPING_RELATION = {
  21527: 'E',
  21534: 'NTBT',
  21541: 'BTNT',
  21576: 'ND',
};

/** Banderas de product1 (id → clave). La bandera 475 (valor 1) es la entidad vigente. */
export const ORPHA_FLAG = {
  475: 'active',
  455: 'obsolete',
  456: 'non-rare-in-europe',
  458: 'head-of-classification',
  459: 'deprecated',
  460: 'historical',
  461: 'obsolete-with-resources',
  495: 'inactive',
};

/** Fecha (YYYY-MM-DD) que declara el propio archivo en `<JDBOR date=…>` o `ExtractionDate`. */
export function jdborDate(root) {
  return (root.attrs.date ?? root.attrs.ExtractionDate ?? '').slice(0, 10) || null;
}

function stripHtml(s) {
  return s == null ? null : s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/** product1 → { date, version, disorders: Map<orphaCode, registro> }. */
export function parseProduct1(path) {
  const root = parseXml(readFileSync(path, 'utf8'));
  const disorders = new Map();
  for (const d of pathAll(root, 'DisorderList', 'Disorder')) {
    const code = textOf(d, 'OrphaCode');
    const flags = children(child(d, 'DisorderFlagList'), 'DisorderFlag').map((f) => ORPHA_FLAG[f.attrs.id] ?? `flag-${f.attrs.id}`);
    const sections = pathAll(d, 'SummaryInformationList', 'SummaryInformation', 'TextSectionList', 'TextSection');
    // La sección «Definición/Definition» tiene id de tipo 16907 en ambos idiomas.
    const defSection = sections.find((s) => child(s, 'TextSectionType')?.attrs.id === '16907');
    const xrefs = pathAll(d, 'ExternalReferenceList', 'ExternalReference').map((x) => ({
      source: textOf(x, 'Source'),
      reference: textOf(x, 'Reference'),
      relation: ORPHA_MAPPING_RELATION[child(x, 'DisorderMappingRelation')?.attrs.id] ?? null,
      icdRelationId: child(x, 'DisorderMappingICDRelation')?.attrs.id ?? null,
      validated: child(x, 'DisorderMappingValidationStatus')?.attrs.id === '21611',
      icdRefUrl: textOf(x, 'DisorderMappingICDRefUrl'),
      icdRefUri: textOf(x, 'DisorderMappingICDRefUri'),
    }));
    const associations = pathAll(d, 'DisorderDisorderAssociationList', 'DisorderDisorderAssociation').map((a) => ({
      type: child(a, 'DisorderDisorderAssociationType')?.attrs.id === '21471' ? 'moved-to' : 'referred-to',
      target: textOf(child(a, 'TargetDisorder'), 'OrphaCode'),
    }));
    disorders.set(code, {
      code,
      name: textOf(d, 'Name'),
      synonyms: children(child(d, 'SynonymList'), 'Synonym').map((s) => s.text).filter(Boolean),
      definitionHtml: defSection ? textOf(defSection, 'Contents') : null,
      definition: defSection ? stripHtml(textOf(defSection, 'Contents')) : null,
      disorderTypeId: child(d, 'DisorderType')?.attrs.id ?? null,
      disorderType: textOf(child(d, 'DisorderType'), 'Name'),
      disorderGroupId: child(d, 'DisorderGroup')?.attrs.id ?? null,
      disorderGroup: textOf(child(d, 'DisorderGroup'), 'Name'),
      expertLink: textOf(d, 'ExpertLink'),
      flags,
      xrefs,
      associations,
    });
  }
  return { date: jdborDate(root), version: root.attrs.version ?? null, disorders };
}

/** product3 → { id, name, rootCode, edges: [{ parent, child }] } de una clasificación. */
export function parseProduct3(path) {
  const root = parseXml(readFileSync(path, 'utf8'));
  const cls = pathAll(root, 'ClassificationList', 'Classification')[0];
  const edges = [];
  const nodes = new Set();
  const walk = (node, parentCode) => {
    const code = textOf(child(node, 'Disorder'), 'OrphaCode');
    nodes.add(code);
    if (parentCode) edges.push({ parent: parentCode, child: code });
    for (const c of pathAll(node, 'ClassificationNodeChildList', 'ClassificationNode')) walk(c, code);
  };
  const roots = pathAll(cls, 'ClassificationNodeRootList', 'ClassificationNode');
  roots.forEach((r) => walk(r, null));
  return {
    id: cls.attrs.id,
    orphaNumber: textOf(cls, 'OrphaNumber'),
    name: textOf(cls, 'Name'),
    rootCodes: roots.map((r) => textOf(child(r, 'Disorder'), 'OrphaCode')),
    nodes,
    edges,
    date: jdborDate(root),
  };
}

/** product7 → Map<orphaCode, código del padre preferencial>. */
export function parseProduct7(path) {
  const root = parseXml(readFileSync(path, 'utf8'));
  const out = new Map();
  for (const d of pathAll(root, 'DisorderList', 'Disorder')) {
    const code = textOf(d, 'OrphaCode');
    for (const a of pathAll(d, 'DisorderDisorderAssociationList', 'DisorderDisorderAssociation')) {
      if (child(a, 'DisorderDisorderAssociationType')?.attrs.id === '21485') out.set(code, textOf(child(a, 'TargetDisorder'), 'OrphaCode'));
    }
  }
  return { date: jdborDate(root), parents: out };
}
