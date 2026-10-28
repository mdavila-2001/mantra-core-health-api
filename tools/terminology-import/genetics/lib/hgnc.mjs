// =============================================================================
// HGNC (HUGO Gene Nomenclature Committee, CC0): genes humanos aprobados y
// grupos de genes. Todo verbatim del archivo; nada se traduce ni se reescribe.
//
//   hgnc_complete_set.txt   53 columnas, un gen por fila (45 289 aprobados)
//   family.csv              grupos (familias) de genes
//   hierarchy.csv           padre → hijo entre grupos
//   gene_has_family.csv     gen (número HGNC) → grupo
//
// Cruces: el propio HGNC publica `entrez_id` (NCBI Gene), `omim_id`,
// `orphanet`, etc. Sólo `entrez_id` se convierte en mapa a otro sistema que
// cargamos (ncbi-gene-hs); el resto queda como xref de texto.
// =============================================================================

import { nullIf, readDelimited, rowObject } from './delimited.mjs';
import { cleanProps, designationList, pipeList, prop, uniq, withProvenance } from './rows.mjs';

/** columna del archivo → etiqueta del sistema en `xrefs` (`SISTEMA:código`). */
export const XREF_COLUMNS = {
  entrez_id: 'ENTREZ',
  ensembl_gene_id: 'ENSEMBL',
  vega_id: 'VEGA',
  ucsc_id: 'UCSC',
  ena: 'ENA',
  refseq_accession: 'REFSEQ',
  ccds_id: 'CCDS',
  uniprot_ids: 'UNIPROT',
  mgd_id: 'MGD',
  rgd_id: 'RGD',
  cosmic: 'COSMIC',
  omim_id: 'OMIM',
  mirbase: 'MIRBASE',
  homeodb: 'HOMEODB',
  snornabase: 'SNORNABASE',
  bioparadigms_slc: 'BIOPARADIGMS_SLC',
  orphanet: 'ORPHANET',
  'pseudogene.org': 'PSEUDOGENE_ORG',
  horde_id: 'HORDE',
  merops: 'MEROPS',
  imgt: 'IMGT',
  iuphar: 'IUPHAR',
  kznf_gene_catalog: 'KZNF',
  'mamit-trnadb': 'MAMIT_TRNADB',
  cd: 'CD',
  lncrnadb: 'LNCRNADB',
  enzyme_id: 'EC',
  intermediate_filament_db: 'IFDB',
  rna_central_id: 'RNACENTRAL',
  lncipedia: 'LNCIPEDIA',
  gtrnadb: 'GTRNADB',
  agr: 'AGR',
  gencc: 'GENCC',
};

/** Una fila de hgnc_complete_set.txt (objeto por columna) → fila del corpus. */
export function hgncRow(o, prov) {
  const groupNames = pipeList(o.gene_group);
  const groupIds = pipeList(o.gene_group_id);
  if (groupNames.length !== groupIds.length) throw new Error(`${o.hgnc_id}: gene_group y gene_group_id no tienen la misma cantidad de valores`);
  const xrefs = [];
  for (const [col, label] of Object.entries(XREF_COLUMNS)) for (const v of pipeList(o[col])) xrefs.push(`${label}:${v}`);
  // lsdb trae pares «nombre|URL»: queda aparte, no como xref de un sistema.
  const lsdb = pipeList(o.lsdb);
  const aliasSymbols = pipeList(o.alias_symbol);
  const aliasNames = pipeList(o.alias_name);
  const row = {
    codeSystem: 'hgnc',
    code: o.hgnc_id,
    display: o.symbol,
    designations: designationList(o.symbol, [o.name, ...aliasSymbols, ...aliasNames]),
    definition: null,
    properties: cleanProps([
      prop('approved_name', 'string', o.name),
      prop('hgnc_status', 'string', o.status),
      prop('locus_group', 'string', o.locus_group),
      prop('locus_type', 'string', o.locus_type),
      prop('cytogenetic_location', 'string', nullIf(o.location)),
      prop('alias_symbols', 'json', aliasSymbols),
      prop('alias_names', 'json', aliasNames),
      prop('previous_symbols', 'json', pipeList(o.prev_symbol)),
      prop('previous_names', 'json', pipeList(o.prev_name)),
      prop('gene_groups', 'json', groupIds.map((id, i) => ({ id, name: groupNames[i] }))),
      prop('date_approved_reserved', 'string', nullIf(o.date_approved_reserved)),
      prop('date_symbol_changed', 'string', nullIf(o.date_symbol_changed)),
      prop('date_name_changed', 'string', nullIf(o.date_name_changed)),
      prop('date_modified', 'string', nullIf(o.date_modified)),
      prop('xrefs', 'json', xrefs),
      prop('pubmed_ids', 'json', pipeList(o.pubmed_id)),
      prop('lsdb', 'json', lsdb),
      prop('mane_select', 'json', pipeList(o.mane_select)),
    ]),
    parents: [],
    maps: o.entrez_id ? [{ system: 'ncbi-gene-hs', code: o.entrez_id, context: `entrez_id declarado por HGNC ${o.hgnc_id} (hgnc_complete_set.txt)` }] : [],
    relations: groupIds.map((id) => ({ type: 'part-of', system: 'hgnc-gene-group', code: id })),
  };
  return withProvenance(row, prov, { source: 'hgnc', sourceUrl: `https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/${o.hgnc_id}` });
}

export async function hgncRows(path, prov) {
  const rows = [];
  const { header } = await readDelimited(path, (f, _n, h) => rows.push(hgncRow(rowObject(h, f), prov)));
  return { rows, header };
}

/** Grupos de genes → filas. `members` cuenta genes por grupo. */
export function groupRows({ families, hierarchy, geneHasFamily }, prov) {
  const parentsOf = new Map();
  for (const { parent, child } of hierarchy) {
    if (!parentsOf.has(child)) parentsOf.set(child, []);
    parentsOf.get(child).push(parent);
  }
  const members = new Map();
  for (const { family } of geneHasFamily) members.set(family, (members.get(family) ?? 0) + 1);
  const known = new Set(families.map((f) => f.id));
  return families.map((f) => {
    const parents = uniq(parentsOf.get(f.id) ?? []).filter((p) => known.has(p));
    const src = nullIf(f.desc_source) ? f.desc_source.split('|') : [];
    const row = {
      codeSystem: 'hgnc-gene-group',
      code: f.id,
      display: f.name,
      designations: designationList(f.name, []),
      definition: nullIf(f.desc_comment) ? { text: f.desc_comment, lang: 'en' } : null,
      properties: cleanProps([
        prop('abbreviation', 'string', nullIf(f.abbreviation)),
        prop('external_note', 'string', nullIf(f.external_note)),
        prop('pubmed_ids', 'json', pipeList(nullIf(f.pubmed_ids) ? f.pubmed_ids.replace(/,/g, '|') : null)),
        prop('description_label', 'string', nullIf(f.desc_label)),
        prop('description_source', 'json', src),
        prop('description_go', 'string', nullIf(f.desc_go)),
        prop('typical_gene', 'string', nullIf(f.typical_gene)),
        prop('gene_count', 'string', String(members.get(f.id) ?? 0)),
      ]),
      parents,
      maps: [],
      relations: [],
    };
    return withProvenance(row, prov, { source: 'hgnc-family', sourceUrl: `https://www.genenames.org/data/genegroup/#!/group/${f.id}` });
  });
}

export async function readFamilies(dir) {
  const read = async (file, cols) => {
    const out = [];
    const { header } = await readDelimited(`${dir}/${file}`, (f, _n, h) => out.push(rowObject(h, f)), { delimiter: ',' });
    if (cols && cols.join() !== header.join()) throw new Error(`${file}: columnas inesperadas: ${header.join()}`);
    return out;
  };
  const families = await read('family.csv', ['id', 'abbreviation', 'name', 'external_note', 'pubmed_ids', 'desc_comment', 'desc_label', 'desc_source', 'desc_go', 'typical_gene']);
  const hierarchy = (await read('hierarchy.csv', ['parent_fam_id', 'child_fam_id'])).map((r) => ({ parent: r.parent_fam_id, child: r.child_fam_id }));
  const geneHasFamily = (await read('gene_has_family.csv', ['hgnc_id', 'family_id'])).map((r) => ({ hgnc: r.hgnc_id, family: r.family_id }));
  return { families, hierarchy, geneHasFamily };
}
