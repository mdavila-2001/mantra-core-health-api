// CUPS 2025 (Resolución 2706 de 2025): parser contra recortes REALES del texto del PDF oficial
// (`pdftotext -raw`, ver fixtures/README.md). Sin red ni base.
//   node --test "tools/terminology-import/specialty-services/test/*.test.mjs"

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildCorpus } from '../lib/corpus.mjs';
import { checkCups2025, parseCups2025 } from '../lib/cups2025.mjs';
import { compileRules, loadRules, performerPhrases } from '../lib/rules.mjs';
import { SOURCES } from '../lib/sources.mjs';

const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const raw = readFileSync(join(FIX, 'cups2025-anexo2.raw-excerpt.txt'), 'utf8');
const { rows, chapters, sections } = parseCups2025(raw);
const byCode = new Map(rows.map((r) => [r.code, r]));
const compiled = compileRules(loadRules());

test('jerarquía: capítulo, categoría, subcategoría, grupo y procedimiento; sin encabezados de página', () => {
  assert.deepEqual(chapters, [{ code: '01', name: 'SISTEMA NERVIOSO' }]);
  assert.deepEqual(sections, [{ code: '00', name: 'PROCEDIMIENTOS QUIRÚRGICOS E INTERVENCIONISTAS' }]);
  assert.equal(byCode.get('01.').level, 'category');
  assert.equal(byCode.get('01.').display, 'PROCEDIMIENTOS EN CRÁNEO, CEREBRO Y MENINGES CEREBRALES');
  assert.equal(byCode.get('01.0.').level, 'subcategory');
  assert.equal(byCode.get('01.0.1.').level, 'group');
  assert.equal(byCode.get('01.0.1.01').level, 'procedure');
  assert.equal(byCode.get('01.0.1.01').display, 'PUNCIÓN CISTERNAL, VÍA LATERAL');
  for (const r of rows) assert.doesNotMatch(r.display, /Hoja No|Resolución número|CÓDIGO DESCRIPCIÓN/);
  assert.deepEqual(checkCups2025(rows).filter((p) => !/sin grupo|sin descripción/.test(p)), []);
});

test('descripciones de varios renglones y notas Incluye/Excluye/Simultáneo', () => {
  assert.equal(byCode.get('01.0.2.01').display, 'PUNCIÓN (ASPIRACIÓN DE LÍQUIDO) VENTRICULAR A TRAVÉS DE CATÉTER PREVIAMENTE IMPLANTADO');
  assert.deepEqual(byCode.get('01.1.3.01').notes, [{ kind: 'Simultáneo', text: 'AYUDA DE IMÁGENES DIAGNÓSTICAS (87. - 88.)' }]);
  assert.equal(byCode.get('01.1.3.02').notes[0].kind, 'Incluye');
  assert.match(byCode.get('01.1.3.02').notes[0].text, /^BIOPSIA DE REGIÓN PINEAL, TÁLAMO, CEREBELO O TALLO CEREBRAL$/);
});

test('una nota que cita códigos al inicio de un renglón no crea filas', () => {
  // «… SUBCATEGORÍAS 89.0.2.17 A / 89.0.2.24 Y 89.0.2.36»: 89.0.2.24 es la fila real de Rehabilitación oral, una sola vez
  assert.equal(rows.filter((r) => r.code === '89.0.2.24').length, 1);
  assert.equal(byCode.get('89.0.2.24').display, 'CONSULTA DE PRIMERA VEZ POR ESPECIALISTA EN REHABILITACIÓN ORAL');
  assert.match(byCode.get('89.0.2.04').notes[0].text, /89\.0\.2\.17 A 89\.0\.2\.24 Y 89\.0\.2\.36$/);
  // rango «89.0.3.25 - 89.0.3.94»
  assert.equal(rows.filter((r) => r.code === '89.0.3.25').length, 0);
  assert.ok(rows.some((r) => r.notes.some((n) => /89\.0\.3\.25 - 89\.0\.3\.94$/.test(n.text))), 'el rango queda dentro de la nota');
  // «89.0.4.24 Y / 89.0.4.36» y «97.7. Y 97.8.)»
  assert.equal(byCode.get('89.0.4.36').display, 'INTERCONSULTA POR ESPECIALISTA EN CIRUGÍA MAXILOFACIAL');
  assert.equal(rows.filter((r) => r.code === '97.7.').length, 1);
});

test('prestador: las reglas de CUPS sirven a CUPS 2025; lo que el modelo no tiene queda como hueco', () => {
  const spec = (display) => performerPhrases(compiled, 'cups2025', display).map((p) => p.rule?.specialty);
  assert.deepEqual(spec(byCode.get('89.0.2.24').display), ['REHABILITACION_ORAL']);
  assert.deepEqual(spec(byCode.get('89.0.4.36').display), [null]); // «Cirugía maxilofacial»: el modelo tiene dos códigos, no se elige
  assert.deepEqual(spec('PUNCIÓN CISTERNAL, VÍA LATERAL'), []);
});

test('corpus: CUPS 2025 aporta servicios con evidencia de descriptor y estado «official»', () => {
  const bo = { honorariosMedicos: [], arancelOdontologico: [] };
  const corpus = buildCorpus({ fonasaRows: [], cupsAgreed: [], cups2025Rows: rows, bo, retrievedAt: '2026-10-27T00:00:00.000Z', transports: { cups2025: { kind: 'official-pdf' } } }, compiled);
  const ids = corpus.records.map((r) => r.code);
  assert.ok(ids.includes('89.0.2.24'));
  assert.ok(!ids.includes('01.0.1.01'), 'un procedimiento sin prestador en el descriptor no entra');
  assert.ok(!ids.includes('89.0.2.04'), 'una categoría no entra');
  const r = corpus.records.find((x) => x.code === '89.0.2.24');
  assert.equal(r.codeSystem, SOURCES.cups2025.codeSystem);
  assert.equal(r.reviewStatus, 'official');
  assert.deepEqual(r.evidence.map((e) => [e.specialty, e.basis]), [['REHABILITACION_ORAL', 'descriptor']]);
  assert.ok(corpus.gaps.some((g) => g.source === 'cups2025' && g.phrase === 'CIRUGIA MAXILOFACIAL'));
  assert.equal(corpus.unmatched.length, 0);
  // el hash del corpus no depende de la fecha de descarga: los registros no llevan `retrievedAt`
  assert.ok(!JSON.stringify(corpus.records).includes('retrievedAt'));
});
