// =============================================================================
// Imágenes del artículo (TAREA-41 §12.2 regla 7).
//
// Cadena de identidad:  tema de MedlinePlus ──(descriptor MeSH del tema inglés
// mapeado)── ítem de Wikidata con ese MeSH en P486 ──(P18)── archivo de Commons.
// El archivo se acepta SOLO si:
//   1. el nombre del descriptor MeSH coincide con el título inglés del tema
//      (`name-match`): un descriptor más amplio o distinto («Neoplasms» para
//      «Cancer in Children», «Humeral Fractures» para «Arm Injuries and
//      Disorders») puede traer una imagen de OTRA cosa, y en un producto de
//      auditoría clínica es mejor no mostrar nada que mostrar la imagen
//      equivocada. Los demás casos quedan como candidatos en GAPS;
//   2. la API de Commons (consultada de nuevo, no solo el volcado previo)
//      declara una licencia permitida: dominio público, CC0, CC BY, CC BY-SA;
//   3. la URL cae en un host que admite la CSP del front.
// =============================================================================

import { decodeEntities, htmlToText } from '../../../lib/glossary-es/common.mjs';

/** Hosts de `img-src` de `mantra-core-health/src/server/security-headers.ts` (menos los de mapas). */
export const ALLOWED_IMAGE_HOSTS = Object.freeze(['upload.wikimedia.org', 'thumb.wikimedia.org', 'cima.aemps.es']);

export const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
export const COMMONS_EXTMETADATA = ['ObjectName', 'ImageDescription', 'Artist', 'Credit', 'LicenseShortName', 'LicenseUrl', 'UsageTerms', 'AttributionRequired', 'Restrictions', 'NonFree'];

export function isAllowedImageUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && ALLOWED_IMAGE_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Familia de licencia permitida, o null. Lista blanca: lo que no casa
 * («GFDL», «FAL», «Attribution», «No restrictions», «Copyrighted free use»,
 * cualquier «NC»/«ND») NO se usa y queda como NO VERIFICADO.
 * @returns {{ family: 'public-domain'|'cc0'|'cc-by'|'cc-by-sa', label: string } | null}
 */
export function allowedLicense(shortName) {
  const s = String(shortName ?? '').trim();
  if (!s || /\b(?:NC|ND)\b|-NC|-ND/i.test(s)) return null;
  if (/^public domain\b/i.test(s) || /^PD[- ]/i.test(s)) return { family: 'public-domain', label: s };
  if (/^CC0\b/i.test(s)) return { family: 'cc0', label: s };
  if (/^CC[- ]BY[- ]SA\b/i.test(s)) return { family: 'cc-by-sa', label: s };
  if (/^CC[- ]BY\b/i.test(s)) return { family: 'cc-by', label: s };
  return null;
}

/** Normaliza para comparar nombres MeSH con títulos de MedlinePlus: sin posesivo, sin puntuación, singular simple, orden indiferente. */
export function normalizeTitleForMatch(text) {
  const words = String(text ?? '')
    .toLowerCase()
    .replace(/['’]s\b/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length > 3 && w.endsWith('ies') ? `${w.slice(0, -3)}y` : w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('is') ? w.slice(0, -1) : w));
  return words.sort().join(' ');
}

/** Índice del volcado `wikidata-images.ndjson`: código MeSH (P486, P18) → filas. */
export function indexMeshImages(imageRows) {
  const idx = new Map();
  for (const r of imageRows) {
    if (r.matchProperty !== 'P486' || r.imageProperty !== 'P18') continue;
    if (!idx.has(r.code)) idx.set(r.code, []);
    idx.get(r.code).push(r);
  }
  return idx;
}

function qNum(id) {
  return Number(String(id).replace(/^Q/, '')) || Number.MAX_SAFE_INTEGER;
}

/**
 * Candidato de imagen para un tema, con su nivel de confianza.
 * @param {{ mesh: {id:string,name:string}[], enTitle: string|null }} topic
 * @returns {{ tier: 'name-match', row: object, meshId: string, meshName: string } | { tier: 'name-differs', row: object, meshId: string, meshName: string } | null}
 */
export function imageCandidate(topic, meshIndex) {
  const wanted = normalizeTitleForMatch(topic.enTitle);
  let fallback = null;
  for (const m of topic.mesh) {
    const rows = [...(meshIndex.get(m.id) ?? [])].sort((a, b) => qNum(a.wikidataId) - qNum(b.wikidataId) || a.file.localeCompare(b.file));
    if (!rows.length) continue;
    if (wanted && normalizeTitleForMatch(m.name) === wanted) return { tier: 'name-match', row: rows[0], meshId: m.id, meshName: m.name };
    fallback ??= { tier: 'name-differs', row: rows[0], meshId: m.id, meshName: m.name };
  }
  return fallback;
}

// --- Respuesta de la API de Commons ------------------------------------------

export function commonsRequestUrl(files) {
  const params = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime|size', iiurlwidth: '330', iiextmetadatafilter: COMMONS_EXTMETADATA.join('|'),
    titles: files.map((f) => `File:${f}`).join('|'),
  });
  return `${COMMONS_API}?${params}`;
}

function metaValue(md, key) {
  const v = md?.[key]?.value;
  return v == null ? null : String(v);
}

/** `<div … lang="xx" …>contenido</div>` con balanceo de `<div>` anidados; devuelve [{lang, html}]. */
function languageBlocks(html) {
  const blocks = [];
  const open = /<div\b[^>]*\blang="([a-z-]+)"[^>]*>/gi;
  for (let m = open.exec(html); m; m = open.exec(html)) {
    let depth = 1;
    const start = m.index + m[0].length;
    const tag = /<(\/?)div\b[^>]*>/gi;
    tag.lastIndex = start;
    for (let t = tag.exec(html); t; t = tag.exec(html)) {
      depth += t[1] ? -1 : 1;
      if (depth === 0) {
        blocks.push({ lang: m[1].toLowerCase(), html: html.slice(start, t.index) });
        open.lastIndex = t.index;
        break;
      }
    }
  }
  return blocks;
}

/** Quita el rótulo de idioma que pone la plantilla multilingüe de Commons («<span class="language es">Español:</span>»). */
function withoutLanguageLabel(html) {
  return html.replace(/<span[^>]*class="[^"]*\blanguage\b[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '');
}

/**
 * Descripción de Commons → {text, lang}. Prefiere el bloque en castellano; si no
 * hay, el primer bloque con idioma declarado; sin ninguno, el texto tal cual
 * (lang «und», que NUNCA se usa como texto alternativo).
 */
export function commonsCaption(descriptionHtml) {
  if (!descriptionHtml) return null;
  const blocks = languageBlocks(descriptionHtml);
  const chosen = blocks.find((b) => b.lang === 'es' || b.lang.startsWith('es-')) ?? blocks[0];
  const text = htmlToText(withoutLanguageLabel(chosen ? chosen.html : descriptionHtml));
  if (!text) return null;
  return { text, lang: chosen ? (chosen.lang.startsWith('es') ? 'es' : chosen.lang) : 'und' };
}

/** Respuesta `formatversion=2` de imageinfo → Map(nombre de archivo → datos de Commons). */
export function parseCommonsResponse(json) {
  const out = new Map();
  const fromTo = new Map((json?.query?.normalized ?? []).map((n) => [n.to, n.from]));
  for (const page of json?.query?.pages ?? []) {
    if (page.missing || !page.imageinfo?.[0]) continue;
    const info = page.imageinfo[0];
    const md = info.extmetadata ?? {};
    const name = page.title.replace(/^File:/, '');
    const data = {
      file: name,
      url: info.url ?? null,
      thumbUrl: info.thumburl ?? null,
      descriptionUrl: info.descriptionurl ?? null,
      mime: info.mime ?? null,
      license: metaValue(md, 'LicenseShortName'),
      licenseUrl: metaValue(md, 'LicenseUrl'),
      usageTerms: metaValue(md, 'UsageTerms'),
      author: (() => {
        const artist = metaValue(md, 'Artist');
        return artist ? htmlToText(artist) : null;
      })(),
      credit: (() => {
        const credit = metaValue(md, 'Credit');
        return credit ? htmlToText(credit) : null;
      })(),
      attributionRequired: metaValue(md, 'AttributionRequired'),
      restrictions: metaValue(md, 'Restrictions'),
      nonFree: metaValue(md, 'NonFree'),
      caption: commonsCaption(metaValue(md, 'ImageDescription')),
      objectName: (() => {
        const o = metaValue(md, 'ObjectName');
        return o ? htmlToText(o) : null;
      })(),
    };
    out.set(name, data);
    const original = fromTo.get(page.title);
    if (original) out.set(original.replace(/^File:/, ''), data);
  }
  return out;
}

function stripQuery(url) {
  try {
    const u = new URL(url);
    u.search = '';
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Arma el objeto `images[]` del contrato §12.3 o explica por qué no se puede.
 * @returns {{ image: object } | { reject: { reason: string, detail: string } }}
 */
export function buildImage({ commons, term, wikidataId }) {
  if (!commons) return { reject: { reason: 'commons-not-verified', detail: 'La API de Commons no devolvió el archivo' } };
  const lic = allowedLicense(commons.license);
  if (!lic) return { reject: { reason: 'license-not-allowed', detail: `Licencia declarada en Commons: «${commons.license ?? 'ninguna'}»` } };
  if (commons.nonFree === 'true' || commons.restrictions) {
    return { reject: { reason: 'restricted-on-commons', detail: `NonFree=${commons.nonFree ?? '-'} · Restrictions=${commons.restrictions ?? '-'}` } };
  }
  if (!commons.url || !commons.descriptionUrl) return { reject: { reason: 'missing-origin', detail: 'Sin URL o página de origen' } };
  const url = stripQuery(commons.url);
  const thumbUrl = stripQuery(commons.thumbUrl ?? commons.url);
  for (const u of [url, thumbUrl]) {
    if (!isAllowedImageUrl(u)) return { reject: { reason: 'host-outside-csp', detail: u } };
  }
  const author = commons.author ?? commons.credit;
  if (!author) return { reject: { reason: 'missing-author', detail: 'Commons no declara autor ni crédito' } };
  if (!commons.licenseUrl && lic.family !== 'public-domain') return { reject: { reason: 'missing-license-url', detail: commons.license } };
  const caption = commons.caption;
  const spanish = caption?.lang === 'es';
  return {
    image: {
      url,
      thumbUrl,
      kind: /svg/i.test(commons.mime ?? '') ? 'diagram' : 'image',
      caption: caption?.text ?? null,
      captionLang: caption ? caption.lang : null,
      altText: spanish ? caption.text : `Imagen de ${term}`,
      altTextQuality: spanish ? 'caption' : 'generic',
      author: decodeEntities(author),
      license: commons.license,
      licenseUrl: commons.licenseUrl ?? null,
      licenseFamily: lic.family,
      sourcePage: commons.descriptionUrl,
      wikidataId,
      retrievedAt: commons.retrievedAt,
    },
  };
}
