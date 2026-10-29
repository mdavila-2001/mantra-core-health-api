/**
 * Dimensiones de una imagen raster (PNG, JPEG, WebP) leídas de su cabecera.
 *
 * El fondo de un lienzo valida tamaño **y dimensiones** (CONTRATO-PLANO §1.6)
 * sin decodificar píxeles ni sumar una dependencia: alcanza con la cabecera. Un
 * archivo que no es de esos tres formatos (SVG incluido) devuelve `null`: la
 * decisión de aceptarlo o no es del tipo real (magic bytes), no de esta función.
 */

/** Ancho y alto en píxeles. */
export interface ImageSize {
  readonly width: number;
  readonly height: number;
}

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function pngSize(buffer: Buffer): ImageSize | null {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE))
    return null;
  if (buffer.subarray(12, 16).toString('latin1') !== 'IHDR') return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function jpegSize(buffer: Buffer): ImageSize | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8)
    return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xff) {
      offset += 1;
      continue;
    }
    if (
      marker === 0xd8 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      offset += 2;
      continue;
    }
    const length = buffer.readUInt16BE(offset + 2);
    const isFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isFrame) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    if (length < 2) return null;
    offset += 2 + length;
  }
  return null;
}

function webpSize(buffer: Buffer): ImageSize | null {
  if (
    buffer.length < 30 ||
    buffer.subarray(0, 4).toString('latin1') !== 'RIFF' ||
    buffer.subarray(8, 12).toString('latin1') !== 'WEBP'
  )
    return null;
  const chunk = buffer.subarray(12, 16).toString('latin1');
  if (chunk === 'VP8 ') {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  if (chunk === 'VP8L') {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8X') {
    return {
      width: buffer.readUIntLE(24, 3) + 1,
      height: buffer.readUIntLE(27, 3) + 1,
    };
  }
  return null;
}

/**
 * Lee las dimensiones de una imagen PNG, JPEG o WebP.
 *
 * @param buffer - Contenido del archivo.
 * @param mimeType - Tipo real deducido de los magic bytes.
 * @returns Ancho y alto, o `null` si la cabecera no es la esperada para ese tipo.
 */
export function readImageSize(
  buffer: Buffer,
  mimeType: string,
): ImageSize | null {
  const size =
    mimeType === 'image/png'
      ? pngSize(buffer)
      : mimeType === 'image/jpeg'
        ? jpegSize(buffer)
        : mimeType === 'image/webp'
          ? webpSize(buffer)
          : null;
  if (!size || size.width <= 0 || size.height <= 0) return null;
  return size;
}
