// =============================================================================
// Monografía de un principio activo (ATC nivel 5): junta, SIN fusionar, lo que
// cada fuente dice de él. Cada sección conserva su documento, su número oficial
// y su cita; dos fuentes con la misma clave son dos filas distintas.
//
// Nombres de los niveles ATC: los publica la AEMPS en castellano (detalle de
// cada medicamento y maestra ATC de CIMA). Lo que ninguna fuente nombra queda
// con `name: null` (el código de los niveles 1–4 sale de la estructura del
// propio código ATC, no de una inferencia).
// =============================================================================

import { atcAncestors, atcLevel, cimaFormsAndRoutes } from './cima.mjs';
import { requiredCoverage } from './sections.mjs';

/**
 * Nombres ATC por código, con su fuente. Prioridad: maestra ATC de CIMA, luego
 * el detalle de los medicamentos de CIMA (primer nombre en orden de nº de
 * registro). Las variantes que difieran se conservan para auditoría.
 */
export function atcNameIndex({ master = [], products = [] }) {
  const names = new Map();
  const add = (code, name, source) => {
    if (!code || !name || atcLevel(code) === null) return;
    const e = names.get(code);
    if (!e) names.set(code, { code, level: atcLevel(code), name, nameSource: source, variants: [] });
    else if (e.name !== name && !e.variants.some((v) => v.name === name)) e.variants.push({ name, source });
  };
  for (const r of master) add(r.code, r.name, 'aemps-cima:maestra-atc');
  const sorted = [...products].sort((a, b) => String(a.nregistro).localeCompare(String(b.nregistro)));
  for (const p of sorted) for (const a of p.atc) add(a.code, a.name, `aemps-cima:medicamento:${p.nregistro}`);
  return names;
}

/** Ruta ATC completa (5 niveles) con el nombre que haya y su fuente. */
export function atcPath(code5, names) {
  return atcAncestors(code5).map((code) => {
    const e = names.get(code);
    return { level: atcLevel(code), code, name: e?.name ?? null, nameSource: e?.nameSource ?? null };
  });
}

/**
 * @param {object} input
 * @param {string} input.code                 ATC 5
 * @param {Map}    input.names                de `atcNameIndex`
 * @param {object[]} [input.cimaProducts]     productos de CIMA de este ATC
 * @param {object[]} [input.sections]         filas de `cimaSections` / `openFdaSections`
 * @param {object[]} [input.safetyNotes]
 * @param {object|null} [input.rxnorm]        de `atcBridge`
 * @param {object[]} [input.fdaPharmClasses]
 * @param {{display:string,source:string}|null} [input.fallbackName]  nombre oficial alternativo (LINAME) si CIMA no lo nombra
 */
export function buildMonograph({ code, names, cimaProducts = [], sections = [], safetyNotes = [], rxnorm = null, fdaPharmClasses = [], fallbackName = null }) {
  const path = atcPath(code, names);
  const own = path[4];
  const display = own.name ?? fallbackName?.display ?? null;
  const displaySource = own.name ? own.nameSource : (fallbackName?.source ?? null);
  const vtms = new Map();
  for (const p of cimaProducts) if (p.vtm) vtms.set(p.vtm.id, p.vtm);
  const bySource = {};
  for (const s of sections) {
    bySource[s.source] ??= new Set();
    bySource[s.source].add(s.key);
  }
  const sortedSections = [...sections].sort(
    (a, b) =>
      a.source.localeCompare(b.source) ||
      String(a.document.id).localeCompare(String(b.document.id)) ||
      String(a.section.number).localeCompare(String(b.section.number), 'en', { numeric: true }),
  );
  return {
    code,
    display,
    displaySource,
    atcPath: path,
    nameVariants: names.get(code)?.variants ?? [],
    cima: cimaProducts.length
      ? {
          substances: [...vtms.values()].sort((a, b) => a.id - b.id),
          products: cimaProducts.length,
          commercialized: cimaProducts.filter((p) => p.commercialized).length,
          formsAndRoutes: cimaFormsAndRoutes(cimaProducts),
        }
      : null,
    rxnorm,
    sections: sortedSections,
    safetyNotes,
    fdaPharmClasses,
    coverage: Object.fromEntries(Object.entries(bySource).map(([src, keys]) => [src, requiredCoverage(keys)])),
  };
}

/** Controla el invariante de procedencia de cada sección; lanza con el motivo. */
export function assertSection(s) {
  const need = ['key', 'source', 'language', 'text', 'textSha256', 'retrievedAt', 'license', 'citation'];
  for (const k of need) if (s[k] == null || s[k] === '') throw new Error(`Sección sin «${k}»: ${s.source}/${s.document?.id}/${s.section?.number}`);
  if (!s.document?.id || !s.document?.url) throw new Error(`Sección sin documento: ${s.source}/${s.section?.number}`);
  if (!s.section?.number) throw new Error(`Sección sin número oficial: ${s.source}/${s.document.id}`);
  if (!hasVersion(s)) throw new Error(`Sección sin versión ni fecha del documento: ${s.source}/${s.document.id}/${s.section.number}`);
  return s;
}

/** Versión y fecha son parte de la cita: sin ninguna de las dos la sección no se publica (se cuenta como hueco). */
export const hasVersion = (s) => Boolean(s.document?.version || s.document?.revisionDateInText || s.document?.effectiveDate);
