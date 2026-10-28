// Pruebas del normalizador de los diccionarios del NCI en castellano.
// Fixtures: respuestas REALES de https://webapis.cancer.gov/glossary/v1/Terms/... del 2026-10-27.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NCI_DICTIONARIES, nciRow, termsUrl } from '../lib/glossary-es/nci.mjs';
import { assertRow } from '../lib/glossary-es/common.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FX = JSON.parse(readFileSync(join(HERE, 'fixtures', 'nci-glossary-es.json'), 'utf8'));
const prov = { retrievedAt: '2026-10-27T00:00:00.000Z' };
const cancer = NCI_DICTIONARIES[0];
const genetics = NCI_DICTIONARIES[2];

test('NCI cáncer: nombre y definición verbatim, nombre en inglés de la propia fuente, etiqueta oncológica', () => {
  const t = FX.cancerPatient[1];
  const row = assertRow(nciRow(t, cancer, prov));
  assert.equal(row.esName, t.termName);
  assert.equal(row.definition, t.definition.text.trim());
  assert.equal(row.enDisplay, t.otherLanguages.find((o) => o.language === 'en')?.termName ?? null);
  assert.equal(row.slug, `nci-cancer-${t.termId}`);
  assert.equal(row.codeSystem, 'nci-diccionario-cancer-es');
  assert.deepEqual(row.tagKeys, ['oncologic']);
  assert.equal(row.categoryKey, 'other');
  assert.equal(row.sourceUrl, `https://www.cancer.gov/espanol/publicaciones/diccionarios/diccionario-cancer/def/${t.prettyUrlName}`);
  assert.match(row.sourceLicense, /free of copyright/);
});

test('NCI cáncer: un medicamento con paréntesis y marca comercial conserva su texto intacto', () => {
  const t = FX.cancerPatient[0];
  const row = nciRow(t, cancer, prov);
  assert.equal(row.esName, '(S)-malato de cabozantinib');
  assert.ok(row.definition.includes('Cabometyx'));
});

test('NCI genética: sistema de códigos propio y sin etiquetas', () => {
  const t = FX.geneticsProf[0];
  const row = assertRow(nciRow(t, genetics, prov));
  assert.equal(row.codeSystem, 'nci-diccionario-genetica-es');
  assert.deepEqual(row.tagKeys, []);
  assert.match(row.sourceUrl, /diccionario-genetica\/def\//);
});

test('NCI: un término sin definición o sin nombre no genera fila (no se inventa)', () => {
  assert.equal(nciRow({ termId: 1, termName: 'x', definition: { html: '', text: '' } }, cancer, prov), null);
  assert.equal(nciRow({ termId: 2, termName: ' ', definition: { html: '<p>a</p>', text: 'a' } }, cancer, prov), null);
});

test('NCI: URL de lote', () => {
  assert.equal(termsUrl(cancer, 400, 200), 'https://webapis.cancer.gov/glossary/v1/Terms/Cancer.gov/Patient/es?size=200&from=400');
});

test('GLOSSARY_CIE_FULL=1 deja pasar todos los niveles de CIE-10-ES y suma la capa de procedimientos (opt-in)', async () => {
  const { isGlossaryDxLevel } = await import('../lib/glossary-es/taxonomy.mjs');
  const { defaultTermLayers } = await import('../lib/glossary-es/corpus.mjs');
  const before = process.env.GLOSSARY_CIE_FULL;
  try {
    delete process.env.GLOSSARY_CIE_FULL;
    assert.equal(isGlossaryDxLevel('S72.001A'), false);
    assert.ok(!defaultTermLayers().includes('cie10es-procedimientos'));
    process.env.GLOSSARY_CIE_FULL = '1';
    assert.equal(isGlossaryDxLevel('S72.001A'), true);
    assert.ok(defaultTermLayers().includes('cie10es-procedimientos'));
  } finally {
    if (before === undefined) delete process.env.GLOSSARY_CIE_FULL;
    else process.env.GLOSSARY_CIE_FULL = before;
  }
});
