/**
 * Correspondencias formato ↔ extensión ↔ mime, compartidas por el
 * almacenamiento y el cliente del proveedor.
 *
 * El formato lo declara la configuración con la nomenclatura del proveedor
 * (`mp3_44100_128`), así que el prefijo es lo único estable en el que apoyarse.
 */
const FORMATS = [
  {
    prefix: 'mp3',
    extension: 'mp3',
    mimeType: 'audio/mpeg',
    accept: 'audio/mpeg',
  },
  {
    prefix: 'wav',
    extension: 'wav',
    mimeType: 'audio/wav',
    accept: 'audio/wav',
  },
  {
    prefix: 'pcm',
    extension: 'pcm',
    mimeType: 'audio/L16',
    accept: 'audio/basic',
  },
  {
    prefix: 'ulaw',
    extension: 'ulaw',
    mimeType: 'audio/basic',
    accept: 'audio/basic',
  },
  {
    prefix: 'opus',
    extension: 'opus',
    mimeType: 'audio/opus',
    accept: 'audio/opus',
  },
] as const;

function match(format: string): (typeof FORMATS)[number] | undefined {
  return FORMATS.find((entry) => format.startsWith(entry.prefix));
}

export function extensionFor(format: string): string {
  return match(format)?.extension ?? 'bin';
}

export function mimeTypeFor(format: string): string {
  return match(format)?.mimeType ?? 'application/octet-stream';
}

export function acceptFor(format: string): string {
  return match(format)?.accept ?? 'application/octet-stream';
}

/**
 * Comprueba que el cuerpo recibido es realmente audio del formato pedido.
 *
 * No es paranoia: un proveedor puede responder `200` con una página de error o un
 * JSON, y sin esta comprobación esos bytes quedarían cacheados **para siempre**
 * como si fueran el audio de esa plantilla. Un asset `READY` no se vuelve a
 * generar nunca, así que el único momento de detectarlo es este.
 */
export function looksLikeAudio(buffer: Buffer, format: string): boolean {
  if (buffer.length < 4) return false;
  const head = buffer.subarray(0, 4);

  if (format.startsWith('mp3')) {
    // Un MP3 empieza por una etiqueta ID3 o por la cabecera de trama (11 bits a 1).
    const isId3 = head.toString('latin1', 0, 3) === 'ID3';
    const isFrame = head[0] === 0xff && ((head[1] ?? 0) & 0xe0) === 0xe0;
    return isId3 || isFrame;
  }
  if (format.startsWith('wav')) return head.toString('latin1') === 'RIFF';
  if (format.startsWith('opus')) return head.toString('latin1') === 'OggS';

  // `pcm` y `ulaw` son flujos crudos sin cabecera: no hay firma que comprobar, así
  // que solo puede exigirse que no sea texto estructurado (HTML o JSON de error).
  const text = head.toString('latin1').trimStart().toLowerCase();
  return !text.startsWith('<') && !text.startsWith('{');
}
