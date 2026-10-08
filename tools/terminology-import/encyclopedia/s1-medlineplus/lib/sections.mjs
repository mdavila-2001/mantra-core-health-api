// =============================================================================
// Troceo del resumen de un tema de MedlinePlus en secciones LITERALES.
//
// El `full-summary` del XML de la NLM es HTML con `<h3>` como títulos de
// sección (p. ej. «¿Qué causa la afasia?»). Acá solo se corta por esos títulos
// y se pasa cada trozo a texto plano: no se reescribe, no se resume, no se
// reordena. Lo que el HTML trae roto o no representable en texto plano se
// MARCA (`flags`) para que el ensamblador lo mande a `rejected.ndjson` en vez
// de publicarlo deformado:
//   - `malformed-markup`: etiquetas fuera de la gramática de la NLM
//     (`<ph3>`, `<topic>` en minúscula con contenido, etc.).
//   - `table`: una tabla no cabe en texto plano sin inventar separadores.
// =============================================================================

import { decodeEntities, htmlToText } from '../../../lib/glossary-es/common.mjs';

/** `<TOPIC ID=".." LINKTEXT="x"/>` autocerrado: el XML de la NLM lo usa como enlace interno; el texto visible es LINKTEXT. */
const SELF_CLOSED_TOPIC = /<topic\s+id="\d+"\s+linktext="([^"]*)"\s*\/>/gi;
/** Cualquier otra forma de `<topic …>` / `<ph3>` no tiene gramática segura. */
const MALFORMED = /<\/?(topic|ph3)\b/i;
const TABLE = /<table\b/i;
const IMG = /<img\b[^>]*>/gi;

/** Sustituye los `<TOPIC … LINKTEXT="x"/>` autocerrados por su texto visible. Devuelve HTML. */
export function resolveTopicLinks(html) {
  return html.replace(SELF_CLOSED_TOPIC, (_, linkText) => decodeEntities(linkText).replace(/\s+/g, ' ').trim());
}

/** Quita las imágenes del HTML (se registran aparte; ninguna es del glosario). */
export function stripImages(html) {
  return { html: html.replace(IMG, ''), images: [...html.matchAll(IMG)].map((m) => m[0]) };
}

/**
 * Parte el HTML en bloques: el texto previo al primer `<h3>` (heading=null) y un
 * bloque por cada `<h3>`. Un `<h3>` vacío o sin texto no abre bloque.
 */
export function splitSections(rawHtml) {
  const resolved = resolveTopicLinks(rawHtml ?? '');
  const parts = resolved.split(/(?=<h3[^>]*>)/i);
  const blocks = [];
  for (const part of parts) {
    const m = part.match(/^<h3[^>]*>([\s\S]*?)<\/h3>/i);
    const heading = m ? htmlToText(m[1]) : null;
    const bodyHtml = m ? part.slice(m[0].length) : part;
    if (m && !heading) continue;
    const { html, images } = stripImages(bodyHtml);
    const text = htmlToText(html);
    if (!text && !heading) continue;
    const flags = [];
    if (MALFORMED.test(bodyHtml) || MALFORMED.test(part.slice(0, 40))) flags.push('malformed-markup');
    if (TABLE.test(html)) flags.push('table');
    blocks.push({ heading, text, images, flags });
  }
  return blocks;
}

/**
 * Quita del final del resumen el párrafo de atribución («NIH: Instituto Nacional
 * del Cáncer»), que la NLM agrega como último `<p>` y la página marca con
 * `class="attribution"`. Solo se quita si su texto es EXACTAMENTE una de las
 * atribuciones que declara la página del tema: no se adivina por apariencia.
 * @returns {{ html: string, attribution: string | null }}
 */
export function stripTrailingAttribution(rawHtml, pageAttributions = []) {
  const html = String(rawHtml ?? '');
  const m = html.match(/<p[^>]*>((?:(?!<p[\s>])[\s\S])*?)<\/p>\s*$/i);
  if (!m) return { html, attribution: null };
  const text = htmlToText(m[1]);
  const wanted = pageAttributions.map((a) => comparableText(a));
  if (text && wanted.includes(comparableText(text))) return { html: html.slice(0, m.index), attribution: text };
  return { html, attribution: null };
}

/** Texto plano comparable: sin etiquetas, entidades resueltas y espacios colapsados. */
export function comparableText(html) {
  return decodeEntities(
    resolveTopicLinks(String(html ?? ''))
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[  ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Viñetas del texto (líneas «• …» que deja `htmlToText`), sin el marcador. Literales, en orden. */
export function bulletItems(text) {
  return String(text ?? '')
    .split('\n')
    .filter((line) => line.startsWith('• '))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

/**
 * Texto sin NINGÚN espacio: forma de comparar texto de la fuente contra la página
 * sin que el espaciado que meten las etiquetas («<strong>x</strong>:» → «x :»)
 * cuente como diferencia. Los caracteres sí deben coincidir uno a uno.
 */
export function squashedText(html) {
  return comparableText(html).replace(/\s+/g, '');
}
