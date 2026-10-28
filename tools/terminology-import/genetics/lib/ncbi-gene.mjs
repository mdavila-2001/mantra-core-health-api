// =============================================================================
// NCBI Gene, Homo sapiens (taxón 9606): `Homo_sapiens.gene_info.gz`. Un
// concepto por GeneID, con TODOS los tipos que NCBI publica (genes que codifican
// proteínas, ncRNA, pseudogenes, otros y «biological-region»). El tipo queda en
// la propiedad `type_of_gene` para que el propietario pueda cortar por tipo.
//
// Columnas: tax_id, GeneID, Symbol, LocusTag, Synonyms, dbXrefs, chromosome,
// map_location, description, type_of_gene, Symbol_from_nomenclature_authority,
// Full_name_from_nomenclature_authority, Nomenclature_status,
// Other_designations, Modification_date, Feature_type. «-» = vacío.
// =============================================================================

import { nullIf, readDelimited, rowObject } from './delimited.mjs';
import { cleanProps, designationList, pipeList, prop, withProvenance } from './rows.mjs';

const EXPECTED = ['tax_id', 'GeneID', 'Symbol', 'LocusTag', 'Synonyms', 'dbXrefs', 'chromosome', 'map_location', 'description', 'type_of_gene', 'Symbol_from_nomenclature_authority', 'Full_name_from_nomenclature_authority', 'Nomenclature_status', 'Other_designations', 'Modification_date', 'Feature_type'];

/** `db:id` de dbXrefs → { db, id }; «HGNC:HGNC:5» = base HGNC, id «HGNC:5». */
export function splitDbXref(x) {
  const i = x.indexOf(':');
  return i < 0 ? { db: x, id: '' } : { db: x.slice(0, i), id: x.slice(i + 1) };
}

export function ncbiGeneRow(o, prov) {
  const xrefs = pipeList(nullIf(o.dbXrefs)).map(splitDbXref);
  const synonyms = pipeList(nullIf(o.Synonyms));
  const other = pipeList(nullIf(o.Other_designations));
  const description = nullIf(o.description);
  const maps = [];
  for (const x of xrefs) {
    if (x.db === 'HGNC') maps.push({ system: 'hgnc', code: x.id, context: `dbXrefs declarado por NCBI Gene ${o.GeneID} (Homo_sapiens.gene_info)` });
  }
  const row = {
    codeSystem: 'ncbi-gene-hs',
    code: o.GeneID,
    display: o.Symbol,
    designations: designationList(o.Symbol, [description, ...synonyms]),
    definition: null,
    properties: cleanProps([
      prop('tax_id', 'string', o.tax_id),
      prop('locus_tag', 'string', nullIf(o.LocusTag)),
      prop('chromosome', 'string', nullIf(o.chromosome)),
      prop('map_location', 'string', nullIf(o.map_location)),
      prop('description', 'string', description),
      prop('type_of_gene', 'string', o.type_of_gene),
      prop('nomenclature_symbol', 'string', nullIf(o.Symbol_from_nomenclature_authority)),
      prop('nomenclature_full_name', 'string', nullIf(o.Full_name_from_nomenclature_authority)),
      prop('nomenclature_status', 'string', nullIf(o.Nomenclature_status)),
      prop('synonyms', 'json', synonyms),
      prop('other_designations', 'json', other),
      prop('modification_date', 'string', o.Modification_date),
      prop('feature_type', 'string', nullIf(o.Feature_type)),
      prop('xrefs', 'json', xrefs.map((x) => `${x.db}:${x.id}`)),
    ]),
    parents: [],
    maps,
    relations: [],
  };
  return withProvenance(row, prov, { source: 'ncbi-gene-hs', sourceUrl: `https://www.ncbi.nlm.nih.gov/gene/${o.GeneID}` });
}

export async function ncbiGeneRows(path, prov) {
  const rows = [];
  const { header } = await readDelimited(path, (f, _n, h) => rows.push(ncbiGeneRow(rowObject(h, f), prov)), { quote: null, stripHash: true });
  if (header.join() !== EXPECTED.join()) throw new Error(`gene_info: columnas inesperadas: ${header.join()}`);
  return { rows, header };
}
