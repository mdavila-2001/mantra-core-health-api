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
  'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | 'application/pdf';

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
];

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
