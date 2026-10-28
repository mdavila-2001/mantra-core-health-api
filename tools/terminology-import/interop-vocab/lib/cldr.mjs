// =============================================================================
// CLDR (Unicode, licencia Unicode-3.0): códigos y nombres en inglés y español de territorios, idiomas, escrituras,
// variantes y monedas, leídos de los paquetes JSON oficiales de npm (cldr-core, cldr-localenames-full,
// cldr-numbers-full). Los identificadores son los de ISO 3166-1 / UN M.49, ISO 639, ISO 15924 e ISO 4217;
// el texto de esas normas NO forma parte de CLDR y no se carga. Nombres verbatim: lo que CLDR no traduce
// (hay menos nombres en español que en inglés) queda sin designación en español; no se rellena.
// =============================================================================

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (dir, rel) => {
  const buf = readFileSync(join(dir, 'package', rel));
  return { json: JSON.parse(buf.toString('utf8')), file: `package/${rel}`, sha256: createHash('sha256').update(buf).digest('hex') };
};

/** `XX-alt-short` → { base: 'XX', alt: 'short' }; sin `-alt-` → alt null. */
const splitAlt = (k) => {
  const m = /^(.*?)-alt-(.+)$/.exec(k);
  return m ? { base: m[1], alt: m[2] } : { base: k, alt: null };
};

/** Mapa de nombres de una configuración regional: { principal: {código→texto}, alternos: {código→[{alt, value}]} }. */
function names(dir, locale, kind) {
  const { json, file, sha256 } = read(dir, `main/${locale}/${kind}.json`);
  const d = json.main[locale].localeDisplayNames[kind];
  const main = {};
  const alt = {};
  for (const [k, v] of Object.entries(d)) {
    const { base, alt: a } = splitAlt(k);
    if (a === null) main[base] = v;
    else (alt[base] ??= []).push({ alt: a, language: locale, value: v });
  }
  return { main, alt, files: [{ file, sha256 }] };
}

const preferred = { system: 'http://terminology.hl7.org/CodeSystem/hl7TermMaintInfra', code: 'preferredForLanguage' };
const designationsOf = (en, es) => [
  ...(en ? [{ language: 'en', use: preferred, value: en }] : []),
  ...(es ? [{ language: 'es', use: preferred, value: es }] : []),
];
const sortedCodes = (...maps) => [...new Set(maps.flatMap((m) => Object.keys(m)))].sort();

/**
 * @param {{ core: string, localenames: string, numbers: string }} dirs carpetas extraídas (raw/x/<clave>/)
 * @returns {{ kind: string, label: string, concepts: object[], files: Array<{file: string, sha256: string}>, notes: object }[]}
 */
export function parseCldr(dirs) {
  const codeMappings = read(dirs.core, 'supplemental/codeMappings.json');
  const containment = read(dirs.core, 'supplemental/territoryContainment.json');
  const currencyData = read(dirs.core, 'supplemental/currencyData.json');
  const mappings = codeMappings.json.supplemental.codeMappings;
  const tc = containment.json.supplemental.territoryContainment;
  const cd = currencyData.json.supplemental.currencyData;
  const out = [];

  // --- Territorios ------------------------------------------------------------------------------------
  {
    const en = names(dirs.localenames, 'en', 'territories');
    const es = names(dirs.localenames, 'es', 'territories');
    const codes = sortedCodes(en.main, es.main);
    const containers = new Map(); // hijo → [{ container, status }]
    for (const [key, v] of Object.entries(tc)) {
      const m = /^(.*?)(?:-status-(.+))?$/.exec(key);
      for (const child of v._contains ?? []) (containers.get(child) ?? containers.set(child, []).get(child)).push({ container: m[1], status: m[2] ?? null, ...(v._grouping ? { grouping: v._grouping } : {}) });
    }
    const noName = Object.keys(mappings).filter((k) => /^[A-Z]{2}$/.test(k) && !codes.includes(k));
    const concepts = codes.map((code) => {
      const map = mappings[code] ?? {};
      const own = tc[code];
      // part-of sólo con contenedores geográficos de estado normal; los agrupamientos (UN, EU, EZ) y los obsoletos quedan en cldr_containers
      const parents = (containers.get(code) ?? []).filter((c) => c.status === null && !c.grouping).map((c) => c.container);
      const alt = [...(en.alt[code] ?? []), ...(es.alt[code] ?? [])];
      return {
        code,
        display: en.main[code] ?? es.main[code],
        selectable: true,
        state: 'active',
        properties: {
          cldr_kind: /^\d{3}$/.test(code) ? 'm49-area' : 'region',
          ...(map._alpha3 ? { cldr_alpha3: map._alpha3 } : {}),
          ...(map._numeric ? { cldr_numeric: map._numeric } : {}),
          ...(map._fips10 ? { cldr_fips10: map._fips10 } : {}),
          ...(map._internet ? { cldr_internet: map._internet } : {}),
          ...(own?._grouping ? { cldr_grouping: own._grouping } : {}),
          ...(containers.has(code) ? { cldr_containers: containers.get(code) } : {}),
          ...(cd.region[code] ? { cldr_currencies: cd.region[code] } : {}),
          ...(alt.length ? { cldr_alt_names: alt } : {}),
        },
        designations: designationsOf(en.main[code], es.main[code]),
        parents,
      };
    });
    out.push({ kind: 'territory', label: 'territorios (ISO 3166-1 alfa-2 y áreas UN M.49)', concepts, files: [...en.files, ...es.files, { file: codeMappings.file, sha256: codeMappings.sha256 }, { file: containment.file, sha256: containment.sha256 }, { file: currencyData.file, sha256: currencyData.sha256 }], notes: { codeMappingsWithoutName: noName.length, codeMappingsWithoutNameCodes: noName } });
  }

  // --- Idiomas, escrituras, variantes --------------------------------------------------------------------
  for (const [kind, file, label] of [['language', 'languages', 'idiomas (ISO 639)'], ['script', 'scripts', 'escrituras (ISO 15924)'], ['variant', 'variants', 'variantes']]) {
    const en = names(dirs.localenames, 'en', file);
    const es = names(dirs.localenames, 'es', file);
    const concepts = sortedCodes(en.main, es.main).map((code) => {
      const alt = [...(en.alt[code] ?? []), ...(es.alt[code] ?? [])];
      return { code, display: en.main[code] ?? es.main[code], selectable: true, state: 'active', properties: alt.length ? { cldr_alt_names: alt } : {}, designations: designationsOf(en.main[code], es.main[code]), parents: [] };
    });
    out.push({ kind, label, concepts, files: [...en.files, ...es.files], notes: {} });
  }

  // --- Monedas ------------------------------------------------------------------------------------------------------
  {
    const rd = (locale) => {
      const { json, file, sha256 } = read(dirs.numbers, `main/${locale}/currencies.json`);
      return { cur: json.main[locale].numbers.currencies, files: [{ file, sha256 }] };
    };
    const en = rd('en');
    const es = rd('es');
    const fractions = cd.fractions;
    const codes = sortedCodes(en.cur, es.cur);
    const concepts = codes.map((code) => {
      const e = en.cur[code] ?? {};
      const s = es.cur[code] ?? {};
      const map = mappings[code] ?? {};
      return {
        code,
        display: e.displayName ?? s.displayName,
        selectable: true,
        state: 'active',
        properties: {
          ...(map._numeric ? { cldr_numeric: map._numeric } : {}),
          ...(fractions[code] ? { cldr_digits: fractions[code]._digits, cldr_rounding: fractions[code]._rounding, ...(fractions[code]._cashDigits ? { cldr_cash_digits: fractions[code]._cashDigits } : {}) } : {}),
          ...(Object.keys(e).length ? { cldr_names_en: e } : {}),
          ...(Object.keys(s).length ? { cldr_names_es: s } : {}),
        },
        designations: designationsOf(e.displayName, s.displayName),
        parents: [],
      };
    });
    const noName = Object.keys(mappings).filter((k) => /^[A-Z]{3}$/.test(k) && !codes.includes(k));
    out.push({ kind: 'currency', label: 'monedas (ISO 4217)', concepts, files: [...en.files, ...es.files, { file: codeMappings.file, sha256: codeMappings.sha256 }, { file: currencyData.file, sha256: currencyData.sha256 }], notes: { codeMappingsWithoutName: noName.length, codeMappingsWithoutNameCodes: noName } });
  }
  return out;
}
