// =============================================================================
// Parser de ODIN (antes dADL), la sintaxis de datos de las secciones
// `language`, `description` y `ontology` de un arquetipo ADL 1.4.
//
// Cubre lo que usa el espejo de openEHR CKM: atributos `nombre = <…>`, objetos
// con clave `["clave"] = <…>` o `[1] = <…>`, cadenas con escapes `\"` y `\\`,
// listas de cadenas (`"a", "b", ...`), códigos de término `[TERM::código]` y
// primitivos sueltos (números, fechas). No interpreta nada clínico: devuelve
// objetos y arreglos de JS con el texto verbatim.
// =============================================================================

/** @typedef {{ t: string, v?: string }} Token */

/**
 * @param {string} src
 * @returns {Token[]}
 */
export function tokenize(src) {
  /** @type {Token[]} */
  const out = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i++;
      continue;
    }
    if (c === '-' && src[i + 1] === '-') {
      // Comentario hasta fin de línea.
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    if (c === '"') {
      let j = i + 1;
      let s = '';
      while (j < n && src[j] !== '"') {
        if (src[j] === '\\' && j + 1 < n) {
          s += src[j + 1];
          j += 2;
          continue;
        }
        s += src[j];
        j++;
      }
      if (j >= n) throw new Error(`ODIN: cadena sin cerrar desde la posición ${i}`);
      out.push({ t: 'str', v: s });
      i = j + 1;
      continue;
    }
    if (c === '[' && /^\[\s*"/.test(src.slice(i, i + 8))) {
      // Clave entrecomillada; puede contener corchetes (`["/data[at0002]/events[at0003]"]`).
      let j = src.indexOf('"', i) + 1;
      let s = '';
      while (j < n && src[j] !== '"') {
        if (src[j] === '\\' && j + 1 < n) {
          s += src[j + 1];
          j += 2;
          continue;
        }
        s += src[j];
        j++;
      }
      const close = src.indexOf(']', j);
      if (j >= n || close < 0 || src.slice(j + 1, close).trim() !== '') throw new Error(`ODIN: clave mal formada en ${i}`);
      out.push({ t: 'key', v: s });
      i = close + 1;
      continue;
    }
    if (c === '[') {
      const end = src.indexOf(']', i);
      if (end < 0) throw new Error(`ODIN: corchete sin cerrar en ${i}`);
      const inner = src.slice(i + 1, end).trim();
      if (inner.startsWith('"') && inner.endsWith('"')) out.push({ t: 'key', v: inner.slice(1, -1) });
      else if (/^\d+$/.test(inner)) out.push({ t: 'key', v: inner });
      else out.push({ t: 'code', v: inner.replace(/\s+/g, '') });
      i = end + 1;
      continue;
    }
    if (c === '<') {
      out.push({ t: '<' });
      i++;
      continue;
    }
    if (c === '>') {
      out.push({ t: '>' });
      i++;
      continue;
    }
    if (c === '=') {
      out.push({ t: '=' });
      i++;
      continue;
    }
    if (c === ',') {
      out.push({ t: ',' });
      i++;
      continue;
    }
    if (src.startsWith('...', i)) {
      out.push({ t: '...' });
      i += 3;
      continue;
    }
    let j = i;
    while (j < n && !/[\s<>=,[\]"]/.test(src[j])) j++;
    if (j === i) throw new Error(`ODIN: carácter inesperado «${c}» en ${i}`);
    out.push({ t: 'id', v: src.slice(i, j) });
    i = j;
  }
  return out;
}

/**
 * Parsea un bloque ODIN completo (una secuencia de atributos) a objeto JS.
 * Las listas devuelven arreglos; un valor único, su primitivo; un objeto
 * anidado, un objeto. Los códigos de término se devuelven como
 * `{ terminology, code }`.
 * @param {string} src
 */
export function parseOdin(src) {
  const toks = tokenize(src);
  let p = 0;
  const peek = (k = 0) => toks[p + k];
  const expect = (t) => {
    const tok = toks[p++];
    if (!tok || tok.t !== t) throw new Error(`ODIN: se esperaba «${t}» y llegó «${tok?.t ?? 'EOF'}» (token ${p - 1})`);
    return tok;
  };

  const isAttrStart = () => {
    const a = peek();
    const b = peek(1);
    return a && b && (a.t === 'id' || a.t === 'key') && b.t === '=';
  };

  function primitive(tok) {
    if (tok.t === 'str') return tok.v;
    if (tok.t === 'code') {
      const k = tok.v.indexOf('::');
      return k < 0 ? { terminology: null, code: tok.v } : { terminology: tok.v.slice(0, k), code: tok.v.slice(k + 2) };
    }
    if (tok.t === 'id') return tok.v;
    throw new Error(`ODIN: primitivo inesperado «${tok.t}»`);
  }

  function value() {
    // Ya se consumió '<'.
    if (peek()?.t === '>') {
      p++;
      return null;
    }
    if (isAttrStart()) {
      const obj = attributes();
      expect('>');
      return obj;
    }
    const items = [];
    let isList = false;
    while (peek() && peek().t !== '>') {
      const tok = toks[p++];
      if (tok.t === ',') {
        isList = true;
        continue;
      }
      if (tok.t === '...') {
        isList = true;
        continue;
      }
      items.push(primitive(tok));
    }
    expect('>');
    return isList ? items : items.length === 1 ? items[0] : items;
  }

  function attributes() {
    const obj = {};
    while (isAttrStart()) {
      const name = toks[p++].v;
      expect('=');
      expect('<');
      obj[name] = value();
    }
    return obj;
  }

  const result = attributes();
  if (p !== toks.length) throw new Error(`ODIN: sobran tokens desde el ${p} («${toks[p]?.t}» ${toks[p]?.v ?? ''})`);
  return result;
}
