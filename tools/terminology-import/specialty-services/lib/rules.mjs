// =============================================================================
// Reglas de evidencia especialidad → servicio (puras, sin red ni base).
//
// Leen `src/common/seed/data/specialty-services/rules.json`. Hay dos bases de
// evidencia, y ninguna infiere:
//  - `source-section`: la fuente agrupa el servicio bajo un encabezado que
//    nombra la especialidad (arancel por especialidad, grupo FONASA).
//  - `descriptor`: el propio descriptor dice quién presta el servicio
//    («consulta… por especialista en cardiología»).
// Si la fuente nombra una especialidad que el modelo no tiene, la regla
// devuelve `specialty: null` y el caso queda como hueco, nunca reasignado.
// =============================================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CURATED_DIR, norm } from './common.mjs';

export function loadRules(path = join(CURATED_DIR, 'rules.json')) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function loadModelSpecialties(path = join(CURATED_DIR, 'model-specialties.json')) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** Entradas reales de un mapa de reglas (sin las claves `_…` de documentación). */
function entries(map) {
  return Object.entries(map).filter(([k]) => !k.startsWith('_'));
}

/**
 * Compila las reglas una vez. `phraseIndex` está indexado por la forma
 * normalizada para que «Ortopedia y Traumatología» y «ORTOPEDIA Y
 * TRAUMATOLOGÍA» sean la misma clave.
 */
export function compileRules(rules) {
  const phraseIndex = new Map(entries(rules.performer.phrases).map(([phrase, rule]) => [norm(phrase), { phrase, ...rule }]));
  const patterns = Object.fromEntries(
    Object.entries(rules.performer.patterns).map(([source, list]) => [source, list.map((p) => new RegExp(p))]),
  );
  const trailingCut = rules.performer.trailingCut.map((p) => new RegExp(p));
  const headingIndex = new Map(entries(rules.boArancelHeadings).map(([h, rule]) => [h, { section: h, ...rule }]));
  const dentalIndex = new Map(entries(rules.boDentalSections).map(([s, rule]) => [s, { section: s, ...rule }]));
  const fonasaGroups = new Map(entries(rules.fonasaGroups));
  return { rules, phraseIndex, patterns, trailingCut, headingIndex, dentalIndex, fonasaGroups, dentalAll: rules.boDentalSections._all };
}

/**
 * Frases de prestador que el descriptor declara, ya resueltas contra la tabla.
 *
 * Devuelve cada captura con su regla (`specialty` puede ser `null` = hueco) o
 * con `rule: undefined` si la frase no está en la tabla («frase sin regla»: va
 * al reporte para que alguien la decida, no a la base).
 */
export function performerPhrases(compiled, source, display) {
  const text = norm(display);
  const out = [];
  for (const re of compiled.patterns[source] ?? []) {
    const m = text.match(re);
    if (!m) continue;
    let phrase = m[1].replace(/[\s.,;:-]+$/, '').trim();
    let rule = compiled.phraseIndex.get(phrase);
    // Recortes declarados («(1RA CONSULTA)», «ADULTOS»…), uno por vez, hasta
    // dar con una frase de la tabla. Nunca se recorta a ciegas.
    for (let i = 0; rule === undefined && i < compiled.trailingCut.length; i += 1) {
      const cut = phrase.replace(compiled.trailingCut[i], '').trim();
      if (cut !== phrase) {
        phrase = cut;
        rule = compiled.phraseIndex.get(phrase);
        i = -1; // otro recorte puede aplicar sobre el resultado
      }
    }
    out.push({ phrase, rule });
  }
  return out;
}

/** Regla de un grupo FONASA por los dos primeros dígitos del código. */
export function fonasaGroupRule(compiled, code) {
  const group = code.slice(0, 2);
  const rule = compiled.fonasaGroups.get(group);
  return rule ? { group, ...rule } : { group, title: null, specialty: null };
}

export const headingRule = (compiled, heading) => compiled.headingIndex.get(heading);
export const dentalRule = (compiled, section) => compiled.dentalIndex.get(section);

/** Todos los códigos de especialidad que las reglas usan (para validarlos contra el modelo). */
export function referencedSpecialties(rules) {
  const codes = new Set();
  const add = (rule) => rule && typeof rule === 'object' && rule.specialty && codes.add(rule.specialty);
  for (const [, r] of entries(rules.performer.phrases)) add(r);
  for (const [, r] of entries(rules.boArancelHeadings)) add(r);
  for (const [, r] of entries(rules.boDentalSections)) add(r);
  for (const [, r] of entries(rules.fonasaGroups)) add(r);
  codes.add(rules.boDentalSections._all);
  return codes;
}
