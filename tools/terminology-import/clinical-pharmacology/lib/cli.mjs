// Utilidades de línea de comando y de caché compartidas por los scripts de la
// farmacología clínica. Nada de contenido clínico.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
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
