// =============================================================================
// Catálogo de alergias · tanda 2 · lectores de formato (puros, sin red ni base).
//
// CSV de allergen.org, TSV de UniProt, tablas CDC (CVX), OBO de ChEBI (con
// `relationship:`), JSON de EVS (NCIt), XHTML de EUR-Lex/Cellar, SPL de DailyMed,
// GSRS, openFDA NDC, tablas JATS de Europe PMC y MeSH. Sólo leen: no deciden
// contenido; lo que el archivo no trae queda vacío. Cada lector se probó contra
// un extracto REAL de su fuente (test/fixtures-open/).
// =============================================================================

// --- utilidades -------------------------------------------------------------------

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
export const decodeEntities = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);

/** Texto plano de un fragmento HTML/XML: sin etiquetas, entidades decodificadas, espacios colapsados. */
const INLINE = /<\/?(?:sup|sub|i|b|em|strong|span|a|italic|bold|ext-link)\b[^>]*>/g;
export const textOf = (fragment) => decodeEntities(fragment.replace(INLINE, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

/** CSV RFC 4180 (comillas dobles, saltos de línea dentro de comillas) → filas objeto. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

// --- allergen.org (WHO/IUIS) --------------------------------------------------------

/** Filas de allergen.csv (moléculas) e isoallergen.csv (isoalérgenos), con los campos que publica la base. */
export function parseIuis(allergenCsv, isoallergenCsv) {
  const allergens = parseCsv(allergenCsv).map((r) => ({
    id: r.AllergenID.trim(),
    name: r.Name.trim(),
    species: r.Species.trim(),
    common: r.Common.trim(),
    taxSource: r.TaxSource.trim(),
    taxOrder: r.TaxOrder.trim(),
    bioName: r.BioNames.trim(),
    molecularMass: r.MolecularMass.trim(),
    obsoleteName: r.ObsoleteName.trim(),
    allergenicity: r.Allergenicity.trim(),
    allergenicityRef: r.AllergenicityRef.trim(),
    exposure: r.Exposure.trim(),
    dateAdded: r.DateAdded.trim(),
    dateUpdated: r.DateUpdated.trim(),
  }));
  const isoallergens = parseCsv(isoallergenCsv).map((r) => ({
    id: r.IsoAllergenID.trim(),
    allergenId: r.AllergenID.trim(),
    name: r.IsoName.trim(),
    oldNames: r.IsoOldNames.trim(),
    accNucleotide: r.AccNucleotide.trim(),
    accProtein: r.AccProtein.trim(),
    accUniProt: r.AccUniProt.trim(),
    accPdb: r.AccPDB.trim(),
    calcMw: r.CalcMW.trim(),
    exposure: r.Exposure.trim(),
    dateAdded: r.DateAdded.trim(),
    dateUpdated: r.DateUpdated.trim(),
  }));
  return { allergens, isoallergens };
}

// --- UniProt ---------------------------------------------------------------------------

/** TSV de UniProt (campos pedidos en el fetch). */
export function parseUniprotTsv(text) {
  const [head, ...lines] = text.split(/\r?\n/).filter((l) => l !== '');
  const cols = head.split('\t');
  return lines.map((l) => {
    const c = l.split('\t');
    const o = Object.fromEntries(cols.map((h, i) => [h, c[i] ?? '']));
    return {
      accession: o['Entry'],
      entryName: o['Entry Name'],
      proteinNames: o['Protein names'],
      geneNames: o['Gene Names'],
      organism: o['Organism'],
      organismId: o['Organism (ID)'],
      allergenicProperties: o['Allergenic Properties'],
      keywords: o['Keywords'] === '' ? [] : o['Keywords'].split(';'),
      reviewed: o['Reviewed'] === 'reviewed',
      proteinExistence: o['Protein existence'],
      length: o['Length'],
    };
  });
}

/** Nombre principal de «Protein names»: lo que está antes del primer « (» (el resto son sinónimos, EC, fragmento…). */
export const uniprotMainName = (proteinNames) => {
  const i = proteinNames.indexOf(' (');
  return (i < 0 ? proteinNames : proteinNames.slice(0, i)).trim();
};

// --- CDC CVX -----------------------------------------------------------------------------

/** cvx.txt: `código|nombre corto|nombre completo|notas|estado|no-vacuna|actualizado`. */
export function parseCvx(text) {
  return text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '')
    .map((l) => {
      const c = l.split('|').map((x) => x.trim());
      return { code: c[0], short: c[1], full: c[2], notes: c[3], status: c[4], nonVaccine: c[5] === 'True', updated: c[6] };
    });
}

/** tradename.txt: `marca|descripción|CVX|fabricante|MVX|estado CVX|estado producto|actualizado|`. */
export function parseCvxTradenames(text) {
  return text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '')
    .map((l) => {
      const c = l.split('|').map((x) => x.trim());
      return { name: c[0], description: c[1], cvx: c[2], manufacturer: c[3], mvx: c[4], cvxStatus: c[5], productStatus: c[6], updated: c[7] };
    });
}

// --- ChEBI (OBO «lite») ------------------------------------------------------------------

/**
 * OBO de ChEBI. Como `parseObo` pero conserva `relationship: <rel> <id>`
 * (el rol «allergen» es `RO:0000087 CHEBI:50904`) y las marcas `subset`/`alt_id`.
 */
export function parseChebiObo(text) {
  const header = {};
  const terms = new Map();
  let cur = null;
  let inHeader = true;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (line.startsWith('[')) {
      inHeader = false;
      cur = line === '[Term]' ? { id: null, name: null, def: null, synonyms: [], isA: [], relationships: [], altIds: [], subsets: [], obsolete: false } : null;
      continue;
    }
    const colon = line.indexOf(':');
    if (colon <= 0) continue;
    const key = line.slice(0, colon);
    const value = line.slice(colon + 1).trim();
    if (inHeader) {
      (header[key] ??= []).push(value);
      continue;
    }
    if (!cur) continue;
    if (key === 'id') {
      cur.id = value;
      terms.set(value, cur);
    } else if (key === 'name') cur.name = value;
    else if (key === 'def') cur.def = value.match(/^"((?:[^"\\]|\\.)*)"/)?.[1].replace(/\\(.)/g, '$1') ?? null;
    else if (key === 'synonym') {
      const m = value.match(/^"((?:[^"\\]|\\.)*)"\s+(\w+)(?:\s+([^\s\[]+))?/);
      if (m) cur.synonyms.push({ text: m[1].replace(/\\(.)/g, '$1'), scope: m[2], type: m[3] ?? null });
    } else if (key === 'is_a') cur.isA.push(value.replace(/\s*!.*$/, '').trim());
    else if (key === 'relationship') {
      const m = value.replace(/\s*!.*$/, '').trim().split(/\s+/);
      if (m.length >= 2) cur.relationships.push({ rel: m[0], target: m[1] });
    } else if (key === 'alt_id') cur.altIds.push(value);
    else if (key === 'subset') cur.subsets.push(value);
    else if (key === 'is_obsolete') cur.obsolete = value === 'true';
  }
  return { header, terms };
}

// --- NCIt (EVS REST) -----------------------------------------------------------------------

/** Concepto de EVS (`/concept/ncit/{code}?include=synonyms,definitions,properties,parents`) → registro plano. */
export function parseNcitConcept(c) {
  const prop = (type) => (c.properties ?? []).filter((p) => p.type === type).map((p) => p.value);
  return {
    code: c.code,
    name: c.name,
    version: c.version,
    active: c.active !== false && c.conceptStatus === 'DEFAULT',
    status: c.conceptStatus,
    // sinónimos de la fuente (FULL_SYN); el nombre preferido va aparte
    synonyms: [...new Set((c.synonyms ?? []).filter((s) => s.type === 'FULL_SYN' && s.name !== c.name).map((s) => s.name))],
    definition: (c.definitions ?? []).find((d) => d.type === 'DEFINITION')?.definition ?? null,
    altDefinitions: (c.definitions ?? []).filter((d) => d.type === 'ALT_DEFINITION').map((d) => ({ source: d.source, text: d.definition })),
    parents: (c.parents ?? []).map((p) => p.code),
    semanticTypes: prop('Semantic_Type'),
    chebi: prop('CHEBI_ID'),
    umls: prop('UMLS_CUI'),
    ncitMeta: prop('NCI_META_CUI'),
    legacyNames: prop('Legacy Concept Name'),
  };
}

// --- EUR-Lex (XHTML de Cellar) ---------------------------------------------------------------

/** Quita los llamados a nota al pie (`<a href="#E00..">…</a>`) para que no entren al texto. */
const stripFootnoteRefs = (html) => html.replace(/<a href="#E\d+"[^>]*>[\s\S]*?<\/a>/g, '').replace(/\(\s*\)/g, '');
const fixPunct = (s) => s.replace(/\s+([,;:.)])/g, '$1').replace(/\(\s+/g, '(').replace(/\s{2,}/g, ' ').trim();

/**
 * Anexo II del Reglamento (UE) 1169/2011 (cualquier idioma): 14 ítems. Cada uno
 * trae su texto y, si los tiene, la lista de excepciones («salvo: a)…»).
 * El título se corta con una regla mecánica: antes de la primera coma que
 * introduce «a saber / es decir / namely / that is / salvo / except» o antes
 * de los dos puntos; se quitan la puntuación y los espacios finales.
 */
export function parseEuAnnex1169(xhtml) {
  const start = xhtml.indexOf('<div id="anx_II">');
  if (start < 0) throw new Error('No se encontró el anexo II (div#anx_II)');
  const end = xhtml.indexOf('<div id="anx_III">', start);
  const body = stripFootnoteRefs(xhtml.slice(start, end < 0 ? start + 80000 : end));
  const title = fixPunct(textOf(body.match(/<p class="title-gr-seq-level-1"[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? ''));
  const items = [];
  const tokens = body.matchAll(/<p class="norm">\s*(\d+)\.<span[^>]*>\s*<\/span>([\s\S]*?)<\/p>|<div class="list grid-list-column-1">\s*<span>([a-z]\))\s*<\/span>\s*<\/div>\s*<div class="grid-list-column-2">\s*<p class="norm">([\s\S]*?)<\/p>/g);
  for (const m of tokens) {
    if (m[1]) items.push({ number: Number(m[1]), head: fixPunct(textOf(m[2])), exceptions: [] });
    else if (items.length > 0) items.at(-1).exceptions.push({ label: m[3], text: fixPunct(textOf(m[4])) });
  }
  for (const it of items) {
    it.text = [it.head, ...it.exceptions.map((e) => `${e.label} ${e.text}`)].join(' ');
    it.title = it.head
      .replace(/(?:,| ) ?(?:a saber|es decir|namely|that is|salvo|excepto|except|excluding)\b.*$/i, '')
      .replace(/:.*$/, '')
      .replace(/[\s.;,]+$/, '')
      .trim();
  }
  return { title, items };
}

/** Anexo II, parte B («Lista de todos los aditivos») del Reglamento (CE) 1333/2008: número E y denominación por sección. */
export function parseEuAdditives1333(xhtml) {
  const annexStart = xhtml.search(/<p class="title-annex-1"[^>]*>\s*ANNEX II\s*<\/p>|<p class="title-annex-1"[^>]*>\s*ANEXO II\s*<\/p>/);
  if (annexStart < 0) throw new Error('No se encontró el anexo II');
  const annexEnd = xhtml.search(/<p class="title-annex-1"[^>]*>\s*(?:ANNEX|ANEXO) III\s*<\/p>/);
  const seg = xhtml.slice(annexStart, annexEnd < 0 ? undefined : annexEnd);
  const headings = [...seg.matchAll(/<p class="title-gr-seq-level-\d"[^>]*>([\s\S]*?)<\/p>/g)].map((m) => ({ pos: m.index, text: textOf(m[1]) }));
  const partB = headings.find((h) => /^(PART|PARTE) B$/.test(h.text));
  const partC = headings.find((h) => /^(PART|PARTE) C$/.test(h.text));
  if (!partB || !partC) throw new Error('No se encontraron las partes B y C del anexo II');
  const sections = headings.filter((h) => h.pos > partB.pos && h.pos < partC.pos && /^\d\.\s/.test(h.text));
  const rows = [];
  for (const m of seg.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    if (m.index < partB.pos || m.index > partC.pos) continue;
    const cells = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => textOf(c[1]));
    if (cells.length >= 2 && /^E\s?\d{3,4}[a-z]?$/.test(cells[0])) {
      const section = [...sections].reverse().find((s) => s.pos < m.index)?.text ?? null;
      rows.push({ eNumber: cells[0].replace(/\s+/g, ' '), name: cells[1], section });
    }
  }
  return rows;
}

// --- 21 USC 321(qq) --------------------------------------------------------------------------

/** Lista del párrafo (1) de la definición «major food allergen»: ítem y ejemplos entre paréntesis. */
export function parseMajorFoodAllergens(html) {
  const text = decodeEntities(html.replace(/<[^>]+>/g, ''));
  const m = text.match(/\(qq\) The term "major food allergen" means any of the following:\s*\(1\)\s*([^\n]+)/);
  if (!m) throw new Error('No se encontró la definición (qq) «major food allergen»');
  const sentence = m[1].trim().replace(/\.$/, '');
  const parts = [];
  let depth = 0;
  let cur = '';
  for (const ch of sentence) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  parts.push(cur.trim());
  return {
    sentence,
    items: parts
      .map((p) => p.replace(/^and\s+/i, ''))
      .map((p) => {
        const e = p.match(/^(.*?)\s*\(e\.g\.,\s*(.*)\)$/);
        return { name: (e ? e[1] : p).trim(), examples: e ? e[2].trim() : null, text: p };
      }),
  };
}

// --- DailyMed SPL, GSRS, openFDA NDC ------------------------------------------------------------

/**
 * Ingredientes de una etiqueta SPL. Por cada `<manufacturedProduct>`: código NDC de producto
 * (codeSystem 2.16.840.1.113883.6.69) y sus ingredientes con rol (ACTIB, ACTIM, ACTIR, IACT, BASE),
 * UNII (codeSystem 2.16.840.1.113883.4.9) y nombre. Sólo texto estructurado de identificación.
 */
export function parseSplIngredients(xml) {
  const products = [];
  for (const mp of xml.matchAll(/<manufacturedProduct>([\s\S]*?)<\/manufacturedProduct>/g)) {
    const body = mp[1];
    const ndc = body.match(/<code code="([\d-]+)" codeSystem="2\.16\.840\.1\.113883\.6\.69"/)?.[1] ?? null;
    const ingredients = [];
    for (const ing of body.matchAll(/<ingredient classCode="(\w+)"[^>]*>([\s\S]*?)<\/ingredient>/g)) {
      const sub = ing[2].match(/<ingredientSubstance>\s*<code code="([A-Z0-9]{10})" codeSystem="2\.16\.840\.1\.113883\.4\.9"\s*\/>\s*<name>([^<]*)<\/name>/);
      if (sub) ingredients.push({ role: ing[1], unii: sub[1], name: decodeEntities(sub[2]).trim() });
    }
    products.push({ ndc, ingredients });
  }
  return products;
}

/** Datos de un registro GSRS (vista completa). Sólo códigos de un listado cerrado (sin SNOMED/MedDRA/ATC). */
export const GSRS_CODE_SYSTEMS = new Set(['NCBI TAXONOMY', 'ITIS', 'GRIN', 'PLANTS', 'MPNS', 'NCI_THESAURUS', 'RXCUI', 'NDF-RT', 'PUBCHEM', 'CAS', 'EPA CompTox', 'INN', 'EVMPD', 'USDA PLANTS']);
export function parseGsrs(g) {
  const sm = g.structurallyDiverse ?? {};
  const names = (g.names ?? []).map((n) => ({ name: n.name, type: n.type, preferred: n.displayName === true, languages: n.languages ?? [] }));
  const codes = (g.codes ?? []).filter((c) => GSRS_CODE_SYSTEMS.has(c.codeSystem) && c.code).map((c) => ({ system: c.codeSystem, code: c.code, type: c.type }));
  return {
    unii: g.approvalID,
    name: g._name,
    substanceClass: g.substanceClass,
    status: g.status,
    definitionType: g.definitionType,
    organism: { family: sm.organismFamily ?? null, genus: sm.organismGenus ?? null, species: sm.organismSpecies ?? null, author: sm.organismAuthor ?? null, part: Array.isArray(sm.part) ? sm.part : sm.part ? [sm.part] : [], sourceMaterialClass: sm.sourceMaterialClass ?? null, sourceMaterialType: sm.sourceMaterialType ?? null },
    names,
    codes,
    lastEdited: g.lastEdited ?? null,
    version: g.version ?? null,
  };
}

// --- Europe PMC (JATS) -----------------------------------------------------------------------------

/** Tabla JATS → filas de celdas de texto, con las filas de una sola celda como encabezados de grupo. */
export function parseJatsTable(xml, tableId) {
  const tw = xml.match(new RegExp(`<table-wrap id="${tableId}"[\\s\\S]*?</table-wrap>`))?.[0];
  if (!tw) throw new Error(`Tabla ${tableId} no encontrada`);
  const caption = textOf(tw.match(/<caption>([\s\S]*?)<\/caption>/)?.[1] ?? '');
  const footnote = textOf(tw.match(/<table-wrap-foot>([\s\S]*?)<\/table-wrap-foot>/)?.[1] ?? '');
  const rows = [...tw.matchAll(/<tr[\s>][\s\S]*?<\/tr>/g)].map((m) => [...m[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => textOf(c[1].replace(/<sup>[a-z]<\/sup>/g, ''))));
  return { caption, footnote, rows };
}

// --- MeSH (desc2026.xml) ------------------------------------------------------------------------------

/**
 * Descriptores de MeSH cuyos números de árbol cuelgan de `prefixes`. Lee el XML
 * por registros (`<DescriptorRecord>…</DescriptorRecord>`) en una pasada.
 */
export function meshDescriptors(xmlText, prefixes) {
  const out = [];
  let pos = 0;
  for (;;) {
    const a = xmlText.indexOf('<DescriptorRecord ', pos);
    if (a < 0) break;
    const b = xmlText.indexOf('</DescriptorRecord>', a);
    pos = b + 19;
    const r = xmlText.slice(a, b);
    const tl = r.indexOf('<TreeNumberList>');
    if (tl < 0) continue;
    const trees = [...r.slice(tl, r.indexOf('</TreeNumberList>', tl)).matchAll(/<TreeNumber>([^<]+)<\/TreeNumber>/g)].map((x) => x[1]);
    if (!trees.some((t) => prefixes.some((p) => t === p || t.startsWith(`${p}.`)))) continue;
    out.push(parseMeshRecord(r, trees));
  }
  return out;
}

export function parseMeshRecord(r, trees = [...r.matchAll(/<TreeNumber>([^<]+)<\/TreeNumber>/g)].map((x) => x[1])) {
  const ui = r.match(/<DescriptorUI>(D\d+)<\/DescriptorUI>/)[1];
  const name = decodeEntities(r.match(/<DescriptorName>\s*<String>([^<]*)<\/String>/)[1]);
  const scope = r.match(/<ScopeNote>([\s\S]*?)<\/ScopeNote>/)?.[1];
  const terms = [...r.matchAll(/<Term [^>]*>\s*<TermUI>(\w+)<\/TermUI>\s*<String>([^<]*)<\/String>/g)].map((x) => decodeEntities(x[2]));
  return { ui, name, scopeNote: scope ? textOf(scope) : null, terms: [...new Set(terms)].filter((t) => t !== name), trees };
}
