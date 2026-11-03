// node --test tools/study-catalogs/test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DATA_DIR, FILES, LOCAL_KEYS, classify, readCatalogs } from '../lib/catalogs.mjs';
import { validate } from '../check-study-catalogs.mjs';
import { BOOT, buildPlan, planSummary } from '../lib/plan.mjs';

const cat = readCatalogs();

/** Copia los JSON a un directorio temporal, aplica `mutate` y recalcula SHA256SUMS. */
function broken(mutate) {
  const dir = mkdtempSync(join(tmpdir(), 'study-catalogs-'));
  for (const f of FILES) cpSync(join(DATA_DIR, f), join(dir, f));
  const lab = JSON.parse(readFileSync(join(dir, 'laboratorio.json'), 'utf8'));
  const img = JSON.parse(readFileSync(join(dir, 'imagenologia.json'), 'utf8'));
  const reg = JSON.parse(readFileSync(join(dir, 'regiones-cuerpo-3d.json'), 'utf8'));
  mutate({ lab, img, reg });
  writeFileSync(join(dir, 'laboratorio.json'), JSON.stringify(lab));
  writeFileSync(join(dir, 'imagenologia.json'), JSON.stringify(img));
  writeFileSync(join(dir, 'regiones-cuerpo-3d.json'), JSON.stringify(reg));
  const sums = FILES.map((f) => `${createHash('sha256').update(readFileSync(join(dir, f))).digest('hex')}  ${f}`).join('\n');
  writeFileSync(join(dir, 'SHA256SUMS'), `${sums}\n`);
  return readCatalogs(dir);
}

test('los catálogos versionados validan sin errores', () => {
  const { errors } = validate(cat);
  assert.deepEqual(errors, []);
});

test('un JSON alterado sin actualizar SHA256SUMS se rechaza', () => {
  const dir = mkdtempSync(join(tmpdir(), 'study-catalogs-'));
  for (const f of [...FILES, 'SHA256SUMS']) cpSync(join(DATA_DIR, f), join(dir, f));
  writeFileSync(join(dir, 'laboratorio.json'), `${readFileSync(join(dir, 'laboratorio.json'), 'utf8')} `);
  assert.throws(() => readCatalogs(dir), /SHA-256/);
});

test('detecta referencias rotas, duplicados, códigos mal formados y regiones 3D huérfanas', () => {
  const c = broken(({ lab, img, reg }) => {
    lab.analisis[0].seccion = 'NO_EXISTE';
    lab.analisis[1].muestra = 'NO_EXISTE';
    lab.analisis[2].codigo = lab.analisis[3].codigo;
    lab.analisis[4].codigo = 'minuscula';
    img.estudios[0].modalidad = 'NO_EXISTE';
    img.estudios[1].region = 'NO_EXISTE';
    img.regiones[5].padre = 'NO_EXISTE';
    reg.regiones.pop();
  });
  const { errors } = validate(c);
  for (const re of [/sección inexistente/, /muestra inexistente/, /código duplicado/, /MAYUSCULAS_SNAKE/, /modalidad inexistente/, /región inexistente/, /padre inexistente/, /no figura en regiones-cuerpo-3d/]) {
    assert.ok(errors.some((e) => re.test(e)), `falta el error ${re}`);
  }
});

test('un ciclo en la jerarquía de regiones se detecta', () => {
  const c = broken(({ img }) => {
    const [a, b] = img.regiones.filter((r) => r.padre);
    a.padre = b.codigo;
    b.padre = a.codigo;
  });
  assert.ok(validate(c).errors.some((e) => /ciclo|su propio padre/.test(e)));
});

test('nada marcado verificar se siembra: 121 omitidos y ninguno figura en el plan', () => {
  const { pending, labSeed, imgSeed } = classify(cat);
  assert.equal(pending.length, 121);
  const seeded = new Set([...labSeed.map((a) => a.codigo), ...imgSeed.map((e) => e.codigo)]);
  for (const a of cat.lab.analisis) if (a.verificar === true || a.verificar_composicion === true) assert.ok(!seeded.has(a.codigo), a.codigo);
  for (const e of cat.img.estudios) if (e.verificar === true) assert.ok(!seeded.has(e.codigo), e.codigo);
  for (const a of labSeed) for (const comp of a.componentes) assert.notEqual(comp.verificar, true);
  // un estudio con LOINC sin verificar se siembra sin LOINC (la identidad RadLex sí está verificada)
  for (const e of cat.img.estudios) if (e.verificar_loinc === true) assert.equal(imgSeed.find((x) => x.codigo === e.codigo)?.loinc ?? null, null);
});

/** Mapas mínimos de los conceptos que la API ya sembró. */
function fakeWorld() {
  const existing = new Map(Object.keys(LOCAL_KEYS.studies).map((c) => [c, `00000000-0000-4000-8000-${String(Math.abs([...c].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 7))).padStart(12, '0')}`]));
  const specimens = new Map(Object.keys(LOCAL_KEYS.specimens).map((c) => [c, `11111111-0000-4000-8000-${String(Math.abs([...c].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, 3))).padStart(12, '0')}`]));
  return { existing, specimens };
}

test('el plan es determinista, sin ids repetidos y con evidencia por cada relación', () => {
  const { existing, specimens } = fakeWorld();
  const a = buildPlan(cat, existing, specimens);
  const b = buildPlan(cat, existing, specimens);
  assert.deepEqual(planSummary(a), planSummary(b));
  assert.deepEqual([...a.concepts.keys()], [...b.concepts.keys()]);
  const uniq = (xs, what) => assert.equal(new Set(xs).size, xs.length, `ids repetidos en ${what}`);
  uniq(a.designations.map((d) => d[0]), 'designaciones');
  uniq(a.properties.map((p) => p[0]), 'propiedades');
  uniq(a.evidence.map((e) => e.id), 'evidencia');
  for (const r of a.relationships.values()) {
    const ev = a.evidence.filter((e) => e.relationshipId === r.id);
    assert.ok(ev.length >= 1, 'relación sin evidencia');
    assert.equal(ev.length, r.evidenceCount);
    assert.ok(ev.every((e) => e.citationLocator && e.sourceReference.endsWith(`@${cat.lab.version}`)));
  }
  const s = planSummary(a);
  assert.equal(s.omitidos, 121);
  assert.equal(s.reutilizados, 71); // 47 LAB_ + 27 IMG_ menos 3 omitidos por verificar
});

test('los 47 LAB_ y 27 IMG_ existentes se reutilizan, no se duplican', () => {
  const { existing, specimens } = fakeWorld();
  const p = buildPlan(cat, existing, specimens);
  const ids = new Set(existing.values());
  for (const c of p.concepts.values()) assert.ok(!ids.has(c.id), `${c.code} duplica un concepto existente`);
  // un código_api_existente que no está sembrado detiene la carga
  existing.delete('LAB_HEMOGRAMA');
  assert.throws(() => buildPlan(cat, existing, specimens), /LAB_HEMOGRAMA/);
});

test('part-of va componente -> panel con ordinal 1..n; has-modality y has-body-site una por estudio', () => {
  const { existing, specimens } = fakeWorld();
  const p = buildPlan(cat, existing, specimens);
  const partOf = [...p.relationships.values()].filter((r) => r.typeId === BOOT.REL_PART_OF);
  const esperados = classify(cat).labSeed.reduce((n, a) => n + a.componentes.length, 0);
  assert.equal(partOf.length, esperados);
  assert.equal(esperados, 280);
  const byPanel = new Map();
  for (const r of partOf) byPanel.set(r.target, [...(byPanel.get(r.target) ?? []), r.ordinal]);
  for (const ords of byPanel.values()) assert.deepEqual([...ords].sort((x, y) => x - y), ords.map((_, i) => i + 1));
  const hasMod = [...p.relationships.values()].filter((r) => r.typeId === BOOT.REL_HAS_MODALITY);
  const hasSite = [...p.relationships.values()].filter((r) => r.typeId === BOOT.REL_HAS_BODY_SITE);
  assert.equal(hasMod.length, 444);
  assert.equal(hasSite.length, 444);
});

test('ORINA_24H sugiere la muestra de 24 h (UR24) y no la orina simple', () => {
  const { existing, specimens } = fakeWorld();
  const p = buildPlan(cat, existing, specimens);
  const ur24 = specimens.get('UR24');
  const hits = [...p.relationships.values()].filter((r) => r.typeId === BOOT.REL_SUGGESTED_SPECIMEN && r.target === ur24);
  assert.ok(hits.length > 0);
  const labs24 = cat.lab.analisis.filter((a) => a.muestra === 'ORINA_24H' && !a.verificar && !a.verificar_composicion).length;
  assert.equal(hits.length, labs24);
});
