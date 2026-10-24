// =============================================================================
// Puente ATC ↔ UNII por código, desde el FDA Global Substance Registration
// System (GSRS), publicado por openFDA (`/other/substance`, dominio público).
// Cada sustancia trae su UNII, sus códigos (`WHO-ATC`, `RXCUI`, …) y sus
// relaciones (`ACTIVE MOIETY`: la sal apunta a su fracción activa).
//
// Se usan SÓLO identificadores: UNII, códigos WHO-ATC, RxCUI y la relación de
// fracción activa. Los `comments` de los códigos WHO-ATC traen los nombres de
// la jerarquía ATC de la OMS: no se copian (el índice ATC/DDD no se
// redistribuye para uso comercial; ver SOURCES.md).
//
// Regla de enlace etiqueta → ATC 5 (determinista, sólo códigos):
//   M  = fracciones activas de los UNII de la etiqueta
//   C  = ATC 5 que listan TODAS las fracciones de M y cuyas sustancias
//        (por fracción) están todas en M   → excluye combinaciones con otros
//        principios (p. ej. paracetamol solo ↛ tramadol + paracetamol)
//   |C| = 1                         → enlace (`unique`)
//   |M| = 1 y en C hay exactamente un código con número < 50 y el resto ≥ 50
//                                    → ese (`who-atc-50-series`: en la ATC de la
//                                      OMS las series 50 y 70 son combinaciones)
//   otro caso                        → sin enlace (`ambiguous` / `none`), se cuenta
// =============================================================================

import { isAtc5 } from './cima.mjs';

export const GSRS_SOURCE = 'fda-gsrs';
export const GSRS_LICENSE =
  'FDA Global Substance Registration System vía openFDA (/other/substance): dominio público / CC0 1.0 (https://open.fda.gov/license/). ' +
  'Sólo se usan identificadores (UNII, WHO-ATC, RXCUI, fracción activa); no se copian nombres ATC de la OMS.';

const UNII = /^[A-Z0-9]{10}$/;

/** Registro GSRS → `{ unii, moiety, atc[], rxcui[], name, substanceClass }` o null sin UNII. */
export function gsrsEntry(r) {
  const codes = Array.isArray(r?.codes) ? r.codes : [];
  const unii = (typeof r?.unii === 'string' && UNII.test(r.unii) ? r.unii : null) ?? codes.find((c) => c?.code_system === 'FDA UNII' && UNII.test(c.code ?? ''))?.code ?? null;
  if (!unii) return null;
  const moietyRel = (r.relationships ?? []).find((x) => x?.type === 'ACTIVE MOIETY' && UNII.test(x?.related_substance?.unii ?? ''));
  const display = (r.names ?? []).find((n) => n?.display_name === true || n?.display_name === 'true')?.name ?? null;
  return {
    unii,
    moiety: moietyRel?.related_substance?.unii ?? unii,
    atc: [...new Set(codes.filter((c) => c?.code_system === 'WHO-ATC' && isAtc5(c.code)).map((c) => c.code))].sort(),
    rxcui: [...new Set(codes.filter((c) => c?.code_system === 'RXCUI' && /^\d+$/.test(c.code ?? '')).map((c) => c.code))].sort(),
    name: display,
    substanceClass: r.substance_class ?? null,
  };
}

/** Índice: UNII → entrada, fracción → códigos ATC, ATC → fracciones que lo listan. */
export function buildGsrsIndex(entries) {
  const byUnii = new Map();
  for (const e of entries) if (e && !byUnii.has(e.unii)) byUnii.set(e.unii, e);
  const atcByMoiety = new Map();
  const moietiesByAtc = new Map();
  for (const e of byUnii.values()) {
    for (const code of e.atc) {
      if (!atcByMoiety.has(e.moiety)) atcByMoiety.set(e.moiety, new Set());
      atcByMoiety.get(e.moiety).add(code);
      if (!moietiesByAtc.has(code)) moietiesByAtc.set(code, new Set());
      moietiesByAtc.get(code).add(e.moiety);
    }
  }
  return { byUnii, atcByMoiety, moietiesByAtc };
}

const serial = (code) => Number(code.slice(5, 7));

/**
 * Conjunto de UNII de una etiqueta → `{ status, atc, rule, moieties, candidates }`.
 * `status`: 'linked' | 'ambiguous' | 'none' | 'unknown-unii'.
 */
export function linkUniiSet(uniis, index) {
  if (!uniis.length) return { status: 'none', atc: null, rule: null, moieties: [], candidates: [] };
  const entries = uniis.map((u) => index.byUnii.get(u));
  if (entries.some((e) => !e)) return { status: 'unknown-unii', atc: null, rule: null, moieties: [], candidates: [] };
  const moieties = [...new Set(entries.map((e) => e.moiety))].sort();
  const sets = moieties.map((m) => index.atcByMoiety.get(m) ?? new Set());
  let candidates = [...sets[0]].filter((code) => sets.every((s) => s.has(code)));
  candidates = candidates.filter((code) => [...(index.moietiesByAtc.get(code) ?? [])].every((m) => moieties.includes(m))).sort();
  if (candidates.length === 1) return { status: 'linked', atc: candidates[0], rule: 'unique', moieties, candidates };
  if (candidates.length > 1 && moieties.length === 1) {
    const low = candidates.filter((c) => serial(c) < 50);
    if (low.length === 1 && candidates.every((c) => c === low[0] || serial(c) >= 50)) return { status: 'linked', atc: low[0], rule: 'who-atc-50-series', moieties, candidates };
  }
  return { status: candidates.length ? 'ambiguous' : 'none', atc: null, rule: null, moieties, candidates };
}

/** Nombre de sustancia (FDA, inglés) para un ATC 5 de un solo principio: el de su única fracción activa. */
export function gsrsDisplayFor(code, index) {
  const moieties = [...(index.moietiesByAtc.get(code) ?? [])];
  if (moieties.length !== 1) return null;
  const e = index.byUnii.get(moieties[0]);
  return e?.name ? { display: e.name, source: GSRS_SOURCE, unii: e.unii, language: 'en' } : null;
}

/** Fracciones activas de un conjunto de UNII (el propio UNII si el GSRS no lo conoce), ordenadas y sin repetir. */
export function moietiesOf(uniis, index) {
  return [...new Set(uniis.map((u) => index?.byUnii.get(u)?.moiety ?? u))].sort();
}

/**
 * Puentes RxNav completos → Map(fracciones activas → ATC 5 que RxNav asigna a
 * ese conjunto). Un conjunto con más de un ATC 5 queda con todos: no decide.
 */
export function rxnavIndex(bridges, index) {
  const out = new Map();
  for (const b of bridges) {
    if (!b?.complete) continue;
    const key = moietiesOf(b.unii, index).join('+');
    if (!out.has(key)) out.set(key, new Set());
    out.get(key).add(b.atc);
  }
  return new Map([...out.entries()].map(([k, v]) => [k, [...v].sort()]));
}

/**
 * Decisión final de una etiqueta con dos fuentes de código independientes.
 * @param {ReturnType<typeof linkUniiSet>} g  resultado del GSRS
 * @param {string[]} rx  ATC 5 que RxNav asigna a las mismas fracciones
 * @returns {{ atc: string|null, rule: string }}
 */
export function combineLinks(g, rx) {
  const rxUnique = rx.length === 1 ? rx[0] : null;
  if (g.status === 'linked') {
    if (rx.length === 0) return { atc: g.atc, rule: `gsrs:${g.rule}` };
    if (rx.includes(g.atc)) return { atc: g.atc, rule: `gsrs:${g.rule}+rxnav` };
    return { atc: null, rule: 'conflict:gsrs-vs-rxnav' };
  }
  if (g.status === 'ambiguous') {
    if (rxUnique && g.candidates.includes(rxUnique)) return { atc: rxUnique, rule: 'gsrs-ambiguous+rxnav-unique' };
    return { atc: null, rule: rx.length > 1 ? 'ambiguous:rxnav-multiple' : rxUnique ? 'conflict:rxnav-outside-gsrs-candidates' : 'ambiguous:no-rxnav' };
  }
  if (rxUnique) return { atc: rxUnique, rule: 'rxnav-unique' };
  return { atc: null, rule: rx.length > 1 ? `${g.status}:rxnav-multiple` : `${g.status}:no-rxnav` };
}
