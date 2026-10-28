// =============================================================================
// Archivos de condiciones de ClinVar que se usan como ENLACE por código exacto
// (nunca como fuente de nombres):
//
//  - `gene_condition_source_id`: gen (GeneID de NCBI) ↔ condición (CUI de
//    MedGen) con la fuente que la declara y su identificador. Se guarda como
//    propiedad `medgen_condition_links` del gen. Se descarta `DiseaseName`
//    (para las filas cuya fuente es OMIM el nombre es de OMIM; el nombre de la
//    condición ya está en el concepto de MedGen si su fuente es abierta).
//  - `disease_names`: sólo se lee la categoría (Disease, Finding, …) por
//    ConceptID: va como propiedad del concepto de MedGen y como lista de
//    valores en `clinvar-terms`. Los nombres no se cargan: 19 248 son de HPO
//    (sin aprobación del propietario), 185+237 de OMIM (licencia) y 17 357 no
//    declaran fuente.
// =============================================================================

import { nullIf, readDelimited, rowObject } from './delimited.mjs';

const GENE_CONDITION_COLUMNS = ['GeneID', 'AssociatedGenes', 'RelatedGenes', 'ConceptID', 'DiseaseName', 'SourceName', 'SourceID', 'DiseaseMIM', 'LastUpdated'];
const DISEASE_NAMES_COLUMNS = ['DiseaseName', 'SourceName', 'ConceptID', 'SourceID', 'DiseaseMIM', 'LastModified', 'Category'];

/** @returns {Promise<{ byGene: Map<string, object[]>, rows: number }>} */
export async function readGeneConditions(path) {
  const byGene = new Map();
  const { header, rows } = await readDelimited(
    path,
    (f, _n, h) => {
      const o = rowObject(h, f);
      const link = {
        concept: o.ConceptID,
        source: nullIf(o.SourceName),
        source_id: nullIf(o.SourceID),
        disease_mim: nullIf(o.DiseaseMIM),
        last_updated: nullIf(o.LastUpdated),
        associated_genes: nullIf(o.AssociatedGenes),
        related_genes: nullIf(o.RelatedGenes),
      };
      if (!byGene.has(o.GeneID)) byGene.set(o.GeneID, []);
      byGene.get(o.GeneID).push(link);
    },
    { quote: null, stripHash: true },
  );
  if (header.join() !== GENE_CONDITION_COLUMNS.join()) throw new Error(`gene_condition_source_id: columnas inesperadas: ${header.join()}`);
  for (const links of byGene.values()) links.sort((a, b) => (a.concept + a.source_id < b.concept + b.source_id ? -1 : 1));
  return { byGene, rows };
}

/**
 * Categorías de ClinVar por ConceptID y conteo por categoría.
 * @returns {Promise<{ byConcept: Map<string, string[]>, categories: Map<string, number>, rows: number }>}
 */
export async function readDiseaseNameCategories(path) {
  const byConcept = new Map();
  const categories = new Map();
  const { header, rows } = await readDelimited(
    path,
    (f, _n, h) => {
      const o = rowObject(h, f);
      categories.set(o.Category, (categories.get(o.Category) ?? 0) + 1);
      if (o.ConceptID === '') return;
      const list = byConcept.get(o.ConceptID) ?? [];
      if (!list.includes(o.Category)) list.push(o.Category);
      byConcept.set(o.ConceptID, list);
    },
    { quote: null, stripHash: true },
  );
  if (header.join() !== DISEASE_NAMES_COLUMNS.join()) throw new Error(`disease_names: columnas inesperadas: ${header.join()}`);
  for (const list of byConcept.values()) list.sort();
  return { byConcept, categories, rows };
}
