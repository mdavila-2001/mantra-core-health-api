// =============================================================================
// Equipos de diagnóstico · ROW · escritura de `out/<source>[-NNNN].ndjson.gz`.
//
// Cada bloque de ~4 MB de NDJSON se comprime como un miembro gzip y se agrega
// al archivo (gzip multi-miembro: `zcat`, `gunzip` y `zlib` lo leen como un solo
// flujo). Un archivo nunca pasa de `MAX_PART_BYTES` y nunca corta una línea.
// La salida es determinista (gzip de Node no escribe fecha), así que una misma
// entrada da el mismo sha256.
// =============================================================================

import {
  appendFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

import { assertRow, ensureDir, sha256File } from './row.mjs';

export const MAX_PART_BYTES = 45 * 1024 * 1024;
const CHUNK_BYTES = 4 * 1024 * 1024;

/** Borra las salidas previas de una fuente para no dejar partes huérfanas. */
export function removeSourceOutputs(outDir, source) {
  const pattern = new RegExp(
    `^${source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(-\\d{4})?\\.ndjson\\.gz$`,
  );
  for (const name of readdirSync(outDir))
    if (pattern.test(name)) rmSync(join(outDir, name));
}

export class PartWriter {
  constructor(outDir, source, sourceVersion) {
    this.outDir = ensureDir(outDir);
    this.source = source;
    this.sourceVersion = sourceVersion;
    this.parts = [];
    this.pending = [];
    this.pendingBytes = 0;
    removeSourceOutputs(this.outDir, source);
    this.openPart();
  }

  openPart() {
    const name = `${this.source}-${String(this.parts.length + 1).padStart(4, '0')}.ndjson.gz`;
    writeFileSync(join(this.outDir, name), '');
    this.parts.push({ name, rows: 0, bytes: 0 });
  }

  add(row) {
    if (row.source !== this.source)
      throw new Error(`fila de ${row.source} en el archivo de ${this.source}`);
    assertRow(row);
    const line = JSON.stringify(row) + '\n';
    this.pending.push(line);
    this.pendingBytes += Buffer.byteLength(line);
    if (this.pendingBytes >= CHUNK_BYTES) this.flush();
  }

  flush() {
    if (this.pending.length === 0) return;
    const member = gzipSync(this.pending.join(''), { level: 9 });
    let part = this.parts[this.parts.length - 1];
    if (part.bytes > 0 && part.bytes + member.length > MAX_PART_BYTES) {
      this.openPart();
      part = this.parts[this.parts.length - 1];
    }
    if (member.length > MAX_PART_BYTES)
      throw new Error(
        `un bloque comprimido de ${this.source} supera el máximo por archivo`,
      );
    appendFileSync(join(this.outDir, part.name), member);
    part.bytes += member.length;
    part.rows += this.pending.length;
    this.pending = [];
    this.pendingBytes = 0;
  }

  /** Cierra y devuelve las entradas del manifiesto. Una sola parte → `<source>.ndjson.gz`. */
  async finish() {
    this.flush();
    if (this.parts.length === 1) {
      const single = `${this.source}.ndjson.gz`;
      renameSync(
        join(this.outDir, this.parts[0].name),
        join(this.outDir, single),
      );
      this.parts[0].name = single;
    }
    const files = [];
    for (const part of this.parts) {
      files.push({
        path: part.name,
        source: this.source,
        sourceVersion: this.sourceVersion,
        rows: part.rows,
        bytes: part.bytes,
        sha256: await sha256File(join(this.outDir, part.name)),
      });
    }
    return files;
  }
}
