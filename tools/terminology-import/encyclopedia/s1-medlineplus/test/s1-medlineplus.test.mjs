// Pruebas de la canalización S1 (artículos de MedlinePlus). Fixtures: recortes
// REALES, copiados sin modificar de los insumos del 2026-09-30 / 2026-10-08:
//   xml/        <health-topic> de 7 temas y de sus 7 temas ingleses (mplus_topics_2026-09-30.xml)
//   pages/      bloque #topic-summary de las páginas públicas y <div class="main"> de 2 guías
//   corpus/     filas de medlineplus-es(.pruebas).ndjson
//   seed/       filas de la semilla del glosario
//   pages/commons/  respuesta real de la API de Commons (2026-10-08) para 2 archivos
// Correr:  node --test tools/terminology-import/encyclopedia/s1-medlineplus/test/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readNdjson } from '../../../lib/glossary-es/common.mjs';
import { parseTopics } from '../../../lib/glossary-es/medlineplus.mjs';
import { buildAll } from '../build-articles.mjs';
import { validateArticle } from '../lib/contract.mjs';
import { adamCheck, doseCheck } from '../lib/guards.mjs';
import {
  ALLOWED_IMAGE_HOSTS, allowedLicense, buildImage, commonsCaption, imageCandidate, indexMeshImages, isAllowedImageUrl,
  normalizeTitleForMatch, parseCommonsResponse,
} from '../lib/images.mjs';
import { KINDS_BY_FAMILY, familyOf, kindForHeading } from '../lib/kinds.mjs';
import { isoFromSpanishDate, parseTopicPage } from '../lib/pages.mjs';
import { bulletItems, splitSections, squashedText, stripTrailingAttribution } from '../lib/sections.mjs';

const FX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const read = (rel) => readFileSync(join(FX, rel), 'utf8');
const topics = parseTopics(read('xml/mplus_topics_2026-09-30.xml'));
const topicById = new Map(topics.map((t) => [t.id, t]));

const STROKE = '6249';      // Accidente cerebrovascular isquémico (enfermedad, 6 secciones)
const ORAL_CANCER = '2062'; // contiene <TOPIC ID LINKTEXT/> autocerrado
const DIABETES_1 = '1985';  // contiene <ph3> mal formado
const HDL = '6786';         // contiene <table>
const ANALGESICS = '4060';  // «dosis» en una sección
const ANATOMY = '1742';     // imagen Commons de dominio público
const BIOPSY = '5922';      // imagen Commons sin autor declarado

async function runFixtures(overrides = {}) {
  const outDir = mkdtempSync(join(tmpdir(), 's1-'));
  const imageRows = readNdjson(join(FX, 'wikidata-images.ndjson'));
  const result = await buildAll({
    corpusDir: join(FX, 'corpus'), xmlDir: join(FX, 'xml'), seedShardsDir: join(FX, 'seed'),
    cacheDir: join(FX, 'pages'), labCacheDir: join(FX, 'pages', 'labs'), outDir, imageRows, ...overrides,
  });
  return { ...result, outDir };
}

// --- troceo literal ------------------------------------------------------------

test('splitSections corta por <h3> y conserva el texto de la fuente', () => {
  const { html } = stripTrailingAttribution(topicById.get(STROKE).fullSummaryHtml, ['NIH: Instituto Nacional de Trastornos Neurológicos y Accidentes Cerebrovasculares']);
  const blocks = splitSections(html);
  assert.deepEqual(blocks.map((b) => b.heading), [
    '¿Qué es un accidente cerebrovascular isquémico?',
    '¿Qué causa un accidente cerebrovascular isquémico?',
    '¿Cuáles son los síntomas de un accidente cerebrovascular isquémico?',
    '¿Cómo se diagnostica un accidente cerebrovascular isquémico?',
    '¿Cómo se trata un accidente cerebrovascular isquémico?',
    '¿Se puede prevenir un accidente cerebrovascular isquémico?',
  ]);
  assert.match(blocks[0].text, /^Un accidente cerebrovascular ocurre cuando se pierde el flujo sanguíneo a una parte del cerebro\./);
  assert.ok(!blocks.at(-1).text.includes('NIH: Instituto'), 'la atribución no queda dentro del texto de la última sección');
});

test('stripTrailingAttribution solo quita lo que la página declara como atribución', () => {
  const html = '<p>Texto.</p>\n<p class="">NIH: Instituto Nacional del Cáncer</p>';
  assert.equal(stripTrailingAttribution(html, ['NIH: Instituto Nacional del Cáncer']).attribution, 'NIH: Instituto Nacional del Cáncer');
  assert.equal(stripTrailingAttribution(html, []).attribution, null, 'sin atribución declarada no se adivina');
  assert.equal(stripTrailingAttribution(html, ['Otro organismo']).html, html);
});

test('<TOPIC … LINKTEXT/> autocerrado se resuelve a su texto visible (no se pierde palabra)', () => {
  const blocks = splitSections(topicById.get(ORAL_CANCER).fullSummaryHtml);
  const text = blocks.map((b) => b.text).join('\n');
  assert.match(text, /una infección por VPH\./);
  assert.ok(!/<topic/i.test(text));
});

test('markup fuera de la gramática y tablas quedan marcados, no deformados', () => {
  const malformed = splitSections(topicById.get(DIABETES_1).fullSummaryHtml);
  assert.ok(malformed.some((b) => b.flags.includes('malformed-markup')), '<ph3> debe marcarse');
  const tables = splitSections(topicById.get(HDL).fullSummaryHtml);
  assert.ok(tables.some((b) => b.flags.includes('table')), '<table> debe marcarse');
});

test('un bloque que enlaza a la Enciclopedia Médica (A.D.A.M.) queda marcado', () => {
  const topic = topics.find((x) => x.language === 'Spanish' && x.title === 'Aborto');
  assert.ok(topic, 'Aborto está en el XML real');
  assert.ok(splitSections(topic.fullSummaryHtml).some((b) => b.flags.includes('adam-encyclopedia-link')));
});

test('bulletItems devuelve las viñetas literales en orden', () => {
  assert.deepEqual(bulletItems('Introducción:\n\n• Lupus: Enfermedad crónica\n\n• Artritis reumatoide: Causa dolor\n\nFin.'), ['Lupus: Enfermedad crónica', 'Artritis reumatoide: Causa dolor']);
});

// --- encabezado → kind ---------------------------------------------------------

test('kindForHeading: encabezados reales de la NLM por familia', () => {
  const cases = [
    ['disease', '¿Qué es la afasia?', 'definition'],
    ['disease', '¿Qué causa la afasia?', 'causes'],
    ['disease', '¿Cuáles son los síntomas de un accidente cerebrovascular?', 'symptoms'],
    ['disease', '¿Quién tiene más probabilidades de desarrollar afasia?', 'risk_factors'],
    ['disease', '¿Cómo se diagnostica la afasia?', 'diagnosis'],
    ['disease', '¿Cuáles son los tratamientos para la afasia?', 'treatment_overview'],
    ['disease', '¿Puede prevenirse la afasia?', 'prevention'],
    ['disease', '¿Cuáles son los tipos de accidentes cerebrovasculares?', 'classification'],
    ['disease', '¿Qué otros problemas puede causar el agrandamiento de la próstata?', 'complications'],
    ['test', '¿Para qué se usa?', 'purpose'],
    ['test', '¿Debo hacer algo para prepararme para la prueba?', 'preparation'],
    ['test', '¿Qué ocurre durante un análisis del complemento?', 'procedure_description'],
    ['test', '¿Tiene algún riesgo el análisis del complemento?', 'risks'],
    ['test', '¿Qué significan los resultados?', 'interpretation'],
    ['procedure', '¿Cómo se realiza una cesárea?', 'procedure_description'],
  ];
  for (const [family, heading, kind] of cases) assert.equal(kindForHeading(family, heading)?.kind, kind, `${family} · ${heading}`);
});

test('kindForHeading no inventa: lo no reconocido es null y no cruza familias', () => {
  assert.equal(kindForHeading('test', '¿Por qué necesito un análisis del complemento?'), null);
  assert.equal(kindForHeading('test', '¿Debo saber algo más sobre la prueba de 17-OHP?'), null);
  assert.equal(kindForHeading('disease', '¿Cómo se transmite el VIH?'), null);
  assert.equal(kindForHeading('other', '¿Qué causa la afasia?'), null, '«otros» solo admite definition y overview');
  assert.equal(kindForHeading('symptom', '¿Qué causa el dolor?'), null, 'la ficha no da «causas» a síntomas');
});

test('toda regla produce un kind del catálogo cerrado de su familia', () => {
  assert.equal(familyOf('lab'), 'test');
  assert.equal(familyOf('treatment'), 'procedure');
  assert.equal(familyOf('signs-symptoms'), 'symptom');
  for (const [family, kinds] of Object.entries(KINDS_BY_FAMILY)) assert.ok(kinds.includes('definition'), family);
});

// --- guardias --------------------------------------------------------------------

test('doseCheck rechaza dosis y posología reales y deja pasar concentraciones y hábitos', () => {
  assert.equal(doseCheck('Tome 400 microgramos (mcg) de ácido fólico todos los días.').ok, false);
  assert.equal(doseCheck('Al decidir qué medicamento debe tomar y qué dosis necesita, su proveedor').ok, false);
  assert.equal(doseCheck('no es dañino consumir hasta 400 mg de cafeína al día').ok, false);
  assert.equal(doseCheck('Tome la pastilla cada 8 horas con agua').ok, false);
  assert.equal(doseCheck('El nivel normal es de 70 a 99 mg/dL en ayunas').ok, true, 'una concentración no es una dosis');
  assert.equal(doseCheck('Cepillarse los dientes dos veces al día con una pasta dental con fluoruro').ok, true, 'un hábito no es posología');
  assert.equal(doseCheck('Es posible sufrir una sobredosis de heroína.').ok, true, '«sobredosis» no da una cantidad');
});

test('adamCheck detecta A.D.A.M. pero no al autor «Adam MP» de una cita de GeneReviews', () => {
  assert.equal(adamCheck('Información de A.D.A.M., Inc.').ok, false);
  assert.equal(adamCheck('Enciclopedia médica A.D.A.M').ok, false);
  assert.equal(adamCheck('In: Adam MP, Mirzaa GM, Pagon RA, et al., editors. GeneReviews(r) [Internet].').ok, true);
});

// --- páginas -----------------------------------------------------------------------

test('isoFromSpanishDate', () => {
  assert.equal(isoFromSpanishDate('1 agosto 2025'), '2025-08-01');
  assert.equal(isoFromSpanishDate('10 junio 2024'), '2024-06-10');
  assert.equal(isoFromSpanishDate('hoy'), null);
});

test('parseTopicPage: el resumen de la página coincide con el del XML (literalidad) y no hay A.D.A.M.', () => {
  const page = parseTopicPage(read(`pages/topics/${STROKE}.html`));
  assert.equal(page.lastUpdatedIso, '2025-08-01');
  assert.deepEqual(page.attributions, ['NIH: Instituto Nacional de Trastornos Neurológicos y Accidentes Cerebrovasculares']);
  assert.equal(page.adamInPage, false);
  assert.equal(page.adamInSummary, false);
  const { html } = stripTrailingAttribution(topicById.get(STROKE).fullSummaryHtml, page.attributions);
  assert.equal(squashedText(html), page.summarySquashed);
  assert.equal(page.primaryImage, 'https://medlineplus.gov/images/IschemicStroke.jpg', 'se registra, pero no se usa (fuera de la CSP)');
});

// --- ensamblado ---------------------------------------------------------------------

test('artículo de un tema: secciones literales con los seis campos de procedencia y viñetas', async () => {
  const { articles } = await runFixtures();
  const a = articles.find((x) => x.conceptRef.slug === 'medlineplus-es-6249');
  assert.deepEqual(a.conceptRef, { system: 'medlineplus-es', code: STROKE, slug: 'medlineplus-es-6249' });
  assert.equal(a.lang, 'es');
  assert.deepEqual(a.sections.map((s) => s.kind), ['definition', 'symptoms', 'causes', 'diagnosis', 'treatment_overview', 'prevention'].sort((x, y) => KINDS_BY_FAMILY.disease.indexOf(x) - KINDS_BY_FAMILY.disease.indexOf(y)));
  for (const s of a.sections) {
    for (const k of ['source', 'sourceUrl', 'license', 'retrievedAt', 'sourceVersion', 'locator', 'text', 'lang']) assert.ok(s[k], `${s.kind} sin ${k}`);
    assert.equal(s.sourceUrl, 'https://medlineplus.gov/spanish/ischemicstroke.html');
    assert.equal(s.license, 'Dominio público (NLM)');
    assert.equal(s.sourceVersion, '2025-08-01');
    assert.equal(s.retrievedAt, '2026-09-30');
  }
  const causes = a.sections.find((s) => s.kind === 'causes');
  assert.equal(causes.locator, '¿Qué causa un accidente cerebrovascular isquémico?');
  assert.equal(causes.items.length, 4);
  assert.ok(a.facts.some((f) => f.label === 'Descriptor MeSH' && f.value.startsWith('D000083242')));
  assert.ok(a.facts.every((f) => f.source && f.sourceUrl));
  assert.ok(a.references.length >= 1);
});

test('el texto de cada sección publicada es subcadena del resumen de la fuente (nada redactado)', async () => {
  const { articles } = await runFixtures();
  const a = articles.find((x) => x.conceptRef.slug === 'medlineplus-es-6249');
  const source = squashedText(stripTrailingAttribution(topicById.get(STROKE).fullSummaryHtml, ['NIH: Instituto Nacional de Trastornos Neurológicos y Accidentes Cerebrovasculares']).html);
  for (const s of a.sections) assert.ok(source.includes(squashedText(s.text.replace(/•/g, ''))), s.kind);
});

test('rechazos con motivo: página que no coincide, dosis y término fuera del glosario', async () => {
  const { articles, rejected } = await runFixtures();
  const by = (slug, reason) => rejected.find((r) => r.conceptRef?.slug === slug && r.reason === reason);
  assert.ok(by('medlineplus-es-1985', 'source-text-differs-from-live-page'), 'Diabetes tipo 1: el XML y la página difieren');
  assert.ok(!articles.some((a) => a.conceptRef.slug === 'medlineplus-es-1985'));
  const dose = by('medlineplus-es-4060', 'dose-or-posology');
  assert.ok(dose && /dosis/.test(dose.detail), 'Analgésicos: la sección con «dosis» no se publica');
  assert.ok(articles.find((a) => a.conceptRef.slug === 'medlineplus-es-4060'), 'pero el término sí conserva sus otras secciones');
});

test('sin término en la semilla no se crea artículo (no se inventan términos)', async () => {
  const empty = mkdtempSync(join(tmpdir(), 's1-empty-'));
  const { articles, rejected } = await runFixtures({ seedShardsDir: empty });
  assert.equal(articles.length, 0);
  assert.ok(rejected.length > 0 && rejected.every((r) => r.reason === 'concept-not-in-glossary'));
});

test('sin página verificada el término no se publica', async () => {
  const { articles, rejected } = await runFixtures({ cacheDir: mkdtempSync(join(tmpdir(), 's1-nocache-')) });
  assert.ok(!articles.some((a) => a.conceptRef.slug === 'medlineplus-es-6249'));
  assert.ok(rejected.some((r) => r.conceptRef?.slug === 'medlineplus-es-6249' && r.reason === 'page-not-verified'));
});

test('guía de prueba: kinds de «Pruebas y laboratorio» y «Otros nombres» fuera del texto', async () => {
  const { articles, rejected } = await runFixtures();
  const a = articles.find((x) => x.conceptRef.slug === 'medlineplus-lab-analisis-del-complemento');
  assert.deepEqual(a.sections.map((s) => s.kind), ['definition', 'purpose', 'preparation', 'procedure_description', 'risks', 'interpretation']);
  assert.ok(a.sections.every((s) => s.sourceVersion === '2024-06-10' && s.source === 'nlm-medlineplus-es-pruebas'));
  const unmapped = rejected.filter((r) => r.conceptRef?.slug === 'medlineplus-lab-analisis-del-complemento' && r.reason === 'unmapped-heading');
  assert.ok(unmapped.some((r) => /necesito/.test(r.heading)), '«¿Por qué necesito…?» no tiene kind en el catálogo y se informa');
});

test('«Adam MP» en las referencias de una guía NO dispara el filtro de A.D.A.M.', async () => {
  const { articles, rejected } = await runFixtures();
  assert.ok(articles.some((x) => x.conceptRef.slug === 'medlineplus-lab-niveles-de-amoniaco'));
  assert.ok(!rejected.some((r) => r.reason === 'adam-content-detected'));
});

test('invariante: ninguna sección publicada contiene dosis ni A.D.A.M.', async () => {
  const { articles } = await runFixtures();
  for (const a of articles) for (const s of a.sections) {
    assert.equal(doseCheck(`${s.locator}\n${s.text}`).ok, true, `${a.conceptRef.slug}/${s.kind}`);
    assert.equal(adamCheck(s.text).ok, true, `${a.conceptRef.slug}/${s.kind}`);
  }
});

test('idempotencia: dos corridas con las mismas entradas dan articles.ndjson idéntico', async () => {
  const one = await runFixtures();
  const two = await runFixtures();
  const bytes = (dir) => readFileSync(join(dir, 'articles.ndjson'));
  assert.ok(bytes(one.outDir).equals(bytes(two.outDir)));
  assert.ok(readFileSync(join(one.outDir, 'rejected.ndjson')).equals(readFileSync(join(two.outDir, 'rejected.ndjson'))));
});

// --- imágenes -----------------------------------------------------------------------

test('allowedLicense: solo dominio público, CC0, CC BY y CC BY-SA', () => {
  for (const ok of ['Public domain', 'CC0', 'CC BY 4.0', 'CC BY-SA 3.0', 'CC BY-SA 2.0 de', 'CC BY 2.5']) assert.ok(allowedLicense(ok), ok);
  for (const no of ['GFDL 1.2', 'FAL', 'Attribution', 'No restrictions', 'Copyrighted free use', 'CC BY-NC 4.0', 'CC BY-ND 2.0', 'CC BY-NC-SA 3.0', '', null]) assert.equal(allowedLicense(no), null, String(no));
});

test('hosts de imagen: solo los de la CSP del front', () => {
  assert.deepEqual([...ALLOWED_IMAGE_HOSTS], ['upload.wikimedia.org', 'thumb.wikimedia.org', 'cima.aemps.es']);
  assert.ok(isAllowedImageUrl('https://upload.wikimedia.org/wikipedia/commons/8/8b/x.jpg'));
  assert.ok(isAllowedImageUrl('https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8b/x.jpg/330px-x.jpg'));
  assert.equal(isAllowedImageUrl('https://medlineplus.gov/images/IschemicStroke.jpg'), false);
  assert.equal(isAllowedImageUrl('https://openi.nlm.nih.gov/imgs/512/1.png'), false);
  assert.equal(isAllowedImageUrl('http://upload.wikimedia.org/x.jpg'), false);
});

test('normalizeTitleForMatch: MeSH invertido y plural coinciden; descriptor más amplio no', () => {
  assert.equal(normalizeTitleForMatch('Cystitis, Interstitial'), normalizeTitleForMatch('Interstitial Cystitis'));
  assert.equal(normalizeTitleForMatch('Parkinson Disease'), normalizeTitleForMatch("Parkinson's Disease"));
  assert.notEqual(normalizeTitleForMatch('Neoplasms'), normalizeTitleForMatch('Cancer in Children'));
  assert.notEqual(normalizeTitleForMatch('Humeral Fractures'), normalizeTitleForMatch('Arm Injuries and Disorders'));
});

test('imageCandidate: solo `name-match` es elegible; el resto queda retenido', () => {
  const idx = indexMeshImages(readNdjson(join(FX, 'wikidata-images.ndjson')));
  const exact = imageCandidate({ mesh: [{ id: 'D000715', name: 'Anatomy' }], enTitle: 'Anatomy' }, idx);
  assert.equal(exact.tier, 'name-match');
  const broader = imageCandidate({ mesh: [{ id: 'D000715', name: 'Anatomy' }], enTitle: 'Human Body' }, idx);
  assert.equal(broader.tier, 'name-differs');
  assert.equal(imageCandidate({ mesh: [{ id: 'D999999', name: 'Nada' }], enTitle: 'Nada' }, idx), null);
});

test('Commons: imagen de dominio público aceptada con autor, página de origen y hosts permitidos', async () => {
  const { articles, trace, outDir } = await runFixtures();
  const a = articles.find((x) => x.conceptRef.slug === 'medlineplus-es-1742');
  assert.equal(a.images.length, 1);
  const img = a.images[0];
  assert.equal(img.license, 'Public domain');
  assert.equal(img.licenseFamily, 'public-domain');
  assert.equal(img.author, 'Leonardo da Vinci');
  assert.equal(img.sourcePage, 'https://commons.wikimedia.org/wiki/File:Leonardo_da_vinci,_Drawing_of_a_Woman%27s_Torso.jpg');
  assert.equal(img.altTextQuality, 'generic');
  assert.equal(img.altText, 'Imagen de Anatomía');
  assert.equal(img.retrievedAt, '2026-10-08');
  assert.ok(isAllowedImageUrl(img.url) && isAllowedImageUrl(img.thumbUrl));
  assert.ok(!img.url.includes('?'), 'sin parámetros de seguimiento');
  const biopsy = trace.find((t) => t.slug === 'medlineplus-es-5922');
  assert.equal(biopsy.outcome, 'rejected');
  assert.equal(biopsy.reason, 'missing-author');
  assert.ok(readNdjson(join(outDir, 'rejected.ndjson')).some((r) => r.scope === 'image' && r.reason === 'missing-author'));
});

test('buildImage rechaza licencia no permitida, restricciones y hosts fuera de la CSP', () => {
  const base = {
    file: 'x.jpg', url: 'https://upload.wikimedia.org/a/x.jpg', thumbUrl: 'https://upload.wikimedia.org/t/x.jpg', descriptionUrl: 'https://commons.wikimedia.org/wiki/File:x.jpg',
    mime: 'image/jpeg', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0', author: 'A. Autora', credit: null, caption: null, nonFree: null, restrictions: null, retrievedAt: '2026-10-08',
  };
  assert.ok(buildImage({ commons: base, term: 'X', wikidataId: 'Q1' }).image);
  assert.equal(buildImage({ commons: { ...base, license: 'CC BY-NC 4.0' }, term: 'X', wikidataId: 'Q1' }).reject.reason, 'license-not-allowed');
  assert.equal(buildImage({ commons: { ...base, license: 'GFDL 1.2' }, term: 'X', wikidataId: 'Q1' }).reject.reason, 'license-not-allowed');
  assert.equal(buildImage({ commons: { ...base, restrictions: 'trademarked' }, term: 'X', wikidataId: 'Q1' }).reject.reason, 'restricted-on-commons');
  assert.equal(buildImage({ commons: { ...base, url: 'https://example.org/x.jpg' }, term: 'X', wikidataId: 'Q1' }).reject.reason, 'host-outside-csp');
  assert.equal(buildImage({ commons: null, term: 'X', wikidataId: 'Q1' }).reject.reason, 'commons-not-verified');
});

test('Commons: el pie en castellano da alt «caption»; en otro idioma queda como genérico', () => {
  assert.deepEqual(commonsCaption('<div class="description mw-content-ltr es" dir="ltr" lang="es"><span class="language es">Español: </span>Lámina anatómica</div><div lang="en">English text</div>'), { text: 'Lámina anatómica', lang: 'es' });
  const en = commonsCaption('<div lang="en">Drawing of a torso</div>');
  assert.equal(en.lang, 'en');
  const built = buildImage({
    commons: { url: 'https://upload.wikimedia.org/a/x.jpg', thumbUrl: 'https://upload.wikimedia.org/t/x.jpg', descriptionUrl: 'https://commons.wikimedia.org/wiki/File:x.jpg', mime: 'image/svg+xml', license: 'CC0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/deed.en', author: 'B', caption: en, retrievedAt: '2026-10-08' },
    term: 'Torso', wikidataId: 'Q2',
  }).image;
  assert.equal(built.altTextQuality, 'generic');
  assert.equal(built.kind, 'diagram');
  assert.equal(built.captionLang, 'en');
});

test('parseCommonsResponse lee la respuesta real de la API', () => {
  const entry = JSON.parse(read('pages/commons/batch-18bde005157085d9.json'));
  const map = parseCommonsResponse(entry.response);
  assert.equal(map.get('Leonardo da vinci, Drawing of a Woman\'s Torso.jpg').license, 'Public domain');
  assert.equal(map.get('Brain biopsy under stereotaxy.jpg').author, null);
});

// --- contrato -------------------------------------------------------------------------

test('contrato §12.3: los artículos de los fixtures lo cumplen y las violaciones se detectan', async () => {
  const { articles } = await runFixtures();
  assert.ok(articles.length > 0);
  for (const a of articles) assert.deepEqual(validateArticle(a), [], a.conceptRef.slug);
  const stroke = articles.find((x) => x.conceptRef.slug === 'medlineplus-es-6249');
  const broken = structuredClone(stroke);
  delete broken.sections[0].sourceUrl;
  broken.sections[1].kind = 'inventado';
  broken.sections[2].lang = 'en';
  assert.ok(validateArticle(broken).length >= 3);
  const withBadImage = structuredClone(articles.find((x) => x.images.length));
  withBadImage.images[0].url = 'https://medlineplus.gov/images/IschemicStroke.jpg';
  withBadImage.images[0].license = 'CC BY-NC 4.0';
  assert.ok(validateArticle(withBadImage).some((e) => /CSP/.test(e)));
  assert.ok(validateArticle(withBadImage).some((e) => /licencia no permitida/.test(e)));
});
