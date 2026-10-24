// =============================================================================
// DailyMed (NLM) → secciones literales del SPL (XML HL7 v3) de etiquetas de
// prescripción humanas que openFDA no permite enlazar por código. Funciones
// puras sobre el XML ya descargado.
//
// - Identidad: `setId`, id del documento, `versionNumber`, `effectiveTime`.
// - Principios activos: UNII de los `ingredient` de clase ACTI* (ACTIB/ACTIM/
//   ACTIR); los inactivos (IACT) no cuentan. El enlace al ATC usa el mismo
//   puente por código que openFDA (GSRS + RxNav), nunca el nombre.
// - Secciones: sólo las de PRIMER nivel cuyo código LOINC está mapeado; las
//   subsecciones viajan dentro del texto de su madre (no se duplican).
// =============================================================================

import { extractTables, textSha256 } from './literal.mjs';
import { decodeEntities } from '../../lib/glossary-es/common.mjs';

export const DAILYMED_REST = 'https://dailymed.nlm.nih.gov/dailymed/services/v2';
export const RX_HUMAN_DOCTYPE = '34391-3';
export const DAILYMED_SOURCE = 'nlm-dailymed-spl';
export const DAILYMED_SOURCE_NAME = 'DailyMed (U.S. National Library of Medicine) — Structured Product Labeling';
export const DAILYMED_LICENSE =
  'Etiqueta SPL aprobada por la FDA y publicada por la NLM en DailyMed; texto de dominio público del Gobierno de EE. UU. ' +
  'Políticas del sitio: https://dailymed.nlm.nih.gov/dailymed/app-support-web-policies.cfm';

export const splListUrl = (page) => `${DAILYMED_REST}/spls.json?doctype=${RX_HUMAN_DOCTYPE}&pagesize=100&page=${page}`;
export const splXmlUrl = (setid) => `${DAILYMED_REST}/spls/${encodeURIComponent(setid)}.xml`;
export const dailyMedSetUrl = (setid) => `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${encodeURIComponent(setid)}`;

/** LOINC de sección SPL → clave de sección (igualdad exacta). */
export const SPL_LOINC = Object.freeze({
  '34066-1': 'boxed_warning',
  '34089-3': 'composition',
  '43678-2': 'pharmaceutical_form',
  '34067-9': 'indications',
  '34068-7': 'posology',
  '34070-3': 'contraindications',
  '43685-7': 'warnings',
  '34071-1': 'warnings',
  '42232-9': 'warnings',
  '34073-7': 'interactions',
  '34084-4': 'adverse_reactions',
  '43684-0': 'pregnancy_lactation',
  '42228-7': 'pregnancy_lactation',
  '77290-5': 'pregnancy_lactation',
  '34080-2': 'pregnancy_lactation',
  '34088-5': 'overdose',
  '43679-0': 'mechanism_of_action',
  '43681-6': 'pharmacodynamics',
  '43682-4': 'pharmacokinetics',
  '34090-1': 'clinical_pharmacology',
  '43680-8': 'preclinical_safety',
});

const attr = (tag, name) => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1] ?? null;
const UNII_OID = '2.16.840.1.113883.4.9';
const LOINC_OID = '2.16.840.1.113883.6.1';

/** Texto plano de un fragmento SPL: etiquetas fuera, párrafos y listas como saltos de línea. */
export function splText(xml) {
  const t = decodeEntities(
    String(xml)
      .replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, (m) => `${m}\n`)
      .replace(/<item\b[^>]*>/gi, '\n• ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(paragraph|title|item|list|tr|table|section)>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t\r\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return t.length ? t : null;
}

/** Secciones de primer nivel del `structuredBody`: `[{ code, displayName, title, xml }]`. */
export function topSections(xml) {
  const body = /<structuredBody>([\s\S]*)<\/structuredBody>/.exec(xml)?.[1] ?? '';
  const re = /<(\/?)section\b[^>]*>/g;
  const out = [];
  let depth = 0;
  let start = -1;
  for (let m = re.exec(body); m !== null; m = re.exec(body)) {
    if (!m[1]) {
      if (depth === 0) start = m.index;
      depth++;
    } else {
      depth--;
      if (depth === 0) {
        const sec = body.slice(start, m.index + m[0].length);
        // El código propio es el primero, antes de cualquier subsección.
        const head = sec.slice(0, sec.indexOf('<section', 8) > 0 ? sec.indexOf('<section', 8) : sec.length);
        const code = /<code\b[^>]*>/.exec(head)?.[0] ?? '';
        out.push({
          code: attr(code, 'codeSystem') === LOINC_OID ? attr(code, 'code') : null,
          displayName: attr(code, 'displayName'),
          title: splText(/<title\b[^>]*>([\s\S]*?)<\/title>/.exec(head)?.[1] ?? '') ?? null,
          xml: sec,
        });
      }
    }
  }
  return out;
}

/** Identidad del documento SPL (encabezado, antes del cuerpo). */
export function splIdentity(xml) {
  const header = xml.slice(0, Math.max(0, xml.indexOf('<component>')) || xml.length);
  const docCode = /<code\b[^>]*codeSystem="2\.16\.840\.1\.113883\.6\.1"[^>]*>/.exec(header)?.[0] ?? '';
  const eff = /<effectiveTime value="(\d{8})/.exec(header)?.[1] ?? null;
  const unii = new Set();
  const routes = new Set();
  for (const m of xml.matchAll(/<ingredient classCode="(ACTI[A-Z]*)">([\s\S]*?)<\/ingredient>/g)) {
    const code = /<ingredientSubstance>\s*<code code="([A-Z0-9]{10})" codeSystem="([\d.]+)"/.exec(m[2]);
    if (code && code[2] === UNII_OID) unii.add(code[1]);
  }
  for (const m of xml.matchAll(/<routeCode\b[^>]*displayName="([^"]+)"/g)) routes.add(m[1].toUpperCase());
  return {
    setId: /<setId root="([^"]+)"/.exec(header)?.[1] ?? null,
    id: /<id root="([^"]+)"/.exec(header)?.[1] ?? null,
    version: /<versionNumber value="(\d+)"/.exec(header)?.[1] ?? null,
    effectiveDate: eff ? `${eff.slice(0, 4)}-${eff.slice(4, 6)}-${eff.slice(6, 8)}` : null,
    docType: attr(docCode, 'code'),
    title: splText(/<title\b[^>]*>([\s\S]*?)<\/title>/.exec(header)?.[1] ?? '') ?? null,
    unii: [...unii].sort(),
    routes: [...routes].sort(),
  };
}

/** SPL → filas de sección literales (inglés) con su procedencia. */
export function dailyMedSections(xml, ref, retrievedAt) {
  const id = splIdentity(xml);
  const out = [];
  for (const s of topSections(xml)) {
    const key = SPL_LOINC[s.code];
    if (!key) continue;
    const text = splText(s.xml);
    if (!text) continue;
    out.push({
      key,
      source: DAILYMED_SOURCE,
      sourceName: DAILYMED_SOURCE_NAME,
      language: 'en',
      audience: 'professional',
      document: {
        type: 'spl',
        id: id.setId,
        title: id.title,
        version: id.version,
        effectiveDate: id.effectiveDate,
        splId: id.id,
        url: dailyMedSetUrl(id.setId),
        pageUrl: dailyMedSetUrl(id.setId),
      },
      section: { number: s.code, title: s.title ?? s.displayName, url: dailyMedSetUrl(id.setId), apiUrl: splXmlUrl(id.setId) },
      html: null,
      text,
      tables: extractTables(s.xml),
      textSha256: textSha256(text),
      retrievedAt,
      license: DAILYMED_LICENSE,
      citation:
        `NLM. DailyMed, SPL set_id ${id.setId}, versión ${id.version ?? '?'} (effective_time ${id.effectiveDate ?? '?'}), ` +
        `sección LOINC ${s.code}${s.title ? ` «${s.title}»` : ''}. ${dailyMedSetUrl(id.setId)} (consultado el ${retrievedAt.slice(0, 10)}).`,
      selection: { criterion: ref.criterion, group: ref.group },
    });
  }
  return out;
}
