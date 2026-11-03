// =============================================================================
// HGNC complete set (JSON oficial) → filas del corpus. Un concepto por gen
// aprobado; código = `HGNC:<n>` (lo que exige FHIR Genomics), display = símbolo
// aprobado. Los alias (símbolos y nombres) son los que HGNC publica como
// «alias»: designaciones. Los símbolos y nombres ANTERIORES no son sinónimos
// vigentes: quedan como dato aparte.
// =============================================================================

import { provenance } from './terms.mjs';

/** Identificadores externos que HGNC publica por gen y que se conservan como xrefs. */
const XREF_FIELDS = {
  entrez_id: 'NCBIGene',
  ensembl_gene_id: 'ENSEMBL',
  omim_id: 'OMIM',
  uniprot_ids: 'UniProtKB',
  orphanet: 'Orphanet',
  refseq_accession: 'RefSeq',
  ccds_id: 'CCDS',
  mane_select: 'MANE',
};

const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

export function hgncRows(json, source, file) {
  const docs = json?.response?.docs;
  if (!Array.isArray(docs)) throw new Error('HGNC: el JSON no trae response.docs[]');
  const stats = { docs: docs.length, notApproved: 0, rows: 0 };
  const version = file.retrievedAt.slice(0, 10);
  const rows = [];
  for (const d of docs) {
    if (d.status !== 'Approved') { stats.notApproved++; continue; }
    const exact = [...new Set([d.name, ...list(d.alias_symbol), ...list(d.alias_name)].filter((x) => x && x !== d.symbol))];
    rows.push({
      key: `${source.codeSystem}|${d.hgnc_id}`,
      codeSystem: source.codeSystem,
      code: d.hgnc_id,
      domain: source.domain,
      lang: 'en',
      display: d.symbol,
      definition: null,
      definitionXrefs: [],
      synonymsExact: exact,
      synonymsOther: [...list(d.prev_symbol).map((v) => ({ value: v, scope: 'PREVIOUS', type: 'prev_symbol' })), ...list(d.prev_name).map((v) => ({ value: v, scope: 'PREVIOUS', type: 'prev_name' }))],
      xrefs: Object.entries(XREF_FIELDS).flatMap(([field, prefix]) => list(d[field]).map((v) => ({ id: `${prefix}:${v}`.replace(/^(Orphanet):Orphanet:/, '$1:'), equivalent: false }))),
      subsets: [],
      namespace: d.locus_group ?? null,
      altIds: [],
      relations: [],
      otherRelations: [],
      extra: {
        approvedName: d.name ?? null,
        locusGroup: d.locus_group ?? null,
        locusType: d.locus_type ?? null,
        location: d.location ?? null,
        geneGroups: list(d.gene_group_id).map((id, i) => ({ id, name: list(d.gene_group)[i] ?? null })),
        dateApprovedReserved: d.date_approved_reserved ?? null,
        dateModified: d.date_modified ?? null,
      },
      provenance: provenance({ ...source, version }, d.hgnc_id, { file }),
    });
  }
  stats.rows = rows.length;
  return { rows, stats };
}
