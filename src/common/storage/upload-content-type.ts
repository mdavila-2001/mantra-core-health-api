/**
 * Reconocimiento del tipo real de un archivo subido, por su contenido.
 *
 * El `Content-Type` de un multipart lo escribe el cliente: es una declaración,
 * no una prueba. Aceptarlo tal cual significaba persistir `mimeType` arbitrario
 * en `common.file_versions` y devolverlo después como cabecera `Content-Type` al
 * servir el archivo, de modo que un `.html` subido como imagen se servía como
 * HTML. Aquí el tipo se deduce de los primeros bytes, que es lo único que el
 * cliente no puede falsear sin cambiar también el contenido.
 *
 * El objetivo es acotar lo que entra al almacenamiento, no reimplementar una
 * librería de detección: sólo se reconocen los formatos que el producto acepta.
 * Lo que no se reconoce se rechaza, en vez de guardarse con un tipo genérico.
 */

/** Tipos MIME que esta capa sabe reconocer por firma binaria. */
export type SniffedMimeType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/gif'
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'text/plain';

/** Firma binaria que identifica un formato. */
interface ContentSignature {
  /** Tipo que se atribuye al contenido cuando la firma coincide. */
  mimeType: SniffedMimeType;
  /** Bytes iniciales que identifican el formato. */
  magic: readonly number[];
  /**
   * Comprobación adicional para firmas no concluyentes por sí solas: `RIFF`
   * encabeza también audio y vídeo, así que WEBP exige además su marca de
   * formato en el byte 8.
   */
  confirm?: (buffer: Buffer) => boolean;
}

/**
 * Los `.docx`/`.xlsx` son contenedores ZIP: la firma sola sólo dice "es un
 * ZIP", no cuál Office. Se confirma buscando el archivo interno que cada
 * formato siempre incluye (`word/document.xml`, `xl/workbook.xml`) — entrar
 * a descomprimir de verdad sería reimplementar una librería de ZIP para un
 * chequeo de pertenencia.
 */
const hasZipMember = (buffer: Buffer, member: string): boolean =>
  buffer.toString('latin1').includes(member);

const SIGNATURES: readonly ContentSignature[] = [
  { mimeType: 'image/jpeg', magic: [0xff, 0xd8, 0xff] },
  {
    mimeType: 'image/png',
    magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  { mimeType: 'image/gif', magic: [0x47, 0x49, 0x46, 0x38] },
  { mimeType: 'application/pdf', magic: [0x25, 0x50, 0x44, 0x46, 0x2d] },
  {
    mimeType: 'image/webp',
    magic: [0x52, 0x49, 0x46, 0x46],
    confirm: (buffer) => buffer.subarray(8, 12).toString('ascii') === 'WEBP',
  },
  {
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    magic: [0x50, 0x4b, 0x03, 0x04],
    confirm: (buffer) => hasZipMember(buffer, 'word/document.xml'),
  },
  {
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    magic: [0x50, 0x4b, 0x03, 0x04],
    confirm: (buffer) => hasZipMember(buffer, 'xl/workbook.xml'),
  },
];

/**
 * Heurística para texto plano y CSV: no tienen firma binaria, así que se
 * aceptan cuando el contenido no trae bytes de control propios de un
 * binario. El tipo detectado es siempre `text/plain` — nunca se atribuye
 * `text/html`, así que aunque el contenido tenga forma de HTML se sirve
 * después con un `Content-Type` que el navegador no ejecuta.
 */
function looksLikePlainText(buffer: Buffer): boolean {
  if (buffer.byteLength === 0) return false;
  let index = 0;
  while (index < buffer.byteLength) {
    const byte = buffer[index];
    const isTabOrLineBreak = byte === 0x09 || byte === 0x0a || byte === 0x0d;
    const isPrintableAscii = byte >= 0x20 && byte <= 0x7e;
    if (isTabOrLineBreak || isPrintableAscii) {
      index += 1;
      continue;
    }
    // Bytes de encabezado de una secuencia UTF-8 multi-byte (2, 3 o 4 bytes).
    const continuationBytes =
      (byte & 0xe0) === 0xc0
        ? 1
        : (byte & 0xf0) === 0xe0
          ? 2
          : (byte & 0xf8) === 0xf0
            ? 3
            : -1;
    if (continuationBytes === -1) return false;
    for (let offset = 1; offset <= continuationBytes; offset += 1) {
      const continuation = buffer[index + offset];
      if (continuation === undefined || (continuation & 0xc0) !== 0x80) {
        return false;
      }
    }
    index += continuationBytes + 1;
  }
  return true;
}

/**
 * Tipos aceptados por categoría funcional del archivo.
 *
 * `DOCUMENT` admite los formatos de imagen porque un documento fotografiado
 * (una cédula, una receta en papel) llega como JPEG o PNG, no como PDF. La
 * inversa no vale: una imagen no puede ser un PDF.
 */
export const UPLOAD_MIME_ALLOWLIST: Readonly<
  Record<'DOCUMENT' | 'IMAGE', readonly SniffedMimeType[]>
> = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  DOCUMENT: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ],
};

/**
 * Deduce el tipo MIME real a partir de los primeros bytes del contenido.
 *
 * @param buffer - Contenido efectivamente recibido.
 * @returns El tipo reconocido, o `undefined` si ninguna firma conocida coincide.
 */
export function sniffMimeType(buffer: Buffer): SniffedMimeType | undefined {
  for (const signature of SIGNATURES) {
    if (buffer.byteLength < signature.magic.length) continue;
    const matches = signature.magic.every(
      (byte, index) => buffer[index] === byte,
    );
    if (!matches) continue;
    if (signature.confirm && !signature.confirm(buffer)) continue;
    return signature.mimeType;
  }
  if (looksLikePlainText(buffer)) return 'text/plain';
  return undefined;
}

/**
 * Comprueba si un tipo reconocido está permitido para una categoría.
 *
 * @param category - Categoría funcional declarada para el archivo.
 * @param mimeType - Tipo deducido del contenido.
 * @returns `true` si la categoría admite ese tipo.
 */
export function isMimeTypeAllowedForCategory(
  category: 'DOCUMENT' | 'IMAGE',
  mimeType: SniffedMimeType,
): boolean {
  return UPLOAD_MIME_ALLOWLIST[category].includes(mimeType);
}
