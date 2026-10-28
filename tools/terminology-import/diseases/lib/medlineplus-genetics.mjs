// =============================================================================
// MedlinePlus Genetics (NLM): condiciones genéticas → registro común.
//
// `ghr-summaries.xml` (https://medlineplus.gov/about/developers/geneticsdatafilesapi/) trae, por
// cada `<health-condition-summary>`: nombre, sinónimos, descripción, patrón de herencia y claves
// de otras bases (`<db-key>`: GTR, MeSH, OMIM, ICD-10-CM y SNOMED CT). Las «Summaries on Genetics
// pages» están en el dominio público (https://medlineplus.gov/about/using/usingcontent/).
//
// Sólo se cargan las condiciones (los resúmenes de genes y cromosomas son de otro dominio). Los
// cruces son los que publica MedlinePlus, sin equivalencia declarada; SNOMED CT se descarta entero.
// La descripción es la del rol `description`, en texto plano (sin etiquetas HTML).
// =============================================================================

import { readFileSync } from 'node:fs';

import { decodeEntities, htmlToText } from '../../lib/glossary-es/common.mjs';
import { SYSTEMS } from './code-systems.mjs';
import { provenance, pushDesignation } from './records.mjs';

const tag = (body, name) => [...body.matchAll(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, 'g'))].map((m) => decodeEntities(m[1]).trim());

export function parseGhrConditions(path) {
  const xml = readFileSync(path, 'utf8');
  const out = [];
  for (const m of xml.matchAll(/<health-condition-summary id="(\d+)">([\s\S]*?)<\/health-condition-summary>/g)) {
    const body = m[2];
    const header = body.replace(/<text-list>[\s\S]*?<\/text-list>/, '');
    const desc = /<text>\s*<text-role>description<\/text-role>\s*<html>([\s\S]*?)<\/html>\s*<\/text>/.exec(body);
    out.push({
      id: m[1],
      name: tag(header, 'name')[0],
      page: tag(header, 'ghr-page')[0] ?? null,
      synonyms: tag(header.match(/<synonym-list>[\s\S]*?<\/synonym-list>/)?.[0] ?? '', 'synonym'),
      dbKeys: [...header.matchAll(/<db-key>\s*<db>([^<]*)<\/db>\s*<key>([^<]*)<\/key>\s*<\/db-key>/g)].map((k) => ({ db: decodeEntities(k[1]).trim(), key: decodeEntities(k[2]).trim() })),
      inheritance: [...header.matchAll(/<inheritance-pattern>\s*<code>([^<]*)<\/code>\s*<memo>([^<]*)<\/memo>/g)].map((k) => ({ code: k[1], memo: decodeEntities(k[2]).trim() })),
      genes: [...header.matchAll(/<gene-symbol>([^<]*)<\/gene-symbol>/g)].map((k) => k[1]),
      description: desc ? htmlToText(decodeEntities(desc[1].replace(/<(\/?)html:/g, '<$1'))) : null,
      reviewed: tag(body, 'reviewed')[0] ?? null,
      published: tag(body, 'published')[0] ?? null,
    });
  }
  return out;
}

export function buildMedlineplusGenetics(conditions, meta, version) {
  const records = conditions.map((c) => {
    const designations = [];
    pushDesignation(designations, c.name, 'en', true);
    c.synonyms.forEach((s) => pushDesignation(designations, s, 'en', false));
    const xrefs = [];
    const external = {};
    for (const { db, key } of c.dbKeys) {
      if (!key) continue;
      if (db === 'MeSH' && /^[CD]\d+$/.test(key)) xrefs.push({ cs: 'mesh', code: key, equivalence: null, context: 'medlineplus-genetics:db-key MeSH' });
      else if (db === 'OMIM' && /^\d{6}$/.test(key)) xrefs.push({ cs: 'omim', code: key, equivalence: null, context: 'medlineplus-genetics:db-key OMIM' });
      else if (db === 'GTR' && /^C\d{7}$/.test(key)) xrefs.push({ cs: 'umls', code: key, equivalence: null, context: 'medlineplus-genetics:db-key GTR' });
      else if (db === 'ICD-10-CM') xrefs.push({ cs: 'icd10cm', code: key, equivalence: null, context: 'medlineplus-genetics:db-key ICD-10-CM', external: true });
      else if (db !== 'SNOMED CT') (external[db] ??= []).push(key); // SNOMED CT se descarta entero
    }
    return {
      cs: 'medlineplus-genetics',
      code: c.id,
      display: c.name,
      lang: 'en',
      definition: c.description,
      definitionLang: c.description ? 'en' : null,
      definitionRefs: [],
      designations,
      parents: [],
      status: 'active',
      replacedBy: null,
      properties: {
        ...(c.inheritance.length ? { ghr_inheritance: c.inheritance } : {}),
        ...(c.genes.length ? { ghr_related_gene_symbols: [...new Set(c.genes)] } : {}),
        ghr_dates: { reviewed: c.reviewed, published: c.published },
        ...(Object.keys(external).length ? { disease_external_xrefs: external } : {}),
      },
      xrefs,
      provenance: { ...provenance(meta, version, c.id, 'medlineplus-genetics'), uri: c.page ?? SYSTEMS['medlineplus-genetics'].uri(c.id) },
    };
  });
  return { version, records, excluded: {} };
}
