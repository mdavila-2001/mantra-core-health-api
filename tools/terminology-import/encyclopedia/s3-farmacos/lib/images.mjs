// =============================================================================
// Imágenes del artículo (§12.2.7 de la ficha): solo licencia verificable en los
// metadatos de origen y solo hosts que la CSP del front ya admite.
//
//   Licencias admitidas : dominio público, CC0, CC BY, CC BY-SA.
//   Licencias rechazadas: NC, ND, sin licencia, «No restrictions» (no es una
//                         licencia identificable), GFDL y cualquier otra.
//   Hosts admitidos     : upload.wikimedia.org, thumb.wikimedia.org, cima.aemps.es
//                         (`img-src` de mantra-core-health/src/server/security-headers.ts).
// =============================================================================

export const ALLOWED_IMAGE_HOSTS = Object.freeze(['upload.wikimedia.org', 'thumb.wikimedia.org', 'cima.aemps.es']);

export const CIMA_IMAGE_LICENSE = 'AEMPS/CIMA — reproducción autorizada citando la fuente';
export const CIMA_IMAGE_LICENSE_URL = 'https://www.aemps.gob.es/aviso-legal/';

/** URL → host si es https y está en la lista; `null` si no. */
export function allowedHost(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && ALLOWED_IMAGE_HOSTS.includes(u.hostname) ? u.hostname : null;
  } catch {
    return null;
  }
}

const NC_ND = /(?:^|[\s\-_/])(nc|nd)(?:[\s\-_/.\d]|$)/i;

/**
 * Cadena de licencia de Commons → `{ ok, family }` o `{ ok:false, reason }`.
 * Es una lista cerrada: lo que no se reconoce se rechaza.
 */
export function classifyImageLicense(raw) {
  const s = String(raw ?? '').trim();
  if (s === '') return { ok: false, reason: 'no-license' };
  if (NC_ND.test(s)) return { ok: false, reason: 'nc-nd' };
  if (/^public domain\b/i.test(s) || /^pd[\s\-_]/i.test(s)) return { ok: true, family: 'public-domain' };
  if (/^cc0\b/i.test(s) || /^cc[\s-]?zero\b/i.test(s)) return { ok: true, family: 'cc0' };
  if (/^cc[\s-]by[\s-]sa\b/i.test(s)) return { ok: true, family: 'cc-by-sa' };
  if (/^cc[\s-]by\b/i.test(s)) return { ok: true, family: 'cc-by' };
  return { ok: false, reason: 'license-not-recognized' };
}

/** URL de la licencia: si Commons no la trae se arma solo para CC con versión explícita. */
export function licenseUrlFor(license, given) {
  if (given) return given;
  const m = /^cc[\s-]by(?:[\s-]sa)?[\s-](\d\.\d)/i.exec(license ?? '');
  if (!m) return /^cc0/i.test(license ?? '') ? 'https://creativecommons.org/publicdomain/zero/1.0/' : null;
  const sa = /sa/i.test(license) ? '-sa' : '';
  return `https://creativecommons.org/licenses/by${sa}/${m[1]}/`;
}

const PHOTO_KIND_LABEL = { materialas: 'envase', formafarmac: 'forma farmacéutica' };

/**
 * Foto de CIMA → imagen del artículo. CIMA no entrega pie de foto, así que el
 * `altText` es el genérico «Imagen de {término}» (`altTextQuality: "generic"`) y el
 * `caption` solo repite campos de los metadatos (tipo de foto y nº de registro),
 * sin nombre comercial (los nombres de CIMA llevan la concentración).
 */
export function cimaPhotoToImage(photo, { termName, nregistro, cimaUrl, retrievedAt }) {
  return {
    url: photo.url,
    thumbUrl: photo.thumbUrl,
    kind: 'photo',
    caption: `Foto de ${PHOTO_KIND_LABEL[photo.kind] ?? photo.kind} del medicamento con nº de registro ${nregistro}`,
    altText: `Imagen de ${termName}`,
    altTextQuality: 'generic',
    author: 'AEMPS · CIMA',
    license: CIMA_IMAGE_LICENSE,
    licenseUrl: CIMA_IMAGE_LICENSE_URL,
    licenseStatus: 'general-authorization',
    sourcePage: cimaUrl,
    retrievedAt,
  };
}

/** Fila de `wikidata-images.ndjson` → imagen del artículo (o `null` + motivo). */
export function commonsRowToImage(row, { termName, retrievedAt }) {
  const lic = classifyImageLicense(row.imageLicense);
  if (!lic.ok) return { image: null, reason: `license:${lic.reason}` };
  if (!allowedHost(row.imageUrl) || !allowedHost(row.imageThumbUrl)) return { image: null, reason: 'host-not-in-csp' };
  // CC BY / CC BY-SA obligan a atribuir: sin autor en los metadatos no se publica. Dominio público y CC0 no lo exigen.
  const author = (row.imageAuthor ?? '').trim();
  if (!author && (lic.family === 'cc-by' || lic.family === 'cc-by-sa')) return { image: null, reason: 'attribution-required-author-missing' };
  const clean = (u) => u.replace(/\?utm_source=commons\.wikimedia\.org.*$/, '');
  return {
    image: {
      url: clean(row.imageUrl),
      thumbUrl: clean(row.imageThumbUrl),
      kind: row.imageProperty === 'P117' ? 'chemical_structure' : 'photo',
      caption: null,
      altText: `Imagen de ${termName}`,
      altTextQuality: 'generic',
      author: author || 'Autor no indicado en Commons',
      license: row.imageLicense,
      licenseUrl: licenseUrlFor(row.imageLicense, row.imageLicenseUrl),
      licenseFamily: lic.family,
      sourcePage: row.imageSourcePage,
      retrievedAt,
    },
    reason: null,
  };
}
