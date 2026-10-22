// =============================================================================
// Imágenes de Wikimedia Commons por Q-id de Wikidata.
//
// El vínculo término ↔ imagen NO se infiere: el ítem de Wikidata declara el
// archivo en P18 (imagen), P5555 (esquema), P6802 (imagen relacionada), P117
// (estructura química) o P8224 (modelo molecular). Los metadatos (autor,
// licencia, URL de licencia, descripción, categorías) salen de la API de Commons
// (`imageinfo` + `extmetadata`) y mandan sobre lo que haya en la semilla.
//
// Compuerta de licencia (ficha §12.2.7): solo `public domain`, CC0, CC BY y
// CC BY-SA. NC, ND, GFDL, «No restrictions», «Copyrighted free use», sin
// licencia: se rechazan con motivo. Solo hosts de la CSP del front.
// =============================================================================

import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { htmlToText } from '../../../lib/glossary-es/common.mjs';
import { ALLOWED_IMAGE_HOSTS, CACHE_DIR } from './config.mjs';

export const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
export const COMMONS_BATCH = 50;
export const MAX_CAPTION_LENGTH = 300;

export function commonsUrl(fileNames) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime',
    iiurlwidth: '330',
    iiextmetadatafilter: 'Artist|Credit|LicenseShortName|LicenseUrl|UsageTerms|ImageDescription|Categories|Restrictions',
    uselang: 'es',
    titles: fileNames.map((f) => `File:${f}`).join('|'),
  });
  return `${COMMONS_API}?${params}`;
}

/** Descarga `imageinfo` de los archivos dados (50 por pedido, con caché). Devuelve `Map archivo → info`. */
export async function fetchCommonsInfo(http, fileNames, { onProgress } = {}) {
  const unique = [...new Set(fileNames)].sort();
  const result = new Map();
  for (let i = 0; i < unique.length; i += COMMONS_BATCH) {
    const batch = unique.slice(i, i + COMMONS_BATCH);
    const key = createHash('sha1').update(batch.join('|')).digest('hex').slice(0, 16);
    const json = await http.getJsonCached(commonsUrl(batch), join(CACHE_DIR, 'commons', `${key}.json`));
    for (const [name, info] of parseCommonsResponse(json)) result.set(name, info);
    onProgress?.(Math.min(i + COMMONS_BATCH, unique.length), unique.length);
  }
  return result;
}

/** Respuesta de la API → `Map archivo (con espacios, sin «File:») → info normalizada`. */
export function parseCommonsResponse(json) {
  const out = new Map();
  const normalizedFrom = new Map((json?.query?.normalized ?? []).map((n) => [n.to, n.from]));
  const redirectFrom = new Map((json?.query?.redirects ?? []).map((r) => [r.to, r.from]));
  for (const page of Object.values(json?.query?.pages ?? {})) {
    const ii = page.imageinfo?.[0];
    if (!ii || page.missing !== undefined) continue;
    const md = ii.extmetadata ?? {};
    const value = (k) => md[k]?.value ?? null;
    const name = page.title.replace(/^File:/, '');
    const info = {
      file: name,
      url: ii.url ?? null,
      thumbUrl: ii.thumburl ?? null,
      sourcePage: ii.descriptionurl ?? null,
      mime: ii.mime ?? null,
      licenseShortName: value('LicenseShortName'),
      licenseUrl: value('LicenseUrl'),
      artist: htmlToText(value('Artist') ?? ''),
      credit: htmlToText(value('Credit') ?? ''),
      description: htmlToText(value('ImageDescription') ?? ''),
      categories: (value('Categories') ?? '').split('|').filter(Boolean),
      restrictions: value('Restrictions'),
    };
    out.set(name, info);
    for (const alias of [normalizedFrom.get(page.title), redirectFrom.get(page.title)]) if (alias) out.set(alias.replace(/^File:/, ''), info);
  }
  return out;
}

/**
 * Familia de licencia permitida o `null`. Se decide por `LicenseShortName` de
 * Commons. NC/ND, GFDL y cualquier cosa fuera de la lista se rechazan.
 */
export function licenseFamily(shortName) {
  if (!shortName) return null;
  const s = shortName.trim().toLowerCase();
  if (/\b(nc|nd)\b|-nc|-nd/.test(s)) return null;
  if (/^public domain\b/.test(s) || /^pd[- ]/.test(s)) return 'public domain';
  if (/^cc0\b/.test(s)) return 'cc0';
  if (/^cc[ -]by-sa\b/.test(s)) return 'cc by-sa';
  if (/^cc[ -]by\b/.test(s)) return 'cc by';
  return null;
}

export function isAllowedImageHost(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && ALLOWED_IMAGE_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

// Señales ESPECÍFICAS en las CATEGORÍAS de Commons y el nombre del archivo (la
// descripción es texto libre y ruidoso: no se usa). No son palabras sueltas:
// «stain» o «microscop» aparecen en categorías de láminas y esquemas.
const IMAGING = /\b(?:x-rays? of|radiograph(?:s|y)? of|radiological images|ct images?|ct scans?|computed tomograph|mri of|magnetic resonance imaging|ultrasound images|ultrasonogra|angiogra|cholangiogra|urogra|mammogra|scintigra|pet scans?|fluoroscop|barium|gastrointestinal series)/i;
const DIAGRAM = /(?:gray'?s anatomy|schematic|diagram(?! labell?ed)|illustrations?|drawings?|paintings?|artworks?|sculptures?|infographic|\bplates? of\b|anatomical (?:images|drawings)|sobotta|netter)/i;
const HISTOLOGY = /\b(?:histolog(?:y|ical)|histopatholog|micrograph|microscopic images)/i;

/**
 * `kind` de la imagen según METADATOS de Commons (categorías, nombre de archivo,
 * tipo MIME) y la propiedad de Wikidata que la declara. No mira los píxeles.
 * Orden: propiedad → esquema/lámina/SVG → estudio por imagen → histología → foto.
 */
export function imageKind({ impliedKind, categories = [], mime = '', file = '' }) {
  if (impliedKind) return impliedKind;
  const haystack = [...categories, file].join(' | ');
  // `diagram` = ilustración, esquema, dibujo, modelo o animación (todo lo que NO es fotografía).
  if (mime === 'image/svg+xml' || mime === 'image/gif' || DIAGRAM.test(haystack)) return 'diagram';
  if (IMAGING.test(haystack)) return 'imaging';
  if (HISTOLOGY.test(haystack)) return 'histology';
  return 'photo';
}

/**
 * Construye la imagen del contrato §12.3 o devuelve `{ rejected: motivo }`.
 * @param {object} info   entrada de `parseCommonsResponse`
 * @param {object} ctx    { termName, impliedKind, retrievedAt }
 */
export function toImage(info, { termName, impliedKind = null, retrievedAt }) {
  if (!info) return { rejected: 'commons-sin-metadatos' };
  const family = licenseFamily(info.licenseShortName);
  if (!family) return { rejected: `licencia-no-permitida:${info.licenseShortName ?? 'ausente'}` };
  if (!isAllowedImageHost(info.url)) return { rejected: `host-fuera-de-csp:${info.url}` };
  const thumbUrl = isAllowedImageHost(info.thumbUrl) ? info.thumbUrl : null;
  if (!thumbUrl) return { rejected: `miniatura-fuera-de-csp:${info.thumbUrl}` };
  if (!info.sourcePage) return { rejected: 'sin-pagina-de-origen' };
  // Commons advierte derechos de la personalidad o marcas registradas: no se publica.
  if (/personality|trademark/i.test(info.restrictions ?? '')) return { rejected: `restriccion-de-uso:${info.restrictions}` };
  const author = info.artist ?? info.credit ?? null;
  const needsAttribution = family === 'cc by' || family === 'cc by-sa';
  if (needsAttribution && !author) return { rejected: 'cc-sin-autor' };
  if (family !== 'public domain' && !info.licenseUrl) return { rejected: 'sin-url-de-licencia' };
  const caption = info.description && info.description.length <= MAX_CAPTION_LENGTH ? info.description : null;
  return {
    image: {
      url: info.url,
      thumbUrl,
      kind: imageKind({ impliedKind, categories: info.categories, mime: info.mime ?? '', file: info.file }),
      caption,
      altText: caption ?? `Imagen de ${termName}`,
      altTextQuality: caption ? 'caption' : 'generic',
      author: author ? author.slice(0, 300) : null,
      license: info.licenseShortName,
      licenseUrl: info.licenseUrl ?? null,
      sourcePage: info.sourcePage,
      retrievedAt,
    },
  };
}
