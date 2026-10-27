// Pruebas del lector delimitado y del parser de NCBI GTR, contra recortes REALES
// de los archivos de ftp.ncbi.nlm.nih.gov/pub/GTR/data (descargados el 2026-10-27;
// ver test/fixtures/gtr/README.md). Corren con: node --test tools/terminology-import/lab-tests/test/*.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { parseDelimited } from '../lib/delimited.mjs';
import { GTR_CODE_SYSTEM, gtrRecords, parseConditionGene, parseMethodCategories, parseTestVersion } from '../lib/gtr.mjs';
import { buildPlan, planSummary } from '../lib/load-plan.mjs';
import { assertRecord, conceptIdFor } from '../lib/records.mjs';

const F = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'gtr');
const read = (n) => readFileSync(join(F, n), 'utf8');
const PROV = { sourceName: 'GTR (prueba)', sourceVersion: 'GTR 2026-10-22', sourceUrl: 'https://ftp.ncbi.nlm.nih.gov/pub/GTR/data/test_version.gz', sourceFile: 'f', sourceSha256: 's', retrievedAt: '2026-10-27T00:00:00.000Z', license: 'Dominio público (NCBI)' };

function build() {
  return gtrRecords(
    { testVersion: parseTestVersion(read('test_version.sample.tsv')), conditionGene: parseConditionGene(read('test_condition_gene.sample.txt')), methodCategories: parseMethodCategories(read('tests_by_method_category.txt')) },
    PROV,
  );
}

test('parseDelimited: comillas, delimitador y salto dentro de comillas, CRLF y última fila sin salto', () => {
  assert.deepEqual(parseDelimited('a\t"b\tc"\t"d""e"\r\nx\t\ty\nlast\t1', '\t'), [['a', 'b\tc', 'd"e'], ['x', '', 'y'], ['last', '1']]);
  assert.deepEqual(parseDelimited('a,"l1\nl2",c\n', ','), [['a', 'l1\nl2', 'c']]);
  assert.deepEqual(parseDelimited('a\t\n', '\t'), [['a', '']]);
  assert.deepEqual(parseDelimited('', '\t'), []);
  assert.throws(() => parseDelimited('a\t"sin cerrar', '\t'), /Comillas sin cerrar/);
});

test('GTR: sólo las pruebas vigentes y públicas; las versiones viejas, las de estado 72 y las no públicas se cuentan', () => {
  const { records, stats } = build();
  assert.equal(stats.rowsRead, 11);
  assert.equal(stats.current, 8);
  assert.equal(stats.notCurrentPublic, 3);
  assert.equal(records.length, 8);
  const codes = records.map((r) => r.code);
  assert.ok(!codes.includes('GTR000004034'), 'una versión vieja (now_current=0) no entra');
  assert.ok(!codes.includes('GTR000004062'), 'test_currStat=72 no entra');
  assert.ok(!codes.includes('GTR000004822'), 'test_pubStat=4 no entra');
});

test('GTR: la prueba simple conserva nombre, versión, laboratorio, condición y gen tal como los publica la fuente', () => {
  const r = build().records.find((x) => x.code === 'GTR000004006');
  assert.equal(r.display, 'Fragile X syndrome');
  assert.equal(r.codeSystem, GTR_CODE_SYSTEM);
  assert.equal(r.properties.gtr_accession_version, 'GTR000004006.1');
  assert.equal(r.properties.gtr_version, 1);
  assert.deepEqual(r.properties.gtr_laboratory, { id: '1024', name: 'Center for Human Genetics, Inc', state: 'Massachusetts', country: 'United States' });
  assert.deepEqual(r.properties.gtr_conditions, [{ medgenCui: 'C0016667', mimNumber: '300624', name: 'Fragile X syndrome' }]);
  assert.deepEqual(r.properties.gtr_genes, [{ geneId: '2332', symbol: 'FMR1', medgenCui: 'C1414649', mimNumber: '309550', name: 'FMR1:fragile X messenger ribonucleoprotein 1' }]);
  assert.deepEqual(r.properties.gtr_method_categories, ['Methylation analysis', 'Targeted variant analysis']);
  assert.deepEqual(r.properties.gtr_major_method_categories, ['Molecular Genetics']);
  assert.equal(r.domain, 'genetics');
  assert.equal(r.id, conceptIdFor(GTR_CODE_SYSTEM, 'GTR000004006'));
  assert.equal(r.provenance.sourceId, 'GTR000004006.1');
});

test('GTR: no se cargan SNOMED CT, CLIA, licencias estatales, código postal ni datos de personas', () => {
  const text = JSON.stringify(build().records);
  assert.ok(!/snomed/i.test(text), 'ningún identificador SNOMED');
  assert.ok(!/613003/.test(read('test_condition_gene.sample.txt').split('\n').filter((l) => l.startsWith('GTR000004006.1\tClinical\tgene'))[0] ?? ''), 'el SNOMED de la condición no está en la fila de gen');
  for (const k of ['CLIA', 'clia', 'postcode', 'state_license', 'email', 'phone']) assert.ok(!text.includes(k), `no debe aparecer ${k}`);
  assert.ok(!/@/.test(text.replace(/@@/g, '')), 'ningún correo');
});

test('GTR: tipo de prueba (Clinical/Research) sale del archivo de condiciones y genes, no se infiere', () => {
  const byCode = Object.fromEntries(build().records.map((r) => [r.code, r]));
  assert.equal(byCode.GTR000005914.properties.gtr_test_type, 'Research');
  assert.equal(byCode.GTR000004006.properties.gtr_test_type, 'Clinical');
});

test('GTR: una prueba con muchos genes los conserva todos (el orden de los dos archivos no coincide: no se asume)', () => {
  const r = build().records.find((x) => x.code === 'GTR000506312');
  assert.equal(r.properties.gtr_genes.length, 43);
  assert.equal(r.properties.gtr_gene_symbols.length, 43);
  const a = r.properties.gtr_genes.map((g) => g.symbol).sort();
  const b = [...r.properties.gtr_gene_symbols].sort();
  assert.equal(a.length, b.length);
  // Dato real: la columna `genes` de test_version dice TAZ y test_condition_gene dice TAFAZZIN (símbolo vigente en NCBI Gene).
  // Por eso se conservan las dos y no se unifica ninguna.
  assert.deepEqual(a.filter((x) => !b.includes(x)), ['TAFAZZIN']);
  assert.deepEqual(b.filter((x) => !a.includes(x)), ['TAZ']);
});

test('GTR: el texto con codificación dañada en origen se conserva verbatim (no se «repara»)', () => {
  const r = build().records.find((x) => x.code === 'GTR000500480');
  const methods = r.properties.gtr_methods.join(' | ');
  assert.ok(methods.includes('â„¢') || r.properties.gtr_laboratory.name.includes('â'), 'el recorte real trae ™ doblemente codificado: se deja como lo publica NCBI');
});

test('GTR: cada registro cumple el contrato común, trae procedencia completa y value sets conocidos', () => {
  const { records } = build();
  records.forEach(assertRecord);
  for (const r of records) {
    assert.ok(r.valueSets.includes('lab-catalog-gtr-ncbi') && r.valueSets.includes('lab-catalog-domain-genetics'));
    for (const vs of r.valueSets.filter((v) => /-(major|method)-/.test(v))) assert.ok(r.valueSetLabels[vs], `etiqueta para ${vs}`);
    assert.equal(r.provenance.license, PROV.license);
  }
});

test('GTR: el plan de carga arma conceptos, propiedades y value sets sin tocar ninguna base', () => {
  const { records } = build();
  const plan = buildPlan([{ layer: 'gtr-ncbi', records, meta: { codeSystems: [{ internalCode: GTR_CODE_SYSTEM, name: 'GTR', canonicalUrl: 'https://www.ncbi.nlm.nih.gov/gtr/', version: 'GTR 2026-10-22', sourceKey: 'gtr-ncbi' }] } }]);
  const s = planSummary(plan);
  assert.equal(s.concepts, 8);
  assert.ok(s.properties > 8 * 10);
  assert.ok(plan.valueSets.some((v) => v.code === 'lab-catalog-gtr-ncbi-major-molecular-genetics'));
  assert.ok(plan.valueSets.find((v) => v.code === 'lab-catalog-gtr-ncbi-method-enzyme-assay').name.includes('Enzyme assay'));
});

test('GTR: jerarquía oficial de categorías de método (categorías bajo 4 mayores)', () => {
  const m = parseMethodCategories(read('tests_by_method_category.txt'));
  assert.deepEqual([...new Set(m.values())].sort(), ['Biochemical Genetics', 'Cytogenetics', 'Molecular Genetics', 'Serology']);
  assert.equal(m.get('Karyotyping'), 'Cytogenetics');
  assert.equal(m.get('Enzyme assay'), 'Biochemical Genetics');
});

test('GTR: una cabecera con columnas distintas aborta mostrando la real (no se lee a ciegas)', () => {
  assert.throws(() => [...parseTestVersion('a\tb\n1\t2\n').rows], /faltan columnas .*cabecera real: a \| b/);
  assert.throws(() => parseConditionGene('x\ty\n1\t2\n'), /faltan columnas/);
});
