// Contrato de §12.3 con fixtures REALES (CLAMOXYL nº reg. 50239 y Q175901 de Wikidata).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCimaArticle, buildCimaSection, buildWikidataArticle, validateArticle } from '../lib/article.mjs';
import { htmlToLines } from '../lib/blocks.mjs';
import { madridDay, slimVtm } from '../lib/corpus.mjs';
import { fx } from './helpers.mjs';

const seedRow = fx('seed-cima-vtm-27658006.json');
const vtm = slimVtm(fx('cima-vtm-27658006.json'));
const FICHA = '2025-06-07';
const sectionsInput = () => ({
  '4.1': { response: fx('cima-50239-4.1.json'), retrievedAt: '2026-10-08T00:00:00Z', fichaDate: FICHA },
  '4.3': { response: fx('cima-50239-4.3.json'), retrievedAt: '2026-10-08T00:00:00Z', fichaDate: FICHA },
  '4.5': { response: fx('cima-50239-4.5.json'), retrievedAt: '2026-10-08T00:00:00Z', fichaDate: FICHA },
  '4.8': { response: fx('cima-50239-4.8-recorte.json'), retrievedAt: '2026-10-08T00:00:00Z', fichaDate: FICHA },
  '5.1': { response: fx('cima-50239-5.1.json'), retrievedAt: '2026-10-08T00:00:00Z', fichaDate: FICHA },
});
const build = (sections = sectionsInput()) => buildCimaArticle({ seedRow, vtm, sections, listingDate: '2026-09-30', retrievedAt: '2026-09-30' });

test('cada sección lleva los seis campos de procedencia y el kind correcto', () => {
  const { article } = build();
  assert.deepEqual(article.sections.map((s) => s.kind), ['indications', 'contraindications', 'interactions', 'adverse_effects', 'pharmacologic_class', 'presentations']);
  for (const s of article.sections) {
    for (const f of ['source', 'sourceUrl', 'license', 'retrievedAt', 'sourceVersion', 'locator']) assert.ok(s[f], `${s.kind} sin ${f}`);
  }
  const c = article.sections.find((s) => s.kind === 'contraindications');
  assert.equal(c.locator, '4.3 Contraindicaciones');
  assert.equal(c.sourceVersion, FICHA);
  assert.equal(c.retrievedAt, '2026-10-08');
  assert.equal(c.sourceUrl, 'https://cima.aemps.es/cima/dochtml/ft/50239/4.3/FichaTecnica.html');
  assert.equal(c.nregistro, '50239');
});

test('la 4.3 publicada es LITERAL: las dos oraciones de la ficha, sin cambios', () => {
  const { article } = build();
  const c = article.sections.find((s) => s.kind === 'contraindications');
  assert.equal(
    c.text,
    'Hipersensibilidad al principio activo, a cualquiera de las penicilinas o a alguno de los excipientes incluidos en la sección 6.1.\n' +
      'Antecedentes de una reacción de hipersensibilidad inmediata grave (p. ej. anafilaxia) a otro agente beta-lactámico (p. ej. una cefalosporina, carbapenem o monobactámico).',
  );
  assert.equal(c.omittedSentences, undefined);
});

test('5.1 publica solo la línea «Grupo farmacoterapéutico», no el resto de la sección', () => {
  const { article } = build();
  const c = article.sections.find((s) => s.kind === 'pharmacologic_class');
  assert.match(c.text, /^Grupo farmacoterapéutico: penicilinas de amplio espectro; código ATC: J01CA04\.$/);
  assert.match(c.locator, /^5\.1 .*\(grupo farmacoterapéutico\)$/);
});

test('4.4 se publica como special_populations con el título oficial en locator (decisión pendiente en GAPS)', () => {
  const resp = [{ seccion: '4.4', titulo: 'Advertencias y precauciones especiales de empleo', contenido: '<p>Antes de iniciar el tratamiento se debe interrogar al paciente.</p>' }];
  const { section } = buildCimaSection({ seedRow, code: '4.4', response: resp, nregistro: '50239', fichaDate: FICHA, retrievedAt: '2026-10-08' });
  assert.equal(section.kind, 'special_populations');
  assert.equal(section.locator, '4.4 Advertencias y precauciones especiales de empleo');
});

test('una sección sin fecha de la ficha no se publica (el aviso legal de AEMPS exige la fecha)', () => {
  const { section, rejected } = buildCimaSection({ seedRow, code: '4.3', response: fx('cima-50239-4.3.json'), nregistro: '50239', fichaDate: null, retrievedAt: '2026-10-08' });
  assert.equal(section, null);
  assert.equal(rejected[0].reason, 'ficha-without-date');
});

test('una sección vacía o ausente en la fuente produce rechazo explícito, no texto de relleno', () => {
  const { section, rejected } = buildCimaSection({ seedRow, code: '4.6', response: null, nregistro: '50239', fichaDate: FICHA, retrievedAt: '2026-10-08' });
  assert.equal(section, null);
  assert.equal(rejected[0].reason, 'section-absent-in-source');
  assert.deepEqual(rejected[0].conceptRef, { system: 'cima-vtm', code: '27658006', slug: 'cima-vtm-27658006' });
});

test('idempotencia: la misma entrada produce exactamente la misma salida', () => {
  assert.equal(JSON.stringify(build()), JSON.stringify(build()));
});

test('presentations lista formas y vías, sin nombres de presentación (llevan la concentración)', () => {
  const { article } = build();
  const p = article.sections.find((s) => s.kind === 'presentations');
  assert.ok(p.items.length > 0);
  assert.ok(!/\d\s*mg/i.test(p.text));
  for (const i of p.items) assert.match(i, / — VÍA /);
});

test('imágenes de CIMA: máximo 4, hosts de la CSP, leyenda sin nombre comercial y alt genérico', () => {
  const { article } = build();
  assert.ok(article.images.length > 0 && article.images.length <= 4);
  for (const img of article.images) {
    assert.equal(new URL(img.url).hostname, 'cima.aemps.es');
    assert.equal(img.altTextQuality, 'generic');
    assert.equal(img.altText, 'Imagen de Amoxicilina');
    assert.match(img.caption, /^Foto de (envase|forma farmacéutica) del medicamento con nº de registro \d+$/);
  }
});

test('validateArticle: acepta el artículo real y rechaza violaciones del contrato', () => {
  const { article } = build();
  assert.doesNotThrow(() => validateArticle(structuredClone(article)));

  const noSource = structuredClone(article); delete noSource.sections[0].sourceVersion;
  assert.throws(() => validateArticle(noSource), /sourceVersion/);

  const badKind = structuredClone(article); badKind.sections[0].kind = 'history';
  assert.throws(() => validateArticle(badKind), /catálogo de fármacos/);

  const dup = structuredClone(article); dup.sections.push(structuredClone(dup.sections[0]));
  assert.throws(() => validateArticle(dup), /repetido/);

  const foreign = structuredClone(article); foreign.images[0].url = 'https://example.com/x.jpg';
  assert.throws(() => validateArticle(foreign), /fuera de la CSP/);

  const nc = structuredClone(article); nc.images[0] = { ...nc.images[0], license: 'CC BY-NC 4.0' };
  assert.throws(() => validateArticle(nc), /licencia de imagen no admitida/);

  const noRef = structuredClone(article); delete noRef.conceptRef.slug;
  assert.throws(() => validateArticle(noRef), /conceptRef/);
});

test('htmlToLines une los saltos de línea del código fuente y separa párrafos y celdas', () => {
  const lines = htmlToLines('<table><tr><td><p>Muy raras</p></td><td><p>Candidiasis\n mucocut&#225;nea.</p></td></tr></table>');
  assert.deepEqual(lines, ['Muy raras', 'Candidiasis mucocutánea.']);
});

test('fechas de la API: se cuentan en hora de Madrid, no en UTC', () => {
  assert.equal(madridDay(1785968827000), '2026-08-06'); // 2026-08-05T22:47:07Z = 00:47 del día 6 en Madrid
  assert.equal(madridDay('2025-06-06T23:03:43.000Z'), '2025-06-07');
  assert.equal(madridDay(null), null);
});

// --- Sustancias de Wikidata (CC0) ----------------------------------------

test('artículo de una sustancia: descripción CC0, clase P2868 y facts con identificadores', () => {
  const seed = fx('seed-wikidata-medicamento-q175901.json');
  const entity = fx('wikidata-entity-Q175901.json');
  const classLabels = fx('wikidata-class-labels.json');
  const { article } = buildWikidataArticle({ seedRow: seed, entity, classLabels, images: [], retrievedAt: '2026-10-08T00:00:00Z' });
  const def = article.sections.find((s) => s.kind === 'definition');
  assert.equal(def.text, 'hormona esteroide');
  assert.equal(def.license, 'CC0 1.0 (dominio público)');
  assert.equal(def.sourceVersion, '2026-06-19');
  assert.equal(def.sourceUrl, 'https://www.wikidata.org/wiki/Q175901');
  const labels = Object.fromEntries(article.facts.map((f) => [f.label, f.value]));
  assert.equal(labels['Código ATC'], 'G03DA03');
  assert.match(labels['Identificador DrugBank (solo identificador)'], /^DB\d+$/);
  assert.ok(article.facts.every((f) => f.source === 'wikidata'));
  assert.doesNotThrow(() => validateArticle(structuredClone(article)));
});

test('una sustancia sin descripción en castellano no recibe sección definition inventada', () => {
  const seed = fx('seed-wikidata-medicamento-q175901.json');
  const entity = structuredClone(fx('wikidata-entity-Q175901.json'));
  delete entity.descriptions.es;
  const { article, rejected } = buildWikidataArticle({ seedRow: seed, entity, classLabels: {}, images: [], retrievedAt: '2026-10-08T00:00:00Z' });
  assert.ok(!article.sections.some((s) => s.kind === 'definition'));
  assert.ok(rejected.some((r) => r.reason === 'no-spanish-description'));
});
