/**
 * Cabeceras con las que se sirven los bytes de un archivo subido por usuarios.
 *
 * El `mimeType` de una versión no siempre lo dedujo `sniffMimeType`: los
 * caminos de metadata (`POST /common/files`, `POST /common/files/:id/versions`)
 * lo reciben declarado. Servirlo tal cual podía devolver `text/html` o
 * `image/svg+xml` —documentos activos— desde el origen de la API, y sin
 * `Content-Disposition` el navegador los abre en línea. Esta función es la
 * defensa del lado de la salida, independiente de cómo entró el archivo:
 *
 * - `Content-Type` sólo pasa si es uno de los formatos que el almacenamiento
 *   reconoce por firma; cualquier otro sale como `application/octet-stream`.
 * - `Content-Disposition` siempre presente: `inline` sólo para imágenes
 *   rasterizadas (jpeg, png, webp, gif), que el navegador no ejecuta;
 *   `attachment` para todo lo demás, PDF incluido.
 * - `X-Content-Type-Options: nosniff` explícito, aunque `helmet()` ya lo ponga
 *   global: una ruta con `@Res()` no debería depender de un middleware lejano
 *   para no ser interpretada.
 */
import type { SniffedMimeType } from './upload-content-type';

/** Tipos que se pueden servir con su `Content-Type` real. */
const SERVABLE_MIME_TYPES: ReadonlySet<string> = new Set<SniffedMimeType>([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

/** Imágenes rasterizadas: las únicas que se muestran en línea. */
const INLINE_MIME_TYPES: ReadonlySet<string> = new Set<SniffedMimeType>([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

/** Tipo con el que sale todo lo que no está en la lista cerrada. */
export const OPAQUE_MIME_TYPE = 'application/octet-stream';

/**
 * Calcula las cabeceras seguras para servir un archivo de usuario.
 *
 * @param mimeType - Tipo persistido en la versión, sin confiar en él.
 * @param originalName - Nombre original, si lo hay, para la descarga.
 * @returns Cabeceras listas para `res.setHeader`.
 */
export function servedContentHeaders(
  mimeType: string,
  originalName?: string | null,
): Record<
  'Content-Type' | 'Content-Disposition' | 'X-Content-Type-Options',
  string
> {
  const normalized = mimeType.split(';')[0].trim().toLowerCase();
  const contentType = SERVABLE_MIME_TYPES.has(normalized)
    ? normalized
    : OPAQUE_MIME_TYPE;
  const disposition = INLINE_MIME_TYPES.has(contentType)
    ? 'inline'
    : 'attachment';
  // Codificado (RFC 5987): un nombre con comillas o saltos de línea podría
  // inyectar cabeceras.
  const filename = originalName
    ? `; filename*=UTF-8''${encodeURIComponent(originalName)}`
    : '';
  return {
    'Content-Type': contentType,
    'Content-Disposition': `${disposition}${filename}`,
    'X-Content-Type-Options': 'nosniff',
  };
}
