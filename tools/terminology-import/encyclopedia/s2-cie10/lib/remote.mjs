// =============================================================================
// Consultas remotas del corte S2: notas de alcance de MeSH (SPARQL de NLM),
// puente CIE-10 ↔ Wikidata (SPARQL de WDQS) y metadatos de Commons.
//
// Cortesía: todo pasa por un `HttpClient` de a 1 pedido, ≥1 s entre pedidos,
// User-Agent identificable y caché en disco por pedido (reanudable; una corrida
// repetida no toca la red). Nada de esto escribe en ningún servicio.
// =============================================================================

import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { htmlToText } from '../../../lib/glossary-es/common.mjs';
import { WIKIDATA_CODE_PROPERTIES, WIKIDATA_FACT_PROPERTIES } from './config.mjs';

export const MESH_SPARQL = 'https://id.nlm.nih.gov/mesh/sparql';
export const WDQS_SPARQL = 'https://query.wikidata.org/sparql';
export const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
export const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

const shortHash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 16);
const qidOf = (uri) => uri.slice(uri.lastIndexOf('/') + 1);

// --- MeSH ---------------------------------------------------------------------

export function meshScopeNoteQuery(ids) {
  const values = ids.map((i) => `mesh:${i}`).join(' ');
  return [
    'PREFIX meshv: <http://id.nlm.nih.gov/mesh/vocab#>',
    'PREFIX mesh: <http://id.nlm.nih.gov/mesh/>',
    'PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>',
    `SELECT ?d ?label ?note WHERE { VALUES ?d { ${values} } ?d rdfs:label ?label . ?d meshv:preferredConcept ?c . ?c meshv:scopeNote ?note . }`,
  ].join('\n');
}

/** Solo descriptores (`D…`): los conceptos suplementarios (`C…`) no llevan nota de alcance en este esquema. */
export const isMeshDescriptor = (id) => /^D\d{6}$/.test(id);

export function parseMeshBindings(json) {
  const out = new Map();
  for (const b of json?.results?.bindings ?? []) {
    out.set(qidOf(b.d.value), { id: qidOf(b.d.value), label: b.label.value, scopeNote: b.note.value.trim() });
  }
  return out;
}

export async function fetchMeshScopeNotes(http, ids, cacheDir, batchSize = 100) {
  const wanted = [...new Set(ids)].filter(isMeshDescriptor).sort();
  const out = new Map();
  for (let i = 0; i < wanted.length; i += batchSize) {
    const batch = wanted.slice(i, i + batchSize);
    const url = `${MESH_SPARQL}?${new URLSearchParams({ format: 'JSON', query: meshScopeNoteQuery(batch) })}`;
    const json = await http.getJsonCached(url, join(cacheDir, 'mesh', `scope-${shortHash(batch.join(','))}.json`));
    for (const [k, v] of parseMeshBindings(json)) out.set(k, v);
  }
  return out;
}

// --- Wikidata -------------------------------------------------------------------

/** Etiqueta inglesa esperada de cada propiedad: un id equivocado aborta la corrida. */
export async function assertWikidataProperties(http, cacheDir) {
  const expected = {
    ...Object.fromEntries(Object.entries(WIKIDATA_CODE_PROPERTIES).map(([p, v]) => [p, v.expectedLabel])),
    ...Object.fromEntries(Object.entries(WIKIDATA_FACT_PROPERTIES).map(([p, v]) => [p, v.expectedLabel])),
    P18: 'image',
  };
  const url = `${WIKIDATA_API}?action=wbgetentities&format=json&props=labels&languages=en&ids=${Object.keys(expected).sort().join('|')}`;
  const json = await http.getJsonCached(url, join(cacheDir, 'wikidata', 'property-labels.json'));
  const bad = Object.entries(expected)
    .filter(([id, label]) => json?.entities?.[id]?.labels?.en?.value !== label)
    .map(([id, label]) => `${id}: esperado «${label}», Wikidata dice «${json?.entities?.[id]?.labels?.en?.value ?? '—'}»`);
  if (bad.length) throw new Error(`Propiedades de Wikidata que no son lo que se cree: ${bad.join('; ')}`);
}

const ICD_ITEMS = '{ ?item wdt:P4229 ?_icd } UNION { ?item wdt:P494 ?_icd }';

export const WIKIDATA_QUERIES = Object.freeze({
  codes: 'SELECT ?item ?code ?prop WHERE { { ?item wdt:P4229 ?code BIND("P4229" AS ?prop) } UNION { ?item wdt:P494 ?code BIND("P494" AS ?prop) } }',
  images: `SELECT ?item ?file WHERE { ${ICD_ITEMS} ?item wdt:P18 ?file }`,
  fact: (prop) => `SELECT DISTINCT ?item ?value WHERE { ${ICD_ITEMS} ?item wdt:${prop} ?value }`,
});

const sparqlUrl = (query) => `${WDQS_SPARQL}?${new URLSearchParams({ format: 'json', query })}`;

/** Resultado de WDQS → filas planas {var: valor}. */
export function flattenBindings(json) {
  return (json?.results?.bindings ?? []).map((b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.value])));
}

/** Nombre de archivo de Commons a partir de la URI `Special:FilePath/...` que devuelve P18. */
export function commonsFileName(uri) {
  const m = uri.match(/Special:FilePath\/(.+)$/);
  return m ? decodeURIComponent(m[1]).replace(/_/g, ' ') : null;
}

export async function fetchWikidataBridge(http, cacheDir) {
  await assertWikidataProperties(http, cacheDir);
  const dir = join(cacheDir, 'wikidata');
  const ask = async (name, query) => flattenBindings(await http.getJsonCached(sparqlUrl(query), join(dir, `sparql-${name}.json`)));
  const codes = (await ask('codes', WIKIDATA_QUERIES.codes)).map((r) => ({ qid: qidOf(r.item), code: r.code, prop: r.prop }));
  const images = (await ask('images', WIKIDATA_QUERIES.images)).map((r) => ({ qid: qidOf(r.item), file: commonsFileName(r.file) })).filter((r) => r.file);
  const facts = {};
  for (const prop of Object.keys(WIKIDATA_FACT_PROPERTIES)) {
    facts[prop] = (await ask(`fact-${prop}`, WIKIDATA_QUERIES.fact(prop))).map((r) => ({ qid: qidOf(r.item), value: r.value }));
  }
  return { codes, images, facts };
}

// --- Commons ----------------------------------------------------------------------

/** Quita etiquetas y entidades de un campo HTML de extmetadata. */
export function plainMeta(value) {
  return value == null ? null : htmlToText(value);
}

/** Respuesta de `prop=imageinfo` → Map<nombre de archivo, metadatos>. */
export function parseCommonsInfo(json) {
  const out = new Map();
  const titleOf = new Map();
  for (const n of json?.query?.normalized ?? []) titleOf.set(n.to, n.from);
  for (const page of Object.values(json?.query?.pages ?? {})) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    const md = info.extmetadata ?? {};
    const name = page.title.replace(/^File:/, '');
    out.set(name, {
      file: name,
      url: info.url,
      thumbUrl: info.thumburl ?? null,
      mime: info.mime ?? null,
      pageUrl: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
      artist: plainMeta(md.Artist?.value),
      credit: plainMeta(md.Credit?.value),
      license: plainMeta(md.LicenseShortName?.value),
      licenseUrl: md.LicenseUrl?.value ?? null,
      usageTerms: plainMeta(md.UsageTerms?.value),
      attributionRequired: md.AttributionRequired?.value ?? null,
    });
  }
  return out;
}

export async function fetchCommonsInfo(http, files, cacheDir, batchSize = 50) {
  const wanted = [...new Set(files)].sort();
  const out = new Map();
  for (let i = 0; i < wanted.length; i += batchSize) {
    const batch = wanted.slice(i, i + batchSize);
    const params = new URLSearchParams({
      action: 'query', format: 'json', prop: 'imageinfo', iiprop: 'url|extmetadata|mime', iiurlwidth: '330',
      iiextmetadatafilter: 'Artist|Credit|LicenseShortName|LicenseUrl|UsageTerms|AttributionRequired',
      titles: batch.map((f) => `File:${f}`).join('|'),
    });
    const json = await http.getJsonCached(`${COMMONS_API}?${params}`, join(cacheDir, 'commons', `info-${shortHash(batch.join('|'))}.json`));
    for (const [k, v] of parseCommonsInfo(json)) out.set(k, v);
  }
  return out;
}
