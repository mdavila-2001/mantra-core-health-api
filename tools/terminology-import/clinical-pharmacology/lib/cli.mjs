// Utilidades de línea de comando y de caché compartidas por los scripts de la
// farmacología clínica. Nada de contenido clínico.

import { closeSync, existsSync, openSync, readFileSync, readSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export function parseArgs(argv = process.argv.slice(2)) {
  const opt = (name, def) => {
    const i = argv.indexOf(name);
    return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : def;
  };
  return { opt, has: (name) => argv.includes(name) };
}

export const readJsonIfExists = (path) => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined);

/**
 * Fecha de consulta de un archivo de caché = la de su descarga (mtime). Los
 * fetchers escriben cada respuesta una sola vez, así que el mtime ES el momento
 * en que la fuente la entregó.
 */
export const retrievedAtOf = (path) => statSync(path).mtime.toISOString();

export const listJson = (dir) => (existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith('.json')).sort() : []);

export const joinPath = join;

/**
 * Líneas no vacías de un NDJSON, leídas por bloques: sirve para archivos de más de 512 MB, que no
 * caben en un solo string de V8 (`readNdjson` del glosario falla con ERR_STRING_TOO_LONG).
 */
export function* ndjsonLines(path, chunkBytes = 16 * 1024 * 1024) {
  const fd = openSync(path, 'r');
  const buf = Buffer.alloc(chunkBytes);
  let rest = Buffer.alloc(0);
  try {
    for (let n = readSync(fd, buf); n > 0; n = readSync(fd, buf)) {
      const data = Buffer.concat([rest, buf.subarray(0, n)]);
      let start = 0;
      for (let i = data.indexOf(10); i >= 0; i = data.indexOf(10, start)) {
        const line = data.toString('utf8', start, i);
        if (line.trim() !== '') yield line;
        start = i + 1;
      }
      rest = Buffer.from(data.subarray(start));
    }
    const last = rest.toString('utf8');
    if (last.trim() !== '') yield last;
  } finally {
    closeSync(fd);
  }
}

/** NDJSON → arreglo de objetos, sin pasar por un string único (ver `ndjsonLines`). */
export const readNdjsonLarge = (path) => Array.from(ndjsonLines(path), (l) => JSON.parse(l));
