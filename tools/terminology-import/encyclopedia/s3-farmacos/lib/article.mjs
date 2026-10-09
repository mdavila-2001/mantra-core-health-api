// =============================================================================
// Ensamblado del artículo de un fármaco (contrato de §12.3 de la ficha).
// Funciones puras: reciben lo ya descargado y devuelven `{ article, rejected }`.
// Nada de acá escribe prosa médica: cada sección es la ficha técnica de CIMA o la
// descripción CC0 de Wikidata, con su cita; lo que no tiene fuente no existe.
// =============================================================================

import { createHash } from 'node:crypto';
import { cleanLines, htmlToLines } from './blocks.mjs';
import { assertNoDose, doseMatch } from './dose-guard.mjs';
import { allowedHost, classifyImageLicense, cimaPhotoToImage } from './images.mjs';
import { SECTION_KINDS, SECTION_ORDER, assertAllowedSection, sectionPublicUrl } from './sections.mjs';

export const CIMA_SOURCE = 'aemps-cima';
export const CIMA_LICENSE =
  'AEMPS — reproducción autorizada citando el origen y la fecha de la última actualización del documento (https://www.aemps.gob.es/aviso-legal/)';
export const WIKIDATA_SOURCE = 'wikidata';
export const WIKIDATA_LICENSE = 'CC0 1.0 (dominio público)';
export const MAX_IMAGES_PER_ARTICLE = 4;

/** Kinds del catálogo cerrado de fármacos (§12.3). */
export const DRUG_SECTION_KINDS = Object.freeze([
  'definition', 'indications', 'contraindications', 'adverse_effects', 'interactions',
  'pregnancy_lactation', 'special_populations', 'pharmacologic_class', 'presentations',
]);

const sha1 = (s) => createHash('sha1').update(s).digest('hex').slice(0, 12);
const day = (iso) => (typeof iso === 'string' ? iso.slice(0, 10) : null);

export const conceptRefOf = (seedRow) => ({ system: seedRow.codeSystem, code: seedRow.code, slug: seedRow.slug });

/** Motivo de rechazo con la identidad del término y sin copiar nunca el texto descartado. */
function rejection(seedRow, scope, reason, extra = {}) {
  return { conceptRef: conceptRefOf(seedRow), scope, reason, ...extra };
}

/**
 * Respuesta de `docSegmentado/contenido/1` para UNA sección → sección del artículo.
 * @returns {{ section: object|null, rejected: object[] }}
 */
export function buildCimaSection({ seedRow, code, response, nregistro, fichaDate, fichaDateOrigin = 'cima-api-docs-fecha', retrievedAt }) {
  assertAllowedSection(code);
  const rejected = [];
  // El aviso legal de AEMPS exige citar la fecha de la última actualización del documento: sin ella no se publica.
  if (!fichaDate) {
    rejected.push(rejection(seedRow, 'section', 'ficha-without-date', { section: code, nregistro }));
    return { section: null, rejected };
  }
  const item = Array.isArray(response) ? response.find((s) => s?.seccion === code) : null;
  if (!item?.contenido) {
    rejected.push(rejection(seedRow, 'section', 'section-absent-in-source', { section: code, nregistro }));
    return { section: null, rejected };
  }
  let lines = htmlToLines(item.contenido);
  let titleSuffix = '';
  if (code === '5.1') {
    // De 5.1 solo se toma la clase («Grupo farmacoterapéutico: …»); el resto es farmacocinética y cifras.
    lines = lines.filter((l) => /^grupo\s+farmacoterap[eé]utico/i.test(l));
    titleSuffix = ' (grupo farmacoterapéutico)';
    if (lines.length === 0) {
      rejected.push(rejection(seedRow, 'section', 'no-pharmacotherapeutic-group-line', { section: code, nregistro }));
      return { section: null, rejected };
    }
  }
  const { lines: kept, dropped, sentenceCount } = cleanLines(lines);
  if (dropped.length > 0) {
    const byReason = {};
    for (const d of dropped) byReason[d.reason] = (byReason[d.reason] ?? 0) + 1;
    rejected.push(
      rejection(seedRow, 'sentences', 'dose-guard', {
        section: code,
        nregistro,
        sentenceCount,
        droppedCount: dropped.length,
        byReason,
        // Solo huellas: el texto descartado puede ser una dosis y no se guarda.
        fingerprints: dropped.map((d) => sha1(d.sentence)),
      }),
    );
  }
  if (kept.length === 0) {
    rejected.push(rejection(seedRow, 'section', 'all-sentences-dropped', { section: code, nregistro, sentenceCount }));
    return { section: null, rejected };
  }
  const titulo = (item.titulo ?? '').trim();
  return {
    section: {
      kind: SECTION_KINDS[code],
      text: kept.join('\n'),
      lang: 'es',
      source: CIMA_SOURCE,
      sourceUrl: sectionPublicUrl(nregistro, code),
      license: CIMA_LICENSE,
      retrievedAt: day(retrievedAt),
      sourceVersion: fichaDate,
      sourceVersionOrigin: fichaDateOrigin,
      locator: `${code}${titulo ? ` ${titulo}` : ''}${titleSuffix}`,
      nregistro,
      ...(dropped.length > 0 ? { omittedSentences: dropped.length } : {}),
    },
    rejected,
  };
}

const uniq = (xs) => [...new Set(xs.filter((x) => x != null && x !== ''))];

/** Facts estructurados de un VTM (todo viene del listado/detalle de CIMA; ninguna concentración). */
export function buildCimaFacts(vtm, { listingDate }) {
  const cima = (url) => ({ source: CIMA_SOURCE, sourceUrl: url });
  const refUrl = vtm.products.find((p) => p.nregistro === vtm.referenceNregistro)?.cimaUrl ?? vtm.products[0]?.cimaUrl ?? 'https://cima.aemps.es/';
  const facts = [];
  // Algunos nombres oficiales de clase ATC llevan la palabra «dosis» («…preparados de dosis fijas»): es
  // clasificación, no posología, pero la regla es estricta. En ese caso se publica solo el código.
  const atcValue = (a) => (doseMatch(a.name) ? a.code : `${a.code} · ${a.name}`);
  for (const a of vtm.atc.filter((x) => x.level === 5)) facts.push({ label: 'Código ATC', value: atcValue(a), ...cima(refUrl) });
  for (const a of vtm.atc.filter((x) => x.level >= 3 && x.level < 5)) facts.push({ label: `Clase ATC (nivel ${a.level})`, value: atcValue(a), ...cima(refUrl) });
  const routes = uniq(vtm.products.flatMap((p) => p.routes)).sort((a, b) => a.localeCompare(b, 'es'));
  if (routes.length) facts.push({ label: 'Vías de administración autorizadas', value: routes.join('; '), ...cima(refUrl) });
  const commercialized = vtm.products.filter((p) => p.commercialized).length;
  facts.push({
    label: 'Medicamentos autorizados con este principio activo (CIMA)',
    value: `${vtm.products.length} (${commercialized} comercializados al ${listingDate})`,
    ...cima(refUrl),
  });
  if (vtm.referenceNregistro) facts.push({ label: 'Nº de registro del medicamento cuya ficha se cita', value: vtm.referenceNregistro, ...cima(refUrl) });
  if (vtm.wikidataQ) facts.push({ label: 'Wikidata', value: vtm.wikidataQ, source: WIKIDATA_SOURCE, sourceUrl: `https://www.wikidata.org/wiki/${vtm.wikidataQ}` });
  return facts;
}

/** Sección `presentations`: formas farmacéuticas y vías como dato (sin nombres de presentación, que llevan la concentración). */
export function buildPresentationsSection(seedRow, vtm, { listingDate, retrievedAt }) {
  const combos = new Map();
  for (const p of vtm.products) {
    if (!p.dosageForm) continue;
    const route = p.routes.join(', ');
    const key = `${p.dosageForm}|${route}`;
    combos.set(key, route ? `${p.dosageForm} — ${route}` : p.dosageForm);
  }
  const items = [...combos.values()].sort((a, b) => a.localeCompare(b, 'es'));
  const rejected = [];
  const safe = [];
  for (const it of items) {
    try {
      assertNoDose(it, 'presentations.item');
      safe.push(it);
    } catch {
      rejected.push(rejection(seedRow, 'presentation-item', 'dose-guard', { fingerprint: sha1(it) }));
    }
  }
  if (safe.length === 0) return { section: null, rejected };
  const refUrl = vtm.products.find((p) => p.nregistro === vtm.referenceNregistro)?.cimaUrl ?? vtm.products[0].cimaUrl;
  return {
    section: {
      kind: 'presentations',
      text: safe.join('\n'),
      items: safe,
      lang: 'es',
      source: CIMA_SOURCE,
      sourceUrl: refUrl,
      license: CIMA_LICENSE,
      retrievedAt: day(retrievedAt),
      sourceVersion: listingDate,
      locator: 'Forma farmacéutica y vía de administración (listado de medicamentos de CIMA)',
    },
    rejected,
  };
}

/** Hasta `MAX_IMAGES_PER_ARTICLE` fotos de CIMA: primero las del producto de referencia, forma farmacéutica antes que envase. */
export function pickCimaImages(vtm, { termName, retrievedAt }) {
  const ordered = [...vtm.products].sort((a, b) => Number(b.nregistro === vtm.referenceNregistro) - Number(a.nregistro === vtm.referenceNregistro));
  const out = [];
  const seen = new Set();
  const kindRank = { formafarmac: 0, materialas: 1 };
  for (const p of ordered) {
    const photos = [...p.photos].sort((a, b) => (kindRank[a.kind] ?? 9) - (kindRank[b.kind] ?? 9));
    for (const ph of photos) {
      if (out.length >= MAX_IMAGES_PER_ARTICLE) return out;
      if (seen.has(ph.url) || !allowedHost(ph.url) || !allowedHost(ph.thumbUrl)) continue;
      seen.add(ph.url);
      out.push(cimaPhotoToImage(ph, { termName, nregistro: p.nregistro, cimaUrl: p.cimaUrl, retrievedAt: day(retrievedAt) }));
    }
  }
  return out;
}

/**
 * Artículo de un término CIMA (un principio activo).
 * @param {object} p
 * @param {object} p.seedRow   fila de la semilla (identidad)
 * @param {object} p.vtm       `slimVtm`
 * @param {Record<string,{response:any, retrievedAt:string, fichaDate:string}>} p.sections  por número de sección
 * @param {object[]} p.extraImages imágenes ya validadas (p. ej. Commons)
 */
export function buildCimaArticle({ seedRow, vtm, sections, extraImages = [], listingDate, retrievedAt }) {
  const rejected = [];
  const built = [];
  const nreg = vtm.referenceNregistro;
  for (const code of SECTION_ORDER) {
    const src = sections?.[code];
    if (!nreg || !src) continue;
    const r = buildCimaSection({ seedRow, code, response: src.response, nregistro: nreg, fichaDate: src.fichaDate, fichaDateOrigin: src.fichaDateOrigin, retrievedAt: src.retrievedAt });
    rejected.push(...r.rejected);
    if (r.section) built.push(r.section);
  }
  const pres = buildPresentationsSection(seedRow, vtm, { listingDate, retrievedAt });
  rejected.push(...pres.rejected);
  if (pres.section) built.push(pres.section);

  const images = [...pickCimaImages(vtm, { termName: seedRow.esName, retrievedAt }), ...extraImages];
  const article = {
    conceptRef: conceptRefOf(seedRow),
    lang: 'es',
    sections: built,
    images,
    facts: buildCimaFacts(vtm, { listingDate }),
    references: referencesFor(vtm),
  };
  return { article, rejected };
}

function referencesFor(vtm) {
  const ref = vtm.products.find((p) => p.nregistro === vtm.referenceNregistro);
  if (!ref?.fichaTecnicaUrl) return [];
  return [{ title: 'Ficha técnica oficial (CIMA, AEMPS)', url: ref.fichaTecnicaUrl, source: CIMA_SOURCE }];
}

// ---------------------------------------------------------------------------
// Sustancias de Wikidata (CC0)
// ---------------------------------------------------------------------------

const firstValue = (entity, prop) => {
  const v = entity.claims?.[prop]?.[0]?.mainsnak?.datavalue?.value;
  return typeof v === 'string' ? v : null;
};

/**
 * @param {object} p
 * @param {object} p.seedRow     término `wikidata-medicamento`
 * @param {object} p.entity      entidad de `wbgetentities` (info|labels|descriptions|claims)
 * @param {Record<string,{es:string|null,en:string|null}>} p.classLabels  por Q-id de clase (P2868)
 */
export function buildWikidataArticle({ seedRow, entity, classLabels, images = [], retrievedAt }) {
  const rejected = [];
  const sections = [];
  const q = seedRow.code;
  const page = `https://www.wikidata.org/wiki/${q}`;
  const version = day(entity.modified);
  const base = { source: WIKIDATA_SOURCE, sourceUrl: page, license: WIKIDATA_LICENSE, retrievedAt: day(retrievedAt), sourceVersion: version };

  const descEs = entity.descriptions?.es?.value ?? null;
  if (descEs) sections.push({ kind: 'definition', text: descEs, lang: 'es', ...base, locator: 'Descripción (es)' });
  else rejected.push(rejection(seedRow, 'section', 'no-spanish-description', { section: 'definition' }));

  const classIds = (entity.claims?.P2868 ?? []).map((c) => c.mainsnak?.datavalue?.value?.id).filter(Boolean);
  if (classIds.length > 0) {
    const es = classIds.map((id) => classLabels[id]?.es).filter(Boolean);
    const en = classIds.map((id) => classLabels[id]?.en).filter(Boolean);
    const useEs = es.length > 0;
    const labels = uniq(useEs ? es : en);
    if (useEs && en.length > es.length) rejected.push(rejection(seedRow, 'class-label', 'no-spanish-label', { section: 'pharmacologic_class', count: classIds.length - es.length }));
    if (labels.length > 0) {
      sections.push({
        kind: 'pharmacologic_class',
        text: labels.join('; '),
        items: labels,
        lang: useEs ? 'es' : 'en',
        ...base,
        locator: 'Propiedad P2868 «sujeto tiene el rol»',
      });
    }
  }

  const facts = [];
  const atc = firstValue(entity, 'P267');
  if (atc) facts.push({ label: 'Código ATC', value: atc, source: WIKIDATA_SOURCE, sourceUrl: page });
  const cas = firstValue(entity, 'P231');
  if (cas) facts.push({ label: 'Número CAS', value: cas, source: WIKIDATA_SOURCE, sourceUrl: page });
  const db = firstValue(entity, 'P715');
  if (db) facts.push({ label: 'Identificador DrugBank (solo identificador)', value: db, source: WIKIDATA_SOURCE, sourceUrl: page });
  const mesh = firstValue(entity, 'P486');
  if (mesh) facts.push({ label: 'Identificador MeSH', value: mesh, source: WIKIDATA_SOURCE, sourceUrl: page });
  facts.push({ label: 'Wikidata', value: q, source: WIKIDATA_SOURCE, sourceUrl: page });

  return {
    article: {
      conceptRef: conceptRefOf(seedRow),
      lang: 'es',
      sections,
      images,
      facts,
      references: [{ title: `Wikidata ${q}`, url: page, source: WIKIDATA_SOURCE }],
    },
    rejected,
  };
}

// ---------------------------------------------------------------------------
// Validación final (se llama justo antes de escribir cada línea)
// ---------------------------------------------------------------------------

const REQUIRED_SECTION_FIELDS = ['source', 'sourceUrl', 'license', 'retrievedAt', 'sourceVersion', 'locator'];

/** Lanza `Error` si el artículo no cumple el contrato de §12.3 o filtra una dosis. */
export function validateArticle(article) {
  const ref = article?.conceptRef;
  if (!ref?.system || !ref?.code || !ref?.slug) throw new Error('conceptRef incompleto');
  const kinds = new Set();
  for (const s of article.sections) {
    if (!DRUG_SECTION_KINDS.includes(s.kind)) throw new Error(`${ref.slug}: kind «${s.kind}» fuera del catálogo de fármacos`);
    if (kinds.has(s.kind)) throw new Error(`${ref.slug}: kind «${s.kind}» repetido`);
    kinds.add(s.kind);
    for (const f of REQUIRED_SECTION_FIELDS) if (!s[f]) throw new Error(`${ref.slug}/${s.kind}: falta «${f}»`);
    if (!s.text) throw new Error(`${ref.slug}/${s.kind}: sección sin texto`);
    if (!['es', 'en'].includes(s.lang)) throw new Error(`${ref.slug}/${s.kind}: lang inválido`);
  }
  for (const img of article.images) {
    if (!allowedHost(img.url) || !allowedHost(img.thumbUrl)) throw new Error(`${ref.slug}: imagen fuera de la CSP (${img.url})`);
    const lic = img.license?.startsWith('AEMPS/CIMA') ? { ok: true } : classifyImageLicense(img.license);
    if (!lic.ok) throw new Error(`${ref.slug}: licencia de imagen no admitida (${img.license})`);
    for (const f of ['author', 'license', 'sourcePage', 'retrievedAt', 'altText']) if (!img[f]) throw new Error(`${ref.slug}: imagen sin «${f}»`);
  }
  for (const f of article.facts) if (!f.label || !f.value || !f.source || !f.sourceUrl) throw new Error(`${ref.slug}: fact incompleto`);
  assertNoDose(article);
  return article;
}
