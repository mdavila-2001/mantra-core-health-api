// =============================================================================
// Troceo del resumen de un tema de MedlinePlus en secciones LITERALES.
//
// El `full-summary` del XML de la NLM es HTML con `<h3>` como títulos de
// sección (p. ej. «¿Qué causa la afasia?»). Acá solo se corta por esos títulos
// y se pasa cada trozo a texto plano: no se reescribe, no se resume, no se
// reordena. Lo que el HTML trae roto o no representable en texto plano se
// MARCA (`flags`) para que el ensamblador lo mande a `rejected.ndjson` en vez
// de publicarlo deformado:
//   - `malformed-markup`: etiquetas fuera de la gramática de la NLM que no
//     tienen una lectura segura (se reparan solo `<ph3>` y `<topic …>`, ver
//     `repairMarkup`).
// Las tablas SÍ se publican: cada fila es una línea y las celdas se separan con
// « | » (único carácter que agrega el sistema); el bloque lleva la marca `table`.
//   - `adam-encyclopedia-link`: el bloque enlaza a la Enciclopedia Médica de
//     MedlinePlus (`/ency/`, contenido de A.D.A.M.) fuera de una lista. Los
//     elementos de lista que solo apuntan a esa enciclopedia se QUITAN y se
//     cuentan (`adamLinksRemoved`; la sección sale como extracto).
// =============================================================================

import { decodeEntities, htmlToText } from '../../../lib/glossary-es/common.mjs';

/** `<TOPIC ID=".." LINKTEXT="x"/>` autocerrado: el XML de la NLM lo usa como enlace interno; el texto visible es LINKTEXT. */
const SELF_CLOSED_TOPIC = /<topic\s+id="\d+"\s+linktext="([^"]*)"\s*\/>/gi;
/** Cualquier otra forma de `<topic …>` / `<ph3>` no tiene gramática segura. */
const MALFORMED = /<\/?(topic|ph3)\b/i;
const TABLE = /<table\b/i;
const ADAM_ENCYCLOPEDIA_LINK = /medlineplus\.gov\/(?:spanish\/)?ency\//i;
const IMG = /<img\b[^>]*>/gi;

const cleanLinkText = (t) => decodeEntities(t).replace(/\s+/g, ' ').trim();
/** `<topic id=".." linktext="x">contenido</topic>` en minúscula: la NLM lo usa a veces como enlace con texto. */
const OPEN_TOPIC = /<topic\s+id="\d+"\s+linktext="([^"]*)"\s*>([\s\S]*?)<\/topic>/gi;

/**
 * Sustituye los enlaces internos `<TOPIC … LINKTEXT="x"/>` por su texto visible y repara
 * los dos errores de marcado que la NLM tiene en su XML (comprobados contra la página):
 *  - `<topic … linktext="x">c</topic>` → «x» + «c»; si está vacío y le sigue un `<a>` con ese
 *    mismo texto, se descarta para no duplicarlo;
 *  - `<ph3>Título` (sin cierre) → `<h3>Título</h3>`.
 * Devuelve HTML.
 */
export function resolveTopicLinks(html) {
  return html
    .replace(SELF_CLOSED_TOPIC, (_, linkText) => cleanLinkText(linkText))
    .replace(OPEN_TOPIC, (whole, linkText, content, offset, all) => {
      const text = cleanLinkText(linkText);
      const next = all.slice(offset + whole.length);
      if (!content.trim() && next.match(/^\s*<a\b[^>]*>([\s\S]*?)<\/a>/i)?.[1]?.trim() === text) return '';
      return `${text}${content}`;
    })
    .replace(/<ph3>([^<]*)/gi, (_, title) => `<h3>${title.trim()}</h3>`)
    .replace(/<\/ph3>/gi, '');
}

/** Cada `<table>` pasa a un párrafo por fila, con las celdas unidas por « | ». */
export function tablesToParagraphs(html) {
  return html.replace(/<table\b[\s\S]*?<\/table>/gi, (table) =>
    [...table.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)]
      .map((tr) => [...tr[0].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => htmlToText(c[1]) ?? '').join(' | '))
      .filter((row) => row.replace(/[|\s]/g, '') !== '')
      .map((row) => `<p>${row}</p>`)
      .join('\n'));
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
    const { html: withoutImages, images } = stripImages(bodyHtml);
    // Elementos de lista que solo apuntan a la Enciclopedia Médica (A.D.A.M.) se quitan y se cuentan;
    // si el enlace está en otro lugar (un párrafo), el bloque entero queda marcado y no se publica.
    let adamLinksRemoved = 0;
    const noImages = withoutImages.replace(/<li\b[^>]*>(?:(?!<\/li>)[\s\S])*?<\/li>/gi, (li) => {
      if (!ADAM_ENCYCLOPEDIA_LINK.test(li)) return li;
      adamLinksRemoved += 1;
      return '';
    });
    const html = tablesToParagraphs(noImages);
    const text = htmlToText(html);
    if (!text && !heading) continue;
    const flags = [];
    if (MALFORMED.test(bodyHtml)) flags.push('malformed-markup');
    if (TABLE.test(noImages)) flags.push('table');
    if (ADAM_ENCYCLOPEDIA_LINK.test(noImages)) flags.push('adam-encyclopedia-link');
    blocks.push({ heading, text, images, flags, ...(adamLinksRemoved ? { adamLinksRemoved } : {}) });
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
