// =============================================================================
// Lector mínimo de .zip con UNA entrada comprimida con deflate (el caso de
// `desc2026.zip` de NLM): devuelve el flujo descomprimido sin depender de
// `unzip` ni de librerías. No soporta ZIP64 ni cifrado: si aparecen, falla.
// =============================================================================

import { closeSync, createReadStream, fstatSync, openSync, readSync } from 'node:fs';
import { createInflateRaw } from 'node:zlib';

const readAt = (fd, position, length) => {
  const buf = Buffer.alloc(length);
  const n = readSync(fd, buf, 0, length, position);
  return buf.subarray(0, n);
};

/** @returns {{ name: string, method: number, compressedSize: number, size: number, dataStart: number }} */
export function firstZipEntry(path) {
  const fd = openSync(path, 'r');
  try {
    const total = fstatSync(fd).size;
    const tailLen = Math.min(total, 65557);
    const tail = readAt(fd, total - tailLen, tailLen);
    const eocd = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    if (eocd < 0) throw new Error(`${path}: no es un .zip (sin registro de fin de directorio)`);
    const entries = tail.readUInt16LE(eocd + 10);
    const cdOffset = tail.readUInt32LE(eocd + 16);
    if (entries !== 1) throw new Error(`${path}: se esperaba 1 entrada y trae ${entries}`);
    if (cdOffset === 0xffffffff) throw new Error(`${path}: ZIP64 no soportado`);
    const cd = readAt(fd, cdOffset, 46);
    if (cd.readUInt32LE(0) !== 0x02014b50) throw new Error(`${path}: directorio central ilegible`);
    const flags = cd.readUInt16LE(8);
    if (flags & 1) throw new Error(`${path}: entrada cifrada`);
    const method = cd.readUInt16LE(10);
    const compressedSize = cd.readUInt32LE(20);
    const size = cd.readUInt32LE(24);
    const nameLen = cd.readUInt16LE(28);
    const localOffset = cd.readUInt32LE(42);
    const name = readAt(fd, cdOffset + 46, nameLen).toString('utf8');
    const local = readAt(fd, localOffset, 30);
    if (local.readUInt32LE(0) !== 0x04034b50) throw new Error(`${path}: cabecera local ilegible`);
    const dataStart = localOffset + 30 + local.readUInt16LE(26) + local.readUInt16LE(28);
    return { name, method, compressedSize, size, dataStart };
  } finally {
    closeSync(fd);
  }
}

/** Flujo de bytes descomprimidos de la única entrada del zip. */
export function zipEntryStream(path) {
  const e = firstZipEntry(path);
  const raw = createReadStream(path, { start: e.dataStart, end: e.dataStart + e.compressedSize - 1 });
  if (e.method === 0) return { entry: e, stream: raw };
  if (e.method !== 8) throw new Error(`${path}: método de compresión ${e.method} no soportado`);
  return { entry: e, stream: raw.pipe(createInflateRaw()) };
}
