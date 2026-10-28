// Lector mínimo de .zip (sin dependencias): directorio central + entradas «stored» o «deflate».
// No soporta ZIP64 ni cifrado: si aparece uno, lanza. Las entradas se leen enteras en memoria
// (las más grandes de FoodData Central pesan 36 MB descomprimidas).
import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';

const EOCD_SIG = 0x06054b50;
const CEN_SIG = 0x02014b50;
const LOC_SIG = 0x04034b50;

export function listZipBuffer(buf, label = 'zip') {
  let e = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) { e = i; break; }
  }
  if (e < 0) throw new Error(`${label}: no es un .zip (sin registro de fin de directorio)`);
  const count = buf.readUInt16LE(e + 10);
  const cenOffset = buf.readUInt32LE(e + 16);
  if (count === 0xffff || cenOffset === 0xffffffff) throw new Error(`${label}: ZIP64 no soportado`);
  const entries = [];
  let p = cenOffset;
  while (buf.readUInt32LE(p) === CEN_SIG) {
    if (buf.readUInt16LE(p + 8) & 1) throw new Error(`${label}: entrada cifrada no soportada`);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    entries.push({
      name: buf.toString('utf8', p + 46, p + 46 + nameLen),
      method: buf.readUInt16LE(p + 10),
      compressedSize: buf.readUInt32LE(p + 20),
      size: buf.readUInt32LE(p + 24),
      offset: buf.readUInt32LE(p + 42),
    });
    p += 46 + nameLen + extraLen + commentLen;
  }
  if (entries.length !== count) throw new Error(`${label}: directorio central inconsistente (${entries.length} de ${count} entradas)`);
  return entries;
}

export function readEntryBuffer(buf, entry) {
  if (buf.readUInt32LE(entry.offset) !== LOC_SIG) throw new Error(`Encabezado local inválido para ${entry.name}`);
  const start = entry.offset + 30 + buf.readUInt16LE(entry.offset + 26) + buf.readUInt16LE(entry.offset + 28);
  const raw = buf.subarray(start, start + entry.compressedSize);
  let out;
  if (entry.method === 0) out = raw;
  else if (entry.method === 8) out = inflateRawSync(raw);
  else throw new Error(`${entry.name}: método de compresión ${entry.method} no soportado`);
  if (out.length !== entry.size) throw new Error(`${entry.name}: tamaño ${out.length} ≠ ${entry.size} declarado`);
  return out;
}

/** Abre un .zip y devuelve { entries, has, read, text } con coincidencia por nombre base. */
export function openZip(path) {
  const buf = readFileSync(path);
  const entries = listZipBuffer(buf, path);
  const find = (name) => entries.find((x) => x.name === name || x.name.endsWith(`/${name}`));
  const read = (name) => {
    const entry = find(name);
    if (!entry) throw new Error(`${path}: no tiene la entrada «${name}»`);
    return readEntryBuffer(buf, entry);
  };
  return {
    entries,
    has: (name) => Boolean(find(name)),
    read,
    text: (name) => read(name).toString('utf8').replace(/^\uFEFF/, ''),
  };
}
