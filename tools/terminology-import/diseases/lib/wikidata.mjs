// =============================================================================
// Wikidata (CC0) → registro común del catálogo de enfermedades.
//
// Entrada: las respuestas SPARQL de `fetch-wikidata.mjs` (por lote: etiquetas y descripciones
// en/es, alias en/es, identificadores externos y P31/P279). Alcance de lo que se baja: ver ese
// script (disease con castellano, o sin ningún identificador de los sistemas del catálogo).
//
// Reglas: etiquetas y alias verbatim, en su idioma (en / es); la etiqueta en castellano de
// Wikidata la escribe la comunidad (no es una traducción oficial) y por eso la fuente va en la
// procedencia de cada fila; los identificadores externos son declaraciones de Wikidata, sin
// equivalencia declarada; jerarquía = P279 entre ítems del alcance; nada se cruza por nombre.
// =============================================================================

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { SYSTEMS } from './code-systems.mjs';
import { normalizeCurie, provenance, pushDesignation } from './records.mjs';

const qid = (iri) => iri.split('/').pop();
const rows = (path) => JSON.parse(readFileSync(path, 'utf8')).results.bindings;

/** Lee los lotes de `dir/batches` → Map<QID, { labels, descriptions, aliases, ids, instanceOf, subclassOf }>. */
export function readWikidata(dir) {
  const items = new Map();
  const get = (q) => items.get(q) ?? items.set(q, { labels: {}, descriptions: {}, aliases: { en: [], es: [] }, ids: {}, instanceOf: [], subclassOf: [] }).get(q);
  for (const f of readdirSync(join(dir, 'batches')).sort()) {
    const path = join(dir, 'batches', f);
    if (f.endsWith('-labels.json')) {
      for (const r of rows(path)) {
        const it = get(qid(r.i.value));
        if (r.le) it.labels.en = r.le.value;
        if (r.ls) it.labels.es = r.ls.value;
        if (r.de) it.descriptions.en = r.de.value;
        if (r.ds) it.descriptions.es = r.ds.value;
      }
    } else if (f.endsWith('-aliases.json')) {
      for (const r of rows(path)) {
        const list = get(qid(r.i.value)).aliases[r.lang.value];
        if (list && !list.includes(r.a.value)) list.push(r.a.value);
      }
    } else if (f.endsWith('-ids.json')) {
      for (const r of rows(path)) {
        const it = get(qid(r.i.value));
        (it.ids[r.p.value] ??= []).includes(r.v.value) || it.ids[r.p.value].push(r.v.value);
      }
    } else if (f.endsWith('-classes.json')) {
      for (const r of rows(path)) {
        const it = get(qid(r.i.value));
        const list = r.p.value === 'P31' ? it.instanceOf : it.subclassOf;
        const c = qid(r.c.value);
        if (!list.includes(c)) list.push(c);
      }
    }
  }
  return items;
}

/** Propiedad de Wikidata → destino del catálogo (o null si queda como referencia). */
function target(prop, value) {
  switch (prop) {
    case 'P5270':
      return normalizeCurie(`MONDO:${value.replace(/^MONDO:/, '').padStart(7, '0')}`);
    case 'P699':
      return normalizeCurie(value.startsWith('DOID:') ? value : `DOID:${value}`);
    case 'P1550':
      return normalizeCurie(`Orphanet:${value}`);
    case 'P486':
      return normalizeCurie(`MESH:${value}`);
    case 'P492':
      return normalizeCurie(`OMIM:${value}`);
    case 'P1748':
      return normalizeCurie(`NCI:${value}`);
    case 'P2892':
      return normalizeCurie(`UMLS:${value}`);
    case 'P7329':
      return { cs: 'icd11-mms', code: value };
    case 'P7807':
      return normalizeCurie(`icd11.foundation:${value}`);
    case 'P494':
      return { cs: 'icd10-who', code: value };
    case 'P4229':
      return { cs: 'icd10cm', code: value, external: true };
    default:
      return null;
  }
}

export function buildWikidata(items, meta, version) {
  const inScope = new Set(items.keys());
  const records = [];
  for (const [q, it] of [...items].sort((a, b) => Number(a[0].slice(1)) - Number(b[0].slice(1)))) {
    const designations = [];
    if (it.labels.en) pushDesignation(designations, it.labels.en, 'en', true);
    if (it.labels.es) pushDesignation(designations, it.labels.es, 'es', true);
    it.aliases.en.forEach((a) => pushDesignation(designations, a, 'en', false));
    it.aliases.es.forEach((a) => pushDesignation(designations, a, 'es', false));
    if (!designations.length) continue; // sin etiqueta en ni es: no hay nombre que mostrar
    const xrefs = [];
    const external = {};
    for (const [prop, values] of Object.entries(it.ids)) {
      for (const v of values) {
        const t = target(prop, v);
        if (t) xrefs.push({ cs: t.cs, code: t.code, equivalence: null, context: `wikidata:${prop}`, ...(t.external ? { external: true } : {}) });
        else (external[prop] ??= []).push(v);
      }
    }
    records.push({
      cs: 'wikidata-disease',
      code: q,
      display: it.labels.en ?? it.labels.es,
      lang: it.labels.en ? 'en' : 'es',
      definition: null,
      definitionLang: null,
      definitionRefs: [],
      designations,
      parents: it.subclassOf.filter((c) => c !== q && inScope.has(c)),
      status: 'active',
      replacedBy: null,
      properties: {
        // Por qué entró (ver fetch-wikidata.mjs): tiene etiqueta en castellano y/o ningún identificador de los sistemas del catálogo.
        wikidata_scope: [...(it.labels.es ? ['etiqueta en castellano'] : []), ...(Object.keys(it.ids).length === 0 ? ['sin identificador del catálogo'] : [])],
        ...(Object.keys(it.descriptions).length ? { wikidata_descriptions: it.descriptions } : {}),
        ...(it.instanceOf.length ? { wikidata_instance_of: it.instanceOf } : {}),
        ...(it.subclassOf.length ? { wikidata_subclass_of: it.subclassOf } : {}),
        ...(Object.keys(external).length ? { disease_external_xrefs: external } : {}),
      },
      xrefs,
      provenance: { ...provenance(meta, version, q, 'wikidata-disease'), uri: SYSTEMS['wikidata-disease'].uri(q) },
    });
  }
  return { version, records, excluded: { withoutLabel: items.size - records.length } };
}
