// =============================================================================
// Versión que DECLARA cada archivo fuente (no la de la URL «latest»). Lee sólo
// la cabecera: los archivos van de 200 KB a 280 MB.
// =============================================================================

import { closeSync, openSync, readSync } from 'node:fs';

function head(path, bytes = 65536) {
  const fd = openSync(path, 'r');
  try {
    const buf = Buffer.alloc(bytes);
    const n = readSync(fd, buf, 0, bytes, 0);
    return buf.subarray(0, n).toString('utf8');
  } finally {
    closeSync(fd);
  }
}

/** @returns {string|null} */
export function readDeclaredVersion(source, path) {
  const text = head(path);
  switch (source.versionFrom) {
    case 'obo-data-version':
      return text.match(/^data-version: (.+)$/m)?.[1].trim() ?? null;
    case 'obographs-versionInfo':
      return text.match(/"http:\/\/www\.w3\.org\/2002\/07\/owl#versionInfo",\s*"val"\s*:\s*"([^"]+)"/)?.[1] ?? text.match(/releases\/(\d{4}-\d{2}-\d{2})\/hp\.json/)?.[1] ?? null;
    case 'hpoa-header':
      return text.match(/^#version: (.+)$/m)?.[1].trim() ?? null;
    case 'owl-versionIRI':
      return text.match(/owl:versionIRI rdf:resource="[^"]*releases\/([^/"]+)\//)?.[1] ?? null;
    default:
      return null;
  }
}
