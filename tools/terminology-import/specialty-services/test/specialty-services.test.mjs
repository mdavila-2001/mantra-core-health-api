// Pruebas del importador de servicios por especialidad: reglas, cruces y plan.
// Sin red ni base. Las muestras de `fixtures/` son filas reales de cada fuente.
//   node --test "tools/terminology-import/specialty-services/test/*.test.mjs"

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildCorpus, coverage } from '../lib/corpus.mjs';
import { batchPlans, boSourcePlan, buildPlan, codeSystemPlans } from '../lib/load-plan.mjs';
import { compileRules, loadModelSpecialties, loadRules, performerPhrases, referencedSpecialties } from '../lib/rules.mjs';
import { crossValidateCups, parseCupsCopyA, parseCupsCopyB, parseFonasa, verifyFonasaAgainstPdf } from '../lib/sources.mjs';

const FIX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const rules = loadRules();
const compiled = compileRules(rules);
const model = loadModelSpecialties();

const fonasaRows = parseFonasa(readFileSync(join(FIX, 'fonasa-mle-2026.sample.json'), 'utf8'));
const cupsA = parseCupsCopyA(readFileSync(join(FIX, 'cups-copy-a.sample.js'), 'utf8'));
const cupsB = parseCupsCopyB(readFileSync(join(FIX, 'cups-copy-b.sample.sql'), 'utf8'));

const specialtyOf = (source, display) => performerPhrases(compiled, source, display).map((p) => p.rule?.specialty);

test('toda especialidad que nombran las reglas existe en VS_MEDICAL_SPECIALTY del modelo', () => {
  const codes = new Set(model.specialties.map((s) => s.code));
  assert.equal(model.specialties.length, 63);
  for (const code of referencedSpecialties(rules)) assert.ok(codes.has(code), code);
});

test('la frase se busca entera: una subespecialidad no cae en la especialidad madre', () => {
  assert.deepEqual(specialtyOf('cups', 'CONSULTA DE PRIMERA VEZ POR ESPECIALISTA EN CARDIOLOGÍA PEDIÁTRICA'), ['CARDIOLOGIA_PEDIATRICA']);
  // Nefrología pediátrica no está en el modelo: hueco, NO Nefrología.
  assert.deepEqual(specialtyOf('cups', 'CONSULTA DE PRIMERA VEZ POR ESPECIALISTA EN NEFROLOGÍA PEDIÁTRICA'), [null]);
  assert.deepEqual(specialtyOf('cups', 'PSICOTERAPIA INDIVIDUAL POR PSIQUIATRÍA'), ['PSIQUIATRIA']);
});

test('FONASA: recortes declarados y nombres nacionales', () => {
  assert.deepEqual(specialtyOf('fonasa', 'CONSULTA MÉDICA DE ESPECIALIDAD EN PSIQUIATRÍA ADULTOS (1RA CONSULTA)'), ['PSIQUIATRIA']);
  assert.deepEqual(specialtyOf('fonasa', 'CONSULTA MÉDICA DE ESPECIALIDAD EN NEUROLOGÍA ADULTOS'), ['NEUROLOGIA']);
  assert.deepEqual(specialtyOf('fonasa', 'CONSULTA MÉDICA DE ESPECIALIDAD EN ENFERMEDADES RESPIRATORIAS ADULTO'), ['NEUMOLOGIA']);
  assert.deepEqual(specialtyOf('fonasa', 'CONSULTA MÉDICA DE ESPECIALIDAD EN ENFERMEDADES RESPIRATORIAS PEDIÁTRICAS'), [null]);
  assert.deepEqual(specialtyOf('fonasa', 'ATENCIÓN KINESIOLÓGICA INTEGRAL AMBULATORIA'), ['FISIOTERAPIA']);
});

test('una mención que no es de quien presta no cuenta', () => {
  // «no incluye honorarios médico cardiólogo»: el cardiólogo se excluye, no presta.
  assert.deepEqual(specialtyOf('fonasa', 'SPECT DE PERFUSIÓN MIOCÁRDICA ESTRÉS Y REPOSO (NO INCLUYE HONORARIOS MÉDICO CARDIÓLOGO)'), []);
  assert.deepEqual(specialtyOf('cups', 'DRENAJE DE ESPACIO SUBDURAL, POR CRANEOTOMÍA'), []);
});

test('CUPS: entra lo que las dos copias dicen igual; la A sola entra marcada; lo contradicho no', () => {
  const cross = crossValidateCups(cupsA, cupsB);
  const agreed = new Map(cross.agreed.map((r) => [r.code, r.display]));
  assert.equal(agreed.get('890239'), 'CONSULTA DE PRIMERA VEZ POR ESPECIALISTA EN CIRUGÍA PLÁSTICA, ESTÉTICA Y RECONSTRUCTIVA');
  assert.ok(agreed.has('010101'));
  assert.ok(!agreed.has('890262'), 'la B trunca «Medicina del Trabajo…»: se contradicen');
  assert.ok(cross.disagree.includes('013101'), 'la B arrastra el encabezado de página');
  assert.deepEqual(cross.onlyA.map((r) => r.code), ['890401']);
});

test('FONASA: la copia se rechaza si difiere del PDF oficial', () => {
  const pdf = [{ fuente: { sha256: 'x' }, prestaciones: [{ codigo: '03-01-002', nombre: 'otro nombre', valorClp: 1 }] }];
  const check = verifyFonasaAgainstPdf(fonasaRows, pdf);
  assert.equal(check.checked, 1);
  assert.equal(check.problems.length, 1);
});

test('corpus: grupo de una especialidad sí, grupo combinado sólo por descriptor, laboratorio excluido', () => {
  const corpus = buildCorpus(
    { fonasaRows, cupsAgreed: crossValidateCups(cupsA, cupsB).agreed, bo: { honorariosMedicos: [], arancelOdontologico: [] }, retrievedAt: '2026-10-24T00:00:00Z', transports: {} },
    compiled,
  );
  const byCode = new Map(corpus.records.map((r) => [r.code, r]));
  assert.deepEqual(byCode.get('1201001').evidence.map((e) => [e.specialty, e.basis]), [['OFTALMOLOGIA', 'source-section']]);
  assert.ok(!byCode.has('1701001'), 'grupo 17 es combinado y el descriptor no nombra a nadie');
  assert.ok(!byCode.has('0301002'), 'grupo 03 lo cubre la sesión de análisis');
  assert.deepEqual(byCode.get('2004010').evidence.map((e) => e.specialty).sort(), ['GINECOLOGIA_OBSTETRICIA', 'OBSTETRICIA']);
  assert.ok(corpus.excluded.some((e) => e.section.startsWith('Grupo 03')));
  for (const r of corpus.records) assert.ok(r.evidence.length > 0 && r.evidence.every((e) => e.specialty), r.code);

  const cov = coverage(corpus.records, model.specialties);
  assert.equal(cov.find((c) => c.code === 'CARDIOLOGIA').total, 2); // 0101006 (FONASA) + 890228 (CUPS)
});

test('plan: ids deterministas, una relación por especialidad y ningún mapeo entre nomencladores', () => {
  const corpus = buildCorpus(
    { fonasaRows, cupsAgreed: crossValidateCups(cupsA, cupsB).agreed, bo: { honorariosMedicos: [], arancelOdontologico: [] }, retrievedAt: 'x', transports: {} },
    compiled,
  );
  const ids = new Map(model.specialties.map((s) => [s.code, s.conceptId]));
  const display = new Map(model.specialties.map((s) => [s.code, s.display]));
  const a = buildPlan(corpus.records, ids, display);
  const b = buildPlan(corpus.records, ids, display);
  assert.deepEqual(a, b);
  assert.equal(a.relationships.length, corpus.records.reduce((n, r) => n + new Set(r.evidence.map((e) => e.specialty)).size, 0));
  assert.equal(new Set(a.relationships.map((t) => t[0])).size, a.relationships.length);
  assert.ok(!('conceptMaps' in a));
  assert.ok(a.valueSets.every((v) => v[1].startsWith('VS_SPECIALTY_SERVICES_')));
  const batches1 = batchPlans(corpus.records, codeSystemPlans(), boSourcePlan());
  const batches2 = batchPlans(corpus.records, codeSystemPlans(), boSourcePlan());
  assert.deepEqual(batches1.map((x) => x.id), batches2.map((x) => x.id));
});

test('plan: sin la especialidad en la base, la relación no se escribe y se informa', () => {
  const corpus = buildCorpus(
    { fonasaRows, cupsAgreed: [], bo: { honorariosMedicos: [], arancelOdontologico: [] }, retrievedAt: 'x', transports: {} },
    compiled,
  );
  const plan = buildPlan(corpus.records, new Map(), new Map());
  assert.equal(plan.relationships.length, 0);
  assert.ok(Object.keys(plan.unresolved).length > 0);
});

test('copia versionada: las partes .gz vuelven idénticas y se rechazan si alguien las altera', async () => {
  const { mkdtempSync, writeFileSync: write, readFileSync: read } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { writeGzParts, readGzParts } = await import('../lib/common.mjs');
  const dir = mkdtempSync(join(tmpdir(), 'specialty-services-'));
  const lines = ['{"a":1}', '{"b":"ñandú"}'];
  const parts = writeGzParts(dir, 'x', lines);
  assert.equal(parts.length, 1);
  assert.deepEqual(readGzParts(dir, parts), lines);
  // Mismo contenido, mismos bytes (gzip sin fecha): re-armar no ensucia el diff.
  assert.equal(writeGzParts(dir, 'x', lines)[0].sha256, parts[0].sha256);
  const file = join(dir, parts[0].file);
  const bytes = read(file);
  bytes[bytes.length - 1] ^= 0xff;
  write(file, bytes);
  assert.throws(() => readGzParts(dir, parts), /SHA-256/);
});
