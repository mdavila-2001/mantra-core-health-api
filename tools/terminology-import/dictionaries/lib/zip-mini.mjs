// =============================================================================
// Lector mínimo de .zip (sin dependencias): directorio central + entradas
// «stored» o «deflate». Hace falta para dos fuentes que se publican comprimidas
// (el .xlsx del EMDN y el archivo mensual del NCBI Taxonomy, `taxdmp_*.zip`,
// cuyo `names.dmp` pesa 316 MB descomprimido y por eso se lee en streaming).
// No soporta ZIP64 ni cifrado: si aparece uno, lanza.
// =============================================================================

import { closeSync, createReadStream, fstatSync, openSync, readSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { createInflateRaw, inflateRawSync } from 'node:zlib';

const EOCD_SIG = 0x06054b50;
const CEN_SIG = 0x02014b50;
const LOC_SIG = 0x04034b50;

function readAt(fd, position, length) {
  const buf = Buffer.alloc(length);
  let got = 0;
  while (got < length) {
    const n = readSync(fd, buf, got, length - got, position + got);
    if (n === 0) break;
    got += n;
  }
  return buf.subarray(0, got);
}

/** Directorio central de un .zip: [{ name, method, compressedSize, size, offset }]. */
export function listZip(path) {
  const fd = openSync(path, 'r');
  try {
    const size = fstatSync(fd).size;
    const tail = readAt(fd, Math.max(0, size - 65557), Math.min(size, 65557));
    let e = -1;
    for (let i = tail.length - 22; i >= 0; i--) {
      if (tail.readUInt32LE(i) === EOCD_SIG) { e = i; break; }
    }
    if (e < 0) throw new Error(`${path}: no es un .zip (sin registro de fin de directorio)`);
    const count = tail.readUInt16LE(e + 10);
    const cenSize = tail.readUInt32LE(e + 12);
    const cenOffset = tail.readUInt32LE(e + 16);
    if (count === 0xffff || cenOffset === 0xffffffff) throw new Error(`${path}: ZIP64 no soportado`);
    const cen = readAt(fd, cenOffset, cenSize);
    const entries = [];
    let p = 0;
    while (p < cen.length && cen.readUInt32LE(p) === CEN_SIG) {
      const flags = cen.readUInt16LE(p + 8);
      if (flags & 1) throw new Error(`${path}: entrada cifrada no soportada`);
      const nameLen = cen.readUInt16LE(p + 28);
      const extraLen = cen.readUInt16LE(p + 30);
      const commentLen = cen.readUInt16LE(p + 32);
      entries.push({
        name: cen.toString('utf8', p + 46, p + 46 + nameLen),
        method: cen.readUInt16LE(p + 10),
        compressedSize: cen.readUInt32LE(p + 20),
        size: cen.readUInt32LE(p + 24),
        offset: cen.readUInt32LE(p + 42),
      });
      p += 46 + nameLen + extraLen + commentLen;
    }
    if (entries.length !== count) throw new Error(`${path}: directorio central inconsistente (${entries.length} de ${count} entradas)`);
    return entries;
  } finally {
    closeSync(fd);
  }
}

/** Posición de los datos de una entrada (salta el encabezado local, de largo variable). */
function dataStart(fd, entry) {
  const h = readAt(fd, entry.offset, 30);
  if (h.readUInt32LE(0) !== LOC_SIG) throw new Error(`Encabezado local inválido para ${entry.name}`);
  return entry.offset + 30 + h.readUInt16LE(26) + h.readUInt16LE(28);
}

function findEntry(path, name) {
  const entry = listZip(path).find((x) => x.name === name);
  if (!entry) throw new Error(`${path}: no tiene la entrada «${name}»`);
  return entry;
}

/** Contenido completo de una entrada (para entradas chicas: XML de una planilla). */
export function readZipEntry(path, name) {
  const entry = findEntry(path, name);
  const fd = openSync(path, 'r');
  try {
    const raw = readAt(fd, dataStart(fd, entry), entry.compressedSize);
    if (entry.method === 0) return raw;
    if (entry.method === 8) return inflateRawSync(raw);
    throw new Error(`${path}:${name}: método de compresión ${entry.method} no soportado`);
  } finally {
    closeSync(fd);
  }
}

/** Líneas de una entrada, en streaming (memoria constante aunque pese cientos de MB). */
export async function* zipEntryLines(path, name) {
  const entry = findEntry(path, name);
  const fd = openSync(path, 'r');
  let start;
  try {
    start = dataStart(fd, entry);
  } finally {
    closeSync(fd);
  }
  let input = createReadStream(path, { start, end: start + entry.compressedSize - 1 });
  if (entry.method === 8) input = input.pipe(createInflateRaw());
  else if (entry.method !== 0) throw new Error(`${path}:${name}: método de compresión ${entry.method} no soportado`);
  const rl = createInterface({ input, crlfDelay: Infinity });
  for await (const line of rl) yield line;
}
