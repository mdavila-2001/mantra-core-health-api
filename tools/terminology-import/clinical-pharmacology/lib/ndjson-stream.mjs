// Lectura de NDJSON grandes línea por línea, sin cargar el archivo entero.
// Medido el 2026-10-27: las monografías con las secciones de CIMA y de la FDA pasan de
// los 512 MiB que admite una cadena de V8, así que `readNdjson` (readFileSync) no sirve.

import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

/** Itera las filas de un NDJSON. */
export async function* streamNdjson(path) {
  const rl = createInterface({ input: createReadStream(path, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const line of rl) if (line.trim() !== '') yield JSON.parse(line);
}

/** Itera las líneas crudas (para empaquetar sin reparsear). */
export async function* streamLines(path) {
  const rl = createInterface({ input: createReadStream(path, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const line of rl) if (line.trim() !== '') yield line;
}
