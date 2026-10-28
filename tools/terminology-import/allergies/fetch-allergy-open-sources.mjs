#!/usr/bin/env node
// =============================================================================
// Catálogo de alergias · tanda 2 · etapa 0 (descarga HTTP reproducible, con red).
//
// Baja las fuentes abiertas que el 2026-10-24 estaban bloqueadas (403) y hoy
// responden: IUIS (allergen.org), UniProt KW-0020, openFDA NDC + DailyMed SPL +
// GSRS (UNII), RxNav/RxClass, ChEBI, NCIt (EVS), EUR-Lex (Cellar), 21 USC 321,
// CDC CVX, MeSH y artículos abiertos de Europa PMC. Todo FUERA de git, en
// `<GLOSSARY_BUILD_DIR>/allergy-sources/open/<fuente>/`.
//
// Reglas de buena ciudadanía: User-Agent identificable, ≤ 2 pedidos/s por host
// (allergen.org: 1 cada 3,5 s por su robots.txt), reintentos con backoff, caché en
// disco (reanudable: lo que ya está bajado no se vuelve a pedir). No usa cuentas,
// tokens ni evade controles.
//
// Deja `manifest-open.json` con, por fuente: URL(s), versión de la fuente, fecha,
// SHA-256 de cada archivo, licencia y su evidencia.
//
// Uso:
//   node tools/terminology-import/allergies/fetch-allergy-open-sources.mjs [--only k1,k2] [--plan]
//   claves: iuis uniprot cdc-cvx chebi ncit eurlex usc openfda dailymed gsrs rxnav europepmc mesh
// =============================================================================

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { dirname, join, relative } from 'node:path';

import { HttpClient, nowIso, sleep } from '../lib/glossary-es/common.mjs';
import { OPEN_DIR, OPEN_MANIFEST, OPEN_SOURCES, OPEN_USER_AGENT } from './lib/open-sources.mjs';
import { parseSplIngredients } from './lib/parse-open.mjs';

const args = process.argv.slice(2);
const only = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
const PLAN = args.includes('--plan');
const wants = (k) => !only || only.has(k);

const http = (minDelayMs = 500, concurrency = 1) => new HttpClient({ concurrency, minDelayMs, maxRetries: 6, headers: { 'User-Agent': OPEN_USER_AGENT } });
const sha = (buf) => createHash('sha256').update(buf).digest('hex');
const dirOf = (key) => {
  const d = join(OPEN_DIR, key);
  mkdirSync(d, { recursive: true });
  return d;
};

const manifest = existsSync(OPEN_MANIFEST) ? JSON.parse(readFileSync(OPEN_MANIFEST, 'utf8')) : { sources: {} };

/** Baja `url` a `file` (caché); devuelve {path, url, bytes, sha256, headers?}. Las cabeceras útiles quedan en un archivo aparte para que la corrida siguiente las vea. */
async function grab(client, key, url, name, opts = {}) {
  const file = join(dirOf(key), name);
  mkdirSync(dirname(file), { recursive: true });
  const side = join(dirOf(key), '.headers', `${name.replace(/[\\/]/g, '__')}.json`);
  if (!existsSync(file)) {
    const res = await client.get(url, opts);
    if (opts.expect && !opts.expect.test(res.body.toString('utf8'))) throw new Error(`La respuesta de ${url} no contiene lo esperado (${opts.expect}): ¿página de error con 200?`);
    writeFileSync(file, res.body);
    mkdirSync(dirname(side), { recursive: true });
    writeFileSync(side, JSON.stringify(pick(Object.fromEntries(res.headers.entries()), ['x-uniprot-release', 'x-uniprot-release-date', 'x-total-results', 'last-modified', 'etag', 'content-type'])));
  }
  const buf = readFileSync(file);
  const headers = existsSync(side) ? JSON.parse(readFileSync(side, 'utf8')) : undefined;
  return { path: relative(OPEN_DIR, file), url, bytes: buf.length, sha256: sha(buf), ...(headers ? { headers } : {}) };
}
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));

function record(key, extra) {
  const meta = OPEN_SOURCES[extra.meta ?? key] ?? {};
  // la fecha de descarga es la de la primera vez que se bajó ese contenido: una corrida que no cambia nada la conserva
  const fingerprint = sha(JSON.stringify([extra.files?.map((f) => [f.path, f.sha256]), extra.splDigest, extra.digest, extra.membersEpc, extra.statusOfRetired, extra.version]));
  const prev = manifest.sources[key];
  manifest.sources[key] = { key, owner: meta.owner, license: meta.license, licenseEvidence: meta.licenseEvidence, retrievedAt: prev?.fingerprint === fingerprint ? prev.retrievedAt : nowIso(), fingerprint, ...extra };
  delete manifest.sources[key].meta;
  writeFileSync(OPEN_MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
}

/** Resumen de un conjunto grande de archivos: cuántos y un SHA-256 del listado ordenado de hashes. */
function treeDigest(key, sub) {
  const root = join(dirOf(key), sub);
  const files = existsSync(root) ? readdirSync(root).sort() : [];
  const h = createHash('sha256');
  for (const f of files) h.update(`${f}:${sha(readFileSync(join(root, f)))}\n`);
  return { count: files.length, sha256: h.digest('hex') };
}

// --- IUIS ---------------------------------------------------------------------
async function fetchIuis() {
  const c = http(3500);
  const files = [];
  for (const t of ['allergen', 'isoallergen', 'idmapping']) files.push(await grab(c, 'iuis', `https://www.allergen.org/csv.php?table=${t}`, `${t}.csv`));
  files.push(await grab(c, 'iuis', 'https://www.allergen.org/downloads.php', 'downloads.html'));
  files.push(await grab(c, 'iuis', 'https://www.allergen.org/robots.txt', 'robots.txt'));
  record('iuis', { version: `descarga ${nowIso().slice(0, 10)} (la base no publica número de versión; cada fila trae DateAdded/DateUpdated)`, files });
}

// --- UniProt ------------------------------------------------------------------
async function fetchUniprot() {
  const c = http(500);
  const fields = 'accession,id,protein_name,gene_names,organism_name,organism_id,cc_allergen,keyword,reviewed,protein_existence,length';
  const files = [
    await grab(c, 'uniprot', `https://rest.uniprot.org/uniprotkb/stream?compressed=false&format=tsv&fields=${fields}&query=keyword%3AKW-0020`, 'uniprotkb-kw0020.tsv'),
    await grab(c, 'uniprot', 'https://rest.uniprot.org/keywords/KW-0020', 'keyword-KW-0020.json'),
  ];
  const rel = files[0].headers?.['x-uniprot-release'];
  record('uniprot', { version: `UniProt ${rel ?? 's/d'} (${files[0].headers?.['x-uniprot-release-date'] ?? ''})`, files });
}

// --- CDC CVX ---------------------------------------------------------------------
async function fetchCvx() {
  const c = http(500);
  const files = [];
  for (const f of ['cvx.txt', 'tradename.txt', 'mvx.txt']) files.push(await grab(c, 'cdc-cvx', `https://www2a.cdc.gov/vaccines/iis/iisstandards/downloads/${f}`, f, { allow404: true }));
  record('cdc-cvx', { meta: 'cdc-cvx', version: `descarga ${nowIso().slice(0, 10)} (cada fila de cvx.txt trae «Last Updated»)`, files });
}

// --- ChEBI ----------------------------------------------------------------------
async function fetchChebi() {
  const c = http(500);
  const base = 'https://ftp.ebi.ac.uk/pub/databases/chebi/ontology';
  const files = [];
  for (const f of ['chebi_lite.obo.gz', 'LICENSE', 'README']) files.push(await grab(c, 'chebi-lite', `${base}/${f}`, f));
  const readme = readFileSync(join(dirOf('chebi-lite'), 'README'), 'utf8');
  const rel = readme.match(/ChEBI Release:\s*(\d+)/)?.[1];
  const date = readme.match(/Date of last update:\s*([\d-]+)/)?.[1];
  record('chebi-lite', { version: `ChEBI ${rel} (${date})`, files });
}

// --- NCIt (EVS REST) ----------------------------------------------------------------
export const NCIT_ROOTS = ['C62651', 'C3114'];
async function fetchNcit() {
  const c = http(500);
  const api = 'https://api-evsrest.nci.nih.gov/api/v1';
  const files = [await grab(c, 'ncit', `${api}/metadata/terminologies?latest=true&terminology=ncit`, 'terminologies.json')];
  const codes = new Set(NCIT_ROOTS);
  for (const root of NCIT_ROOTS) {
    const f = await grab(c, 'ncit', `${api}/concept/ncit/${root}/descendants?include=minimal&pageSize=5000`, `descendants-${root}.json`);
    files.push(f);
    for (const d of JSON.parse(readFileSync(join(OPEN_DIR, f.path), 'utf8'))) codes.add(d.code);
  }
  for (const code of [...codes].sort()) {
    files.push(await grab(c, 'ncit', `${api}/concept/ncit/${code}?include=synonyms,definitions,properties,parents`, `concepts/${code}.json`));
  }
  const term = JSON.parse(readFileSync(join(dirOf('ncit'), 'terminologies.json'), 'utf8')).find((t) => t.terminology === 'ncit');
  record('ncit', { version: `NCIt ${term?.version} (${term?.date})`, roots: NCIT_ROOTS, files: files.map(({ headers, ...f }) => f) });
}

// --- EUR-Lex vía Cellar ---------------------------------------------------------------
async function celexLatest(c, prefix) {
  const q = `PREFIX cdm: <http://publications.europa.eu/ontology/cdm#> SELECT DISTINCT ?c WHERE { ?w cdm:resource_legal_id_celex ?c . FILTER(STRSTARTS(STR(?c),"${prefix}-")) } ORDER BY DESC(?c) LIMIT 1`;
  const res = await c.get(`https://publications.europa.eu/webapi/rdf/sparql?query=${encodeURIComponent(q)}`, { accept: 'application/sparql-results+json' });
  return JSON.parse(res.body.toString('utf8')).results.bindings[0].c.value;
}
async function fetchEurlex() {
  const c = http(1000);
  c.headers['Accept-Language'] = 'spa';
  const c2 = http(1000);
  c2.headers['Accept-Language'] = 'eng';
  const latest1169 = await celexLatest(c, '02011R1169');
  const latest1333 = await celexLatest(c, '02008R1333');
  const f1169 = [];
  for (const [client, lang] of [[c, 'spa'], [c2, 'eng']]) {
    f1169.push(await grab(client, 'eurlex-1169', `http://publications.europa.eu/resource/celex/${latest1169}`, `${latest1169}.${lang}.xhtml`, { accept: 'application/xhtml+xml' }));
  }
  f1169.push(await grab(c, 'eurlex-1169', 'http://publications.europa.eu/resource/celex/32011D0833', '32011D0833.spa.xhtml', { accept: 'application/xhtml+xml' }));
  record('eurlex-1169', { version: `texto consolidado ${latest1169}`, celex: { consolidated: latest1169, reuseDecision: '32011D0833' }, files: f1169.map(({ headers, ...f }) => f) });
  const f1333 = [];
  for (const [client, lang] of [[c, 'spa'], [c2, 'eng']]) f1333.push(await grab(client, 'eurlex-1333', `http://publications.europa.eu/resource/celex/${latest1333}`, `${latest1333}.${lang}.xhtml`, { accept: 'application/xhtml+xml' }));
  record('eurlex-1333', { version: `consolidado ${latest1333}`, celex: { consolidated: latest1333 }, files: f1333.map(({ headers, ...f }) => f) });
}

// --- 21 USC 321 -------------------------------------------------------------------
async function fetchUsc() {
  const c = http(1000);
  const files = [await grab(c, 'usc-21-321', 'https://www.govinfo.gov/content/pkg/USCODE-2023-title21/html/USCODE-2023-title21-chap9-subchapII-sec321.htm', 'USCODE-2023-title21-sec321.htm', { expect: /major food allergen/ })];
  record('usc-21-321', { version: 'United States Code, edición 2023, título 21, §321 (GovInfo todavía no publica 2024 ni 2025: responde 200 con una página de error)', files: files.map(({ headers, ...f }) => f) });
}

// --- openFDA NDC (alergénicos) ---------------------------------------------------------
const NDC_TYPES = ['STANDARDIZED ALLERGENIC', 'NON-STANDARDIZED ALLERGENIC'];
async function fetchOpenfda() {
  const c = http(700);
  const files = [];
  let lastUpdated = null;
  for (const type of NDC_TYPES) {
    const slug = type.toLowerCase().replace(/[^a-z]+/g, '-');
    const q = encodeURIComponent(`product_type.exact:"${type}"`);
    let skip = 0;
    for (let page = 0; ; page++) {
      const f = await grab(c, 'openfda', `https://api.fda.gov/drug/ndc.json?search=${q}&limit=1000&skip=${skip}`, `ndc-${slug}-${String(page).padStart(2, '0')}.json`);
      files.push(f);
      const d = JSON.parse(readFileSync(join(OPEN_DIR, f.path), 'utf8'));
      lastUpdated = d.meta.last_updated;
      skip += d.results.length;
      if (skip >= d.meta.results.total || d.results.length === 0) break;
    }
  }
  record('openfda', { version: `openFDA NDC last_updated ${lastUpdated}`, files: files.map(({ headers, ...f }) => f) });
}

/** product_ndc únicos del barrido de openFDA. */
function ndcProducts() {
  const dir = dirOf('openfda');
  const out = new Map();
  for (const f of readdirSync(dir).filter((x) => x.startsWith('ndc-')).sort()) {
    for (const r of JSON.parse(readFileSync(join(dir, f), 'utf8')).results) out.set(r.product_ndc, r);
  }
  return out;
}

// --- DailyMed: NDC → set id → SPL XML ---------------------------------------------------
async function fetchDailymed() {
  const c = http(400, 2); // ≈1 pedido/s: bien por debajo de 2/s
  const products = ndcProducts();
  const mapPath = join(dirOf('dailymed'), 'ndc-to-setid.json');
  const map = existsSync(mapPath) ? JSON.parse(readFileSync(mapPath, 'utf8')) : {};
  let n = 0;
  for (const ndc of [...products.keys()].sort()) {
    if (ndc in map) continue;
    const res = await c.get(`https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?ndc=${ndc}&pagesize=100`, { accept: 'application/json' });
    map[ndc] = JSON.parse(res.body.toString('utf8')).data.map((x) => ({ setid: x.setid, version: x.spl_version, published: x.published_date }));
    if (++n % 100 === 0) {
      writeFileSync(mapPath, JSON.stringify(map));
      console.log(`  dailymed ndc→setid ${Object.keys(map).length}/${products.size}`);
    }
  }
  writeFileSync(mapPath, JSON.stringify(map));
  const setids = [...new Set(Object.values(map).flat().map((x) => x.setid))].sort();
  console.log(`  dailymed: ${setids.length} set ids distintos`);
  // Cada etiqueta SPL pesa 0,3–3 MB y hay cientos: se baja, se extrae la identificación de los
  // ingredientes (NDC de producto, rol, UNII, nombre) y se guarda sólo eso, con el SHA-256 y el tamaño
  // del XML original (la etiqueta se vuelve a bajar de la misma URL cuando haga falta).
  let m = 0;
  const splDir = join(dirOf('dailymed'), 'spl');
  mkdirSync(splDir, { recursive: true });
  for (const s of setids) {
    const out = join(splDir, `${s}.json`);
    if (!existsSync(out)) {
      const url = `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/${s}.xml`;
      const res = await c.get(url);
      const xml = res.body.toString('utf8');
      writeFileSync(out, JSON.stringify({ setid: s, url, xmlSha256: sha(res.body), xmlBytes: res.body.length, products: parseSplIngredients(xml) }));
    }
    if (++m % 50 === 0) console.log(`  dailymed spl ${m}/${setids.length}`);
  }
  record('dailymed', { version: 'DailyMed v2 (spls por NDC de openFDA)', ndcProducts: products.size, ndcWithoutSpl: Object.values(map).filter((x) => x.length === 0).length, setIds: setids.length, splDigest: treeDigest('dailymed', 'spl'), mapFile: { path: relative(OPEN_DIR, mapPath), sha256: sha(readFileSync(mapPath)) } });
  // T.R.U.E. TEST (serie de pruebas de parche)
  const tt = await grab(c, 'dailymed-true-test', 'https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/2f082b68-dc74-418a-9e6f-b3c285b41d44.xml', 'true-test.xml');
  record('dailymed-true-test', { version: 'SPL setid 2f082b68-dc74-418a-9e6f-b3c285b41d44', files: [tt] });
}

/** UNII de los ingredientes activos (ACTIB/ACTIM/ACTIR) de los SPL descargados (JSON compactos). */
export function splActiveUniis(dir) {
  const out = new Set();
  for (const f of readdirSync(dir)) {
    for (const p of JSON.parse(readFileSync(join(dir, f), 'utf8')).products) for (const i of p.ingredients) if (['ACTIB', 'ACTIM', 'ACTIR'].includes(i.role)) out.add(i.unii);
  }
  return out;
}

// --- GSRS (UNII) ---------------------------------------------------------------------
async function fetchGsrs() {
  const c = http(500);
  const unii = [...splActiveUniis(join(dirOf('dailymed'), 'spl'))].sort();
  console.log(`  gsrs: ${unii.length} UNII activos`);
  let n = 0;
  for (const u of unii) {
    await grab(c, 'gsrs', `https://gsrs.ncats.nih.gov/api/v1/substances(${u})?view=full`, `substances/${u}.json`, { accept: 'application/json', allow404: true });
    if (++n % 100 === 0) console.log(`  gsrs ${n}/${unii.length}`);
  }
  record('gsrs', { version: `GSRS ${nowIso().slice(0, 10)} (cada sustancia trae lastEdited/version)`, uniiCount: unii.length, digest: treeDigest('gsrs', 'substances') });
}

// --- RxNav / RxClass ---------------------------------------------------------------
const CLASS_TYPES = ['EPC', 'MOA', 'PE', 'PK', 'TC', 'CHEM', 'VA'];
async function fetchRxnav() {
  const c = http(500);
  const api = 'https://rxnav.nlm.nih.gov/REST';
  const files = [await grab(c, 'rxnav', `${api}/version.json`, 'version.json'), await grab(c, 'rxnav', `${api}/allconcepts.json?tty=IN+PIN+MIN`, 'allconcepts-IN-PIN-MIN.json')];
  for (const t of CLASS_TYPES) files.push(await grab(c, 'rxnav', `${api}/rxclass/allClasses.json?classTypes=${t}`, `allClasses-${t}.json`));
  // miembros de las clases EPC: RxClass los publica con relaSource=DAILYMED (etiquetas SPL: trae el UNII de cada miembro); MED-RT no tiene la relación has_EPC
  const epc = JSON.parse(readFileSync(join(dirOf('rxnav'), 'allClasses-EPC.json'), 'utf8')).rxclassMinConceptList.rxclassMinConcept;
  let n = 0;
  for (const k of epc) {
    await grab(c, 'rxnav', `${api}/rxclass/classMembers.json?classId=${k.classId}&relaSource=DAILYMED&rela=has_epc`, `members-EPC/${k.classId}.json`, { allow404: true });
    if (++n % 100 === 0) console.log(`  rxclass members EPC ${n}/${epc.length}`);
  }
  // estado de los RxCUI de ingredientes ya cargados que ya no están en allconcepts
  const current = new Set(JSON.parse(readFileSync(join(dirOf('rxnav'), 'allconcepts-IN-PIN-MIN.json'), 'utf8')).minConceptGroup.minConcept.map((x) => x.rxcui));
  const baseFile = join(dirname(new URL(import.meta.url).pathname), 'data', 'allergy-catalog.ndjson.gz');
  const base = gunzipSync(readFileSync(baseFile)).toString('utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const missing = base.filter((r) => r.codeSystem === 'allergy-rxnorm-ingredients' && !current.has(r.code)).map((r) => r.code);
  console.log(`  rxnav: ${missing.length} RxCUI cargados el 2026-10-24 que no están hoy en IN/PIN/MIN`);
  n = 0;
  for (const code of missing) {
    await grab(c, 'rxnav', `${api}/rxcui/${code}/historystatus.json`, `status/${code}.json`, { allow404: true });
    if (++n % 100 === 0) console.log(`  rxnav status ${n}/${missing.length}`);
  }
  const ver = JSON.parse(readFileSync(join(dirOf('rxnav'), 'version.json'), 'utf8'));
  record('rxnav', {
    version: `RxNorm ${ver.version} (RxNav API ${ver.apiVersion})`,
    files: files.map(({ headers, ...f }) => f),
    membersEpc: treeDigest('rxnav', 'members-EPC'),
    statusOfRetired: treeDigest('rxnav', 'status'),
  });
}

// --- Europe PMC (serie basal europea, acceso abierto) -----------------------------------------
async function fetchEuropepmc() {
  const c = http(500);
  const files = [];
  for (const pmc of ['PMC13238334', 'PMC13441338']) {
    files.push(await grab(c, 'europepmc-ebs', `https://www.ebi.ac.uk/europepmc/webservices/rest/${pmc}/fullTextXML`, `${pmc}.xml`));
    files.push(await grab(c, 'europepmc-ebs', `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=PMCID%3A${pmc}&format=json&resultType=core`, `${pmc}.search.json`));
  }
  record('europepmc-ebs', { version: 'Europe PMC fullTextXML', files: files.map(({ headers, ...f }) => f) });
}

// --- MeSH ----------------------------------------------------------------------------
async function fetchMesh() {
  const c = http(1000);
  const dir = dirOf('mesh');
  const rawPath = join(dir, 'desc2026.xml');
  const subsetPath = join(dir, 'desc2026.allergy-subset.xml');
  const prev = manifest.sources.mesh;
  let raw;
  if (existsSync(rawPath) || !existsSync(subsetPath)) {
    raw = await grab(c, 'mesh', 'https://nlmpubs.nlm.nih.gov/projects/mesh/MESH_FILES/xmlmesh/desc2026.gz', 'desc2026.xml');
  } else raw = prev.files[0];
  if (!existsSync(subsetPath)) {
    // el XML completo pesa ~313 MB (el servidor lo entrega descomprimido): se conserva sólo el subconjunto de alergia
    const x = readFileSync(rawPath, 'utf8');
    const out = [];
    for (let pos = 0; ; ) {
      const a = x.indexOf('<DescriptorRecord ', pos);
      if (a < 0) break;
      const b = x.indexOf('</DescriptorRecord>', a);
      pos = b + 19;
      const r = x.slice(a, b + 19);
      const trees = [...r.matchAll(/<TreeNumber>([^<]+)<\/TreeNumber>/g)].map((m) => m[1]);
      if (trees.some((t) => ['D23.050.063', 'C20.543'].some((p) => t === p || t.startsWith(`${p}.`)))) out.push(r);
    }
    writeFileSync(subsetPath, `<DescriptorRecordSet LanguageCode="eng">\n${out.join('\n')}\n</DescriptorRecordSet>\n`);
  }
  if (existsSync(rawPath) && !args.includes('--keep-raw')) (await import('node:fs')).rmSync(rawPath);
  const subset = readFileSync(subsetPath);
  record('mesh', { version: 'MeSH 2026 (desc2026.gz, que el servidor entrega descomprimido)', files: [raw, { path: relative(OPEN_DIR, subsetPath), url: raw.url, bytes: subset.length, sha256: sha(subset), note: 'subconjunto: descriptores bajo D23.050.063 y C20.543 del archivo completo (sha256 en el primer archivo)' }] });
}

const STEPS = [
  ['iuis', fetchIuis],
  ['uniprot', fetchUniprot],
  ['cdc-cvx', fetchCvx],
  ['chebi', fetchChebi],
  ['ncit', fetchNcit],
  ['eurlex', fetchEurlex],
  ['usc', fetchUsc],
  ['openfda', fetchOpenfda],
  ['dailymed', fetchDailymed],
  ['gsrs', fetchGsrs],
  ['rxnav', fetchRxnav],
  ['europepmc', fetchEuropepmc],
  ['mesh', fetchMesh],
];

if (PLAN) {
  console.log(STEPS.map(([k]) => k).join('\n'));
} else {
  for (const [key, fn] of STEPS) {
    if (!wants(key)) continue;
    const t0 = Date.now();
    try {
      await fn();
      console.log(`[ok] ${key} (${Math.round((Date.now() - t0) / 1000)} s)`);
    } catch (err) {
      console.error(`[falla] ${key}: ${err.message}`);
      process.exitCode = 1;
    }
  }
  console.log(`manifest → ${OPEN_MANIFEST}`);
}
