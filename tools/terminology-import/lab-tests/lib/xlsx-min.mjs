// =============================================================================
// Lector mínimo de .xlsx (ZIP + SpreadsheetML) para las planillas que publican
// las fuentes abiertas (RSNA RadLex Playbook, y las que vengan). Sin dependencias:
// sólo `node:zlib`. Lee celdas de texto compartido, número y texto en línea.
//
// No evalúa fórmulas, no interpreta fechas ni estilos: devuelve lo que la celda
// guarda (el texto o el número tal como está escrito en el XML).
// =============================================================================

import { inflateRawSync } from 'node:zlib';

import { decodeEntities } from '../../lib/glossary-es/common.mjs';

/** Entradas del ZIP por nombre → Buffer descomprimido. Sólo métodos 0 (stored) y 8 (deflate). */
export function unzip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('No es un ZIP (falta el registro de fin de directorio central)');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = new Map();
  for (let n = 0; n < count; n += 1) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Directorio central del ZIP dañado');
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extraLen + commentLen;
    if (buf.readUInt32LE(localOffset) !== 0x04034b50) throw new Error(`Cabecera local dañada para ${name}`);
    const start = localOffset + 30 + buf.readUInt16LE(localOffset + 26) + buf.readUInt16LE(localOffset + 28);
    const raw = buf.subarray(start, start + compSize);
    if (method === 0) out.set(name, Buffer.from(raw));
    else if (method === 8) out.set(name, inflateRawSync(raw));
    else throw new Error(`Método de compresión ${method} no soportado (${name})`);
  }
  return out;
}

const colIndex = (letters) => [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;

/**
 * @returns {{ name: string, rows: string[][] }[]} una entrada por hoja, en el orden del libro.
 * Las celdas vacías o ausentes se devuelven como ''.
 */
export function readXlsx(buf) {
  const files = unzip(buf);
  const get = (n) => {
    const f = files.get(n);
    if (!f) throw new Error(`El .xlsx no trae ${n}`);
    return f.toString('utf8');
  };
  const shared = files.has('xl/sharedStrings.xml')
    ? [...get('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => decodeEntities([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')))
    : [];
  const wb = get('xl/workbook.xml');
  const rels = get('xl/_rels/workbook.xml.rels');
  const target = new Map([...rels.matchAll(/<Relationship\b[^>]*>/g)].map((m) => [m[0].match(/\bId="([^"]+)"/)?.[1], m[0].match(/\bTarget="([^"]+)"/)?.[1]]));
  const sheets = [];
  for (const m of wb.matchAll(/<sheet\b[^>]*>/g)) {
    const name = decodeEntities(m[0].match(/\bname="([^"]*)"/)[1]);
    const rid = m[0].match(/\br:id="([^"]+)"/)?.[1];
    const t = target.get(rid);
    if (!t) throw new Error(`Hoja ${name}: relación ${rid} no encontrada`);
    const xml = get(t.startsWith('/') ? t.slice(1) : `xl/${t}`);
    const rows = [];
    for (const r of xml.matchAll(/<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
      const row = [];
      for (const c of (r[1] ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ref = c[1].match(/\br="([A-Z]+)\d+"/)?.[1];
        if (!ref) continue;
        const type = c[1].match(/\bt="([^"]+)"/)?.[1];
        const inner = c[2] ?? '';
        let value = '';
        if (type === 's') value = shared[Number(inner.match(/<v>([\s\S]*?)<\/v>/)?.[1])] ?? '';
        else if (type === 'inlineStr') value = decodeEntities([...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(''));
        else value = decodeEntities(inner.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? '');
        row[colIndex(ref)] = value;
      }
      for (let i = 0; i < row.length; i += 1) row[i] ??= '';
      rows.push(row);
    }
    sheets.push({ name, rows });
  }
  return sheets;
}
