// =============================================================================
// Lectura de las páginas públicas de MedlinePlus ya cacheadas (la descarga la
// hace `fetch-pages.mjs`). Sirve para verificar, página por página, que:
//   - el resumen del XML es el mismo texto que publica la página (literalidad),
//   - ni el resumen ni la página nombran a A.D.A.M.,
// y para leer «Última actualización», la organización autora y la imagen
// principal del tema (que NO se usa: vive en medlineplus.gov, fuera de la CSP).
// =============================================================================

import { join } from 'node:path';
import { decodeEntities, htmlToText } from '../../../lib/glossary-es/common.mjs';
import { adamCheck } from './guards.mjs';
import { comparableText, squashedText } from './sections.mjs';

export function topicPageCachePath(cacheDir, topicId) {
  return join(cacheDir, 'topics', `${topicId}.html`);
}

const MONTHS = {
  enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06', julio: '07',
  agosto: '08', septiembre: '09', setiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
};

/** «1 agosto 2025» → «2025-08-01». null si no es una fecha reconocible. */
export function isoFromSpanishDate(text) {
  const m = String(text ?? '').trim().toLowerCase().match(/^(\d{1,2})\s+(?:de\s+)?([a-záéíóú]+)\s+(?:de\s+)?(\d{4})$/);
  if (!m || !MONTHS[m[2]]) return null;
  return `${m[3]}-${MONTHS[m[2]]}-${m[1].padStart(2, '0')}`;
}

/** Contenido (HTML interno) del `<div id=…>` con balanceo de `<div>` anidados. null si no existe. */
export function innerDiv(html, id) {
  const open = html.match(new RegExp(`<div[^>]*\\bid="${id}"[^>]*>`, 'i'));
  if (!open) return null;
  let depth = 1;
  const start = open.index + open[0].length;
  const re = /<(\/?)div\b[^>]*>/gi;
  re.lastIndex = start;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return html.slice(start, m.index);
  }
  return null;
}

/**
 * Datos de una página de tema.
 * @returns {{ summaryText: string|null, summarySquashed: string|null, attributions: string[], lastUpdated: string|null,
 *   lastUpdatedIso: string|null, adamInPage: boolean, adamInSummary: boolean, encyLinks: number,
 *   primaryImage: string|null }}
 */
export function parseTopicPage(html) {
  const summaryInner = innerDiv(html, 'topic-summary');
  const attributions = [];
  let summaryNoAttribution = summaryInner;
  if (summaryInner) {
    summaryNoAttribution = summaryInner.replace(/<p[^>]*class="attribution"[^>]*>([\s\S]*?)<\/p>/gi, (_, inner) => {
      attributions.push(htmlToText(inner));
      return '';
    });
  }
  const lastUpdated = html.match(/<span id="lastupdate">\s*Última actualización\s*([^<]+?)\s*<\/span>/i)?.[1] ?? null;
  const primaryImage = html.match(/<img[^>]+src="(https:\/\/medlineplus\.gov\/images\/[^"]+)"[^>]*title="[^"]*"/i)?.[1] ?? null;
  return {
    summaryText: summaryNoAttribution == null ? null : comparableText(summaryNoAttribution),
    summarySquashed: summaryNoAttribution == null ? null : squashedText(summaryNoAttribution),
    attributions,
    lastUpdated,
    lastUpdatedIso: isoFromSpanishDate(lastUpdated),
    adamInPage: !adamCheck(decodeEntities(html.replace(/<[^>]+>/g, ' '))).ok,
    adamInSummary: summaryInner == null ? false : !adamCheck(htmlToText(summaryInner)).ok,
    encyLinks: summaryInner == null ? 0 : (summaryInner.match(/medlineplus\.gov\/spanish\/ency\//gi) ?? []).length,
    primaryImage,
  };
}
