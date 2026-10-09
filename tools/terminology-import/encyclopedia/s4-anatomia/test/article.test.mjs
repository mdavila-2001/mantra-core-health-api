// Pruebas del ensamblado de artículos y de la canalización completa.
// Fixtures: ítems REALES de Wikidata (Q9597 «abdomen», Q1071481 «respiración
// periódica»; recortados a las propiedades que el código lee), su nodo HPO, sus
// descriptores MeSH, la respuesta de Commons y 11 filas reales de la semilla.
// Correr: node --test "tools/terminology-import/encyclopedia/s4-anatomia/test/*.test.mjs"

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assembleArticle } from '../lib/article.mjs';
import { labelMapOf } from '../lib/cache-reader.mjs';
import { parseCommonsResponse } from '../lib/commons.mjs';
import { parseHpoJson } from '../lib/hpo.mjs';
import { parseMeshBindings } from '../lib/mesh.mjs';
import { runPipeline } from '../lib/pipeline.mjs';
import { validateSection } from '../lib/contract.mjs';

const FX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const fx = (f) => JSON.parse(readFileSync(join(FX, f), 'utf8'));
const seedRows = fx('seed-rows.json');
const row = (slug) => seedRows.find((r) => r.slug === slug);

const wd = fx('wikidata-entities.json');
const entities = new Map(Object.entries(wd.entities));
const hpoFx = fx('hpo-excerpt.json');
const ctx = {
  entities,
  labels: labelMapOf(entities, new Map(Object.entries(wd.referenced))),
  props: labelMapOf(new Map(Object.entries(wd.properties))),
  hpo: { version: '2026-09-01', terms: parseHpoJson({ graphs: [{ nodes: [hpoFx.node] }] }) },
  mesh: parseMeshBindings(fx('mesh-bindings.json')),
  commons: parseCommonsResponse(fx('commons-response.json')),
  retrievedAt: '2026-10-08',
};

test('anatomía (Abdomen): definición literal de Wikidata, MeSH, estructura, imagen CC BY y TA98', () => {
  const { article, rejections } = assembleArticle(row('wikidata-anatomia-q9597'), ctx);
  assert.deepEqual(article.conceptRef, { system: 'wikidata-anatomia', code: 'Q9597', slug: 'wikidata-anatomia-q9597' });
  const definition = article.sections.filter((s) => s.kind === 'definition');
  assert.equal(definition[0].text, 'cavidad del cuerpo humano, situada entre el tórax y la pelvis');
  assert.equal(definition[0].lang, 'es');
  assert.equal(definition[0].source, 'wikidata');
  assert.match(definition[0].sourceVersion, /^revisión \d+ \(\d{4}-\d{2}-\d{2}\)$/);
  const mesh = definition.find((s) => s.source === 'nlm-mesh');
  assert.equal(mesh.text, 'That portion of the body that lies between the THORAX and the PELVIS.');
  assert.equal(mesh.lang, 'en');
  assert.match(mesh.locator, /Courtesy of the U\.S\. National Library of Medicine/);
  const structure = article.sections.find((s) => s.kind === 'structure');
  assert.ok(structure.items.includes('ombligo'));
  assert.equal(structure.sourceUrl, 'https://www.wikidata.org/wiki/Q9597#P527');
  assert.equal(article.images.length, 1);
  assert.equal(article.images[0].license, 'CC BY 3.0');
  assert.ok(article.facts.some((f) => f.label.includes('TA98') && f.value === 'A01.1.00.016'));
  assert.equal(rejections.filter((r) => r.level !== 'image').length, 0);
});

test('toda sección producida cumple el contrato (seis campos de procedencia, catálogo, sin dosis)', () => {
  for (const slug of ['wikidata-anatomia-q9597', 'cie10es-dx-r06-3']) {
    const r = row(slug);
    const { article } = assembleArticle(r, ctx);
    for (const section of article.sections) assert.deepEqual(validateSection(section, r.categoryKey), [], `${slug}/${section.kind}`);
  }
});

test('síntoma (R06.3): HPO en inglés literal, con equivalencia declarada por Wikidata y la etiqueta inglesa de hp.json', () => {
  const { article } = assembleArticle(row('cie10es-dx-r06-3'), ctx);
  const hpo = article.sections.find((s) => s.source === 'hpo');
  assert.equal(hpo.lang, 'en');
  assert.equal(hpo.sourceVersion, 'HPO 2026-09-01');
  assert.equal(hpo.text, hpoFx.node.meta.definition.val);
  assert.match(hpo.locator, /HP:0012196 «Cheyne-Stokes respiration»/);
  assert.ok(!hpo.locator.includes('Respiración'), 'la traducción sin licencia declarada no se usa');
  assert.equal(article.facts[0].label, 'Código CIE-10-ES');
  assert.match(article.facts[0].source, /Ministerio de Sanidad .*tabla de referencia del 2025-05-22/);
  assert.equal(article.images[0].kind, 'diagram');
});

test('HPO cuya etiqueta no concuerda con el ítem NO se publica y queda registrado', () => {
  const other = { ...hpoFx.node, lbl: 'Hypogeusia', meta: { ...hpoFx.node.meta, synonyms: [] } };
  const mismatch = { ...ctx, hpo: { ...ctx.hpo, terms: parseHpoJson({ graphs: [{ nodes: [other] }] }) } };
  const { article, rejections } = assembleArticle(row('cie10es-dx-r06-3'), mismatch);
  assert.ok(!article.sections.some((s) => s.source === 'hpo'));
  assert.ok(rejections.some((r) => r.reason === 'hpo-etiqueta-no-concuerda'));
});

test('texto curado interno (sin procedencia externa) no se publica: va a rechazados', () => {
  const { article, rejections } = assembleArticle(row('cefalea'), ctx);
  assert.equal(article, null);
  assert.equal(rejections[0].reason, 'sin-fuente-externa');
  assert.equal(rejections[0].level, 'article');
});

test('INLASA: solo código y nombre oficial, NUNCA el arancel; sale retenido por licencia sin verificar', () => {
  const { article, hold } = assembleArticle(row('inlasa-lac-001'), ctx);
  assert.equal(hold, 'licencia-no-verificada:inlasa');
  assert.deepEqual(article.sections, []);
  assert.deepEqual(article.facts.map((f) => [f.label, f.value]), [
    ['Código INLASA', 'LAC-001'],
    ['Nombre oficial (INLASA)', 'ÁCIDO ÚRICO'],
    ['Área o laboratorio (INLASA)', 'LAB. DE ANÁLISIS CLÍNICO'],
  ]);
  assert.ok(!JSON.stringify(article).includes('43'), 'el precio (43 Bs.) no debe aparecer');
  assert.ok(!/arancel|precio|Bs\./i.test(article.facts.map((f) => f.value).join(' ')));
});

test('CIE-10-ES con definición de MedlinePlus por «mismo concepto» la conserva con su cita', () => {
  const { article } = assembleArticle(row('cie10es-dx-r12'), ctx);
  const def = article.sections.find((s) => s.source === 'nlm-medlineplus-es');
  assert.equal(def.sourceUrl, 'https://medlineplus.gov/spanish/heartburn.html');
  assert.match(def.license, /^Dominio público \(NLM\); citar «Source: MedlinePlus, National Library of Medicine»$/);
  assert.match(def.text, /^La acidez es una sensación de ardor dolorosa/);
});

test('un término con Q-id sin entidad descargada no inventa nada: queda rechazado', () => {
  const { article, rejections } = assembleArticle(row('cie10es-dx-r12'), { ...ctx, entities: new Map() });
  assert.ok(article.sections.every((s) => s.source === 'nlm-medlineplus-es'));
  assert.ok(rejections.some((r) => r.reason === 'wikidata-sin-entidad'));
});

test('canalización: excluye S1, ordena por categoría+slug, separa retenidos y es idempotente byte a byte', () => {
  const first = runPipeline(seedRows, ctx);
  const second = runPipeline([...seedRows].reverse(), ctx);
  assert.equal(JSON.stringify(first.articles), JSON.stringify(second.articles));
  assert.equal(JSON.stringify(first.rejected), JSON.stringify(second.rejected));
  assert.equal(first.stats.universe.excludedS1, 2);
  assert.ok(!first.articles.some((a) => a.conceptRef.system.startsWith('medlineplus')));
  assert.equal(first.held.length, 1);
  const rejectedCurated = first.rejected.find((r) => r.conceptRef.slug === 'cefalea');
  assert.equal(rejectedCurated.reason, 'sin-fuente-externa');
  // anatomy va antes que signs-symptoms en el orden de la ficha, y dentro de la categoría por slug
  assert.equal(first.articles[0].conceptRef.system, 'wikidata-anatomia');
  const symptomSlugs = first.articles.filter((a) => a.conceptRef.system.startsWith('cie10es')).map((a) => a.conceptRef.slug);
  assert.deepEqual(symptomSlugs, [...symptomSlugs].sort((a, b) => a.localeCompare(b)));
});

test('conceptRef de todo artículo resuelve contra la semilla: no se crean términos', () => {
  const { articles } = runPipeline(seedRows, ctx);
  for (const a of articles) {
    const found = seedRows.find((r) => r.slug === a.conceptRef.slug);
    assert.ok(found, a.conceptRef.slug);
    assert.equal(found.codeSystem, a.conceptRef.system);
    assert.equal(found.code, a.conceptRef.code);
  }
});
