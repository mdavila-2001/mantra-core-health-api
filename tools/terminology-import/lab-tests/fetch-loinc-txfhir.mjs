#!/usr/bin/env node
// =============================================================================
// Catálogo de análisis · LOINC desde tx.fhir.org (servidor de terminología de HL7).
//
// loinc.org exige cuenta (y responde 403 a clientes no navegador). tx.fhir.org
// sirve LOINC completo (2.82 al escribir esto) por FHIR, con los nombres de las
// variantes lingüísticas como designaciones. Su `$expand` no devuelve
// propiedades y corta en 3 000 códigos, así que este script arma la tabla con
// filtros OFICIALES de LOINC, sin `$lookup` masivo:
//
//   1. Clases: por cada inicial, `CLASS regex ^X` excluyendo las clases ya
//      halladas; del primer código que aparece, `$lookup` da su CLASS (parte LP)
//      y otro `$lookup` el nombre de la clase. Se repite hasta que no aparece nada.
//   2. Términos de cada clase (`CLASS = N`) con designaciones; si la clase pasa
//      de 3 000, se parte por prefijo de `COMPONENT` (recursivo) sin perder códigos.
//   3. Estado (`STATUS`) y pedible/observación (`ORDER_OBS`) por clase, con los
//      mismos filtros. CLASSTYPE sale del `$lookup` de la muestra de cada clase.
//
// Buen ciudadano: ≤ 2 pedidos/s, User-Agent descriptivo y caché en disco por
// pedido (`lab-tests-sources/loinc-txfhir/cache/`): una corrida cortada se reanuda.
// Salida: `lab-tests-sources/loinc-txfhir/loinc-txfhir.json` (fuera de git).
//
// Uso: NODE_USE_ENV_PROXY=1 node tools/terminology-import/lab-tests/fetch-loinc-txfhir.mjs
// =============================================================================

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { BUILD_DIR, USER_AGENT, ensureDir, nowIso, sleep, writeJson } from '../lib/glossary-es/common.mjs';

export const TX_BASE = 'https://tx.fhir.org/r4';
const OUT_DIR = ensureDir(join(BUILD_DIR, 'lab-tests-sources', 'loinc-txfhir'));
const CACHE = ensureDir(join(OUT_DIR, 'cache'));
const MIN_INTERVAL_MS = 500;
const PAGE = 1000;
const MAX_EXPANSION = 3000;
/** Designaciones que se guardan: inglés (oficial) y las variantes en castellano. */
const KEEP_LANG = /^(en-US|es(-[A-Z]{2})?)$/;
/** Iniciales para descubrir clases y particionar COMPONENT (sensible a mayúsculas). */
const ALPHABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'];

let last = 0;
let requests = 0;
let cacheHits = 0;

async function call(method, url, body) {
  const key = createHash('sha1').update(`${method} ${url} ${body ?? ''}`).digest('hex');
  const file = join(CACHE, `${key}.json`);
  if (existsSync(file)) {
    cacheHits += 1;
    return JSON.parse(readFileSync(file, 'utf8'));
  }
  for (let attempt = 1; ; attempt += 1) {
    const wait = last + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    requests += 1;
    let res;
    try {
      res = await fetch(url, { method, body, headers: { 'Content-Type': 'application/fhir+json', Accept: 'application/fhir+json', 'User-Agent': USER_AGENT } });
    } catch (err) {
      if (attempt >= 6) throw err;
      await sleep(2000 * attempt);
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      if (attempt >= 6) throw new Error(`HTTP ${res.status} tras ${attempt} intentos: ${url}`);
      await sleep(3000 * attempt);
      continue;
    }
    const json = await res.json();
    // Las respuestas útiles (incluido «too-costly», que es determinista) se cachean; los errores transitorios no.
    writeFileSync(file, JSON.stringify(json));
    return json;
  }
}

const isTooCostly = (d) => d?.resourceType === 'OperationOutcome' && d.issue?.some((i) => i.code === 'too-costly');

/** `$expand` de un ValueSet inline; devuelve `{ tooCostly }` o `{ contains }`. */
async function expand(include, exclude = [], { count = PAGE, offset = 0, designations = false } = {}) {
  const vs = { resourceType: 'ValueSet', status: 'active', compose: { include: [{ system: 'http://loinc.org', filter: include }] } };
  if (exclude.length) vs.compose.exclude = exclude.map((f) => ({ system: 'http://loinc.org', filter: [f] }));
  const params = [
    { name: 'valueSet', resource: vs },
    { name: 'count', valueInteger: count },
    { name: 'offset', valueInteger: offset },
  ];
  if (designations) params.push({ name: 'includeDesignations', valueBoolean: true });
  const d = await call('POST', `${TX_BASE}/ValueSet/$expand`, JSON.stringify({ resourceType: 'Parameters', parameter: params }));
  if (isTooCostly(d)) return { tooCostly: true };
  if (d?.resourceType !== 'ValueSet') throw new Error(`$expand inesperado: ${JSON.stringify(d).slice(0, 300)}`);
  return { contains: d.expansion?.contains ?? [], version: (d.expansion?.parameter ?? []).find((p) => p.name === 'used-codesystem')?.valueUri ?? null };
}

/**
 * `$lookup` → `{ display, props }`. Sólo pide CLASS: algunos términos no tienen
 * CLASSTYPE y tx.fhir.org responde 500 si se lo pide («valueString must be a
 * string, not a undefined»). El CLASSTYPE de cada clase sale de `classTypeOf`.
 */
async function lookup(code) {
  const d = await call('GET', `${TX_BASE}/CodeSystem/$lookup?system=http://loinc.org&code=${encodeURIComponent(code)}&property=CLASS`);
  if (d?.resourceType !== 'Parameters') throw new Error(`$lookup ${code}: ${JSON.stringify(d).slice(0, 300)}`);
  const props = {};
  for (const p of d.parameter.filter((x) => x.name === 'property')) {
    const part = Object.fromEntries(p.part.map((q) => [q.name, q.valueCode ?? q.valueString ?? q.valueCoding?.code ?? null]));
    props[part.code] = part.value;
  }
  return { display: d.parameter.find((x) => x.name === 'display')?.valueString ?? null, props };
}

const reEscape = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const eq = (property, value) => ({ property, op: '=', value });
const regex = (property, value) => ({ property, op: 'regex', value });

/** Todas las páginas de una expansión de ≤ 3 000; `null` si es demasiado grande. */
async function allPages(include, designations) {
  const out = [];
  for (let offset = 0; offset < MAX_EXPANSION; offset += PAGE) {
    const r = await expand(include, [], { offset, designations });
    if (r.tooCostly) return null;
    out.push(...r.contains);
    if (r.contains.length < PAGE) break;
  }
  return out;
}

/**
 * Códigos de `include`, partiendo por prefijo de COMPONENT cuando hace falta.
 * Ramas de un prefijo p: cada carácter de ALPHABET, «otro carácter» y COMPONENT = p exacto.
 */
async function enumerate(include, designations, stats, prefix = null) {
  const filters = prefix == null ? include : [...include, regex('COMPONENT', prefix)];
  const got = await allPages(filters, designations);
  if (got) return got;
  stats.partitions += 1;
  const base = prefix == null ? '^' : prefix.replace(/\.\*$|$/, '');
  const head = prefix == null ? '' : base.slice(1);
  if (head.length > 12) throw new Error(`Partición demasiado profunda en ${JSON.stringify(include)} / ${prefix}`);
  const out = [];
  for (const c of ALPHABET) out.push(...(await enumerate(include, designations, stats, `${base}${reEscape(c)}`)));
  out.push(...(await enumerate(include, designations, stats, `${base}[^A-Za-z0-9]`)));
  if (head) out.push(...((await allPages([...include, regex('COMPONENT', `${base}$`)], designations)) ?? []));
  return out;
}

/** CLASSTYPE de una clase: el primer k (1–4) con algún término `CLASS = N ∧ CLASSTYPE = k`. */
async function classTypeOf(name) {
  const hits = [];
  for (const k of ['1', '2', '3', '4']) if ((await expand([eq('CLASS', name), eq('CLASSTYPE', k)], [], { count: 1 })).contains?.length) hits.push(k);
  if (hits.length > 1) console.warn(`[clases] ${name} tiene términos de varios CLASSTYPE: ${hits.join(', ')}`);
  return hits[0] ?? null;
}

async function discoverClasses() {
  const classes = {};
  const lpName = new Map();
  for (const initial of [...ALPHABET.filter((c) => !/[a-z]/.test(c)), '[^A-Z0-9]']) {
    const found = [];
    for (;;) {
      const r = await expand([regex('CLASS', `^${initial}`)], found.map((n) => eq('CLASS', n)), { count: 1 });
      if (r.tooCostly) throw new Error(`Descubrimiento: ^${initial} con exclusiones dio too-costly con count=1`);
      if (!r.contains.length) break;
      const sample = r.contains[0].code;
      const { props } = await lookup(sample);
      const lp = props.CLASS;
      if (!lp) throw new Error(`El término ${sample} no tiene CLASS`);
      if (!lpName.has(lp)) lpName.set(lp, (await lookup(lp)).display);
      const name = lpName.get(lp);
      if (found.includes(name)) throw new Error(`La exclusión no funcionó para ${name} (inicial ${initial})`);
      found.push(name);
      const classType = await classTypeOf(name);
      classes[name] = { partNumber: lp, classType, sample };
      console.log(`[clases] ${name} (${lp}, CLASSTYPE ${classType}) ← ${sample}`);
    }
  }
  return classes;
}

async function main() {
  const startedAt = nowIso();
  const classes = await discoverClasses();
  const terms = {};
  const stats = { partitions: 0 };
  let version = null;
  for (const [name, info] of Object.entries(classes)) {
    const rows = await enumerate([eq('CLASS', name)], true, stats);
    version ??= (await expand([eq('CLASS', name)], [], { count: 1 })).version;
    for (const c of rows) {
      terms[c.code] = {
        display: c.display ?? null,
        class: name,
        designations: (c.designation ?? []).filter((d) => KEEP_LANG.test(d.language ?? '')).map((d) => ({ lang: d.language, use: d.use?.code ?? null, value: d.value })),
      };
    }
    info.count = rows.length;
    for (const status of ['DEPRECATED', 'DISCOURAGED', 'TRIAL']) {
      for (const c of await enumerate([eq('CLASS', name), eq('STATUS', status)], false, stats)) {
        // Un término deprecado puede no venir en la expansión por clase: se agrega igual, sin designaciones.
        terms[c.code] ??= { display: c.display ?? null, class: name, designations: [], onlyFromStatusFilter: true };
        terms[c.code].status = status;
      }
    }
    for (const oo of ['Order', 'Both', 'Observation', 'Subset']) {
      for (const c of await enumerate([eq('CLASS', name), eq('ORDER_OBS', oo)], false, stats)) if (terms[c.code]) terms[c.code].orderObs = oo;
    }
    console.log(`[terms] ${name}: ${rows.length} (acumulado ${Object.keys(terms).length}; pedidos ${requests}, caché ${cacheHits})`);
  }
  const out = { source: 'tx.fhir.org', base: TX_BASE, codeSystemVersion: version, startedAt, finishedAt: nowIso(), requests, cacheHits, partitions: stats.partitions, classes, terms };
  writeJson(join(OUT_DIR, 'loinc-txfhir.json'), out);
  console.log(JSON.stringify({ version, classes: Object.keys(classes).length, terms: Object.keys(terms).length, requests, cacheHits, partitions: stats.partitions }, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en fetch-loinc-txfhir:', err);
  process.exitCode = 1;
});
