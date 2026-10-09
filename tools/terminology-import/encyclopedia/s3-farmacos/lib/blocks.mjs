// =============================================================================
// HTML de una sección de la ficha técnica → bloques de texto literal.
//
// Solo se QUITAN etiquetas y se normaliza el espacio en blanco (los espacios
// duros de la ficha, «≥ 1/10», pasan a espacio normal). No se reordena, no se
// resume, no se reescribe ni se traduce. Una tabla se lee en orden de celdas, una
// celda por línea (p. ej. «Muy raras» y luego «Candidiasis mucocutánea.»).
// =============================================================================

import { doseMatch } from './dose-guard.mjs';

const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', laquo: '«', raquo: '»',
  iquest: '¿', iexcl: '¡', deg: '°', micro: 'µ', middot: '·', aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó',
  uacute: 'ú', ntilde: 'ñ', uuml: 'ü', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ',
  Uuml: 'Ü', ge: '≥', le: '≤', plusmn: '±', times: '×', reg: '®', copy: '©', trade: '™', beta: 'β', alpha: 'α',
  gamma: 'γ', mu: 'μ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', bull: '•', agrave: 'à',
  egrave: 'è', ccedil: 'ç', acirc: 'â', ecirc: 'ê', ocirc: 'ô', euml: 'ë', iuml: 'ï', ouml: 'ö', auml: 'ä',
};

export function decodeEntities(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-zA-Z]+);/g, (m, n) => NAMED[n] ?? m);
}

/** Espacio en blanco → espacio simple (incluye NBSP, tabulaciones y espacios finos). */
export function squash(s) {
  return s.replace(/[   ​\t\r\f\v ]+/g, ' ').trim();
}

/** @returns {string[]} líneas no vacías en orden de lectura */
export function htmlToLines(html) {
  if (typeof html !== 'string') return [];
  const stripped = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    // Un salto de línea dentro del código fuente no es un salto de párrafo.
    .replace(/\r?\n/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h\d|li|ul|ol|tr|td|th|table|caption)>/gi, '\n')
    .replace(/<(li|tr|p|div|h\d|td|th)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  return decodeEntities(stripped)
    .split('\n')
    .map(squash)
    .filter((l) => l !== '' && !/^[•·\-–—]+$/.test(l));
}

/**
 * Parte una línea en oraciones. Corta tras `.`, `!` o `?` seguidos de espacio y una
 * mayúscula (o `¿ ¡ ( «`). No corta tras abreviaturas en minúscula («p. ej. una»).
 * Concatenando las oraciones con un espacio se recupera la línea original.
 */
export function splitSentences(line) {
  return line.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑÜ¿¡(«“"])/u).filter((s) => s !== '');
}

/**
 * Líneas de una sección → oraciones aptas para publicar.
 * @returns {{ lines: string[], dropped: {sentence:string, reason:string}[], sentenceCount:number }}
 *   `lines`: cada línea original reducida a sus oraciones limpias (las líneas que
 *   quedan vacías desaparecen). `dropped`: oraciones retiradas por la guardia de dosis.
 */
export function cleanLines(htmlLines) {
  const judged = htmlLines.map((line) =>
    splitSentences(line).map((sentence) => ({ sentence, reason: doseMatch(sentence) })),
  );
  retireSentencesSplitAcrossParagraphs(judged);
  const lines = [];
  const dropped = [];
  let sentenceCount = 0;
  for (const sentences of judged) {
    const kept = [];
    for (const { sentence, reason } of sentences) {
      sentenceCount++;
      if (reason) dropped.push({ sentence, reason });
      else kept.push(sentence);
    }
    if (kept.length > 0) lines.push(kept.join(' '));
  }
  return { lines, dropped, sentenceCount };
}

/**
 * Las fichas convertidas desde PDF parten una oración a media frase entre dos párrafos
 * («… (ver sección» / «4.2).»): cada mitad pasa sola la guardia y juntas son una referencia a
 * la posología. Si el último fragmento de un párrafo y el primero del siguiente suman un
 * patrón de dosis que ninguno tiene por separado, se retiran los dos.
 */
function retireSentencesSplitAcrossParagraphs(judged) {
  for (let i = 0; i + 1 < judged.length; i++) {
    const tail = judged[i].at(-1);
    const head = judged[i + 1][0];
    if (!tail || !head || tail.reason || head.reason) continue;
    const joined = doseMatch(`${tail.sentence} ${head.sentence}`);
    if (joined) {
      tail.reason = `${joined}:split-across-paragraphs`;
      head.reason = tail.reason;
    }
  }
}

/**
 * ¿Cada ORACIÓN de la salida es una subcadena literal del texto de la fuente (ignorando
 * espacios)? Es a nivel de oración porque la guardia de dosis puede retirar una del medio de
 * un párrafo: las que quedan siguen siendo literales, aunque ya no sean contiguas.
 */
export function isLiteralOf(outputLines, sourceLines) {
  const haystack = squash(sourceLines.join(' '));
  return outputLines.flatMap(splitSentences).every((s) => haystack.includes(squash(s)));
}
