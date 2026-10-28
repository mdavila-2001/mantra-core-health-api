// =============================================================================
// Omaha System (2026-10-27): dominio público según el FAQ oficial.
//
// Parsers escritos contra los archivos REALES que publica www.omahasystem.org
// (HTML de Squarespace), su imagen de la Problem Rating Scale for Outcomes (PRSO)
// y el «Omaha System KBS Rating Supplement» (octubre de 2010) del Minnesota Omaha
// System Users Group (PDF → `pdftotext -layout`). Nada se redacta ni se traduce:
// cada nombre y definición sale verbatim del archivo, con su procedencia.
//
// Qué publica la fuente oficial (y por tanto qué se carga):
//   · 4 dominios con definición y 42 problemas        → `problemclassificationscheme`
//   · 4 categorías con definición y 76 objetivos       → `interventionscheme`
//   · PRSO: Conocimiento/Conducta/Estado × 5 niveles   → imagen del sitio
//   · modificadores de problema (nombres)              → texto de la página de problemas
// Del MOSUG (copyright 2010 MOSUG, «may be used without permission», citando autores):
//   · definición y signos/síntomas de 18 de los 42 problemas, y la definición de 3
//     modificadores (actual, potencial, promoción de la salud).
// Lo que NO está publicado en abierto (signos/síntomas de los otros 24 problemas,
// definiciones de objetivos y de los modificadores individuo/familia/comunidad, códigos
// numéricos): vive en el libro de 2005 (Apéndices A y E) y queda como hueco.
// =============================================================================

import { decodeEntities, slugify } from '../../lib/glossary-es/common.mjs';

export const OMAHA_CODE_SYSTEM = 'omaha-system';
export const OMAHA_VERSION = '2005+sitio-2026-10-27';
export const OMAHA_CITATION = 'Martin KS. (2005). The Omaha System: A Key to Practice, Documentation, and Information Management (Reprinted 2nd ed.). Omaha, NE: Health Connections Press.';

const clean = (s) => decodeEntities(String(s)).replace(/ /g, ' ').replace(/[ \t\r\n]+/g, ' ').trim();
const stripTags = (s) => clean(String(s).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''));
const lines = (inner) => decodeEntities(inner.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).split('\n').map((l) => l.replace(/ /g, ' ').trim()).filter(Boolean);

/** Un bloque `<p><strong>Nombre:</strong> definición</p>` → { name, definition }. */
function labelledParagraphs(html) {
  const out = [];
  const re = /<p[^>]*>\s*<strong>((?:(?!<\/strong>)[\s\S])*?)<\/strong>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(html))) {
    const name = clean(stripTags(m[1])).replace(/:$/, '').trim();
    const definition = clean(stripTags(m[2]));
    if (name) out.push({ name, definition: definition || null, index: m.index, end: re.lastIndex });
  }
  return out;
}

/**
 * Página «Problem Classification Scheme»: 4 dominios (con definición) y sus problemas.
 * @returns {{ domains: {name:string, definition:string, problems:string[]}[], intro: string }}
 */
export function parseProblemClassification(html) {
  const start = html.indexOf('Domains and Problems of the Problem Classification Scheme');
  if (start < 0) throw new Error('Omaha: no está «Domains and Problems of the Problem Classification Scheme»');
  const section = html.slice(start);
  const re = /<p[^>]*>\s*<strong>((?:(?!<\/strong>)[\s\S])*?Domain:?(?:&nbsp;|\s)*)<\/strong>([\s\S]*?)<\/p>\s*<blockquote>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/blockquote>/gi;
  const domains = [];
  let m;
  while ((m = re.exec(section))) {
    domains.push({ name: clean(stripTags(m[1])).replace(/:$/, '').trim(), definition: clean(stripTags(m[2])), problems: lines(m[3]) });
  }
  const intro = clean(stripTags(html.slice(html.indexOf('The Problem Classification Scheme provides'), start)));
  return { domains, intro };
}

/** Modificadores de problema que nombra el texto de la página de problemas (nivel 3). */
export function parseProblemModifiers(html) {
  const m = /The third level consists of two sets of problem modifiers: ([^.]+?) as well as ([^.]+?)\./.exec(stripTags(html));
  if (!m) throw new Error('Omaha: no está la frase de los modificadores de problema');
  const split = (s) => s.replace(/,? and /, ', ').split(',').map((x) => x.trim()).filter(Boolean);
  return { sentence: m[0], sets: [{ name: 'health promotion, potential, and actual', terms: split(m[1]) }, { name: 'individual, family, and community', terms: split(m[2]) }] };
}

/** Página «Intervention Scheme»: 4 categorías (con definición) y los objetivos (targets). */
export function parseInterventionScheme(html) {
  const catStart = html.indexOf('Categories:');
  const tgtStart = html.indexOf('Targets:');
  if (catStart < 0 || tgtStart < 0 || tgtStart < catStart) throw new Error('Omaha: faltan «Categories:» o «Targets:»');
  const categories = labelledParagraphs(html.slice(catStart, tgtStart)).map(({ name, definition }) => ({ name, definition }));
  const after = html.slice(tgtStart);
  const m = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(after);
  if (!m) throw new Error('Omaha: no hay la lista de objetivos');
  return { categories, targets: lines(m[1]) };
}

/** La frase de la introducción de la página de intervenciones: «… 75 targets … and one “other”». */
export function interventionTargetClaim(html) {
  const t = stripTags(html);
  const m = /An alphabetical list of (\d+) targets or objects of action and one “other”/.exec(t);
  return m ? Number(m[1]) : null;
}

/**
 * Licencia: respuesta 1 del FAQ oficial (verbatim). Devuelve la pregunta, la respuesta y el párrafo
 * de la restricción de uso, para guardarlos como evidencia primaria.
 */
export function parseFaqLicense(html) {
  const t = decodeEntities(html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|h\d|div)>/gi, '\n').replace(/<[^>]+>/g, '')).replace(/ /g, ' ');
  const i = t.indexOf('1. Do I need to buy a license or rights to the terms, definitions, and codes of the Omaha System');
  if (i < 0) throw new Error('Omaha: no está la pregunta 1 del FAQ');
  const j = t.indexOf('2. What Omaha System publications are available?', i);
  const block = t.slice(i, j).split('\n').map((l) => l.trim()).filter(Boolean);
  return { question: block[0], answer: block.slice(1).join(' ') };
}

/**
 * PRSO (Problem Rating Scale for Outcomes). La fuente oficial la publica como IMAGEN
 * (`Omaha System PRSO.jpg`, SHA-256 en `omaha.meta.json`); no hay texto máquina-legible. Esta tabla es la
 * transcripción de lo que muestra la imagen (lectura visual del archivo bajado, 2026-10-27) y se
 * contrasta en `test/omaha.test.mjs` contra las listas de respuesta que LOINC publica para sus términos
 * [OMAHA] (códigos LA6495-1 … LA6494-4), que son independientes de la imagen.
 */
export const PRSO = [
  { name: 'Knowledge', definition: 'Ability of the client to remember and interpret information', ratings: ['No knowledge', 'Minimal knowledge', 'Basic knowledge', 'Adequate knowledge', 'Superior knowledge'] },
  { name: 'Behavior', definition: 'Observable responses, actions, or activities of the client fitting the occasion or purpose', ratings: ['Not appropriate behavior', 'Rarely appropriate behavior', 'Inconsistently appropriate behavior', 'Usually appropriate behavior', 'Consistently appropriate behavior'] },
  { name: 'Status', definition: 'Condition of the client in relation to objective and subjective defining characteristics', ratings: ['Extreme signs/symptoms', 'Severe signs/symptoms', 'Moderate signs/symptoms', 'Minimal signs/symptoms', 'No signs/symptoms'] },
];

// ---------------------------------------------------------------------------
// MOSUG — «Omaha System KBS Rating Supplement» (2010), texto de `pdftotext -layout`
// ---------------------------------------------------------------------------

const BULLET = '\u0083';

/** «Problem Classification Scheme» del suplemento: nombre → página inicial en el libro de 2005. */
export function parseMosugProblemPages(text) {
  const i = text.indexOf('Following is a list of all the problems in the Problem Classification Scheme');
  if (i < 0) throw new Error('MOSUG: no está la lista de problemas con páginas');
  const j = text.indexOf('Intervention Scheme\nCategories', i);
  const out = [];
  for (const raw of text.slice(i, j).split('\n')) {
    const m = /^\s*(\S.*?)\s*[….]{2,}\s*(\d+)-(\d+)\s*$/.exec(raw) ?? /^\s*(\S.*?)\s{3,}(\d+)-(\d+)\s*$/.exec(raw);
    if (m) out.push({ name: m[1].replace(/[….]+$/, '').trim(), pageStart: Number(m[2]), pageEnd: Number(m[3]) });
  }
  return out;
}

/** Une renglones de un mismo ítem: los saltos de línea del PDF se vuelven un espacio. */
const joinWrapped = (parts) => parts.map((p) => p.trim()).filter(Boolean).join(' ');

/**
 * Bloques «Nombre (pg N):  definición  Signs/ Symptoms: …» → problemas con definición y signos/síntomas.
 * Los signos/síntomas están en dos columnas (viñeta U+0083); se leen por columnas (izquierda de arriba
 * abajo, luego derecha), que es el orden de numeración del libro (verificado contra el formulario
 * Problem Classification Scheme de la Univ. de Estambul para los 18 problemas: mismos totales).
 */
export function parseMosugProblems(text) {
  const L = text.split('\n');
  const heads = [];
  L.forEach((l, i) => {
    const m = /^\f?\s*([A-Z][A-Za-z/\- ]+?)\s*\(\s*(?:pg\.?\s*)?(\d+)\s*\)\s*:\s*$/.exec(l);
    if (m && L.slice(i + 1, i + 12).some((x) => /^\s*Signs\/ ?Symptoms:/.test(x))) heads.push({ line: i, name: m[1].trim(), page: Number(m[2]) });
  });
  return heads.map((h, n) => {
    const end = n + 1 < heads.length ? heads[n + 1].line : L.length;
    const block = L.slice(h.line + 1, end);
    const ssAt = block.findIndex((x) => /^\s*Signs\/ ?Symptoms:/.test(x));
    const kbsAt = block.findIndex((x) => /^\s*KBS rating considerations/.test(x));
    const definition = joinWrapped(block.slice(0, ssAt));
    const ssLines = block.slice(ssAt + 1, kbsAt < 0 ? undefined : kbsAt).filter((x) => x.trim() !== '');
    return { ...h, definition, signsSymptoms: parseTwoColumnBullets(ssLines) };
  });
}

/** Ítems de una lista de viñetas en dos columnas (cada ítem empieza con U+0083; sigue con renglones sangrados). */
export function parseTwoColumnBullets(ssLines) {
  // Posición de la viñeta de la 2.ª columna: la mínima entre los renglones con dos viñetas.
  const twoBullets = ssLines.map((l) => [...l.matchAll(new RegExp(BULLET, 'g'))].map((x) => x.index)).filter((p) => p.length >= 2);
  const c2 = twoBullets.length ? Math.min(...twoBullets.map((p) => p[1])) : Infinity;
  const cols = [[], []];
  for (const l of ssLines) {
    const left = c2 === Infinity ? l : l.slice(0, c2);
    const right = c2 === Infinity ? '' : l.slice(c2);
    [left, right].forEach((chunk, k) => {
      if (chunk.trim() === '') return;
      const bullet = chunk.indexOf(BULLET);
      if (bullet >= 0) {
        const text = chunk.slice(bullet + 1).trim();
        cols[k].push([text]);
      } else if (cols[k].length) {
        cols[k][cols[k].length - 1].push(chunk.trim());
      }
    });
  }
  return cols.flat().map(joinWrapped).filter(Boolean);
}

/** «Problem Modifiers Guide»: definición de Actual, Potencial y Promoción de la salud, por posición de columna. */
export function parseMosugModifiers(text) {
  const i = text.indexOf('Omaha System Problem Modifiers Guide');
  if (i < 0) throw new Error('MOSUG: no está «Problem Modifiers Guide»');
  const L = text.slice(i).split('\n');
  const pageBreak = L.findIndex((l, k) => k > 0 && l.includes('\f'));
  const pages = [L.slice(0, pageBreak < 0 ? undefined : pageBreak), pageBreak < 0 ? [] : L.slice(pageBreak)];
  const out = {};
  for (const page of pages) {
    const hdr = page.findIndex((l) => /^\f?\s*Assessment\s{2,}\S/.test(l));
    if (hdr < 0) continue;
    const header = page[hdr].replace('\f', ' ');
    const names = [...header.matchAll(/\S+(?: \S+)*/g)].map((x) => ({ name: x[0], at: x.index })).filter((x) => x.name !== 'Assessment');
    const defAt = page.findIndex((l, k) => k > hdr && /^\s*Definition\s{2,}\S/.test(l));
    const whenAt = page.findIndex((l, k) => k > defAt && /^\s*When to select/.test(l));
    if (defAt < 0 || whenAt < 0) continue;
    const bounds = names.map((n, k) => ({ name: n.name, from: n.at - 1, to: k + 1 < names.length ? names[k + 1].at - 1 : Infinity }));
    const cells = Object.fromEntries(bounds.map((b) => [b.name, []]));
    for (const l of page.slice(defAt, whenAt)) {
      const row = l.replace(/^\s*Definition/, '          ');
      for (const b of bounds) cells[b.name].push(row.slice(b.from, b.to === Infinity ? undefined : b.to).trim());
    }
    for (const [name, parts] of Object.entries(cells)) out[name] = joinWrapped(parts);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Filas normalizadas
// ---------------------------------------------------------------------------

/**
 * Agrega a la procedencia lo que depende de la descarga (fecha, SHA-256 y tipo del archivo, por `fileKey`) desde `omaha-meta`.
 * No muta los datos versionados: devuelve filas nuevas.
 */
export function hydrateOmahaProvenance(rows, files) {
  const fill = (o) => {
    if (!o || typeof o !== 'object') return o;
    const out = { ...o };
    if (out.fileKey) {
      const f = files[out.fileKey];
      if (!f) throw new Error(`omaha-meta no tiene ${out.fileKey}`);
      out.retrievedAt = f.retrievedAt;
      out.sha256 = f.sha256;
      if (f.contentType) out.contentType = f.contentType;
      if (out.status) out.checkedAt = f.retrievedAt.slice(0, 10);
    }
    if (out.license) out.license = fill(out.license);
    if (out.imageFileKey) out.imageSha256 = files[out.imageFileKey].sha256;
    return out;
  };
  return rows.map((r) => ({ ...r, provenance: fill(r.provenance), ...(r.definitionSource ? { definitionSource: fill(r.definitionSource) } : {}) }));
}

const normName = (s) => slugify(s).replace(/-/g, '');

/**
 * Construye las filas del code system `omaha-system`.
 * @param {object} parsed  { problems, modifiers, interventions, faq, mosugProblems, mosugPages, mosugModifierDefs }
 * @param {object} meta    omaha.meta.json (`files`: url, sha256, retrievedAt por archivo)
 */
export const OMAHA_APPROVAL_KEY = 'omaha-system';

export function buildOmahaRows(parsed, meta) {
  const f = meta.files;
  // El hash del corpus no depende de la fecha ni de los bytes de la descarga: cada procedencia lleva `fileKey` y el cargador agrega
  // `retrievedAt`, `sha256` y `contentType` desde `omaha-meta` (`hydrateOmahaProvenance`). Una descarga fresca da las mismas filas.
  const license = {
    status: 'public-domain-terms-pending-owner-decision',
    loadStatus: 'pending-owner-decision',
    summary: 'FAQ oficial, pregunta 1: los términos, definiciones y códigos del Omaha System están en el dominio público desde 1975; se usan sin permiso ni pago, pero «the terms and structure must be used as described in the 2005 book, and referenced (ie 2005 book or Website)». El resto del libro (guía del usuario) tiene copyright de Health Connections Press y «developers and companies who design and sell software based on the Omaha System […] should contact Health Connections Press». DECISIÓN DEL PROPIETARIO pendiente: confirmar con la editorial que cargar los términos en un producto comercial entra en el uso libre. Hasta entonces el cargador omite este corpus (`--owner-approved=omaha-system`).',
    question: parsed.faq.question,
    answer: parsed.faq.answer,
    url: f['site-faq'].url,
    fileKey: 'site-faq',
    evidence: 'primary (FAQ del sitio oficial, leído el día de la descarga)',
    citation: OMAHA_CITATION,
  };
  const prov = (fileKey, sourceId, extra = {}) => ({
    source: 'Omaha System — sitio oficial (www.omahasystem.org)',
    sourceId,
    version: OMAHA_VERSION,
    uri: f[fileKey].url,
    fileKey,
    license,
    citation: OMAHA_CITATION,
    ...extra,
  });
  const mosug = (sourceId) => ({
    source: 'Minnesota Omaha System Users Group — Omaha System KBS Rating Supplement (octubre de 2010)',
    sourceId,
    version: 'MOSUG 2010-10',
    uri: f['mosug-kbs-supplement'].url,
    fileKey: 'mosug-kbs-supplement',
    license: {
      status: 'free-use-with-attribution',
      summary: '«Copyright 2010 Minnesota Omaha System Users Group. May be used without permission. Please acknowledge authors when used.» (portada del PDF). Las definiciones y los signos/síntomas son términos del Omaha System (dominio público, FAQ oficial; ver la decisión pendiente del propietario en `omaha-system`).',
      url: f['mosug-kbs-supplement'].url,
      fileKey: 'mosug-kbs-supplement',
      evidence: 'primary (texto de la página 3 del PDF)',
    },
    citation: `Minnesota Omaha System Users Group (2010). Omaha System KBS Rating Supplement. ${f['mosug-kbs-supplement'].url}. Términos: ${OMAHA_CITATION}`,
  });

  const rows = [];
  const add = (r) => rows.push({ codeSystem: OMAHA_CODE_SYSTEM, originalLanguage: 'en', nameEs: null, descriptionOriginal: null, parentCode: null, bindings: [], ownerApproval: OMAHA_APPROVAL_KEY, ...r });

  // Dominios y problemas
  const problemOrder = [];
  let order = 0;
  for (const [di, d] of parsed.problems.domains.entries()) {
    const dCode = `domain/${slugify(d.name.replace(/\s*Domain$/i, ''))}`;
    add({ key: `omaha:${dCode}`, code: dCode, kind: 'domain', nameOriginal: d.name, descriptionOriginal: d.definition, sourceOrder: di + 1, provenance: prov('site-problems', `Problem Classification Scheme/${d.name}`) });
    for (const p of d.problems) {
      order += 1;
      const pCode = `problem/${slugify(p)}`;
      problemOrder.push({ name: p, code: pCode });
      add({ key: `omaha:${pCode}`, code: pCode, kind: 'problem', nameOriginal: p, parentCode: dCode, sourceOrder: order, provenance: prov('site-problems', `Problem Classification Scheme/${d.name}/${p}`) });
    }
  }

  // Definiciones y signos/síntomas del MOSUG (18 problemas), unidos por la página del libro de 2005:
  // la lista «Problem Classification Scheme» del suplemento (42 renglones con sus páginas) va en el mismo
  // orden que la del sitio; se une por posición y se exige que el nombre del suplemento (que puede venir
  // cortado por el salto de línea del PDF) sea un prefijo del nombre del sitio.
  if (parsed.mosugPages.length !== problemOrder.length) throw new Error(`MOSUG lista ${parsed.mosugPages.length} problemas y el sitio ${problemOrder.length}`);
  const pageToProblem = new Map();
  parsed.mosugPages.forEach((x, i) => {
    const site = problemOrder[i];
    if (!normName(site.name).startsWith(normName(x.name))) throw new Error(`MOSUG pos. ${i + 1}: «${x.name}» no coincide con «${site.name}» del sitio`);
    pageToProblem.set(x.pageStart, site);
  });
  const joined = [];
  for (const mp of parsed.mosugProblems) {
    const problem = pageToProblem.get(mp.page);
    if (!problem) throw new Error(`MOSUG: el problema «${mp.name}» (pg ${mp.page}) no corresponde a ninguno del sitio oficial`);
    joined.push({ mp, problem });
  }
  for (const { mp, problem } of joined) {
    const row = rows.find((r) => r.code === problem.code);
    row.descriptionOriginal = mp.definition;
    row.definitionSource = mosug(`Problem «${mp.name}», pg ${mp.page} del libro de 2005`);
    mp.signsSymptoms.forEach((ss, i) => {
      const code = `sign-symptom/${slugify(problem.name)}/${slugify(ss)}`;
      add({ key: `omaha:${code}`, code, kind: 'sign-symptom', nameOriginal: ss, parentCode: problem.code, sourceOrder: i + 1, provenance: mosug(`Signs/ Symptoms de «${mp.name}» (pg ${mp.page}), ${i + 1}.º por columnas`) });
    });
  }

  // Modificadores de problema
  const modDefs = parsed.mosugModifierDefs;
  for (const set of parsed.modifiers.sets) {
    const setCode = `modifier-set/${slugify(set.name)}`;
    add({ key: `omaha:${setCode}`, code: setCode, kind: 'problem-modifier-set', nameOriginal: set.name, sourceOrder: parsed.modifiers.sets.indexOf(set) + 1, provenance: prov('site-problems', 'Problem Classification Scheme, nivel 3 (modificadores)', { sentence: parsed.modifiers.sentence }) });
    set.terms.forEach((t, i) => {
      const code = `modifier/${slugify(t)}`;
      const def = Object.entries(modDefs).find(([k]) => slugify(k) === slugify(t));
      add({ key: `omaha:${code}`, code, kind: 'problem-modifier', nameOriginal: t, descriptionOriginal: def ? def[1] : null, parentCode: setCode, sourceOrder: i + 1, provenance: prov('site-problems', 'Problem Classification Scheme, nivel 3 (modificadores)', { sentence: parsed.modifiers.sentence }), ...(def ? { definitionSource: mosug(`Problem Modifiers Guide, «${def[0]}»`) } : {}) });
    });
  }

  // Categorías y objetivos de intervención
  parsed.interventions.categories.forEach((c, i) => {
    const code = `intervention-category/${slugify(c.name)}`;
    add({ key: `omaha:${code}`, code, kind: 'intervention-category', nameOriginal: c.name, descriptionOriginal: c.definition, sourceOrder: i + 1, provenance: prov('site-interventions', `Intervention Scheme/Categories/${c.name}`) });
  });
  parsed.interventions.targets.forEach((t, i) => {
    const code = `intervention-target/${slugify(t)}`;
    add({ key: `omaha:${code}`, code, kind: 'intervention-target', nameOriginal: t, sourceOrder: i + 1, provenance: prov('site-interventions', `Intervention Scheme/Targets/${t}`) });
  });

  // PRSO
  const prsoProv = (extra) => prov('site-prso-image', 'Problem Rating Scale for Outcomes', { transcribedFromImage: true, imageFileKey: 'site-prso-image', transcription: 'Transcripción visual de la imagen oficial (no hay texto máquina-legible); contrastada con las respuestas LOINC LA6495-1…LA6494-4', ...extra });
  PRSO.forEach((c, i) => {
    const cCode = `prso/${slugify(c.name)}`;
    add({ key: `omaha:${cCode}`, code: cCode, kind: 'prso-concept', nameOriginal: c.name, descriptionOriginal: c.definition, sourceOrder: i + 1, provenance: prsoProv({}) });
    c.ratings.forEach((r, k) => {
      const code = `${cCode}/${k + 1}`;
      add({ key: `omaha:${code}`, code, kind: 'prso-rating', nameOriginal: r, parentCode: cCode, sourceOrder: k + 1, ordinalValue: k + 1, provenance: prsoProv({ ratingOf: c.name }) });
    });
  });

  const seen = new Set();
  for (const r of rows) {
    if (seen.has(r.code)) throw new Error(`Omaha: código repetido ${r.code}`);
    seen.add(r.code);
  }
  for (const r of rows) if (r.parentCode && !seen.has(r.parentCode)) throw new Error(`Omaha: falta el padre ${r.parentCode} de ${r.code}`);
  return rows;
}
