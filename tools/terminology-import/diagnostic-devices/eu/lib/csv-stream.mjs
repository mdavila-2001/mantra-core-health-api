// =============================================================================
// Lector CSV en streaming (RFC 4180: comillas dobles, campos con saltos de
// línea, BOM, separador configurable) para archivos que no entran en un string
// de V8 (la BD/RDM italiana pesa 525 MB). Devuelve filas como arreglos.
// =============================================================================

/**
 * @param {AsyncIterable<Buffer|string>} source
 * @param {{ delimiter?: string }} opts
 * @returns {AsyncGenerator<string[]>}
 */
export async function* csvRows(source, { delimiter = ';' } = {}) {
  let row = [];
  let field = '';
  let quoted = false;
  let pendingQuote = false; // vimos «"» dentro de comillas: puede ser cierre o comilla escapada
  let first = true;
  let prevCR = false;
  const decoder = new TextDecoder('utf-8');
  const push = () => {
    row.push(field);
    field = '';
  };
  for await (const chunk of source) {
    let text = typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
    if (first) {
      if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
      first = false;
    }
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (pendingQuote) {
        pendingQuote = false;
        if (ch === '"') {
          field += '"';
          continue;
        }
        quoted = false; // era un cierre; seguimos procesando ch fuera de comillas
      }
      if (quoted) {
        if (ch === '"') pendingQuote = true;
        else field += ch;
        continue;
      }
      if (prevCR && ch === '\n') {
        prevCR = false;
        continue;
      }
      prevCR = false;
      if (ch === '"') quoted = true;
      else if (ch === delimiter) push();
      else if (ch === '\n' || ch === '\r') {
        prevCR = ch === '\r';
        push();
        if (row.length > 1 || row[0] !== '') yield row;
        row = [];
      } else field += ch;
    }
  }
  if (pendingQuote) quoted = false;
  if (field !== '' || row.length) {
    push();
    if (row.length > 1 || row[0] !== '') yield row;
  }
}
