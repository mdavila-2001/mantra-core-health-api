// =============================================================================
// Normalización de CIMA (AEMPS) → fila del glosario. Funciones puras: reciben
// las respuestas JSON ya descargadas y devuelven filas. El transporte vive en
// `import-cima.mjs`.
//
// Modelo: UN término de Farmacología clínica por principio activo (VTM, el
// «Virtual Therapeutic Moiety» que CIMA devuelve en `vtm`), con todos los
// medicamentos autorizados que lo contienen como `drugFacts.products`.
// =============================================================================

import { NO_IMAGE, htmlToText, sanitizeHtml } from './common.mjs';
import { atcTags } from './taxonomy.mjs';

export const CIMA_REST = 'https://cima.aemps.es/cima/rest';
export const CIMA_SOURCE = 'aemps-cima';
export const CIMA_SOURCE_NAME = 'CIMA — Centro de Información online de Medicamentos de la AEMPS';
export const CIMA_LICENSE =
  'AEMPS, aviso legal: «Se autoriza la reproducción total o parcial de los contenidos de la web, siempre que se cite expresamente su origen» (con fecha de última actualización del documento). https://www.aemps.gob.es/aviso-legal/';
export const CIMA_IMAGE_LICENSE = 'AEMPS/CIMA — reproducción autorizada citando la fuente';
export const CIMA_IMAGE_LICENSE_URL = 'https://www.aemps.gob.es/aviso-legal/';

/** Secciones de la ficha técnica (tipo de documento 1) que se copian verbatim. */
export const FICHA_SECTIONS = ['4.1', '4.2', '4.3', '4.4', '4.8', '5.1'];

export function cimaDetailPageUrl(nregistro) {
  return `https://cima.aemps.es/cima/publico/detalle.html?nregistro=${encodeURIComponent(nregistro)}`;
}

export function sectionUrl(nregistro, section) {
  return `${CIMA_REST}/docSegmentado/contenido/1?nregistro=${encodeURIComponent(nregistro)}&seccion=${encodeURIComponent(section)}`;
}

function epochToIso(ms) {
  return typeof ms === 'number' && Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

/** Foto CIMA → objeto imagen. La URL completa se obtiene cambiando `/thumbnails/` por `/full/` (verificado 2026-09-30). */
export function cimaPhoto(foto, nregistro, productName) {
  const thumbUrl = foto.url;
  const url = thumbUrl.includes('/thumbnails/') ? thumbUrl.replace('/thumbnails/', '/full/') : thumbUrl;
  const kindLabel = foto.tipo === 'materialas' ? 'envase' : foto.tipo === 'formafarmac' ? 'forma farmacéutica' : foto.tipo;
  return {
    kind: foto.tipo,
    url,
    thumbUrl,
    attribution: `AEMPS · CIMA — ${productName} (nº reg. ${nregistro}), foto de ${kindLabel}`,
    license: CIMA_IMAGE_LICENSE,
    licenseUrl: CIMA_IMAGE_LICENSE_URL,
    sourcePage: cimaDetailPageUrl(nregistro),
    updatedAt: epochToIso(foto.fecha),
  };
}

/** Un medicamento (fila del listado + detalle opcional) → producto de `drugFacts`. */
export function toProduct(listRow, detail) {
  const d = detail ?? {};
  const docs = listRow.docs ?? [];
  const ft = docs.find((x) => x.tipo === 1);
  const pr = docs.find((x) => x.tipo === 2);
  return {
    nregistro: listRow.nregistro,
    name: listRow.nombre,
    holder: listRow.labtitular ?? null,
    dose: listRow.dosis ?? null,
    dosageForm: listRow.formaFarmaceutica?.nombre ?? null,
    dosageFormSimplified: listRow.formaFarmaceuticaSimplificada?.nombre ?? null,
    routes: (listRow.viasAdministracion ?? []).map((v) => v.nombre),
    prescription: listRow.cpresc ?? null,
    generic: listRow.generico ?? null,
    commercialized: listRow.comerc ?? null,
    authorizedAt: epochToIso(listRow.estado?.aut),
    suspendedAt: epochToIso(listRow.estado?.susp),
    revokedAt: epochToIso(listRow.estado?.rev),
    activeIngredients: (d.principiosActivos ?? []).map((p) => ({ name: p.nombre, amount: p.cantidad ?? null, unit: p.unidad ?? null })),
    atc: (d.atcs ?? []).map((a) => ({ code: a.codigo, name: a.nombre, level: a.nivel })),
    fichaTecnicaUrl: ft?.urlHtml ?? ft?.url ?? null,
    fichaTecnicaSegmented: ft?.secc === true,
    fichaTecnicaDate: epochToIso(ft?.fecha),
    prospectoUrl: pr?.urlHtml ?? pr?.url ?? null,
    cimaUrl: cimaDetailPageUrl(listRow.nregistro),
    presentations: (d.presentaciones ?? []).map((p) => ({ cn: p.cn, name: p.nombre, commercialized: p.comerc ?? null })),
    photos: (listRow.fotos ?? []).map((f) => cimaPhoto(f, listRow.nregistro, listRow.nombre)),
  };
}

/**
 * Producto de referencia para copiar la ficha técnica del principio activo.
 * Criterio determinista (documentado en el README): entre los que tienen ficha
 * técnica segmentada, primero los comercializados; a igualdad, el de número de
 * registro más bajo (el autorizado primero). No es un juicio sobre cuál es
 * «mejor»: sólo hace que la elección sea reproducible y auditable.
 */
export function pickReferenceProduct(products) {
  const candidates = products.filter((p) => p.fichaTecnicaSegmented);
  if (candidates.length === 0) return null;
  const num = (n) => (/^\d+$/.test(n) ? Number(n) : Number.MAX_SAFE_INTEGER);
  return [...candidates].sort((a, b) => {
    if (!!b.commercialized - !!a.commercialized !== 0) return !!b.commercialized - !!a.commercialized;
    const d = num(a.nregistro) - num(b.nregistro);
    return d !== 0 ? d : String(a.nregistro).localeCompare(String(b.nregistro));
  })[0];
}

/** Respuesta de `docSegmentado/contenido/1` → sección normalizada (o null si vino vacía). */
export function toSection(sectionCode, response, ref, retrievedAt) {
  const item = Array.isArray(response) ? response.find((s) => s.seccion === sectionCode) ?? response[0] : null;
  if (!item || !item.contenido) return null;
  const text = htmlToText(item.contenido);
  if (!text) return null;
  return {
    section: sectionCode,
    title: item.titulo ?? null,
    html: sanitizeHtml(item.contenido),
    text,
    nregistro: ref.nregistro,
    productName: ref.name,
    sourceUrl: sectionUrl(ref.nregistro, sectionCode),
    documentUrl: ref.fichaTecnicaUrl,
    documentDate: ref.fichaTecnicaDate,
    retrievedAt,
    citation: `AEMPS. CIMA. Ficha técnica de ${ref.name} (nº reg. ${ref.nregistro}), sección ${sectionCode}${item.titulo ? ` «${item.titulo}»` : ''}${ref.fichaTecnicaDate ? `, versión del ${ref.fichaTecnicaDate.slice(0, 10)}` : ''}.`,
  };
}

function uniqSorted(values) {
  return [...new Set(values.filter((v) => v != null && v !== ''))].sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Agrupa productos por VTM y arma la fila del glosario.
 * @param {{id:number,nombre:string}} vtm
 * @param {object[]} products  salida de `toProduct`
 * @param {object[]} sections  salida de `toSection` del producto de referencia
 */
export function toVtmRow(vtm, products, sections, retrievedAt) {
  const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const atcMap = new Map();
  for (const p of sorted) for (const a of p.atc) if (!atcMap.has(a.code)) atcMap.set(a.code, a);
  const atc = [...atcMap.values()].sort((a, b) => a.level - b.level || a.code.localeCompare(b.code));
  const images = sorted.flatMap((p) => p.photos);
  // Imagen principal: la foto de forma farmacéutica del primer producto que la
  // tenga (muestra el medicamento); si no hay, la del envase.
  const main = images.find((i) => i.kind === 'formafarmac') ?? images[0] ?? null;
  const ref = pickReferenceProduct(sorted);
  const indications = sections.find((s) => s.section === '4.1');
  const pharmacodynamics = sections.find((s) => s.section === '5.1');
  const defSection = indications ?? pharmacodynamics ?? null;
  const esName = vtm.nombre.charAt(0).toUpperCase() + vtm.nombre.slice(1);

  return {
    slug: `cima-vtm-${vtm.id}`,
    code: String(vtm.id),
    codeSystem: 'cima-vtm',
    display: esName,
    esName,
    enDisplay: null,
    esSynonyms: [],
    // La «definición» de un principio activo en la ficha es su sección 4.1
    // (indicaciones) del producto de referencia, verbatim y con su cita.
    definition: defSection?.text ?? null,
    definitionHtml: defSection?.html ?? null,
    definitionSource: defSection
      ? { name: defSection.citation, url: defSection.documentUrl ?? defSection.sourceUrl, retrievedAt: defSection.retrievedAt, license: CIMA_LICENSE }
      : null,
    plainSummaryEs: null,
    categoryKey: 'pharmacology',
    tagKeys: atcTags(atc.map((a) => a.code)),
    lang: 'es',
    hierarchy: atc.filter((a) => a.level < 5).map((a) => ({ code: a.code, display: a.name })),
    externalIds: { atc: atc.filter((a) => a.level === 5).map((a) => a.code) },
    relations: [],
    ...NO_IMAGE,
    ...(main
      ? {
          imageUrl: main.url,
          imageThumbUrl: main.thumbUrl,
          imageAttribution: main.attribution,
          imageLicense: main.license,
          imageLicenseUrl: main.licenseUrl,
          imageSourcePage: main.sourcePage,
          imageOrigin: 'cima',
        }
      : {}),
    images,
    drugFacts: {
      vtmId: vtm.id,
      vtmName: vtm.nombre,
      atc,
      routes: uniqSorted(sorted.flatMap((p) => p.routes)),
      dosageForms: uniqSorted(sorted.map((p) => p.dosageForm)),
      productCount: sorted.length,
      referenceProduct: ref ? { nregistro: ref.nregistro, name: ref.name, criterion: 'comercializado primero; luego nº de registro más bajo, entre los que tienen ficha técnica segmentada' } : null,
      products: sorted,
      sections,
    },
    source: CIMA_SOURCE,
    sourceName: CIMA_SOURCE_NAME,
    // El agrupamiento por VTM sale del listado completo (`medicamentos?pagina=N`);
    // CIMA no expone un filtro por VTM, así que la URL es la del listado.
    sourceUrl: `${CIMA_REST}/medicamentos`,
    sourceRetrievedAt: retrievedAt,
    sourceLicense: CIMA_LICENSE,
    reviewStatus: 'external-source',
  };
}
