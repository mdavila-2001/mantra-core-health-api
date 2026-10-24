// =============================================================================
// Transporte y formato de archivos: CSV RFC 4180, lectura en streaming de los
// `results` de un JSON de openFDA (pesan cientos de MB: no caben en un
// `JSON.parse`), texto delimitado por `|` de AccessGUDID y escritura del
// NDJSON en `.gz` partidos.
// =============================================================================

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { gzipSync } from 'node:zlib';

export function ensureDir(p) {
  mkdirSync(p, { recursive: true });
  return p;
}

export function sha256File(path) {
  return new Promise((resolve, reject) => {
    const h = createHash('sha256');
    createReadStream(path)
      .on('data', (c) => h.update(c))
      .on('end', () => resolve(h.digest('hex')))
      .on('error', reject);
  });
}

export function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

/** CSV RFC 4180 completo en memoria (comillas, `""`, saltos de línea embebidos). Devuelve objetos por cabecera. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else q = false;
      } else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field.endsWith('\r') ? field.slice(0, -1) : field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  const header = rows.shift() ?? [];
  return rows
    .filter((r) => !(r.length === 1 && r[0] === ''))
    .map((r) => {
      if (r.length !== header.length) throw new Error(`CSV: fila con ${r.length} columnas, cabecera con ${header.length}`);
      return Object.fromEntries(header.map((h, j) => [h, r[j]]));
    });
}

/**
 * Lee en streaming un archivo delimitado por `|` con cabecera (formato
 * AccessGUDID Delimited). `onRow(obj)` por fila.
 */
export async function readPipeDelimited(stream, onRow) {
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  let header = null;
  let n = 0;
  for await (const line of rl) {
    if (!line) continue;
    const cells = line.split('|');
    if (!header) {
      header = cells.map((h) => h.trim());
      continue;
    }
    const obj = {};
    for (let i = 0; i < header.length; i++) obj[header[i]] = cells[i] ?? '';
    await onRow(obj);
    n++;
  }
  return n;
}

/** Stream de stdout de `unzip -p <zip> [entry]` (sin extraer a disco). */
export function unzipStream(zipPath, entry) {
  const args = ['-p', zipPath];
  if (entry) args.push(entry);
  const child = spawn('unzip', args, { stdio: ['ignore', 'pipe', 'inherit'] });
  return child.stdout;
}

/** Lista de entradas de un zip (`unzip -Z1`). */
export function zipEntries(zipPath) {
  return new Promise((resolve, reject) => {
    const child = spawn('unzip', ['-Z1', zipPath], { stdio: ['ignore', 'pipe', 'inherit'] });
    let out = '';
    child.stdout.on('data', (c) => (out += c));
    child.on('close', (code) => (code === 0 ? resolve(out.split('\n').filter(Boolean)) : reject(new Error(`unzip -Z1 ${zipPath}: ${code}`))));
  });
}

/**
 * Recorre en streaming los elementos del arreglo `results` de un JSON de
 * openFDA (`{"meta": {...}, "results": [ {...}, ... ]}`) y entrega cada uno ya
 * parseado. También devuelve `meta`. Tokenizador mínimo: sigue comillas,
 * escapes y profundidad; no interpreta números ni literales fuera de los objetos.
 */
export async function streamOpenFdaResults(stream, onResult) {
  let depth = 0;
  let inStr = false;
  let esc = false;
  let keyBuf = '';
  let lastKey = '';
  let inResults = false;
  let capturing = false;
  let buf = '';
  let metaBuf = '';
  let capturingMeta = false;
  let n = 0;
  for await (const chunk of stream) {
    const s = chunk.toString('utf8');
    let start = capturing || capturingMeta ? 0 : -1;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (inStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
        else if (depth === 1 && !capturing && !capturingMeta) keyBuf += c;
        continue;
      }
      if (c === '"') {
        inStr = true;
        if (depth === 1 && !capturing && !capturingMeta) keyBuf = '';
        continue;
      }
      if (c === ':' && depth === 1) {
        lastKey = keyBuf;
        if (lastKey === 'meta') {
          capturingMeta = true;
          start = i + 1;
        }
        continue;
      }
      if (c === '{' || c === '[') {
        depth++;
        if (depth === 2 && lastKey === 'results' && c === '[') inResults = true;
        else if (depth === 3 && inResults && c === '{') {
          capturing = true;
          start = i;
        }
        continue;
      }
      if (c === '}' || c === ']') {
        depth--;
        if (capturing && depth === 2) {
          buf += s.slice(start, i + 1);
          await onResult(JSON.parse(buf));
          n++;
          buf = '';
          capturing = false;
          start = -1;
        } else if (capturingMeta && depth === 1) {
          metaBuf += s.slice(start, i + 1);
          capturingMeta = false;
          start = -1;
        } else if (inResults && depth === 1) inResults = false;
      }
    }
    if (capturing) buf += s.slice(start);
    else if (capturingMeta) metaBuf += s.slice(start);
  }
  return { count: n, meta: metaBuf.trim() ? JSON.parse(metaBuf) : null };
}

/**
 * Escribe filas NDJSON en partes `<prefix>-0001.ndjson.gz`, … de a lo sumo `maxBytes` de
 * texto sin comprimir por parte (por defecto 200 MB → ~20–30 MB comprimido,
 * holgado bajo los 50 MB pedidos). Determinista: mismo orden de entrada →
 * mismos bytes (gzip sin fecha ni nombre). Borra partes viejas del mismo prefijo.
 */
export function writeNdjsonParts(dir, prefix, rows, { maxBytes = 200 * 1024 * 1024 } = {}) {
  ensureDir(dir);
  const mine = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-\\d{4}\\.ndjson\\.gz$`);
  for (const f of readdirSync(dir)) if (mine.test(f)) rmSync(join(dir, f));
  const parts = [];
  let chunk = [];
  let size = 0;
  const flush = () => {
    if (!chunk.length) return;
    const name = `${prefix}-${String(parts.length + 1).padStart(4, '0')}.ndjson.gz`;
    const gz = gzipSync(Buffer.from(chunk.join(''), 'utf8'), { level: 9 });
    writeFileSync(join(dir, name), gz);
    parts.push({ file: name, rows: chunk.length, bytes: gz.length, sha256: sha256(gz) });
    chunk = [];
    size = 0;
  };
  for (const r of rows) {
    const line = `${JSON.stringify(r)}\n`;
    const b = Buffer.byteLength(line);
    if (size + b > maxBytes) flush();
    chunk.push(line);
    size += b;
  }
  flush();
  return parts;
}

export function readJsonIfExists(path, fallback) {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback;
}

/**
 * Recorre en streaming los elementos `<name …>…</name>` de un XML (no
 * anidados entre sí, como `<device>` en el Full Release XML de GUDID) y
 * entrega el texto de cada uno.
 */
export async function streamXmlElements(stream, name, onElement) {
  const open = `<${name}`;
  const close = `</${name}>`;
  let buf = '';
  let n = 0;
  for await (const chunk of stream) {
    buf += chunk.toString('utf8');
    for (;;) {
      const i = buf.indexOf(open);
      if (i < 0) {
        buf = buf.slice(-open.length);
        break;
      }
      const after = buf[i + open.length];
      if (after !== ' ' && after !== '>' && after !== '\n' && after !== '\t' && after !== '\r' && after !== undefined) {
        buf = buf.slice(i + open.length);
        continue;
      }
      const j = buf.indexOf(close, i);
      if (j < 0) {
        buf = buf.slice(i);
        break;
      }
      await onElement(buf.slice(i, j + close.length));
      n++;
      buf = buf.slice(j + close.length);
    }
  }
  return n;
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

export function xmlText(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e) =>
    e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENTITIES[e.toLowerCase()],
  );
}

/** Texto del primer `<tag>` (o `null` si falta o es `xsi:nil`). */
export function xmlTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?(?:/>|>([\\s\\S]*?)</${tag}>)`));
  if (!m || m[1] === undefined) return null;
  return xmlText(m[1]);
}

/** Todos los bloques `<tag>…</tag>`. */
export function xmlBlocks(xml, tag) {
  return [...xml.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'g'))].map((m) => m[1]);
}
