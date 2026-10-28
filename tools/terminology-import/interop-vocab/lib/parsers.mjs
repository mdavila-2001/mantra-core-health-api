// =============================================================================
// Lectores de los archivos que NO son paquetes FHIR: CVX y MVX (CDC), UCUM
// (ucum-essence.xml) y el registro de subtags de IANA. Escritos contra los
// archivos reales (fixtures en test/fixtures/). Todo VERBATIM: lo que el archivo
// no trae no se completa; lo único derivado se marca como tal en el nombre del campo.
// =============================================================================

const decodeEntities = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

const dateIso = (s, what) => {
  const m = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(s);
  if (!m) throw new Error(`${what}: fecha con formato inesperado «${s}»`);
  return `${m[1]}-${m[2]}-${m[3]}`;
};

// --- CDC: CVX / MVX ------------------------------------------------------------

/**
 * cvx.txt: `código |nombre corto|nombre completo|notas|estado|noVacuna|última actualización`,
 * UTF-8 con BOM y CRLF. El código viene relleno de espacios.
 */
export function parseCvx(text) {
  const rows = [];
  const seen = new Set();
  for (const raw of text.replace(/^﻿/, '').split(/\r?\n/)) {
    if (raw.trim() === '') continue;
    const f = raw.split('|');
    if (f.length !== 7) throw new Error(`CVX: se esperaban 7 campos y hay ${f.length}: «${raw.slice(0, 80)}»`);
    const code = f[0].trim();
    if (!/^\d+$/.test(code)) throw new Error(`CVX: código no numérico «${code}»`);
    if (seen.has(code)) throw new Error(`CVX: código repetido ${code}`);
    seen.add(code);
    if (!['True', 'False'].includes(f[5])) throw new Error(`CVX ${code}: noVacuna inesperado «${f[5]}»`);
    rows.push({
      code,
      shortDescription: f[1],
      fullName: f[2],
      notes: f[3] === '' ? null : f[3],
      status: f[4],
      nonVaccine: f[5] === 'True',
      lastUpdated: dateIso(f[6], `CVX ${code}`),
    });
  }
  return rows;
}

/** mvx.txt: `código|fabricante|notas|estado|última actualización`, CRLF. */
export function parseMvx(text) {
  const rows = [];
  const seen = new Set();
  for (const raw of text.replace(/^﻿/, '').split(/\r?\n/)) {
    if (raw.trim() === '') continue;
    const f = raw.split('|');
    if (f.length !== 5) throw new Error(`MVX: se esperaban 5 campos y hay ${f.length}: «${raw.slice(0, 80)}»`);
    const code = f[0].trim();
    if (!/^[A-Z0-9_-]+$/.test(code)) throw new Error(`MVX: código inesperado «${code}»`);
    if (seen.has(code)) throw new Error(`MVX: código repetido ${code}`);
    seen.add(code);
    rows.push({ code, manufacturer: f[1], notes: f[2] === '' ? null : f[2], status: f[3], lastUpdated: dateIso(f[4], `MVX ${code}`) });
  }
  return rows;
}

/**
 * tradename.txt: `marca|descripción de la vacuna|CVX|fabricante|MVX|estado CVX|estado del producto|última actualización|`
 * (termina en «|»). El archivo no trae un identificador de producto: una marca puede repetirse (distinto fabricante o CVX),
 * por eso se devuelven filas, no un mapa por marca.
 */
export function parseCvxTradenames(text) {
  const rows = [];
  for (const raw of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    if (raw.trim() === '') continue;
    const f = raw.split('|');
    if (f.length !== 9 || f[8] !== '') throw new Error(`tradename: se esperaban 8 campos y «|» final; hay ${f.length - 1}: «${raw.slice(0, 80)}»`);
    const cvx = f[2].trim();
    if (!/^\d+$/.test(cvx)) throw new Error(`tradename ${f[0]}: CVX no numérico «${cvx}»`);
    const mvx = f[4].trim();
    rows.push({
      tradeName: f[0],
      description: f[1],
      cvx,
      manufacturer: f[3] === '' ? null : f[3],
      mvx: mvx === '' ? null : mvx,
      cvxStatus: f[5],
      productStatus: f[6],
      lastUpdated: dateIso(f[7], `tradename ${f[0]}`),
    });
  }
  return rows;
}

// --- UCUM: ucum-essence.xml ----------------------------------------------------------

const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([A-Za-z]+)="([^"]*)"/g)].map((m) => [m[1], decodeEntities(m[2])]));
/** Texto interno de un elemento, con entidades decodificadas y el marcado (<sup>, <sub>, <i>, <r>) intacto. */
const inner = (xml, tag) => {
  const m = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`).exec(xml);
  return m ? decodeEntities(m[1].replace(/\s+/g, ' ').trim()) : null;
};

/** Devuelve { header, prefixes, baseUnits, units } con los atributos tal cual vienen. */
export function parseUcumEssence(xml) {
  const root = /<root\s([^>]*)>/.exec(xml);
  if (!root) throw new Error('UCUM: sin <root>');
  const header = attrs(root[1]);
  const blocks = (tag) =>
    [...xml.matchAll(new RegExp(`<${tag}\\s([^>]*?)(?:/>|>([\\s\\S]*?)</${tag}>)`, 'g'))].map((m) => ({ attrs: attrs(m[1]), body: m[2] ?? '' }));

  const valueOf = (body) => {
    const m = /<value\s([^>]*?)(?:\/>|>([\s\S]*?)<\/value>)/.exec(body);
    if (!m) return null;
    const a = attrs(m[1]);
    const text = m[2] ?? '';
    const fn = /<function\s([^>]*?)\/>/.exec(text);
    return {
      unit: a.Unit ?? null,
      UNIT: a.UNIT ?? null,
      value: a.value ?? null,
      text: decodeEntities(text.replace(/<function[^>]*\/>/g, '').replace(/\s+/g, ' ').trim()) || null,
      function: fn ? attrs(fn[1]) : null,
    };
  };
  const common = (b) => ({ code: b.attrs.Code, CODE: b.attrs.CODE, name: inner(b.body, 'name'), printSymbol: inner(b.body, 'printSymbol') });

  const prefixes = blocks('prefix').map((b) => ({ ...common(b), value: valueOf(b.body) }));
  const baseUnits = blocks('base-unit').map((b) => ({ ...common(b), dim: b.attrs.dim ?? null, property: inner(b.body, 'property') }));
  const units = blocks('unit').map((b) => ({
    ...common(b),
    property: inner(b.body, 'property'),
    class: b.attrs.class ?? null,
    isMetric: b.attrs.isMetric ?? null,
    isSpecial: b.attrs.isSpecial ?? null,
    isArbitrary: b.attrs.isArbitrary ?? null,
    value: valueOf(b.body),
  }));
  for (const [kind, list] of [['prefix', prefixes], ['base-unit', baseUnits], ['unit', units]]) {
    const codes = new Set();
    for (const x of list) {
      if (!x.code || !x.name) throw new Error(`UCUM ${kind} sin Code o name: ${JSON.stringify(x)}`);
      if (codes.has(x.code)) throw new Error(`UCUM ${kind}: Code repetido ${x.code}`);
      codes.add(x.code);
    }
  }
  const unitCodes = new Set([...baseUnits, ...units].map((u) => u.code));
  const clash = [...unitCodes].length !== baseUnits.length + units.length;
  if (clash) throw new Error('UCUM: un Code de base-unit se repite en unit');
  return { header, prefixes, baseUnits, units };
}

// --- IANA: language-subtag-registry ----------------------------------------------------

/**
 * Registro de subtags (RFC 5646). Registros separados por `%%`; los campos pueden continuar en la línea siguiente
 * (empieza con espacios). Un campo puede repetirse (Description, Prefix, Comments). Devuelve { fileDate, records }.
 */
export function parseIanaRegistry(text) {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n%%\n/);
  const head = /^File-Date:\s*(\S+)/.exec(blocks[0]);
  if (!head) throw new Error('IANA: sin File-Date');
  const records = [];
  for (const block of blocks.slice(1)) {
    const fields = [];
    for (const line of block.split('\n')) {
      if (line.trim() === '') continue;
      if (/^\s/.test(line)) {
        if (!fields.length) throw new Error('IANA: continuación sin campo');
        fields.at(-1)[1] += ` ${line.trim()}`;
        continue;
      }
      const i = line.indexOf(':');
      if (i < 1) throw new Error(`IANA: línea sin «:»: ${line}`);
      fields.push([line.slice(0, i), line.slice(i + 1).trim()]);
    }
    const get = (k) => fields.filter(([n]) => n === k).map(([, v]) => v);
    const type = get('Type')[0];
    if (!type) throw new Error(`IANA: registro sin Type: ${block.slice(0, 60)}`);
    const key = type === 'grandfathered' || type === 'redundant' ? get('Tag')[0] : get('Subtag')[0];
    if (!key) throw new Error(`IANA: registro ${type} sin Subtag/Tag`);
    records.push({
      type,
      code: key,
      descriptions: get('Description'),
      added: get('Added')[0] ?? null,
      deprecated: get('Deprecated')[0] ?? null,
      preferredValue: get('Preferred-Value')[0] ?? null,
      prefixes: get('Prefix'),
      suppressScript: get('Suppress-Script')[0] ?? null,
      macrolanguage: get('Macrolanguage')[0] ?? null,
      scope: get('Scope')[0] ?? null,
      comments: get('Comments'),
      known: new Set(['Type', 'Subtag', 'Tag', 'Description', 'Added', 'Deprecated', 'Preferred-Value', 'Prefix', 'Suppress-Script', 'Macrolanguage', 'Scope', 'Comments']),
      fieldNames: [...new Set(fields.map(([n]) => n))],
    });
  }
  for (const r of records) {
    const unknown = r.fieldNames.filter((n) => !r.known.has(n));
    if (unknown.length) throw new Error(`IANA ${r.type} ${r.code}: campos no contemplados ${unknown.join(', ')}`);
    delete r.known;
    delete r.fieldNames;
  }
  const seen = new Set();
  for (const r of records) {
    const k = `${r.type}\u0000${r.code.toLowerCase()}`;
    if (seen.has(k)) throw new Error(`IANA: ${r.type} ${r.code} repetido`);
    seen.add(k);
  }
  return { fileDate: head[1], records };
}
