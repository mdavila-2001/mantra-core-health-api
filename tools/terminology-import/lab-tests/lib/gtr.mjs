// =============================================================================
// NCBI Genetic Testing Registry (GTR) → registros del catálogo de análisis.
//
// Fuente: https://ftp.ncbi.nlm.nih.gov/pub/GTR/data/ (dominio público de NLM;
// GTR pide atribución: enlace a https://www.ncbi.nlm.nih.gov/gtr/ y cita de
// NAR 2013;41:D925). GTR registra OFERTAS de laboratorios: cada test es lo que
// un laboratorio concreto ofrece, con sus métodos, genes y condiciones. No es
// un catálogo abstracto de análisis, y por eso va en su propio code system.
//
// Archivos (tabulados, con cabecera):
//   test_version.gz            una fila por versión de test; `now_current = 1` marca la vigente
//   test_condition_gene.txt    tipo de test (Clinical/Research), condiciones (MedGen/OMIM) y genes (GeneID)
//   tests_by_method_category.txt  categoría de método → categoría mayor (archivo oficial)
//
// Los códigos `test_currStat` / `test_pubStat` no están documentados por NCBI
// (ni en GTRFieldDefinitions.pdf ni en GTRPublicData.xsd): se guardan crudos,
// sin interpretarlos. NIH no verifica lo que registran los laboratorios.
// =============================================================================

import { slugify } from '../../lib/glossary-es/common.mjs';
import { compact, conceptIdFor } from './records.mjs';

export const GTR_CODE_SYSTEM = 'gtr-ncbi';
export const GTR_LICENSE =
  'NCBI Genetic Testing Registry: información del gobierno de EE. UU., dominio público (https://www.ncbi.nlm.nih.gov/home/about/policies/). Atribución pedida por NCBI: https://www.ncbi.nlm.nih.gov/gtr/ y Rubinstein WS et al., Nucleic Acids Res. 2013;41:D925. NIH no verifica lo que registran los laboratorios.';

/** TSV con cabecera (sin comillas escapadas dentro de campos: GTR usa comillas sólo como envoltura). */
export function parseTsv(text, required, label) {
  const lines = text.split(/\r?\n/).filter((l) => l !== '');
  const header = lines[0].replace(/^#/, '').split('\t').map((h) => h.trim());
  const missing = required.filter((r) => !header.includes(r));
  if (missing.length) throw new Error(`${label}: faltan columnas ${missing.join(', ')}. Cabeceras encontradas: ${header.join(', ')}`);
  const unquote = (v) => (v.length >= 2 && v.startsWith('"') && v.endsWith('"') ? v.slice(1, -1) : v);
  return lines.slice(1).map((l) => {
    const cells = l.split('\t');
    return Object.fromEntries(header.map((h, i) => [h, unquote((cells[i] ?? '').trim())]));
  });
}

const split = (s) => [...new Set(String(s ?? '').split('|').map((x) => x.trim()).filter(Boolean))];

/** `tests_by_method_category.txt` → Map(categoría de método → categoría mayor). */
export function methodCategoryMap(text) {
  return new Map(parseTsv(text, ['Major method category', 'Method category'], 'tests_by_method_category.txt').map((r) => [r['Method category'], r['Major method category']]));
}

/** `test_condition_gene.txt` → Map(accession_version → { testType, conditions, genes }). */
export function conditionGeneMap(text) {
  const rows = parseTsv(text, ['accession_version', 'test_type', 'object', 'GTR_identifier', 'MIM_number', 'object_name', 'gene_or_SNOMED_CT_ID', 'gene_symbol'], 'test_condition_gene.txt');
  const out = new Map();
  const na = (v) => (v && v !== 'N/A' ? v : null);
  for (const r of rows) {
    if (!out.has(r.accession_version)) out.set(r.accession_version, { testType: r.test_type || null, conditions: [], genes: [] });
    const e = out.get(r.accession_version);
    e.testType ??= r.test_type || null;
    if (r.object === 'condition') e.conditions.push(compact({ medgenCui: na(r.GTR_identifier), mim: na(r.MIM_number), name: na(r.object_name), snomedCtId: na(r.gene_or_SNOMED_CT_ID) }));
    else if (r.object === 'gene') e.genes.push(compact({ geneId: na(r.gene_or_SNOMED_CT_ID), symbol: na(r.gene_symbol), name: na(r.object_name), mim: na(r.MIM_number), medgenCui: na(r.GTR_identifier) }));
  }
  return out;
}

export const TEST_VERSION_COLUMNS = ['test_accession_ver', 'name_of_laboratory', 'facility_country', 'lab_test_name', 'lab_id', 'method_categories', 'methods', 'genes', 'now_current', 'test_currStat', 'test_pubStat'];

/**
 * Filas vigentes de test_version → registros.
 * @param {Array<object>} versions filas de parseTsv(test_version)
 * @param {Map} condGenes conditionGeneMap
 * @param {Map} majorOf methodCategoryMap
 * @param {object} prov { sourceVersion, sourceFile, sourceSha256, retrievedAt }
 */
export function gtrRecords(versions, condGenes, majorOf, prov) {
  const current = versions.filter((v) => v.now_current === '1');
  const seen = new Set();
  const records = [];
  const unmappedMethodCategories = {};
  for (const v of current) {
    const [accession] = v.test_accession_ver.split('.');
    if (seen.has(accession)) throw new Error(`GTR: dos versiones vigentes de ${accession}`);
    seen.add(accession);
    const methodCategories = split(v.method_categories);
    const majors = [...new Set(methodCategories.map((m) => majorOf.get(m) ?? null).filter(Boolean))].sort();
    for (const m of methodCategories) if (!majorOf.has(m)) unmappedMethodCategories[m] = (unmappedMethodCategories[m] ?? 0) + 1;
    const cg = condGenes.get(v.test_accession_ver) ?? { testType: null, conditions: [], genes: [] };
    const categoryCode = majors.length ? majors.join('|') : '(sin categoría de método)';
    const numericId = String(Number(accession.replace(/^GTR0*/, '')));
    records.push({
      id: conceptIdFor(GTR_CODE_SYSTEM, accession),
      codeSystem: GTR_CODE_SYSTEM,
      code: accession,
      display: v.lab_test_name || v.manufacturer_test_name || accession,
      definition: null,
      lang: 'en',
      selectable: true,
      status: 'current',
      category: { scheme: 'gtr-major-method-category', code: categoryCode, display: categoryCode },
      domain: 'genetics',
      domainRule: 'gtr:registro-de-tests-geneticos',
      properties: compact({
        gtr_accession_version: v.test_accession_ver,
        gtr_test_type: cg.testType,
        gtr_laboratory: compact({ labId: v.lab_id, name: v.name_of_laboratory, institution: v.name_of_institution, country: v.facility_country, state: v.facility_state }),
        gtr_lab_test_id: v.lab_test_id,
        gtr_manufacturer_test_name: v.manufacturer_test_name,
        gtr_test_development: v.test_development,
        gtr_indication_types: split(v.indication_types),
        gtr_inheritances: split(v.inheritances),
        gtr_method_categories: methodCategories,
        gtr_major_method_categories: majors,
        gtr_methods: split(v.methods),
        gtr_platforms: split(v.platforms),
        gtr_genes: cg.genes.length ? cg.genes : split(v.genes).map((symbol) => ({ symbol })),
        gtr_conditions: cg.conditions.length ? cg.conditions : split(v.condition_identifiers).map((name) => ({ name })),
        gtr_drug_responses: split(v.drug_responses),
        gtr_test_order_code: v.test_order_code,
        gtr_test_create_date: v.test_create_date,
        gtr_last_touch_date: v.last_touch_date,
        gtr_status_raw: compact({ test_currStat: v.test_currStat, test_pubStat: v.test_pubStat, lab_currStat: v.lab_currStat, lab_pubStat: v.lab_pubStat }),
        lab_catalog_domain: 'genetics',
        lab_catalog_domain_rule: 'gtr:registro-de-tests-geneticos',
      }),
      designations: [],
      relations: [],
      valueSets: ['lab-catalog-gtr-ncbi', `lab-catalog-gtr-ncbi-cat-${slugify(categoryCode)}`, 'lab-catalog-domain-genetics', ...(cg.testType ? [`lab-catalog-gtr-ncbi-type-${slugify(cg.testType)}`] : [])],
      provenance: {
        source: 'gtr-ncbi',
        sourceName: 'NCBI Genetic Testing Registry (GTR)',
        sourceId: v.test_accession_ver,
        sourceVersion: prov.sourceVersion,
        sourceUrl: `https://www.ncbi.nlm.nih.gov/gtr/tests/${numericId}/`,
        sourceFile: prov.sourceFile,
        sourceSha256: prov.sourceSha256,
        retrievedAt: prov.retrievedAt,
        license: GTR_LICENSE,
      },
    });
  }
  return { records, stats: { versionRows: versions.length, current: current.length, withConditionGeneRow: records.filter((r) => r.properties.gtr_test_type).length, unmappedMethodCategories } };
}
