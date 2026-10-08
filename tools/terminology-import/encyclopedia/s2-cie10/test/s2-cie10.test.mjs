// Pruebas del corte S2 (artículos de enfermedades CIE-10-ES).
// Fixtures: recortes REALES de las fuentes bajadas el 2026-10-08 (Orphadata es_product1/9, Mondo
// 2026-10-06, doid.obo, phenotype.hpoa 2026-09-02, hp-es.babelon, respuestas de WDQS, MeSH y Commons) y
// cuatro términos reales de la semilla del glosario. Las pocas entradas SINTÉTICAS (marcadas
// «sintético») prueban ramas de lógica que el recorte real no contiene.
// Correr: node --test tools/terminology-import/encyclopedia/s2-cie10/test/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildAll } from '../build-articles.mjs';
import { buildArticle } from '../lib/article.mjs';
import { DISEASE_SECTION_KINDS, SECTION_PROVENANCE_FIELDS } from '../lib/config.mjs';
import { parseDoid, unescapeObo } from '../lib/doid.mjs';
import { dosePattern, imageHostOk, pickImage, sectionProblem, stripTracking } from '../lib/guards.mjs';
import { frequencyOf, parseBabelon, parseHpJson, parseHpoa, phenotypeItems } from '../lib/hpo.mjs';
import { corroborates, resolveIdentities } from '../lib/identity.mjs';
import { icdSystemsFor, indexIcd10 as mondoIndex, parseMondo, toMondoConcept } from '../lib/mondo.mjs';
import { indexIcd10 as orphaIndex, parseAges, parseHeader, parsePrevalence, parseProduct1 } from '../lib/orphanet.mjs';
import { commonsFileName, flattenBindings, parseCommonsInfo, parseMeshBindings } from '../lib/remote.mjs';
import { loadCieTerms } from '../lib/seed.mjs';
import { resolveWikidata } from '../lib/wikidata.mjs';

const FX = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const fx = (f) => readFileSync(join(FX, f), 'utf8');
const fxJson = (f) => JSON.parse(fx(f));

// --- Orphanet ------------------------------------------------------------------------

const product1 = parseProduct1(fx('orphanet-es-product1.sample.xml'));

test('Orphanet: licencia CC BY 4.0 declarada por el propio XML', () => {
  const h = parseHeader(fx('orphanet-es-product1.sample.xml'));
  assert.equal(h.licenseId, 'CC-BY-4.0');
  assert.match(h.licenseLegalCode, /creativecommons\.org\/licenses\/by\/4\.0/);
  assert.match(h.date, /^2026-06-23/);
});

test('Orphanet: definición literal y correspondencia exacta E (validada) solo cuando es E', () => {
  const cf = product1.get('586');
  assert.equal(cf.definition.startsWith('Es un trastorno pulmonar de origen genético poco frecuente'), true);
  const icd = cf.xrefs.filter((x) => x.source === 'ICD-10');
  // Orphanet también lista E84.0/E84.1/E84.8 como aproximadas (NTBT/BTNT): NO son exactas.
  assert.deepEqual(icd.filter((x) => x.exact).map((x) => x.reference), ['E84']);
  assert.deepEqual(icd.filter((x) => !x.exact).map((x) => x.reference), ['E84.0', 'E84.1', 'E84.8']);
  // ORPHA:166024 → Q77.3 es NTBT (el código ORPHA es más específico): aproximada, NO sirve para unir.
  const approx = product1.get('166024').xrefs.find((x) => x.source === 'ICD-10');
  assert.equal(approx.reference, 'Q77.3');
  assert.equal(approx.exact, false);
  assert.match(approx.mappingName, /^NTBT/);
});

test('Orphanet: índice por código separa exactas de aproximadas', () => {
  const idx = orphaIndex(product1);
  assert.deepEqual(idx.exact.get('E84'), ['586']);
  assert.equal(idx.exact.has('Q77.3'), false);
  assert.deepEqual(idx.approximate.get('Q77.3'), ['166024']);
});

test('Orphanet: edad de inicio, herencia y prevalencia son campos literales de la fuente', () => {
  const ages = parseAges(fx('orphanet-es-product9-ages.sample.xml'));
  assert.deepEqual(ages.get('166024'), { onset: ['Lactancia', 'Neonatal'], inheritance: ['Autosómica recesiva'] });
  const prev = parsePrevalence(fx('orphanet-es-product9-prev.sample.xml'));
  const rows = prev.get('166024');
  assert.ok(rows.length >= 1);
  assert.ok(rows.every((r) => r.type && r.geographic));
});

// --- MONDO / DOID ----------------------------------------------------------------------

const mondo = parseMondo(fxJson('mondo.sample.json'));

test('MONDO: solo skos:exactMatch cuenta, y los obsoletos no entran', () => {
  assert.equal(mondo.version, '2026-10-06');
  assert.match(mondo.license, /creativecommons\.org\/licenses\/by\/4\.0/);
  const cf = mondo.concepts.get('MONDO:0009061');
  assert.deepEqual(cf.exact.icd10cm, ['E84']);
  assert.deepEqual(cf.exact.icd10who, ['E84']);
  assert.ok(cf.exact.orpha.includes('586'));
  assert.ok(cf.exact.mesh.includes('D003550'));
  assert.ok(cf.exact.doid.includes('1485'));
  assert.equal(cf.definition.startsWith('Autosomal recessive disorder caused by pathogenic variants in the CFTR gene'), true);
  assert.equal(mondo.concepts.size, 3, '3 clases vigentes; la obsoleta del recorte no entra');
  assert.deepEqual(icdSystemsFor(cf, 'E84'), ['icd10cm', 'icd10who']);
});

test('MONDO: closeMatch y xrefs planos NO unen (sintético)', () => {
  const node = {
    id: 'http://purl.obolibrary.org/obo/MONDO_9999999', lbl: 'sintético', type: 'CLASS',
    meta: {
      xrefs: [{ val: 'ICD10CM:Z99' }],
      basicPropertyValues: [
        { pred: 'http://www.w3.org/2004/02/skos/core#closeMatch', val: 'http://purl.bioontology.org/ontology/ICD10CM/Z98' },
        { pred: 'http://www.w3.org/2004/02/skos/core#exactMatch', val: 'http://purl.bioontology.org/ontology/ICD10CM/Z97' },
      ],
    },
  };
  assert.deepEqual(toMondoConcept(node).exact.icd10cm, ['Z97']);
  assert.equal(toMondoConcept({ ...node, meta: { ...node.meta, deprecated: true } }), null);
  assert.equal(toMondoConcept({ ...node, type: 'PROPERTY' }), null);
});

test('DOID: definición literal, licencia CC0 y términos obsoletos fuera', () => {
  const doid = parseDoid(fx('doid.sample.obo'));
  assert.match(doid.license, /publicdomain\/zero\/1\.0/);
  assert.equal(doid.terms.get('DOID:1485').definition, 'A syndrome that is characterized by the buildup of thick, sticky mucus that can damage many organs.');
  assert.equal(doid.terms.size, 1, 'el término obsoleto del recorte no entra');
  assert.equal(unescapeObo('http\\://x \\"a\\"'), 'http://x "a"');
});

// --- HPO -----------------------------------------------------------------------------------

test('HPO: solo traducción OFICIAL; sin ella el ítem queda en inglés y marcado', () => {
  const es = parseBabelon(fx('hp-es.babelon.sample.tsv'));
  const en = parseHpJson(fxJson('hp.sample.json'));
  assert.ok(es.size >= 3);
  assert.equal(en.version, '2026-09-01');
  const items = phenotypeItems(
    [{ hpoId: 'HP:0000716', reference: 'ORPHA:586', frequency: 'HP:0040283' }, { hpoId: 'HP:9999999', reference: 'x', frequency: null }],
    { esLabels: es, enLabels: new Map([['HP:9999999', 'Sintético only-english']]) },
  );
  assert.equal(items.find((i) => i.hpoId === 'HP:0000716').officialSpanish, true);
  const sinTraduccion = items.find((i) => i.hpoId === 'HP:9999999');
  assert.equal(sinTraduccion.officialSpanish, false);
  assert.equal(sinTraduccion.label, 'Sintético only-english');
});

test('HPO: phenotype.hpoa descarta calificador NOT y frecuencia excluida; fracciones y términos de frecuencia', () => {
  const { diseases, version } = parseHpoa(fx('phenotype.hpoa.sample.tsv'));
  assert.equal(version, '2026-09-02');
  assert.equal(diseases.has('ORPHA:1401'), false, 'las dos filas NOT de ORPHA:1401 (fenotipo AUSENTE) se descartan');
  assert.equal(diseases.get('ORPHA:586').P.length, 6);
  assert.ok(diseases.get('OMIM:619340').P.some((r) => r.frequency === '1/2'));
  assert.deepEqual(frequencyOf('1/2', () => 'x'), { rank: 50, label: '1/2' });
  assert.equal(frequencyOf('HP:0040281', () => 'Muy frecuente').label, 'Muy frecuente');
  assert.deepEqual(frequencyOf(null, () => 'x'), { rank: 0, label: null });
  // sintético: el real no trae filas con frecuencia excluida
  const excluded = 'database_id\tdisease_name\tqualifier\thpo_id\treference\tevidence\tonset\tfrequency\tsex\tmodifier\taspect\tbiocuration\nORPHA:1\tx\t\tHP:1\tORPHA:1\tTAS\t\tHP:0040285\t\t\tP\tz\n';
  assert.equal(parseHpoa(excluded).diseases.size, 0);
});

test('HPO: orden por frecuencia, sin inventar frecuencia', () => {
  const es = new Map([['HP:1', 'B'], ['HP:2', 'A'], ['HP:3', 'C'], ['HP:0040281', 'Muy frecuente'], ['HP:0040283', 'Ocasional']]);
  const items = phenotypeItems(
    [
      { hpoId: 'HP:1', reference: 'r1', frequency: 'HP:0040283' },
      { hpoId: 'HP:2', reference: 'r2', frequency: 'HP:0040281' },
      { hpoId: 'HP:3', reference: 'r3', frequency: null },
    ],
    { esLabels: es, enLabels: new Map() },
  );
  assert.deepEqual(items.map((i) => i.hpoId), ['HP:2', 'HP:1', 'HP:3']);
  assert.equal(items[2].freq.label, null, 'sin frecuencia en la fuente → null, jamás un valor estimado');
});

// --- Identidad ----------------------------------------------------------------------------------

const terms = loadCieTerms(join(FX, 'seed'));
const idx = {
  orphaConcepts: product1, orphaByCode: orphaIndex(product1).exact, mondoConcepts: mondo.concepts, mondoByCode: mondoIndex(mondo.concepts),
};

test('Semilla: los términos se leen tal cual, sin crear ninguno', () => {
  assert.equal(terms.length, 9);
  const e84 = terms.find((t) => t.code === 'E84');
  assert.equal(e84.slug, 'cie10es-dx-e84');
});

test('Identidad: Orphanet y MONDO se corroboran → E84 queda unido a los dos', () => {
  const id = resolveIdentities(terms, idx).get('E84');
  assert.equal(id.orpha.orpha, '586');
  assert.equal(id.mondo.id, 'MONDO:0009061');
  assert.equal(id.conflict, false);
  assert.equal(corroborates(id.orpha, id.mondo), true);
});

test('Identidad: si Orphanet y MONDO declaran enfermedades distintas se descartan los dos (C69.2, L83)', () => {
  const ids = resolveIdentities(terms, idx);
  for (const code of ['C69.2', 'L83']) {
    const id = ids.get(code);
    assert.equal(id.conflict, true, code);
    assert.equal(id.orpha, null);
    assert.equal(id.mondo, null);
    assert.match(id.notes[0], /^orphanet_y_mondo_declaran_enfermedades_distintas/);
  }
});

test('Identidad: un concepto de la fuente que corresponde a dos términos es un grupo y no se usa (sintético)', () => {
  const synthetic = new Map([['A', { id: 'MONDO:1', exact: { orpha: [] } }]]);
  const out = resolveIdentities([{ code: 'X1' }, { code: 'X2' }], {
    orphaConcepts: new Map(), orphaByCode: new Map(), mondoConcepts: synthetic, mondoByCode: new Map([['X1', ['A']], ['X2', ['A']]]),
  });
  for (const code of ['X1', 'X2']) {
    assert.equal(out.get(code).mondo, null);
    assert.match(out.get(code).notes[0], /^el_concepto_de_la_fuente_corresponde_a_varios_terminos_del_glosario/);
  }
});

// --- Guardas ----------------------------------------------------------------------------------------

test('Guarda de dosis: cantidades y palabras de posología', () => {
  for (const t of ['Se administra 5 mg diarios', 'dosis de 2,5 g', 'Posología habitual', '1.1 mg', 'high dose']) assert.ok(dosePattern(t), t);
  for (const t of ['sweat chloride concentration of 60 mmol/L or greater', 'Autosomal recessive disorder', 'ORPHA:586', 'grupo 5g-2']) {
    assert.equal(dosePattern(t), t === 'grupo 5g-2' ? '5g' : null, t);
  }
});

test('Guarda de sección: kind cerrado y los seis campos de procedencia', () => {
  const ok = { kind: 'definition', text: 't', lang: 'es', source: 's', sourceUrl: 'u', license: 'l', retrievedAt: 'r', sourceVersion: 'v', locator: 'x' };
  assert.equal(sectionProblem(ok), null);
  assert.match(sectionProblem({ ...ok, kind: 'inventado' }).reason, /kind_fuera_del_catalogo/);
  for (const f of SECTION_PROVENANCE_FIELDS) assert.match(sectionProblem({ ...ok, [f]: null }).reason, /seccion_sin_los_seis_campos/, f);
  assert.match(sectionProblem({ ...ok, text: 'tomar 10 mg' }).reason, /patron_de_dosis/);
  assert.match(sectionProblem({ ...ok, lang: 'fr' }).reason, /lang_invalido/);
  assert.ok(DISEASE_SECTION_KINDS.includes('symptoms'));
});

test('Imágenes: solo dominio público, CC0, CC BY y CC BY-SA; hosts de la CSP; autor para CC BY', () => {
  const base = { file: 'x.jpg', url: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/x.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo', thumbUrl: 'https://upload.wikimedia.org/t.jpg', pageUrl: 'https://commons.wikimedia.org/wiki/File:x.jpg', artist: 'Ana', credit: null, license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0' };
  const pick = (over) => pickImage({ ...base, ...over }, { termName: 'Fibrosis quística', retrievedAt: '2026-10-08' });
  const ok = pick({});
  assert.equal(ok.ok, true);
  assert.equal(ok.image.url, 'https://upload.wikimedia.org/wikipedia/commons/a/a1/x.jpg');
  assert.equal(ok.image.altText, 'Imagen de Fibrosis quística');
  assert.equal(ok.image.altTextQuality, 'generic');
  for (const lic of ['CC BY-NC 4.0', 'CC BY-ND 2.0', 'CC BY-NC-SA 3.0', 'GFDL', '', 'Attribution', 'All rights reserved']) assert.equal(pick({ license: lic }).ok, false, lic);
  for (const lic of ['Public domain', 'CC0', 'CC BY 4.0', 'CC BY-SA 3.0', 'PD-old-70']) assert.equal(pick({ license: lic, licenseUrl: 'https://x', artist: 'A' }).ok, true, lic);
  assert.equal(pick({ url: 'https://example.com/x.jpg' }).reason, 'host_de_imagen_fuera_de_la_csp');
  assert.equal(pick({ artist: null, credit: null }).reason, 'imagen_cc_by_sin_autor');
  assert.equal(pick({ license: 'Public domain', artist: null, licenseUrl: null }).ok, true);
  assert.equal(imageHostOk('http://upload.wikimedia.org/x'), false, 'solo https');
  assert.equal(imageHostOk('https://thumb.wikimedia.org/x'), true);
  assert.equal(stripTracking('https://u/x.jpg?utm_source=a&utm_x=b'), 'https://u/x.jpg');
});

// --- Remotos (parseo de respuestas reales) -----------------------------------------------------------

test('MeSH: nota de alcance literal por descriptor', () => {
  const m = parseMeshBindings(fxJson('mesh-scope.sample.json'));
  assert.equal(m.get('D003550').label, 'Cystic Fibrosis');
  assert.equal(m.get('D011014').scopeNote, 'Infection of the lung often accompanied by inflammation.');
});

test('Wikidata/Commons: filas planas, nombre de archivo y metadatos de licencia', () => {
  const codes = flattenBindings(fxJson('wikidata-codes.sample.json'));
  assert.ok(codes.some((r) => r.code === 'E84' && r.item.endsWith('/Q178194')));
  assert.equal(commonsFileName('http://commons.wikimedia.org/wiki/Special:FilePath/Anembryonic%20gestation.jpg'), 'Anembryonic gestation.jpg');
  const info = parseCommonsInfo(fxJson('commons-info.sample.json'));
  const a = info.get('Anembryonic gestation.jpg');
  assert.equal(a.license, 'CC0');
  assert.ok(a.artist.startsWith('Mikael Häggström'));
  assert.match(a.url, /^https:\/\/upload\.wikimedia\.org\//);
});

// --- Artículo ----------------------------------------------------------------------------------------------

const esHpo = parseBabelon(fx('hp-es.babelon.sample.tsv'));
const hpoCtx = { en: parseHpJson(fxJson('hp.sample.json')).labels, es: esHpo, hpoa: parseHpoa(fx('phenotype.hpoa.sample.tsv')) };
const baseCtx = (over = {}) => ({
  hpoAck: false,
  orphanet: { header: parseHeader(fx('orphanet-es-product1.sample.xml')), concepts: product1, prevalence: parsePrevalence(fx('orphanet-es-product9-prev.sample.xml')), ages: parseAges(fx('orphanet-es-product9-ages.sample.xml')) },
  mondo,
  doid: parseDoid(fx('doid.sample.obo')),
  mesh: parseMeshBindings(fxJson('mesh-scope.sample.json')),
  hpo: hpoCtx,
  commons: parseCommonsInfo(fxJson('commons-info.sample.json')),
  retrievedAt: { 'orphanet-es': '2026-10-08', 'orphanet-epidemiology-es': '2026-10-08', mondo: '2026-10-08', 'disease-ontology': '2026-10-08', 'nlm-mesh': '2026-10-08', hpo: '2026-10-08', wikidata: '2026-10-08' },
  ...over,
});

test('Artículo E84: textos literales con los seis campos, sin dosis, kinds del catálogo', () => {
  const ids = resolveIdentities(terms, idx);
  const term = terms.find((t) => t.code === 'E84');
  const { article, rejected } = buildArticle(term, ids.get('E84'), null, baseCtx());
  assert.deepEqual(article.conceptRef, { system: 'CIE10ES', code: 'E84', slug: 'cie10es-dx-e84' });
  assert.equal(article.identity.corroborated, true);
  assert.deepEqual(article.identity.basis.map((b) => `${b.source}:${b.id}`), ['orphanet-es:ORPHA:586', 'mondo:MONDO:0009061']);
  assert.match(article.identity.basis[1].mapping, /ICD10CM \+ CIE-10 OMS/);
  assert.deepEqual(article.sections.map((s) => `${s.kind}/${s.source}/${s.lang}`), [
    'definition/orphanet-es/es', 'definition/mondo/en', 'overview/nlm-mesh/en',
  ]);
  // La definición de DOID:1485 cita a Wikipedia como referencia (CC BY-SA): se retiene y queda registrada.
  assert.ok(rejected.some((r) => r.level === 'section' && /wikipedia/.test(r.reason) && /disease-ontology/.test(r.detail)));
  for (const s of article.sections) {
    for (const f of SECTION_PROVENANCE_FIELDS) assert.ok(s[f], `${s.source}.${f}`);
    assert.ok(DISEASE_SECTION_KINDS.includes(s.kind));
    assert.equal(dosePattern(s.text), null);
  }
  assert.equal(article.sections[0].text, product1.get('586').definition, 'el texto es la cadena de la fuente, sin tocar');
  assert.equal(article.sections.find((s) => s.source === 'nlm-mesh').text, parseMeshBindings(fxJson('mesh-scope.sample.json')).get('D003550').scopeNote);
  assert.ok(article.facts.some((f) => f.label === 'Código ORPHA' && f.value === 'ORPHA:586'));
  const ages = parseAges(fx('orphanet-es-product9-ages.sample.xml')).get('586');
  assert.equal(article.facts.find((f) => f.label === 'Herencia (Orphanet)').value, ages.inheritance.join(', '));
  assert.equal(rejected.length, 1);
  const withWikipedia = buildArticle(term, ids.get('E84'), null, baseCtx({ includeWikipediaCited: true }));
  assert.deepEqual(withWikipedia.article.sections.map((s) => s.source), ['orphanet-es', 'mondo', 'disease-ontology', 'nlm-mesh']);
  assert.equal(withWikipedia.rejected.length, 0);
});

test('Artículo: los síntomas de HPO no salen sin --hpo-license-ack y con él van ordenados y en castellano oficial', () => {
  const ids = resolveIdentities(terms, idx);
  const term = terms.find((t) => t.code === 'E84');
  const blocked = buildArticle(term, ids.get('E84'), null, baseCtx());
  assert.equal(blocked.flags.hpoBlocked, true);
  assert.equal(blocked.article.sections.some((s) => s.kind === 'symptoms'), false);
  const open = buildArticle(term, ids.get('E84'), null, baseCtx({ hpoAck: true }));
  const sy = open.article.sections.find((s) => s.kind === 'symptoms');
  assert.equal(sy.source, 'hpo');
  assert.equal(sy.text, null, 'una lista no lleva prosa del sistema');
  assert.equal(sy.items.length, 6);
  assert.equal(sy.lang, 'es');
  assert.match(sy.sourceUrl, /browse\/disease\/ORPHA:586$/);
});

test('Artículo: término sin fuente → sin artículo y con motivo (resultado válido)', () => {
  const ids = resolveIdentities(terms, idx);
  const term = terms.find((t) => t.code === 'E84.0');
  const { article, rejected } = buildArticle(term, ids.get('E84.0'), null, baseCtx());
  assert.equal(article, null);
  assert.equal(rejected.at(-1).reason, 'sin_fuente_con_correspondencia_exacta');
  assert.deepEqual(rejected.at(-1).conceptRef, { system: 'CIE10ES', code: 'E84.0', slug: 'cie10es-dx-e84-0' });
});

test('Artículo: una sección con patrón de dosis se rechaza y queda registrada (sintético)', () => {
  const ids = resolveIdentities(terms, idx);
  const term = terms.find((t) => t.code === 'E84');
  const withDose = baseCtx({ mesh: new Map([['D003550', { id: 'D003550', label: 'Cystic Fibrosis', scopeNote: 'Se indica 10 mg al día.' }]]) });
  const { article, rejected } = buildArticle(term, ids.get('E84'), null, withDose);
  assert.equal(article.sections.some((s) => s.source === 'nlm-mesh'), false);
  assert.ok(rejected.some((r) => r.reason === 'texto_con_patron_de_dosis' && /10 mg/.test(r.detail)));
});

// --- Puente Wikidata y canalización completa ---------------------------------------------------------------

const bridge = () => ({
  codes: flattenBindings(fxJson('wikidata-codes.sample.json')).map((r) => ({ qid: r.item.split('/').pop(), code: r.code, prop: r.prop })),
  images: flattenBindings(fxJson('wikidata-images.sample.json')).map((r) => ({ qid: r.item.split('/').pop(), file: commonsFileName(r.file) })),
  facts: { P1550: flattenBindings(fxJson('wikidata-fact-P1550.sample.json')).map((r) => ({ qid: r.item.split('/').pop(), value: r.value })) },
});

test('Wikidata: un Q-id por código, uno solo por término y sin contradecir a Orphanet', () => {
  const ids = resolveIdentities(terms, idx);
  const wd = resolveWikidata(terms, bridge(), ids);
  assert.equal(wd.get('O03').qid, 'Q28693');
  assert.deepEqual(wd.get('O03').files, ['Anembryonic gestation.jpg']);
  for (const w of wd.values()) assert.ok(w.qid === null || w.rejectReason === null);
  const rejectedReasons = [...wd.values()].map((w) => w.rejectReason).filter(Boolean);
  assert.ok(rejectedReasons.every((r) => /varios|contradice/.test(r)), rejectedReasons.join());
});

test('Canalización completa sobre fixtures: contrato, idempotencia y rechazos', async () => {
  const dir = mkdtempSync(join(tmpdir(), 's2-cie10-'));
  const cache = join(dir, 'cache');
  mkdirSync(join(cache, 'files'), { recursive: true });
  const files = {
    'es_product1.xml': 'orphanet-es-product1.sample.xml', 'es_product9_prev.xml': 'orphanet-es-product9-prev.sample.xml',
    'es_product9_ages.xml': 'orphanet-es-product9-ages.sample.xml', 'hp.json': 'hp.sample.json', 'phenotype.hpoa': 'phenotype.hpoa.sample.tsv',
    'hp-es.babelon.tsv': 'hp-es.babelon.sample.tsv', 'mondo.json': 'mondo.sample.json', 'doid.obo': 'doid.sample.obo',
  };
  for (const [dst, src] of Object.entries(files)) copyFileSync(join(FX, src), join(cache, 'files', dst));
  const entry = (file) => ({ file, url: `https://example.invalid/${file}`, bytes: 1, sha256: '0', retrievedAt: '2026-10-08' });
  writeFileSync(join(cache, 'sources-manifest.json'), JSON.stringify({
    'orphanet-es': entry('es_product1.xml'), 'orphanet-prevalence': entry('es_product9_prev.xml'), 'orphanet-ages': entry('es_product9_ages.xml'),
    'hpo-ontology': entry('hp.json'), 'hpo-annotations': entry('phenotype.hpoa'), 'hpo-es': entry('hp-es.babelon.tsv'),
    mondo: entry('mondo.json'), 'disease-ontology': entry('doid.obo'),
  }));
  writeFileSync(join(cache, 'remote-retrieved-at.txt'), '2026-10-08\n');
  const labels = { entities: Object.fromEntries(Object.entries({
    P4229: 'ICD-10-CM', P494: 'ICD-10 ID', P7329: 'ICD-11 ID (MMS)', P2892: 'UMLS CUI', P486: 'MeSH descriptor ID', P492: 'OMIM ID', P1550: 'Orphanet ID',
    P699: 'Disease Ontology ID', P5270: 'Mondo ID', P18: 'image',
  }).map(([k, v]) => [k, { labels: { en: { value: v } } }])) };
  const stub = {
    async getJsonCached(url) {
      const u = decodeURIComponent(url.replace(/\+/g, ' '));
      if (u.includes('wbgetentities')) return labels;
      if (u.includes('id.nlm.nih.gov/mesh')) return fxJson('mesh-scope.sample.json');
      if (u.includes('commons.wikimedia.org')) return fxJson('commons-info.sample.json');
      if (u.includes('wdt:P4229 ?code')) return fxJson('wikidata-codes.sample.json');
      if (u.includes('wdt:P18')) return fxJson('wikidata-images.sample.json');
      if (u.includes('wdt:P1550 ?value')) return fxJson('wikidata-fact-P1550.sample.json');
      return { results: { bindings: [] } };
    },
  };
  const run = async (name, extra = {}) => {
    const out = join(dir, name);
    const r = await buildAll({ seedDir: join(FX, 'seed'), cacheDir: cache, outDir: out, http: stub, ...extra });
    return { out, ...r };
  };
  const a = await run('a');
  const b = await run('b');
  for (const f of ['articles.ndjson', 'rejected.ndjson', 'stats.json', 'COVERAGE.md']) {
    assert.equal(readFileSync(join(a.out, f), 'utf8'), readFileSync(join(b.out, f), 'utf8'), `${f} es idempotente`);
  }
  const codes = a.articles.map((x) => x.conceptRef.code);
  assert.ok(codes.includes('E84'));
  assert.ok(codes.includes('O03'), 'O03 solo tiene imagen vía Wikidata');
  assert.equal(codes.includes('E84.0'), false);
  for (const art of a.articles) {
    for (const im of art.images) assert.ok(imageHostOk(im.url) && imageHostOk(im.thumbUrl));
    for (const s of art.sections) assert.equal(sectionProblem(s), null);
  }
  const lines = readFileSync(join(a.out, 'rejected.ndjson'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.ok(lines.some((r) => r.conceptRef.code === 'L83' && r.reason === 'orphanet_y_mondo_declaran_enfermedades_distintas'));
  assert.ok(lines.some((r) => r.conceptRef.code === 'E84.0' && r.level === 'term'));
  assert.equal(a.stats.hpoAck, false);
  assert.equal(a.articles.find((x) => x.conceptRef.code === 'E84').sections.some((s) => s.kind === 'symptoms'), false);
  const withAck = await run('c', { hpoAck: true });
  assert.equal(withAck.articles.find((x) => x.conceptRef.code === 'E84').sections.some((s) => s.kind === 'symptoms'), true);
});
