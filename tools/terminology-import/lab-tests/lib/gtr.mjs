// =============================================================================
// NCBI Genetic Testing Registry (GTR) → registros del catálogo de análisis.
//
// Fuente: https://ftp.ncbi.nlm.nih.gov/pub/GTR/data/ (dominio público, NCBI/NLM).
// Se leen tres archivos del propio FTP, SIN el XML completo (`gtr_ftp.xml.gz`),
// porque el XML trae nombres, correos y teléfonos de personas de los
// laboratorios que no hacen falta para un catálogo de pruebas:
//
//   test_version.gz               una fila por versión de cada prueba registrada
//   test_condition_gene.txt       condiciones y genes que cada prueba declara
//   tests_by_method_category.txt  jerarquía oficial «Major method category › Method category»
//
// Un concepto por prueba VIGENTE y PÚBLICA, que es lo que el propio README del
// FTP define con: now_current = 1, test_currStat = 1, test_pubStat = 3,
// lab_currStat = 1 y lab_pubStat = 3. Código = accesión sin versión
// (`GTR000004034`); la versión vigente va como propiedad.
//
// Qué NO se carga, a propósito:
//   - identificadores SNOMED CT que el archivo trae en `gene_or_SNOMED_CT_ID` de las
//     condiciones (SNOMED CT no tiene licencia en este repo);
//   - CLIA, licencias estatales y código postal del laboratorio (no describen la prueba);
//   - nada que la fuente no publique: sin rangos, sin costos, sin interpretación.
// =============================================================================

import { slugify } from '../../lib/glossary-es/common.mjs';
import { iterDelimited, objectsOf } from './delimited.mjs';
import { compact, conceptIdFor } from './records.mjs';

export const GTR_CODE_SYSTEM = 'gtr-ncbi';

export const TEST_VERSION_COLUMNS = [
  'test_accession_ver', 'name_of_laboratory', 'name_of_institution', 'facility_state', 'facility_country', 'lab_test_id',
  'last_touch_date', 'lab_test_name', 'manufacturer_test_name', 'test_development', 'lab_id', 'condition_identifiers',
  'indication_types', 'inheritances', 'method_categories', 'methods', 'platforms', 'genes', 'drug_responses', 'now_current',
  'test_currStat', 'test_pubStat', 'lab_currStat', 'lab_pubStat', 'test_create_date', 'test_deletion_date', 'test_order_code',
];
export const CONDITION_GENE_COLUMNS = ['accession_version', 'test_type', 'object', 'GTR_identifier', 'MIM_number', 'object_name', 'gene_or_SNOMED_CT_ID', 'gene_symbol'];
export const METHOD_CATEGORY_COLUMNS = ['Major method category', 'Method category'];

const list = (s) => (s ? s.split('|').map((x) => x.trim()).filter(Boolean) : []);
const isCurrentPublic = (d) => d.now_current === '1' && d.test_currStat === '1' && d.test_pubStat === '3' && d.lab_currStat === '1' && d.lab_pubStat === '3';

/**
 * Devuelve `{ rows, counts }`: `rows` es un generador con SÓLO las filas vigentes y públicas
 * (criterio del README del FTP); `counts` se completa al consumirlo (`read`, `skipped`).
 */
export function parseTestVersion(text) {
  const counts = { read: 0, skipped: 0 };
  function* rows() {
    for (const d of objectsOf(iterDelimited(text, '\t'), TEST_VERSION_COLUMNS, 'GTR test_version')) {
      counts.read += 1;
      if (isCurrentPublic(d) && !d.test_deletion_date) yield d;
      else counts.skipped += 1;
    }
  }
  return { rows: rows(), counts };
}

/** Agrupa por accesión con versión. `test_condition_gene.txt` no entrecomilla nada: se lee con las mismas reglas. */
export function parseConditionGene(text) {
  const byAccession = new Map();
  for (const o of objectsOf(iterDelimited(text, '\t'), CONDITION_GENE_COLUMNS, 'GTR test_condition_gene', { headerPrefix: '#' })) {
    if (!byAccession.has(o.accession_version)) byAccession.set(o.accession_version, []);
    byAccession.get(o.accession_version).push(o);
  }
  return byAccession;
}

/** @returns {Map<string,string>} categoría de método → categoría mayor (jerarquía oficial de GTR). */
export function parseMethodCategories(text) {
  const rows = [...objectsOf(iterDelimited(text, '\t'), METHOD_CATEGORY_COLUMNS, 'GTR tests_by_method_category')];
  const map = new Map();
  for (const r of rows) {
    const prev = map.get(r['Method category']);
    if (prev && prev !== r['Major method category']) throw new Error(`Categoría de método «${r['Method category']}» bajo dos categorías mayores`);
    map.set(r['Method category'], r['Major method category']);
  }
  return map;
}

/** `testVersion` = salida de parseTestVersion. */
export function gtrRecords({ testVersion, conditionGene, methodCategories }, prov) {
  const records = [];
  const stats = { rowsRead: 0, notCurrentPublic: 0, current: 0, withLinks: 0, withoutLinks: 0, researchOnly: 0, methodCategoryNotInHierarchy: {}, byCountry: {} };
  const seen = new Set();
  for (const d of testVersion.rows) {
    stats.current += 1;
    const m = d.test_accession_ver.match(/^(GTR\d{9})\.(\d+)$/);
    if (!m) throw new Error(`Accesión GTR inesperada: ${d.test_accession_ver}`);
    const [, code, version] = m;
    if (seen.has(code)) throw new Error(`Accesión vigente repetida: ${code}`);
    seen.add(code);

    const links = conditionGene.get(d.test_accession_ver) ?? [];
    if (links.length) stats.withLinks += 1;
    else stats.withoutLinks += 1;
    const conditions = links.filter((x) => x.object === 'condition').map((x) => compact({ medgenCui: x.GTR_identifier, mimNumber: x.MIM_number, name: x.object_name }));
    const genes = links.filter((x) => x.object === 'gene').map((x) => compact({ geneId: x.gene_or_SNOMED_CT_ID, symbol: x.gene_symbol, medgenCui: x.GTR_identifier, mimNumber: x.MIM_number, name: x.object_name }));
    const testTypes = [...new Set(links.map((x) => x.test_type))];
    if (testTypes.length === 1 && testTypes[0] === 'Research') stats.researchOnly += 1;

    const methodCategories_ = list(d.method_categories);
    const majors = [];
    for (const c of methodCategories_) {
      const major = methodCategories.get(c);
      if (!major) stats.methodCategoryNotInHierarchy[c] = (stats.methodCategoryNotInHierarchy[c] ?? 0) + 1;
      else if (!majors.includes(major)) majors.push(major);
    }
    stats.byCountry[d.facility_country] = (stats.byCountry[d.facility_country] ?? 0) + 1;

    records.push({
      id: conceptIdFor(GTR_CODE_SYSTEM, code),
      codeSystem: GTR_CODE_SYSTEM,
      code,
      display: d.lab_test_name.trim(),
      definition: null,
      lang: 'en',
      selectable: true,
      status: 'active',
      category: null,
      domain: 'genetics',
      domainRule: `${GTR_CODE_SYSTEM}:registro-de-pruebas-geneticas`,
      properties: compact({
        gtr_accession_version: d.test_accession_ver,
        gtr_version: Number(version),
        gtr_test_type: testTypes.length ? (testTypes.length === 1 ? testTypes[0] : testTypes) : null,
        gtr_lab_test_id: d.lab_test_id,
        gtr_test_order_code: d.test_order_code,
        gtr_manufacturer_test_name: d.manufacturer_test_name,
        gtr_test_development: d.test_development,
        gtr_laboratory: compact({ id: d.lab_id, name: d.name_of_laboratory, institution: d.name_of_institution, state: d.facility_state, country: d.facility_country }),
        gtr_condition_names: list(d.condition_identifiers),
        gtr_conditions: conditions,
        gtr_gene_symbols: list(d.genes),
        gtr_genes: genes,
        gtr_indication_types: list(d.indication_types),
        gtr_inheritances: list(d.inheritances),
        gtr_major_method_categories: majors,
        gtr_method_categories: methodCategories_,
        gtr_methods: list(d.methods),
        gtr_platforms: list(d.platforms),
        gtr_drug_responses: list(d.drug_responses),
        gtr_created_at: d.test_create_date,
        gtr_last_touched_at: d.last_touch_date,
        lab_catalog_domain: 'genetics',
        lab_catalog_domain_rule: `${GTR_CODE_SYSTEM}:registro-de-pruebas-geneticas`,
      }),
      designations: [],
      relations: [],
      valueSets: [
        'lab-catalog-gtr-ncbi',
        'lab-catalog-domain-genetics',
        ...majors.map((x) => `lab-catalog-gtr-ncbi-major-${slugify(x)}`),
        ...methodCategories_.filter((c) => methodCategories.has(c)).map((c) => `lab-catalog-gtr-ncbi-method-${slugify(c)}`),
      ],
      valueSetLabels: Object.fromEntries([
        ...majors.map((x) => [`lab-catalog-gtr-ncbi-major-${slugify(x)}`, x]),
        ...methodCategories_.filter((c) => methodCategories.has(c)).map((c) => [`lab-catalog-gtr-ncbi-method-${slugify(c)}`, c]),
      ]),
      provenance: {
        source: GTR_CODE_SYSTEM,
        sourceName: prov.sourceName,
        sourceId: d.test_accession_ver,
        sourceVersion: prov.sourceVersion,
        sourceUrl: prov.sourceUrl,
        sourceFile: prov.sourceFile,
        sourceSha256: prov.sourceSha256,
        retrievedAt: prov.retrievedAt,
        license: prov.license,
      },
    });
  }
  stats.rowsRead = testVersion.counts.read;
  stats.notCurrentPublic = testVersion.counts.skipped;
  return { records, stats };
}
