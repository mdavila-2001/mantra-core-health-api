// =============================================================================
// Lector XML mínimo (no validante) para los productos de Orphanet.
//
// Los XML de Orphadata son regulares (sin espacios de nombres, sin DTD, sin
// CDATA) y caben en memoria (≈55 MB el mayor). Este lector arma un árbol
// `{ name, attrs, children, text }` y decodifica las entidades XML; lo que una
// definición trae escapado como HTML (`&lt;i&gt;`) queda como texto HTML, igual
// que en la fuente, y lo limpia quien lo consume.
// =============================================================================

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

export function decodeXml(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
    return ENTITIES[e] ?? m;
  });
}

function parseAttrs(src) {
  const attrs = {};
  for (const m of src.matchAll(/([\w:.-]+)\s*=\s*"([^"]*)"/g)) attrs[m[1]] = decodeXml(m[2]);
  return attrs;
}

/** XML → árbol. Devuelve el elemento raíz. */
export function parseXml(xml) {
  const root = { name: '#document', attrs: {}, children: [], text: '' };
  const stack = [root];
  const re = /<(\/?)([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*"[^"]*")*)\s*(\/?)>|<\?[\s\S]*?\?>|<!--[\s\S]*?-->/g;
  let last = 0;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const top = stack[stack.length - 1];
    if (m.index > last) top.text += xml.slice(last, m.index);
    last = re.lastIndex;
    if (m[2] === undefined) continue; // declaración o comentario
    if (m[1] === '/') {
      const el = stack.pop();
      el.text = decodeXml(el.text).trim();
      continue;
    }
    const el = { name: m[2], attrs: parseAttrs(m[3] ?? ''), children: [], text: '' };
    top.children.push(el);
    if (m[4] !== '/') stack.push(el);
  }
  return root.children[0];
}

export const child = (el, name) => el?.children.find((c) => c.name === name) ?? null;
export const children = (el, name) => el?.children.filter((c) => c.name === name) ?? [];
export const textOf = (el, name) => {
  const c = child(el, name);
  return c && c.text !== '' ? c.text : null;
};
/** Recorre `path` (nombres de elemento) y devuelve los nodos finales. */
export function pathAll(el, ...path) {
  let cur = [el];
  for (const p of path) cur = cur.flatMap((e) => children(e, p));
  return cur;
}
