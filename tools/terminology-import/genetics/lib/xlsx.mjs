// =============================================================================
// Lector mínimo de .xlsx (ZIP con deflate + SpreadsheetML), sin dependencias.
// Sólo lo que hace falta para leer las listas controladas de la plantilla de
// envío de ClinVar: nombres de hoja, cadenas compartidas y celdas de texto o
// número. No evalúa fórmulas ni estilos; no soporta ZIP64 ni cifrado.
// =============================================================================

import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';

/** @returns {Map<string, Buffer>} nombre de entrada → contenido descomprimido */
export function readZip(path) {
  const buf = readFileSync(path);
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error(`${path}: no es un .zip`);
  const entries = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  if (p === 0xffffffff) throw new Error(`${path}: ZIP64 no soportado`);
  const out = new Map();
  for (let i = 0; i < entries; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error(`${path}: directorio central ilegible`);
    const flags = buf.readUInt16LE(p + 8);
    if (flags & 1) throw new Error(`${path}: entrada cifrada`);
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    const dataStart = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const raw = buf.subarray(dataStart, dataStart + csize);
    if (method === 0) out.set(name, raw);
    else if (method === 8) out.set(name, inflateRawSync(raw));
    else throw new Error(`${path}: método de compresión ${method} no soportado (${name})`);
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

const decodeXml = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e) => {
  if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
  return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[e.toLowerCase()];
});

/** `AB12` → { col: 27, row: 12 } (col 1-based). */
export function cellRef(ref) {
  const m = ref.match(/^([A-Z]+)(\d+)$/);
  if (!m) throw new Error(`referencia de celda inválida: ${ref}`);
  let col = 0;
  for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64);
  return { col, row: Number(m[2]) };
}

/**
 * Hojas del libro: [{ name, state, rows: Map<rowNumber, Map<colNumber, string>> }].
 * `state` es 'hidden' para las hojas ocultas (la lista controlada de ClinVar lo está).
 */
export function readWorkbook(path) {
  const zip = readZip(path);
  const text = (name) => {
    const b = zip.get(name);
    if (!b) throw new Error(`${path}: falta ${name}`);
    return b.toString('utf8');
  };
  const shared = [...text('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => decodeXml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')));
  const wb = text('xl/workbook.xml');
  const rels = new Map([...text('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\b([^>]*)\/?>/g)].map((m) => [m[1].match(/\bId="([^"]+)"/)?.[1], m[1].match(/\bTarget="([^"]+)"/)?.[1]]));
  const sheets = [];
  for (const m of wb.matchAll(/<sheet\b([^>]*)\/?>/g)) {
    const attrs = m[1];
    const name = decodeXml(attrs.match(/\bname="([^"]*)"/)?.[1] ?? '');
    const state = attrs.match(/\bstate="([^"]*)"/)?.[1] ?? 'visible';
    const rid = attrs.match(/\br:id="([^"]+)"/)?.[1];
    const target = rels.get(rid);
    if (!target) throw new Error(`${path}: la hoja ${name} no tiene relación ${rid}`);
    const xml = text(`xl/${target.replace(/^\/?(xl\/)?/, '')}`);
    const rows = new Map();
    for (const rm of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      for (const cm of rm[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attr = cm[1];
        const inner = cm[2];
        if (inner == null) continue;
        const ref = cellRef(attr.match(/\br="([^"]+)"/)[1]);
        const type = attr.match(/\bt="([^"]+)"/)?.[1];
        let value = null;
        if (type === 'inlineStr') value = decodeXml([...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(''));
        else {
          const v = inner.match(/<v>([\s\S]*?)<\/v>/)?.[1];
          if (v != null) value = type === 's' ? shared[Number(v)] : decodeXml(v);
        }
        if (value == null || value === '') continue;
        if (!rows.has(ref.row)) rows.set(ref.row, new Map());
        rows.get(ref.row).set(ref.col, value);
      }
    }
    sheets.push({ name, state, rows });
  }
  return sheets;
}
