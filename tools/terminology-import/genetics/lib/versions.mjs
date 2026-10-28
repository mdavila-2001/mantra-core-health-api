// =============================================================================
// Versión que DECLARA cada archivo fuente. Lee sólo la cabecera (los archivos
// van de 1 KB a 17 MB). Si el archivo no declara versión se usa la cabecera
// HTTP `Last-Modified` del servidor, y así se registra (`versionKind`).
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

const isoDay = (lastModified) => {
  const d = new Date(lastModified);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

/** @returns {{ version: string|null, kind: string }} */
export function readDeclaredVersion(source, path, lastModified = null) {
  const text = source.versionFrom === 'last-modified' ? '' : head(path);
  switch (source.versionFrom) {
    case 'obo-data-version': {
      const v = text.match(/^data-version: (.+)$/m)?.[1].trim() ?? null;
      return { version: v, kind: 'declarada por el archivo (data-version)' };
    }
    case 'xsd-version': {
      // <xs:schema ... version="2.6; February 26, 2026" ...>
      const v = text.match(/<xs:schema[^>]*\sversion="([^"]+)"/)?.[1] ?? null;
      return { version: v, kind: 'declarada por el archivo (xs:schema/@version)' };
    }
    case 'clingen-file-created': {
      const v = text.match(/FILE CREATED: (\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
      return { version: v, kind: 'declarada por el archivo (FILE CREATED)' };
    }
    case 'yaml-id': {
      // $id: "https://w3id.org/ga4gh/schema/vrs/2.0.1/vrs-source.yaml"
      const v = text.match(/^\$id:\s*"[^"]*\/vrs\/([^/"]+)\/vrs-source\.yaml"/m)?.[1] ?? null;
      return { version: v, kind: 'declarada por el archivo ($id)' };
    }
    case 'last-modified':
    default:
      return { version: lastModified ? isoDay(lastModified) : null, kind: 'Last-Modified del servidor (el archivo no declara versión)' };
  }
}
