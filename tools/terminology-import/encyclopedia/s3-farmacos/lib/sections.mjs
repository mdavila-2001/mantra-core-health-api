// =============================================================================
// Secciones de la ficha técnica de CIMA que este corte puede pedir, leer y
// publicar. La LISTA BLANCA es la defensa contra la posología: la sección 4.2
// (y cualquier otra que no esté acá) no se descarga, no se lee de la caché y no
// se guarda. Se compara por igualdad exacta del número oficial.
// =============================================================================

export const CIMA_REST = 'https://cima.aemps.es/cima/rest';

/**
 * número oficial de la ficha técnica → `kind` del catálogo cerrado de §12.3.
 *
 * 4.4 (advertencias y precauciones) NO tiene un `kind` propio en el catálogo de
 * fármacos. Se publica como `special_populations`, el más cercano, con el título
 * oficial en `locator`. Es una decisión pendiente de la ficha (ver GAPS.md).
 */
export const SECTION_KINDS = Object.freeze({
  '4.1': 'indications',
  '4.3': 'contraindications',
  '4.4': 'special_populations',
  '4.5': 'interactions',
  '4.6': 'pregnancy_lactation',
  '4.8': 'adverse_effects',
  '5.1': 'pharmacologic_class',
});

export const ALLOWED_SECTIONS = Object.freeze(Object.keys(SECTION_KINDS));

/** Orden de aparición en el artículo. */
export const SECTION_ORDER = Object.freeze(['4.1', '4.3', '4.4', '4.5', '4.6', '4.8', '5.1']);

export class ForbiddenSectionError extends Error {
  constructor(code) {
    super(`Sección «${code}» fuera de la lista blanca de S3 (la posología 4.2 y cualquier otra no autorizada nunca se piden, leen ni guardan).`);
    this.name = 'ForbiddenSectionError';
  }
}

/** Lanza si el número de sección no está en la lista blanca. Único punto de paso para URLs y rutas de caché. */
export function assertAllowedSection(code) {
  if (typeof code !== 'string' || !ALLOWED_SECTIONS.includes(code)) throw new ForbiddenSectionError(String(code));
  return code;
}

/** URL del endpoint oficial `docSegmentado/contenido/1` para UNA sección (nunca sin `seccion`, que devolvería todas). */
export function sectionUrl(nregistro, code) {
  assertAllowedSection(code);
  return `${CIMA_REST}/docSegmentado/contenido/1?nregistro=${encodeURIComponent(nregistro)}&seccion=${encodeURIComponent(code)}`;
}

/** Enlace público a la ficha por sección (HTML), el que se muestra al lector y se usa en las muestras. */
export function sectionPublicUrl(nregistro, code) {
  assertAllowedSection(code);
  return `https://cima.aemps.es/cima/dochtml/ft/${encodeURIComponent(nregistro)}/${encodeURIComponent(code)}/FichaTecnica.html`;
}

/**
 * Sección 10 («Fecha de la revisión del texto»): se pide SOLO para leer la fecha de la
 * ficha cuando la API de CIMA no la trae. No es una sección publicable (no está en
 * `ALLOWED_SECTIONS`) y su texto no se guarda en ningún artículo.
 */
export const REVISION_DATE_SECTION = '10';

export function revisionDateUrl(nregistro) {
  return `${CIMA_REST}/docSegmentado/contenido/1?nregistro=${encodeURIComponent(nregistro)}&seccion=${REVISION_DATE_SECTION}`;
}
