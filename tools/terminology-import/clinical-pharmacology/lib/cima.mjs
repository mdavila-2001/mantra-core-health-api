// =============================================================================
// CIMA (AEMPS) → documentos de referencia y secciones de ficha técnica.
// Funciones puras: reciben JSON ya descargado. El transporte vive en
// `fetch-cima.mjs`.
//
// Unidad de agrupación: ATC nivel 5 (el ancla del catálogo de productos y del
// code system `vademecum`). Dentro de un ATC, una ficha de referencia por
// principio activo (VTM de CIMA) y combinación de vías de administración:
// la posología de un inyectable no es la de un comprimido, y elegir una sola
// ficha por ATC perdería la otra. Con `granularity: 'product'` se toman todas
// las fichas segmentadas (pasada exhaustiva).
// =============================================================================

import { CIMA_LICENSE, CIMA_REST, cimaDetailPageUrl, pickReferenceProduct, toProduct } from '../../lib/glossary-es/cima.mjs';
import { parseRevisionDate } from '../../encyclopedia/s3-farmacos/lib/revision-date.mjs';
import { literalFromHtml } from './literal.mjs';
import { CIMA_SECTIONS } from './sections.mjs';

export { CIMA_LICENSE, CIMA_REST, toProduct };

export const CIMA_SOURCE = 'aemps-cima';
export const CIMA_SOURCE_NAME = 'CIMA — Centro de Información online de Medicamentos de la AEMPS (España)';

/** Ficha técnica completa, todas las secciones en un pedido (tipo de documento 1). */
export const fullDocUrl = (nregistro) => `${CIMA_REST}/docSegmentado/contenido/1?nregistro=${encodeURIComponent(nregistro)}`;
/** Una sección (respaldo si el documento completo no trae alguna). */
export const sectionApiUrl = (nregistro, section) => `${fullDocUrl(nregistro)}&seccion=${encodeURIComponent(section)}`;
/** Enlace público a la sección (HTML), el que se cita al lector. */
export const sectionPublicUrl = (nregistro, section) =>
  `https://cima.aemps.es/cima/dochtml/ft/${encodeURIComponent(nregistro)}/${encodeURIComponent(section)}/FichaTecnica.html`;
/** Notas de seguridad de la AEMPS asociadas a un medicamento. */
export const safetyNotesUrl = (nregistro) => `${CIMA_REST}/notas/${encodeURIComponent(nregistro)}`;
/**
 * Maestra de códigos ATC de CIMA (nombres en castellano de la AEMPS), paginada.
 * Observado el 2026-10-24: sin el parámetro `codigo` la API responde vacío; con
 * cualquier valor devuelve la maestra completa (7 358 códigos), sin filtrar.
 */
export const atcMasterUrl = (page) => `${CIMA_REST}/maestras?maestra=7&codigo=A&pagina=${page}`;

const ATC5 = /^[A-Z]\d{2}[A-Z]{2}\d{2}$/;
export const isAtc5 = (code) => typeof code === 'string' && ATC5.test(code);

/** Código ATC → nivel por su forma oficial (1: A, 2: A01, 3: A01A, 4: A01AA, 5: A01AA01). */
export function atcLevel(code) {
  if (/^[A-Z]$/.test(code)) return 1;
  if (/^[A-Z]\d{2}$/.test(code)) return 2;
  if (/^[A-Z]\d{2}[A-Z]$/.test(code)) return 3;
  if (/^[A-Z]\d{2}[A-Z]{2}$/.test(code)) return 4;
  if (ATC5.test(code)) return 5;
  return null;
}

/** Códigos de los cinco niveles de un ATC 5 (estructura del propio código, no inferencia). */
export const atcAncestors = (code5) => [code5.slice(0, 1), code5.slice(0, 3), code5.slice(0, 4), code5.slice(0, 5), code5];

/** Productos (listado + detalle) → Map ATC5 → productos. Devuelve también los que no traen ATC 5. */
export function groupByAtc5(products) {
  const byAtc = new Map();
  const withoutAtc5 = [];
  for (const p of products) {
    const codes = [...new Set(p.atc.filter((a) => isAtc5(a.code)).map((a) => a.code))];
    if (codes.length === 0) {
      withoutAtc5.push(p);
      continue;
    }
    for (const c of codes) {
      if (!byAtc.has(c)) byAtc.set(c, []);
      byAtc.get(c).push(p);
    }
  }
  return { byAtc, withoutAtc5 };
}

const routesKey = (p) => [...new Set(p.routes)].sort((a, b) => a.localeCompare(b, 'es')).join(' | ') || '(sin vía declarada)';

/**
 * Fichas de referencia de un ATC 5. Criterio determinista y documentado:
 * se agrupa por (VTM, vías); en cada grupo, `pickReferenceProduct` (ficha
 * segmentada, comercializado primero, nº de registro más bajo).
 * @param {object[]} products  salida de `toProduct` (con `vtm` agregado)
 * @param {'route'|'product'} granularity
 */
export function referenceDocuments(products, granularity = 'route') {
  if (granularity === 'product') {
    return products
      .filter((p) => p.fichaTecnicaSegmented)
      .sort((a, b) => String(a.nregistro).localeCompare(String(b.nregistro)))
      .map((p) => ({ product: p, criterion: 'todas las fichas técnicas segmentadas (pasada exhaustiva)', group: { vtm: p.vtm, routes: routesKey(p) } }));
  }
  const groups = new Map();
  for (const p of products) {
    const key = `${p.vtm?.id ?? 'sin-vtm'}\u0000${routesKey(p)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }
  const out = [];
  for (const members of groups.values()) {
    const ref = pickReferenceProduct(members);
    if (!ref) continue;
    out.push({
      product: ref,
      criterion:
        'Ficha de referencia por (principio activo VTM, vías de administración): entre los medicamentos con ficha técnica segmentada, ' +
        'primero los comercializados y, a igualdad, el de número de registro más bajo.',
      group: { vtm: ref.vtm, routes: routesKey(ref), candidates: members.length },
    });
  }
  return out.sort((a, b) => String(a.product.nregistro).localeCompare(String(b.product.nregistro)));
}

/** Producto de CIMA con su VTM (el `toProduct` del glosario no lo conserva). */
export function cimaProduct(listRow, detail) {
  return { ...toProduct(listRow, detail), vtm: listRow.vtm?.id ? { id: listRow.vtm.id, name: listRow.vtm.nombre } : null };
}

/** Respuesta de `docSegmentado/contenido/1` (arreglo de secciones) → Map número → ítem. */
export function sectionItems(response) {
  const map = new Map();
  if (!Array.isArray(response)) return map;
  for (const item of response) if (item && typeof item.seccion === 'string' && !map.has(item.seccion)) map.set(item.seccion, item);
  return map;
}

/** Números de sección de la lista que faltan en la respuesta del documento completo (se piden de a uno). */
export function missingSections(response) {
  const have = sectionItems(response);
  return Object.keys(CIMA_SECTIONS).filter((s) => !have.has(s));
}

/**
 * Documento completo de CIMA → filas de sección literales con su procedencia.
 * @param {any} response  arreglo `[{ seccion, titulo, contenido, orden }]`
 * @param {{ product: object, criterion: string, group: object }} ref
 * @param {string} retrievedAt
 */
export function cimaSections(response, ref, retrievedAt) {
  const items = sectionItems(response);
  const p = ref.product;
  const revision = parseRevisionDate(response);
  const version = p.fichaTecnicaDate ?? null;
  const out = [];
  for (const [number, key] of Object.entries(CIMA_SECTIONS)) {
    const item = items.get(number);
    if (!item?.contenido) continue;
    const literal = literalFromHtml(item.contenido);
    if (!literal) continue;
    out.push({
      key,
      source: CIMA_SOURCE,
      sourceName: CIMA_SOURCE_NAME,
      language: 'es',
      audience: 'professional',
      document: {
        type: 'ficha-tecnica',
        id: String(p.nregistro),
        title: p.name,
        holder: p.holder ?? null,
        version,
        revisionDateInText: revision?.value ?? null,
        url: p.fichaTecnicaUrl,
        pageUrl: cimaDetailPageUrl(p.nregistro),
      },
      section: { number, title: item.titulo ?? null, url: sectionPublicUrl(p.nregistro, number), apiUrl: sectionApiUrl(p.nregistro, number) },
      ...literal,
      retrievedAt,
      license: CIMA_LICENSE,
      citation:
        `AEMPS. CIMA. Ficha técnica de ${p.name} (nº reg. ${p.nregistro}), sección ${number}` +
        `${item.titulo ? ` «${item.titulo}»` : ''}${version ? `, versión del ${version.slice(0, 10)}` : ''}` +
        `. ${sectionPublicUrl(p.nregistro, number)} (consultado el ${retrievedAt.slice(0, 10)}).`,
      selection: { criterion: ref.criterion, group: ref.group },
    });
  }
  return out;
}

/** Notas de seguridad de CIMA → filas literales (asunto, fecha, enlace). Respuesta desconocida → []. */
export function cimaSafetyNotes(response, product, retrievedAt) {
  const items = Array.isArray(response) ? response : Array.isArray(response?.resultados) ? response.resultados : [];
  return items
    .filter((n) => n && (n.asunto || n.url))
    .map((n) => ({
      source: CIMA_SOURCE,
      language: 'es',
      noteType: n.tipo ?? null,
      number: n.num ?? null,
      reference: n.ref ?? null,
      subject: n.asunto ?? null,
      date: typeof n.fecha === 'number' ? new Date(n.fecha).toISOString() : (n.fecha ?? null),
      url: n.url ?? null,
      document: { type: 'nota-seguridad', productId: String(product.nregistro) },
      retrievedAt,
      license: CIMA_LICENSE,
    }));
}

/** Página de la maestra ATC de CIMA → `[{ code, name, level }]` (sólo códigos con forma ATC válida). */
export function atcMasterRows(page) {
  const rows = Array.isArray(page?.resultados) ? page.resultados : [];
  return rows
    .map((r) => ({ code: r.codigo ?? r.code ?? null, name: r.nombre ?? r.name ?? null }))
    .filter((r) => typeof r.code === 'string' && atcLevel(r.code) !== null && r.name)
    .map((r) => ({ ...r, level: atcLevel(r.code) }));
}

/** Formas farmacéuticas y vías declaradas por los productos de un ATC (valores literales de CIMA). */
export function cimaFormsAndRoutes(products) {
  const map = new Map();
  for (const p of products) {
    const key = `${p.dosageForm ?? ''}\u0000${routesKey(p)}`;
    if (!map.has(key)) map.set(key, { dosageForm: p.dosageForm, dosageFormSimplified: p.dosageFormSimplified, routes: [...new Set(p.routes)].sort(), products: 0, commercialized: 0 });
    const e = map.get(key);
    e.products++;
    if (p.commercialized) e.commercialized++;
  }
  return [...map.values()].sort((a, b) => b.products - a.products || String(a.dosageForm).localeCompare(String(b.dosageForm), 'es'));
}
