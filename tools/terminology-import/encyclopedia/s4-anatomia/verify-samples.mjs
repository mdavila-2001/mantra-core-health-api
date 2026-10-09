#!/usr/bin/env node
// Verificación de 25 artículos de muestra contra la FUENTE EN VIVO (no contra la
// caché del armado): cada oración del artículo se compara con lo que devuelve
// hoy un punto de acceso independiente de la fuente.
//   node verify-samples.mjs        → out/samples.json  (insumo de SAMPLES.md)
//
// Puntos de verificación (distintos de los que usa el armado):
//   Wikidata  → Special:EntityData/<Q>.json (el armado usa action=wbgetentities)
//   HPO       → EBI OLS4 (el armado usa hp.json de GitHub)
//   MeSH      → id.nlm.nih.gov/mesh/<ID>.json y su concepto (el armado usa SPARQL)
//   MedlinePlus → la página HTML de medlineplus.gov
//   Commons   → la página HTML del archivo (el armado usa imageinfo)
//   INLASA    → la página HTML del listado
// El veredicto lo da quien lee la salida: acá solo se compara texto literal.
// 1 petición por segundo, User-Agent identificable.

import { execFile } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { OUT_DIR, USER_AGENT } from './lib/config.mjs';
import { cleanText } from './lib/wikidata-sections.mjs';
import { loadSeedRows } from './lib/terms.mjs';

const readLines = (file) => readFileSync(join(OUT_DIR, file), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const articles = readLines('articles.ndjson');
const held = readLines('held.ndjson');
const seedBySlug = new Map(loadSeedRows().map((r) => [r.slug, r]));

// --- azar determinista (mulberry32) ---------------------------------------------
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = rng(20261008);
const pick = (list, n = 1) => {
  const pool = [...list].sort((a, b) => a.key.localeCompare(b.key));
  const out = [];
  while (out.length < n && pool.length > 0) out.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  return out;
};

const sectionPool = (predicate) =>
  articles.flatMap((a) => a.sections.filter((s) => predicate(a, s)).map((s) => ({ key: `${a.conceptRef.slug}/${s.kind}/${s.locator}`, article: a, section: s })));
const categoryOf = (a) => seedBySlug.get(a.conceptRef.slug).categoryKey;
const qOf = (url) => url.match(/Q\d+/)?.[0];

const chosen = [];
const take = (label, items) => items.forEach((item) => chosen.push({ label, ...item }));

take('anatomía · definición Wikidata (es)', pick(sectionPool((a, s) => categoryOf(a) === 'anatomy' && s.source === 'wikidata' && s.kind === 'definition' && s.lang === 'es'), 2));
take('anatomía · nota de alcance MeSH', pick(sectionPool((a, s) => categoryOf(a) === 'anatomy' && s.source === 'nlm-mesh'), 1));
take('anatomía · estructura (P527/P3262)', pick(sectionPool((a, s) => categoryOf(a) === 'anatomy' && s.kind === 'structure'), 1));
take('anatomía · irrigación', pick(sectionPool((a, s) => categoryOf(a) === 'anatomy' && s.kind === 'blood_supply'), 1));
take('anatomía · inervación', pick(sectionPool((a, s) => categoryOf(a) === 'anatomy' && s.kind === 'innervation'), 1));
take('anatomía · relevancia clínica (inversa P927)', pick(sectionPool((a, s) => categoryOf(a) === 'anatomy' && s.kind === 'clinical_relevance'), 1));
take('síntoma · definición Wikidata (es)', pick(sectionPool((a, s) => categoryOf(a) === 'signs-symptoms' && s.source === 'wikidata' && s.kind === 'definition' && s.lang === 'es'), 1));
take('síntoma · definición HPO', pick(sectionPool((a, s) => s.source === 'hpo'), 2));
take('síntoma · nota de alcance MeSH', pick(sectionPool((a, s) => categoryOf(a) === 'signs-symptoms' && s.source === 'nlm-mesh'), 1));
take('síntoma · MedlinePlus «mismo concepto»', pick(sectionPool((a, s) => s.source === 'nlm-medlineplus-es'), 1));
take('síntoma · condiciones asociadas (inversa P780)', pick(sectionPool((a, s) => categoryOf(a) === 'signs-symptoms' && s.locator.startsWith('Wikidata P780')), 1));
take('especialidad · definición Wikidata', pick(sectionPool((a, s) => categoryOf(a) === 'specialty' && s.kind === 'definition'), 1));
take('especialidad · enfermedades (inversa P1995)', pick(sectionPool((a, s) => categoryOf(a) === 'specialty' && s.kind === 'conditions_treated'), 1));
take('especialidad · subespecialidades (P527)', pick(sectionPool((a, s) => categoryOf(a) === 'specialty' && s.kind === 'subspecialties'), 1));
take('prueba · definición Wikidata', pick(sectionPool((a, s) => categoryOf(a) === 'diagnostic-test' && s.source === 'wikidata' && s.kind === 'definition'), 1));
take('prueba · propósito (inversa P923)', pick(sectionPool((a, s) => categoryOf(a) === 'diagnostic-test' && s.kind === 'purpose'), 1));
take('tratamiento · definición Wikidata', pick(sectionPool((a, s) => categoryOf(a) === 'treatment' && s.source === 'wikidata' && s.kind === 'definition'), 1));
take('tratamiento · nota de alcance MeSH', pick(sectionPool((a, s) => categoryOf(a) === 'treatment' && s.source === 'nlm-mesh'), 1));
take('tratamiento · propósito (condición tratada)', pick(sectionPool((a, s) => categoryOf(a) === 'treatment' && s.kind === 'purpose' && s.locator.startsWith('Wikidata P2175')), 1));

const imagePool = (predicate) => articles.flatMap((a) => a.images.filter((i) => predicate(a, i)).map((image) => ({ key: `${a.conceptRef.slug}/${image.url}`, article: a, image })));
const imageSamples = [
  ...pick(imagePool((a, i) => categoryOf(a) === 'anatomy' && /^CC BY-SA/.test(i.license)), 1),
  ...pick(imagePool((a, i) => i.license === 'Public domain'), 1),
];
imageSamples.forEach((s) => chosen.push({ label: 'imagen · autor y licencia', ...s }));

const inlasa = held.map((a) => ({ key: a.conceptRef.slug, article: a }));
pick(inlasa, 2).forEach((s) => chosen.push({ label: 'INLASA · código y nombre oficial', ...s }));

// --- acceso a la red -------------------------------------------------------------
let last = 0;
async function pace() {
  const wait = Math.max(0, last + 1100 - Date.now());
  await new Promise((r) => setTimeout(r, wait));
  last = Date.now();
}
async function get(url, accept) {
  await pace();
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, ...(accept ? { Accept: accept } : {}) } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res;
}
const getJson = async (url) => (await get(url, 'application/json')).json();
// inlasa.gob.bo no negocia TLS con el `fetch` de Node: se pide con curl (misma URL, mismo User-Agent).
const execFileAsync = promisify(execFile);
async function getText(url) {
  if (new URL(url).hostname.endsWith('inlasa.gob.bo')) {
    await pace();
    const { stdout } = await execFileAsync('curl', ['-sL', '-A', USER_AGENT, url], { maxBuffer: 64 * 1024 * 1024 });
    return stdout;
  }
  return (await get(url)).text();
}
const stripHtml = (html) =>
  html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

async function liveWikidata(q) {
  const json = await getJson(`https://www.wikidata.org/wiki/Special:EntityData/${q}.json`);
  return json.entities[q];
}

async function liveLabels(ids, lang = 'es') {
  const params = new URLSearchParams({ action: 'wbgetentities', format: 'json', props: 'labels', languages: 'es|en', ids: ids.join('|') });
  const json = await getJson(`https://www.wikidata.org/w/api.php?${params}`);
  return Object.fromEntries(ids.map((id) => [id, json.entities[id]?.labels?.[lang]?.value ?? json.entities[id]?.labels?.en?.value ?? null]));
}

const claimIds = (entity, p) => (entity.claims?.[p] ?? []).filter((s) => s.rank !== 'deprecated').map((s) => s.mainsnak?.datavalue?.value?.id).filter(Boolean);

async function verify(sample) {
  const { article, section, image } = sample;
  const slug = article.conceptRef.slug;
  const record = { label: sample.label, slug, term: seedBySlug.get(slug).esName, sourceUrl: section?.sourceUrl ?? image?.sourcePage ?? article.facts[0]?.sourceUrl };

  if (section?.source === 'wikidata' && section.kind === 'definition') {
    const q = qOf(section.sourceUrl);
    const entity = await liveWikidata(q);
    const lang = section.lang;
    const live = cleanText(entity.descriptions?.[lang]?.value ?? '');
    return { ...record, articleText: section.text, liveText: live, liveWhere: `Special:EntityData/${q}.json → descriptions.${lang}`, exact: live === section.text };
  }
  if (section?.source === 'hpo') {
    const hpId = section.locator.match(/HP:\d+/)[0];
    const iri = encodeURIComponent(`http://purl.obolibrary.org/obo/HP_${hpId.slice(3)}`);
    const json = await getJson(`https://www.ebi.ac.uk/ols4/api/ontologies/hp/terms?iri=${iri}`);
    const live = json._embedded?.terms?.[0]?.description?.[0] ?? '';
    return { ...record, articleText: section.text, liveText: live, liveWhere: `EBI OLS4 · HP ${hpId} → description`, exact: live === section.text };
  }
  if (section?.source === 'nlm-mesh') {
    const id = section.sourceUrl.match(/ui=(D\d+)/)[1];
    const descriptor = await getJson(`https://id.nlm.nih.gov/mesh/${id}.json`);
    const concept = String(descriptor.preferredConcept).split('/').pop();
    const conceptJson = await getJson(`https://id.nlm.nih.gov/mesh/${concept}.json`);
    const note = conceptJson.scopeNote;
    const live = typeof note === 'string' ? note : (note?.['@value'] ?? '');
    return { ...record, articleText: section.text, liveText: live, liveWhere: `id.nlm.nih.gov/mesh/${concept}.json → scopeNote`, exact: live === section.text };
  }
  if (section?.source === 'nlm-medlineplus-es') {
    const page = norm(stripHtml(await getText(section.sourceUrl)));
    // El texto de la semilla marca las viñetas con «• »; la página las muestra sin el signo.
    const paragraphs = section.text.split(/\n+/).map((p) => norm(p.replace(/^•\s*/, ''))).filter(Boolean);
    const found = paragraphs.map((p) => page.includes(p));
    return { ...record, articleText: section.text.slice(0, 400), liveText: `${found.filter(Boolean).length}/${paragraphs.length} líneas encontradas literalmente en ${section.sourceUrl}`, liveWhere: 'HTML de medlineplus.gov', exact: found.every(Boolean) };
  }
  if (section && section.sourceUrl.includes('Special:WhatLinksHere')) {
    // inversa: la enfermedad declara la propiedad hacia el término
    const q = qOf(section.sourceUrl);
    const property = section.locator.match(/P\d+/)[0];
    const row = seedBySlug.get(slug);
    const byName = new Map();
    for (const rel of row.relations ?? []) {
      const m = String(rel.provenance ?? '').match(/^wikidata:(P\d+) (Q\d+)→(Q\d+)/);
      if (m && m[1] === property && m[3] === q) byName.set(rel.targetName, m[2]);
    }
    const sampled = pick([...section.items].filter((n) => byName.has(n)).map((n) => ({ key: n })), 2).map((x) => x.key);
    const checks = [];
    for (const name of sampled) {
      const diseaseQ = byName.get(name);
      const disease = await liveWikidata(diseaseQ);
      checks.push({ name, diseaseQ, declares: claimIds(disease, property).includes(q) });
    }
    return { ...record, articleText: `${section.items.length} ítems; verificados: ${sampled.join(' | ')}`, liveText: checks.map((c) => `${c.name} (${c.diseaseQ}) ${property} → ${q}: ${c.declares ? 'SÍ' : 'NO'}`).join(' ; '), liveWhere: 'Special:EntityData de cada enfermedad', exact: checks.length > 0 && checks.every((c) => c.declares) };
  }
  if (section?.source === 'wikidata') {
    const q = qOf(section.sourceUrl);
    const property = section.locator.match(/P\d+/)[0];
    const entity = await liveWikidata(q);
    const ids = claimIds(entity, property);
    const labels = await liveLabels(ids.slice(0, 50));
    const live = ids.slice(0, 50).map((id) => labels[id]).filter(Boolean);
    const same = section.items.slice(0, live.length).every((x, i) => cleanText(live[i]) === x) || JSON.stringify([...live].sort()) === JSON.stringify([...section.items].sort());
    return { ...record, articleText: section.items.join('; '), liveText: live.join('; '), liveWhere: `Special:EntityData/${q}.json → ${property} + etiquetas`, exact: same };
  }
  if (image) {
    const html = await getText(image.sourcePage);
    const text = stripHtml(html);
    const authorPlain = image.author?.replace(/\s+/g, ' ');
    const hasLicense = text.includes(image.license) || html.includes(image.licenseUrl?.replace(/^https?:/, '') ?? '@@');
    const hasAuthor = authorPlain ? text.includes(authorPlain.slice(0, 40)) : null;
    return { ...record, articleText: `${image.license} · autor «${image.author}» · ${image.kind}`, liveText: `licencia en la página: ${hasLicense ? 'SÍ' : 'NO'}; autor en la página: ${hasAuthor === null ? 'sin autor declarado' : hasAuthor ? 'SÍ' : 'NO'}`, liveWhere: image.sourcePage, exact: hasLicense && hasAuthor !== false, image };
  }
  if (article.facts.some((f) => f.label === 'Código INLASA')) {
    const code = article.facts.find((f) => f.label === 'Código INLASA').value;
    const name = article.facts.find((f) => f.label === 'Nombre oficial (INLASA)')?.value;
    const page = norm(stripHtml(await getText('https://inlasa.gob.bo/servicios-y-aranceles-del-inlasa/')));
    const needle = `${code} ${name}`;
    return { ...record, articleText: needle, liveText: page.includes(needle) ? `«${needle}» aparece literal en el listado` : 'NO aparece', liveWhere: 'HTML del listado de INLASA', exact: page.includes(needle) };
  }
  return { ...record, articleText: '?', liveText: '?', liveWhere: '?', exact: false };
}

const results = [];
for (const [index, sample] of chosen.entries()) {
  try {
    const r = await verify(sample);
    results.push({ n: index + 1, ...r });
    console.log(`${index + 1}/${chosen.length} ${r.exact ? 'IGUAL' : 'DIFERENTE'} · ${r.label} · ${r.slug}`);
  } catch (error) {
    results.push({ n: index + 1, label: sample.label, slug: sample.article.conceptRef.slug, error: String(error.message), exact: false });
    console.log(`${index + 1}/${chosen.length} ERROR · ${sample.label} · ${error.message}`);
  }
}
writeFileSync(join(OUT_DIR, 'samples.json'), JSON.stringify(results, null, 2) + '\n');
console.log(`samples.json escrito: ${results.filter((r) => r.exact).length}/${results.length} iguales`);
