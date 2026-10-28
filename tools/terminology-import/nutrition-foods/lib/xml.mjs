// Utilidades mínimas de XML para los archivos planos de Ciqual y el RDF/XML de FoodOn (sin dependencias).
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

export function decodeXml(s) {
  return s.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (m, e) => {
    if (e[0] === '#') {
      const cp = e[1] === 'x' ? Number.parseInt(e.slice(2), 16) : Number.parseInt(e.slice(1), 10);
      return String.fromCodePoint(cp);
    }
    if (e in NAMED) return NAMED[e];
    throw new Error(`Entidad XML desconocida: ${m}`);
  });
}

/**
 * Archivo plano de Ciqual: `<TABLE><ROW><col> valor </col><col missing=" " />…</ROW>…</TABLE>`.
 * Devuelve objetos con los valores recortados; una columna `missing` no genera clave (la fuente no dice nada).
 */
export function parseFlatRows(text, rowTag) {
  const rows = [];
  const re = new RegExp(`<${rowTag}>([\\s\\S]*?)</${rowTag}>`, 'g');
  let m;
  while ((m = re.exec(text))) {
    const o = {};
    const colRe = /<([A-Za-z_][\w]*)(?:\s+missing="[^"]*"\s*\/>|>([\s\S]*?)<\/\1>)/g;
    let c;
    while ((c = colRe.exec(m[1]))) {
      if (c[2] === undefined) continue;
      const v = decodeXml(c[2]).trim();
      if (v !== '') o[c[1]] = v;
    }
    rows.push(o);
  }
  return rows;
}
